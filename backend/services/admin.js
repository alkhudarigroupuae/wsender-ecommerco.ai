function getAdminEmails() {
  const raw = String(process.env.ADMIN_EMAILS || "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => String(s).trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email) {
  const e = String(email || "").trim().toLowerCase();
  if (!e) return false;
  const allowed = getAdminEmails();
  return allowed.includes(e);
}

module.exports = { isAdminEmail };

