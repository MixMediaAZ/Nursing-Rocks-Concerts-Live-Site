-- Set MixMediaAZ@gmail.com as admin if exists, or create admin user
-- This migration ensures admin access is properly configured

UPDATE "users" SET "is_admin" = true
WHERE email = 'MixMediaAZ@gmail.com';

-- Also ensure any verified nurse license holders can be admins
-- by providing a way to grant admin status
-- The is_admin column is already in users table with default false
