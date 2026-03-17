# NODE: email-resend
## Transactional email via Resend

---

## SOLUTION
Resend — resend.com

## STACK VARIANT
Any Node.js backend (Express or Next.js)

## DEPENDENCIES
- fix-ts-errors [LOCKED] if TypeScript project

## INPUTS REQUIRED
- RESEND_API_KEY (from resend.com — free tier: 3000 emails/month)
- FROM_EMAIL (verified domain email)
- FROM_NAME (display name)

## INSTRUCTIONS

### Step 1 — Check for existing email service
```bash
grep -r "SENDGRID\|MAILGUN\|RESEND\|SES\|nodemailer" .env* 2>/dev/null
grep -r "sendgrid\|mailgun\|resend" package.json
```
If existing service found — use that service's node instead. Stop and report.

### Step 2 — Install
```bash
npm install resend
```

### Step 3 — Environment variables
Add to .env:
```
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=hello@yourdomain.com
FROM_NAME=Your App Name
```

### Step 4 — Create email service

**Express (server/services/email.ts):**
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
    if (error) { console.error('Resend error:', error); return false; }
    return true;
  } catch (err) {
    console.error('Email service error:', err);
    return false;
  }
}
```

**Next.js (lib/email.ts):**
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
  return resend.emails.send({
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to, subject, html,
  });
}
```

### Step 5 — Test endpoint (remove after validation)

**Express:**
```typescript
app.get('/api/test-email', async (req, res) => {
  const ok = await sendEmail({
    to: 'test@youremail.com',
    subject: 'FORGE Email Test',
    html: '<p>Email node validated.</p>'
  });
  res.json({ success: ok });
});
```

**Next.js (app/api/test-email/route.ts):**
```typescript
import { sendEmail } from '@/lib/email';
export async function GET() {
  await sendEmail('test@youremail.com', 'FORGE Test', '<p>Working.</p>');
  return Response.json({ success: true });
}
```

## VALIDATION
```
1. Hit test endpoint
2. Email received in inbox within 60 seconds
3. Not in spam
4. Remove test endpoint after validation
```

## LOCKED_BY
- email-confirmation
- email-sequences
- any node that sends email

## OUTPUT
- Email service file
- Verified send capability
- .env variables documented

## FAILURE MODES

**Failure Mode 1: Domain not verified**
Use onboarding@resend.dev as FROM during dev only.
Verify domain DNS (SPF + DKIM) before production.

**Failure Mode 2: Emails in spam**
Domain not authenticated. Add DNS records shown in Resend dashboard.

**Failure Mode 3: Free tier limit hit**
100 emails/day on free tier. Upgrade to $20/mo for 50k/month.
