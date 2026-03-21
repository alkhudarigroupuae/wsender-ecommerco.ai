const { getAppConfig } = require("./config");
const { getUserSettings } = require("../db/userSettings");
const { getProvider } = require("../ai/providers");

const cache = new Map();
const TTL_MS = 30 * 1000;

function isAllowedProvider(p) {
  return p === "openai" || p === "gemini" || p === "mock";
}

function clampInt(value, { min, max }) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (i < min) return min;
  if (i > max) return max;
  return i;
}

function buildEffective({ cfg, settings }) {
  const aiProvider = isAllowedProvider(settings?.aiProvider) ? settings.aiProvider : getProvider();

  const maxMessagesPerHour =
    clampInt(settings?.maxMessagesPerHour, { min: 1, max: 5000 }) ?? cfg.maxMessagesPerHour;
  const maxMessagesPerMinute =
    clampInt(settings?.maxMessagesPerMinute, { min: 1, max: 500 }) ?? cfg.maxMessagesPerMinute;

  const minDelaySeconds =
    clampInt(settings?.minDelaySeconds, { min: 0, max: 600 }) ?? cfg.minDelaySeconds;
  const maxDelaySeconds =
    clampInt(settings?.maxDelaySeconds, { min: 0, max: 600 }) ?? cfg.maxDelaySeconds;

  return {
    aiProvider,
    maxMessagesPerHour,
    maxMessagesPerMinute,
    minDelaySeconds,
    maxDelaySeconds,
    maxRetries: cfg.maxRetries,
  };
}

async function getEffectiveUserSettings(userId) {
  const key = String(userId || "");
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.at < TTL_MS) return hit.value;

  const cfg = getAppConfig();
  const settings = await getUserSettings(key);
  const effective = buildEffective({ cfg, settings });
  cache.set(key, { at: now, value: effective });
  return effective;
}

function getProviderAvailability() {
  return {
    openai: Boolean(process.env.OPENAI_API_KEY),
    gemini: Boolean(process.env.GEMINI_API_KEY),
    mock: true,
  };
}

module.exports = { getEffectiveUserSettings, getProviderAvailability, isAllowedProvider };

