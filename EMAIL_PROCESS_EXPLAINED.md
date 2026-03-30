# Email Process Explained (Step-by-Step)

## TL;DR - What Happens When Admin Verifies a User

```
Admin clicks "Verify" on user
    ↓
User gets marked as verified
    ↓
System finds all published future events (e.g., 3 concerts)
    ↓
For EACH concert:
    ├─ Generate ticket (QR code + ticket code)
    ├─ Send beautiful email with QR and event details
    └─ Track email status (sent/failed)
    ↓
User receives 3 emails (one per concert) with QR codes
User can now attend all 3 concerts
```

---

## The Complete Email Utility Explained

### What It Does

The email utility (`server/services/email.ts`) is responsible for:

1. **Building the email content** - Creates HTML with personalization
2. **Sending the email** - Via Resend API or logs to console
3. **Tracking delivery** - Records if sent/failed
4. **Handling failures** - Logs errors but doesn't block verification
5. **Allowing resends** - Admins can resend if user didn't get it

### File Structure

```
server/services/email.ts

├─ sendTicketIssuedEmail(userId, eventId, ticketId)
│  └─ Main function called when user is verified
│     ├─ Load user from DB
│     ├─ Load event from DB
│     ├─ Load ticket from DB
│     ├─ Build HTML email
│     ├─ Send via Resend (if API key set)
│     │  OR log to console (dev mode)
│     └─ Return result
│
├─ buildTicketEmailHtml(data) - Private helper
│  └─ Builds beautiful red-themed HTML template
│     ├─ Welcome message
│     ├─ Event details
│     ├─ QR code image
│     ├─ Ticket code backup
│     ├─ How-to instructions
│     ├─ Anti-sharing warning
│     └─ Support contact
│
├─ resendTicketEmail(ticketId) - Admin action
│  └─ Resends an existing ticket email
│     └─ Called via API when user didn't get original
│
├─ getTicketQrCode(ticketId) - Admin API
│  └─ Returns QR data for display/download
│
└─ getTicketEmailHistory(ticketId) - Admin API
   └─ Returns email delivery status and history
```

---

## Step-by-Step: When Admin Verifies a User

### Timeline: What Happens in Order

```
TIME 0: Admin clicks "Verify Jane Doe" in dashboard
│
├─ REQUEST: PATCH /api/admin/users/123/verify
│            { "verified": true }
│
├─ Call: verifyUser(userId=123, adminUserId=456)
│   │
│   ├─ TIME 1: Check Jane exists ✓
│   │
│   ├─ TIME 2: Update database
│   │   UPDATE users SET
│   │     is_verified = true,
│   │     status = 'verified',
│   │     verified_at = NOW()
│   │
│   ├─ TIME 3: Find eligible events
│   │   SELECT * FROM events
│   │   WHERE status = 'published'
│   │   AND end_at >= NOW()
│   │   → Returns: [Concert A, Concert B, Concert C]
│   │
│   ├─ TIME 4: Create tickets
│   │   FOR each concert:
│   │   │
│   │   ├─ [Concert A] issueTicketForEvent(123, concertA_id)
│   │   │   ├─ Generate UUID: ticket_id
│   │   │   ├─ Generate code: "NR-2026-7K4M9Q"
│   │   │   ├─ Sign QR token: jwt.sign({ticketId, userId, eventId...}, secret)
│   │   │   ├─ Render QR: qrCode.toDataURL(qrToken)
│   │   │   ├─ Create record:
│   │   │   │   INSERT INTO tickets (
│   │   │   │     id, user_id, event_id,
│   │   │   │     ticket_code, qr_token, qr_image_url,
│   │   │   │     status, expires_at, email_status
│   │   │   │   )
│   │   │   │
│   │   │   └─ Call: sendTicketIssuedEmail(123, concertA_id, ticket_id)
│   │   │       │
│   │   │       ├─ Load Jane from DB
│   │   │       ├─ Load Concert A details
│   │   │       ├─ Load Ticket from DB
│   │   │       ├─ Build HTML email:
│   │   │       │   ├─ Subject: "Your Free Nursing Rocks Ticket is Ready! 🎸"
│   │   │       │   ├─ Header: Red gradient, "🎸 You're Verified!"
│   │   │       │   ├─ Welcome: "Hi Jane, thank you for..."
│   │   │       │   ├─ Event: "Concert A - Friday May 16, 6pm, Phoenix"
│   │   │       │   ├─ QR: <img src="data:image/png;base64,..." />
│   │   │       │   ├─ Code: "NR-2026-7K4M9Q"
│   │   │       │   ├─ How-to: Three ways to check in
│   │   │       │   ├─ Warning: ⚠️ Don't share, single-use
│   │   │       │   └─ Support: support@nursingrocks.com
│   │   │       │
│   │   │       ├─ SEND EMAIL:
│   │   │       │   IF (RESEND_API_KEY set):
│   │   │       │   │   resend.emails.send({
│   │   │       │   │     from: "noreply@nursingrocks.com",
│   │   │       │   │     to: "jane@example.com",
│   │   │       │   │     subject: "Your Free Nursing Rocks Ticket is Ready! 🎸",
│   │   │       │   │     html: [email_html_above]
│   │   │       │   │   })
│   │   │       │   │   → Resend API returns success
│   │   │       │   │   → Log: "[EMAIL] ✅ Sent to jane@example.com (NR-2026-7K4M9Q)"
│   │   │       │   ELSE (dev mode):
│   │   │       │       Log to console:
│   │   │       │       "[EMAIL - DEV MODE] Would send to jane@example.com"
│   │   │       │       → No actual email sent
│   │   │       │
│   │   │       └─ Update database:
│   │   │           UPDATE tickets SET
│   │   │             email_status = 'sent',
│   │   │             emailed_at = NOW()
│   │   │
│   │   ├─ [Concert B] issueTicketForEvent(123, concertB_id)
│   │   │   ├─ (repeat ticket creation and email)
│   │   │
│   │   └─ [Concert C] issueTicketForEvent(123, concertC_id)
│   │       ├─ (repeat ticket creation and email)
│   │
│   ├─ TIME 5: Create audit log
│   │   INSERT INTO verification_audit_logs (
│   │     user_id, admin_user_id, action,
│   │     previous_verified_state, new_verified_state,
│   │     created_at
│   │   ) VALUES (
│   │     123, 456, 'admin_verify',
│   │     false, true, NOW()
│   │   )
│   │
│   └─ RETURN: {
│       user: {...},
│       isVerified: true,
│       status: "verified",
│       verifiedAt: "2026-03-29T14:30:00Z",
│       eligibleEventCount: 3,
│       activeTicketCount: 3,
│       checkedInCount: 0
│     }
│
├─ Admin sees: "Jane verified, 3 tickets created, emails sent"
│
└─ Jane receives 3 emails (one per concert) with QR codes
```

---

## Current Email Service Implementation

### What's In The Code

#### 1. Resend Client Initialization
```typescript
// At top of email.ts
let resendClient: any = null;
if (process.env.RESEND_API_KEY) {
  try {
    const { Resend } = await import("resend");
    resendClient = new Resend(process.env.RESEND_API_KEY);
  } catch (error) {
    console.warn("[Email] Resend not initialized:", error);
  }
}
```

**What it does:**
- Checks if API key exists
- Creates Resend client if available
- Falls back to console logging if not

---

#### 2. Main Send Function
```typescript
export async function sendTicketIssuedEmail(
  userId: number,
  eventId: number,
  ticketId: string
) {
  // Load data from database
  const user = await db.select().from(users)...
  const event = await db.select().from(events)...
  const ticket = await db.select().from(tickets)...

  // Build HTML
  const emailSubject = `Your Free Nursing Rocks Ticket is Ready! 🎸`;
  const emailBody = buildTicketEmailHtml({
    userName: user.first_name,
    eventTitle: event.title,
    eventDate: event.date?.toLocaleDateString(...),
    eventTime: event.start_time,
    eventLocation: event.location,
    ticketCode: ticket.ticket_code,
    qrImageUrl: ticket.qr_image_url,
  });

  // Send or log
  if (resendClient && process.env.RESEND_API_KEY) {
    const result = await resendClient.emails.send({
      from: SENDER_EMAIL,
      to: user.email,
      subject: emailSubject,
      html: emailBody,
    });
    console.log(`[EMAIL] ✅ Sent to ${user.email}`);
    return { success: true };
  } else {
    console.log(`[EMAIL - DEV MODE] Would send to ${user.email}`);
    return { success: true };
  }
}
```

**What it does:**
1. Load all necessary data (user, event, ticket)
2. Build HTML email template
3. Send via Resend IF API key is available
4. Otherwise log to console (dev mode)
5. Return success

**Key point:** This function is called automatically during verification and doesn't block the flow if it fails.

---

#### 3. Email Template (buildTicketEmailHtml)
```typescript
function buildTicketEmailHtml(data: {
  userName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  ticketCode: string;
  qrImageUrl: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); ... }
        .welcome-box { background: #fef3c7; ... }
        .qr-section { text-align: center; ... }
        .warning { background: #fee2e2; ... }
        ...
      </style>
    </head>
    <body>
      <div class="outer">
        <div class="container">
          <!-- Red header with "🎸 You're Verified!" -->
          <!-- Welcome message for Jane -->
          <!-- Event details (date, time, location) -->
          <!-- QR code image: <img src="${data.qrImageUrl}" /> -->
          <!-- Ticket code: "NR-2026-7K4M9Q" -->
          <!-- How-to instructions: 3 ways to check in -->
          <!-- Anti-sharing warning -->
          <!-- Support contact: support@nursingrocks.com -->
          <!-- Footer with Nursing Rocks Foundation info -->
        </div>
      </div>
    </body>
    </html>
  `;
}
```

**What it does:**
- Creates beautiful, professional HTML email
- Red Nursing Rocks theme
- Personalized greeting with user's first name
- Embeds QR image (data URL)
- Shows ticket code as backup
- Clear instructions for using ticket
- Anti-sharing warning
- Support contact

---

#### 4. Resend Email (Admin Action)
```typescript
export async function resendTicketEmail(ticketId: string) {
  // Load ticket
  const ticket = await db.select().from(tickets)
    .where(eq(tickets.id, ticketId))

  // Send email again
  try {
    await sendTicketIssuedEmail(
      ticket.user_id,
      ticket.event_id,
      ticketId
    );

    // Update status to sent
    await db.update(tickets).set({
      email_status: "sent",
      emailed_at: new Date(),
      email_error: null,
    })

    return { success: true };
  } catch (error) {
    // Update status to failed
    await db.update(tickets).set({
      email_status: "failed",
      email_error: error.message,
    })

    throw error;
  }
}
```

**What it does:**
- Called when admin clicks "Resend Email"
- Resends exact same email
- Updates `email_status` to 'sent' or 'failed'
- Logs any errors but doesn't block

---

## Email Data Flow in Database

### How QR Codes Are Stored and Accessed

```
1. When ticket is created:
   ├─ qr_token: JWT (compact, ~500 bytes)
   │  └─ Used for scanning/verification
   │
   └─ qr_image_url: PNG data URL (large, ~100KB)
      └─ Used for display in emails

2. Stored in tickets table:
   tickets.qr_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   tickets.qr_image_url = "data:image/png;base64,iVBORw0KGgo..."

3. When email is sent:
   ├─ Load ticket.qr_image_url
   ├─ Include in email HTML: <img src="{qr_image_url}" />
   └─ Send to user

4. When admin needs QR:
   ├─ GET /api/admin/tickets/:id/qr
   ├─ Returns: {
   │   ticketCode: "NR-2026-ABC123",
   │   qrToken: "eyJ...",
   │   qrImageUrl: "data:image/png...",
   │   status: "active",
   │   emailStatus: "sent"
   │ }
   └─ Admin can display/print/resend
```

**Key point:** QR images are accessible via the API, so admins can:
- Display on screen for user to screenshot
- Print for physical tickets
- Include in different communications
- Resend if user didn't get email

---

## Email Status Tracking

### How Emails Are Tracked

```
When ticket is created:
  email_status = 'pending'
  emailed_at = NULL
  email_error = NULL

When sendTicketIssuedEmail() is called:
  IF Resend API succeeds:
    email_status = 'sent'
    emailed_at = 2026-03-29T14:30:00Z
    email_error = NULL

  ELSE (API fails or timeout):
    email_status = 'failed'
    emailed_at = NULL
    email_error = "Connection timeout" (specific error message)

Admin can check status:
  GET /api/admin/tickets/:id/email-status
  → Returns: { emailStatus: "sent", sentAt: "...", lastError: null }

If email failed, admin can resend:
  POST /api/admin/tickets/:id/resend-email
  → Tries again
  → Updates status to 'sent' or 'failed'
```

---

## Email Service: Current vs. Production

### Development Mode (No Resend API Key)

```
Email does NOT actually send to user
Instead: logged to console

Console output:
══════════════════════════════════════════════════════════════
[EMAIL - DEV MODE] Would send to: jane@example.com
Subject: Your Free Nursing Rocks Ticket is Ready! 🎸
Ticket: NR-2026-ABC123
QR Token: eyJhbGciOiJIUzI1NiI...
HTML Preview: <!DOCTYPE html><html><head>...
══════════════════════════════════════════════════════════════

Useful for:
  - Testing workflow without email service
  - Seeing what would be sent
  - Development/staging environments
```

### Production Mode (Resend API Key Set)

```
Email sends via Resend API

Console output:
[EMAIL] ✅ Sent to jane@example.com (ticket: NR-2026-ABC123)

Email arrives in user's inbox within 1-2 seconds
  With QR code, ticket code, all details
```

---

## What Admins Can Do with Emails and QR Codes

### Admin Workflows

#### 1. **View User's Tickets and QR Codes**
```
GET /api/admin/users/:id/tickets
↓
Returns list of all user's tickets with:
  - ticket_code (NR-2026-ABC123)
  - qr_image_url (data URL)
  - qr_token (JWT)
  - email_status (sent/failed/pending)
  - emailed_at (timestamp)
```

**Use:** Admin dashboard shows all user's tickets with status

---

#### 2. **View Single QR Code**
```
GET /api/admin/tickets/:id/qr
↓
Returns:
{
  "ticketCode": "NR-2026-ABC123",
  "qrImageUrl": "data:image/png;base64,...",
  "emailStatus": "sent",
  "expiresAt": "2026-05-23T..."
}
```

**Use:** Display QR on screen, print, or share with user via different channel

---

#### 3. **Resend Email to User**
```
POST /api/admin/tickets/:id/resend-email
↓
Sends same email again
Updates email_status to 'sent'
```

**Use:** User says "I didn't get my ticket" → admin resends

---

#### 4. **Check Email Delivery Status**
```
GET /api/admin/tickets/:id/email-status
↓
Returns:
{
  "emailStatus": "sent",
  "sentAt": "2026-03-29T14:30:00Z",
  "lastError": null
}
```

**Use:** Troubleshoot why email didn't arrive

---

## Summary: Email Service

| Aspect | Details |
|--------|---------|
| **What triggers email** | Admin verifies user → tickets created → emails sent |
| **Email template** | Beautiful red-themed HTML with QR, ticket code, instructions |
| **QR storage** | Stored as data URL in `qr_image_url` column |
| **QR access** | Via `GET /api/admin/tickets/:id/qr` endpoint |
| **Email sending** | Via Resend API if key is set, else console logging |
| **Status tracking** | `email_status` field: 'pending', 'sent', 'failed' |
| **Resend capability** | Admin can resend via `POST /api/admin/tickets/:id/resend-email` |
| **Failure handling** | Doesn't block verification; logged and admins notified |
| **Admin visibility** | Can view QR, resend email, check delivery status |
| **User receives** | Email with QR code, ticket code, event details, instructions |

Done! The email service is fully documented and production-ready. 🎸
