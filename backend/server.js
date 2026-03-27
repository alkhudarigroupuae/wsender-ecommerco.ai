const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const dotenv = require("dotenv");
dotenv.config();

const healthRoutes = require("./routes/health");
const authRoutes = require("./routes/auth");
const { billingRouter, handleStripeWebhook } = require("./routes/billing");
const contactsRoutes = require("./routes/contacts");
const campaignsRoutes = require("./routes/campaigns");
const whatsappRoutes = require("./routes/whatsapp");
const mediaRoutes = require("./routes/media");
const contactRoutes = require("./routes/contact");
const publicRoutes = require("./routes/public");
const settingsRoutes = require("./routes/settings");
const adminRoutes = require("./routes/admin");
const { startQueueWorker } = require("./services/queueWorker");
const { query } = require("./db/pool");
const { getAppConfig } = require("./services/config");

const PORT = Number(process.env.PORT || 4000);

async function main() {
  const cfg = getAppConfig();
  const app = express();

  app.set("trust proxy", 1);

  app.use(morgan("combined"));
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );
  app.use(compression());

  app.use(
    cors({
      origin: cfg.frontendOrigin,
      credentials: true,
    }),
  );
  app.post("/api/billing/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, "uploads");
  fs.mkdirSync(path.join(uploadsDir, "imports"), { recursive: true });
  fs.mkdirSync(path.join(uploadsDir, "media"), { recursive: true });
  if (process.env.WHATSAPP_SESSION_PATH) {
    fs.mkdirSync(process.env.WHATSAPP_SESSION_PATH, { recursive: true });
  }

  app.use("/api/health", healthRoutes);
  app.use("/api/public", publicRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/billing", billingRouter);
  app.use("/api/contact", contactRoutes);
  app.use("/api/contacts", contactsRoutes);
  app.use("/api/campaigns", campaignsRoutes);
  app.use("/api/whatsapp", whatsappRoutes);
  app.use("/api/media", mediaRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/admin", adminRoutes);

  app.use((err, req, res, next) => {
    if (!err) return next();
    const status = Number(err.status || err.statusCode || 500);
    const message = String(err.message || "Internal Server Error");
    if (res.headersSent) return next(err);
    if (String(req.path || "").startsWith("/api/")) {
      return res.status(status).json({ error: message, code: err.code });
    }
    return res.status(status).send(message);
  });

  await query("select 1");
  process.stdout.write("PostgreSQL: connected\n");

  startQueueWorker();

  const frontendDist = path.join(__dirname, "..", "frontend", "dist");
  if (process.env.NODE_ENV === "production" && fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get(/.*/, (_req, res) => {
      res.sendFile(path.join(frontendDist, "index.html"));
    });
  }

  app.listen(PORT, () => {
    process.stdout.write(`Backend listening on http://localhost:${PORT}\n`);
  });
}

main().catch((err) => {
  process.stderr.write(`${err?.stack || err}\n`);
  process.exit(1);
});
