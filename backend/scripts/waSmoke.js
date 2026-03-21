const path = require("path");
const { Client, LocalAuth } = require("whatsapp-web.js");

const executablePath =
  process.env.WHATSAPP_EXECUTABLE_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "smoke",
    dataPath: path.join(__dirname, "..", "whatsapp", ".session", "smoke"),
  }),
  puppeteer: {
    executablePath,
    headless: true,
    args: [],
  },
});

client.on("qr", () => process.stdout.write("QR_EVENT\n"));
client.on("authenticated", () => process.stdout.write("AUTHENTICATED\n"));
client.on("ready", () => process.stdout.write("READY\n"));
client.on("auth_failure", (m) => process.stdout.write(`AUTH_FAILURE ${String(m || "")}\n`));
client.on("disconnected", (r) => process.stdout.write(`DISCONNECTED ${String(r || "")}\n`));

client.initialize().catch((e) => {
  process.stderr.write(`INIT_ERR ${e?.stack || e}\n`);
  process.exit(1);
});

setTimeout(() => {
  process.stdout.write("TIMEOUT_30S\n");
  process.exit(0);
}, 30000);

