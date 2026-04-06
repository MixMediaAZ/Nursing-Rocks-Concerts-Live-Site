-- Migration: Fix email case-insensitivity for ALL email tables
-- Purpose: Ensure case-insensitive unique constraints and lookups across the entire application
-- Created: 2026-04-04
-- Note: Migration 003 fixed users table. This migration fixes subscribers and nrpx_registrations tables.

BEGIN;

-- ========================================
-- PART 1: Fix subscribers table
-- ========================================

-- Step 1a: Normalize all existing subscriber emails to lowercase
UPDATE subscribers SET email = LOWER(TRIM(email)) WHERE email != LOWER(TRIM(email));

-- Step 1b: Drop the old case-sensitive unique constraint on subscribers.email
ALTER TABLE subscribers DROP CONSTRAINT subscribers_email_unique;

-- Step 1c: Create a case-insensitive unique constraint for subscribers using LOWER()
CREATE UNIQUE INDEX subscribers_email_lower_unique ON subscribers (LOWER(email));

-- ========================================
-- PART 2: Fix nrpx_registrations table
-- ========================================

-- Step 2a: Normalize all existing nrpx registration emails to lowercase
UPDATE nrpx_registrations SET email = LOWER(TRIM(email)) WHERE email != LOWER(TRIM(email));

-- Step 2b: Drop the old case-sensitive unique constraint on nrpx_registrations.email
ALTER TABLE nrpx_registrations DROP CONSTRAINT nrpx_registrations_email_unique;

-- Step 2c: Create a case-insensitive unique constraint for nrpx_registrations using LOWER()
CREATE UNIQUE INDEX nrpx_registrations_email_lower_unique ON nrpx_registrations (LOWER(email));

-- ========================================
-- VERIFICATION
-- ========================================

-- After this migration:
-- - All emails in subscribers table are lowercase
-- - All emails in nrpx_registrations table are lowercase
-- - Both tables now enforce case-insensitive uniqueness at the database level
-- - Lookups using LOWER(email) = 'normalized@email.com' will be bulletproof
-- - Duplicate registrations with different email cases are now impossible

COMMIT;
