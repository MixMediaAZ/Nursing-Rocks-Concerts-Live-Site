# Phase 0 & 1 Build Instructions

**Status:** Ready to build
**Timeline:** Schema migration → Verification (1-2 hours total)

---

## PHASE 0: Schema Migration

### Files Created

```
migrations/
  └─ 002_jobs_ingestion.sql    (Postgres DDL, 380 lines)
```

### Setup & Execution

#### Option A: Using Your Migration Runner

If your project has a migration runner (e.g., via Drizzle or custom script):

```bash
# Apply migration
npm run migrate -- migrations/002_jobs_ingestion.sql

# Or if using SQL directly:
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f migrations/002_jobs_ingestion.sql
```

#### Option B: Manual SQL Execution

```bash
# Using psql
psql postgresql://user:password@localhost/nursingrocks_dev < migrations/002_jobs_ingestion.sql

# Using your database client (PgAdmin, DBeaver, etc.)
# Copy and paste entire contents of 002_jobs_ingestion.sql into query window
# Execute
```

### Verification

Run this after migration completes to confirm new fields exist:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'job_listings'
  AND column_name IN ('source_name', 'source_job_id', 'location_raw', 'first_seen_at', 'last_seen_at')
ORDER BY ordinal_position DESC;
```

**Expected output:** 5 rows (one for each new critical field)

#### Verify Unique Constraint

```sql
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'job_listings'
  AND constraint_name LIKE '%source%'
  AND constraint_type = 'UNIQUE';
```

**Expected output:** 1 row with constraint name containing "source"

#### Verify New Tables Exist

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('job_specialties', 'job_ingestion_runs', 'job_source_pages', 'job_tags', 'job_tag_map');
```

**Expected output:** 5 rows (all new tables created)

### Rollback (if needed)

Keep a backup of original schema before running migration.

To rollback, reverse the operations:

```sql
DROP TABLE IF EXISTS job_tag_map CASCADE;
DROP TABLE IF EXISTS job_tags CASCADE;
DROP TABLE IF EXISTS job_source_pages CASCADE;
DROP TABLE IF EXISTS job_ingestion_runs CASCADE;
DROP TABLE IF EXISTS job_specialties CASCADE;

-- Then remove columns from job_listings
ALTER TABLE job_listings DROP COLUMN IF EXISTS source_name;
ALTER TABLE job_listings DROP COLUMN IF EXISTS source_job_id;
-- ... repeat for all added columns
```

---

## PHASE 1: Phoenix Verifier

### Files Created

```
server/ingestion/
  ├─ types.ts                              (Interfaces & types)
  ├─ hash.ts                               (SHA256 utilities)
  ├─ normalizer.ts                         (Field normalization)
  └─ sources/
     ├─ base-source.ts                     (Abstract base class)
     └─ phoenix-childrens-verifier.ts      (Verification implementation)
```

### Installation

Before running, ensure required dependencies are installed:

```bash
# jsdom is used for HTML parsing
npm install jsdom

# TypeScript (should already be installed)
npm install typescript ts-node
```

Check your package.json has:

```json
{
  "dependencies": {
    "jsdom": "^22.0.0 or higher"
  },
  "devDependencies": {
    "typescript": "*",
    "ts-node": "*"
  }
}
```

### Running the Verifier

#### Method 1: Direct TypeScript Execution (Recommended)

```bash
# Run with ts-node (requires tsconfig.json in root)
npx ts-node server/ingestion/sources/phoenix-childrens-verifier.ts

# Or with tsx (faster alternative)
npx tsx server/ingestion/sources/phoenix-childrens-verifier.ts
```

#### Method 2: Build First, Then Execute

```bash
# Compile TypeScript
npx tsc server/ingestion/sources/phoenix-childrens-verifier.ts --module commonjs --target ES2020

# Run compiled JavaScript
node server/ingestion/sources/phoenix-childrens-verifier.js
```

#### Method 3: Add npm Script

Add to `package.json`:

```json
{
  "scripts": {
    "verify:phoenix": "ts-node server/ingestion/sources/phoenix-childrens-verifier.ts"
  }
}
```

Then run:

```bash
npm run verify:phoenix
```

### Expected Output

The verifier outputs a JSON report with structure:

```json
{
  "source_name": "phoenixchildrens",
  "listing_page_url": "https://careers.phoenixchildrens.com/Positions/Nursing-jobs",
  "test_timestamp": "2026-04-09T14:30:00.000Z",
  "listing_page": {
    "fetched": true,
    "job_count": 25,
    "status_code": 200
  },
  "sample_extractions": [
    {
      "posting_id": "528801",
      "url": "https://careers.phoenixchildrens.com/Posting/528801",
      "success": true,
      "title": "Clinical Nurse - Acute Care Float Pool",
      "location_raw": "Phoenix, Arizona",
      "location_city": "Phoenix",
      "location_state": "Arizona",
      "employment_type": "Full-time",
      "apply_url": "https://careers.phoenixchildrens.com/Posting/528801",
      "fields_extracted": 8,
      "fields_total": 10,
      "confidence": 80
    }
    // ... more samples
  ],
  "parser_confidence": {
    "title_extraction": 100,
    "location_extraction": 80,
    "employment_type_extraction": 80,
    "apply_url_extraction": 100,
    "overall": 85
  },
  "recommendation": "proceed",
  "notes": [
    "Listing page: 25 jobs found",
    "Samples: 5 of 5 extracted successfully",
    "Average confidence: 85%"
  ],
  "warnings": []
}
```

### Interpreting Results

#### ✅ Success Indicators (Recommendation: PROCEED)

```
✓ listing_page.fetched = true
✓ listing_page.job_count >= 15
✓ sample_extractions: at least 4 of 5 success
✓ parser_confidence.overall >= 80%
✓ recommendation = "proceed"
```

**Action:** Continue to Phase 2 MVP build

#### ⚠️ Caution Indicators (Recommendation: INVESTIGATE)

```
✓ listing_page.fetched = true
⚠ listing_page.job_count < 15 (fewer jobs available)
⚠ sample_extractions: 2-3 of 5 success (some extraction issues)
⚠ parser_confidence.overall 60-80% (mixed quality)
⚠ recommendation = "investigate"
```

**Action:** Review warnings, examine failed extractions, adjust HTML parsing logic, re-run verifier

#### ❌ Failure Indicators (Recommendation: ABORT)

```
✗ listing_page.fetched = false (site unreachable)
✗ listing_page.job_count = 0 (no jobs found)
✗ sample_extractions: 0-1 of 5 success (parser broken)
✗ parser_confidence.overall < 60%
✗ recommendation = "abort"
```

**Action:** Stop. Investigate errors. Check if:
- Phoenix site structure changed
- Job posting IDs format changed
- Network connectivity issue

### Debugging Failed Extractions

If specific jobs fail to extract, check the error:

```bash
# Add DEBUG environment variable for more verbose logging
DEBUG=* npm run verify:phoenix

# Or capture output to file
npm run verify:phoenix > verification_report.json 2>&1
```

Check `verification_report.json` for detailed errors.

Common issues:

| Error | Likely Cause | Fix |
|-------|--------------|-----|
| "Could not extract job title" | Title not in h1/h2 | Update HTML selectors in phoenix-childrens-verifier.ts |
| "Empty HTML response" | Site returned 404 or 403 | Check job posting ID format; verify site still has jobs |
| "HTTP 429: Too Many Requests" | Rate limited | Add delay between requests; reduce sample size |
| "Network timeout" | Site slow or unreachable | Increase timeout in base-source.ts; check connectivity |

---

## Execution Timeline

### Step 1: Apply Schema Migration (5-10 min)

```bash
# Backup your database first!
psql postgresql://... < migrations/002_jobs_ingestion.sql

# Verify
psql postgresql://... -c "SELECT COUNT(*) FROM job_specialties;"
# Expected: 17 (seed data rows)
```

### Step 2: Install Dependencies (2-3 min)

```bash
npm install jsdom
```

### Step 3: Run Phoenix Verifier (2-5 min)

```bash
npm run verify:phoenix
```

### Step 4: Review Results (5 min)

- ✅ If `recommendation: proceed` → Schema & verifier are solid. Ready for Phase 2.
- ⚠️ If `recommendation: investigate` → Review warnings. Adjust parser if needed.
- ❌ If `recommendation: abort` → Stop. Debug errors before proceeding.

---

## Success Criteria

**Phase 0 (Schema):**
- [ ] Migration runs without errors
- [ ] New columns exist in job_listings table
- [ ] Unique constraint (source_name, source_job_id) exists
- [ ] All 5 new tables created (job_specialties, job_ingestion_runs, etc.)
- [ ] Seed data loaded (17 specialties, 28 tags)

**Phase 1 (Verifier):**
- [ ] Verifier runs without exceptions
- [ ] Listing page fetched (job_count >= 15)
- [ ] At least 4 of 5 sample jobs extracted successfully
- [ ] Parser confidence overall >= 75%
- [ ] Recommendation = "proceed" OR "investigate"

**If both pass:** Green light for Phase 2 MVP build

---

## Next Steps After Success

Once Phase 0 & 1 are green:

1. Update shared/schema.ts with Drizzle definitions for new tables
2. Build scheduler.ts (cron job runner)
3. Build pipeline.ts (12-step orchestrator)
4. Build admin API endpoints
5. Build admin UI
6. Test on staging database
7. Deploy to production

Do NOT proceed to Phase 2 if Phase 1 recommendation is "abort".

---

## Files & Locations

```
Project root
├── migrations/
│   └── 002_jobs_ingestion.sql               ← Schema changes
├── server/
│   └── ingestion/
│       ├── types.ts                         ← Type definitions
│       ├── hash.ts                          ← Hashing utilities
│       ├── normalizer.ts                    ← Field normalization
│       └── sources/
│           ├── base-source.ts               ← Abstract base class
│           └── phoenix-childrens-verifier.ts ← Verifier implementation
└── PHASE_0_1_BUILD_INSTRUCTIONS.md          ← This file
```

---

**Status:** Ready to execute Phase 0 & 1

**Estimated Time:** 15-30 minutes total
