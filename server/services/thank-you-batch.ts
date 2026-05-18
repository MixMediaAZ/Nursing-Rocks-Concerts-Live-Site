import { db } from "../db";
import { users } from "@shared/schema";
import { and, isNull, eq, sql, or } from "drizzle-orm";

const SENDER_EMAIL = process.env.SENDER_EMAIL || "noreply@nursingrocks.com";
const SUBJECT = "Thank You from Nursing Rocks! 🎸";
const THROTTLE_MS = 500;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let migrationApplied = false;

/**
 * Defensive self-bootstrap: adds the tracking column + backfills users who
 * already received the email via the per-ticket flow. Safe to call repeatedly.
 */
async function ensureMigrated(): Promise<void> {
  if (migrationApplied) return;

  await db.execute(sql`
    ALTER TABLE "users"
    ADD COLUMN IF NOT EXISTS "thank_you_email_sent_at" TIMESTAMP NULL
  `);

  await db.execute(sql`
    UPDATE "users"
    SET "thank_you_email_sent_at" = NOW()
    WHERE "thank_you_email_sent_at" IS NULL
      AND "id" IN (
        SELECT DISTINCT "user_id" FROM "tickets" WHERE "email_status" = 'sent'
      )
  `);

  migrationApplied = true;
}

export interface ThankYouEligibleUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface ThankYouBatchPreview {
  total: number;
  recipients: ThankYouEligibleUser[];
}

/** Returns the list of users who would receive a thank-you email. Read-only. */
export async function getThankYouBatchPreview(): Promise<ThankYouBatchPreview> {
  await ensureMigrated();

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      first_name: users.first_name,
      last_name: users.last_name,
    })
    .from(users)
    .where(
      and(
        isNull(users.thank_you_email_sent_at),
        or(isNull(users.is_suspended), eq(users.is_suspended, false))
      )
    );

  const recipients = rows.filter((u) => u.email && EMAIL_RE.test(u.email));
  return { total: recipients.length, recipients };
}

export interface ThankYouBatchResult {
  sent: number;
  failed: number;
  skipped: number;
  total: number;
  failures: Array<{ userId: number; email: string; error: string }>;
}

/**
 * Send the thank-you email to every eligible user.
 *
 * Safety:
 *  - expectedCount must match the current preview count (race-condition guard).
 *  - For each user: timestamp is set FIRST, then email is sent. A mid-batch
 *    crash leaves users marked as sent — better to occasionally miss one than
 *    to send twice.
 *  - Throttled to ~2/sec to stay under Resend rate limits.
 */
export async function runThankYouBatch(
  adminUserId: number,
  expectedCount: number
): Promise<ThankYouBatchResult> {
  await ensureMigrated();

  const preview = await getThankYouBatchPreview();

  if (preview.total !== expectedCount) {
    throw new Error(
      `Recipient count changed (expected ${expectedCount}, now ${preview.total}). Re-run the preview before confirming.`
    );
  }

  const { Resend } = await import("resend");
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY not configured");
  }
  const resend = new Resend(apiKey);

  const { buildThankYouEmailHtml } = await import("./email");
  const html = buildThankYouEmailHtml();

  const result: ThankYouBatchResult = {
    sent: 0,
    failed: 0,
    skipped: 0,
    total: preview.recipients.length,
    failures: [],
  };

  for (const user of preview.recipients) {
    // Atomically claim this user — if the column was set since the preview,
    // skip without sending.
    const claim = await db
      .update(users)
      .set({ thank_you_email_sent_at: new Date() })
      .where(
        and(eq(users.id, user.id), isNull(users.thank_you_email_sent_at))
      )
      .returning({ id: users.id });

    if (claim.length === 0) {
      result.skipped += 1;
      continue;
    }

    try {
      const response = await resend.emails.send({
        from: SENDER_EMAIL,
        to: user.email,
        subject: SUBJECT,
        html,
        replyTo: "NursingRocksConcerts@gmail.com",
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      result.sent += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.failed += 1;
      result.failures.push({ userId: user.id, email: user.email, error: msg });
      console.error(
        `[thank-you-batch] Failed for user ${user.id} (admin ${adminUserId}): ${msg}`
      );
    }

    await new Promise((r) => setTimeout(r, THROTTLE_MS));
  }

  console.log(
    `[thank-you-batch] admin=${adminUserId} sent=${result.sent} failed=${result.failed} skipped=${result.skipped} total=${result.total}`
  );

  return result;
}
