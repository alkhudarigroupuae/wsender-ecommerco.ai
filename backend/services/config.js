function mustNumber(name) {
  const raw = process.env[name];
  if (raw == null || raw === "") throw new Error(`Missing ${name}`);
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`Invalid ${name}`);
  return n;
}

function mustString(name) {
  const raw = process.env[name];
  if (raw == null || String(raw).trim() === "") throw new Error(`Missing ${name}`);
  return String(raw);
}

function optionalNumber(name, defaultValue) {
  const raw = process.env[name];
  if (raw == null || raw === "") return defaultValue;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`Invalid ${name}`);
  return n;
}

function getAppConfig() {
  const freeMonthlyLimit = mustNumber("FREE_MONTHLY_LIMIT");
  const proMonthlyLimit = mustNumber("PRO_MONTHLY_LIMIT");
  const maxMessagesPerHour = mustNumber("MAX_MESSAGES_PER_HOUR");
  const maxMessagesPerMinute = optionalNumber("MAX_MESSAGES_PER_MINUTE", 0);
  const minDelaySeconds = mustNumber("MIN_DELAY_SECONDS");
  const maxDelaySeconds = mustNumber("MAX_DELAY_SECONDS");
  const maxRetries = mustNumber("MAX_RETRIES");

  return {
    freeMonthlyLimit,
    proMonthlyLimit,
    maxMessagesPerHour,
    maxMessagesPerMinute,
    minDelaySeconds,
    maxDelaySeconds,
    maxRetries,
    appBaseUrl: mustString("APP_BASE_URL"),
    frontendOrigin: mustString("FRONTEND_ORIGIN"),
  };
}

module.exports = { getAppConfig };
