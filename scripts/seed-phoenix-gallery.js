/**
 * Seed the gallery table with Phoenix marketing photos.
 *
 * Reads the manifest produced by scripts/process-phoenix-photos.mjs and
 * inserts one gallery row per photo, tagged "phoenix".
 *
 * Safe to re-run: skips any row whose image_url already exists.
 *
 * Usage:
 *   1. Ensure DATABASE_URL is set in your .env (same value the app uses).
 *   2. node scripts/seed-phoenix-gallery.js
 *   3. (Optional) Pass --dry-run to print what would be inserted without writing.
 */

import * as dotenv from "dotenv";
import { promises as fs } from "node:fs";
import path from "node:path";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;
const DRY_RUN = process.argv.includes("--dry-run");
const MANIFEST_PATH = path.resolve("public/assets/phoenix/manifest.json");

async function main() {
  const raw = await fs.readFile(MANIFEST_PATH, "utf8");
  const manifest = JSON.parse(raw);
  console.log(`📷 Manifest has ${manifest.length} photos.`);

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not set. Aborting.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  let inserted = 0;
  let skipped = 0;

  try {
    for (const item of manifest) {
      const exists = await client.query(
        `SELECT id FROM gallery WHERE image_url = $1 LIMIT 1`,
        [item.url]
      );
      if (exists.rowCount > 0) {
        skipped++;
        continue;
      }

      if (DRY_RUN) {
        console.log(`  [dry-run] would insert ${item.url}`);
        inserted++;
        continue;
      }

      await client.query(
        `INSERT INTO gallery (image_url, thumbnail_url, alt_text, media_type, tags, sort_order)
         VALUES ($1, $2, $3, 'image', $4, 0)`,
        [item.url, item.thumbnail_url, item.alt_text, item.tags]
      );
      inserted++;
    }

    console.log(
      `✅ Done. Inserted: ${inserted}, Skipped (already in DB): ${skipped}${DRY_RUN ? " (dry-run)" : ""}`
    );
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
