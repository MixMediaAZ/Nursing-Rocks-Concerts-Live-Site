-- Create video_submissions table
CREATE TABLE IF NOT EXISTS video_submissions (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT,
  location TEXT,
  connection TEXT,
  nurse_name TEXT,
  message TEXT,
  video_url TEXT NOT NULL,
  video_public_id TEXT NOT NULL,
  video_duration INTEGER,
  video_bytes INTEGER,
  resource_type TEXT,
  consent_given BOOLEAN DEFAULT false,
  wants_updates BOOLEAN DEFAULT false,
  submitted_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  admin_notes TEXT
);

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_video_submissions_status ON video_submissions(status);

-- Create index on submitted_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_video_submissions_submitted_at ON video_submissions(submitted_at DESC);

