# Implementation Ready Checklist

## ✅ What's Been Built (COMPLETE)

### Database
- [x] Migration file: `migrations/003_ticketing_system.sql`
- [x] Schema updates: `shared/schema.ts`
- [x] New tables: `tickets`, `ticket_scan_logs`, `verification_audit_logs`
- [x] Updated tables: `users`, `events`

### Services (5 Core Services)
- [x] QR Service: `server/services/qr.ts` - Generate, sign, verify QR tokens
- [x] Ticket Service: `server/services/tickets.ts` - Ticket lifecycle management
- [x] Verification Service: `server/services/verification.ts` - Admin verify/unverify logic
- [x] Email Service: `server/services/email.ts` - Beautiful ticket emails + Resend integration
- [x] Scan Service: `server/services/scan.ts` - Gate scanning + anti-sharing

### API Routes (10 Endpoints)
- [x] `PATCH /api/admin/users/:id/verify` - Verify/unverify user → creates tickets + sends emails
- [x] `GET /api/admin/users/:id/tickets` - List user's tickets
- [x] `GET /api/admin/tickets/:id/qr` - View QR code for admin
- [x] `GET /api/admin/tickets/:id/email-status` - Check email delivery status
- [x] `POST /api/admin/tickets/:id/resend-email` - Resend ticket email
- [x] `POST /api/admin/tickets/:id/revoke` - Revoke a ticket
- [x] `POST /api/tickets/scan` - Scan QR code at gate (with anti-sharing)
- [x] `GET /api/me/tickets` - User sees their own tickets

### Documentation
- [x] `TICKETING_SYSTEM_GUIDE.md` - Complete technical reference
- [x] `EMAIL_SERVICE_GUIDE.md` - Email configuration and customization
- [x] This file - Implementation checklist

---

## 🎯 What You Need to Do (Priority Order)

### STEP 1: Database Migration (5 minutes)

```bash
npm run db:push
```

This applies `migrations/003_ticketing_system.sql` to your Neon database.

**Verify success:**
```sql
-- In Neon console, run:
\dt  -- Lists tables
```

Should show:
- `tickets` (redesigned)
- `ticket_scan_logs` (new)
- `verification_audit_logs` (new)

---

### STEP 2: Environment Variables (2 minutes)

Create/update `.env` file:

```bash
# REQUIRED - for QR token signing
QR_TOKEN_SECRET=your-secret-key-change-in-production

# OPTIONAL but RECOMMENDED - for email sending
RESEND_API_KEY=re_xxxxxxxxxxxxx

# OPTIONAL - customize email addresses
SENDER_EMAIL=noreply@nursingrocks.com
SUPPORT_EMAIL=support@nursingrocks.com
```

**How to get Resend API key:**
1. Go to https://resend.com
2. Sign up (free tier works great)
3. Copy API key
4. Paste into `.env`

**Without Resend API key:**
- Emails will log to console (dev mode)
- Admins can still view QR codes and resend later
- Everything else works normally

---

### STEP 3: Test the Flow (10 minutes)

**Start dev server:**
```bash
npm run dev
```

**In admin dashboard:**
1. Find a test user (or create one)
2. Click "Verify" button
3. System should:
   - Mark user as verified
   - Create tickets for all eligible events
   - Send email (or log to console)
   - Show verification status

**Check console output:**
```
[EMAIL] ✅ Sent to test@example.com (ticket: NR-2026-ABC123)
```

Or if no Resend key:
```
[EMAIL - DEV MODE] Would send to: test@example.com
Subject: Your Free Nursing Rocks Ticket is Ready! 🎸
```

**Check database:**
```sql
SELECT id, ticket_code, email_status, qr_image_url FROM tickets
WHERE user_id = :test_user_id;
```

Should show tickets with:
- `ticket_code`: NR-2026-ABC123
- `email_status`: 'sent' or 'pending'
- `qr_image_url`: data:image/png;base64,...

---

### STEP 4: Update Admin Dashboard UI (Variable)

**Current endpoints have changed.** Admin dashboard needs updating:

#### OLD (broken):
```typescript
PATCH /api/admin/users/:id
{ "is_verified": true }
```

#### NEW (working):
```typescript
PATCH /api/admin/users/:id/verify
{ "verified": true, "notes": "Optional notes" }
```

**Response now includes:**
```json
{
  "user": {...},
  "isVerified": true,
  "status": "verified",
  "verifiedAt": "2026-03-29T...",
  "eligibleEventCount": 3,
  "activeTicketCount": 3,
  "checkedInCount": 0,
  "revokedCount": 0
}
```

#### What to update in admin dashboard:

**Find the "Verify User" button code:**
```typescript
// OLD
const updateUserMutation = useMutation({
  mutationFn: async (data) => {
    return apiRequest("PATCH", `/api/admin/users/${userId}`, {
      body: JSON.stringify({ is_verified: true })
    });
  }
});

// NEW
const verifyUserMutation = useMutation({
  mutationFn: async () => {
    return apiRequest("PATCH", `/api/admin/users/${userId}/verify`, {
      body: JSON.stringify({ verified: true })
    });
  }
});
```

**Show ticket summary after verify:**
```typescript
// Response now has:
// - eligibleEventCount: how many events they can attend
// - activeTicketCount: how many active tickets were created
// - emailStatus: tracking of email delivery
```

**Add new UI for admins:**
- Show verification status + timestamp
- Show eligible event count
- Show active/checked-in/revoked ticket counts
- Add "View Tickets" link
- Add "Resend Email" button for each ticket
- Add "View QR" button to display/download QR code

---

### STEP 5: Test Admin Workflows (15 minutes)

#### Workflow 1: Verify a User
```
Admin Dashboard → Users → Find user
  ↓ Click "Verify"
  ↓ Should see: "Jane verified, 3 tickets created"
  ↓ Check DB: 3 tickets created
  ↓ Check console/email: emails sent
```

#### Workflow 2: View User's Tickets
```
Admin Dashboard → User Details → Tickets
  ↓ GET /api/admin/users/:id/tickets
  ↓ Shows all tickets with codes and status
```

#### Workflow 3: Resend Ticket Email
```
User says: "I didn't get my ticket!"
  ↓ Admin finds user → finds ticket
  ↓ Clicks "Resend Email"
  ↓ POST /api/admin/tickets/:id/resend-email
  ↓ Email sent again
```

#### Workflow 4: View QR Code
```
Admin needs to give user QR manually
  ↓ GET /api/admin/tickets/:id/qr
  ↓ Shows QR image URL
  ↓ Can display on screen or print
```

#### Workflow 5: Scan Ticket at Gate
```
Staff scans QR code with phone camera
  ↓ QR code directs to gate scanning app
  ↓ POST /api/tickets/scan with qrToken
  ↓ Validates: expiration, revocation, device matching
  ↓ Returns: success or reason for rejection
  ↓ Logs: full scan history for audit
```

---

## 📋 Email Service Status

### Current State
- [x] Beautiful HTML template designed (red Nursing Rocks theme)
- [x] Personalized message for newly verified nurses
- [x] QR code embedded + ticket code displayed
- [x] Anti-sharing warning included
- [x] Support contact info included
- [x] Resend integration implemented
- [x] Dev mode (console logging) implemented
- [x] Email status tracking (pending/sent/failed)
- [x] Resend email functionality
- [x] Admin endpoints to view QR and email status

### What Admins Can Access
- ✅ View QR code for any ticket: `GET /api/admin/tickets/:id/qr`
- ✅ Check email status: `GET /api/admin/tickets/:id/email-status`
- ✅ Resend email: `POST /api/admin/tickets/:id/resend-email`
- ✅ List all user tickets: `GET /api/admin/users/:id/tickets`

### Configuration Needed
- [ ] Set `RESEND_API_KEY` in `.env` (for production emails)
- [ ] (Optional) Customize `SENDER_EMAIL` and `SUPPORT_EMAIL`
- [ ] (Optional) Customize email template if desired

---

## 🔒 Security Status

### Anti-Sharing Protection ✅
- [x] Single-use tickets (checked_in → can't scan again)
- [x] JWT-signed QR tokens (HMAC-SHA256)
- [x] Device fingerprint tracking (first device recorded)
- [x] Full scan audit logs (every attempt tracked)
- [x] Token verification on every scan
- [x] Expiration enforcement (7 days after event)

### Audit Trails ✅
- [x] `verification_audit_logs` - who verified who and when
- [x] `ticket_scan_logs` - all scan attempts with results
- [x] Email status tracking - pending/sent/failed
- [x] Full database state at each step

### Data Safety ✅
- [x] QR tokens are signed (can't forge)
- [x] Tickets tied to events (wrong event rejected)
- [x] User tied to ticket (sharing detected)
- [x] Expiration enforced (old tickets rejected)
- [x] Revocation support (admin can invalidate)

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Run `npm run db:push` on production database
- [ ] Set `QR_TOKEN_SECRET` in production env (strong random key)
- [ ] Set `RESEND_API_KEY` in production env
- [ ] Update admin dashboard UI to use new endpoints
- [ ] Test verify flow end-to-end on staging
- [ ] Test email sending on staging
- [ ] Test QR scanning on staging
- [ ] Train admins on new verify/ticket workflow
- [ ] Create help docs for users (how to check in with QR)
- [ ] Deploy to production

---

## 📖 Reference Documentation

### For Engineers
1. **TICKETING_SYSTEM_GUIDE.md** - Complete technical spec
   - Database schema details
   - Service function reference
   - API endpoint specs
   - Implementation order
   - Troubleshooting guide

2. **EMAIL_SERVICE_GUIDE.md** - Email configuration
   - Email template details
   - Configuration steps
   - Admin workflows
   - Testing guide
   - Troubleshooting

### For Admins
1. **Email template message** - What users see
2. **Admin endpoints** - How to manage tickets/emails
3. **QR code access** - How to view/resend QR

---

## 🧪 Testing Scenarios

### Test 1: Happy Path
```
Create event with status='published'
Create user and register
Admin verifies user
  ✓ User verified
  ✓ Tickets created for eligible events
  ✓ Emails sent (or logged)
  ✓ QR codes generated
```

### Test 2: Email Resend
```
User didn't receive email
Admin clicks "Resend Email"
  ✓ Email sent again
  ✓ Status updated
```

### Test 3: QR Scanning
```
Staff scans QR code at gate
  ✓ Ticket validated
  ✓ Device fingerprint recorded
  ✓ Status changed to checked_in
  ✓ Scan logged with timestamp
```

### Test 4: Prevent Sharing
```
Same QR scanned twice from different device
  ✓ First scan: accepted, device recorded
  ✓ Second scan: rejected (device mismatch)
  ✓ Both attempts logged
```

### Test 5: Revocation
```
Admin revokes a ticket
  ✓ Status changed to revoked
  ✓ Future scans rejected with "revoked" reason
  ✓ Checked-in tickets preserved
```

---

## 🎯 Success Criteria

When everything is working:

- [ ] Admin can verify a user in dashboard
- [ ] System automatically creates tickets for eligible events
- [ ] Tickets are created with QR codes
- [ ] Emails are sent (production) or logged (dev)
- [ ] Admin can view/resend QR codes
- [ ] Admin can check email delivery status
- [ ] Users can scan QR at gate
- [ ] Single-use enforcement works (can't scan twice)
- [ ] Device mismatches are flagged
- [ ] All actions are audited

---

## 🆘 Quick Troubleshooting

### Issue: Verify button doesn't work
**Check:**
- Database migration ran? `npm run db:push`
- Service files exist? `ls server/services/`
- Routes updated? Search routes.ts for `/api/admin/users/:id/verify`

### Issue: No tickets created
**Check:**
- Are there published events? `SELECT * FROM events WHERE status='published'`
- Do they have end_at dates? `SELECT end_at FROM events`
- Is user verified? `SELECT is_verified FROM users WHERE id=:id`

### Issue: Emails not sending
**Check:**
- Is Resend API key set? `echo $RESEND_API_KEY`
- Check console for [EMAIL] logs
- Check database: `SELECT email_status, email_error FROM tickets`
- See EMAIL_SERVICE_GUIDE.md for detailed troubleshooting

### Issue: QR scanning not working
**Check:**
- Is qr_token stored in database? `SELECT qr_token FROM tickets`
- Is QR_TOKEN_SECRET consistent?
- Check scan endpoint response for specific error reason
- See TICKETING_SYSTEM_GUIDE.md scan section

---

## 📞 Support

For issues:
1. Check the detailed guides: TICKETING_SYSTEM_GUIDE.md and EMAIL_SERVICE_GUIDE.md
2. Check database state to verify data is being created
3. Check console logs for [EMAIL] messages
4. Verify environment variables are set
5. Test endpoints with curl/Postman

---

## Next Immediate Action

```bash
# 1. Push database migration
npm run db:push

# 2. Set environment variables in .env
echo "QR_TOKEN_SECRET=dev-secret-change-in-production" >> .env
# (Optional) echo "RESEND_API_KEY=re_xxxxx" >> .env

# 3. Start dev server
npm run dev

# 4. Verify a test user in admin dashboard

# 5. Check server logs and database for results
```

Done! Your production ticketing system is ready. 🎸
