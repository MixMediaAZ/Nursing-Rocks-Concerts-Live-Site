# Documentation survey & reconciliation (`.forge` + repo `*.md`)

**Folder note:** The Forge workflow lives under **`.forge`** (dot-prefixed), not `forge/`.

---

## Canonical sources (prefer these)

| Topic | File |
|-------|------|
| Env vars for local + prod | `DEPLOY.md` (top), `.env.example` |
| Security fixes & open items | `SECURITY.md` |
| Jobs board (post-audit fixes) | `NRCS_JOBS_BOARD_AUDIT.md` |
| B2 / CDN video setup | `CLOUDFLARE_B2_SETUP.md` |
| Ticket / nurse-free framing | `TICKET_FRAMING.md` |
| Safe Git deploy / user data | `DEPLOY.md` |
| Vercel + Express + B2 stack | `docs/VERCEL_DEPLOYMENT.md` |

---

## Issues found (incorrect or inconsistent)

### 1. `PROJECT_STATE.md` (repo root) — **stale and self-contradictory**

- Claims **104 TypeScript errors** and **build blocked** in the deployment table, while the same file later says **BUILD SUCCESS** and errors fixed (March 17, 2026).
- **Security** section still lists “plaintext passwords in `create-admin-users.js`” and sensitive settings as high priority; code now uses `ADMIN_PASSWORD_1`/`ADMIN_PASSWORD_2` and `CUSTOMCAT_API_KEY` is forced sensitive in routes (see `SECURITY.md`).
- **Jobs board** marked INCOMPLETE with `job-details.tsx` errors; later work (and `NRCS_JOBS_BOARD_AUDIT.md`) reflects filters, auth, admin approve/deny/delete, and employer dashboard improvements.
- **“Modified files (uncommitted)”** is a point-in-time snapshot and will almost always be wrong.

**Reconciliation:** Treat `PROJECT_STATE.md` as a **historical audit snapshot** unless refreshed. For “what’s true now,” use `SECURITY.md`, `NRCS_JOBS_BOARD_AUDIT.md`, and running `npm run build` / `npm run check`.

### 2. Duplicate Vercel docs — **two files, one had wrong env names**

| File | Issue |
|------|--------|
| `VERCEL_DEPLOYMENT.md` (root) | Used **`VIDEO_B2_BUCKET_NAME`** and **`VIDEO_B2_CDN_BASE_URL`**. Code uses **`VIDEO_B2_BUCKET`** and **`VIDEO_CDN_BASE_URL`** (`server/video/b2-s3.ts`, `.env.example`). |
| `docs/VERCEL_DEPLOYMENT.md` | Matches code; stack description (Express + Vite, not Next.js) is accurate. |

**Reconciliation:** Root `VERCEL_DEPLOYMENT.md` should match `docs/VERCEL_DEPLOYMENT.md` and `.env.example`. `README.md` points at root `VERCEL_DEPLOYMENT.md` — keep root in sync or redirect readers to `docs/VERCEL_DEPLOYMENT.md` in README.

### 3. `.forge/PROJECT_STATE.md` — **template only**

- This is the **empty Forge template** (placeholders). It is **not** the live project audit.
- **Live** project narrative is in repo root `PROJECT_STATE.md` (stale) or should be regenerated via `/forge-audit`.

### 4. `NODE_LIBRARY.md` — **references missing node files**

Indexed nodes such as `nodes/db-drizzle-neon.md`, `auth-nextauth.md`, `auth-supabase.md`, etc. **do not exist** under `.forge/nodes/`. Only these exist:

`auth-clerk.md`, `auth-passport-jwt.md`, `deploy-vercel.md`, `email-resend.md`, `fix-ts-errors.md`, `monitoring-sentry.md`, `payments-stripe.md`, `qr-generate.md`, `security-rate-limit-express.md`

**Reconciliation:** When following Forge, only use node files that exist, or add missing `.md` files if you want the library complete.

### 5. `auth-clerk.md` vs actual stack — **wrong for this repo**

- This app is **Express + Vite + JWT + Passport**, not Next.js + Clerk.
- Correct auth node for this codebase: **`auth-passport-jwt.md`**.

### 6. `FORGE_PROTOCOL.md` — **`CONCEPT.md` path**

- `/forge-concept` says write to `.forge/concepts/CONCEPT.md`; that directory may not exist until created.

### 7. `NRCS_JOBS_BOARD_AUDIT.md` vs code

- Audit claims FORGE NODE 8 fixes (post job, applications, etc.). Spot-check: `employer-dashboard.tsx` now has “Post New Job” dialog and applications-related UI (no longer the literal “next phase” placeholder).
- If behavior regresses, re-run an audit; don’t treat the audit date as eternal proof.

### 8. Misc. markdown files (repo root)

- **`nrcs-jobs-board-forge-prompt.md`** — prompt/spec; may not match current code line-by-line.
- **`NAVIGATION_AND_WIRING_AUDIT.md`**, **`RESPONSIVE_DESIGN_FIXES.md`**, **`GIT_DESKTOP_PREPARATION.md`**, **`NRCS-QR-TICKET-SYSTEM-SPEC.md`** — useful context; verify against code if you rely on them for implementation status.

---

## Recommended README / Forge hygiene

1. One **Vercel** source of truth: either merge root + `docs/` or add one line in README: “Prefer `docs/VERCEL_DEPLOYMENT.md`.”
2. Refresh or archive **`PROJECT_STATE.md`** so it doesn’t contradict itself.
3. Extend **`NODE_LIBRARY.md`** with a “present in repo” column, or add stub files for referenced missing nodes.

---

## All `.md` files touched by this survey

- `.forge/FORGE_PROTOCOL.md`, `FORGE_BRAIN.md`, `PROJECT_STATE.md`, `NODE_LIBRARY.md`
- `.forge/flowcharts/saas-app.md`, `event-registration.md`, `jobs-board.md`
- `.forge/nodes/*.md` (9 files)
- Root: `README.md`, `DEPLOY.md`, `SECURITY.md`, `PROJECT_STATE.md`, `VERCEL_DEPLOYMENT.md`, `TICKET_FRAMING.md`, `CLOUDFLARE_B2_SETUP.md`, `NRCS_JOBS_BOARD_AUDIT.md`, `nrcs-jobs-board-forge-prompt.md`, `NAVIGATION_AND_WIRING_AUDIT.md`, `RESPONSIVE_DESIGN_FIXES.md`, `GIT_DESKTOP_PREPARATION.md`, `NRCS-QR-TICKET-SYSTEM-SPEC.md`
- `docs/VERCEL_DEPLOYMENT.md`
