const { getOrCreateRateLimitRow, incrementSent, resetWindow } = require("../db/rateLimits");
const { getAppConfig } = require("./config");
const { getEffectiveUserSettings } = require("./userSettings");

const KEY = "whatsapp_sender";

function buildKey(ownerUserId) {
  return `${KEY}:${ownerUserId}`;
}

async function getWaitMsForWindow({ key, now, windowMs, maxCount }) {
  const row = await getOrCreateRateLimitRow({ key, now });
  const windowStart = new Date(row.windowStart);
  const elapsed = now.getTime() - windowStart.getTime();

  if (elapsed >= windowMs) {
    await resetWindow({ key, now, sentCount: 0 });
    return 0;
  }

  if (maxCount > 0 && row.sentCount >= maxCount) {
    return windowStart.getTime() + windowMs - now.getTime();
  }

  return 0;
}

async function getWaitMs(ownerUserId, now) {
  const cfg = getAppConfig();
  const eff = await getEffectiveUserSettings(ownerUserId);
  const base = buildKey(ownerUserId);

  const minuteMax = eff.maxMessagesPerMinute || cfg.maxMessagesPerMinute || 0;
  if (minuteMax > 0) {
    const waitMinute = await getWaitMsForWindow({ key: `${base}:m`, now, windowMs: 60 * 1000, maxCount: minuteMax });
    if (waitMinute > 0) return waitMinute;
  }

  const hourMax = eff.maxMessagesPerHour || cfg.maxMessagesPerHour;
  return getWaitMsForWindow({ key: `${base}:h`, now, windowMs: 60 * 60 * 1000, maxCount: hourMax });
}

async function increment(ownerUserId, now) {
  const base = buildKey(ownerUserId);
  const keys = [`${base}:h`, `${base}:m`];
  for (const key of keys) {
    const row = await getOrCreateRateLimitRow({ key, now });
    const windowStart = new Date(row.windowStart);
    const windowMs = key.endsWith(":m") ? 60 * 1000 : 60 * 60 * 1000;
    const elapsed = now.getTime() - windowStart.getTime();
    if (elapsed >= windowMs) {
      await resetWindow({ key, now, sentCount: 1 });
    } else {
      await incrementSent({ key });
    }
  }
}

module.exports = { getWaitMs, increment };
