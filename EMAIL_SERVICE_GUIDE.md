# Email Service - Complete Guide

## Overview

The email service sends beautiful, professional ticket emails to newly verified nurses. It includes:

✅ **Personalized welcome message** - "You're Verified! Your free ticket is ready"
✅ **Event details** - Date, time, location
✅ **QR code** - Scannable at event gate
✅ **Ticket code** - Human-readable backup (NR-2026-ABC123)
✅ **How-to instructions** - Three ways to check in
✅ **Anti-sharing warning** - Clear terms
✅ **Support contact** - Email for questions

---

## Current Email Logic Flow

### Complete Flow (Start to Finish)

```
Admin verifies user in dashboard
  ↓
verifyUser(userId, adminUserId) called
  ├─ Update user.is_verified = true
  ├─ Get eligible events
  │  ├─ published events with end_at >= now()
  │  └─ Returns array of events
  │
  ├─ For each event: issueTicketForEvent(userId, eventId)
  │  ├─ Check if ticket exists (idempotent)
  │  ├─ Generate QR token (JWT signed)
  │  ├─ Generate ticket code (NR-2026-ABC123)
  │  ├─ Render QR image (PNG)
  │  ├─ Store in DB:
  │  │  ├─ tickets.qr_token = JWT
  │  │  ├─ tickets.qr_image_url = data URL
  │  │  ├─ tickets.ticket_code = NR-2026-ABC123
  │  │  └─ tickets.email_status = 'pending'
  │  │
  │  └─ Call sendTicketIssuedEmail()
  │     ├─ Load user, event, ticket from DB
  │     ├─ Build beautiful HTML email
  │     ├─ Send via Resend (if configured)
  │     │  OR log to console (dev mode)
  │     ├─ Update email_status = 'sent' or 'failed'
  │     └─ Return result
  │
  └─ Create verification_audit_logs entry

User receives email (or sees log if dev mode)
  ├─ Subject: "Your Free Nursing Rocks Ticket is Ready! 🎸"
  ├─ Includes: Event details, QR code, ticket code
  ├─ Instructions: Three ways to check in
  └─ Support email if issues
```

### State Tracking in Database

```
tickets table tracks:
├─ email_status: 'pending' | 'sent' | 'failed'
├─ emailed_at: TIMESTAMP (when sent)
└─ email_error: TEXT (if failed, why)

verification_audit_logs tracks:
├─ user_id: which user
├─ admin_user_id: which admin did it
├─ action: 'admin_verify'
└─ created_at: when
```

---

## Email Template Details

### What the Email Contains

**Subject Line:**
```
Your Free Nursing Rocks Ticket is Ready! 🎸
```

**Header:**
- Gradient red background (Nursing Rocks brand color)
- "🎸 You're Verified!"
- "Your free Nursing Rocks ticket is ready"

**Welcome Section:**
```
Hi [First Name],

Welcome to the Nursing Rocks community! We're thrilled to have verified you.
You now have a free ticket to the upcoming Nursing Rocks concert — our way of
saying thank you for all you do.
```

**Event Details Section:**
```
Your Event Details

[Event Title]
📅 Date: [Full date, e.g., "Friday, May 16, 2026"]
🕐 Time: [Event time, e.g., "6:00 PM"]
📍 Location: [Venue, e.g., "The Walter Studio, Phoenix AZ"]
```

**QR Code Section:**
```
Your Ticket

[QR CODE IMAGE]
Or provide this code: NR-2026-ABC123
✓ Save this code as a backup
```

**How-to Instructions:**
```
How to Check In:

Option 1: Show this email and the QR code to staff at the gate
Option 2: Tell them your ticket code: NR-2026-ABC123
Option 3: Take a screenshot of this QR code for offline access
```

**Important Warning:**
```
⚠️ Important - Please Read:

This ticket is exclusively yours and single-use. Once scanned at the event,
it cannot be used again. Please do not share your QR code or ticket number
with others. Tickets are tied to your name and verification status — attempting
to share them violates our terms and may result in removal from the event.
```

**Support Section:**
```
Questions? We're here to help!
📧 Email: support@nursingrocks.com

If you didn't receive this email, check your spam folder. If you lose your
ticket, reply to this email or contact support and we'll help you out.
```

---

## Configuration

### Setup Steps

#### 1. Set Environment Variables

```bash
# Required for email sending
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Optional - customize email addresses
SENDER_EMAIL=noreply@nursingrocks.com      # Default shown above
SUPPORT_EMAIL=support@nursingrocks.com    # Default shown above
```

#### 2. Get Resend API Key

1. Go to https://resend.com
2. Sign up (free tier available)
3. Get API key from dashboard
4. Add to `.env` file

#### 3. Configure Email Domain (Optional)

By default, emails send from `noreply@nursingrocks.com`. To customize:

```bash
# In .env
SENDER_EMAIL=tickets@yourdomain.com

# Then verify domain in Resend dashboard
```

---

## What's Accessible to Admins

### Via API Endpoints

#### 1. **View User's Tickets**
```
GET /api/admin/users/:id/tickets
```
Returns array of tickets with:
- `ticket_code`: NR-2026-ABC123
- `qr_token`: JWT token (for verification)
- `qr_image_url`: Data URL with PNG image
- `email_status`: 'pending', 'sent', or 'failed'
- `emailed_at`: When email was sent
- Status, dates, all ticket details

#### 2. **View QR Code for Specific Ticket**
```
GET /api/admin/tickets/:id/qr
```
Returns:
```json
{
  "ticketCode": "NR-2026-ABC123",
  "qrToken": "eyJhbGc...",
  "qrImageUrl": "data:image/png;base64,...",
  "createdAt": "2026-03-29T...",
  "expiresAt": "2026-05-23T...",
  "status": "active",
  "emailStatus": "sent"
}
```

**Use case:** Display QR code in admin dashboard, print for manual check-in, or include in a different communication channel

#### 3. **Check Email Delivery Status**
```
GET /api/admin/tickets/:id/email-status
```
Returns:
```json
{
  "ticketCode": "NR-2026-ABC123",
  "emailStatus": "sent",
  "sentAt": "2026-03-29T14:30:00Z",
  "lastError": null,
  "attempts": 1
}
```

**Use case:** Verify email was sent, see if it failed, troubleshoot delivery issues

#### 4. **Resend Ticket Email**
```
POST /api/admin/tickets/:id/resend-email
```
Triggers email to be sent again (same message, same template)

**Use case:** User says they didn't get email → admin clicks resend

---

## Email Sending Modes

### Mode 1: Resend Integration (Production) ✅

**When:** `RESEND_API_KEY` is set in environment

**What happens:**
```
sendTicketIssuedEmail() called
  ↓
Initialize Resend client with API key
  ↓
Send email via Resend API:
  ├─ From: noreply@nursingrocks.com
  ├─ To: user@example.com
  ├─ Subject: Your Free Nursing Rocks Ticket is Ready! 🎸
  └─ HTML: Beautiful rendered template
  ↓
Resend returns success
  ↓
Update tickets table:
  ├─ email_status = 'sent'
  ├─ emailed_at = now()
  └─ email_error = null
  ↓
Log: "[EMAIL] ✅ Sent to user@example.com (ticket: NR-2026-ABC123)"
```

### Mode 2: Development/Console Logging (Dev) 📝

**When:** `RESEND_API_KEY` is NOT set

**What happens:**
```
sendTicketIssuedEmail() called
  ↓
No API key found - log to console instead
  ↓
Print formatted output:
  ├─ Email recipient
  ├─ Subject line
  ├─ Ticket code
  ├─ QR token preview
  └─ HTML preview (first 200 chars)
  ↓
Return success (doesn't actually send)
  ↓
Check server console for output
```

**Useful for:**
- Testing verification flow locally
- Previewing email before sending
- Development without email provider

---

## Email Failure Handling

### If Email Send Fails

```
sendTicketIssuedEmail() throws error
  ↓
Caught in verifyUser() try-catch
  ↓
Update tickets table:
  ├─ email_status = 'failed'
  ├─ email_error = "Connection timeout" or other error
  └─ updated_at = now()
  ↓
Log: "[EMAIL] ❌ Failed to send to user@example.com: [error]"
  ↓
Continue with next event (don't block verification)
  ↓
Admin can see failure and resend manually
```

**Why this approach:**
- User gets verified even if email service is down
- Ticket is created and ready
- Admin can resend email later with `POST /api/admin/tickets/:id/resend-email`
- Full audit trail of what happened

---

## Admin Workflow Example

### Scenario: User doesn't receive ticket email

```
Admin Dashboard → Users → Find "Jane Doe"
  ↓
Click "Verify" button
  ↓
Backend:
  ├─ Mark user verified
  ├─ Create tickets for eligible events
  ├─ Send emails (or log to console)
  ├─ Update email_status
  └─ Show status on response
  ↓
Admin sees: "Jane Doe verified, 3 tickets created, emails sent"
  ↓
[Next day] Jane emails: "I didn't get my ticket!"
  ↓
Admin Dashboard → Find Jane's tickets
  ├─ Click ticket → "NR-2026-ABC123"
  ├─ Click "Resend Email"
  ├─ Backend sends again
  └─ Show email status: "sent"
  ↓
Or: Admin clicks "View QR" → sees QR code → can:
  ├─ Display on screen for Jane to screenshot
  ├─ Print and mail
  ├─ Send via different channel
  └─ Use for manual check-in
```

---

## QR Code Storage

### Current Implementation

QR codes are stored in two ways:

**1. In Database (`tickets.qr_image_url`)**
- Stored as PNG data URL (base64)
- ~100KB per image
- Accessible via API
- Can include in emails

**2. In Database (`tickets.qr_token`)**
- Stored as JWT token (compact)
- ~500 bytes
- Used for scanning/verification
- Cannot be faked (HMAC signed)

### Performance Consideration

If you have thousands of users and 10+ events each:
- Database could get large (100KB × 10,000 × 10 = 10GB)
- Consider storing QR images on external service:

```typescript
// Future enhancement:
// Instead of: qrImageUrl = await renderQrCode(qrToken)
// Do this:
// qrImageUrl = await uploadToCloudinary(qrDataUrl)
// Then store URL instead of data URL
```

For now, data URLs work fine and keep everything self-contained.

---

## Troubleshooting

### Email Not Sending

**Check 1: Is Resend API key set?**
```bash
echo $RESEND_API_KEY
```
If empty, set it in `.env`

**Check 2: Are emails being logged to console?**
Check server logs when you verify a user:
```
[EMAIL] ✅ Sent to jane@example.com (ticket: NR-2026-ABC123)
```
OR
```
[EMAIL - DEV MODE] Would send to: jane@example.com
```

**Check 3: Check email_status in database**
```sql
SELECT email_status, email_error FROM tickets WHERE id = 'xxx';
```
- If `email_status = 'failed'`, check `email_error` column
- Common errors:
  - "Invalid API key" → check RESEND_API_KEY
  - "Domain not verified" → verify domain in Resend
  - "Invalid email address" → check user.email

### QR Code Not Showing in Email

**Check 1: Is `qr_image_url` populated?**
```sql
SELECT qr_image_url FROM tickets WHERE id = 'xxx';
```
Should be: `data:image/png;base64,iVBORw0KGgo...`

**Check 2: Is QR rendering failing?**
Check server logs for:
```
QR code generation failed: [error]
```
If present, QR failed but ticket was still created

### Resend Email but Status Doesn't Update

**Check**: Verify the resend function actually ran:
```
POST /api/admin/tickets/:id/resend-email
```
Should return:
```json
{ "success": true, "message": "Ticket email resent successfully" }
```

---

## Email Template Customization

### Change the Subject Line

File: `server/services/email.ts`, line ~51

```typescript
const emailSubject = `Your Free Nursing Rocks Ticket is Ready! 🎸`;
// Change to:
const emailSubject = `🎸 Free Concert Ticket - ${event.title}`;
```

### Change Colors

File: `server/services/email.ts`, CSS section (line ~67-90)

```css
.header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); }
/* Change to different red/brand color */
```

### Change Support Email

File: `server/services/email.ts`, line ~9

```typescript
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@nursingrocks.com";
```

### Add Organization Logo

File: `server/services/email.ts`, HTML template

```html
<img src="https://your-domain.com/logo.png" alt="Logo" style="height: 40px; margin: 10px 0;">
```

---

## Testing Email Service

### Test 1: Verify User and Check Console

```bash
# In development
npm run dev

# In admin dashboard, verify a test user

# Check terminal - should see:
# [EMAIL - DEV MODE] Would send to: test@example.com
# Subject: Your Free Nursing Rocks Ticket is Ready! 🎸
```

### Test 2: Check Database

```sql
-- Check ticket was created
SELECT id, ticket_code, qr_image_url, email_status FROM tickets
WHERE user_id = :userId;

-- Should show:
-- email_status = 'sent' (production) or no email sent (dev mode)
-- qr_image_url = data:image/png;base64,...
-- ticket_code = NR-2026-ABC123
```

### Test 3: Test Resend Email

```bash
# Get a ticket ID from database
# Then:

curl -X POST http://localhost:5000/api/admin/tickets/TICKET_ID/resend-email \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Should return:
# { "success": true, "message": "Ticket email resent successfully" }
```

### Test 4: Test Email Status Endpoint

```bash
curl http://localhost:5000/api/admin/tickets/TICKET_ID/email-status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return:
# {
#   "ticketCode": "NR-2026-ABC123",
#   "emailStatus": "sent",
#   "sentAt": "2026-03-29T14:30:00Z",
#   "lastError": null
# }
```

---

## Summary

| Component | Details |
|-----------|---------|
| **Message** | Personalized for newly verified nurses, includes event details, QR code, how-to, and support |
| **QR Code** | Stored in DB, rendered as PNG, included in email, accessible via API |
| **Ticket Code** | Human-readable backup (NR-2026-ABC123), displayed in email and database |
| **Email Status** | Tracked in `email_status` column ('pending', 'sent', 'failed') |
| **Admin Access** | Can view QR via API, resend email, check delivery status |
| **Production Mode** | Uses Resend API (requires key), sends actual emails |
| **Dev Mode** | Logs to console for testing without email provider |
| **Failure Handling** | Doesn't block verification; admins can resend later |
| **Audit Trail** | Every send/resend logged with timestamp and status |

---

## Next Steps

1. **Get Resend API key:** https://resend.com
2. **Set `RESEND_API_KEY` in `.env`**
3. **Test:** Verify a user and check emails arrive
4. **Monitor:** Check `email_status` column in database
5. **Optional:** Customize template if needed
6. **Deploy:** No changes needed for production

All email features are production-ready once API key is configured.
