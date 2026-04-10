# Jobs Ingestion Build Pack — Corrected Schema & MVP Scope

**Date:** April 9, 2026
**Status:** PRE-BUILD CORRECTION MODE (NOT production code yet)
**Output Format:** Implementation-grade specs only

---

## 1. SOURCE_TRUTH_CHECK

**Verification of Phoenix Children's Posting IDs**

```json
[
  {
    "posting_id": "973964",
    "title": null,
    "verified": false,
    "url": "https://careers.phoenixchildrens.com/Posting/973964",
    "error": "An Error Has Occurred",
    "note": "Posting may be archived or removed from source"
  },
  {
    "posting_id": "1003185",
    "title": null,
    "verified": false,
    "url": "https://careers.phoenixchildrens.com/Posting/1003185",
    "error": "An Error Has Occurred",
    "note": "Posting may be archived or removed from source"
  },
  {
    "posting_id": "1003178",
    "title": null,
    "verified": false,
    "url": "https://careers.phoenixchildrens.com/Posting/1003178",
    "error": "An Error Has Occurred",
    "note": "Posting may be archived or removed from source"
  }
]
```

**Interpretation:**
- Direct posting verification FAILED for all three IDs
- Earlier audit extracted 10 sample jobs with titles (e.g., "Clinical Nurse - Acute Care Float Pool", "Director, Nursing Research & Innovation")
- RISK: Those samples may be stale OR posting ID format may have changed
- ACTION: Verify listing page still works and extract fresh sample in Phoenix MVP verifier phase

---

## 2. POSTGRES_SAFE_SCHEMA

**Valid PostgreSQL DDL (no invalid grouped syntax)**

```sql
-- ============= MODIFY EXISTING TABLE =============
-- (Assumes job_listings table exists in production)

ALTER TABLE job_listings ADD COLUMN source_name VARCHAR(50);
ALTER TABLE job_listings ADD COLUMN source_job_id VARCHAR(50);
ALTER TABLE job_listings ADD COLUMN source_url TEXT;
ALTER TABLE job_listings ADD COLUMN source_type VARCHAR(20);
ALTER TABLE job_listings ADD COLUMN source_content_hash VARCHAR(64);
ALTER TABLE job_listings ADD COLUMN last_synced_at TIMESTAMP;
ALTER TABLE job_listings ADD COLUMN first_seen_at TIMESTAMP DEFAULT NOW();
ALTER TABLE job_listings ADD COLUMN last_seen_at TIMESTAMP DEFAULT NOW();
ALTER TABLE job_listings ADD COLUMN sync_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE job_listings ADD COLUMN location_raw TEXT;
ALTER TABLE job_listings ADD COLUMN location_city VARCHAR(100);
ALTER TABLE job_listings ADD COLUMN location_state VARCHAR(50);
ALTER TABLE job_listings ADD COLUMN location_postal_code VARCHAR(10);
ALTER TABLE job_listings ADD COLUMN is_remote BOOLEAN DEFAULT FALSE;
ALTER TABLE job_listings ADD COLUMN normalized_specialty_id INTEGER REFERENCES job_specialties(id);
ALTER TABLE job_listings ADD COLUMN normalized_role_level VARCHAR(50);
ALTER TABLE job_listings ADD COLUMN data_quality_score INTEGER DEFAULT 0;
ALTER TABLE job_listings ADD COLUMN manual_review_required BOOLEAN DEFAULT FALSE;

-- Create unique constraint for source deduplication
ALTER TABLE job_listings ADD UNIQUE (source_name, source_job_id);

-- ============= NEW TABLE: job_specialties =============

CREATE TABLE IF NOT EXISTS job_specialties (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============= NEW TABLE: job_ingestion_runs =============

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
  duration_seconds INTEGER
);

-- ============= NEW TABLE: job_source_pages =============

CREATE TABLE IF NOT EXISTS job_source_pages (
  id SERIAL PRIMARY KEY,
  source_name VARCHAR(50) NOT NULL,
  page_url TEXT NOT NULL,
  page_hash VARCHAR(64),
  fetched_at TIMESTAMP DEFAULT NOW(),
  job_count INTEGER,
  status VARCHAR(20),
  UNIQUE (source_name, page_url)
);

-- ============= NEW TABLE: job_tags =============

CREATE TABLE IF NOT EXISTS job_tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============= NEW TABLE: job_tag_map =============

CREATE TABLE IF NOT EXISTS job_tag_map (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES job_tags(id) ON DELETE CASCADE,
  confidence_score DECIMAL(3,2),
  inferred_from VARCHAR(50),
  UNIQUE (job_id, tag_id)
);

-- ============= INDEXES (PERFORMANCE) =============

CREATE INDEX idx_job_listings_source ON job_listings(source_name, source_job_id);
CREATE INDEX idx_job_listings_content_hash ON job_listings(source_content_hash);
CREATE INDEX idx_job_listings_active_specialty ON job_listings(is_active, normalized_specialty_id);
CREATE INDEX idx_job_listings_posted_date ON job_listings(posted_date DESC);
CREATE INDEX idx_job_listings_location ON job_listings(location_city, location_state);
CREATE INDEX idx_job_listings_last_synced ON job_listings(last_synced_at DESC);
CREATE INDEX idx_job_listings_last_seen ON job_listings(last_seen_at DESC);
CREATE INDEX idx_job_ingestion_runs_source_date ON job_ingestion_runs(source_name, started_at DESC);
CREATE INDEX idx_job_source_pages_source ON job_source_pages(source_name, fetched_at DESC);
CREATE INDEX idx_job_tag_map_job_id ON job_tag_map(job_id);
CREATE INDEX idx_job_tag_map_tag_id ON job_tag_map(tag_id);

-- ============= SEED DATA =============

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

INSERT INTO job_tags (name, category) VALUES
  -- Specialty
  ('Critical Care', 'specialty'),
  ('ICU', 'specialty'),
  ('PICU', 'specialty'),
  ('NICU', 'specialty'),
  ('Emergency', 'specialty'),
  ('Operating Room', 'specialty'),
  ('Oncology', 'specialty'),
  ('Pediatrics', 'specialty'),
  -- Role level
  ('Clinical Nurse', 'role'),
  ('Charge Nurse', 'role'),
  ('Nursing Manager', 'role'),
  ('Nursing Director', 'role'),
  ('Educator', 'role'),
  ('Researcher', 'role'),
  ('Float Pool', 'role'),
  -- Shift
  ('Day Shift', 'shift'),
  ('Night Shift', 'shift'),
  ('Rotating Shift', 'shift'),
  ('On-Call', 'shift'),
  -- Experience
  ('Entry Level', 'experience'),
  ('Mid-Level', 'experience'),
  ('Senior', 'experience'),
  ('Leadership', 'experience'),
  -- Employment
  ('Full-Time', 'employment'),
  ('Part-Time', 'employment'),
  ('Contract', 'employment'),
  ('Per Diem', 'employment')
ON CONFLICT (name) DO NOTHING;
```

---

## 3. CANONICAL_FIELD_MODEL

**Exact field definitions for job_listings**

| Field | Type | Source/Raw/Normalized | Required? | Notes |
|-------|------|----------------------|-----------|-------|
| id | SERIAL | — | Yes | Primary key, auto-generated |
| title | TEXT | Source | Yes | Job title as-is from source |
| employer_id | INTEGER | Normalized | Yes | FK to employers table |
| description | TEXT | Source | Yes | Full job description (HTML or plain text) |
| responsibilities | TEXT | Source | No | Role responsibilities |
| requirements | TEXT | Source | No | Job requirements |
| benefits | TEXT | Source | No | Compensation/benefits |
| location | TEXT | Source | No | DEPRECATED; use location_raw/city/state instead |
| location_raw | TEXT | Source | No | Original location string from source (preserve exactly) |
| location_city | TEXT | Normalized | No | Extracted city from location_raw |
| location_state | TEXT | Normalized | No | Extracted state from location_raw |
| location_postal_code | TEXT | Normalized | No | ZIP code if available |
| is_remote | BOOLEAN | Normalized | No | TRUE if 100% remote; FALSE for on-site/hybrid |
| job_type | TEXT | Normalized | No | Full-time, Part-time, Contract, Per Diem (standardized enum) |
| work_arrangement | TEXT | Normalized | No | On-site, Remote, Hybrid |
| specialty | TEXT | Source | No | DEPRECATED; use normalized_specialty_id instead |
| normalized_specialty_id | INTEGER | Normalized | No | FK to job_specialties table (e.g., ICU, PICU, Oncology) |
| normalized_role_level | VARCHAR(50) | Normalized | No | Clinical Nurse, Charge Nurse, Manager, Director (standardized) |
| experience_level | TEXT | Normalized | No | Entry, Mid, Senior |
| education_required | TEXT | Source | No | Degree requirements |
| certification_required | TEXT[] | Normalized | No | Array of required certifications (RN, BSN, etc.) |
| shift_type | TEXT | Normalized | No | Day, Night, Rotating, On-Call |
| salary_min | DECIMAL(10,2) | Source | No | Minimum salary (if disclosed) |
| salary_max | DECIMAL(10,2) | Source | No | Maximum salary (if disclosed) |
| salary_period | TEXT | Normalized | No | annual, hourly, per_shift |
| application_url | TEXT | Source | No | Direct link to apply |
| contact_email | TEXT | Source | No | Contact email (lowercase, trimmed) |
| source_name | VARCHAR(50) | Source metadata | No | Source system: 'phoenixchildrens', 'nursing-rocks-manual', etc. |
| source_job_id | VARCHAR(50) | Source metadata | No | External job ID from source system |
| source_url | TEXT | Source metadata | No | Original posting URL from source |
| source_type | VARCHAR(20) | Source metadata | No | 'ATS', 'manual', 'API', 'scraped' |
| source_content_hash | VARCHAR(64) | Source metadata | No | SHA256 hash of description (for dedup detection) |
| last_synced_at | TIMESTAMP | Source metadata | No | Last time this job was updated from source |
| first_seen_at | TIMESTAMP | Source metadata | No | When job first appeared in ingestion system |
| last_seen_at | TIMESTAMP | Source metadata | No | Last time job was observed in source (for stale detection) |
| sync_status | VARCHAR(20) | Source metadata | No | 'active', 'stale', 'archived' |
| is_featured | BOOLEAN | Manual | No | Featured on home page (manual flag) |
| is_active | BOOLEAN | Manual | No | NOT soft-deleted |
| posted_date | TIMESTAMP | Source | No | When job was posted at source |
| expiry_date | TIMESTAMP | Source | No | When posting expires (if provided) |
| views_count | INTEGER | Tracked | No | View count on platform |
| applications_count | INTEGER | Tracked | No | Application count on platform |
| is_approved | BOOLEAN | Manual | No | Admin approval for public visibility |
| approved_by | INTEGER | Manual | No | FK to users (admin who approved) |
| approved_at | TIMESTAMP | Manual | No | When approved by admin |
| approval_notes | TEXT | Manual | No | Admin notes on approval |
| data_quality_score | INTEGER | Calculated | No | 0-100 score: percentage of fields populated |
| manual_review_required | BOOLEAN | Manual | No | TRUE if parser had low confidence or missing data |

---

## 4. DEDUPE_POLICY

**Exact rules for deduplication and archival**

### Hard Unique Match (Primary Key)

```
UNIQUE (source_name, source_job_id)

Definition: Any job with same source_name AND source_job_id is the same posting.
Behavior: On ingestion, if (source_name, source_job_id) already exists:
  - Check if source_content_hash changed
  - If changed: UPDATE existing record (update updated_at, last_seen_at, sync_status='active')
  - If unchanged: SKIP (mark as skipped in ingestion_run log)
  - If not found in source on next sync: do NOT immediately delete; use archival grace period
```

### Soft Duplicate Match (Detection)

```
Use BOTH:
  1. source_content_hash comparison (primary)
  2. title + employer + location similarity (fallback)

Detection scenario: Same job posted to multiple sources OR source reposted job with new ID

Trigger check: After normalization, before UPSERT
  - Calculate source_content_hash = SHA256(description)
  - Query: SELECT id FROM job_listings WHERE source_content_hash = hash AND source_name = source_name
  - If found AND (source_job_id is NULL or differs):
    → Log as soft duplicate
    → Check title similarity (edit distance > 80%)
    → Check employer match AND location match
    → If all match: flag for admin review (manual_review_required = TRUE)
    → Store both records but mark second as lower priority
```

### Content Change Update

```
Condition: Record exists with same (source_name, source_job_id), but content_hash differs

Behavior:
  - UPDATE job_listings SET
      description = new_description,
      requirements = new_requirements,
      benefits = new_benefits,
      location_raw = new_location_raw,
      location_city = new_city,
      location_state = new_state,
      normalized_specialty_id = recalculated_specialty,
      normalized_role_level = recalculated_role,
      source_content_hash = new_hash,
      last_synced_at = NOW(),
      last_seen_at = NOW(),
      sync_status = 'active',
      data_quality_score = recalculated_score,
      updated_at = NOW()
    WHERE source_name = source_name AND source_job_id = source_job_id
  - Log to ingestion_runs: jobs_updated += 1
  - Recalculate tags/specialties (update job_tag_map)
```

### Removed-Job Archival Grace Period

```
Archival window: CONFIGURABLE, default 14–30 days (recommend 21 days)

Process:
  1. On every successful sync, UPDATE last_seen_at = NOW() for all observed jobs

  2. After sync completes, query for stale jobs:
     SELECT id FROM job_listings
     WHERE source_name = source_name
       AND last_seen_at < NOW() - INTERVAL '21 days'
       AND sync_status != 'archived'

  3. For each stale job:
     - UPDATE job_listings SET
         is_active = FALSE,
         sync_status = 'archived',
         archived_at = NOW()
       WHERE id = job_id
     - Log to ingestion_runs: jobs_archived += 1

  4. Admin override: If job should be kept despite stale status:
     - Admin can manually set last_seen_at to NOW() to reset timer
     - OR admin can set is_active = TRUE (resurrect)

Rationale: Jobs may reappear; 21-day grace period catches transient removals while not holding stale data forever.
```

---

## 5. PHOENIX_MVP_BUILD_SCOPE

**Smallest safe MVP to validate ingestion before full build**

### Phase 0: Schema & Utilities (Must-Do First)

**Files to create:**
```
migrations/
  └─ 002_jobs_ingestion.sql          (schema changes from Section 2)

server/
  ├─ ingestion/
  │  ├─ types.ts                     (TypeScript interfaces for job data, ingestion results)
  │  ├─ hash.ts                      (SHA256 content_hash utility)
  │  └─ normalizer.ts                (location split, job_type standardization)
  └─ storage/
     └─ ingestion-db.ts              (database insert/update functions)

shared/
  └─ schema.ts                       (update jobListings & add new table definitions)
```

**Files to modify:**
```
.env.example                          (add INGESTION_GRACE_PERIOD_DAYS=21)
db.ts                                 (no changes; uses schema from shared/)
```

### Phase 1: Source Verifier (BEFORE pipeline)

**Files to create:**
```
server/
  └─ ingestion/
     └─ sources/
        ├─ base-source.ts            (abstract interface)
        └─ phoenix-childrens-verifier.ts
```

**What it does (NOT full pipeline):**
```
1. Fetch listing page: https://careers.phoenixchildrens.com/Positions/Nursing-jobs
2. Parse <article> count
3. Extract 5 sample job IDs
4. Fetch 3 detail pages (try: 528801, 912597, 1003511)
5. Extract title, department, location from each
6. Print results (NO database writes)
7. Report: "✓ Parser works" OR "✗ Structure changed, needs fix"

CLI usage: node -e 'import { verifyPhoenixSource } from "./server/ingestion/sources/phoenix-childrens-verifier"; verifyPhoenixSource()'
```

**Success criteria:**
- 5 job IDs extracted
- 3 detail pages fetch successfully
- At least 90% of expected fields present
- Output matches what was in previous IMPLEMENTATION_ARTIFACTS samples

### Phase 2: Single-Source MVP Pipeline

**Files to create:**
```
server/
  └─ ingestion/
     ├─ sources/
     │  └─ phoenix-childrens.ts      (full extraction, 12-step pipeline)
     ├─ pipeline.ts                  (12-step orchestrator)
     ├─ deduplicator.ts              (content_hash checks)
     └─ scheduler.ts                 (cron handler: runs once per day)

server/routes.ts                      (add 2 endpoints below)

client/src/pages/admin/
  └─ jobs-ingestion-status.tsx       (status UI)
```

**API endpoints to add:**
```
POST /api/admin/jobs/sync
  Requires: Admin token (requireAdminToken)
  Body: { source: 'phoenixchildrens' }
  Returns: { ingestion_run_id, started_at }
  Action: Triggers immediate sync; returns run ID for polling

GET /api/admin/jobs/sync/:runId
  Returns: { id, source_name, started_at, completed_at, status, jobs_fetched, jobs_inserted, jobs_updated, error_log }
  Action: Poll to check status
```

**Scheduler:**
```
Cron: Every day at 02:00 UTC
  - Trigger phoenix ingestion
  - Log to job_ingestion_runs
  - On failure: email admin@nursingrocksconcerts.com with error_log
```

**What it does:**
- Fetch listing page
- Parse 25 jobs
- Fetch detail pages (parallel, 3-sec timeout, 2x retry)
- Normalize fields (location split, job_type standardize)
- Check dedup (hash + (source, source_job_id))
- Upsert to database
- Archive stale jobs (21-day grace)
- Log to job_ingestion_runs
- Update admin status UI

**Success criteria:**
- 20+ jobs inserted on first sync
- Second sync: 0 jobs inserted, jobs updated from changed content_hash
- Third sync 22 days later: jobs marked archived
- Admin can see status in UI

### Phase 3: Tag Inference & Manual Review Queue (AFTER Phase 2 is stable)

NOT in MVP. Do after Phase 2 passes.

---

## 6. STOPLIGHT_RISKS

**Risk assessment by component**

| Component | Status | Notes | Mitigation |
|-----------|--------|-------|-----------|
| **Schema Changes** | 🟡 YELLOW | Syntax corrected but migration testing not yet done | Run migrations on staging first; test rollback |
| **Phoenix Listing Page Fetch** | 🟢 GREEN | Static HTML confirmed; no JS rendering needed | Monitor page_hash changes; alert on structure drift |
| **Phoenix Detail Page Fetch** | 🟡 YELLOW | Known postings (973964, 1003185, 1003178) not accessible; may be archived or ID format changed | Run verifier first; extract fresh samples; confirm extractor works on 5 current jobs |
| **Field Extraction & Parsing** | 🟡 YELLOW | Text-based regex patterns work in theory; real-world edge cases (missing fields, malformed data) unknown | Verifier phase will expose; add fallback for missing fields; manual_review_required flag catches suspicious data |
| **Location Normalization** | 🟡 YELLOW | "Phoenix, Arizona" format assumption; some postings may lack state or use abbreviations | Use location_raw to preserve original; have verifier check 5 samples; add regex patterns for common variations |
| **Deduplication Hash** | 🟢 GREEN | SHA256 is standard; collision risk negligible | Monitor collision_count in logs; alert if > 5 in single run |
| **Archival Grace Period** | 🟢 GREEN | 21-day window is configurable; soft delete via is_active flag | Admins can override; no hard deletions; recoverable |
| **Database Indexes** | 🟢 GREEN | Index names follow pattern; syntax validated | Run EXPLAIN ANALYZE on queries before/after to confirm performance |
| **Scheduler (Cron)** | 🟡 YELLOW | Assumes Node.js cron available; no external scheduler (like AWS EventBridge) | Use node-cron; ensure database connection survives full sync; test on staging |
| **Admin API Endpoints** | 🟢 GREEN | Simple GET/POST; standard REST pattern | Requires admin token; rate limit if needed |
| **Admin Status UI** | 🟡 YELLOW | React component not yet built; depends on API contracts | Build after API endpoints finalized; mock data for testing |
| **Error Handling & Email** | 🟡 YELLOW | Email on failure assumes SMTP configured; no retry logic if email fails | Check SMTP config before deploy; treat email as non-blocking (log error, don't crash sync) |
| **Data Quality Score Calculation** | 🟡 YELLOW | Logic for scoring % fields filled not yet defined | Define in normalizer: count non-null fields / total required fields |
| **Manual Review Queue** | 🟢 GREEN | Not in MVP; flag set, but no UI yet | Build review UI in Phase 3 |
| **Posting ID Format Change** | 🔴 RED | Earlier samples may be stale; direct verification failed | Run verifier phase FIRST before committing to extraction logic; if format changed, entire pipeline needs rework |
| **Phoenix Site Rate Limiting** | 🟡 YELLOW | Unknown if site has rate limits; no evidence yet | Add throttle: 1 request/sec; monitor HTTP 429; implement exponential backoff |

---

## BUILD SEQUENCE (Strict Order)

```
1. SCHEMA CORRECTIONS
   - Run migrations/002_jobs_ingestion.sql on staging
   - Update shared/schema.ts with Drizzle definitions
   - Test schema changes on dev database
   - Verify rollback process

2. SOURCE VERIFIER
   - Build phoenix-childrens-verifier.ts
   - Run: fetch listing → parse articles → fetch 3 detail pages
   - Confirm field extraction works on current jobs
   - If fails: stop and investigate Phoenix site changes before proceeding

3. SINGLE-SOURCE MVP
   - Build hash.ts, normalizer.ts, deduplicator.ts
   - Build phoenix-childrens.ts source (full 12-step pipeline)
   - Build pipeline.ts orchestrator
   - Build scheduler.ts cron handler
   - Add API endpoints to routes.ts
   - Write unit tests for each component
   - Write integration test: full pipeline end-to-end on staging DB

4. ADMIN UI
   - Build jobs-ingestion-status.tsx
   - Wire to GET /api/admin/jobs/sync/:runId
   - Add to admin dashboard navigation
   - Test polling behavior

5. STAGING VALIDATION
   - Deploy to staging
   - Manual trigger sync via API
   - Verify 20+ jobs inserted
   - Verify second sync: 0 new, 0 updated (unchanged content)
   - Simulate stale job archival (manually set last_seen_at)
   - Verify error handling (kill HTTP mid-request, check retry logic)
   - Run cron job manually; verify schedule works

6. PRODUCTION DEPLOYMENT
   - After staging passes all tests
   - Run migrations
   - Deploy code
   - Monitor first 3 syncs (24h, 48h, 72h)
   - Check error logs daily for 1 week

7. TAG INFERENCE (LATER)
   - Not in MVP; do after ingestion is stable
   - Build tag-inference.ts
   - Add specialty/role inference rules
   - Build manual review queue UI
   - Deploy as Phase 2

```

---

## IMPLEMENTATION GUARD RAILS

**Before code generation, confirm:**

```
✓ Posting verification phase passes (verifier.ts shows parser works on current jobs)
✓ Schema migration tested on staging (no rollback failures)
✓ Error handling prevents database corruption (no orphaned ingestion_runs)
✓ Dedup logic confirmed (hard unique + soft hash match)
✓ Archive grace period set (21 days default, configurable)
✓ Admin endpoints require token (no public access to sync triggers)
✓ Cron job has email failure alert (ops team notified if sync fails)
```

**If any condition fails:** STOP before moving to next phase.

---

**STATUS: READY FOR PHASE 0 (Schema Migration)**

Build pack validated. Proceed to schema corrections and Phoenix verifier before full MVP build.
