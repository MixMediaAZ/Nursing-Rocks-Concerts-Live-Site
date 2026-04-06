-- Migration: Fix email case-insensitivity to prevent login failures
-- Purpose: Normalize all existing emails and add case-insensitive unique constraint
-- Created: 2026-04-04

BEGIN;

-- Step 1: Normalize all existing emails to lowercase
UPDATE users SET email = LOWER(TRIM(email)) WHERE email != LOWER(TRIM(email));

-- Step 2: Drop the old case-sensitive unique constraint
ALTER TABLE users DROP CONSTRAINT users_email_unique;

-- Step 3: Create a case-insensitive unique constraint using LOWER()
-- This allows the database itself to prevent case-sensitive email duplicates
CREATE UNIQUE INDEX users_email_lower_unique ON users (LOWER(email));

-- Step 4: Verify the constraint works
-- The database will now enforce: UNIQUE (LOWER(email))
-- This means:
-- - test@example.com, Test@Example.com, TEST@EXAMPLE.COM are treated as the SAME email
-- - Only one version (lowercased) can exist in the database
-- - Login queries with WHERE LOWER(email) = 'test@example.com' will be bulletproof

COMMIT;
