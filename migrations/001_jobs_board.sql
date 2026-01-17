-- Employers: add company_name, account status, and job posting entitlements
ALTER TABLE employers ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE employers ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'pending';
ALTER TABLE employers ADD COLUMN IF NOT EXISTS job_post_credits integer DEFAULT 0;
ALTER TABLE employers ADD COLUMN IF NOT EXISTS job_post_pass_expires_at timestamp;
ALTER TABLE employers ADD COLUMN IF NOT EXISTS job_post_lifetime boolean DEFAULT false;
ALTER TABLE employers ADD COLUMN IF NOT EXISTS job_post_options jsonb;

-- Backfill existing employer data
UPDATE employers SET company_name = COALESCE(company_name, name);
UPDATE employers
SET account_status = 'active'
WHERE is_verified = true
  AND (account_status IS NULL OR account_status = 'pending');

-- Job listings: approval metadata
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS approved_by integer REFERENCES users(id);
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS approved_at timestamp;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS approval_notes text;

-- Contact requests table
CREATE TABLE IF NOT EXISTS contact_requests (
  id serial PRIMARY KEY,
  application_id integer NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  employer_id integer NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  requested_at timestamp DEFAULT now(),
  status text DEFAULT 'pending', -- pending, approved, denied
  reviewed_at timestamp,
  reviewed_by integer REFERENCES users(id),
  admin_notes text,
  denial_reason text,
  expires_at timestamp,
  contact_revealed_at timestamp
);

CREATE INDEX IF NOT EXISTS contact_requests_employer_id_idx ON contact_requests (employer_id);
CREATE INDEX IF NOT EXISTS contact_requests_application_id_idx ON contact_requests (application_id);
