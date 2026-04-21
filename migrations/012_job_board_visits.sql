-- Migration: 012_job_board_visits.sql
-- Purpose: Jobs board visit analytics (hashed visitor id); required by /api/admin/jobs-board-stats
-- Safe: IF NOT EXISTS

CREATE TABLE IF NOT EXISTS job_board_visits (
  id             SERIAL PRIMARY KEY,
  visitor_id     TEXT NOT NULL,
  is_returning   BOOLEAN DEFAULT false,
  visited_at     TIMESTAMP DEFAULT NOW(),
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS job_board_visits_visited_at_idx
  ON job_board_visits (visited_at DESC);

CREATE INDEX IF NOT EXISTS job_board_visits_visitor_id_idx
  ON job_board_visits (visitor_id);
