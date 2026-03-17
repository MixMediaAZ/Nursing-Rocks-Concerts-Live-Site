# FORGE NODE LIBRARY
## Stack-Aware Known Solutions Index
## The node library selects the solution. You do not.

---

## STACK DETECTION — RUN ON /forge-init

```
FRONTEND:
  next.config.js exists           → Next.js
  vite.config.ts + react import   → React + Vite
  nuxt.config.ts exists           → Nuxt
  svelte.config.js exists         → SvelteKit
  no framework detected           → Vanilla JS

BACKEND:
  server/routes.ts exists         → Express + TypeScript
  server/index.js exists          → Express + JavaScript
  app/api/ directory exists       → Next.js API Routes
  supabase/ directory exists      → Supabase
  convex/ directory exists        → Convex
  no backend detected             → Frontend only / BFF needed

DATABASE:
  drizzle.config.ts exists        → Drizzle ORM
  prisma/schema.prisma exists     → Prisma ORM
  @supabase import in codebase    → Supabase Client
  mongoose import in codebase     → MongoDB + Mongoose
  no ORM detected                 → Raw SQL or none

AUTH:
  @clerk import in codebase       → Clerk
  next-auth import in codebase    → NextAuth
  passport import in codebase     → Passport.js
  @supabase/auth import           → Supabase Auth
  jsonwebtoken import             → Custom JWT
  no auth detected                → Auth node required

DEPLOYMENT:
  vercel.json exists              → Vercel
  railway.json exists             → Railway
  render.yaml exists              → Render
  fly.toml exists                 → Fly.io
  Dockerfile exists               → Docker / custom

EXISTING SERVICES (check .env and imports):
  STRIPE_SECRET_KEY in .env       → Stripe active
  SENDGRID_API_KEY in .env        → SendGrid active
  RESEND_API_KEY in .env          → Resend active
  AWS_ACCESS_KEY in .env          → AWS S3 active
  CLOUDFLARE in .env              → R2 active
  TWILIO in .env                  → Twilio active
  SENTRY_DSN in .env              → Sentry active
```

---

## NODE INDEX BY FUNCTION

### AUTHENTICATION

| Stack | Node File |
|-------|-----------|
| Next.js — new project | nodes/auth-clerk.md |
| Next.js — has NextAuth | nodes/auth-nextauth.md |
| Express — has Passport | nodes/auth-passport-jwt.md |
| Express — no auth yet | nodes/auth-passport-jwt.md |
| Supabase stack | nodes/auth-supabase.md |

**Decision rule:** If auth imports already exist, use matching node.
If no auth exists, default to Clerk (Next.js) or Passport+JWT (Express).

---

### DATABASE + ORM

| Stack | Node File |
|-------|-----------|
| Next.js — new | nodes/db-prisma-neon.md |
| Express — new | nodes/db-drizzle-neon.md |
| Has existing Prisma | nodes/db-prisma-neon.md |
| Has existing Drizzle | nodes/db-drizzle-neon.md |
| Supabase stack | nodes/db-supabase.md |

**Decision rule:** Match existing ORM. If none, use Prisma for Next.js,
Drizzle for Express.

---

### EMAIL — TRANSACTIONAL

| Condition | Node File |
|-----------|-----------|
| RESEND_API_KEY in .env | nodes/email-resend.md |
| SENDGRID_API_KEY in .env | nodes/email-sendgrid.md |
| MAILGUN_API_KEY in .env | nodes/email-mailgun.md |
| No email service found | nodes/email-resend.md |

**Decision rule:** Match existing key. Default to Resend if none found.

---

### EMAIL — SEQUENCES + SCHEDULING

| Deployment | Node File |
|------------|-----------|
| Vercel | nodes/email-sequences-vercel-cron.md |
| Railway / Render / Fly | nodes/email-sequences-node-cron.md |

**Decision rule:** Vercel serverless cannot run persistent cron.
Use Vercel Cron Jobs. All other hosts use node-cron.

---

### PAYMENTS

| Requirement | Node File |
|-------------|-----------|
| One-time payments | nodes/payments-stripe.md |
| Subscriptions | nodes/payments-stripe-subscriptions.md |
| Marketplace / splits | nodes/payments-stripe-connect.md |
| No payment needed | skip — remove from flowchart |

**Decision rule:** Stripe is default. No alternatives considered.

---

### FILE STORAGE

| Condition | Node File |
|-----------|-----------|
| R2 / Cloudflare keys in .env | nodes/storage-r2.md |
| AWS keys in .env | nodes/storage-s3.md |
| Backblaze keys in .env | nodes/storage-b2.md |
| No storage configured | nodes/storage-r2.md |

**Decision rule:** Match existing keys. Default to R2 if none.

---

### UI COMPONENTS

| Stack | Node File |
|-------|-----------|
| Next.js — new | nodes/ui-shadcn.md |
| React + Vite — new | nodes/ui-shadcn.md |
| Has Radix UI installed | nodes/ui-radix.md |
| Admin interface needed | nodes/ui-react-admin.md |
| Data tables needed | nodes/ui-tanstack-table.md |

**Decision rule:** shadcn/ui is default for new projects. Match existing
library if already installed.

---

### QR CODES

| Requirement | Node File |
|-------------|-----------|
| Generate QR codes | nodes/qr-generate.md |
| Scan QR codes | nodes/qr-scan.md |
| Both generate + scan | nodes/qr-generate.md + nodes/qr-scan.md |

---

### SEARCH

| Requirement | Node File |
|-------------|-----------|
| Simple DB search | nodes/search-postgres-fts.md |
| Advanced full-text | nodes/search-meilisearch.md |
| Hosted / managed | nodes/search-algolia.md |

**Decision rule:** Start with Postgres FTS. Upgrade to Meilisearch
only if FTS proves insufficient.

---

### RATE LIMITING + SECURITY

| Stack | Node File |
|-------|-----------|
| Express | nodes/security-rate-limit-express.md |
| Next.js | nodes/security-rate-limit-next.md |

**Decision rule:** Always include this node before any public deployment.
It is never optional.

---

### TYPESCRIPT ERROR RESOLUTION

| Error Type | Node File |
|------------|-----------|
| API response typing | nodes/fix-ts-api-types.md |
| Fetch call signatures | nodes/fix-ts-fetch.md |
| ORM query types | nodes/fix-ts-orm.md |
| Component prop types | nodes/fix-ts-props.md |
| General compilation errors | nodes/fix-ts-errors.md |

**Decision rule:** Run /forge-audit first. Classify errors by type.
Fix in dependency order — foundational types before component types.

---

### DEPLOYMENT

| Target | Node File |
|--------|-----------|
| Vercel | nodes/deploy-vercel.md |
| Railway | nodes/deploy-railway.md |
| Render | nodes/deploy-render.md |
| Fly.io | nodes/deploy-fly.md |

**Decision rule:** Match existing deployment target detected in /forge-init.

---

### MONITORING

| Requirement | Node File |
|-------------|-----------|
| Error tracking | nodes/monitoring-sentry.md |
| Performance (Vercel) | nodes/monitoring-vercel-analytics.md |
| Logging | nodes/monitoring-pino.md |

---

### TESTING

| Type | Node File |
|------|-----------|
| Unit tests | nodes/testing-vitest.md |
| E2E tests | nodes/testing-playwright.md |
| API tests | nodes/testing-supertest.md |
| Component tests | nodes/testing-rtl.md |

---

## CUSTOM NODE REGISTRY
*Nodes built for specific projects — promoted to library after validation*

| Node | Built For | Date | Description |
|------|-----------|------|-------------|
| — | — | — | Registry empty — grows with each project |

---

## ADDING NODES TO THIS LIBRARY

When /forge-add-node creates a verified new node:
1. Add row to CUSTOM NODE REGISTRY above
2. Add entry to relevant section in this index
3. Note the stack variant it applies to
4. Note the project it was first built for

The library grows. It never shrinks.
