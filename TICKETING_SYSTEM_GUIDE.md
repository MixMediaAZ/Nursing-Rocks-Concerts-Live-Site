# Production Ticketing System - Complete Implementation Guide

## Overview

This document describes the complete, production-grade event ticketing system that has been implemented. When an admin verifies a user in the dashboard, the following happens:

**User Verification Flow:**
```
Admin clicks "Verify" on user
  ↓
verifyUser() called
  ↓
1. Mark user as verified (is_verified=true, status='verified')
  ↓
2. Get all eligible events (published, future dates)
  ↓
3. For each event: issueTicketForEvent()
   - Check if ticket exists
   - Generate signed QR token (JWT)
   - Generate human-readable ticket code (NR-2026-ABC123)
   - Create QR image
   - Store in database
  ↓
4. For each ticket: sendTicketIssuedEmail()
   - Send email with event details
   - Include QR code image
   - Include ticket code
   - Include anti-sharing warning
  ↓
5. Create verification_audit_logs entry
   - Track who verified user
   - Track timestamp
   - Track previous/new state
  ↓
User receives email(s) with QR ticket(s)
User can now attend event(s)
```

## Database Schema

### New/Updated Tables

#### `users` (Extended)
```sql
-- New columns:
verified_at TIMESTAMP NULL          -- When user was verified
verification_source VARCHAR(50)     -- 'admin' or 'auto'
verification_notes TEXT             -- Admin notes
status VARCHAR(20)                  -- 'pending', 'verified', 'unverified', 'suspended'
```

#### `events` (Extended)
```sql
-- New columns:
end_at TIMESTAMP                    -- When event ends
ticket_expiration_at TIMESTAMP      -- When tickets expire (end + 7 days)
capacity INTEGER                    -- Event capacity
status VARCHAR(20)                  -- 'draft', 'published', etc.
slug VARCHAR(255)                   -- URL-friendly event identifier
```

#### `tickets` (Completely Redesigned)
```sql
-- Core fields
id UUID PRIMARY KEY                 -- Unique ticket ID
user_id INTEGER REFERENCES users    -- Who owns this ticket
event_id INTEGER REFERENCES events  -- Which event

-- Identification
ticket_code VARCHAR(64)             -- Human-readable: NR-2026-ABC123
qr_token TEXT                       -- Signed JWT with ticket data
qr_image_url TEXT                   -- URL to QR image

-- Status & Lifecycle
status VARCHAR(20)                  -- 'active', 'checked_in', 'revoked', 'expired'
issued_at TIMESTAMP                 -- When ticket was created
emailed_at TIMESTAMP                -- When email was sent
expires_at TIMESTAMP                -- When ticket expires
checked_in_at TIMESTAMP             -- When user checked in
revoked_at TIMESTAMP                -- When ticket was revoked
revoke_reason TEXT                  -- Why it was revoked

-- Email tracking
email_status VARCHAR(20)            -- 'pending', 'sent', 'failed'
email_error TEXT                    -- If email failed, why

-- Anti-sharing & Device Tracking
first_scan_ip VARCHAR(128)          -- First device to scan from
first_scan_user_agent TEXT          -- Browser/device info
first_scan_device_fingerprint       -- Device identifier
last_scan_at TIMESTAMP              -- Latest scan time
scan_count INTEGER                  -- Total scan attempts

-- Reissuance tracking
reissued_from_ticket_id UUID        -- If reissued, link to old ticket

-- Constraints:
UNIQUE(user_id, event_id)           -- Only one ticket per user per event
UNIQUE(ticket_code)                 -- Codes are unique
UNIQUE(qr_token)                    -- Tokens are unique
```

#### `ticket_scan_logs` (New)
Complete audit trail of every scan attempt:
```sql
id UUID PRIMARY KEY
ticket_id UUID REFERENCES tickets   -- Which ticket
user_id INTEGER REFERENCES users    -- Whose ticket
event_id INTEGER REFERENCES events  -- At which event

scanned_at TIMESTAMP                -- When scanned
scanner_user_id INTEGER             -- Who scanned it (staff/admin)
scanner_device_id VARCHAR(255)      -- Scanner device identifier
ip_address VARCHAR(128)             -- IP of scanner
user_agent TEXT                     -- Device/browser info
device_fingerprint VARCHAR(255)     -- Device fingerprint

result VARCHAR(20)                  -- 'accepted' or 'rejected'
reason VARCHAR(255)                 -- Why (checked_in, already_used, expired, etc.)
```

#### `verification_audit_logs` (New)
Complete audit trail of verification actions:
```sql
id UUID PRIMARY KEY
user_id INTEGER REFERENCES users    -- Which user
admin_user_id INTEGER               -- Which admin did it
action VARCHAR(50)                  -- 'admin_verify', 'admin_unverify', etc.
previous_verified_state BOOLEAN     -- Before state
new_verified_state BOOLEAN          -- After state
notes TEXT                          -- Any notes
created_at TIMESTAMP                -- When
```

## Core Services

### 1. QR Service (`server/services/qr.ts`)

**Purpose:** Generate, sign, and verify QR codes

**Key Functions:**

#### `signQrPayload(payload: QRPayload, expiresAt: Date): string`
Creates a signed JWT token containing:
```typescript
{
  ticketId: uuid,
  userId: number,
  eventId: number,
  ticketCode: "NR-2026-ABC123",
  type: "event_ticket"
}
```
- Signed with `QR_TOKEN_SECRET` (from env, fallback for dev)
- Expires at ticket expiration time
- Algorithm: HS256 (HMAC-SHA256)

#### `verifyQrToken(token: string): QRPayload`
- Verifies signature (detects tampering)
- Checks expiration
- Returns decoded payload or throws error

#### `generateTicketCode(eventId, year): string`
- Format: `NR-YYYY-XXXXXX` (e.g., `NR-2026-7K4M9Q`)
- Year: current year or specified
- 6 random alphanumeric characters
- Human-readable, printable, typeable

#### `renderQrCode(qrToken): Promise<string>`
- Generates QR code as PNG data URL
- 300x300 pixels
- High error correction (H level - 30% recoverable)
- Can be embedded in HTML

#### `generateAndStoreQrImage(qrToken, ticketId): Promise<string>`
- Currently returns data URL
- Can be extended to store on Cloudinary/S3 and return CDN URL

### 2. Ticket Service (`server/services/tickets.ts`)

**Purpose:** Manage ticket lifecycle

**Key Functions:**

#### `issueTicketForEvent(userId, eventId)`
- **Idempotent**: Returns existing active ticket if one exists
- Workflow:
  1. Check if ticket already exists
  2. If active/checked-in, return it
  3. If revoked/expired, don't auto-reissue
  4. Get event details
  5. Generate ticket code
  6. Sign QR token
  7. Create ticket record
  8. Generate QR image
  9. Return ticket

#### `getEligibleEventsForUser(userId): Event[]`
- Returns all events where user can get tickets
- Criteria: `status = 'published'` AND `end_at >= now()`
- User must be verified to use `issueTicketForEvent`

#### `revokeTicket(ticketId, reason): Ticket`
- Sets status to 'revoked'
- Records revoke reason
- Updates timestamps

#### `markTicketExpired(ticketId)`
- Sets status to 'expired'
- Called automatically on scan of expired ticket
- Can be run as scheduled job

#### `getUserTickets(userId): Ticket[]`
- Returns all tickets for a user (active, past, revoked)

#### `expireTicketsForPastEvents()`
- **Scheduled job** - run hourly or daily
- Finds all active tickets with `expires_at < now()`
- Marks them as expired
- Prevents expired tickets from being checked in

### 3. Verification Service (`server/services/verification.ts`)

**Purpose:** Handle user verification and its cascading effects

**Key Functions:**

#### `verifyUser(userId, adminUserId): { success: true }`
Workflow:
1. Check if user exists
2. Only proceed if `is_verified` is currently false
3. Update user:
   - `is_verified = true`
   - `status = 'verified'`
   - `verified_at = now()`
   - `verification_source = 'admin'`
4. Create audit log entry
5. Get eligible events
6. For each event:
   - Issue ticket
   - Send email
   - Log any failures but don't fail operation
7. Return success

**Important:** Only transitions `false → true`. Won't blindly reissue if already verified.

#### `unverifyUser(userId, adminUserId): { success: true }`
Workflow:
1. Update user:
   - `is_verified = false`
   - `status = 'unverified'`
2. Create audit log entry
3. Get all active, future, unchecked-in tickets
4. Revoke each one with reason "User unverified by admin"
5. **Preserve** checked-in tickets (audit trail)

#### `getUserVerificationStatus(userId): Status`
Returns:
```typescript
{
  user: User,
  isVerified: boolean,
  status: 'pending'|'verified'|'unverified'|'suspended',
  verifiedAt: Date|null,
  verificationSource: 'admin'|'auto'|null,
  eligibleEventCount: number,        // How many events user can attend
  activeTicketCount: number,         // Active tickets
  checkedInCount: number,            // Already used
  revokedCount: number,              // Revoked tickets
}
```

### 4. Email Service (`server/services/email.ts`)

**Purpose:** Send transactional ticket emails

**Key Functions:**

#### `sendTicketIssuedEmail(userId, eventId, ticketId)`
- Loads user, event, ticket details
- Builds HTML email with:
  - User greeting
  - Event details (date, time, location, title)
  - Ticket code (human-readable)
  - QR code image
  - Anti-sharing warning
  - Support contact info
- Currently **logs to console** - replace with:
  - Resend (included in package.json)
  - SendGrid
  - Mailgun
  - Your email provider

**Email Template Includes:**
- Hero header with "You're In! 🎸"
- Event details section
- QR code display
- Ticket code in monospace
- Warning: "Do not share. Single-use. Tied to your name."
- Support email

#### `resendTicketEmail(ticketId)`
- Resends an existing ticket email
- Called via admin action
- Updates `emailed_at` timestamp

### 5. Scan Service (`server/services/scan.ts`)

**Purpose:** Validate QR codes at event gate

**Key Functions:**

#### `scanTicket(input: ScanInput, ctx: ScanContext): ScanResult`
Validation chain:
1. **Verify QR signature** - `verifyQrToken()` checks HS256 signature
2. **Load ticket** - Get from DB using decoded ticketId
3. **Match token** - Verify QR token matches DB
4. **Match event** - Verify event_id matches
5. **Check revocation** - Reject if revoked
6. **Check expiration** - Reject if expired
7. **Check already used** - Reject if checked_in
8. **Anti-sharing checks** - Device fingerprint matching
9. **Check in** - If all pass:
   - Set `status = 'checked_in'`
   - Set `checked_in_at = now()`
   - Increment `scan_count`
   - Store first device info
10. **Log scan** - Create ticket_scan_logs entry

Returns:
```typescript
{
  ok: boolean,
  reason: string,  // 'checked_in', 'expired', 'already_used', etc.
  message: string, // Human-readable
  ticketCode?: string,
  userName?: string,
}
```

**Anti-Sharing Logic:**
- **Single-use check**: Once `checked_in`, subsequent scans rejected
- **Device matching**: First scan device is recorded; subsequent scans must match
- **IP tracking**: First IP recorded; flagged if different (but doesn't block)
- **Scan audit**: Every attempt logged with result and reason

## API Routes

### Admin Routes (Require `requireAdminToken`)

#### `PATCH /api/admin/users/:id/verify`
Verify or unverify a user
```json
Request:
{
  "verified": true,
  "notes": "Approved"
}

Response:
{
  "user": User,
  "isVerified": true,
  "status": "verified",
  "verifiedAt": "2026-03-29T...",
  "eligibleEventCount": 3,
  "activeTicketCount": 3,
  ...
}
```

#### `GET /api/admin/users/:id/tickets`
Get all tickets for a user
```json
Response: Ticket[]
```

#### `POST /api/admin/tickets/:id/resend-email`
Resend ticket email
```json
Request: {}
Response: { "message": "Ticket email resent successfully" }
```

#### `POST /api/admin/tickets/:id/revoke`
Revoke a ticket
```json
Request:
{
  "reason": "Fraud suspected"
}

Response: Ticket (with status='revoked')
```

### Public Routes

#### `POST /api/tickets/scan`
Scan a QR code at the gate
```json
Request:
{
  "qrToken": "eyJhbGc...",
  "eventId": 123,
  "deviceFingerprint": "device-id-xyz"  // optional
}

Response:
{
  "ok": true,
  "reason": "checked_in",
  "message": "Ticket accepted",
  "ticketCode": "NR-2026-ABC123"
}
```

#### `GET /api/me/tickets`
Get my tickets (requires authentication)
```json
Response: Ticket[]
```

## Implementation Checklist

### Phase 1: Database ✅
- [x] Create migration file: `migrations/003_ticketing_system.sql`
- [x] Schema changes: `shared/schema.ts`
- [ ] Run migration: `npm run db:push`

### Phase 2: Services ✅
- [x] QR service: `server/services/qr.ts`
- [x] Ticket service: `server/services/tickets.ts`
- [x] Verification service: `server/services/verification.ts`
- [x] Email service: `server/services/email.ts`
- [x] Scan service: `server/services/scan.ts`

### Phase 3: Routes ✅
- [x] Add verification routes
- [x] Add ticket routes
- [x] Add scan endpoint

### Phase 4: Configuration
- [ ] Set `QR_TOKEN_SECRET` env var (JWT secret for QR tokens)
- [ ] Set up email service (Resend API key, etc.)
- [ ] Set up scheduled job for `expireTicketsForPastEvents()`

### Phase 5: Admin UI
- [ ] Update admin dashboard user list to show verification status
- [ ] Add "Verify" button that triggers new endpoint
- [ ] Show eligible event count
- [ ] Show active ticket count
- [ ] Link to view/manage user's tickets

### Phase 6: Testing
- [ ] Test user verification flow end-to-end
- [ ] Test QR generation and scanning
- [ ] Test anti-sharing protection
- [ ] Test email sending
- [ ] Test ticket expiration
- [ ] Test audit logging

## Configuration

### Environment Variables
```bash
# QR Token Secret (for signing QR codes)
QR_TOKEN_SECRET=your-secret-key-change-in-production

# Email Service (when implemented)
# For Resend:
RESEND_API_KEY=re_xxxxx

# Or for SendGrid:
SENDGRID_API_KEY=SG_xxxxx
```

### Scheduled Jobs

Add these to your job scheduler (cron, APScheduler, etc.):

```typescript
// Expire old tickets - run hourly or daily
import { expireTicketsForPastEvents } from "@/server/services/tickets";

setInterval(async () => {
  try {
    await expireTicketsForPastEvents();
    console.log("[Job] Expired past tickets");
  } catch (error) {
    console.error("[Job] Error expiring tickets:", error);
  }
}, 60 * 60 * 1000); // Every hour
```

## Key Design Decisions

### 1. JWT for QR Tokens
- **Why**: Self-contained, signed, verifiable without DB lookup on first pass
- **Security**: HMAC-SHA256 signature prevents tampering
- **Fallback**: Always verify against DB to ensure ticket hasn't been revoked

### 2. Single-Use Tickets
- **Why**: Simplest anti-sharing mechanism
- **How**: Once `checked_in`, status is permanently marked; scans rejected
- **Audit**: Full history in `ticket_scan_logs`

### 3. Device Fingerprinting
- **Why**: Detect if ticket is shared between devices
- **How**: Store first device info; flag mismatches
- **Limitation**: Can be spoofed; use with single-use enforcement

### 4. Idempotent Issuance
- **Why**: Safe to retry if email fails or system crashes
- **How**: Always check if ticket exists before creating
- **Behavior**: Returns existing if active/checked-in; doesn't blindly reissue

### 5. Preserved Checked-In Tickets
- **Why**: Audit trail - need to know who attended
- **How**: Unverify revokes *future* active tickets, preserves checked-in
- **Result**: Admin can see exactly who checked in before being unverified

### 6. Async Email with Fallback
- **Why**: Email failures shouldn't block ticket creation
- **How**: Log failure but continue; admin can resend later
- **State Tracking**: `email_status` field tracks 'pending', 'sent', 'failed'

## Troubleshooting

### QR Code Won't Scan
- Check `qr_token` is being stored correctly
- Verify `QR_TOKEN_SECRET` is consistent
- Check expiration time

### Ticket Shows as Expired but Shouldn't Be
- Verify `ticket_expiration_at` is calculated as `event.end_at + 7 days`
- Check system time is correct

### Email Not Sending
- Check email service is configured (currently logs to console)
- Verify user email address is correct
- Check `email_status` field in tickets table

### Anti-Sharing False Positives
- Device fingerprint can vary between scans
- Consider IP-based detection secondary
- Single-use enforcement is primary protection

## Future Enhancements

1. **Reissue Policy**: Implement controlled reissuance for lost/stolen emails
2. **Email Service Integration**: Replace console.log with Resend/SendGrid
3. **QR Storage**: Store QR images on CDN instead of data URLs
4. **Batch Operations**: Verify multiple users at once
5. **Event Gating**: Different tickets for different event types
6. **Specialty-Based Eligibility**: Only certain nurses eligible for certain events
7. **Mobile App**: Native app for gate scanning
8. **Real-time Reporting**: Live dashboard of who's checked in
9. **Fraud Detection**: Machine learning on scan patterns
10. **Webhook Notifications**: Notify organizers when users verify

## Support

Questions or issues? Check:
1. Database migration status: `npm run db:check`
2. Service logs: Console output during verify action
3. Audit logs: Query `verification_audit_logs` table
4. Scan logs: Query `ticket_scan_logs` for scan history
