-- Migration tracking table (idempotent)
-- Tracks which migrations have been executed in a given database.

CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  version TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  executed_at TIMESTAMP DEFAULT NOW(),
  execution_time_ms INTEGER,
  checksum TEXT
);

CREATE INDEX IF NOT EXISTS idx_schema_migrations_version
  ON schema_migrations(version);


