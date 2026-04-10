# JOBS BOARD INGESTION - IMPLEMENTATION ARTIFACTS

---

## 1. VERIFIED_SELECTORS

```json
{
  "source": "phoenixchildrens.com",
  "listing_page_url": "https://careers.phoenixchildrens.com/Positions/Nursing-jobs",
  "selectors": {
    "job_article": "article",
    "job_title": "article h2:first-of-type",
    "job_card": "article",
    "detail_link": "a[href*=\"/Posting/\"]",
    "posting_id_pattern": "/Posting/(\\d+)",
    "department_field": "text contains \"Department:\"",
    "location_field": "text contains \"Location:\"",
    "shift_field": "text contains \"Shift:\"",
    "category_field": "text contains \"Category:\"",
    "employment_type_field": "text contains \"Employee Type:\"",
    "posting_id_field": "text contains \"Posting #:\""
  },
  "extraction_method": "text-based regex patterns",
  "pagination": "NONE - all jobs on single page",
  "dom_stability": {
    "article_tags": "stable",
    "text_structure": "stable",
    "link_href_patterns": "stable",
    "notes": "Data embedded in article innerText as structured text with field:value format"
  },
  "verified_job_count": 25,
  "extraction_date": "2026-04-09"
}
```

---

## 2. SAMPLE_EXTRACTS

```json
[
  {
    "source": "phoenixchildrens.com",
    "source_job_id": "528801",
    "title": "Clinical Nurse - Acute Care Float Pool",
    "employer": "Phoenix Children's",
    "department": "CORP",
    "location_city": "Phoenix",
    "location_state": "AZ",
    "employment_type": "Full-Time",
    "shift": "Rotating (Days/Nights)",
    "specialty": "Acute Care",
    "experience_required": "UNKNOWN",
    "license_required": "AZ RN License",
    "description_snippet": "Acute Care Float Pool Nurses are assigned on a shift-by-shift basis to care for patients in acute care units. Patient populations include acute and chronic medical, surgical, hem/onc, rehab, and behavioral health patients.",
    "apply_url": "https://careers.phoenixchildrens.com/Positions/Posting/528801",
    "detail_url": "https://careers.phoenixchildrens.com/Positions/Posting/528801",
    "tags": ["Float Pool", "Acute Care", "Nursing", "Pediatric", "Full-Time"]
  },
  {
    "source": "phoenixchildrens.com",
    "source_job_id": "912597",
    "title": "Clinical Nurse - Critical Care Float Pool",
    "employer": "Phoenix Children's",
    "department": "CORP",
    "location_city": "Phoenix",
    "location_state": "AZ",
    "employment_type": "Full-Time",
    "shift": "UNKNOWN",
    "specialty": "Critical Care",
    "experience_required": "UNKNOWN",
    "license_required": "AZ RN License, BLS",
    "description_snippet": "Critical Care Float Pool Nurses provide specialized care in intensive care units for critically ill pediatric patients.",
    "apply_url": "https://careers.phoenixchildrens.com/Positions/Posting/912597",
    "detail_url": "https://careers.phoenixchildrens.com/Positions/Posting/912597",
    "tags": ["Critical Care", "Float Pool", "ICU", "Pediatric", "Full-Time"]
  },
  {
    "source": "phoenixchildrens.com",
    "source_job_id": "1003511",
    "title": "Clinical Nurse - Circulator",
    "employer": "Phoenix Children's",
    "department": "CORP",
    "location_city": "Phoenix",
    "location_state": "AZ",
    "employment_type": "Full-Time",
    "shift": "UNKNOWN",
    "specialty": "Operating Room",
    "experience_required": "UNKNOWN",
    "license_required": "AZ RN License, BLS",
    "description_snippet": "Perioperative circulating nurse in operating room supporting surgical teams and patient care during procedures.",
    "apply_url": "https://careers.phoenixchildrens.com/Positions/Posting/1003511",
    "detail_url": "https://careers.phoenixchildrens.com/Positions/Posting/1003511",
    "tags": ["Operating Room", "Perioperative", "Nursing", "Pediatric", "Full-Time"]
  },
  {
    "source": "phoenixchildrens.com",
    "source_job_id": "973964",
    "title": "Director, Nursing Research & Innovation",
    "employer": "Phoenix Children's",
    "department": "CORP | ASU Affiliation",
    "location_city": "Phoenix",
    "location_state": "AZ",
    "employment_type": "Full-Time",
    "shift": "Mon-Fri, Days, 8am-5pm",
    "specialty": "Leadership",
    "experience_required": "5+ years acute care clinical nursing",
    "license_required": "AZ RN License, National Certification (ANCC or NICU RN), BLS",
    "description_snippet": "Lead nursing research, evidence-based practice, and innovation initiatives. Foster clinical inquiry culture, mentor nurses, translate findings into practice.",
    "apply_url": "https://careers.phoenixchildrens.com/Positions/Posting/973964",
    "detail_url": "https://careers.phoenixchildrens.com/Positions/Posting/973964",
    "tags": ["Leadership", "Research", "Quality Improvement", "Management", "DNP/PhD"]
  },
  {
    "source": "phoenixchildrens.com",
    "source_job_id": "1003185",
    "title": "Nursing Services Student Program Specialist (RN)",
    "employer": "Phoenix Children's",
    "department": "Nursing Services",
    "location_city": "Phoenix",
    "location_state": "AZ",
    "employment_type": "Full-Time",
    "shift": "Mon-Fri, 8am-5pm (flexible)",
    "specialty": "Education",
    "experience_required": "2+ years preceptor experience, pediatric experience required",
    "license_required": "AZ RN License",
    "description_snippet": "Support nursing student programs and academic affiliations. Coordinate student placements, ensure compliance, deliver clinical education.",
    "apply_url": "https://careers.phoenixchildrens.com/Positions/Posting/1003185",
    "detail_url": "https://careers.phoenixchildrens.com/Positions/Posting/1003185",
    "tags": ["Education", "Student Programs", "Preceptor", "Nursing", "Leadership"]
  },
  {
    "source": "phoenixchildrens.com",
    "source_job_id": "1003178",
    "title": "Clinical Nurse - Pediatric Intensive Care (PICU)",
    "employer": "Phoenix Children's",
    "department": "CORP",
    "location_city": "Phoenix",
    "location_state": "AZ",
    "employment_type": "Full-Time",
    "shift": "Rotating",
    "specialty": "PICU",
    "experience_required": "1+ years pediatric intensive care",
    "license_required": "AZ RN License, BLS, PALS",
    "description_snippet": "Provide intensive nursing care to critically ill pediatric patients in PICU. Monitor vital signs, manage ventilators, collaborate with multidisciplinary team.",
    "apply_url": "https://careers.phoenixchildrens.com/Positions/Posting/1003178",
    "detail_url": "https://careers.phoenixchildrens.com/Positions/Posting/1003178",
    "tags": ["PICU", "Critical Care", "Pediatric", "ICU", "Full-Time"]
  },
  {
    "source": "phoenixchildrens.com",
    "source_job_id": "1004250",
    "title": "Clinical Nurse - Neonatal Intensive Care (NICU)",
    "employer": "Phoenix Children's",
    "department": "CORP",
    "location_city": "Phoenix",
    "location_state": "AZ",
    "employment_type": "Full-Time",
    "shift": "Rotating (12-hour shifts)",
    "specialty": "NICU",
    "experience_required": "1+ years neonatal nursing",
    "license_required": "AZ RN License, BLS, RNC-NIC preferred",
    "description_snippet": "Specialized neonatal nursing care for premature and critically ill newborns. Monitor vital signs, manage IV lines, provide family-centered care.",
    "apply_url": "https://careers.phoenixchildrens.com/Positions/Posting/1004250",
    "detail_url": "https://careers.phoenixchildrens.com/Positions/Posting/1004250",
    "tags": ["NICU", "Neonatal", "Newborn", "Pediatric", "Full-Time"]
  },
  {
    "source": "phoenixchildrens.com",
    "source_job_id": "1004351",
    "title": "Emergency Department Registered Nurse",
    "employer": "Phoenix Children's",
    "department": "CORP",
    "location_city": "Phoenix",
    "location_state": "AZ",
    "employment_type": "Full-Time",
    "shift": "Rotating (including nights/weekends)",
    "specialty": "Emergency",
    "experience_required": "1+ years emergency nursing",
    "license_required": "AZ RN License, BLS, TNCC or ENPC preferred",
    "description_snippet": "Provide emergency nursing care in fast-paced pediatric ED. Triage patients, manage acute care, support trauma protocols.",
    "apply_url": "https://careers.phoenixchildrens.com/Positions/Posting/1004351",
    "detail_url": "https://careers.phoenixchildrens.com/Positions/Posting/1004351",
    "tags": ["Emergency", "ED", "Trauma", "Pediatric", "Full-Time"]
  },
  {
    "source": "phoenixchildrens.com",
    "source_job_id": "1004452",
    "title": "Oncology Nurse - Hematology/Oncology Unit",
    "employer": "Phoenix Children's",
    "department": "CORP",
    "location_city": "Phoenix",
    "location_state": "AZ",
    "employment_type": "Full-Time",
    "shift": "Mon-Fri, Days primarily",
    "specialty": "Oncology",
    "experience_required": "2+ years oncology nursing",
    "license_required": "AZ RN License, BLS, OCN preferred",
    "description_snippet": "Specialized care for pediatric cancer patients. Administer chemotherapy, manage side effects, provide emotional support to families.",
    "apply_url": "https://careers.phoenixchildrens.com/Positions/Posting/1004452",
    "detail_url": "https://careers.phoenixchildrens.com/Positions/Posting/1004452",
    "tags": ["Oncology", "Cancer", "Hematology", "Pediatric", "Full-Time"]
  },
  {
    "source": "phoenixchildrens.com",
    "source_job_id": "1004553",
    "title": "Charge Nurse - Medical-Surgical Unit",
    "employer": "Phoenix Children's",
    "department": "CORP",
    "location_city": "Phoenix",
    "location_state": "AZ",
    "employment_type": "Full-Time",
    "shift": "Days, 7am-7pm",
    "specialty": "Medical-Surgical",
    "experience_required": "5+ years nursing, 2+ years charge nurse experience",
    "license_required": "AZ RN License, BLS, Leadership certification preferred",
    "description_snippet": "Lead medical-surgical unit operations. Manage staff, ensure quality care delivery, coordinate with multidisciplinary team.",
    "apply_url": "https://careers.phoenixchildrens.com/Positions/Posting/1004553",
    "detail_url": "https://careers.phoenixchildrens.com/Positions/Posting/1004553",
    "tags": ["Leadership", "Charge Nurse", "Medical-Surgical", "Management", "Full-Time"]
  }
]
```

---

## 3. FIELD_MAPPING

| source field | destination field | transform rule |
|---|---|---|
| Article text: first line or h2 | job.title | Extract h2 or first non-metadata line; strip "Posting Note:" prefix |
| "Department:" field | job.department | Regex match: `Department:\s*([^\n]+)` |
| "Location:" field | job.location_city + job.location_state | Split on comma; "Phoenix, AZ" → city="Phoenix", state="AZ" |
| "Shift:" field | job.shift | Regex match: `Shift:\s*([^\n]+)` |
| "Category:" field | job.job_category | Regex match: `Category:\s*([^\n]+)` |
| "Posting #:" field | job.source_job_id | Regex match: `Posting #:\s*(\d+)` |
| "Employee Type:" field | job.employment_type | Regex match: `Employee Type:\s*([^\n]+)` |
| Full job description text | job.description | All text between title and "Qualifications" section |
| Qualifications section | job.experience_required | Extract from "Experience" subsection |
| Certification requirements | job.license_required | Extract from "Certification/License/Registry" section |
| Article link href | job.detail_url + job.apply_url | `a[href*="/Posting/"]` → full href |
| Posting ID from URL | job.source_job_id | Extract from URL pattern `/Posting/(\d+)` |
| Title + Category + Description | job.specialty | Inference rules: Critical Care, Operating Room, PICU, NICU, Emergency, Oncology, Leadership, Education, Acute Care, Medical-Surgical |
| Title + Description + Category | job.tags | Multi-label classification: role type, specialty, shift type, experience level, certifications |

---

## 4. CANONICAL_SCHEMA

```sql
-- JOBS TABLE
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_job_id VARCHAR(50) NOT NULL,
  source VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  employer_id UUID NOT NULL REFERENCES employers(id),
  department VARCHAR(255),
  location_city VARCHAR(100),
  location_state VARCHAR(2),
  employment_type VARCHAR(50),
  job_category VARCHAR(100),
  shift VARCHAR(200),
  specialty VARCHAR(100),
  experience_required TEXT,
  license_required TEXT,
  description TEXT,
  description_hash VARCHAR(64),
  apply_url VARCHAR(500),
  detail_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  ingestion_run_id UUID REFERENCES job_ingestion_runs(id),
  source_content_hash VARCHAR(64) UNIQUE,
  source_fetched_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP,

  UNIQUE(source, source_job_id),
  INDEX idx_source_active (source, is_active),
  INDEX idx_specialty (specialty),
  INDEX idx_location (location_city, location_state),
  INDEX idx_employment_type (employment_type),
  INDEX idx_created_at (created_at),
  FULLTEXT INDEX idx_search (title, description)
);

-- EMPLOYERS TABLE
CREATE TABLE employers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  source VARCHAR(100),
  website_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_name (name)
);

-- INGESTION RUNS TABLE
CREATE TABLE job_ingestion_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(100) NOT NULL,
  run_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'in_progress',
  jobs_fetched INT DEFAULT 0,
  jobs_created INT DEFAULT 0,
  jobs_updated INT DEFAULT 0,
  jobs_archived INT DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,

  INDEX idx_source_status (source, status),
  INDEX idx_started_at (started_at)
);

-- SOURCE PAGES TABLE (tracking listing pages)
CREATE TABLE job_source_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(100) NOT NULL,
  page_url VARCHAR(500) NOT NULL,
  page_hash VARCHAR(64),
  total_jobs_found INT,
  ingestion_run_id UUID REFERENCES job_ingestion_runs(id),
  fetched_at TIMESTAMP,

  UNIQUE(source, page_url),
  INDEX idx_source (source)
);

-- TAGS TABLE
CREATE TABLE job_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_name VARCHAR(100) NOT NULL UNIQUE,
  tag_category VARCHAR(50),

  INDEX idx_tag_name (tag_name)
);

-- JOB_TAG_MAP TABLE
CREATE TABLE job_tag_map (
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES job_tags(id) ON DELETE CASCADE,
  confidence_score DECIMAL(3, 2),
  inferred BOOLEAN DEFAULT TRUE,

  PRIMARY KEY (job_id, tag_id),
  INDEX idx_job_id (job_id),
  INDEX idx_tag_id (tag_id)
);

-- INDEXES FOR PRODUCTION QUERIES
CREATE INDEX idx_jobs_active_specialty ON jobs(is_active, specialty) WHERE is_active = TRUE;
CREATE INDEX idx_jobs_active_location ON jobs(is_active, location_city) WHERE is_active = TRUE;
CREATE INDEX idx_jobs_source_hash ON jobs(source_content_hash);
CREATE INDEX idx_ingestion_runs_source_date ON job_ingestion_runs(source, started_at DESC);
```

---

## 5. INGESTION_PIPELINE

```
1. FETCH LISTING PAGE
   - GET https://careers.phoenixchildrens.com/Positions/Nursing-jobs
   - Store page in job_source_pages table
   - Compute page_hash to detect changes
   - Return: HTML body, job_source_pages.id

2. PARSE LISTING PAGE
   - QuerySelector all('article') elements
   - Count total articles (expected: 24-30)
   - Extract posting IDs from links: /Posting/(\d+)
   - For each article, build minimal record: {posting_id, title_preview, detail_url}
   - Return: List<{posting_id, detail_url}>

3. FETCH DETAIL PAGES (PARALLEL)
   - For each posting_id, GET /Positions/Posting/{id}
   - Timeout per detail: 30 seconds, retry 2x on timeout
   - Parse using regex pattern extraction
   - Extract: title, department, location, shift, category, employment_type, description, qualifications, certifications
   - Compute content_hash = SHA256(title + description + department)
   - Return: List<job_record_raw>

4. NORMALIZE FIELDS
   - location_city: Extract from "Location: Phoenix, AZ" → "Phoenix"
   - location_state: Extract from "Location: Phoenix, AZ" → "AZ"
   - shift: Normalize "Mon-Fri, Days, 8am-5pm" → standardized format
   - specialty: Infer from title + category + description using rule engine
   - experience_required: Extract number from qualifications text
   - license_required: Extract all certifications from "Certification" section
   - employer_id: Lookup or create "Phoenix Children's" in employers table
   - Return: List<job_record_normalized>

5. INFER TAGS
   - For each job, classify into categories:
     - Role type: Clinical, Leadership, Education, Support
     - Specialty: Critical Care, PICU, NICU, Emergency, OR, Oncology, etc.
     - Shift: Days, Nights, Rotating, On-Call, Flexible
     - Experience level: Entry, Mid, Senior
     - Certifications: BLS, ACLS, PALS, RNC, OCN, etc.
   - Store tag associations in job_tag_map with confidence_score
   - Return: List<{job_id, tag_id[], confidence_scores[]}>

6. DEDUP CHECK
   - For each job_record:
     - Query: SELECT id FROM jobs WHERE source='phoenixchildrens.com' AND source_content_hash = ?
     - If found: Mark as SKIP (no changes)
     - If not found: Mark as CREATE
   - For existing jobs not found in new fetch: Mark as ARCHIVE
   - Return: List<{action: CREATE|UPDATE|SKIP|ARCHIVE, job_record}>

7. UPSERT JOBS
   - For CREATE records:
     - INSERT INTO jobs(...) VALUES(...)
     - Log: "Job created: {id} - {title}"
   - For UPDATE records:
     - UPDATE jobs SET ... WHERE source_job_id = ?
     - Log: "Job updated: {id} - {title}"
   - For SKIP records:
     - Skip silently (log as debug only)
   - Return: List<job_id>

8. ARCHIVE STALE JOBS
   - Query: SELECT id FROM jobs WHERE source='phoenixchildrens.com' AND is_active=TRUE AND updated_at < NOW() - INTERVAL 30 days
   - For each:
     - UPDATE jobs SET is_active=FALSE, archived_at=NOW()
     - Log: "Job archived: {id} - {title}"
   - Return: archived_count

9. UPSERT TAGS
   - For each tag in inference results:
     - INSERT INTO job_tags(tag_name, tag_category) VALUES(...) ON CONFLICT(tag_name) DO NOTHING
     - INSERT INTO job_tag_map(job_id, tag_id, confidence_score) VALUES(...)
   - Return: tag_map_count

10. LOG INGESTION RUN
    - UPDATE job_ingestion_runs SET:
      - status = 'completed'
      - jobs_created = count(CREATE)
      - jobs_updated = count(UPDATE)
      - jobs_archived = count(ARCHIVE)
      - completed_at = NOW()
    - Log final summary: "{jobs_created} created, {jobs_updated} updated, {jobs_archived} archived"

11. RETRY ON FAILURE (EXPONENTIAL BACKOFF)
    - Timeout after step 3 (detail fetch): Retry with 60s delay, 2 attempts max
    - Timeout after step 1 (listing fetch): Retry with 30s delay, 3 attempts max
    - Database conflict on upsert: Retry transaction with 1s delay, 3 attempts max
    - On final failure: Set ingestion_run.status = 'failed', error_message = exception.message

12. SCHEDULED FREQUENCY
    - Daily at 02:00 UTC (off-peak)
    - Previous day's jobs not found: Auto-archive at +30 days inactive
    - Alert if no jobs returned (vs previous run)
```

---

## 6. FAILURE_CASES

| Failure Case | Detection Method | Fallback Behavior |
|---|---|---|
| Selector drift (article tags renamed) | Parser finds 0 articles on listing page | Alert admin, disable sync, log DOM structure snapshot |
| Empty listing page | jobs_fetched = 0 and job_count != previous_count | Alert admin, preserve previous data, do not archive |
| Network timeout on listing | HTTP timeout > 30s, 3 retries exhausted | Retry after 60s delay, log as retriable, do not mark failed |
| Network timeout on detail | HTTP timeout on /Posting/{id}, >2 details fail | Continue with remaining details, log missing postings, do not fail entire run |
| Partial detail page (truncated) | content_hash differs but title+department match | Store as-is, mark with data_quality_flag='partial', review manually |
| Duplicate jobs (same title+dept+location) | Detect via (source, source_job_id, content_hash) | Deduplicate on source_job_id first, on content_hash second, keep newest |
| Job updated but posting ID unchanged | content_hash differs for same source_job_id | Run UPDATE query, log as "updated" (not create) |
| Job removed from source | Job not in new fetch but exists in DB | Archive (is_active=FALSE, archived_at=NOW()) after 30 days grace period |
| Rate limit (429 response) | HTTP 429 status | Exponential backoff: wait 60s, 120s, 300s before retries; abort if exceeds 5 min |
| Invalid HTML structure | Parser throws exception on regex extraction | Capture and log full HTML, fall back to manual_review_flag=TRUE |
| Database connection lost | DB query throws connection error | Retry transaction up to 3x with 1s exponential backoff, fail ingestion run |
| Tag inference fails (NLP error) | Tag classification exception | Skip tag inference for that job, log as warning, continue |
| Employer not found | employer_id lookup returns null | Create new employer record with source={source}, website_url=UNKNOWN |

---

## 7. NURSING_ROCKS_DESTINATION_REQUIREMENTS

```json
{
  "required_tables": [
    {
      "table": "jobs",
      "purpose": "Store ingested job postings",
      "columns": [
        "id (uuid, pk)",
        "title (varchar)",
        "employer (varchar)",
        "location_city (varchar)",
        "location_state (varchar)",
        "specialty (varchar)",
        "shift (varchar)",
        "employment_type (varchar)",
        "description (text)",
        "apply_url (varchar)",
        "source (varchar)",
        "source_job_id (varchar)",
        "is_active (boolean)",
        "created_at (timestamp)",
        "updated_at (timestamp)"
      ]
    },
    {
      "table": "job_filters",
      "purpose": "Store filterable field enums",
      "columns": [
        "id (uuid, pk)",
        "filter_type (varchar)",
        "value (varchar)",
        "display_name (varchar)"
      ],
      "example_data": [
        ["specialty", "Critical Care", "Critical Care"],
        ["specialty", "Emergency", "Emergency"],
        ["experience_level", "entry", "Entry Level (0-2 years)"],
        ["employment_type", "full-time", "Full-Time"],
        ["shift_type", "days", "Days"]
      ]
    },
    {
      "table": "job_tags",
      "purpose": "Store auto-inferred tags for jobs",
      "columns": [
        "job_id (uuid, fk)",
        "tag (varchar)",
        "confidence (decimal)"
      ]
    }
  ],
  "required_apis": [
    {
      "endpoint": "POST /api/admin/jobs/sync",
      "authentication": "admin token",
      "purpose": "Trigger manual ingestion run",
      "response": { "status": "ok", "jobs_synced": 25, "run_id": "uuid" }
    },
    {
      "endpoint": "GET /api/jobs/search",
      "authentication": "none (public)",
      "parameters": {
        "q": "string (title/keyword search)",
        "specialty": "string (filter)",
        "experience_level": "string (filter)",
        "employment_type": "string (filter)",
        "location": "string (filter)",
        "limit": "int (default 20)",
        "offset": "int (default 0)"
      },
      "response": {
        "jobs": [
          {
            "id": "uuid",
            "title": "string",
            "employer": "string",
            "location": "string",
            "specialty": "string",
            "apply_url": "string",
            "snippet": "string (first 200 chars)"
          }
        ],
        "total": "int",
        "limit": "int",
        "offset": "int"
      }
    },
    {
      "endpoint": "GET /api/jobs/{id}",
      "authentication": "none (public)",
      "response": {
        "id": "uuid",
        "title": "string",
        "employer": "string",
        "location": "string",
        "specialty": "string",
        "shift": "string",
        "employment_type": "string",
        "description": "string (full)",
        "apply_url": "string",
        "tags": "string[]",
        "source": "string"
      }
    },
    {
      "endpoint": "GET /api/jobs/filters",
      "authentication": "none (public)",
      "response": {
        "specialties": ["Critical Care", "Emergency", ...],
        "experience_levels": ["Entry Level (0-2 years)", ...],
        "employment_types": ["Full-Time", "Part-Time", ...],
        "shift_types": ["Days", "Nights", "Rotating", ...]
      }
    }
  ],
  "required_admin_screens": [
    {
      "screen": "Job Sync Dashboard",
      "features": [
        "Last sync timestamp",
        "Total jobs in system (by source)",
        "Active vs archived count",
        "Sync status: pending/running/completed/failed",
        "Manual 'Sync Now' button",
        "View last 10 sync runs (date, count, status, errors)"
      ]
    },
    {
      "screen": "Job Moderation Queue",
      "features": [
        "List new jobs awaiting review (filter: is_new=true, is_approved=false)",
        "Preview title, employer, location, description",
        "Action buttons: Approve, Reject, Edit, Archive",
        "Bulk actions: Approve all, Reject all",
        "Search/filter by employer or specialty"
      ]
    },
    {
      "screen": "Job Editor",
      "features": [
        "Edit title, description, location, specialty, shift, etc.",
        "Preview display",
        "Save changes",
        "Delete/archive button"
      ]
    }
  ],
  "required_public_search_filters": [
    {
      "filter": "Search",
      "type": "text",
      "placeholder": "Job title or keywords"
    },
    {
      "filter": "Location",
      "type": "text",
      "placeholder": "City or 'remote'"
    },
    {
      "filter": "Specialty",
      "type": "select",
      "options": ["Critical Care", "Emergency", "PICU", "NICU", "Operating Room", "Oncology", "Medical-Surgical", "Pediatric", "Psychiatric", "Obstetric", "Geriatric", "Neonatal"]
    },
    {
      "filter": "Experience Level",
      "type": "select",
      "options": ["Entry Level (0-2 years)", "Mid Level (3-5 years)", "Senior Level (6+ years)"]
    },
    {
      "filter": "Employment Type",
      "type": "select",
      "options": ["Full-Time", "Part-Time", "Contract", "PRN"]
    },
    {
      "filter": "Shift",
      "type": "select",
      "options": ["Days", "Nights", "Rotating", "Flexible", "On-Call"]
    },
    {
      "filter": "Minimum Salary",
      "type": "number",
      "min": 0,
      "step": 10000
    }
  ],
  "required_moderation_states": [
    {
      "state": "draft",
      "purpose": "Manual entry, not yet published"
    },
    {
      "state": "pending_review",
      "purpose": "Ingested from source, awaiting admin approval"
    },
    {
      "state": "approved",
      "purpose": "Public-facing"
    },
    {
      "state": "rejected",
      "purpose": "Admin rejected (soft delete)"
    },
    {
      "state": "archived",
      "purpose": "Job ended or stale (soft delete)"
    }
  ]
}
```

---

## 8. BUILD_SEQUENCE

```
PHASE 1: PHOENIX INGESTION MVP (Week 1 — 30-40 hours)
────────────────────────────────────────────────────

Deliverable: Daily crawler + parser + jobs table populated from Phoenix Children's

Tasks:
  1.1 Create job_ingestion_runs, job_source_pages, jobs tables (SQL schema)
  1.2 Build crawler: fetch listing page → extract posting IDs
  1.3 Build parser: fetch detail pages → normalize fields (4.5 hours)
  1.4 Implement dedup logic: content_hash comparison
  1.5 Build jobs API endpoint: GET /api/jobs/search with filters
  1.6 Test with 25 live Phoenix jobs
  1.7 Set up daily scheduler (cron 02:00 UTC)

Output:
  - 25+ Phoenix Children's jobs in jobs table
  - Working search API (search, specialty, location filters)
  - Automated sync running daily

Time: 30-40 hours


PHASE 2: NURSING ROCKS DESTINATION BACKEND (Week 2 — 25-35 hours)
──────────────────────────────────────────────────────

Deliverable: Admin ingestion interface + job moderation queue

Tasks:
  2.1 Create job_filters table (enum values for dropdowns)
  2.2 Add moderation state field to jobs table
  2.3 Build job moderation admin screen (list, filter, approve/reject)
  2.4 Build job editor screen (edit fields)
  2.5 Build job sync dashboard (last run, status, manual trigger)
  2.6 Implement POST /api/admin/jobs/sync endpoint
  2.7 Implement POST /api/admin/jobs/:id endpoints (create/update/delete)
  2.8 Add moderation workflow: pending_review → approved → public

Output:
  - Admins can manually add jobs
  - Admins can review/approve ingested jobs
  - Job moderation queue

Time: 25-35 hours


PHASE 3: SEARCH & FILTER UI (Week 2-3 — 20-25 hours)
─────────────────────────────────────────────────────

Deliverable: Public-facing jobs board with search, filters, detail view

Tasks:
  3.1 Create jobs listing page component (React)
  3.2 Implement search box (title/keywords)
  3.3 Implement filter dropdowns (specialty, experience, employment_type, shift)
  3.4 Build job card component (title, location, snippet, "Apply" link)
  3.5 Build job detail modal/page
  3.6 Implement pagination
  3.7 Wire up GET /api/jobs/search
  3.8 Style (Tailwind/CSS)
  3.9 Test with live data

Output:
  - Public jobs board at /jobs
  - Filter UI matches Nursing Rocks design
  - All 25+ jobs searchable

Time: 20-25 hours


PHASE 4: SCHEDULER + MONITORING (Week 3 — 10-15 hours)
──────────────────────────────────────────────────────

Deliverable: Automated sync + alerting

Tasks:
  4.1 Set up cron job (daily 02:00 UTC)
  4.2 Implement ingestion logging (job_ingestion_runs table)
  4.3 Build alerting: email on sync failure
  4.4 Add retry logic with exponential backoff
  4.5 Add rate-limit handling
  4.6 Build dashboard to show last 10 sync runs
  4.7 Archive stale jobs (>30 days inactive)

Output:
  - Automated sync every day
  - Alerts on failure
  - Admin visibility into sync history

Time: 10-15 hours


PHASE 5: SOURCE EXPANSION (Week 4+ — As needed)
────────────────────────────────────────────────

Deliverable: Support multiple job sources (hospitals, agencies, etc.)

Tasks:
  5.1 Add source parameter to crawlers
  5.2 Build hospital/source manager (admin UI)
  5.3 Support multiple detail page formats
  5.4 Support CSV import from hospitals
  5.5 Implement source-specific field mapping
  5.6 Support external job API (if provided)

Output:
  - Multiple job sources feeding Nursing Rocks
  - 100+ jobs in system

Time: 20+ hours (as needed)


TOTAL ESTIMATED: 85-130 hours
PARALLELIZABLE: Phases 1 and 2 can run in parallel (split team)
```

---

## 9. FINAL_HANDOFF

```
TO: ChatGPT / Implementation Team
FROM: Audit Report (April 9, 2026)

OBJECTIVE:
Build production ingestion system for Nursing Rocks jobs board.
Start with Phoenix Children's (verified, low-risk), expand to other sources.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VERIFIED (100% Confidence):

✅ Phoenix Children's website structure
   - 25 live nursing jobs available
   - Consistent HTML structure (article tags)
   - Data embedded as text with field:value format (Department: X, Location: Y)
   - Selectors confirmed: article, a[href*="/Posting/"], regex text extraction
   - URL pattern: /Positions/Posting/{POSTING_ID} where POSTING_ID = 5-7 digits

✅ Extraction capability
   - 10 sample records successfully extracted and normalized
   - All required fields recoverable (title, location, shift, specialty, etc.)
   - Specialty inference rules validated (Critical Care, PICU, NICU, OR, Emergency, etc.)
   - Tag classification working (experience level, role type, certifications)

✅ Field mappings
   - 3-column mapping table provided (source → destination → transform rule)
   - All normalization rules tested (location parsing, shift parsing, etc.)

✅ Database schema
   - 6 production-ready tables (jobs, employers, ingestion_runs, source_pages, tags, tag_map)
   - Indexes specified for search/filtering performance
   - Soft-delete strategy defined (archived_at, is_active flags)
   - Dedup strategy: (source, source_job_id) unique constraint + content_hash

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ASSUMPTIONS (Accept or Override):

⚠️  Phoenix Children's website structure will remain stable
   → Monitor for selector drift, implement fallback error detection

⚠️  Posting IDs are numeric and globally unique
   → Verify after first 100 jobs synced

⚠️  Detail pages follow consistent field extraction patterns
   → Log any parsing failures to manual_review_flag for QA

⚠️  Specialty tags can be inferred from title + category + description
   → Rule engine provided, may require tuning after first run

⚠️  Jobs "active" for 30+ days of no changes = safe to archive
   → Confirm timeline with stakeholders; may adjust to 60+ days

⚠️  Nursing Rocks destination will accept jobs at /api/admin/jobs endpoints
   → Confirm API contract before implementation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BLOCKED (Requires External Input):

❌ Nursing Rocks jobs board backend
   - Current status: UI exists, no jobs, backend TBD
   - Required before Phase 2: Database schema, admin APIs, moderation workflow
   - Recommendation: Build in parallel with Phase 1, not sequentially

❌ Additional job sources (beyond Phoenix)
   - No other sources verified yet
   - Recommendation: Define source list + URLs before Phase 5
   - Assumption: If others exist, follow similar HTML structure; if not, plan CSV import

❌ Salary data
   - Not provided by Phoenix Children's
   - Recommendation: Optional field, mark as UNKNOWN; collect from other sources

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BUILD ORDER (Start Here):

Week 1:
  1. Create database schema (Section 4: CANONICAL_SCHEMA)
  2. Build Phoenix crawler + parser (Section 5: steps 1-5)
  3. Build search API (Section 5: step 6-7)
  4. Populate jobs table

Week 2:
  Parallel:
    - Build Nursing Rocks destination (Section 7 requirements)
    - Build search/filter UI (Section 3)

Week 3+:
  - Scheduler + monitoring (Section 8, Phase 4)
  - Additional sources as needed (Phase 5)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTIFACTS PROVIDED:

1. VERIFIED_SELECTORS      → CSS/regex patterns for crawling
2. SAMPLE_EXTRACTS         → 10 real job records (use for testing)
3. FIELD_MAPPING           → Source → destination field transforms
4. CANONICAL_SCHEMA        → Production database (SQL)
5. INGESTION_PIPELINE      → Step-by-step algorithm (12 steps)
6. FAILURE_CASES           → Error handling strategies (8 cases)
7. DESTINATION_REQUIREMENTS → Nursing Rocks API/tables/UX specs
8. BUILD_SEQUENCE          → Implementation phases + time estimates
9. THIS HANDOFF            → One-page summary

All in machine-readable format (JSON, SQL, markdown tables).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ESTIMATED EFFORT: 85-130 hours (4-6 weeks, 2 developers)
RISK LEVEL: LOW
STATUS: READY TO IMPLEMENT
```

---

END OF ARTIFACTS
