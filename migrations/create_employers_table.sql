-- Employers table (separate from users)
CREATE TABLE IF NOT EXISTS employers (
  id SERIAL PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_email TEXT UNIQUE NOT NULL,
  contact_phone TEXT,
  website TEXT,
  logo_url TEXT,
  description TEXT,
  location TEXT,
  industry TEXT,
  company_size TEXT,
  
  -- Account status
  is_verified BOOLEAN DEFAULT FALSE,
  account_status TEXT DEFAULT 'pending', -- pending, active, suspended
  verification_date TIMESTAMP,
  verified_by INTEGER REFERENCES users(id),
  
  -- Authentication
  password_hash TEXT NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employers_email ON employers(contact_email);
CREATE INDEX IF NOT EXISTS idx_employers_status ON employers(account_status);
CREATE INDEX IF NOT EXISTS idx_employers_verified ON employers(is_verified);

-- Contact requests table
CREATE TABLE IF NOT EXISTS contact_requests (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  employer_id INTEGER NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  requested_at TIMESTAMP DEFAULT NOW(),
  
  -- Review status
  status TEXT DEFAULT 'pending', -- pending, approved, denied
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER REFERENCES users(id),
  admin_notes TEXT,
  denial_reason TEXT,
  
  -- Access expiry
  expires_at TIMESTAMP,
  
  -- Track contact info reveal
  contact_revealed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_application ON contact_requests(application_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_employer ON contact_requests(employer_id);

-- Update job_listings to add employer_id reference
ALTER TABLE job_listings 
ADD COLUMN IF NOT EXISTS employer_id INTEGER REFERENCES employers(id);

CREATE INDEX IF NOT EXISTS idx_job_listings_employer ON job_listings(employer_id);

-- Update job_applications to track contact sharing
ALTER TABLE job_applications
ADD COLUMN IF NOT EXISTS contact_shared_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS contact_shared_by INTEGER REFERENCES users(id);

