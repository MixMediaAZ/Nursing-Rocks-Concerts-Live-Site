-- Migration: 015_song_suggestions.sql
-- Purpose: Store "Suggest a Song" submissions from the Nursing Rocks Radio page
-- Date: June 25, 2026
--
-- Note: This table is also created idempotently at boot in server/index.ts so it
-- exists on serverless (Vercel) deploys without a manual migration run.

CREATE TABLE IF NOT EXISTS song_suggestions (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  city       TEXT,
  role       TEXT,
  song       TEXT NOT NULL,
  story      TEXT,
  email      TEXT,
  can_share  BOOLEAN DEFAULT FALSE,
  status     TEXT DEFAULT 'new',          -- new, reviewed, added, archived
  created_at TIMESTAMP DEFAULT NOW()
);

-- Fast newest-first listing for the admin view
CREATE INDEX IF NOT EXISTS song_suggestions_created_idx
  ON song_suggestions (created_at DESC);
