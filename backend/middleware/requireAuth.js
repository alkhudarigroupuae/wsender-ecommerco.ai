const { verifyAccessToken } = require("../services/authTokens");
const { findUserById } = require("../db/users");
const { isAdminEmail } = require("../services/admin");

async function requireAuth(req, res, next) {
  try {
    const header = String(req.headers.authorization || "");
    const match = header.match(/^Bearer\s+(.+)$/i);
    const token = match?.[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = verifyAccessToken(token);
    const userId = decoded?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await findUserById(userId);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    req.user = user;
    req.isAdmin = isAdminEmail(user.email);
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

module.exports = { requireAuth };
