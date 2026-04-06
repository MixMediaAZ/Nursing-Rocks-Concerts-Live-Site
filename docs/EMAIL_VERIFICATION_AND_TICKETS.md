# Email, verification & free tickets — behavior checklist (for code review / Claude)

This document describes the **intended** nurse verification and ticket-email flow in this repo. If code diverges, treat that as a bug unless product explicitly changed.

---

## End-to-end flow

1. **Admin verifies the nurse** (`PATCH /api/admin/users/:id/verify`, `verified: true`).
   - Updates DB: `users.is_verified`, audit log.
   - Sends **welcome email** (`sendNurseVerifiedWelcomeEmail` in `server/services/email.ts`).
   - Does **not** create tickets or send QR emails here.

2. **Welcome email** (subject: `NURSE_VERIFIED_WELCOME_SUBJECT`).
   - Includes a link: `{APP_URL}/login?redirect=/dashboard` (fallback dev: `http://localhost:5000`).
   - Explains: sign in → dashboard → **Get your ticket(s) & email**.

3. **User signs in**, opens **dashboard**, clicks **Get your ticket(s) & email**.
   - `POST /api/tickets/claim-verified` → `claimVerifiedUserTickets` in `server/services/verification.ts`.
   - For each **eligible** published future event: `issueTicketForEvent`; if **`newlyIssued`**, sends **ticket issuance email** (`sendTicketIssuedEmail`) with QR.

4. **Duplicate protection**: if a ticket already exists for `(user_id, event_id)`, `issueTicketForEvent` returns `newlyIssued: false` and **no second issuance email** is sent for that event.

---

## Where code lives

| Concern | Primary files |
|--------|------------------|
| Admin verify + welcome send | `server/services/verification.ts` (`verifyUser`), `sendNurseVerifiedWelcomeEmail` |
| User claim tickets + QR email | `claimVerifiedUserTickets`, `POST /api/tickets/claim-verified` in `server/routes.ts` |
| Resend / HTML templates | `server/services/email.ts` |
| Issue ticket + idempotency | `server/services/tickets.ts` (`issueTicketForEvent` → `{ ticket, newlyIssued }`) |
| Dashboard CTA | `client/src/pages/dashboard.tsx` |
| Admin copy / toast | `client/src/pages/admin.tsx` |

---

## Environment / delivery

- **`RESEND_API_KEY`**: real sends via Resend; without it, “success” paths may only **log to server** (`deliveryMode: dev_log`), and DB may use `email_status: simulated` for ticket rows where applicable.
- **`SENDER_EMAIL` / `SUPPORT_EMAIL`**: from env; defaults in `server/services/email.ts`.
- **`APP_URL`**: no trailing slash; required for correct **welcome link** in production (see `getPublicSiteBaseUrl()`).

---

## Session / JWT vs DB (stale UI)

- JWT embeds `is_verified` at **login time**.
- After admin verifies, client must **refresh session** or UI stays stale.
- Implemented: **`GET /api/auth/me`** returns fresh `user` + **new JWT**; **`syncSessionUserFromApi()`** in `client/src/lib/token-utils.ts`; **`SessionSync`** in `client/src/App.tsx`; **`/api/auth/status`** uses **DB** for JWT users, not stale claims.
- Header/dashboard listen for **`SESSION_USER_SYNC_EVENT`** after sync.

---

## Eligible events (free tickets)

`getEligibleEventsForUser` in `server/services/tickets.ts`: **published** events with **`end_at` not null** and **`end_at >= now`**. No eligible events → claim returns a message; no ticket emails.

---

## Other email systems

- **`server/email.ts`** (root): older/alternate flows (purchases, NRPX, job alerts, etc.). Do not confuse with **`server/services/email.ts`** for the verified-nurse ticket + welcome templates above.
- **Pending approval** ticket emails (`approve-and-send-email`) are a **separate** purchase/approval path.

---

## Quick regression checks

- [ ] Admin verify sends welcome (or logs in dev) and does **not** auto-send QR.
- [ ] Claim sends at most one issuance email per **new** ticket per event.
- [ ] `APP_URL` welcome links work in production.
- [ ] After verify, logged-in user sees verified state without re-login (session sync).

Last aligned with codebase patterns: verify `git` history for renames.
