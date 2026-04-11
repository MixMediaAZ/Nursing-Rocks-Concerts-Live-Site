-- Add audit tracking fields to job_listings table
-- These fields track when and by whom jobs were last edited by admins

ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS last_admin_edit_at TIMESTAMP NULL;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS last_admin_edit_by INTEGER NULL;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS is_editable BOOLEAN DEFAULT true;

-- Add foreign key for last_admin_edit_by (references users.id)
ALTER TABLE job_listings
ADD CONSTRAINT fk_job_listings_last_admin_edit_by
FOREIGN KEY (last_admin_edit_by) REFERENCES users(id) ON DELETE SET NULL;

-- Create index on last_admin_edit_at for sorting/filtering
CREATE INDEX IF NOT EXISTS idx_job_listings_last_admin_edit_at ON job_listings (last_admin_edit_at DESC);

-- Create index on is_editable for filtering locked jobs
CREATE INDEX IF NOT EXISTS idx_job_listings_is_editable ON job_listings (is_editable);
