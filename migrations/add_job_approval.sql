-- Add approval fields to job_listings table
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id);
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS approval_notes TEXT;

-- Create index for faster queries on approval status
CREATE INDEX IF NOT EXISTS idx_job_listings_is_approved ON job_listings(is_approved);
CREATE INDEX IF NOT EXISTS idx_job_listings_approved_by ON job_listings(approved_by);

