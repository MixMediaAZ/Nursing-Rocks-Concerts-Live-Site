import "dotenv/config";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { readdirSync, readFileSync } from "fs";
import { createHash } from "crypto";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function splitSqlStatements(sql) {
  // NOTE: Keep migrations simple (no functions/DO blocks) so a semicolon split is safe.
  return sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function schemaMigrationsExists() {
  try {
    await pool.query("SELECT 1 FROM schema_migrations LIMIT 1");
    return true;
  } catch {
    return false;
  }
}

async function hasMigration(version) {
  const res = await pool.query(
    "SELECT 1 FROM schema_migrations WHERE version = $1 LIMIT 1",
    [version],
  );
  return res.rowCount > 0;
}

async function recordMigration({ version, name, executionTimeMs, checksum }) {
  await pool.query(
    `
      INSERT INTO schema_migrations (version, name, execution_time_ms, checksum)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (version) DO NOTHING
    `,
    [version, name, executionTimeMs, checksum],
  );
}

async function applyMigrationFile(filename) {
  const filePath = join(__dirname, "migrations", filename);
  const sql = readFileSync(filePath, "utf-8");
  const checksum = sha256(sql);

  // Use the full filename as the unique migration version.
  // This avoids collisions for legacy migrations like `add_*.sql` / `create_*.sql`.
  const version = filename;
  const name = filename;

  const trackingReady = await schemaMigrationsExists();
  if (trackingReady && (await hasMigration(version))) {
    console.log(`↷ Skipping ${filename} (already applied: version=${version})`);
    return;
  }

  const start = Date.now();
  const statements = splitSqlStatements(sql);
  console.log(`→ Applying ${filename} (${statements.length} statements)`);

  for (let i = 0; i < statements.length; i++) {
    await pool.query(statements[i]);
  }

  const executionTimeMs = Date.now() - start;

  // Only record if tracking table exists (it will after 000...)
  if (await schemaMigrationsExists()) {
    await recordMigration({ version, name, executionTimeMs, checksum });
  }

  console.log(`✓ Applied ${filename} in ${executionTimeMs}ms`);
}

async function run() {
  try {
    const migrationsDir = join(__dirname, "migrations");
    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b));

    if (files.length === 0) {
      console.log("No migrations found.");
      process.exit(0);
    }

    for (const file of files) {
      await applyMigrationFile(file);
    }

    console.log("✅ All migrations complete.");
  } catch (err) {
    console.error("❌ Migration run failed:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();


