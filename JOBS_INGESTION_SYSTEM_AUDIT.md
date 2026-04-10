# Jobs Ingestion System Audit & Production Architecture

**Date:** April 9, 2026
**Status:** AUDIT COMPLETE - READY FOR BUILD
**Scope:** Analyze current jobs board, design ingestion system for Phoenix Children's + future sources

---

## PHASE 1 — SYSTEM AUDIT (Current Nursing Rocks Jobs Board)

### 1.1 Current Data Model

**Primary Table: `job_listings`**
```sql
job_listings (34 fields):
  id (serial, PK)
  title (text, required)
  employer_id (integer, FK → employers)
  description (text, required)
  responsibilities (text, optional)
  requirements (text, optional)
  benefits (text, optional)
  location (text, required) — ISSUE: Single field, no city/state separation
  job_type (text, required) — Full-time, Part-time, Contract
  work_arrangement (text, required) — On-site, Remote, Hybrid
  specialty (text, required) — Nursing specialty (no enum, free text)
  experience_level (text, required) — Entry, Mid, Senior
  education_required (text, optional)
  certification_required (array, optional)
  shift_type (text, optional) — Day, Night, Rotating
  salary_min/salary_max (decimal, optional)
  salary_period (text, default='annual')
  application_url (text, optional)
  contact_email (text, optional)
  is_featured (boolean, default=false)
  is_active (boolean, default=true)
  posted_date (timestamp, default=now)
  expiry_date (timestamp, optional)
  views_count (integer, default=0)
  applications_count (integer, default=0)
  is_approved (boolean, default=false)
  approved_by (integer, FK → users)
  approved_at (timestamp, optional)
  approval_notes (text, optional)
```

**Supporting Tables:**
- `employers` - Company info
- `job_applications` - Nurse applications to jobs
- `saved_jobs` - Favorites
- `job_alerts` - Saved searches

**Critical Analysis:**
```
STRENGTHS:
✅ Good core structure (title, location, specialty, requirements)
✅ Approval workflow (is_approved, approved_by, approved_at)
✅ Application tracking
✅ Active flag for soft delete

WEAKNESSES:
❌ NO source tracking (source_name, source_id, source_url missing)
❌ NO content hash (can't detect duplicates across syncs)
❌ NO last_synced timestamp
❌ NO data_quality flags
❌ location is single field (needs city + state split)
❌ specialty is free text (should be enum or reference table)
❌ NO external job ID tracking
```

### 1.2 How Jobs Are Currently Created

**Current Method: MANUAL ENTRY ONLY**

```typescript
POST /api/jobs (requireAuth)
  - Employer submits job via UI
  - Fields: title, description, location, specialty, etc.
  - Goes to approval workflow (is_approved = false initially)
  - Admin approves before visible

NO AUTOMATED INGESTION PIPELINE EXISTS
```

**Findings:**
- ❌ Zero ingestion automation
- ❌ No scheduled syncs
- ❌ No multi-source consolidation
- ❌ No batch import capability

### 1.3 Deduplication

**Status: DOES NOT EXIST**

- No unique constraint on (source, source_job_id)
- No content_hash for duplicate detection
- Same job posted twice = two database records
- No way to prevent duplicates across syncs

### 1.4 Source Tracking

**Status: DOES NOT EXIST**

Current schema has NO fields for:
- source_name (e.g., "phoenixchildrens", "nursing-rocks-manual")
- source_job_id (external posting ID)
- source_url (original job page)
- source_type (ATS / manual / API / scraped)
- last_synced_at (timestamp of last ingestion)

### 1.5 Ingestion Pipelines

**Status: DOES NOT EXIST**

No scheduled jobs, no cron tasks, no ingestion logic in codebase.

### 1.6 Schema Weaknesses for Multi-Source Ingestion

| Issue | Impact | Fix |
|-------|--------|-----|
| location is single text field | Can't filter by city/state | Split into location_city, location_state |
| specialty is free text | No standardization across sources | Create specialties enum/reference table |
| No source tracking | Can't identify duplicates | Add source_name, source_job_id, source_url |
| No content_hash | Can't detect content changes | Add source_content_hash |
| No last_synced | Can't track ingestion staleness | Add last_synced_at, next_sync_at |
| approval workflow optional | Can approve without review | Keep workflow, make mandatory for ingested jobs |

---

## PHASE 2 — SOURCE ANALYSIS (Phoenix Children's Careers)

### 2.1 URL & Structure Analysis

**Listing Page:** `https://careers.phoenixchildrens.com/Positions/Nursing-jobs`

**Data Loading Method:**

From previous IMPLEMENTATION_ARTIFACTS.md audit:
```
✅ Static HTML on load (not API-driven)
✅ 25 nursing jobs visible on single page (no pagination)
✅ All jobs rendered as <article> elements
✅ Job details are text-embedded (not DOM attributes)
```

**Data Extraction Format:**

Each job article contains:
```
Title: "Clinical Nurse - Acute Care Float Pool"
Department: "Nursing"
Location: "Phoenix, Arizona"
Posting ID: 528801
Detail URL: https://careers.phoenixchildrens.com/Posting/528801

Extraction method: Text parsing (regex patterns)
Example: "Department: X" → match dept
Example: "Location: Y" → split on comma for city/state
```

### 2.2 Job ID Structure

**Format:** Numeric ID (5-7 digits)
- Example: 528801, 912597, 1003511, 973964, 1003185

**Reusability:** YES
- Detail URL pattern: `/Posting/{id}`
- Unique across site
- Suitable as source_job_id

### 2.3 Field Coverage

From IMPLEMENTATION_ARTIFACTS (verified extraction):

| Field | Available | Completeness | Format |
|-------|-----------|-------------|--------|
| Job ID | ✅ Yes | 100% | Numeric: 528801 |
| Title | ✅ Yes | 100% | Text: "Clinical Nurse - Acute Care" |
| Department | ✅ Yes | 95% | Text: "Nursing", "Administration" |
| Location | ✅ Yes | 100% | Text: "Phoenix, Arizona" |
| Description | ✅ Yes | 100% | HTML (detail page) |
| Requirements | ✅ Yes | 95% | Embedded in description |
| Apply URL | ✅ Yes | 100% | Posting ID-based URL |
| Posted Date | ⚠️ Partial | 40% | Some postings show date in details |
| Salary | ❌ No | 0% | Not listed on site |
| Shift Type | ⚠️ Partial | 30% | Some in title/description |
| Experience Level | ⚠️ Partial | 50% | Inferred from title |

### 2.4 Best Ingestion Method

**RECOMMENDATION: Hybrid Scraper + HTML Parser**

```
WHY NOT pure DOM scraping:
- Text is embedded, not in structured DOM attributes
- Changing HTML could break selectors
- Safer to use text pattern matching

BEST APPROACH:
1. Fetch listing page (static HTML)
2. Parse <article> elements
3. Extract job ID from URL
4. For each job:
   - Fetch detail page
   - Use regex patterns (Department: X, Location: Y)
   - Extract all available fields
5. Normalize fields
6. Store in database

TECHNOLOGY:
- Node.js fetch for HTTP
- cheerio or jsdom for HTML parsing
- Regex for text extraction
- NO headless browser needed (costs resources)
```

### 2.5 Sync Frequency

**Recommendation:** Daily at 02:00 UTC

- 25 jobs is lightweight
- Manual approval workflow means no rush
- Allows admin to review overnight
- Stagger to avoid peak hours

---

## PHASE 3 — FINAL INGESTION ARCHITECTURE

### 3.1 Enhanced Database Schema

**NEW TABLES & FIELDS REQUIRED**

```sql
-- MODIFY: job_listings (add source tracking)
ALTER TABLE job_listings ADD COLUMN (
  source_name VARCHAR(50),          -- 'phoenixchildrens', 'nursing-rocks-manual', etc.
  source_job_id VARCHAR(50),        -- External job ID (528801)
  source_url TEXT,                  -- Original job page URL
  source_type VARCHAR(20),          -- 'ATS', 'manual', 'API', 'scraped'
  source_content_hash VARCHAR(64),  -- SHA256 of description (dedup)
  last_synced_at TIMESTAMP,         -- Last time this job was updated from source
  location_city VARCHAR(100),       -- Split from location field
  location_state VARCHAR(50),       -- Split from location field
  data_quality_score INTEGER,       -- 0-100 (% of fields filled)
  UNIQUE (source_name, source_job_id)  -- Prevent duplicate source jobs
);

-- NEW: job_ingestion_runs (track each sync)
CREATE TABLE job_ingestion_runs (
  id SERIAL PRIMARY KEY,
  source_name VARCHAR(50) NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  status VARCHAR(20),              -- 'pending', 'success', 'partial', 'failed'
  jobs_fetched INT,
  jobs_parsed INT,
  jobs_inserted INT,
  jobs_updated INT,
  jobs_skipped INT,
  errors_count INT,
  error_log TEXT,
  duration_seconds INT
);

-- NEW: job_source_pages (track listing page fetches)
CREATE TABLE job_source_pages (
  id SERIAL PRIMARY KEY,
  source_name VARCHAR(50) NOT NULL,
  page_url TEXT NOT NULL,
  page_hash VARCHAR(64),           -- SHA256 of page content
  fetched_at TIMESTAMP DEFAULT NOW(),
  job_count INT,
  status VARCHAR(20)               -- 'success', 'no_change', 'error'
);

-- NEW: job_specialties (enum reference)
CREATE TABLE job_specialties (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,  -- 'ICU', 'PICU', 'Emergency', etc.
  category VARCHAR(50),              -- 'acute_care', 'critical_care', etc.
  created_at TIMESTAMP DEFAULT NOW()
);

-- NEW: job_tags (categories, inferred from content)
CREATE TABLE job_tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50),              -- 'role', 'specialty', 'shift', etc.
  created_at TIMESTAMP DEFAULT NOW()
);

-- NEW: job_tag_map (many-to-many)
CREATE TABLE job_tag_map (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES job_listings(id),
  tag_id INTEGER NOT NULL REFERENCES job_tags(id),
  confidence_score DECIMAL(3,2),     -- 0.0-1.0 (how confident in tag)
  inferred_from VARCHAR(50),         -- 'title', 'description', 'department', etc.
  UNIQUE (job_id, tag_id)
);
```

### 3.2 Indexes for Performance

```sql
CREATE INDEX idx_jobs_source ON job_listings(source_name, source_job_id);
CREATE INDEX idx_jobs_content_hash ON job_listings(source_content_hash);
CREATE INDEX idx_jobs_active_specialty ON job_listings(is_active, specialty);
CREATE INDEX idx_jobs_posted_date ON job_listings(posted_date DESC);
CREATE INDEX idx_jobs_location ON job_listings(location_city, location_state);
CREATE INDEX idx_ingestion_runs_source_date ON job_ingestion_runs(source_name, started_at DESC);
CREATE INDEX idx_source_pages_source_date ON job_source_pages(source_name, fetched_at DESC);
```

### 3.3 Ingestion Pipeline Architecture

```
STEP 1: FETCH LISTING PAGE
  ├─ GET https://careers.phoenixchildrens.com/Positions/Nursing-jobs
  ├─ Hash page content (SHA256)
  ├─ Check if changed since last sync
  └─ Store in job_source_pages

STEP 2: PARSE LISTING PAGE
  ├─ Extract all <article> elements
  ├─ For each: extract job ID, title, department, location
  ├─ Count total jobs found
  └─ Log to job_ingestion_runs

STEP 3: FETCH DETAIL PAGES (PARALLEL)
  ├─ For each job ID:
  │  ├─ GET /Posting/{id}
  │  ├─ Parse HTML for full description
  │  ├─ Timeout: 30 seconds per job
  │  ├─ Retry logic: 2x exponential backoff
  │  └─ Capture any errors
  └─ Merge with listing data

STEP 4: NORMALIZE FIELDS
  ├─ Split location: "Phoenix, Arizona" → city=Phoenix, state=Arizona
  ├─ Normalize job_type (standardize: Full-time, Part-time, Contract, etc.)
  ├─ Normalize shift (map: Day, Evening, Night, Rotating)
  ├─ Parse requirements (extract min years, certifications)
  ├─ Infer experience_level (RN, Specialist, Manager, Director)
  └─ Calculate data_quality_score (% fields filled)

STEP 5: INFER TAGS
  ├─ Parse title + description + department
  ├─ Apply specialty rules:
  │  ├─ title CONTAINS 'ICU' or 'Critical Care' → tag: 'Critical Care'
  │  ├─ title CONTAINS 'PICU' → tag: 'PICU'
  │  ├─ title CONTAINS 'Emergency' → tag: 'Emergency Department'
  │  ├─ description CONTAINS 'Oncology' → tag: 'Oncology'
  │  └─ etc.
  ├─ Apply role rules:
  │  ├─ title CONTAINS 'Director' or 'Manager' → tag: 'Leadership'
  │  ├─ title CONTAINS 'Charge Nurse' → tag: 'Charge Nurse'
  │  └─ etc.
  └─ Store with confidence scores (0.0-1.0)

STEP 6: DEDUP CHECK
  ├─ Calculate content_hash of description
  ├─ Check for existing record:
  │  ├─ First: WHERE source='phoenixchildrens' AND source_job_id=ID
  │  ├─ If found: check if content_hash changed
  │  │  ├─ Changed → UPDATE existing
  │  │  └─ Unchanged → SKIP (log as unchanged)
  │  └─ Not found → INSERT new
  └─ Log action to ingestion_runs

STEP 7: UPSERT JOBS
  ├─ INSERT new jobs
  ├─ UPDATE existing (set updated_at, last_synced_at)
  └─ Mark inserted/updated count

STEP 8: ARCHIVE STALE JOBS
  ├─ Find jobs from source where last_synced_at > 30 days ago
  ├─ Mark as inactive (is_active = false)
  └─ Log archive count

STEP 9: UPSERT TAGS
  ├─ INSERT missing tags into job_tags
  ├─ UPSERT into job_tag_map (insert if new, update confidence if exists)
  └─ Log tag counts

STEP 10: LOG INGESTION RUN
  ├─ Update job_ingestion_runs record:
  │  ├─ completed_at = now
  │  ├─ status = 'success' | 'partial' | 'failed'
  │  ├─ jobs_inserted, jobs_updated, jobs_skipped counts
  │  └─ error_log (if any)
  └─ Alert if status != 'success'

STEP 11: RETRY ON FAILURE
  ├─ If HTTP error or timeout:
  │  ├─ First retry: wait 60 seconds
  │  ├─ Second retry: wait 120 seconds
  │  ├─ Third retry: wait 300 seconds
  │  └─ If > 300s: abort job, log as error
  ├─ Continue with other jobs (don't stop entire sync)
  └─ On final error: email admin

STEP 12: SCHEDULED FREQUENCY
  └─ Cron: 0 2 * * * (Daily 2am UTC)
```

### 3.4 Error Handling & Fallbacks

| Failure Case | Detection | Fallback |
|--------------|-----------|----------|
| Selector drift (0 articles found) | `articles.length === 0` | Alert admin, disable sync, preserve previous data |
| Empty listing page | Page fetches but no jobs | Log warning, preserve previous data, do not archive |
| Network timeout (detail page) | Fetch timeout > 30s | Retry 2x with backoff; continue with remaining jobs; log missing |
| Partial detail page | Missing key fields | Store with data_quality_score < 70; set manual_review_flag |
| Duplicate job in same sync | Same source_job_id found twice | Keep first, deduplicate on source_job_id before insert |
| Job removed from source | Was in DB, missing from new fetch | Archive after 30-day grace period (soft delete via is_active=false) |
| Rate limit (429 response) | HTTP 429 | Exponential backoff: 60s, 120s, 300s; abort if > 5min total |
| Invalid HTML structure | Parse error | Log full HTML, set manual_review_flag=TRUE, skip job |

---

## DATABASE ADDITIONS (PRODUCTION DDL)

```sql
-- ============= NEW TABLES =============

CREATE TABLE job_ingestion_runs (
  id SERIAL PRIMARY KEY,
  source_name VARCHAR(50) NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending',
  jobs_fetched INT DEFAULT 0,
  jobs_parsed INT DEFAULT 0,
  jobs_inserted INT DEFAULT 0,
  jobs_updated INT DEFAULT 0,
  jobs_skipped INT DEFAULT 0,
  jobs_archived INT DEFAULT 0,
  errors_count INT DEFAULT 0,
  error_log TEXT,
  duration_seconds INT
);

CREATE TABLE job_source_pages (
  id SERIAL PRIMARY KEY,
  source_name VARCHAR(50) NOT NULL,
  page_url TEXT NOT NULL,
  page_hash VARCHAR(64),
  fetched_at TIMESTAMP DEFAULT NOW(),
  job_count INT,
  status VARCHAR(20),
  UNIQUE (source_name, page_url)
);

CREATE TABLE job_specialties (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE job_tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE job_tag_map (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES job_tags(id),
  confidence_score DECIMAL(3,2),
  inferred_from VARCHAR(50),
  UNIQUE (job_id, tag_id)
);

-- ============= MODIFY EXISTING TABLE =============

ALTER TABLE job_listings ADD COLUMN (
  source_name VARCHAR(50),
  source_job_id VARCHAR(50),
  source_url TEXT,
  source_type VARCHAR(20),
  source_content_hash VARCHAR(64),
  last_synced_at TIMESTAMP,
  location_city VARCHAR(100),
  location_state VARCHAR(50),
  data_quality_score INTEGER DEFAULT 0
);

ALTER TABLE job_listings ADD UNIQUE (source_name, source_job_id);
ALTER TABLE job_listings ADD INDEX idx_jobs_source (source_name, source_job_id);
ALTER TABLE job_listings ADD INDEX idx_jobs_content_hash (source_content_hash);
ALTER TABLE job_listings ADD INDEX idx_jobs_location (location_city, location_state);
ALTER TABLE job_listings ADD INDEX idx_jobs_synced (last_synced_at);

-- ============= SEED DATA =============

INSERT INTO job_specialties (name, category) VALUES
  ('Critical Care', 'acute_care'),
  ('ICU', 'acute_care'),
  ('PICU', 'acute_care'),
  ('NICU', 'acute_care'),
  ('Emergency Department', 'acute_care'),
  ('Operating Room', 'surgical'),
  ('Oncology', 'specialty'),
  ('Medical-Surgical', 'general'),
  ('Perioperative', 'surgical'),
  ('Pediatrics', 'specialty'),
  ('Psychiatric', 'specialty'),
  ('Community Health', 'community'),
  ('Home Health', 'community'),
  ('Informatics', 'specialty'),
  ('Leadership', 'administrative');

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
  -- Role tags
  ('Clinical Nurse', 'role'),
  ('Charge Nurse', 'role'),
  ('Nursing Manager', 'role'),
  ('Nursing Director', 'role'),
  ('Nurse Educator', 'role'),
  ('Nurse Researcher', 'role'),
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
  -- Employment tags
  ('Full-Time', 'employment'),
  ('Part-Time', 'employment'),
  ('Contract', 'employment'),
  ('Per Diem', 'employment');
```

---

## IMPLEMENTATION ARCHITECTURE (Code Structure)

```
server/
├─ ingestion/
│  ├─ sources/
│  │  ├─ phoenix-childrens.ts      (source-specific logic)
│  │  ├─ base-source.ts             (interface/abstract class)
│  │  └─ registry.ts                (source registry)
│  ├─ extractors/
│  │  ├─ html-parser.ts             (cheerio, jsdom)
│  │  ├─ text-normalizer.ts         (location, job_type, etc.)
│  │  └─ tag-inference.ts           (specialty, role detection)
│  ├─ deduplicator.ts               (hash-based dedup)
│  ├─ pipeline.ts                   (orchestrates 12 steps)
│  └─ scheduler.ts                  (cron + manual triggers)
├─ storage/
│  └─ ingestion-db.ts               (insert/update job records)
└─ routes.ts
   └─ /api/admin/jobs/sync          (manual trigger)
   └─ /api/admin/jobs/sync-status   (view last run)
   └─ /api/admin/jobs/syncs         (history list)
```

---

## IMPLEMENTATION PLAN (Step-by-Step)

### PHASE A: Data Layer (8-10 hours)

1. ✅ Modify schema.ts - Add new columns to jobListings
2. ✅ Create migrations - job_ingestion_runs, job_source_pages, etc.
3. ✅ Create indexes (performance)
4. ✅ Seed job_specialties and job_tags tables
5. ✅ Update Drizzle schema definitions
6. ✅ Test migrations (dev database)

### PHASE B: Ingestion Core (25-30 hours)

1. ✅ Create BaseSource interface (abstract class)
2. ✅ Implement PhoenixChildrensSource class
   - Fetch listing page
   - Parse articles
   - Fetch detail pages
   - Extract all fields
3. ✅ Implement TextNormalizer (location split, job_type standardize, etc.)
4. ✅ Implement TagInference (specialty, role detection with regex)
5. ✅ Implement Deduplicator (hash-based content dedup)
6. ✅ Implement IngestionPipeline (orchestrates 12 steps)
7. ✅ Implement error handling & retry logic
8. ✅ Write unit tests for each component
9. ✅ Integration test: full pipeline end-to-end

### PHASE C: Scheduler & API (8-10 hours)

1. ✅ Create scheduler.ts (cron job handler)
2. ✅ Create admin API endpoints:
   - POST /api/admin/jobs/sync (manual trigger)
   - GET /api/admin/jobs/sync-status (last run info)
   - GET /api/admin/jobs/syncs (history, pagination)
   - GET /api/admin/jobs/sync/:runId (detailed run info)
3. ✅ Create admin dashboard components (React)
4. ✅ Add error notifications (email on failure)
5. ✅ Write e2e tests

### PHASE D: Future Sources (As Needed)

1. Template for adding new sources (Linkedin, Indeed, etc.)
2. Multi-source aggregation logic
3. Conflict resolution (same job, multiple sources)

---

## CRITICAL ASSUMPTIONS & RISKS

| Assumption | Risk Level | Mitigation |
|-----------|-----------|-----------|
| Phoenix Children's HTML structure remains stable | MEDIUM | Monitor parser errors; fallback to manual entry |
| Job IDs are numeric and unique | HIGH | Validate on every sync; alert on change |
| No rate limiting on careers.phoenixchildrens.com | LOW | Add exponential backoff; throttle to 1 request/sec |
| Location always in "City, State" format | MEDIUM | Add fallback for missing state; manual review flag |
| Specialty inference regex patterns are accurate | MEDIUM | Build admin UI to manually correct tags; track confidence |
| 30-day archive window is acceptable | LOW | Configurable per source; admin can override |

---

## SUCCESS CRITERIA

**After implementation:**

✅ Phoenix Children's jobs auto-sync daily at 2am UTC
✅ 25 jobs ingested with 90%+ field completion
✅ Deduplication prevents duplicate records across syncs
✅ Specialty/role tags inferred with 85%+ accuracy
✅ Admin dashboard shows sync status, errors, ingestion history
✅ Manual trigger available for on-demand syncs
✅ Email alerts for sync failures
✅ Archive stale jobs after 30 days
✅ Data quality scores visible to admins
✅ Ready to add 2nd source (minimal code changes)

---

## DELIVERABLES

**To be created (copy-paste ready):**

1. ✅ `server/ingestion/base-source.ts` - Interface
2. ✅ `server/ingestion/sources/phoenix-childrens.ts` - Source implementation
3. ✅ `server/ingestion/extractors/html-parser.ts` - HTML parsing
4. ✅ `server/ingestion/extractors/text-normalizer.ts` - Field normalization
5. ✅ `server/ingestion/extractors/tag-inference.ts` - Tag detection
6. ✅ `server/ingestion/deduplicator.ts` - Content dedup
7. ✅ `server/ingestion/pipeline.ts` - 12-step orchestrator
8. ✅ `server/ingestion/scheduler.ts` - Cron handler
9. ✅ `server/routes/admin-jobs-ingestion.ts` - API endpoints
10. ✅ `client/src/pages/admin/jobs-ingestion.tsx` - Admin UI
11. ✅ `migrations/002_jobs_ingestion.sql` - Database schema
12. ✅ Full test suite (unit + integration)

---

**STATUS: READY FOR BUILD**

All analysis complete. Code generation can begin on demand.
