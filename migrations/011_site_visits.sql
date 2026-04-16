-- Migration: 011_site_visits.sql
-- Purpose: Persist daily visitor fingerprints so counts survive restarts/deployments
-- Date: April 15, 2026

CREATE TABLE IF NOT EXISTS site_visits (
  id          SERIAL PRIMARY KEY,
  visit_date  VARCHAR(10) NOT NULL,       -- "YYYY-MM-DD"
  fingerprint VARCHAR(16) NOT NULL,       -- sha256(ip+ua) truncated
  created_at  TIMESTAMP DEFAULT NOW()
);

-- One row per unique visitor per day
CREATE UNIQUE INDEX IF NOT EXISTS site_visits_date_fp_idx
  ON site_visits (visit_date, fingerprint);

-- Fast lookup by date range
CREATE INDEX IF NOT EXISTS site_visits_date_idx
  ON site_visits (visit_date DESC);
