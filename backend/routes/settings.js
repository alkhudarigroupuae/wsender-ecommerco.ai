const express = require("express");

const { requireAuth } = require("../middleware/requireAuth");
const { getAppConfig } = require("../services/config");
const { getProviderAvailability, getEffectiveUserSettings, isAllowedProvider } = require("../services/userSettings");
const { getUserSettings, upsertUserSettings } = require("../db/userSettings");

const router = express.Router();

function toIntOrNull(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function clamp(n, min, max) {
  if (n == null) return null;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

router.get("/", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const cfg = getAppConfig();
  const saved = await getUserSettings(userId);
  const effective = await getEffectiveUserSettings(userId);

  res.json({
    defaults: {
      aiProvider: String(process.env.AI_PROVIDER || "openai").toLowerCase(),
      maxMessagesPerHour: cfg.maxMessagesPerHour,
      maxMessagesPerMinute: cfg.maxMessagesPerMinute,
      minDelaySeconds: cfg.minDelaySeconds,
      maxDelaySeconds: cfg.maxDelaySeconds,
    },
    saved: saved
      ? {
          aiProvider: saved.aiProvider,
          maxMessagesPerHour: saved.maxMessagesPerHour,
          maxMessagesPerMinute: saved.maxMessagesPerMinute,
          minDelaySeconds: saved.minDelaySeconds,
          maxDelaySeconds: saved.maxDelaySeconds,
        }
      : null,
    effective,
    providersAvailable: getProviderAvailability(),
  });
});

router.post("/", requireAuth, async (req, res) => {
  const userId = req.user.id;

  const aiProviderRaw = req.body?.aiProvider;
  const aiProvider = aiProviderRaw == null || aiProviderRaw === "" ? null : String(aiProviderRaw).toLowerCase();
  if (aiProvider && !isAllowedProvider(aiProvider)) {
    return res.status(400).json({ error: "Invalid aiProvider" });
  }

  const maxMessagesPerHour = clamp(toIntOrNull(req.body?.maxMessagesPerHour), 1, 5000);
  const maxMessagesPerMinute = clamp(toIntOrNull(req.body?.maxMessagesPerMinute), 1, 500);
  const minDelaySeconds = clamp(toIntOrNull(req.body?.minDelaySeconds), 0, 600);
  const maxDelaySeconds = clamp(toIntOrNull(req.body?.maxDelaySeconds), 0, 600);

  if (minDelaySeconds != null && maxDelaySeconds != null && minDelaySeconds > maxDelaySeconds) {
    return res.status(400).json({ error: "minDelaySeconds must be <= maxDelaySeconds" });
  }

  await upsertUserSettings({
    userId,
    aiProvider,
    maxMessagesPerHour,
    maxMessagesPerMinute,
    minDelaySeconds,
    maxDelaySeconds,
  });

  const effective = await getEffectiveUserSettings(userId);
  res.json({ ok: true, effective });
});

module.exports = router;

