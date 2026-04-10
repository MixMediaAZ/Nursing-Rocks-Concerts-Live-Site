# Phoenix Event Registration - Admin Quick Guide

**For:** Admin staff managing Nursing Rocks Phoenix event registrations
**Updated:** April 9, 2026

---

## The Registration Workflow

```
NURSE PERSPECTIVE:
┌──────────────────────────────────────────────────────────────┐
│ 1. REGISTER                                                  │
│    Nurse fills form with: First Name, Last Name, Email       │
│    → Status: pending_approval                                │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. WAIT FOR ADMIN APPROVAL                                   │
│    Admin reviews and approves                                │
│    Nurse gets approval email                                 │
│    → Status: approved_ready_to_claim                         │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. CLAIM TICKET                                              │
│    Nurse logs in and clicks "Claim Ticket"                   │
│    Nurse receives email with QR code                         │
│    → Status: ticket_claimed                                  │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. CHECK IN AT EVENT                                         │
│    Nurse shows QR code at door                               │
│    Scan confirms identity                                    │
│    → Status: checked_in                                      │
└──────────────────────────────────────────────────────────────┘
```

---

## Registration Statuses

| Status | Meaning | Admin Action |
|--------|---------|--------------|
| `pending_approval` | Waiting for admin review | ✅ REVIEW & APPROVE |
| `approved_ready_to_claim` | Admin approved, nurse can claim | — (automatic) |
| `ticket_claimed` | Nurse got QR code email | — (automatic) |
| `checked_in` | Nurse checked in at event | — (scanner) |

---

## Common Admin Tasks

### Task 1: Approve Pending Registrations

**Where:** Admin Dashboard → NRPX Registrations → Pending Approvals

**Steps:**
1. Click "Pending Approvals" tab
2. Review nurse info (name, email, employer)
3. Click "Approve" button
4. System will:
   - Set `is_verified = true` on user account
   - Send approval welcome email
   - Nurse can now claim ticket

**What Happens:**
- ✅ Approval email sent → Nurse knows they're approved
- ✅ Status changes → "approved_ready_to_claim"
- ✅ Nurse can now claim their ticket

**If Email Fails:**
- You'll see message: "email send pending - can resend manually"
- Click "Resend Email" to try again
- Do NOT need to re-approve

---

### Task 2: Monitor Registration Pipeline

**Where:** Admin Dashboard → Workflow Stats

**You'll see:**
```
Total Registrations: 150

Pipeline Status:
  Pending Approval:     45 (30%)  ← Need to approve these
  Ready to Claim:       15 (10%)  ← Waiting for nurses to claim
  Tickets Claimed:      85 (57%)  ← Got their QR codes
  Checked In:            5 (3%)   ← Already at event
```

**What It Means:**
- High "pending approval" → You have work to do (review & approve)
- High "ready to claim" → Nurses haven't claimed yet (can send reminder)
- High "tickets claimed" → Good, nurses are ready to come
- Low "checked in" → Event hasn't started yet

---

### Task 3: Resend Email to a Nurse

**Situation:** Nurse says "I didn't get my email"

**Steps:**
1. Go to Registrations list
2. Find the nurse (search by name or email)
3. Click "Resend Email" button
4. Email is resent immediately

**Note:** You can resend:
- Approval email (if approval was sent but nurse didn't get it)
- Ticket email (if ticket was claimed but nurse didn't get QR code)

**Best Practice:**
- Send resend once
- If still fails, ask nurse to check spam folder
- If still nothing, check email service logs

---

### Task 4: Check Event Check-In Progress

**Where:** Scanner Display or `/api/nrpx/stats`

**You'll see:**
```
Total Registered: 150
Tickets Claimed: 85
Checked In: 5
Still Need to Arrive: 145
```

**During Event:**
- Update every time someone scans QR code
- Use at door scanner to monitor arrival rate
- Great for knowing when to start main event

---

## Common Issues & Solutions

### Issue #1: Nurse Can't See Ticket Code

**Symptom:** Nurse says "I can't see my ticket code in the app"

**Why:** Ticket code is NEVER shown in app. It's ONLY sent via email.

**Solution:**
1. Check: Is nurse status "ticket_claimed"?
2. Yes → Email should have QR code → Check spam folder
3. No → Nurse needs to click "Claim Ticket" button first

---

### Issue #2: Nurse Can't Claim Ticket

**Symptom:** "Can't claim ticket" error

**Possible Causes:**

| Error | Cause | Solution |
|-------|-------|----------|
| "Not yet verified" | Admin hasn't approved | → Approve the registration |
| "Approval email hasn't been sent" | Email_sent flag not set | → Click Resend Email |
| "Already claimed" | Ticket already sent | → That's normal, check spam |

---

### Issue #3: Email Never Arrives

**Symptom:** Nurse doesn't get approval or ticket email

**Troubleshooting Steps:**
1. Check spam/junk folder (common!)
2. Verify email address is correct in registration
3. Check email service logs (if available)
4. Try "Resend Email" button
5. If still fails:
   - Contact email provider
   - Manual email: you can email approval/ticket directly

---

### Issue #4: Rate Limit Error at Registration

**Symptom:** Nurse gets "Too many registrations" error

**Causes:**
1. **Same IP, many registrations:** Corporate network, shared WiFi
   - **Solution:** Wait 1 hour or use different network

2. **Same email domain, registration in last 24h:** Multiple nurses from same hospital
   - **Solution:** Space registrations across different days
   - OR: Admin can manually add registrations (bypass rate limit)

**When to Intervene:**
- If many nurses from same hospital: Stagger registrations across days
- If hospital has one IP: Ask them to use VPN or come back tomorrow
- As last resort: You can manually add them via admin interface

---

### Issue #5: Duplicate Registration

**Symptom:** Nurse tries to register twice with same email

**System Response:** "This email is already registered for this event"

**Why:** System prevents email reuse to avoid conflicts

**Solution:**
- Tell nurse they're already registered
- Check their registration status
- Have them claim ticket with their existing registration

---

## Quick Reference: Admin API Endpoints

```
GET /api/admin/nrpx/pending-approvals
→ List all pending registrations (waiting for approval)

POST /api/admin/nrpx/approve/:registrationId
→ Approve a single registration

GET /api/admin/nrpx/registrations
→ Full list with search & filter

POST /api/admin/nrpx/registrations/resend/:id
→ Resend approval or ticket email

GET /api/admin/nrpx/workflow-stats
→ Dashboard stats (pipeline view)

GET /api/admin/nrpx/registrations/export
→ CSV export of all registrations
```

---

## Best Practices

### For Admins:

✅ **DO:**
- Check workflow stats daily
- Approve registrations within 24 hours
- Remind nurses about claiming tickets
- Have nurses claim tickets before event day
- Use CSV export for record-keeping

❌ **DON'T:**
- Delete registrations (archive instead)
- Manually edit ticket codes
- Approve without verifying nurse credentials
- Send tickets before approval
- Share ticket codes via non-email channels

### For Event Day:

📋 **Before Event:**
1. Check workflow stats
2. Send reminder: "Claim your ticket!"
3. Run CSV export for backup
4. Test QR scanner with sample codes

🎸 **During Event:**
1. Monitor check-in count at door
2. Rescan anyone with code issues
3. Take note of no-shows
4. Save final check-in data

---

## Data Privacy Notes

- Ticket codes are UNIQUE per nurse (no sharing)
- QR codes in email are PRIVATE (don't screenshot in group chat)
- Registration data is SECURE (stored encrypted)
- CSV exports should be CONFIDENTIAL (nurse data)
- Emails go through SECURE email service

**If Data Breach Suspected:**
1. Notify security team immediately
2. Disable affected ticket codes
3. Regenerate new codes for affected nurses
4. Inform nurses of situation

---

## Support & Escalation

**For Technical Issues:**
- Email: [support@nursingrocks.com]
- Check PHXREG_SECURITY_FIXES.md for detailed docs

**For Nurse Questions:**
- "I didn't get email" → Resend Email button
- "Can't claim ticket" → Verify approval status first
- "Forgot password" → Password reset link
- "Want to change email" → Contact support

**For Rate Limit Issues:**
- Corporate network getting blocked? → Tell them to wait 1 hour or use VPN
- Multiple nurses from same domain? → Stagger registrations or contact admin

---

## Metrics to Track

Track these over time to measure success:

```
Daily Registrations: How many nurses register per day?
Approval Rate: How quickly are we approving?
Claim Rate: What % of approved nurses claim tickets?
No-Show Rate: What % registered don't show up?
Email Delivery: Are emails getting through?
```

**Success Looks Like:**
- ✅ Most registrations approved within 24 hours
- ✅ 80%+ of approved nurses claim tickets
- ✅ 90%+ email delivery rate
- ✅ 70%+ show-up rate (normal for free events)

---

## Version History

| Date | Change | Impact |
|------|--------|--------|
| 2026-04-09 | Security fixes & rate limiting | Critical vulnerabilities fixed |

**Next Review:** 2026-05-16 (after event)
