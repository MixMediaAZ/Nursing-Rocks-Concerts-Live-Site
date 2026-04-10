-- Migration: 002_jobs_ingestion.sql
-- Purpose: Add source tracking, deduplication, and normalized fields to job_listings
-- Date: April 9, 2026
-- Status: Postgres 12+ compatible, safe for production

-- ============= PHASE 0: ALTER job_listings TABLE =============

-- Add source tracking fields
ALTER TABLE job_listings ADD COLUMN source_name VARCHAR(50);
ALTER TABLE job_listings ADD COLUMN source_job_id VARCHAR(50);
ALTER TABLE job_listings ADD COLUMN source_url TEXT;
ALTER TABLE job_listings ADD COLUMN source_type VARCHAR(20);
ALTER TABLE job_listings ADD COLUMN source_content_hash VARCHAR(64);

-- Add sync tracking fields
ALTER TABLE job_listings ADD COLUMN last_synced_at TIMESTAMP;
ALTER TABLE job_listings ADD COLUMN first_seen_at TIMESTAMP DEFAULT NOW();
ALTER TABLE job_listings ADD COLUMN last_seen_at TIMESTAMP DEFAULT NOW();
ALTER TABLE job_listings ADD COLUMN sync_status VARCHAR(20) DEFAULT 'active';

-- Add location normalization fields (keep raw location for reference)
ALTER TABLE job_listings ADD COLUMN location_raw TEXT;
ALTER TABLE job_listings ADD COLUMN location_city VARCHAR(100);
ALTER TABLE job_listings ADD COLUMN location_state VARCHAR(50);
ALTER TABLE job_listings ADD COLUMN location_postal_code VARCHAR(10);
ALTER TABLE job_listings ADD COLUMN is_remote BOOLEAN DEFAULT FALSE;

-- Add normalized reference fields
ALTER TABLE job_listings ADD COLUMN normalized_specialty_id INTEGER;
ALTER TABLE job_listings ADD COLUMN normalized_role_level VARCHAR(50);

-- Add data quality and review fields
ALTER TABLE job_listings ADD COLUMN data_quality_score INTEGER DEFAULT 0;
ALTER TABLE job_listings ADD COLUMN manual_review_required BOOLEAN DEFAULT FALSE;

-- ============= UNIQUENESS CONSTRAINT =============

-- Primary deduplication constraint: (source_name, source_job_id)
-- Ensures no duplicate external job IDs from same source
ALTER TABLE job_listings ADD UNIQUE (source_name, source_job_id);

-- ============= NEW TABLE: job_specialties =============
-- Reference table for normalized nursing specialties

CREATE TABLE IF NOT EXISTS job_specialties (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============= NEW TABLE: job_ingestion_runs =============
-- Track each ingestion sync for auditing and monitoring

CREATE TABLE IF NOT EXISTS job_ingestion_runs (
  id SERIAL PRIMARY KEY,
  source_name VARCHAR(50) NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending',
  jobs_fetched INTEGER DEFAULT 0,
  jobs_parsed INTEGER DEFAULT 0,
  jobs_inserted INTEGER DEFAULT 0,
  jobs_updated INTEGER DEFAULT 0,
  jobs_skipped INTEGER DEFAULT 0,
  jobs_archived INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  error_log TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============= NEW TABLE: job_source_pages =============
-- Track listing page fetches and content changes

CREATE TABLE IF NOT EXISTS job_source_pages (
  id SERIAL PRIMARY KEY,
  source_name VARCHAR(50) NOT NULL,
  page_url TEXT NOT NULL,
  page_hash VARCHAR(64),
  fetched_at TIMESTAMP DEFAULT NOW(),
  job_count INTEGER,
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Prevent duplicate tracking of same page
ALTER TABLE job_source_pages ADD UNIQUE (source_name, page_url);

-- ============= NEW TABLE: job_tags =============
-- Reference table for job classification tags

CREATE TABLE IF NOT EXISTS job_tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============= NEW TABLE: job_tag_map =============
-- Many-to-many mapping of jobs to tags with confidence scores

CREATE TABLE IF NOT EXISTS job_tag_map (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES job_tags(id) ON DELETE CASCADE,
  confidence_score DECIMAL(3,2),
  inferred_from VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Prevent duplicate tag assignments
ALTER TABLE job_tag_map ADD UNIQUE (job_id, tag_id);

-- ============= ADD FOREIGN KEY CONSTRAINTS =============

-- normalized_specialty_id references job_specialties
ALTER TABLE job_listings ADD CONSTRAINT fk_job_listings_specialty
  FOREIGN KEY (normalized_specialty_id) REFERENCES job_specialties(id);

-- ============= CREATE INDEXES (PERFORMANCE) =============

-- Source deduplication lookups
CREATE INDEX IF NOT EXISTS idx_job_listings_source
  ON job_listings(source_name, source_job_id);

-- Content hash lookups (for soft dedup detection)
CREATE INDEX IF NOT EXISTS idx_job_listings_content_hash
  ON job_listings(source_content_hash);

-- Filtering by specialty
CREATE INDEX IF NOT EXISTS idx_job_listings_active_specialty
  ON job_listings(is_active, normalized_specialty_id);

-- Sorting by posted date
CREATE INDEX IF NOT EXISTS idx_job_listings_posted_date
  ON job_listings(posted_date DESC);

-- Location-based filtering
CREATE INDEX IF NOT EXISTS idx_job_listings_location
  ON job_listings(location_city, location_state);

-- Sync tracking queries
CREATE INDEX IF NOT EXISTS idx_job_listings_last_synced
  ON job_listings(last_synced_at DESC);

-- Stale job detection (last_seen_at for archival)
CREATE INDEX IF NOT EXISTS idx_job_listings_last_seen
  ON job_listings(last_seen_at DESC);

-- Ingestion run queries
CREATE INDEX IF NOT EXISTS idx_job_ingestion_runs_source_date
  ON job_ingestion_runs(source_name, started_at DESC);

-- Source page tracking
CREATE INDEX IF NOT EXISTS idx_job_source_pages_source
  ON job_source_pages(source_name, fetched_at DESC);

-- Tag map queries
CREATE INDEX IF NOT EXISTS idx_job_tag_map_job_id
  ON job_tag_map(job_id);

CREATE INDEX IF NOT EXISTS idx_job_tag_map_tag_id
  ON job_tag_map(tag_id);

-- ============= SEED DATA: job_specialties =============

INSERT INTO job_specialties (name, category, description) VALUES
  ('Critical Care', 'acute_care', 'Intensive care nursing'),
  ('ICU', 'acute_care', 'Intensive Care Unit nursing'),
  ('PICU', 'acute_care', 'Pediatric ICU nursing'),
  ('NICU', 'acute_care', 'Neonatal ICU nursing'),
  ('Emergency Department', 'acute_care', 'Emergency nursing'),
  ('Operating Room', 'surgical', 'Perioperative nursing'),
  ('Oncology', 'specialty', 'Cancer care nursing'),
  ('Medical-Surgical', 'general', 'General medical-surgical nursing'),
  ('Pediatrics', 'specialty', 'Pediatric nursing'),
  ('Psychiatric', 'specialty', 'Mental health nursing'),
  ('Community Health', 'community', 'Public health nursing'),
  ('Home Health', 'community', 'Home care nursing'),
  ('Informatics', 'specialty', 'Nursing informatics'),
  ('Charge Nurse', 'leadership', 'Nursing leadership - charge roles'),
  ('Nursing Manager', 'leadership', 'Nursing management'),
  ('Nursing Director', 'leadership', 'Senior nursing leadership'),
  ('Educator', 'specialty', 'Nursing education')
ON CONFLICT (name) DO NOTHING;

-- ============= SEED DATA: job_tags =============

INSERT INTO job_tags (name, category) VALUES
  -- Specialty tags
  ('Critical Care', 'specialty'),
  ('ICU', 'specialty'),
  ('PICU', 'specialty'),
  ('NICU', 'specialty'),
  ('Emergency', 'specialty'),
  ('Operating Room', 'specialty'),
  ('Oncology', 'specialty'),
  ('Pediatrics', 'specialty'),
  -- Role level tags
  ('Clinical Nurse', 'role'),
  ('Charge Nurse', 'role'),
  ('Nursing Manager', 'role'),
  ('Nursing Director', 'role'),
  ('Educator', 'role'),
  ('Researcher', 'role'),
  ('Float Pool', 'role'),
  -- Shift tags
  ('Day Shift', 'shift'),
  ('Night Shift', 'shift'),
  ('Rotating Shift', 'shift'),
  ('On-Call', 'shift'),
  -- Experience tags
  ('Entry Level', 'experience'),
  ('Mid-Level', 'experience'),
  ('Senior', 'experience'),
  ('Leadership', 'experience'),
  -- Employment type tags
  ('Full-Time', 'employment'),
  ('Part-Time', 'employment'),
  ('Contract', 'employment'),
  ('Per Diem', 'employment')
ON CONFLICT (name) DO NOTHING;

-- ============= MIGRATION COMPLETE =============

-- Verify migration success by checking new columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'job_listings'
  AND column_name IN ('source_name', 'source_job_id', 'location_raw', 'first_seen_at', 'last_seen_at')
ORDER BY ordinal_position DESC
LIMIT 5;
