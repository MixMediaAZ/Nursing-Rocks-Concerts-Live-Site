-- Add verified_only field to job_listings table
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS verified_only BOOLEAN DEFAULT FALSE;

-- Create index for faster queries on verified_only status
CREATE INDEX IF NOT EXISTS idx_job_listings_verified_only ON job_listings(verified_only);

-- Add is_priority field to job_applications table for verified nurses
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS is_priority BOOLEAN DEFAULT FALSE;

-- Create index for faster queries on priority applications
CREATE INDEX IF NOT EXISTS idx_job_applications_is_priority ON job_applications(is_priority);

