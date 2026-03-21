const { query } = require("./pool");

async function listUsersAdmin({ limit }) {
  const max = Math.min(Number(limit || 100), 500);
  const res = await query(
    `select
       u.id,
       u.email,
       u.name,
       u.plan,
       u.created_at as "createdAt",
       (
         select count(*)::int
         from contacts c
         where c.owner_user_id = u.id
       ) as "contactsCount",
       (
         select count(*)::int
         from campaigns c2
         where c2.owner_user_id = u.id
       ) as "campaignsCount",
       (
         select coalesce(sum(us.sent_count), 0)::int
         from usage us
         where us.owner_user_id = u.id
       ) as "sentTotal"
     from users u
     order by u.created_at desc
     limit $1`,
    [max],
  );
  return res.rows;
}

async function listContactsAdmin({ ownerUserId, limit, offset }) {
  const max = Math.min(Number(limit || 100), 500);
  const skip = Math.max(Number(offset || 0), 0);
  const itemsRes = await query(
    `select
       id as "_id",
       owner_user_id as "ownerUserId",
       name,
       phone,
       company,
       notes,
       created_at as "createdAt",
       updated_at as "updatedAt"
     from contacts
     where owner_user_id = $1
     order by created_at desc
     limit $2 offset $3`,
    [ownerUserId, max, skip],
  );
  const totalRes = await query("select count(*)::int as count from contacts where owner_user_id = $1", [ownerUserId]);
  return { items: itemsRes.rows, total: totalRes.rows[0]?.count || 0 };
}

async function listCampaignsAdmin({ ownerUserId, limit }) {
  const max = Math.min(Number(limit || 100), 500);
  const res = await query(
    `select
       id as "_id",
       owner_user_id as "ownerUserId",
       campaign_idea as "campaignIdea",
       status,
       created_at as "createdAt",
       updated_at as "updatedAt"
     from campaigns
     where owner_user_id = $1
     order by created_at desc
     limit $2`,
    [ownerUserId, max],
  );
  return res.rows;
}

async function getCampaignAdmin({ id }) {
  const res = await query(
    `select
       id as "_id",
       owner_user_id as "ownerUserId",
       campaign_idea as "campaignIdea",
       campaign_description as "campaignDescription",
       status,
       created_at as "createdAt",
       updated_at as "updatedAt"
     from campaigns
     where id = $1
     limit 1`,
    [id],
  );
  return res.rows[0] || null;
}

module.exports = { listUsersAdmin, listContactsAdmin, listCampaignsAdmin, getCampaignAdmin };

