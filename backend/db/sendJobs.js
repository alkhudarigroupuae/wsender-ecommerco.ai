const { query, withClient } = require("./pool");

async function createSendJob({
  ownerUserId,
  campaignId,
  contactId,
  logId,
  phone,
  message,
  mediaPath,
  nextRunAt,
}) {
  const res = await query(
    `insert into send_jobs(
       owner_user_id,
       campaign_id,
       contact_id,
       log_id,
       phone,
       message,
       media_path,
       status,
       next_run_at
     )
     values ($1,$2,$3,$4,$5,$6,$7,'pending',$8)
     returning id as "_id"`,
    [ownerUserId, campaignId, contactId, logId, phone, message, mediaPath || null, nextRunAt],
  );
  return res.rows[0];
}

async function fetchAndLockNextJob({ now, lockTimeoutMs }) {
  return withClient(async (client) => {
    await client.query("begin");
    try {
      const res = await client.query(
        `select
           id,
           owner_user_id,
           campaign_id,
           contact_id,
           log_id,
           phone,
           message,
           media_path,
           status,
           attempt_count,
           next_run_at,
           locked_at,
           last_error
         from send_jobs
         where status = 'pending'
           and next_run_at <= $1
           and (locked_at is null or locked_at < (now() - ($2::int * interval '1 millisecond')))
         order by next_run_at asc
         for update skip locked
         limit 1`,
        [now, lockTimeoutMs],
      );
      const job = res.rows[0];
      if (!job) {
        await client.query("commit");
        return null;
      }

      await client.query(
        `update send_jobs
         set status = 'processing',
             locked_at = now(),
             updated_at = now()
         where id = $1`,
        [job.id],
      );

      await client.query("commit");
      return job;
    } catch (err) {
      await client.query("rollback");
      throw err;
    }
  });
}

async function unlockStuckJobs({ now, lockTimeoutMs }) {
  const cutoff = new Date(new Date(now).getTime() - Number(lockTimeoutMs || 0));
  await query(
    `update send_jobs
     set status = 'pending',
         locked_at = null,
         updated_at = now()
     where status = 'processing'
       and locked_at is not null
       and locked_at < $1`,
    [cutoff],
  );
}

async function releaseJobToPending({ jobId, nextRunAt }) {
  await query(
    `update send_jobs
     set status = 'pending',
         locked_at = null,
         next_run_at = $2,
         updated_at = now()
     where id = $1`,
    [jobId, nextRunAt],
  );
}

async function incrementJobAttempt({ jobId }) {
  await query(
    `update send_jobs
     set attempt_count = attempt_count + 1,
         updated_at = now()
     where id = $1`,
    [jobId],
  );
}

async function markJobSent({ jobId }) {
  await query(
    `update send_jobs
     set status = 'sent',
         attempt_count = attempt_count + 1,
         locked_at = null,
         last_error = null,
         updated_at = now()
     where id = $1`,
    [jobId],
  );
}

async function markJobFailed({ jobId, attemptCount, nextRunAt, lastError, status }) {
  await query(
    `update send_jobs
     set status = $2,
         attempt_count = $3,
         next_run_at = $4,
         last_error = $5,
         locked_at = null,
         updated_at = now()
     where id = $1`,
    [jobId, status, attemptCount, nextRunAt, lastError || null],
  );
}

async function countActiveJobsForCampaign({ ownerUserId, campaignId }) {
  const res = await query(
    `select count(*)::int as count
     from send_jobs
     where owner_user_id = $1 and campaign_id = $2 and status in ('pending','processing')`,
    [ownerUserId, campaignId],
  );
  return res.rows[0]?.count || 0;
}

module.exports = {
  createSendJob,
  fetchAndLockNextJob,
  unlockStuckJobs,
  releaseJobToPending,
  incrementJobAttempt,
  markJobSent,
  markJobFailed,
  countActiveJobsForCampaign,
};
