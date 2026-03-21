const express = require("express");

const { requireAuth } = require("../middleware/requireAuth");
const { requireAdmin } = require("../middleware/requireAdmin");
const { listUsersAdmin, listContactsAdmin, listCampaignsAdmin, getCampaignAdmin } = require("../db/admin");
const { getCampaignReportSummary, listCampaignReportRows } = require("../db/messageLogs");

const router = express.Router();

function csvEscape(value) {
  if (value == null) return "";
  const s = String(value);
  if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  const items = await listUsersAdmin({ limit: 200 });
  res.json({ items });
});

router.get("/users/:id/contacts", requireAuth, requireAdmin, async (req, res) => {
  const ownerUserId = req.params.id;
  const limit = Math.min(Number(req.query.limit || 100), 500);
  const skip = Math.max(Number(req.query.skip || 0), 0);
  const out = await listContactsAdmin({ ownerUserId, limit, offset: skip });
  res.json(out);
});

router.get("/users/:id/campaigns", requireAuth, requireAdmin, async (req, res) => {
  const ownerUserId = req.params.id;
  const items = await listCampaignsAdmin({ ownerUserId, limit: 200 });
  res.json({ items });
});

router.get("/campaigns/:id/report", requireAuth, requireAdmin, async (req, res) => {
  const campaign = await getCampaignAdmin({ id: req.params.id });
  if (!campaign) return res.status(404).json({ error: "Not found" });

  const summary = await getCampaignReportSummary({ ownerUserId: campaign.ownerUserId, campaignId: campaign._id });
  const delivered = (summary?.sent || 0) + (summary?.failed || 0);
  const successRate = delivered > 0 ? Math.round(((summary?.sent || 0) / delivered) * 1000) / 10 : 0;

  res.json({
    campaign: {
      id: campaign._id,
      ownerUserId: campaign.ownerUserId,
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

router.get("/campaigns/:id/report.csv", requireAuth, requireAdmin, async (req, res) => {
  const campaign = await getCampaignAdmin({ id: req.params.id });
  if (!campaign) return res.status(404).json({ error: "Not found" });

  const rows = await listCampaignReportRows({ ownerUserId: campaign.ownerUserId, campaignId: campaign._id, limit: 50000 });

  const header = [
    "campaign_id",
    "owner_user_id",
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
        campaign.ownerUserId,
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

  const filename = `campaign-${campaign._id}-admin-report.csv`;
  res.setHeader("content-type", "text/csv; charset=utf-8");
  res.setHeader("content-disposition", `attachment; filename="${filename}"`);
  res.send(`${lines.join("\n")}\n`);
});

module.exports = router;

