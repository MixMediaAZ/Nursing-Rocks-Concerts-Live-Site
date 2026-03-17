# FLOWCHART: Jobs Board
## Generic template — employer posts jobs, candidates apply

---

## STANDARD BUILD ORDER

```
[1]  fix-ts-errors
      ↓
[2]  security-rate-limit
      ↓
[3]  auth                       ← dual role: employer + candidate
      ↓
[4]  db                         ← jobs, employers, applications, profiles
      ↓
[5]  email
      ↓
[6]  employer-profile           ← employer creates account + company profile
      ↓
[7]  job-posting                ← employer posts job, moderation queue
      ↓
[8]  job-listing                ← public job search + filters
      ↓
[9]  candidate-profile          ← candidate resume + skills
      ↓
[10] job-application            ← candidate applies, employer notified
      ↓
[11] employer-dashboard         ← manage postings + view applicants
      ↓
[12] candidate-dashboard        ← track applications + saved jobs
      ↓
[13] email-notifications        ← application received, status updates
      ↓
[14] admin-dashboard            ← moderation + employer verification
      ↓
[15] deploy
```

---

## BRANCH CONDITIONS

### Payment Branch
```
IF employers pay to post
  → insert payments-stripe after auth
  → job-posting checks payment before publishing

IF free posting
  → skip payments
  → use moderation queue only
```

### Search Branch
```
IF basic search only
  → search-postgres-fts.md
IF advanced faceted search needed
  → search-meilisearch.md (add after job-listing node)
```

---

## ACTOR MAP

```
EMPLOYER
  → creates company profile
  → posts job listings
  → reviews applications
  → contacts candidates

CANDIDATE
  → creates profile + resume
  → searches and filters jobs
  → applies to jobs
  → tracks application status

ADMIN
  → approves employer accounts
  → moderates job listings
  → manages reported content
```

---

## MINIMUM VIABLE BUILD
1, 2, 3, 4, 5, 6, 7, 8, 10, deploy

Profiles, dashboards, and email are iteration.
