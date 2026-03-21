const express = require("express");

const { getAppConfig } = require("../services/config");

const router = express.Router();

router.get("/config", (_req, res) => {
  const cfg = getAppConfig();
  res.json({
    limits: {
      freeMonthly: cfg.freeMonthlyLimit,
      proMonthly: cfg.proMonthlyLimit,
    },
    sending: {
      maxPerHour: cfg.maxMessagesPerHour,
      maxPerMinute: cfg.maxMessagesPerMinute,
      minDelaySeconds: cfg.minDelaySeconds,
      maxDelaySeconds: cfg.maxDelaySeconds,
    },
  });
});

module.exports = router;
