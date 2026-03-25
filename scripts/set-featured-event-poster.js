/**
 * Sets image_url on the featured event to the Phoenix poster in public/assets.
 * Run once against production (or any DB) after deploying the asset:
 *   node scripts/set-featured-event-poster.js
 * Requires DATABASE_URL in .env (same as other scripts).
 */
import { Pool } from "@neondatabase/serverless";
import "dotenv/config";

const POSTER_URL = "/assets/NRCS%20Phoenix%20Poster%201.PNG";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const r = await pool.query(
      `UPDATE events
       SET image_url = $1
       WHERE is_featured = true`,
      [POSTER_URL]
    );
    console.log(`Updated featured event poster (${r.rowCount ?? 0} row(s)). URL: ${POSTER_URL}`);
    if ((r.rowCount ?? 0) === 0) {
      console.warn("No featured event found (is_featured = true). Set one event as featured in the DB, then re-run.");
    }
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
