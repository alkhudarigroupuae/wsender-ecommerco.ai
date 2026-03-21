const { pickOne, randomInt } = require("../utils/random");
const { generateText } = require("./providers");
const { getAppConfig } = require("../services/config");

function buildPrompt({ contact, campaignDescription, tone }) {
  return [
    "Write a friendly WhatsApp marketing message for this client.",
    "",
    `Client name: ${contact.name || ""}`,
    `Company: ${contact.company || ""}`,
    `Offer: ${campaignDescription}`,
    "",
    "Rules:",
    "- maximum 3 sentences",
    "- natural tone",
    "- different wording every time",
    "- avoid spammy language",
    "- include client name if possible",
    `- tone: ${tone}`,
  ].join("\n");
}

function postProcessMessage(message) {
  const trimmed = String(message || "").trim().replace(/^"+|"+$/g, "");
  return trimmed;
}

function maybeAddEmoji(message) {
  const probability = Number(process.env.EMOJI_PROBABILITY || 0.35);
  if (Number.isNaN(probability) || probability <= 0) return message;
  if (Math.random() > probability) return message;

  const emojis = ["🙂", "✨", "👍", "🙌", "🌿", "📌", "✅"];
  if (emojis.some((e) => message.includes(e))) return message;

  const variants = [
    `${pickOne(emojis)} ${message}`,
    `${message} ${pickOne(emojis)}`,
  ];
  return pickOne(variants);
}

function pickToneVariant() {
  const tones = [
    "warm and helpful",
    "confident and professional",
    "friendly and casual",
    "concise and direct",
    "curious and consultative",
  ];
  return pickOne(tones);
}

async function generatePersonalizedMessage({ contact, campaignDescription, aiProvider }) {
  const tone = pickToneVariant();
  const prompt = buildPrompt({ contact, campaignDescription, tone });

  const content = await generateText({ prompt, temperature: 0.9, provider: aiProvider });
  const cleaned = postProcessMessage(content);
  const withEmoji = maybeAddEmoji(cleaned);

  if (withEmoji.length > 600) {
    return withEmoji.slice(0, 600);
  }

  if (!withEmoji) {
    const fallback = `Hi ${contact.name || ""}, I wanted to share a quick update: ${campaignDescription}`.trim();
    return fallback;
  }

  return withEmoji;
}

function generateRandomDelayMs({ minDelaySeconds, maxDelaySeconds } = {}) {
  const cfg = getAppConfig();
  const min = Number.isFinite(Number(minDelaySeconds)) ? Number(minDelaySeconds) : cfg.minDelaySeconds;
  const max = Number.isFinite(Number(maxDelaySeconds)) ? Number(maxDelaySeconds) : cfg.maxDelaySeconds;
  return randomInt(min, max) * 1000;
}

module.exports = { generatePersonalizedMessage, generateRandomDelayMs };
