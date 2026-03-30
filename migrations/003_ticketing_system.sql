-- Production Ticketing System Schema
-- This migration implements the complete event ticketing, verification, and scanning system

-- ========== ALTER USERS TABLE ==========
-- Add verification metadata columns
ALTER TABLE "users" ADD COLUMN "verified_at" timestamp NULL;
ALTER TABLE "users" ADD COLUMN "verification_source" VARCHAR(50) NULL;
ALTER TABLE "users" ADD COLUMN "verification_notes" TEXT NULL;
ALTER TABLE "users" ADD COLUMN "status" VARCHAR(20) NOT NULL DEFAULT 'pending';

-- Add indices for faster lookups
CREATE INDEX "idx_users_status" ON "users"("status");
CREATE INDEX "idx_users_verified_at" ON "users"("verified_at");

-- ========== ALTER EVENTS TABLE ==========
-- Add ticket expiration tracking (7 days after event ends)
ALTER TABLE "events" ADD COLUMN "end_at" timestamp NULL;
ALTER TABLE "events" ADD COLUMN "ticket_expiration_at" timestamp NULL;
ALTER TABLE "events" ADD COLUMN "capacity" integer NULL;
ALTER TABLE "events" ADD COLUMN "status" VARCHAR(20) NOT NULL DEFAULT 'draft';
ALTER TABLE "events" ADD COLUMN "slug" VARCHAR(255) UNIQUE NULL;

CREATE INDEX "idx_events_status" ON "events"("status");
CREATE INDEX "idx_events_ticket_expiration" ON "events"("ticket_expiration_at");

-- ========== REPLACE TICKETS TABLE ==========
-- Drop old simple tickets table
DROP TABLE IF EXISTS "tickets" CASCADE;

-- Create new production tickets table
CREATE TABLE "tickets" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "event_id" integer NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,

  -- Ticket identification
  "ticket_code" VARCHAR(64) NOT NULL UNIQUE,
  "qr_token" TEXT UNIQUE,  -- NULL for legacy tickets, required for event tickets
  "qr_image_url" TEXT NULL,

  -- Status tracking
  "status" VARCHAR(20) NOT NULL DEFAULT 'issued',

  -- Timeline
  "issued_at" timestamp NOT NULL DEFAULT NOW(),
  "emailed_at" timestamp NULL,
  "expires_at" timestamp NOT NULL,
  "checked_in_at" timestamp NULL,
  "revoked_at" timestamp NULL,

  -- Revocation tracking
  "revoke_reason" TEXT NULL,
  "reissued_from_ticket_id" UUID NULL REFERENCES "tickets"("id"),

  -- Anti-sharing / device tracking
  "first_scan_ip" VARCHAR(128) NULL,
  "first_scan_user_agent" TEXT NULL,
  "first_scan_device_fingerprint" VARCHAR(255) NULL,
  "last_scan_at" timestamp NULL,
  "scan_count" integer NOT NULL DEFAULT 0,

  -- Email delivery tracking
  "email_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "email_error" TEXT NULL,

  -- Timestamps
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW(),

  -- Enforce one ticket per user per event
  CONSTRAINT "unique_user_event_ticket" UNIQUE("user_id", "event_id")
);

-- FIX: Add CHECK constraints for data integrity
ALTER TABLE "tickets" ADD CONSTRAINT "check_status"
  CHECK ("status" IN ('issued', 'checked_in', 'revoked', 'expired'));

ALTER TABLE "tickets" ADD CONSTRAINT "check_email_status"
  CHECK ("email_status" IN ('pending', 'sent', 'failed'));

-- Indices for fast lookups
CREATE INDEX "idx_tickets_user_id" ON "tickets"("user_id");
CREATE INDEX "idx_tickets_event_id" ON "tickets"("event_id");
CREATE INDEX "idx_tickets_status" ON "tickets"("status");
CREATE INDEX "idx_tickets_expires_at" ON "tickets"("expires_at");
CREATE INDEX "idx_tickets_qr_token" ON "tickets"("qr_token");
-- FIX: Add index for email_status to find failed emails for retry
CREATE INDEX "idx_tickets_email_status" ON "tickets"("email_status");
-- FIX: Composite index for common queries (finding unexpired issued tickets)
CREATE INDEX "idx_tickets_status_expires" ON "tickets"("status", "expires_at");

-- ========== CREATE TICKET SCAN LOGS TABLE ==========
CREATE TABLE "ticket_scan_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ticket_id" UUID NOT NULL REFERENCES "tickets"("id") ON DELETE CASCADE,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "event_id" integer NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,

  -- Scan context
  "scanned_at" timestamp NOT NULL DEFAULT NOW(),
  "scanner_user_id" integer NULL REFERENCES "users"("id") ON DELETE SET NULL,
  "scanner_device_id" VARCHAR(255) NULL,
  "ip_address" VARCHAR(128) NULL,
  "user_agent" TEXT NULL,
  "device_fingerprint" VARCHAR(255) NULL,

  -- Result tracking
  "result" VARCHAR(20) NOT NULL,
  "reason" VARCHAR(255) NOT NULL,

  "created_at" timestamp NOT NULL DEFAULT NOW()
);

-- Indices for audit trail lookups
CREATE INDEX "idx_ticket_scan_logs_ticket_id" ON "ticket_scan_logs"("ticket_id");
CREATE INDEX "idx_ticket_scan_logs_scanned_at" ON "ticket_scan_logs"("scanned_at");
CREATE INDEX "idx_ticket_scan_logs_result" ON "ticket_scan_logs"("result");

-- ========== CREATE VERIFICATION AUDIT LOGS TABLE ==========
CREATE TABLE "verification_audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "admin_user_id" integer NULL REFERENCES "users"("id") ON DELETE SET NULL,

  -- Action tracking
  "action" VARCHAR(50) NOT NULL,
  "previous_verified_state" boolean NULL,
  "new_verified_state" boolean NULL,
  "notes" TEXT NULL,

  "created_at" timestamp NOT NULL DEFAULT NOW()
);

-- Indices for audit trail queries
CREATE INDEX "idx_verification_audit_logs_user_id" ON "verification_audit_logs"("user_id");
CREATE INDEX "idx_verification_audit_logs_action" ON "verification_audit_logs"("action");
CREATE INDEX "idx_verification_audit_logs_created_at" ON "verification_audit_logs"("created_at");

-- ========== APPLY SAFE DEFAULTS ==========
-- Set initial status for existing users
UPDATE "users" SET "status" = 'verified' WHERE "is_verified" = true AND "status" = 'pending';
UPDATE "users" SET "status" = 'unverified' WHERE "is_verified" = false AND "status" = 'pending';

-- Mark existing events as published if they have no status yet
UPDATE "events" SET "status" = 'published' WHERE "status" = 'draft';
