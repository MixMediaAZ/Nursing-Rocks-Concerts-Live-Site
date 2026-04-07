-- Create sponsorships table for donation and sponsorship tracking
CREATE TABLE sponsorships (
  id SERIAL PRIMARY KEY,
  amount_cents INTEGER NOT NULL,
  tier TEXT NOT NULL,
  donor_name TEXT NOT NULL,
  donor_email TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  payment_intent_id TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX sponsorships_payment_intent_id_idx ON sponsorships (payment_intent_id);
CREATE INDEX sponsorships_donor_email_idx ON sponsorships (donor_email);
CREATE INDEX sponsorships_status_idx ON sponsorships (status);
CREATE INDEX sponsorships_created_at_idx ON sponsorships (created_at);
