const path = require("path");
const express = require("express");
const multer = require("multer");

const { generatePersonalizedMessage } = require("../ai/messageGenerator");
const { promisePool } = require("../utils/promisePool");
const { requireAuth } = require("../middleware/requireAuth");
const { getRemaining, getMonthlyLimit } = require("../services/usageLimiter");
const { getEffectiveUserSettings } = require("../services/userSettings");
const { listCampaigns, getCampaign, createCampaign, setCampaignStatus } = require("../db/campaigns");
const { listLatestContacts, listContacts } = require("../db/contacts");
const {
  createMessageLog,
  listCampaignLogs,
  countCampaignLogsByStatus,
  getCampaignReportSummary,
  listCampaignReportRows,
} = require("../db/messageLogs");
const { createSendJob } = require("../db/sendJobs");

const router = express.Router();

const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, "..", "uploads");

const upload = multer({
  dest: path.join(uploadsDir, "media"),
  limits: { fileSize: 25 * 1024 * 1024 },
});

function buildCampaignDescription({ campaignIdea, productDescription, promotionDetails }) {
  return [
    String(campaignIdea || "").trim(),
    String(productDescription || "").trim(),
    String(promotionDetails || "").trim(),
  ]
    .filter(Boolean)
    .join(" ");
}

function mediaKindFromMime(mimeType) {
  if (!mimeType) return null;
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  return null;
}

function csvEscape(value) {
  if (value == null) return "";
  const s = String(value);
  if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

router.get("/", requireAuth, async (req, res) => {
  const items = await listCampaigns({ ownerUserId: req.user.id, limit: 100 });
  res.json({ items });
});

router.get("/:id", requireAuth, async (req, res) => {
  const item = await getCampaign({ id: req.params.id, ownerUserId: req.user.id });
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json({ item });
});

router.post("/", requireAuth, upload.single("media"), async (req, res) => {
  const ownerUserId = req.user.id;
  const campaignIdea = String(req.body.campaignIdea || "").trim();
  const productDescription = String(req.body.productDescription || "").trim();
  const promotionDetails = String(req.body.promotionDetails || "").trim();

  if (!campaignIdea || !productDescription || !promotionDetails) {
    return res.status(400).json({ error: "Missing campaign fields" });
  }

  const campaignDescription = buildCampaignDescription({ campaignIdea, productDescription, promotionDetails });

  let media = undefined;
  if (req.file) {
    const kind = mediaKindFromMime(req.file.mimetype);
    if (!kind) return res.status(400).json({ error: "Unsupported media type (image/video/audio/pdf)" });
    media = {
      kind,
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
    };
  }

  const item = await createCampaign({
    ownerUserId,
    campaignIdea,
    productDescription,
    promotionDetails,
    campaignDescription,
    media,
  });

  res.json({ item });
});

router.post("/:id/preview", requireAuth, async (req, res) => {
  const ownerUserId = req.user.id;
  const campaign = await getCampaign({ id: req.params.id, ownerUserId });
  if (!campaign) return res.status(404).json({ error: "Not found" });

  const eff = await getEffectiveUserSettings(ownerUserId);
  const count = Math.min(Number(req.body.count || 5), 10);
  const contacts = await listLatestContacts({ ownerUserId, limit: count });

  const previews = await promisePool(contacts, 3, async (contact) => {
    const message = await generatePersonalizedMessage({
      contact,
      campaignDescription: campaign.campaignDescription,
      aiProvider: eff.aiProvider,
    });
    return { contactId: contact._id, name: contact.name, phone: contact.phone, message };
  });

  res.json({ items: previews });
});

router.post("/:id/start", requireAuth, async (req, res) => {
  const ownerUserId = req.user.id;
  const campaign = await getCampaign({ id: req.params.id, ownerUserId });
  if (!campaign) return res.status(404).json({ error: "Not found" });

  const eff = await getEffectiveUserSettings(ownerUserId);
  const { items: contacts } = await listContacts({ ownerUserId, limit: 5000, offset: 0 });
  if (!contacts.length) return res.status(400).json({ error: "No contacts found" });

  const remaining = await getRemaining(req.user);
  const monthlyLimit = getMonthlyLimit(req.user);
  if (remaining <= 0) {
    return res.status(402).json({
      error: `Monthly limit reached (${monthlyLimit}). Upgrade subscription to send more.`,
      limit: monthlyLimit,
      remaining: 0,
    });
  }

  const contactsToSend = contacts.slice(0, remaining);
  const skipped = Math.max(0, contacts.length - contactsToSend.length);

  await setCampaignStatus({ ownerUserId, id: campaign._id, status: "queued" });

  const now = new Date();

  const created = await promisePool(contactsToSend, 3, async (contact) => {
    const message = await generatePersonalizedMessage({
      contact,
      campaignDescription: campaign.campaignDescription,
      aiProvider: eff.aiProvider,
    });
    const log = await createMessageLog({
      ownerUserId,
      campaignId: campaign._id,
      contactId: contact._id,
      phone: contact.phone,
      message,
      media: campaign.media || null,
      status: "queued",
    });

    await createSendJob({
      ownerUserId,
      campaignId: campaign._id,
      contactId: contact._id,
      logId: log._id,
      phone: contact.phone,
      message,
      mediaPath: campaign.media?.path || null,
      nextRunAt: now,
    });

    return log._id;
  });

  res.json({ ok: true, queued: created.length, skipped, remainingAfter: Math.max(0, remaining - created.length) });
});

router.get("/:id/logs", requireAuth, async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 100), 500);
  const skip = Math.max(Number(req.query.skip || 0), 0);
  const ownerUserId = req.user.id;

  const campaign = await getCampaign({ id: req.params.id, ownerUserId });
  if (!campaign) return res.status(404).json({ error: "Not found" });

  const { items, total } = await listCampaignLogs({ ownerUserId, campaignId: req.params.id, limit, offset: skip });
  res.json({ items, total });
});

router.get("/:id/stats", requireAuth, async (req, res) => {
  const ownerUserId = req.user.id;
  const campaignId = req.params.id;
  const campaign = await getCampaign({ id: campaignId, ownerUserId });
  if (!campaign) return res.status(404).json({ error: "Not found" });

  const stats = await countCampaignLogsByStatus({ ownerUserId, campaignId });
  res.json(stats);
});

router.get("/:id/report", requireAuth, async (req, res) => {
  const ownerUserId = req.user.id;
  const campaignId = req.params.id;
  const campaign = await getCampaign({ id: campaignId, ownerUserId });
  if (!campaign) return res.status(404).json({ error: "Not found" });

  const summary = await getCampaignReportSummary({ ownerUserId, campaignId });
  const delivered = (summary?.sent || 0) + (summary?.failed || 0);
  const successRate = delivered > 0 ? Math.round(((summary?.sent || 0) / delivered) * 1000) / 10 : 0;

  res.json({
    campaign: {
      id: campaign._id,
      status: campaign.status,
      idea: campaign.campaignIdea,
      createdAt: campaign.createdAt,
    },
    summary: {
      total: summary.total || 0,
      uniqueNumbers: summary.uniqueNumbers || 0,
      sent: summary.sent || 0,
      failed: summary.failed || 0,
      retrying: summary.retrying || 0,
      queued: summary.queued || 0,
      successRate,
      firstLogAt: summary.firstLogAt || null,
      lastLogAt: summary.lastLogAt || null,
      lastSentAt: summary.lastSentAt || null,
    },
  });
});

router.get("/:id/report.csv", requireAuth, async (req, res) => {
  const ownerUserId = req.user.id;
  const campaignId = req.params.id;
  const campaign = await getCampaign({ id: campaignId, ownerUserId });
  if (!campaign) return res.status(404).json({ error: "Not found" });

  const rows = await listCampaignReportRows({ ownerUserId, campaignId, limit: 50000 });

  const header = [
    "campaign_id",
    "campaign_idea",
    "phone",
    "contact_name",
    "company",
    "status",
    "attempts",
    "sent_at",
    "error",
    "message",
    "created_at",
    "updated_at",
  ];

  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        campaign._id,
        campaign.campaignIdea,
        r.phone,
        r.contactName,
        r.contactCompany,
        r.status,
        r.attemptCount,
        r.sentAt ? new Date(r.sentAt).toISOString() : "",
        r.error,
        r.message,
        r.createdAt ? new Date(r.createdAt).toISOString() : "",
        r.updatedAt ? new Date(r.updatedAt).toISOString() : "",
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  const filename = `campaign-${campaign._id}-report.csv`;
  res.setHeader("content-type", "text/csv; charset=utf-8");
  res.setHeader("content-disposition", `attachment; filename="${filename}"`);
  res.send(`${lines.join("\n")}\n`);
});

module.exports = router;
