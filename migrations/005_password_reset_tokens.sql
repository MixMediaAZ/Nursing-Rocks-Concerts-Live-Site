-- Add DB-backed password reset token columns to users table
-- Replaces in-memory Map that was lost on every Vercel serverless cold start

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_token" TEXT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_token_expires_at" TIMESTAMP NULL;

-- Index for fast token lookups during password reset
CREATE INDEX IF NOT EXISTS "idx_users_reset_token" ON "users"("reset_token") WHERE "reset_token" IS NOT NULL;
