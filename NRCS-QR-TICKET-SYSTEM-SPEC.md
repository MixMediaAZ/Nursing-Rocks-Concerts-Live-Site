# NRCS QR Ticket System — Claude Code Build Spec

## Context

This is the Nursing Rocks Concert Series website (nursingrocksconcerts.com). It's a **Next.js** app deployed on **Vercel** with a **Neon** Postgres database and **NextAuth** for admin authentication. The site already exists and is live.

We are adding a **nurse registration + QR code ticketing system** for the Nursing Rocks Phoenix event (May 16, 2026 at The Walter Studio). Expected volume: **300–500 free tickets** for registered nurses.

**DO NOT** break or modify existing site functionality. This is an additive feature set.

---

## System Overview

```
Nurse visits site → fills registration form → system generates unique ticket code →
QR code created from ticket code → branded email sent with QR image →
nurse arrives at venue → door volunteer scans QR with phone → system validates + checks in
```

---

## 1. Database Schema

Add to the existing Neon database. Use whatever ORM/query approach the existing codebase uses (check for Drizzle, Prisma, or raw `pg`/`@neondatabase/serverless`). Match the existing pattern.

### Table: `registrations`

```sql
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_code VARCHAR(12) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  employer VARCHAR(255),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_registrations_ticket_code ON registrations(ticket_code);
CREATE INDEX idx_registrations_email ON registrations(email);
```

### Ticket Code Format

Generate a 12-character alphanumeric code: `NRPX-XXXX-XXXX` where X is uppercase A-Z, 0-9 (excluding ambiguous chars: 0/O, 1/I/L). Use a collision-safe generation function that checks uniqueness before insert.

```typescript
function generateTicketCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0,O,1,I,L
  const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `NRPX-${segment()}-${segment()}`;
}
```

---

## 2. API Routes

All routes go under `app/api/` (App Router) or `pages/api/` — match existing project structure.

### `POST /api/register`

**Public endpoint.** No auth required.

- Accepts: `{ firstName, lastName, email, employer? }`
- Validates all fields (email format, required fields, string lengths)
- Check for duplicate email — if already registered, return friendly error "This email is already registered. Check your inbox for your ticket."
- Generate unique `ticket_code` (retry if collision)
- Insert into `registrations` table
- Generate QR code PNG from `ticket_code` string (use `qrcode` npm package)
- Send email via Resend with QR code attached (see Email section)
- Update `email_sent = true`, `email_sent_at = NOW()`
- Return `{ success: true, message: "Check your email for your ticket!" }`

**Rate limiting:** Add basic rate limiting — max 5 registrations per IP per hour. Use a simple in-memory store or check recent registrations from same IP.

**Input validation:**
- `firstName`: 1–100 chars, trimmed
- `lastName`: 1–100 chars, trimmed
- `email`: valid email format, lowercase, trimmed
- `employer`: optional, max 255 chars

### `GET /api/verify/[code]`

**Public endpoint** (the scanner hits this).

- Accepts ticket code as URL param
- Look up `registrations` where `ticket_code = code`
- If not found: return `{ valid: false, message: "Ticket not found" }`
- If found and `checked_in = false`: set `checked_in = true`, `checked_in_at = NOW()`, return `{ valid: true, name: "First Last", message: "Welcome!" }`
- If found and `checked_in = true`: return `{ valid: false, alreadyUsed: true, message: "Already checked in at [time]", name: "First Last" }`

### `GET /api/admin/registrations`

**Protected endpoint.** Require existing NextAuth session (admin only).

- Returns all registrations with counts:
  ```json
  {
    "registrations": [...],
    "stats": {
      "total": 342,
      "emailsSent": 340,
      "checkedIn": 127,
      "remaining": 215
    }
  }
  ```
- Support query params: `?search=`, `?status=checked_in|not_checked_in`, `?sort=name|date`

### `POST /api/admin/registrations/resend/[id]`

**Protected endpoint.** Admin can resend the QR email for a specific registration.

### `GET /api/admin/registrations/export`

**Protected endpoint.** Returns CSV download of all registrations.

---

## 3. QR Code Generation

Install: `npm install qrcode`

```typescript
import QRCode from 'qrcode';

async function generateQRCode(ticketCode: string): Promise<Buffer> {
  return QRCode.toBuffer(ticketCode, {
    type: 'png',
    width: 400,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' },
    errorCorrectionLevel: 'H' // High — survives up to 30% damage
  });
}
```

The QR code encodes **ONLY the ticket code string** (e.g., `NRPX-A7K9-M2X4`). No URLs, no personal data.

---

## 4. Email Delivery (Resend)

Install: `npm install resend`

**Env var needed:** `RESEND_API_KEY`

The sender domain should be configured in Resend for `nursingrocksconcerts.com` or use Resend's default sender for testing.

### Email Template

Send a branded HTML email:

- **From:** `Nursing Rocks <tickets@nursingrocksconcerts.com>` (or Resend default)
- **Subject:** `Your Nursing Rocks Phoenix Ticket 🎸`
- **Body content:**
  - Nursing Rocks logo (hosted on the site, linked via URL — don't embed)
  - "Hi [First Name],"
  - "You're registered for Nursing Rocks Phoenix!"
  - Event details block:
    - **Date:** Friday, May 16, 2026
    - **Venue:** The Walter Studio, Phoenix, AZ
    - **Doors:** [TBD — use a placeholder variable]
    - **Featuring:** PsychoStar + special guests
  - QR code image (inline CID attachment, NOT a URL — this ensures it displays in all email clients)
  - "Show this QR code at the door for entry."
  - Backup text: "Can't scan? Give your name: [First Last] or code: [NRPX-XXXX-XXXX]"
  - Footer: "Nursing Rocks Concert Series — Benefiting Gateway Community College Scholarships"
  - Unsubscribe not required (transactional email, not marketing)

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendTicketEmail(registration: Registration, qrBuffer: Buffer) {
  await resend.emails.send({
    from: 'Nursing Rocks <tickets@nursingrocksconcerts.com>',
    to: registration.email,
    subject: 'Your Nursing Rocks Phoenix Ticket 🎸',
    html: buildEmailHTML(registration),
    attachments: [
      {
        filename: 'ticket-qr.png',
        content: qrBuffer,
        contentType: 'image/png',
        // For inline display, set content ID
      }
    ]
  });
}
```

**IMPORTANT:** Test with a real email. QR codes in email are notoriously tricky — the inline CID approach is most reliable. If Resend doesn't support CID well, fall back to attaching the QR as a regular attachment + include a base64 data URI in the HTML as backup.

---

## 5. Registration Page

Create a new page: `/register` (or `/phoenix/register` if the site is multi-event)

### Design Requirements

- Match existing site styling (check globals.css, tailwind config, existing components)
- Mobile-first — most nurses will register from their phone
- Simple form: First Name, Last Name, Email, Employer (optional)
- Submit button with loading state
- Success state: "Check your email! 🎉" with event details
- Error states: duplicate email, validation errors, server errors
- Add a cap check — if registrations >= 500, show "Registration is full" message

### Form UX

- Client-side validation before submit
- Disable submit button while processing
- Show clear success/error feedback
- Don't clear the form on error (preserve user input)
- On success, show confirmation screen (don't just flash a toast)

---

## 6. Door Scanner PWA

Create a standalone page: `/scan` (or `/door-scanner`)

This is a **Progressive Web App** page that venue volunteers open on their phones.

### Requirements

- Uses the device camera to scan QR codes
- Install `html5-qrcode` npm package (or use `@zxing/browser`) for browser-based QR scanning
- Full-screen camera view with scanning overlay
- On successful scan, hits `GET /api/verify/[code]`
- Displays result with large, unmistakable feedback:
  - **VALID:** Large green screen, check mark, guest name, "WELCOME"
  - **ALREADY USED:** Large red/orange screen, X mark, guest name, "Already checked in at [time]"
  - **NOT FOUND:** Large red screen, "INVALID TICKET"
- Auto-reset to scanning after 3 seconds
- Works offline-tolerant (if network drops, queue scans and retry)
- No login required to access the scanner (keep it simple for volunteers) BUT add a simple PIN gate (e.g., 4-digit code set via env var `SCANNER_PIN`) so random people can't access it
- Show running count: "Checked in: X / Y registered"

### PWA Setup

- Add a web app manifest so volunteers can "Add to Home Screen"
- Service worker for camera permissions caching
- Lock to portrait orientation if possible

```typescript
// Scanner page component pseudocode
// 1. PIN entry screen (4-digit code)
// 2. Camera scanner view
// 3. Result overlay (green/red) with auto-dismiss
// 4. Running stats bar at bottom
```

---

## 7. Admin Dashboard Addition

Add a section to the existing admin area (behind NextAuth).

### Registration Management View

- Table of all registrations with columns: Name, Email, Employer, Registered Date, Email Sent, Checked In
- Search/filter bar
- Stats cards at top: Total Registered, Emails Sent, Checked In, Remaining
- Resend email button per row
- Export to CSV button
- Real-time or polling updates for check-in count during the event

---

## 8. Environment Variables

Add these to both `.env.local` and Vercel dashboard:

```
RESEND_API_KEY=re_xxxxxxxxxxxx
SCANNER_PIN=1234
```

The existing `DATABASE_URL` (Neon) and NextAuth vars should already be set.

---

## 9. NPM Packages to Install

```bash
npm install qrcode resend html5-qrcode
npm install -D @types/qrcode
```

---

## 10. Implementation Order

Build in this sequence — each phase is independently testable:

### Phase 1: Database + Registration API
1. Add `registrations` table to Neon (run migration)
2. Build `POST /api/register` (without email — just DB insert)
3. Build registration form page at `/register`
4. Test: form submits, record appears in DB

### Phase 2: QR + Email
1. Add QR code generation utility
2. Set up Resend integration
3. Build email template
4. Wire email sending into registration flow
5. Test: register → email arrives with QR code

### Phase 3: Door Scanner
1. Build `/scan` page with PIN gate
2. Integrate camera QR scanning
3. Build `GET /api/verify/[code]` endpoint
4. Wire scanner to verify endpoint
5. Test: scan a QR code from a test email → green/red result

### Phase 4: Admin Dashboard
1. Build `GET /api/admin/registrations` endpoint
2. Add registration management UI to admin area
3. Add resend + export functionality
4. Test: view registrations, resend email, export CSV

---

## 11. Testing Checklist

Before going live, verify:

- [ ] Registration form validates all inputs
- [ ] Duplicate email is rejected with friendly message
- [ ] QR code generates and encodes correct ticket code
- [ ] Email arrives with visible QR code (test Gmail, Outlook, Apple Mail)
- [ ] QR code scans successfully with the door scanner
- [ ] First scan shows green/valid
- [ ] Second scan of same code shows red/already used
- [ ] Invalid/random QR shows red/not found
- [ ] Admin dashboard shows all registrations
- [ ] Admin can resend email
- [ ] CSV export works
- [ ] Registration cap (500) blocks new signups when reached
- [ ] Scanner PIN gate works
- [ ] Everything works on mobile (registration + scanner)
- [ ] All API routes handle errors gracefully (DB down, email fails, etc.)
- [ ] Rate limiting prevents spam registrations

---

## 12. Security Notes

- `ticket_code` is the only thing in the QR — no PII
- Scanner PIN is a convenience gate, not high security (this is fine)
- Rate limit registration endpoint
- Sanitize all inputs (SQL injection, XSS)
- `DATABASE_URL` and `RESEND_API_KEY` never exposed client-side
- Admin routes check NextAuth session
- HTTPS everywhere (Vercel handles this)

---

## 13. Post-Build: Resend Domain Setup

For production emails to not land in spam:
1. Go to resend.com → Domains → Add `nursingrocksconcerts.com`
2. Add the DNS records Resend provides (SPF, DKIM, DMARC) to Cloudflare
3. Verify domain in Resend
4. Update the `from` address in the email send function

If you skip this step, use Resend's shared sender for testing but emails may hit spam folders.

---

## Summary

**New pages:** `/register`, `/scan`
**New API routes:** `/api/register`, `/api/verify/[code]`, `/api/admin/registrations`, `/api/admin/registrations/resend/[id]`, `/api/admin/registrations/export`
**New DB table:** `registrations`
**New packages:** `qrcode`, `resend`, `html5-qrcode`
**New env vars:** `RESEND_API_KEY`, `SCANNER_PIN`
**Cost:** $0 (all free tiers)
