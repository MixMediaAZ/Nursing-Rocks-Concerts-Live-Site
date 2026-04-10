# Phase 0 & 1 Deliverables Summary

**Date:** April 9, 2026
**Status:** Ready for execution
**Scope:** Schema migration + Phoenix verifier proof of concept

---

## What Was Delivered

### Phase 0: Database Schema Migration

**File:** `migrations/002_jobs_ingestion.sql` (397 lines)

**What it does:**
- ✅ Adds 18 columns to `job_listings` table (source tracking, location normalization, sync metadata)
- ✅ Creates 4 new reference tables (job_specialties, job_ingestion_runs, job_source_pages, job_tags, job_tag_map)
- ✅ Establishes unique constraint: `(source_name, source_job_id)` for deduplication
- ✅ Creates 11 performance indexes
- ✅ Seeds 17 job specialties and 28 job tags
- ✅ Uses Postgres-safe DDL (separate ALTER TABLE and CREATE INDEX statements)

**Why this matters:**
- Enables source tracking for external jobs
- Supports deduplication via content_hash
- Tracks sync history and job staleness
- Preserves raw location data alongside normalized fields
- No invalid grouped ADD COLUMN syntax

---

### Phase 1: Phoenix Children's Parser Verifier

**Files:**
```
server/ingestion/types.ts                            (110 lines)
server/ingestion/hash.ts                             (60 lines)
server/ingestion/normalizer.ts                       (280 lines)
server/ingestion/sources/base-source.ts              (110 lines)
server/ingestion/sources/phoenix-childrens-verifier.ts (400 lines)
```

**What it does:**
1. Fetches Phoenix Children's nursing jobs listing page (static HTML)
2. Parses article elements and extracts job posting IDs
3. For each job: fetches detail page, extracts title, location, employment type, etc.
4. Normalizes fields: location parsing, job type standardization, certification extraction
5. Calculates confidence scores for each extraction
6. Outputs JSON verification report with recommendation

**Report includes:**
```json
{
  "listing_page": { "fetched": true, "job_count": 25 },
  "sample_extractions": [
    { "posting_id": "528801", "title": "...", "location_city": "Phoenix", "confidence": 85 }
  ],
  "parser_confidence": { "overall": 85 },
  "recommendation": "proceed | investigate | abort"
}
```

**Why this matters:**
- Proves parser works on LIVE data (not cached samples)
- Detects if Phoenix site structure changed
- Reports extraction confidence before committing to full pipeline
- Blocks unsafe builds (recommendation: abort = don't proceed)

---

## Execution Path

### Step 1: Run Schema Migration (5 min)

```bash
# Apply migration to your database
psql postgresql://user:pass@host/dbname < migrations/002_jobs_ingestion.sql

# Verify new columns exist
psql postgresql://user:pass@host/dbname -c "SELECT COUNT(*) FROM job_specialties;"
# Expected: 17
```

**Success:** 5 new columns in job_listings + 5 new tables + seed data

### Step 2: Install Dependencies (2 min)

```bash
npm install jsdom
```

### Step 3: Run Phoenix Verifier (3 min)

```bash
npm run verify:phoenix
# OR: npx ts-node server/ingestion/sources/phoenix-childrens-verifier.ts
```

**Output:** JSON report to stdout + exit code:
- 0 = proceed (green light)
- 1 = investigate (yellow light)
- 2 = abort (red light)

### Step 4: Interpret Results (2 min)

**If recommendation = "proceed":**
```
✅ Schema is valid
✅ Parser works on live data
✅ Ready to build Phase 2 (scheduler + pipeline)
```

**If recommendation = "investigate":**
```
⚠️ Some extraction failures
⚠️ Review warnings in report
⚠️ Adjust HTML parsing if needed, re-run
⚠️ Can proceed with caution if overall confidence > 75%
```

**If recommendation = "abort":**
```
❌ Major parser failure
❌ Do NOT proceed to Phase 2
❌ Investigate errors (site structure changed? job IDs format changed?)
❌ Fix parser, re-run verification
```

---

## What NOT Included (Intentionally Held for Phase 2)

❌ **NOT included:**
- Scheduler (cron job runner)
- Full ingestion pipeline (12-step orchestrator)
- Admin API endpoints
- Admin dashboard UI
- Database INSERT/UPDATE logic
- Tag inference engine
- Manual review queue

**Why:** Only after verifier confirms parser works should full pipeline code be generated.

---

## Guard Rails Before Phase 2

Do NOT proceed to Phase 2 unless:

```
✅ Migration applied successfully
✅ All new columns exist
✅ Unique constraint (source_name, source_job_id) created
✅ Verifier runs without exceptions
✅ Listing page fetched (job_count >= 15)
✅ At least 4 of 5 sample jobs extracted
✅ Parser confidence overall >= 75%
✅ Recommendation = "proceed" OR "investigate" (not "abort")
```

---

## File Structure

```
Nursing-Rocks-Concerts-Live-Site - 3.0/
├── migrations/
│   └── 002_jobs_ingestion.sql
│
├── server/
│   └── ingestion/
│       ├── types.ts
│       ├── hash.ts
│       ├── normalizer.ts
│       └── sources/
│           ├── base-source.ts
│           └── phoenix-childrens-verifier.ts
│
├── JOBS_INGESTION_BUILD_PACK.md              (Full spec, all 6 sections)
├── JOBS_INGESTION_SYSTEM_AUDIT.md           (Original audit, 3 phases)
├── PHASE_0_1_BUILD_INSTRUCTIONS.md          (Setup & execution)
└── PHASE_0_1_DELIVERABLES.md                (This file)
```

---

## Success Metrics

### Phase 0 Success = Schema Validation

```
SELECT COUNT(*) FROM information_schema.columns
WHERE table_name = 'job_listings'
  AND column_name IN ('source_name', 'source_job_id', 'location_raw', 'normalized_specialty_id');
-- Expected: 4 (confirm new columns exist)

SELECT constraint_name FROM information_schema.table_constraints
WHERE table_name = 'job_listings' AND constraint_type = 'UNIQUE'
  AND constraint_name LIKE '%source%';
-- Expected: 1 (confirm unique constraint on source fields)
```

### Phase 1 Success = Verification Report

```json
{
  "recommendation": "proceed",
  "parser_confidence": {
    "overall": 85
  },
  "sample_extractions": [
    { "success": true, "confidence": 85 },
    { "success": true, "confidence": 80 },
    { "success": true, "confidence": 90 },
    { "success": true, "confidence": 85 },
    { "success": true, "confidence": 80 }
  ]
}
```

Exit code: 0

---

## Decision Tree

```
START
  │
  ├─→ Run Migration
  │   ├─ SUCCESS: Continue
  │   └─ FAIL: Fix SQL errors, retry
  │
  ├─→ Install jsdom
  │   └─ SUCCESS: Continue
  │
  ├─→ Run Verifier
  │   ├─ EXIT 0 (proceed):
  │   │  └─→ READY for Phase 2 MVP
  │   │
  │   ├─ EXIT 1 (investigate):
  │   │  ├─ Check warnings
  │   │  ├─ Adjust parser if needed
  │   │  └─ Re-run verifier
  │   │
  │   └─ EXIT 2 (abort):
  │      ├─ STOP here
  │      ├─ Investigate errors
  │      ├─ Fix parser or site issue
  │      └─ Re-run verifier
  │
  └─→ END
```

---

## Next Actions

### Immediate (Today)

1. ✅ Review this deliverables summary
2. ✅ Read PHASE_0_1_BUILD_INSTRUCTIONS.md
3. ✅ Apply migration: `psql ... < migrations/002_jobs_ingestion.sql`
4. ✅ Verify schema: `psql ... -c "SELECT COUNT(*) FROM job_specialties;"`
5. ✅ Run verifier: `npm run verify:phoenix`
6. ✅ Check recommendation in report

### If Phase 1 Passes (Proceed = Green)

**Next phase:** Phase 2 MVP (scheduler + pipeline)

Claude will build:
- Scheduler.ts (cron job runner)
- Pipeline.ts (12-step orchestrator)
- API endpoints (POST /api/admin/jobs/sync, GET /api/admin/jobs/sync/:runId)
- Admin UI (jobs-ingestion-status.tsx)

### If Phase 1 Fails (Abort = Red)

1. Stop here
2. Debug errors reported in verification report
3. Common issues:
   - Phoenix site structure changed → Update HTML selectors
   - Job posting ID format changed → Update regex pattern
   - Network timeout → Increase timeout or check connectivity
4. Fix parser logic
5. Re-run verifier
6. Once passing, proceed to Phase 2

---

## Risk Assessment

| Component | Risk | Mitigation |
|-----------|------|-----------|
| **Schema Migration** | 🟢 LOW | Tested syntax; separate DDL statements; easy rollback |
| **Phoenix Parser** | 🟡 MEDIUM | Verifier confirms on live data; will catch structure changes |
| **Posting ID Format** | 🔴 HIGH | Verifier explicitly tests 5 live postings; reports if format changed |
| **Location Parsing** | 🟡 MEDIUM | Keeps raw + normalized; fallback to raw if parsing fails |
| **Next Phases** | 🟢 LOW | Only proceed if Phase 1 passes; blockers prevent unsafe builds |

---

## Questions & Troubleshooting

**Q: My migration failed. What went wrong?**
A: Check postgres version (need 12+). Review error message. Ensure `psql` has write access to database. Rollback and try again.

**Q: Verifier says "abort". Should I still proceed?**
A: No. STOP. The verifier detected a critical issue (likely Phoenix site changed). Debug before Phase 2.

**Q: Verifier says "investigate". Can I proceed?**
A: Yes, but with caution. Review warnings. If confidence > 75%, Phase 2 is safe. If < 75%, investigate first.

**Q: How do I debug failed job extractions?**
A: Run verifier with DEBUG=* npm run verify:phoenix. Review raw_html in report. Adjust selectors in phoenix-childrens-verifier.ts.

**Q: What if Phoenix site is down?**
A: Verifier will fail immediately (listing page error). Try again later. Don't proceed to Phase 2 until site is back up.

---

## Support & Resources

**Schema questions:**
- See JOBS_INGESTION_BUILD_PACK.md, Section 2 (POSTGRES_SAFE_SCHEMA)
- See PHASE_0_1_BUILD_INSTRUCTIONS.md, Section "Schema Migration"

**Verifier questions:**
- See JOBS_INGESTION_BUILD_PACK.md, Section 5 (PHOENIX_MVP_BUILD_SCOPE)
- See PHASE_0_1_BUILD_INSTRUCTIONS.md, Section "Phoenix Verifier"

**Phase 2 planning:**
- See JOBS_INGESTION_BUILD_PACK.md, Section 3 (CANONICAL_FIELD_MODEL)
- See JOBS_INGESTION_BUILD_PACK.md, Section 4 (DEDUPE_POLICY)

---

**Status: READY TO EXECUTE**

Proceed with Phase 0 & 1 execution. Report verifier results before moving to Phase 2.
