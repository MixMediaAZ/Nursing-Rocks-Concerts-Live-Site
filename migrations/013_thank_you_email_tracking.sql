-- Track which users have received the post-inaugural thank-you email.
-- Prevents accidental double-sends across batch + per-user flows.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "thank_you_email_sent_at" TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS "idx_users_thank_you_sent" ON "users"("thank_you_email_sent_at")
  WHERE "thank_you_email_sent_at" IS NULL;

-- Backfill: any user who already has a successfully-sent ticket email is considered
-- "already thanked" — since the ticket-email body now IS the thank-you template,
-- they should be excluded from the batch.
UPDATE "users"
SET "thank_you_email_sent_at" = COALESCE("thank_you_email_sent_at", NOW())
WHERE "thank_you_email_sent_at" IS NULL
  AND "id" IN (
    SELECT DISTINCT "user_id" FROM "tickets" WHERE "email_status" = 'sent'
  );
