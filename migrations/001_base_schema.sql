-- Base schema migration (idempotent)
-- Creates all tables used by the application, as defined in shared/schema.ts.
-- All CREATE statements use IF NOT EXISTS to be safe on re-runs.

-- ========= CORE TABLES =========

-- Users (auth + roles)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  is_suspended BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_is_suspended ON users(is_suspended);

-- Artists
CREATE TABLE IF NOT EXISTS artists (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  genre TEXT,
  latest_album TEXT,
  social_links JSONB,
  featured_song TEXT,
  song_duration TEXT
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  date TIMESTAMP NOT NULL,
  artist_id INTEGER NOT NULL REFERENCES artists(id),
  image_url TEXT,
  start_time TEXT NOT NULL,
  doors_time TEXT,
  price TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  genre TEXT,
  tickets_url TEXT,
  location TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_artist_id ON events(artist_id);
CREATE INDEX IF NOT EXISTS idx_events_is_featured ON events(is_featured);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);

-- Media folders (organizing gallery)
CREATE TABLE IF NOT EXISTS media_folders (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  folder_type TEXT NOT NULL DEFAULT 'general',
  parent_id INTEGER REFERENCES media_folders(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  thumbnail_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_media_folders_parent_id ON media_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_media_folders_folder_type ON media_folders(folder_type);

-- Gallery (images/videos/audio/docs)
CREATE TABLE IF NOT EXISTS gallery (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  alt_text TEXT,
  event_id INTEGER REFERENCES events(id),
  folder_id INTEGER REFERENCES media_folders(id),
  media_type TEXT NOT NULL DEFAULT 'image',
  file_size INTEGER,
  dimensions TEXT,
  duration INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  z_index INTEGER DEFAULT 0,
  tags TEXT[],
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_gallery_event_id ON gallery(event_id);
CREATE INDEX IF NOT EXISTS idx_gallery_folder_id ON gallery(folder_id);
CREATE INDEX IF NOT EXISTS idx_gallery_media_type ON gallery(media_type);

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS subscribers (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Video submissions (user appreciation videos)
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
  video_source_key TEXT,
  video_duration INTEGER,
  video_bytes INTEGER,
  resource_type TEXT,
  consent_given BOOLEAN DEFAULT FALSE,
  wants_updates BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  admin_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_video_submissions_status ON video_submissions(status);
CREATE INDEX IF NOT EXISTS idx_video_submissions_submitted_at ON video_submissions(submitted_at DESC);

-- Approved videos (Cloudinary moderation)
CREATE TABLE IF NOT EXISTS approved_videos (
  id SERIAL PRIMARY KEY,
  public_id TEXT NOT NULL UNIQUE,
  folder TEXT,
  approved BOOLEAN DEFAULT FALSE,
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  admin_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_approved_videos_public_id ON approved_videos(public_id);
CREATE INDEX IF NOT EXISTS idx_approved_videos_approved ON approved_videos(approved);
CREATE INDEX IF NOT EXISTS idx_approved_videos_folder ON approved_videos(folder);

-- Nurse licenses (verification)
CREATE TABLE IF NOT EXISTS nurse_licenses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_number TEXT NOT NULL,
  state TEXT NOT NULL,
  expiration_date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  verification_date TIMESTAMP,
  verification_source TEXT,
  verification_result JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nurse_licenses_user_id ON nurse_licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_nurse_licenses_state ON nurse_licenses(state);
CREATE INDEX IF NOT EXISTS idx_nurse_licenses_status ON nurse_licenses(status);

-- Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  purchase_date TIMESTAMP DEFAULT NOW(),
  ticket_type TEXT NOT NULL,
  price TEXT NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  ticket_code TEXT NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_code ON tickets(ticket_code);

-- Media assets (file uploads)
CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other',
  title TEXT,
  alt TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  filesize INTEGER,
  filename TEXT,
  originalname TEXT,
  mimetype TEXT
);

CREATE INDEX IF NOT EXISTS idx_media_assets_user_id ON media_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_type ON media_assets(type);

-- ========= JOBS BOARD TABLES =========

-- Employers (separate from users)
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
  is_verified BOOLEAN DEFAULT FALSE,
  account_status TEXT DEFAULT 'pending',
  verification_date TIMESTAMP,
  verified_by INTEGER REFERENCES users(id),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- If the table already existed (from earlier experiments), ensure required columns exist
ALTER TABLE employers ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE employers ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE employers ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE employers ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE employers ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE employers ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE employers ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE employers ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE employers ADD COLUMN IF NOT EXISTS company_size TEXT;
ALTER TABLE employers ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE employers ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'pending';
ALTER TABLE employers ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP;
ALTER TABLE employers ADD COLUMN IF NOT EXISTS verified_by INTEGER;
ALTER TABLE employers ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE employers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE employers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_employers_email ON employers(contact_email);
CREATE INDEX IF NOT EXISTS idx_employers_status ON employers(account_status);
CREATE INDEX IF NOT EXISTS idx_employers_verified ON employers(is_verified);

-- Job listings
CREATE TABLE IF NOT EXISTS job_listings (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  employer_id INTEGER NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  responsibilities TEXT,
  requirements TEXT,
  benefits TEXT,
  location TEXT NOT NULL,
  job_type TEXT NOT NULL,
  work_arrangement TEXT NOT NULL,
  specialty TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  education_required TEXT,
  certification_required TEXT[],
  shift_type TEXT,
  salary_min DECIMAL(10,2),
  salary_max DECIMAL(10,2),
  salary_period TEXT DEFAULT 'annual',
  verified_only BOOLEAN DEFAULT FALSE,
  application_url TEXT,
  contact_email TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  posted_date TIMESTAMP DEFAULT NOW(),
  expiry_date TIMESTAMP,
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  approval_notes TEXT
);

-- If the table already existed, ensure required columns exist for indexes/logic
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS employer_id INTEGER;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS posted_date TIMESTAMP DEFAULT NOW();
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS verified_only BOOLEAN DEFAULT FALSE;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS approved_by INTEGER;

CREATE INDEX IF NOT EXISTS idx_job_listings_employer_id ON job_listings(employer_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_is_active ON job_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_job_listings_is_featured ON job_listings(is_featured);
CREATE INDEX IF NOT EXISTS idx_job_listings_posted_date ON job_listings(posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_job_listings_verified_only ON job_listings(verified_only);
CREATE INDEX IF NOT EXISTS idx_job_listings_is_approved ON job_listings(is_approved);
CREATE INDEX IF NOT EXISTS idx_job_listings_approved_by ON job_listings(approved_by);

-- Nurse profiles
CREATE TABLE IF NOT EXISTS nurse_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  headline TEXT,
  summary TEXT,
  years_of_experience INTEGER,
  specialties TEXT[],
  skills TEXT[],
  certifications JSONB,
  education JSONB,
  resume_url TEXT,
  profile_image_url TEXT,
  availability TEXT,
  preferred_shift TEXT,
  preferred_work_arrangement TEXT,
  preferred_locations TEXT[],
  current_employer TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nurse_profiles_user_id ON nurse_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_nurse_profiles_is_public ON nurse_profiles(is_public);

-- Job applications
CREATE TABLE IF NOT EXISTS job_applications (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cover_letter TEXT,
  resume_url TEXT,
  status TEXT DEFAULT 'pending',
  application_date TIMESTAMP DEFAULT NOW(),
  last_updated TIMESTAMP DEFAULT NOW(),
  employer_notes TEXT,
  is_withdrawn BOOLEAN DEFAULT FALSE,
  -- Present in existing migration add_verified_only_jobs.sql and used by server/routes.ts
  is_priority BOOLEAN DEFAULT FALSE,
  contact_shared_at TIMESTAMP,
  contact_shared_by INTEGER REFERENCES users(id)
);

-- If the table already existed, ensure required columns exist for indexes/logic
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS is_priority BOOLEAN DEFAULT FALSE;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS contact_shared_at TIMESTAMP;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS contact_shared_by INTEGER;

CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_is_priority ON job_applications(is_priority);

-- Saved jobs
CREATE TABLE IF NOT EXISTS saved_jobs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
  saved_date TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON saved_jobs(job_id);

-- Job alerts
CREATE TABLE IF NOT EXISTS job_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  keywords TEXT,
  specialties TEXT[],
  locations TEXT[],
  job_types TEXT[],
  experience_levels TEXT[],
  salary_min DECIMAL(10,2),
  frequency TEXT DEFAULT 'daily',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_sent TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_alerts_user_id ON job_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_job_alerts_is_active ON job_alerts(is_active);

-- Contact requests
CREATE TABLE IF NOT EXISTS contact_requests (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  employer_id INTEGER NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  requested_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER REFERENCES users(id),
  admin_notes TEXT,
  denial_reason TEXT,
  expires_at TIMESTAMP,
  contact_revealed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_application ON contact_requests(application_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_employer ON contact_requests(employer_id);

-- ========= STORE TABLES =========

-- App settings
CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  is_sensitive BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Store products
CREATE TABLE IF NOT EXISTS store_products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  stock_quantity INTEGER DEFAULT 0,
  external_id TEXT,
  external_source TEXT,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_store_products_category ON store_products(category);
CREATE INDEX IF NOT EXISTS idx_store_products_is_featured ON store_products(is_featured);
CREATE INDEX IF NOT EXISTS idx_store_products_is_available ON store_products(is_available);

-- Store orders
CREATE TABLE IF NOT EXISTS store_orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  shipping_address JSONB,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_orders_user_id ON store_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_store_orders_status ON store_orders(status);
CREATE INDEX IF NOT EXISTS idx_store_orders_payment_status ON store_orders(payment_status);

-- Store order items
CREATE TABLE IF NOT EXISTS store_order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES store_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES store_products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_time DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_order_items_order_id ON store_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_store_order_items_product_id ON store_order_items(product_id);


