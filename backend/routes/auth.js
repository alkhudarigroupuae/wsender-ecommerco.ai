const express = require("express");
const bcrypt = require("bcryptjs");

const { signAccessToken } = require("../services/authTokens");
const { requireAuth } = require("../middleware/requireAuth");
const { isAdminEmail } = require("../services/admin");
const { createUser, findUserByEmail, toPublicUser } = require("../db/users");

const router = express.Router();

router.post("/register", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const name = String(req.body.name || "").trim();
  const password = String(req.body.password || "");

  if (!email || !name || password.length < 8) {
    return res.status(400).json({ error: "Invalid registration details" });
  }

  const existing = await findUserByEmail(email);
  if (existing) return res.status(409).json({ error: "Email already in use" });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUser({ email, name, passwordHash });

  const token = signAccessToken({ userId: user.id });
  res.json({ token, user: { ...toPublicUser(user), isAdmin: isAdminEmail(user.email) } });
});

router.post("/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  const user = await findUserByEmail(email);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signAccessToken({ userId: user.id });
  res.json({ token, user: { ...toPublicUser(user), isAdmin: isAdminEmail(user.email) } });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = req.user;
  res.json({ user: { ...toPublicUser(user), isAdmin: Boolean(req.isAdmin) } });
});

router.post("/logout", (_req, res) => {
  res.json({ ok: true });
});

module.exports = router;
