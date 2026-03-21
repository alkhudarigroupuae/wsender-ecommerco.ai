const { generateRandomDelayMs } = require("../ai/messageGenerator");
const { sendWhatsAppMessage } = require("../whatsapp/sender");
const { sleep, addMs } = require("../utils/time");
const { randomInt } = require("../utils/random");
const { getWaitMs, increment } = require("./rateLimiter");
const { getRemaining, incrementSent } = require("./usageLimiter");
const { findUserById } = require("../db/users");
const { setCampaignStatus } = require("../db/campaigns");
const { markLogFailed, markLogRetrying, updateLogAfterSend } = require("../db/messageLogs");
const {
  countActiveJobsForCampaign,
  fetchAndLockNextJob,
  markJobFailed,
  markJobSent,
  releaseJobToPending,
  unlockStuckJobs,
} = require("../db/sendJobs");
const { getAppConfig } = require("./config");
const { getEffectiveUserSettings } = require("./userSettings");

let started = false;

const LOCK_TIMEOUT_MS = 5 * 60 * 1000;

async function markRetry(job, err) {
  const delaySeconds = randomInt(60, 180);
  const nextRunAt = addMs(new Date(), delaySeconds * 1000);
  const lastError = String(err?.message || err);

  const attempt = Number(job.attempt_count || 0) + 1;
  await Promise.all([
    markJobFailed({ jobId: job.id, attemptCount: attempt, nextRunAt, lastError, status: "pending" }),
    markLogRetrying({ logId: job.log_id, ownerUserId: job.owner_user_id, attemptCount: attempt, error: lastError }),
  ]);
}

async function markFailed(job, err) {
  const lastError = String(err?.message || err);
  const attempt = Number(job.attempt_count || 0) + 1;
  await Promise.all([
    markJobFailed({ jobId: job.id, attemptCount: attempt, nextRunAt: job.next_run_at, lastError, status: "failed" }),
    markLogFailed({ logId: job.log_id, ownerUserId: job.owner_user_id, attemptCount: attempt, error: lastError }),
  ]);
}

async function maybeUpdateCampaignStatus(campaignId, ownerUserId) {
  const pending = await countActiveJobsForCampaign({ campaignId, ownerUserId });
  await setCampaignStatus({ id: campaignId, ownerUserId, status: pending > 0 ? "sending" : "done" });
}

async function workerLoop() {
  const cfg = getAppConfig();
  while (true) {
    const now = new Date();
    await unlockStuckJobs({ now, lockTimeoutMs: LOCK_TIMEOUT_MS });

    const job = await fetchAndLockNextJob({ now, lockTimeoutMs: LOCK_TIMEOUT_MS });
    if (!job) {
      await sleep(2000);
      continue;
    }

    try {
      const ownerUserId = String(job.owner_user_id || "");

      const waitMs = await getWaitMs(ownerUserId, now);
      if (waitMs > 0) {
        await releaseJobToPending({ jobId: job.id, nextRunAt: addMs(now, waitMs) });
        await sleep(250);
        continue;
      }

      const user = await findUserById(ownerUserId);
      if (!user) {
        await markFailed(job, new Error("User not found"));
        await maybeUpdateCampaignStatus(job.campaign_id, job.owner_user_id);
        await sleep(500);
        continue;
      }

      const remaining = await getRemaining(user, now);
      if (remaining <= 0) {
        await markFailed(job, new Error("Monthly sending limit reached"));
        await maybeUpdateCampaignStatus(job.campaign_id, job.owner_user_id);
        await sleep(500);
        continue;
      }

      await sendWhatsAppMessage(ownerUserId, job.phone, job.message, job.media_path);
      const sentAt = new Date();
      await Promise.all([
        markJobSent({ jobId: job.id }),
        updateLogAfterSend({
          logId: job.log_id,
          ownerUserId: job.owner_user_id,
          status: "sent",
          sentAt,
          attemptCount: Number(job.attempt_count || 0) + 1,
          error: null,
        }),
      ]);

      await Promise.all([increment(ownerUserId, sentAt), incrementSent(job.owner_user_id, sentAt, 1)]);
      await maybeUpdateCampaignStatus(job.campaign_id, job.owner_user_id);

      const eff = await getEffectiveUserSettings(ownerUserId);
      const delayMs = generateRandomDelayMs({
        minDelaySeconds: eff.minDelaySeconds,
        maxDelaySeconds: eff.maxDelaySeconds,
      });
      await sleep(delayMs);
    } catch (err) {
      const attempt = Number(job.attempt_count || 0) + 1;
      if (attempt < cfg.maxRetries) {
        await markRetry(job, err);
      } else {
        await markFailed(job, err);
      }

      await maybeUpdateCampaignStatus(job.campaign_id, job.owner_user_id);
      await sleep(3000);
    }
  }
}

function startQueueWorker() {
  if (started) return;
  started = true;
  workerLoop().catch((err) => {
    process.stderr.write(`${err?.stack || err}\n`);
  });
}

module.exports = { startQueueWorker };
