const express = require("express");

const { getStatus, getQr, logout, initWhatsApp } = require("../whatsapp/client");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.get("/status", requireAuth, (req, res) => {
  initWhatsApp(req.user.id);
  res.json({ status: getStatus(req.user.id) });
});

router.get("/qr", requireAuth, (req, res) => {
  initWhatsApp(req.user.id);
  const qr = getQr(req.user.id);
  res.json({ qr });
});

router.post("/reconnect", requireAuth, async (req, res) => {
  initWhatsApp(req.user.id);
  res.json({ ok: true });
});

router.post("/logout", requireAuth, async (req, res) => {
  await logout(req.user.id);
  res.json({ ok: true });
});

module.exports = router;
