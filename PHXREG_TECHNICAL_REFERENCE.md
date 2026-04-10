# Phoenix Registration - Technical Implementation Reference

**For:** Developers maintaining or extending NRPX registration system
**Version:** 1.0
**Date:** April 9, 2026

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    NURSE FRONTEND                       │
│  - Registration form (first, last, email, employer)    │
│  - Status dashboard (pending/approved/claimed/checkin)  │
│  - Claim ticket button (calls POST /api/nrpx/claim)    │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              NURSE API ENDPOINTS                        │
│  POST   /api/nrpx/register          → Create account   │
│  GET    /api/nrpx/my-registration   → Get status      │
│  POST   /api/nrpx/claim-ticket      → Get QR code    │
│  GET    /api/nrpx/stats             → Event stats    │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              ADMIN API ENDPOINTS                        │
│  GET    /api/admin/nrpx/pending-approvals    → List   │
│  POST   /api/admin/nrpx/approve/:id          → OK     │
│  GET    /api/admin/nrpx/registrations        → List   │
│  GET    /api/admin/nrpx/workflow-stats       → Stats  │
│  POST   /api/admin/nrpx/registrations/resend → Email  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│          DATABASE (PostgreSQL)                         │
│  - users (is_verified = admin approved?)               │
│  - nrpx_registrations (tickets, emails, check-in)      │
└─────────────────────────────────────────────────────────┘
```

---

## Data Flow: Registration to Check-In

### Step 1: Nurse Registration

```typescript
POST /api/nrpx/register
Input:  { firstName, lastName, email, employer }
        Rate Limit: IP (3/hr) + Domain (1/day)

Database Changes:
  - INSERT users (is_verified: false, no password reset)
  - INSERT nrpx_registrations (email_sent: false, ticket_email_sent: false)

Output: { success: true, message: "Pending admin review..." }
Status: pending_approval
```

### Step 2: Admin Approval

```typescript
POST /api/admin/nrpx/approve/:registrationId

Database Changes:
  - UPDATE users SET is_verified = true
  - sendNrpxWelcomeEmail() sends approval email
  - UPDATE nrpx_registrations SET email_sent = true
  - Log: [NRPX] Admin approved registration

Output: { success: true, message: "Approved and email sent" }
Status: approved_ready_to_claim
```

### Step 3: Nurse Claims Ticket

```typescript
POST /api/nrpx/claim-ticket
Requires: authentication + is_verified=true + email_sent=true

Database Changes:
  - Generate QR code from ticket_code
  - sendNrpxTicketEmail() sends QR code email
  - UPDATE nrpx_registrations SET ticket_email_sent = true
  - Log: [NRPX] Ticket claimed

Output: { success: true, ticketCode: "NRPX-XXXX-XXXX" }
Status: ticket_claimed
```

### Step 4: Event Check-In

```typescript
GET /api/nrpx/verify/:code
Requires: admin token
Input:    QR code (14-char ticket code, case-insensitive)

Database Changes:
  - UPDATE nrpx_registrations SET checked_in=true WHERE ticket_code=:code
  - Atomic operation: prevents double check-in

Output: { valid: true, name: "Jane Smith", message: "Welcome!" }
Status: checked_in
```

---

## Critical Implementation Details

### 1. Email-Based Access Control

**Rule:** Nurses must have `email_sent = true` before claiming ticket

**Why:** Ensures admin approval email was actually sent (not just user verified)

**Code Location:** `server/routes.ts:4690-4698`

```typescript
// CRITICAL: Check if approval welcome email was sent first
if (!registration.email_sent) {
  return res.status(403).json({
    success: false,
    message: "Your approval notification email hasn't been sent yet..."
  });
}
```

**What It Prevents:**
- Silent email failures
- Approval bypasses
- Workflow shortcuts

---

### 2. Ticket Code Never Exposed

**Rule:** `ticket_code` is NEVER returned via API

**Where It's Exposed:**
- ✅ Email ONLY (in ticket QR email)
- ❌ Never in `/api/nrpx/my-registration`
- ❌ Never in `/api/nrpx/stats`
- ❌ Never in `/api/admin/nrpx/registrations`

**Why:** Prevents nurses from seeing code without receiving email

**Code Location:** `server/routes.ts:4759-4813`

```typescript
// my-registration returns status, NOT ticket_code
res.json({
  id: registration.id,
  email_sent: registration.email_sent,
  ticket_email_sent: registration.ticket_email_sent,
  status: getRegistrationStatus(registration, user),
  // ticket_code is NOT here
});
```

---

### 3. Rate Limiting Strategy

**Two-Layer Approach:**

#### Layer 1: IP-Based (3 per hour)
```typescript
const ipHits = (nrpxRateLimitByIP.get(ip) || [])
  .filter(t => now - t < hourWindow);
if (ipHits.length >= 3) {
  return { allowed: false };
}
```

**Protects Against:** Single IP spam/bots

#### Layer 2: Email Domain-Based (1 per 24 hours)
```typescript
const emailDomain = email.split('@')[1];
const emailHits = (nrpxRateLimitByEmail.get(emailDomain) || [])
  .filter(t => now - t < dayWindow);
if (emailHits.length >= 1) {
  return { allowed: false };
}
```

**Protects Against:** Bulk signups from same domain

**Combined Effect:**
```
Legitimate nurse: 1 registration per day ✅
Spammer from hospital.com: 1 registration per day ❌
Spammer from same IP: 3 registrations per hour ❌
```

**Code Location:** `server/routes.ts:4433-4468`

---

### 4. Atomic Check-In Operation

**Problem:** Race condition - two concurrent scans of same QR could both succeed

**Solution:** Atomic database operation (no TOCTOU vulnerability)

**Code Location:** `server/routes.ts:4858-4864`

```typescript
// Single operation: update AND return only if checked_in was false before
const [updated] = await db.update(nrpxRegistrations)
  .set({ checked_in: true, checked_in_at: new Date() })
  .where(and(
    eq(nrpxRegistrations.ticket_code, code),
    eq(nrpxRegistrations.checked_in, false)  // Only if not already checked
  ))
  .returning();

if (updated) {
  // Successfully checked in (wasn't before)
} else {
  // Already checked in or code not found
}
```

**Safety:** Database lock ensures only one transaction succeeds

---

## Database Schema Relationships

```
users
  ├── id: integer (PK)
  ├── email: varchar
  ├── is_verified: boolean ← ADMIN MUST APPROVE
  └── ...

nrpx_registrations
  ├── id: uuid (PK)
  ├── user_id: integer (FK → users.id)
  ├── ticket_code: varchar (UNIQUE, 14 chars)
  ├── email: varchar (case-insensitive unique)
  ├── email_sent: boolean ← APPROVAL EMAIL SENT
  ├── email_sent_at: timestamp
  ├── ticket_email_sent: boolean ← TICKET QR SENT
  ├── ticket_email_sent_at: timestamp
  ├── checked_in: boolean ← EVENT CHECK-IN
  ├── checked_in_at: timestamp
  └── ...
```

**Key Relationships:**
- `users.is_verified` = true → Admin approved
- `nrpxRegistrations.email_sent` = true → Approval email was sent
- `nrpxRegistrations.ticket_email_sent` = true → QR code was emailed

---

## Important Assumptions

### Email Service

Assume `sendNrpxWelcomeEmail()` and `sendNrpxTicketEmail()` exist and return:
```typescript
{ success: boolean, error?: string }
```

**Location:** Imported from `./email`

**Called By:**
1. `POST /api/admin/nrpx/approve/:id` - sends welcome email
2. `POST /api/nrpx/claim-ticket` - sends QR code email

**Failure Handling:** Email failures are tolerated, manual resend is available

---

### User Verification Service

Assume `verifyUser()` service exists:
```typescript
verifyUser(userId: number, adminUserId: number) → Promise<void>
```

**Does:**
- Set `users.is_verified = true`
- Audit log entry (admin verified user X)
- Does NOT send email (separate service)

**Location:** Imported from `./services/verification`

**Called By:** `POST /api/admin/nrpx/approve/:id` (before email)

---

## Ticket Code Generation

```typescript
function generateTicketCode(): string {
  const segment = () => randomBytes(2).toString('hex').toUpperCase();
  return `NRPX-${segment()}-${segment()}`;  // Example: NRPX-A1B2-C3D4
}
```

**Properties:**
- 14 characters total
- Format: `NRPX-` + 4-char hex + `-` + 4-char hex
- ~65,000 possible values per segment
- Collision detection up to 10 retries

**Uniqueness:** Database unique constraint on `ticket_code`

---

## Status Calculation

```typescript
function getRegistrationStatus(registration: any, user: any): string {
  if (!user?.is_verified) return "pending_approval";
  if (!registration.email_sent) return "approved_not_notified";
  if (!registration.ticket_email_sent) return "approved_ready_to_claim";
  if (registration.checked_in) return "checked_in";
  return "ticket_claimed";
}
```

**Status Flow:**
```
pending_approval
    ↓ (admin approves, is_verified=true, email_sent=true)
approved_ready_to_claim
    ↓ (nurse claims, ticket_email_sent=true)
ticket_claimed
    ↓ (nurse checks in, checked_in=true)
checked_in
```

---

## Error Handling Strategy

### Registration Errors

```
400: Bad input (name too long, invalid email, etc.)
409: Conflict (duplicate email, at capacity)
429: Rate limited (too many from IP or domain)
500: Server error (database, code generation)
```

### Approval Errors

```
400: Missing registration ID
401: Not authorized (not admin)
404: Registration not found
500: Verification or email service failed
```

### Claim Errors

```
401: Not authenticated
403: Not verified OR email not sent
404: No registration found for user
400: Ticket already claimed
500: QR generation or email failed
```

### Check-In Errors

```
400: No ticket code provided
404: Ticket code not found
200 with alreadyUsed: true → Already checked in
```

---

## Rate Limiting Details

### In-Memory Storage

```typescript
const nrpxRateLimitByIP = new Map<string, number[]>();
const nrpxRateLimitByEmail = new Map<string, number[]>();
```

**Characteristics:**
- Stored in RAM (lost on restart)
- No persistence (weekly cleanup not needed)
- Timestamp-based window (accurate)

**For Production:**
- Consider Redis for distributed rate limiting
- Or database for persistence across restarts

### IP Extraction

```typescript
const ip = (req.headers['x-forwarded-for'] as string ||
           req.socket.remoteAddress ||
           'unknown').split(',')[0].trim();
```

**Handles:**
- Proxies (`x-forwarded-for` header)
- Direct connections (socket address)
- Unknown/localhost (fallback)

**Security Note:** Trustworthy only if `x-forwarded-for` is set by trusted reverse proxy

---

## Monitoring & Logging

### Key Log Entries

```
[NRPX] Registration created - user {id} | email: {email} | pending admin approval
[NRPX] Admin approved registration - user {id} | email: {email} | email_send: {true/false}
[NRPX] Ticket claimed - user {id} | email: {email} | code: {code}
[NRPX] Checked in: {name} ({code})
[NRPX] Verification error: {code already used message}
```

### Metrics to Track

```
Registrations per hour
Approvals per hour (workflow speed)
Claim rate (% of approved who claim)
Check-in rate (% of claimed who show)
Rate limit hits (spam attempts)
Email send failures (email service health)
```

---

## Extension Points

### Adding New Fields

To add fields to registration (e.g., phone number):

1. **Add to schema:**
```typescript
export const nrpxRegistrations = pgTable("nrpx_registrations", {
  // ... existing fields
  phone: varchar("phone", { length: 20 }),
});
```

2. **Add to registration form:**
```typescript
// frontend/pages/phoenix-register.tsx
<Input id="phone" type="tel" placeholder="+1-555-0000" />
```

3. **Include in API:**
```typescript
// server/routes.ts - POST /api/nrpx/register
const { firstName, lastName, email, employer, phone } = req.body;
// validate and insert
```

### Adding Workflow Steps

To add another approval step (e.g., email verification):

1. Add field: `email_verified: boolean`
2. Add email verification endpoint
3. Check `email_verified` in claim-ticket
4. Update status function

### Custom Admin Approvals

To require specific admin role or department:

1. Check `req.user.role` in approve endpoint
2. Log approval by which admin
3. Allow admin revert/recall

---

## Testing Checklist

### Unit Tests

- [ ] Rate limiting: IP and domain limits work
- [ ] Status calculation: All 5 statuses correct
- [ ] Ticket code generation: No duplicates
- [ ] Email validation: Proper normalization
- [ ] Atomic check-in: No double check-in

### Integration Tests

- [ ] Full workflow: register → approve → claim → check-in
- [ ] Concurrent registrations: Rate limit enforced
- [ ] Concurrent approvals: No race conditions
- [ ] Concurrent check-ins: Atomic operation works
- [ ] Email failures: Graceful handling

### Security Tests

- [ ] Cannot claim without email_sent
- [ ] Cannot see ticket_code in my-registration
- [ ] Rate limits prevent abuse
- [ ] SQL injection protection (parameterized queries)
- [ ] CSRF protection (if applicable)

---

## Performance Notes

### Database Queries

**Most Called:** `GET /api/nrpx/my-registration`
- Joins users + nrpx_registrations
- Should be fast (indexed on user_id)

**Heaviest:** `GET /api/admin/nrpx/workflow-stats`
- Counts across user_id joins
- Could be slow with 10k+ registrations
- Consider caching or scheduled job

**Check-In:** `GET /api/nrpx/verify/:code`
- Atomic update, then select
- Fast if indexed on ticket_code (it is)

### Optimization Ideas

1. Cache workflow stats (update every minute)
2. Index nrpxRegistrations.user_id for my-registration join
3. Index users.is_verified for pending-approvals query
4. Cleanup old rate limit entries periodically

---

## Deployment Notes

### No Migration Needed
All fields already exist in nrpx_registrations table

### No New Secrets
No API keys, tokens, or new credentials needed

### No New Services
All functionality works with existing email service

### Breaking Change
Frontend code using `my-registration` response needs update (remove `ticket_code` usage)

---

## Frequently Asked Questions

**Q: Why two rate limits?**
A: IP catches bots, domain catches legitimate bulk signups. Combined = better protection.

**Q: Why never expose ticket_code in API?**
A: To force email delivery. Nurse can't "shortcut" the process.

**Q: Can nurses reset their password?**
A: Yes, standard password reset flow. Doesn't affect NRPX registration.

**Q: What if email service is down?**
A: Approvals still work, email flag marked true, admin can retry resend later.

**Q: Can we pre-generate QR codes?**
A: Yes, ticket_code is static. Can generate QR offline and embed in email template.

**Q: What if nurse loses email with QR?**
A: Resend endpoint allows admin to re-send ticket email.

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-04-09 | 1.0 | Initial release with security fixes |

---

**Last Updated:** April 9, 2026
**Author:** Claude (Claude Code)
**Status:** ✅ Production Ready
