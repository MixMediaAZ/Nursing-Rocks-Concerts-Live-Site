# Ticketing System - Complete Setup & Deployment Guide

## ⚠️ CRITICAL: Setup Steps Required BEFORE Using

Follow these steps in order to make the ticketing system fully functional.

---

## Step 1: Environment Variables (5 minutes)

Make sure your `.env` file has these variables:

```bash
# DATABASE CONNECTION (required)
DATABASE_URL=postgresql://user:password@host/dbname

# TICKETING SYSTEM SECRETS (required)
QR_TOKEN_SECRET=your-strong-random-secret-min-32-chars

# EMAIL SERVICE (required for production)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
SENDER_EMAIL=noreply@nursingrocks.com
SUPPORT_EMAIL=support@nursingrocks.com

# NODE ENVIRONMENT
NODE_ENV=development
```

**Getting Values:**
- `DATABASE_URL`: From Neon console or your database provider
- `QR_TOKEN_SECRET`: Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `RESEND_API_KEY`: From https://resend.com (sign up, copy API key)

---

## Step 2: Apply Database Migration (5 minutes)

The ticketing system requires new database tables and schema updates.

**Option A: Using Drizzle Kit (Recommended)**

```bash
npm run db:push
```

This will:
- Read `shared/schema.ts`
- Generate migrations
- Apply to your database
- Show status

**Option B: Using Custom Script**

```bash
node scripts/apply-migration.js
```

This will:
- Read `migrations/003_ticketing_system.sql`
- Execute against your database
- Show status

**Verify Success:**

```sql
-- In your database console, run:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('tickets', 'ticket_scan_logs', 'verification_audit_logs');
```

Should return 3 tables.

---

## Step 3: Install Dependencies (2 minutes)

```bash
npm install
```

Makes sure all packages including Resend, QRCode, JWT, etc. are installed.

---

## Step 4: Compile & Build (5 minutes)

```bash
npm run check  # Verify TypeScript
npm run build  # Build frontend and backend
```

Should complete with zero errors.

---

## Step 5: Start Development Server (1 minute)

```bash
npm run dev
```

Should see:
```
[db] Database connection successful
[Email] ✅ Resend client initialized successfully
✅ Server running on port 5000
```

---

## Step 6: Test the Complete Flow (15 minutes)

### Test 1: Admin Verify a User

```bash
# 1. Open admin dashboard
# http://localhost:3000/admin

# 2. Find a test user in the Users section

# 3. Click the "Verify" button

# Should see:
# - User marked as verified
# - Toast: "User verified, X tickets created, emails sent"
# - Check logs for email confirmation
```

### Test 2: Check Tickets Were Created

```sql
-- In database:
SELECT id, ticket_code, status, email_status FROM tickets WHERE user_id = 123;
```

Should see tickets with:
- `status: 'issued'`
- `email_status: 'sent'` (or 'pending' in dev mode)
- `qr_token`: JWT string
- `qr_image_url`: data URL

### Test 3: View Ticket QR Code

```bash
# Via API:
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:5000/api/admin/tickets/TICKET_ID/qr

# Should return:
# {
#   "ticketCode": "NR-2026-ABC123",
#   "qrToken": "eyJhbGc...",
#   "qrImageUrl": "data:image/png;base64,...",
#   "status": "issued",
#   "emailStatus": "sent"
# }
```

### Test 4: Resend Email

```bash
curl -X POST -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:5000/api/admin/tickets/TICKET_ID/resend-email

# Should return:
# {"success":true,"message":"Ticket email resent successfully"}
```

### Test 5: Scan a Ticket at Gate

```bash
# Get QR token from database
SELECT qr_token FROM tickets WHERE id = 'TICKET_ID';

# Call scan endpoint
curl -X POST http://localhost:5000/api/tickets/scan \
  -H "Content-Type: application/json" \
  -d '{
    "qrToken": "eyJhbGc...",
    "eventId": 1,
    "deviceFingerprint": "device-123-abc"
  }'

# First scan should return:
# {
#   "success": true,
#   "ticketId": "...",
#   "status": "checked_in",
#   "message": "Ticket valid, checked in"
# }

# Second scan from same device should return:
# {
#   "success": false,
#   "reason": "already_used",
#   "message": "Ticket already checked in"
# }

# Second scan from different device should return:
# {
#   "success": false,
#   "reason": "device_mismatch",
#   "message": "Ticket appears to be shared (scanned from different device)"
# }
```

---

## Step 7: Production Deployment

### Before Deploying:

```bash
# 1. Generate strong QR_TOKEN_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. Set in production environment variables on Vercel/hosting
# - DATABASE_URL (production database)
# - QR_TOKEN_SECRET (strong secret, min 32 chars)
# - RESEND_API_KEY (your API key)
# - NODE_ENV=production

# 3. Verify build
npm run build

# 4. Final check
npm run check
```

### Deploy:

```bash
# Using Vercel (recommended)
vercel deploy --prod

# Or using custom deployment
npm run build
npm run start
```

---

## Troubleshooting

### Problem: "DATABASE_URL must be set"
**Solution:** Add `DATABASE_URL` to `.env` and restart server

### Problem: "Table 'tickets' does not exist"
**Solution:** Run `npm run db:push` or the custom migration script

### Problem: "Failed to initialize Resend"
**Solution:**
- Check `RESEND_API_KEY` is correct
- Verify API key is still valid at https://resend.com
- In development, emails will log to console instead

### Problem: QR codes not generating
**Solution:**
- Check `qr_image_url` in database is not null
- Verify `qrcode` npm package is installed
- Check server logs for "QR code generation failed"

### Problem: Emails not sending
**Solution:**
- Check `email_status` in database
- Verify `RESEND_API_KEY` is set
- Check server logs for `[EMAIL]` messages
- In development mode, check console logs

### Problem: Verification creates no tickets
**Solution:**
- Check if events exist and are published: `SELECT * FROM events WHERE status = 'published'`
- Check if events have `end_at` date set
- Check user eligibility logic in `server/services/tickets.ts`

### Problem: Scan endpoint returns 404
**Solution:**
- Verify URL is `/api/tickets/scan` (not `/api/ticket/scan`)
- Check method is POST
- Check request body has `qrToken`, `eventId`, `deviceFingerprint`

---

## API Endpoints Reference

### User Endpoints

**Get My Tickets**
```
GET /api/me/tickets
```

**Scan Ticket**
```
POST /api/tickets/scan
Body: { qrToken, eventId, deviceFingerprint }
```

### Admin Endpoints (require admin token)

**Verify/Unverify User**
```
PATCH /api/admin/users/:id/verify
Body: { verified: boolean }
Response: { isVerified, activeTicketCount, eligibleEventCount, ... }
```

**List User's Tickets**
```
GET /api/admin/users/:id/tickets
Response: [ ticket objects ]
```

**View QR Code**
```
GET /api/admin/tickets/:id/qr
Response: { ticketCode, qrToken, qrImageUrl, status, emailStatus }
```

**Check Email Status**
```
GET /api/admin/tickets/:id/email-status
Response: { ticketCode, emailStatus, sentAt, lastError, attempts }
```

**Resend Email**
```
POST /api/admin/tickets/:id/resend-email
Response: { success, message }
```

**Revoke Ticket**
```
POST /api/admin/tickets/:id/revoke
Body: { reason }
Response: { success, message }
```

---

## Common Admin Dashboard Workflows

### Workflow 1: Verify New User
1. Admin Dashboard → Users
2. Find user "Jane Doe"
3. Click "Verify" button
4. System creates tickets for all eligible events
5. Sends emails with QR codes
6. Shows "Jane verified, 3 tickets created"

### Workflow 2: User Lost Their Email
1. Admin finds user in dashboard
2. Clicks user to open details
3. Finds ticket in list
4. Clicks "Resend Email"
5. System sends email again

### Workflow 3: User Can't Scan at Gate
1. Staff at gate tries to scan QR
2. User says "I don't have it"
3. Admin pulls up user in dashboard
4. Clicks "View QR" on ticket
5. Shows QR code on screen
6. User scans from admin's screen

### Workflow 4: Prevent Ticket Sharing
1. First person scans QR at gate
2. System records device fingerprint
3. Second person tries to scan same QR from different device
4. System detects mismatch
5. Returns error: "Ticket appears to be shared"
6. Scan logged with both device fingerprints

---

## Production Monitoring

Monitor these metrics to ensure system health:

```sql
-- Active tickets waiting to be checked in
SELECT COUNT(*) FROM tickets WHERE status = 'issued' AND expires_at > NOW();

-- Recently checked-in tickets
SELECT COUNT(*) FROM tickets WHERE status = 'checked_in' AND checked_in_at > NOW() - INTERVAL '24 hours';

-- Email delivery failures
SELECT COUNT(*) FROM tickets WHERE email_status = 'failed';

-- Shared ticket attempts
SELECT COUNT(*) FROM ticket_scan_logs WHERE reason = 'device_mismatch';

-- Verification audit trail
SELECT COUNT(*) FROM verification_audit_logs WHERE created_at > NOW() - INTERVAL '24 hours';
```

---

## Security Checklist

Before going live:

- [ ] Set strong `QR_TOKEN_SECRET` (32+ chars, random)
- [ ] Verify `NODE_ENV=production` in production
- [ ] Check `RESEND_API_KEY` is valid and configured
- [ ] Verify database is backed up
- [ ] Test complete verify → email → scan workflow
- [ ] Verify rate limiting is enabled on `/api/tickets/scan`
- [ ] Check audit logs are being created
- [ ] Verify device fingerprinting is preventing sharing
- [ ] Test error cases (invalid QR, expired ticket, etc.)
- [ ] Review security audit results (70 issues found and fixed)

---

## Support

If you encounter issues not covered here:

1. Check server logs: `npm run dev` and look for errors
2. Check database logs: Query the audit tables
3. Review the technical guides:
   - `TICKETING_SYSTEM_GUIDE.md`
   - `EMAIL_SERVICE_GUIDE.md`
   - `IMPLEMENTATION_READY_CHECKLIST.md`

---

**You're ready to go! 🚀**
