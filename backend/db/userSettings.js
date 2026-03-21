const { query } = require("./pool");

async function getUserSettings(userId) {
  const res = await query(
    `select
       user_id as "userId",
       ai_provider as "aiProvider",
       max_messages_per_hour as "maxMessagesPerHour",
       max_messages_per_minute as "maxMessagesPerMinute",
       min_delay_seconds as "minDelaySeconds",
       max_delay_seconds as "maxDelaySeconds",
       created_at as "createdAt",
       updated_at as "updatedAt"
     from user_settings
     where user_id = $1`,
    [userId],
  );
  return res.rows[0] || null;
}

async function upsertUserSettings({
  userId,
  aiProvider,
  maxMessagesPerHour,
  maxMessagesPerMinute,
  minDelaySeconds,
  maxDelaySeconds,
}) {
  const res = await query(
    `insert into user_settings(
       user_id,
       ai_provider,
       max_messages_per_hour,
       max_messages_per_minute,
       min_delay_seconds,
       max_delay_seconds
     )
     values ($1,$2,$3,$4,$5,$6)
     on conflict(user_id) do update
       set ai_provider = excluded.ai_provider,
           max_messages_per_hour = excluded.max_messages_per_hour,
           max_messages_per_minute = excluded.max_messages_per_minute,
           min_delay_seconds = excluded.min_delay_seconds,
           max_delay_seconds = excluded.max_delay_seconds,
           updated_at = now()
     returning
       user_id as "userId",
       ai_provider as "aiProvider",
       max_messages_per_hour as "maxMessagesPerHour",
       max_messages_per_minute as "maxMessagesPerMinute",
       min_delay_seconds as "minDelaySeconds",
       max_delay_seconds as "maxDelaySeconds",
       created_at as "createdAt",
       updated_at as "updatedAt"`,
    [
      userId,
      aiProvider || null,
      maxMessagesPerHour ?? null,
      maxMessagesPerMinute ?? null,
      minDelaySeconds ?? null,
      maxDelaySeconds ?? null,
    ],
  );
  return res.rows[0];
}

module.exports = { getUserSettings, upsertUserSettings };

