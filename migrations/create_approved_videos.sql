-- Create approved_videos table for video content moderation
CREATE TABLE IF NOT EXISTS approved_videos (
  id SERIAL PRIMARY KEY,
  public_id TEXT NOT NULL UNIQUE,
  folder TEXT,
  approved BOOLEAN DEFAULT false,
  approved_by INTEGER,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  admin_notes TEXT
);

-- Create indices for faster queries
CREATE INDEX IF NOT EXISTS idx_approved_videos_public_id ON approved_videos(public_id);
CREATE INDEX IF NOT EXISTS idx_approved_videos_approved ON approved_videos(approved);
CREATE INDEX IF NOT EXISTS idx_approved_videos_folder ON approved_videos(folder);

