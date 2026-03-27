require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");
const { withClient } = require("./pool");

const migrationsDir = path.join(__dirname, "migrations");

async function ensureMigrationsTable(client) {
  await client.query(`
    create table if not exists schema_migrations (
      name text primary key,
      ran_at timestamptz not null default now()
    )
  `);
}

function listMigrations() {
  if (!fs.existsSync(migrationsDir)) return [];
  return fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((name) => ({ name, filePath: path.join(migrationsDir, name) }));
}

async function runMigration(client, mig) {
  const sql = fs.readFileSync(mig.filePath, "utf8");
  await client.query("begin");
  try {
    await client.query(sql);
    await client.query("insert into schema_migrations(name) values($1)", [mig.name]);
    await client.query("commit");
  } catch (err) {
    await client.query("rollback");
    throw err;
  }
}

async function main() {
  await withClient(async (client) => {
    await ensureMigrationsTable(client);
    const applied = await client.query("select name from schema_migrations");
    const appliedSet = new Set(applied.rows.map((r) => r.name));
    const migrations = listMigrations();

    for (const mig of migrations) {
      if (appliedSet.has(mig.name)) continue;
      process.stdout.write(`Running migration ${mig.name}\n`);
      await runMigration(client, mig);
    }

    process.stdout.write("Migrations complete\n");
  });
}

main().catch((err) => {
  process.stderr.write(`${err?.stack || err}\n`);
  process.exit(1);
});

