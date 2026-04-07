-- Link nrpxRegistrations to users table
-- Enables NRPX registrations to use admin verification workflow
--
-- Changes:
-- - user_id: Reference to users table (admin approval creates user account)
--   NULLABLE initially to preserve existing 6 pre-workflow registrations
-- - ticket_email_sent: NEW field to track if ticket email (with QR) was sent on claim
-- - ticket_email_sent_at: NEW field to track when ticket email was sent
--
-- Reuses existing fields:
-- - email_sent: Now tracks if WELCOME email was sent (on approval)
-- - email_sent_at: Tracks when welcome email was sent

ALTER TABLE nrpx_registrations
  ADD COLUMN user_id INTEGER REFERENCES users(id),
  ADD COLUMN ticket_email_sent BOOLEAN DEFAULT false,
  ADD COLUMN ticket_email_sent_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX nrpx_registrations_user_id_idx ON nrpx_registrations (user_id);
