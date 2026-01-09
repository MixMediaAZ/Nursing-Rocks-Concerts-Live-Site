-- Add employer job-posting payment/entitlement fields (beta)
ALTER TABLE employers
  ADD COLUMN IF NOT EXISTS job_post_options jsonb;

ALTER TABLE employers
  ADD COLUMN IF NOT EXISTS job_post_credits integer NOT NULL DEFAULT 0;

ALTER TABLE employers
  ADD COLUMN IF NOT EXISTS job_post_pass_expires_at timestamp;

ALTER TABLE employers
  ADD COLUMN IF NOT EXISTS job_post_lifetime boolean NOT NULL DEFAULT false;


