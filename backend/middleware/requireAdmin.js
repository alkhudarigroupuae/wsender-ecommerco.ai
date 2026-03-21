function requireAdmin(req, res, next) {
  if (req.isAdmin) return next();
  return res.status(403).json({ error: "Forbidden" });
}

module.exports = { requireAdmin };

