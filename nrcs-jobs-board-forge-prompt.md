# FORGE Validation: NRCS Jobs Board Functionality Audit

**Project**: NRCS Concert Website - Jobs Board Module  
**Validation Mode**: Full-stack audit + gap analysis  
**Bulletproof Standards**: Zero mock data, complete implementations, all edge cases handled

---

## OBJECTIVE

Conduct a comprehensive FORGE inspection of the NRCS jobs board functionality. Identify:
- **Critical gaps**: Missing features, incomplete implementations, placeholder code
- **Technical debt**: API mismatches, database schema inconsistencies, type safety issues
- **UX/functional defects**: Edge cases, validation gaps, error handling failures
- **Upgrade path**: Prioritized list of fixes with estimated effort

---

## EXECUTION STEPS

### 1. CODEBASE STRUCTURE AUDIT
Locate and analyze:
- Jobs board UI components (React/Next.js)
- Backend API routes (if any)
- Database schema/models for jobs
- Type definitions (TypeScript interfaces)
- Any job-related utilities or helpers

**Questions to answer:**
- Are there placeholder components or mock data files?
- Does the schema match the UI expectations?
- Are all database queries actually connected?

### 2. FEATURE COMPLETENESS CHECK

**Core Jobs Board Features** (check for 100% implementation):
- [ ] Display job listings (venue, concert-related)
- [ ] Job filtering (by date, location, role type)
- [ ] Job detail view / modal
- [ ] Application workflow (if users can apply)
- [ ] Search functionality
- [ ] Pagination / infinite scroll
- [ ] Job creation/editing (admin-only)
- [ ] Job deletion / archival
- [ ] Status management (open/filled/closed)
- [ ] Category/tag system

**For each feature:**
- Is it fully functional or partially stubbed?
- Does it have error handling?
- Are edge cases covered?

### 3. DATABASE & API LAYER AUDIT

**Database inspection:**
- Does the jobs table exist?
- Do all required fields exist? (id, title, description, venue, date, status, created_at, etc.)
- Are there any placeholder/NULL columns?
- Is the schema normalized properly?

**API routes inspection:**
- GET /api/jobs - list all, filtering, pagination
- GET /api/jobs/[id] - single job detail
- POST /api/jobs - create (admin)
- PATCH /api/jobs/[id] - update (admin)
- DELETE /api/jobs/[id] - delete (admin)
- Any authentication/authorization checks?

**Validation issues:**
- Input validation on POST/PATCH?
- Type safety (TypeScript)?
- Error responses (proper status codes)?

### 4. UI/UX FUNCTIONAL TESTING

**Test each interactive element:**
- Filter controls - do they actually filter?
- Search box - does it work or is it cosmetic?
- Apply buttons - do they submit or are they disabled?
- Pagination - does it load new data or loop same results?
- Modals/detail views - do they load correct job data?
- Admin controls - do they actually create/edit/delete?

**Identify placeholder patterns:**
- "Coming soon" text
- Disabled buttons with no reason
- Empty state handlers that don't match actual states
- Hardcoded job data in components

### 5. TYPE SAFETY & CONTRACTS

**TypeScript audit:**
- Is there a `Job` interface? Is it complete?
- Do API responses match their types?
- Are there any `any` types that should be specific?
- Do form submissions validate against the schema?

### 6. ERROR HANDLING & EDGE CASES

**Test scenarios:**
- Empty results - does the UI handle gracefully?
- Network failure - is there retry logic?
- Permission denied (non-admin tries to edit) - handled?
- Invalid data submission - validation feedback?
- Concurrent updates - race conditions?
- Very long job descriptions - overflow/truncation?

---

## DELIVERABLE FORMAT

Create a comprehensive **NRCS_JOBS_BOARD_AUDIT.md** with sections:

### Section 1: Current State Summary
- Feature implementation status (% complete)
- Tech stack confirmation
- Known mock data / placeholders

### Section 2: Critical Issues (by priority)
For each issue:
```
**ISSUE**: [Brief title]
**Severity**: 🔴 Critical / 🟡 High / 🟠 Medium / 🟢 Low
**Type**: [Bug | Missing Feature | Type Safety | Performance]
**Current Behavior**: [What's broken/missing]
**Expected Behavior**: [What should happen]
**Affected Component(s)**: [Files/functions]
**Fix Complexity**: [Quick (< 15min) | Moderate (15-60min) | Complex (1-4 hours)]
**Example Code Location**: [Link to problematic code]
```

### Section 3: Feature Gap Analysis
- Which core features are completely missing?
- Which are 50% done?
- Which are complete but untested?

### Section 4: Upgrade Roadmap
Prioritized list:
1. [Must-fix blocker issues]
2. [High-impact features]
3. [Polish & optimization]

### Section 5: Type Safety Report
- TypeScript coverage %
- Any type gaps
- Recommended interfaces to add/strengthen

### Section 6: Testing Blind Spots
- What scenarios aren't covered?
- What edge cases could break production?

---

## FORGE VALIDATION RULES

✅ **Pass Criteria:**
- All data flows verified (UI → API → DB → UI)
- No mock data in production code paths
- All buttons/forms actually functional
- Error cases handled gracefully
- TypeScript strict mode compatible
- No "coming soon" or placeholder text in shipped features

❌ **Fail Criteria:**
- Hardcoded test data still in code
- Disabled buttons without explanation
- API routes that don't match schema
- Missing error handling
- Incomplete implementations (50% done)
- Type safety issues (`any` types, type mismatches)

---

## CONTEXT FOR CLAUDE CODE

This jobs board is part of **nursingrocksconcerts.com**, which operates the Nursing Rocks concert series. The jobs board should help venues and the concert organization post/manage openings (volunteers, staff, vendors, etc.) for the May 16, 2026 Phoenix event and future concerts.

Expected user flows:
- **Visitors**: Browse available jobs/volunteer opportunities
- **Admins** (Nursing Rocks staff): Create, edit, delete job listings, manage applications
- **Applicants** (if enabled): Submit applications, track status

---

## OUTPUT STRUCTURE

Use `/slash commands` in Claude Code to:
1. `/review` - Scan jobs board components and API routes
2. `/type-check` - Verify TypeScript coverage
3. `/validate` - Run through feature checklist
4. `/audit-db` - Inspect database schema and queries
5. `/generate-report` - Create comprehensive NRCS_JOBS_BOARD_AUDIT.md

**Final deliverable**: Single audit document + list of specific code fixes needed.
