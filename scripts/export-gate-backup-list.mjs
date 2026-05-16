/**
 * Read-only: verified users sorted by last name, with gate backup identifiers.
 * Event ticket: ticket_code (NR-*) or JWT qr_token presence.
 * NRPX: ticket_code (NRPX-*) linked by user_id or email.
 *
 * Usage: node scripts/export-gate-backup-list.mjs
 * Output: scripts/gate-backup-list.tsv (and .md)
 */
import fs from "fs";
import pg from "pg";

function parseEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[t.slice(0, i).trim()] = v;
  }
  return env;
}

const env = parseEnv(".env");
if (!env.DATABASE_URL) {
  console.error("DATABASE_URL not set (.env)");
  process.exit(1);
}

const client = new pg.Client({ connectionString: env.DATABASE_URL });
await client.connect();

try {
  const { rows } = await client.query(`
    SELECT
      u.id AS user_id,
      u.email,
      u.first_name,
      u.last_name,
      u.is_admin,
      (
        SELECT t.ticket_code
        FROM tickets t
        WHERE t.user_id = u.id
          AND (t.status IS NULL OR t.status <> 'revoked')
        ORDER BY t.issued_at DESC NULLS LAST
        LIMIT 1
      ) AS event_ticket_code,
      (
        SELECT CASE
          WHEN t.qr_token IS NOT NULL AND LENGTH(TRIM(t.qr_token)) > 0 THEN true
          ELSE false
        END
        FROM tickets t
        WHERE t.user_id = u.id
          AND (t.status IS NULL OR t.status <> 'revoked')
        ORDER BY t.issued_at DESC NULLS LAST
        LIMIT 1
      ) AS has_qr_jwt,
      (
        SELECT t.status FROM tickets t
        WHERE t.user_id = u.id
          AND (t.status IS NULL OR t.status <> 'revoked')
        ORDER BY t.issued_at DESC NULLS LAST
        LIMIT 1
      ) AS ticket_status,
      (
        SELECT e.title FROM tickets t
        JOIN events e ON e.id = t.event_id
        WHERE t.user_id = u.id
          AND (t.status IS NULL OR t.status <> 'revoked')
        ORDER BY t.issued_at DESC NULLS LAST
        LIMIT 1
      ) AS event_title,
      (
        SELECT r.ticket_code FROM nrpx_registrations r
        WHERE r.user_id = u.id OR LOWER(TRIM(r.email)) = LOWER(TRIM(u.email))
        ORDER BY r.registered_at DESC NULLS LAST
        LIMIT 1
      ) AS nrpx_code
    FROM users u
    WHERE u.is_verified = true
    ORDER BY TRIM(LOWER(u.last_name)), TRIM(LOWER(u.first_name)), u.email;
  `);

  const lines = [];
  lines.push(
    ["Last", "First", "Email", "Backup scan code(s)", "Notes"].join("\t")
  );

  for (const r of rows) {
    const last = (r.last_name || "").trim();
    const first = (r.first_name || "").trim();
    const email = (r.email || "").trim();
    const codes = [];
    if (r.event_ticket_code) codes.push(String(r.event_ticket_code).toUpperCase());
    if (r.nrpx_code && (!r.event_ticket_code || String(r.nrpx_code).toUpperCase() !== String(r.event_ticket_code).toUpperCase())) {
      codes.push(String(r.nrpx_code).toUpperCase());
    }
    const backup = codes.length ? codes.join("; ") : "— (no ticket code in DB)";
    const notes = [];
    if (r.is_admin) notes.push("admin");
    if (r.event_ticket_code && !r.has_qr_jwt) notes.push("event ticket: no JWT yet");
    if (r.event_title) notes.push(`event: ${r.event_title}`);
    const noteStr = notes.join("; ") || "";

    lines.push([last, first, email, backup, noteStr].join("\t"));
  }

  const outDir = "scripts";
  const tsvPath = `${outDir}/gate-backup-list.tsv`;
  fs.writeFileSync(tsvPath, lines.join("\n") + "\n", "utf8");

  const md = [];
  md.push("# Gate backup list (verified users)");
  md.push("");
  md.push(`Generated: ${new Date().toISOString()}`);
  md.push(`Count: ${rows.length}`);
  md.push("");
  md.push("| Last | First | Email | Backup scan code(s) | Notes |");
  md.push("| --- | --- | --- | --- | --- |");
  for (const r of rows) {
    const last = (r.last_name || "").trim().replace(/\|/g, "\\|");
    const first = (r.first_name || "").trim().replace(/\|/g, "\\|");
    const email = (r.email || "").trim().replace(/\|/g, "\\|");
    const codes = [];
    if (r.event_ticket_code) codes.push(String(r.event_ticket_code).toUpperCase());
    if (r.nrpx_code && (!r.event_ticket_code || String(r.nrpx_code).toUpperCase() !== String(r.event_ticket_code).toUpperCase())) {
      codes.push(String(r.nrpx_code).toUpperCase());
    }
    const backup = (codes.length ? codes.join("; ") : "—").replace(/\|/g, "\\|");
    const notes = [];
    if (r.is_admin) notes.push("admin");
    if (r.event_ticket_code && !r.has_qr_jwt) notes.push("event ticket: no JWT yet");
    if (r.event_title) notes.push(`event: ${r.event_title}`);
    const noteStr = notes.join("; ").replace(/\|/g, "\\|");
    md.push(`| ${last} | ${first} | ${email} | ${backup} | ${noteStr} |`);
  }

  const mdPath = `${outDir}/gate-backup-list.md`;
  fs.writeFileSync(mdPath, md.join("\n") + "\n", "utf8");

  console.log(JSON.stringify({ verifiedUsers: rows.length, tsvPath, mdPath }, null, 2));
} finally {
  await client.end();
}
