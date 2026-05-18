import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Strip CR/LF from any user-supplied string used in email headers.
// Prevents CRLF header injection (BCC injection, subject hijacking, etc.)
const hdr = (s: unknown): string => String(s ?? '').replace(/[\r\n]+/g, ' ').trim();
const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export interface TicketEmailData {
  nurseName: string;
  userEmail: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  ticketCode: string;
  ticketType: string;
  price: string;
}

/**
 * Send ticket confirmation email to nurse after successful purchase
 */
export async function sendTicketConfirmationEmail(data: TicketEmailData): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend API key not configured - skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .event-details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea; }
    .event-details h3 { margin-top: 0; color: #667eea; }
    .event-details p { margin: 8px 0; }
    .label { font-weight: bold; color: #555; display: inline-block; width: 120px; }
    .ticket-code {
      background: #667eea;
      color: white;
      padding: 20px;
      border-radius: 6px;
      text-align: center;
      margin: 20px 0;
      font-size: 24px;
      font-weight: bold;
      letter-spacing: 2px;
    }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #888; border-top: 1px solid #ddd; }
    .important { background: #fffbea; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffa500; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Ticket Confirmed</h1>
      <p>Your Nursing Rocks! Concert Series ticket is ready</p>
    </div>

    <div class="content">
      <p>Hi ${esc(data.nurseName)},</p>

      <p>Thank you for purchasing your ticket to the Nursing Rocks! Concert Series! We're excited to see you at the event.</p>

      <div class="event-details">
        <h3>${esc(data.eventTitle)}</h3>
        <p><span class="label">Date:</span> ${esc(data.eventDate)}</p>
        <p><span class="label">Time:</span> ${esc(data.eventTime)}</p>
        <p><span class="label">Location:</span> ${esc(data.eventLocation)}</p>
        <p><span class="label">Ticket Type:</span> ${esc(data.ticketType)}</p>
        <p><span class="label">Price:</span> ${esc(data.price)}</p>
      </div>

      <div class="ticket-code">
        ${esc(data.ticketCode)}
      </div>

      <div class="important">
        <strong>Important:</strong> Please save your ticket code or bring this email with you. You'll need to present this code at the venue to check in.
      </div>

      <p>If you have any questions about the event or your ticket, please don't hesitate to reach out to us.</p>

      <p>See you at the show!<br>
      <strong>The Nursing Rocks! Team</strong></p>
    </div>

    <div class="footer">
      <p>Nursing Rocks! Concert Series | For Healthcare Professionals</p>
      <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    const response = await resend.emails.send({
      from: 'tickets@nursingrocks.com',
      to: data.userEmail,
      subject: `Your ${hdr(data.eventTitle)} Ticket - Nursing Rocks!`,
      html: emailHtml,
    });

    if (response.error) {
      console.error('Resend email error:', response.error);
      return { success: false, error: response.error.message };
    }

    console.log('Ticket confirmation email sent:', response.data?.id);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending ticket confirmation email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

/**
 * Send license verification email
 */
export async function sendLicenseVerificationEmail(
  userEmail: string,
  nurseName: string,
  licenseNumber: string
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend API key not configured - skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .success-box { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #888; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Account Approved</h1>
    </div>

    <div class="content">
      <p>Hi ${esc(nurseName)},</p>

      <div class="success-box">
        <p><strong>Your account has been approved!</strong></p>
      </div>

      <p>You're now able to access free tickets and exclusive content on Nursing Rocks! Concert Series.</p>

      <p>Thank you for being part of our community.</p>

      <p>Best regards,<br>
      <strong>The Nursing Rocks! Team</strong></p>
    </div>

    <div class="footer">
      <p>Nursing Rocks! Concert Series | For Healthcare Professionals</p>
      <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    const response = await resend.emails.send({
      from: 'verify@nursingrocks.com',
      to: userEmail,
      subject: 'Your Account Has Been Approved - Nursing Rocks!',
      html: emailHtml,
    });

    if (response.error) {
      console.error('Resend email error:', response.error);
      return { success: false, error: response.error.message };
    }

    console.log('License verification email sent:', response.data?.id);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending license verification email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

/**
 * Send welcome email to a newly registered nurse
 */
export async function sendWelcomeEmail(
  userEmail: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend API key not configured - skipping welcome email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #F61D7A 0%, #5D3FD3 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 26px; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .highlight-box { background: #fff; border-left: 4px solid #F61D7A; padding: 15px 20px; border-radius: 4px; margin: 20px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #F61D7A, #5D3FD3); color: white; padding: 14px 28px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 16px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #888; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Nursing Rocks!</h1>
      <p style="margin:8px 0 0;">Concert Series Celebrating Healthcare Heroes</p>
    </div>
    <div class="content">
      <p>Hi ${esc(firstName)},</p>
      <p>Thank you for joining the Nursing Rocks! community. Your account has been created and we're thrilled to have you.</p>
      <div class="highlight-box">
        <strong>What happens next?</strong><br>
        Our team will review your account and you'll be notified once you're approved to claim free concert tickets. No action needed on your end — we'll reach out by email.
      </div>
      <p>In the meantime, check out upcoming concerts and events near you on our site.</p>
      <p style="text-align:center;">
        <a href="https://nursingrocksconcerts.com/dashboard" class="cta-button">Go to My Dashboard</a>
      </p>
      <p>Thank you for everything you do for your patients and community. This one's for you.</p>
      <p>With gratitude,<br><strong>The Nursing Rocks! Team</strong></p>
    </div>
    <div class="footer">
      <p>Nursing Rocks! Concert Series | For Healthcare Professionals</p>
      <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
      <p><a href="mailto:NursingRocksConcerts@gmail.com" style="color:#888;">NursingRocksConcerts@gmail.com</a></p>
    </div>
  </div>
</body>
</html>
    `;

    const response = await resend.emails.send({
      from: 'welcome@nursingrocksconcerts.com',
      to: userEmail,
      subject: 'Welcome to Nursing Rocks! 🎵',
      html: emailHtml,
    });

    if (response.error) {
      console.error('Resend welcome email error:', response.error);
      return { success: false, error: response.error.message };
    }

    console.log('Welcome email sent:', response.data?.id);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

export interface JobAlertEmailData {
  nurseName: string;
  userEmail: string;
  jobTitle: string;
  employer: string;
  specialty: string;
  location: string;
  salary?: string;
  jobUrl: string;
}

/**
 * Send job alert email when a job matching nurse's profile is posted
 */
export async function sendJobAlertEmail(data: JobAlertEmailData): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend API key not configured - skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .job-details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea; }
    .job-details h3 { margin-top: 0; color: #667eea; font-size: 20px; }
    .job-details p { margin: 8px 0; }
    .label { font-weight: bold; color: #555; display: inline-block; width: 100px; }
    .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #888; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 New Job Alert</h1>
      <p>A position matching your profile is available!</p>
    </div>

    <div class="content">
      <p>Hi ${esc(data.nurseName)},</p>

      <p>We found a healthcare position that matches your professional profile and interests.</p>

      <div class="job-details">
        <h3>${esc(data.jobTitle)}</h3>
        <p><span class="label">Employer:</span> ${esc(data.employer)}</p>
        <p><span class="label">Specialty:</span> ${esc(data.specialty)}</p>
        <p><span class="label">Location:</span> ${esc(data.location)}</p>
        ${data.salary ? `<p><span class="label">Salary:</span> ${esc(data.salary)}</p>` : ''}
      </div>

      <p>This position aligns with your experience and certifications. Apply today to connect with the employer!</p>

      <div style="text-align: center;">
        <a href="${esc(data.jobUrl)}" class="cta-button">View Job & Apply</a>
      </div>

      <p>You're receiving this email because you set up job alerts on Nursing Rocks! To manage your preferences, visit your dashboard.</p>

      <p>Best regards,<br>
      <strong>The Nursing Rocks! Team</strong></p>
    </div>

    <div class="footer">
      <p>Nursing Rocks! Concert Series | For Healthcare Professionals</p>
      <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    const response = await resend.emails.send({
      from: 'jobs@nursingrocks.com',
      to: data.userEmail,
      subject: `New Job Alert: ${hdr(data.jobTitle)} at ${hdr(data.employer)}`,
      html: emailHtml,
    });

    if (response.error) {
      console.error('Resend email error:', response.error);
      return { success: false, error: response.error.message };
    }

    console.log('Job alert email sent:', response.data?.id);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending job alert email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

export interface EventReminderEmailData {
  nurseName: string;
  userEmail: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  ticketCode: string;
  daysUntilEvent: number;
}

/**
 * Send event reminder email 3 days before the event
 */
export async function sendEventReminderEmail(data: EventReminderEmailData): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend API key not configured - skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .event-details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea; }
    .event-details h3 { margin-top: 0; color: #667eea; }
    .event-details p { margin: 8px 0; }
    .label { font-weight: bold; color: #555; display: inline-block; width: 120px; }
    .reminder-box { background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .ticket-code { font-family: monospace; font-size: 16px; font-weight: bold; color: #667eea; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #888; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎵 Event Reminder</h1>
      <p>Your concert is coming up in ${esc(data.daysUntilEvent)} days!</p>
    </div>

    <div class="content">
      <p>Hi ${esc(data.nurseName)},</p>

      <p>Your Nursing Rocks! Concert Series event is just around the corner. Get ready for an amazing experience!</p>

      <div class="event-details">
        <h3>${esc(data.eventTitle)}</h3>
        <p><span class="label">Date:</span> ${esc(data.eventDate)}</p>
        <p><span class="label">Time:</span> ${esc(data.eventTime)}</p>
        <p><span class="label">Location:</span> ${esc(data.eventLocation)}</p>
      </div>

      <div class="reminder-box">
        <strong>Your Ticket Code:</strong><br>
        <span class="ticket-code">${esc(data.ticketCode)}</span>
        <p style="margin-top: 10px; margin-bottom: 0;">Please bring this code (or your phone with this email) to check in at the event.</p>
      </div>

      <p><strong>Preparation Tips:</strong></p>
      <ul>
        <li>Arrive 15 minutes early for smooth check-in</li>
        <li>Have your ticket code ready on your phone or printed</li>
        <li>Check the weather and dress accordingly</li>
        <li>Bring ID for verification if required</li>
      </ul>

      <p>See you soon!<br>
      <strong>The Nursing Rocks! Team</strong></p>
    </div>

    <div class="footer">
      <p>Nursing Rocks! Concert Series | For Healthcare Professionals</p>
      <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    const response = await resend.emails.send({
      from: 'events@nursingrocks.com',
      to: data.userEmail,
      subject: `Reminder: ${hdr(data.eventTitle)} - ${data.daysUntilEvent} Days Away!`,
      html: emailHtml,
    });

    if (response.error) {
      console.error('Resend email error:', response.error);
      return { success: false, error: response.error.message };
    }

    console.log('Event reminder email sent:', response.data?.id);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending event reminder email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

// ========== SHARED THANK-YOU EMAIL ==========

function thankYouEmailHtml(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.8; color: #1a1a1a; margin: 0; padding: 0; background: #f4f4f4; }
    .wrapper { background: #f4f4f4; padding: 24px 0; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: white; padding: 40px 32px; text-align: center; }
    .header h1 { margin: 0 0 8px; font-size: 28px; font-weight: 800; }
    .header p { margin: 0; font-size: 16px; opacity: 0.85; }
    .content { padding: 36px 32px; font-size: 16px; color: #1a1a1a; }
    .content p { margin: 0 0 18px; }
    .sign-off { margin-top: 28px; }
    .footer { background: #1a1a2e; color: #aaa; text-align: center; padding: 24px 32px; font-size: 13px; }
    .footer a { color: #e94560; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>🎸 Nursing Rocks!</h1>
        <p>Concert Series</p>
      </div>
      <div class="content">
        <p>Thank you for joining us at our inaugural Nursing Rocks! Concert Series event! Your involvement is what made the night special!</p>
        <p>More importantly, thank you for what you do every single day. The care and dedication you bring to your patients doesn't go unnoticed — and it's exactly why we created a space to celebrate you.</p>
        <p>We're already planning your next event and so appreciate having you with us. Watch for updates soon!</p>
        <p>Please tag @NursingRocks if you have any fun social media posts!</p>
        <p><a href="https://www.facebook.com/share/18cC5MHrSX/" style="color: #e94560;">Follow us on Facebook</a></p>
        <div style="text-align: center; margin: 20px 0;">
          <img src="https://www.nursingrocksconcerts.com/assets/instagram-qr.png" alt="Follow @NURSING_ROCKS_CONCERT_SERIES on Instagram" style="width: 220px; height: auto; border-radius: 8px;" />
          <p style="margin: 8px 0 0; font-size: 13px; color: #555;">Scan to follow us on Instagram<br><strong>@NURSING_ROCKS_CONCERT_SERIES</strong></p>
        </div>
        <div class="sign-off">
          <p>With deep appreciation,<br><strong>Nursing Rocks!</strong></p>
          <p><a href="https://www.NursingRocksConcerts.com" style="color: #e94560;">www.NursingRocksConcerts.com</a></p>
          <p><a href="https://nursingrocks.org/" style="color: #e94560;">https://nursingrocks.org/</a></p>
        </div>
      </div>
      <div class="footer">
        <p><strong style="color: #fff;">Nursing Rocks Concert Series</strong></p>
        <p>Benefiting Gateway Community College Scholarships</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// ========== NRPX PHOENIX TICKET EMAIL ==========

export interface NrpxTicketEmailData {
  firstName: string;
  lastName: string;
  email: string;
  ticketCode: string;
  qrBuffer: Buffer;
}

/**
 * Send thank-you email for NRPX Phoenix event (post-inaugural event)
 */
export async function sendNrpxTicketEmail(data: NrpxTicketEmailData): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend API key not configured - skipping NRPX ticket email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await resend.emails.send({
      from: 'Nursing Rocks <tickets@nursingrocksconcerts.com>',
      to: data.email,
      subject: 'Thank You from Nursing Rocks! 🎸',
      html: thankYouEmailHtml(),
    });

    if (response.error) {
      console.error('[NRPX] Resend error:', response.error);
      return { success: false, error: response.error.message };
    }

    if (process.env.NODE_ENV !== 'production') console.log('[NRPX] Ticket email sent:', response.data?.id);
    return { success: true };
  } catch (error: any) {
    console.error('[NRPX] Error sending ticket email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

export interface NrpxWelcomeEmailData {
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * Send thank-you email for approved NRPX registration
 */
export async function sendNrpxWelcomeEmail(data: NrpxWelcomeEmailData): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend API key not configured - skipping NRPX welcome email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await resend.emails.send({
      from: 'Nursing Rocks <noreply@nursingrocksconcerts.com>',
      to: data.email,
      subject: 'Thank You from Nursing Rocks! 🎸',
      html: thankYouEmailHtml(),
    });

    if (response.error) {
      console.error('[NRPX] Resend error:', response.error);
      return { success: false, error: response.error.message };
    }

    if (process.env.NODE_ENV !== 'production') console.log('[NRPX] Welcome email sent:', response.data?.id);
    return { success: true };
  } catch (error: any) {
    console.error('[NRPX] Error sending welcome email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

/**
 * Send password reset email with a one-time link
 */
export async function sendPasswordResetEmail(
  userEmail: string,
  firstName: string,
  resetToken: string,
  baseUrl: string
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend API key not configured - skipping password reset email');
    return { success: false, error: 'Email service not configured' };
  }

  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: white; padding: 40px 32px; text-align: center; }
    .header h1 { margin: 0 0 8px; font-size: 26px; font-weight: 800; }
    .header p { margin: 0; font-size: 15px; opacity: 0.85; }
    .content { padding: 32px; }
    .reset-button { display: inline-block; background: #e94560; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; margin: 24px 0; }
    .warning { background: #fff8e1; border-left: 4px solid #f9a825; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 20px 0; font-size: 14px; color: #5a4000; }
    .footer { background: #1a1a2e; color: #aaa; text-align: center; padding: 24px 32px; font-size: 13px; }
  </style>
</head>
<body>
  <div style="background: #f4f4f4; padding: 24px 0;">
    <div class="container">
      <div class="header">
        <h1>Password Reset</h1>
        <p>Nursing Rocks Concert Series</p>
      </div>
      <div class="content">
        <p>Hi ${esc(firstName)},</p>
        <p>We received a request to reset the password for your Nursing Rocks account. Click the button below to choose a new password.</p>
        <div style="text-align: center;">
          <a href="${esc(resetUrl)}" class="reset-button">Reset My Password</a>
        </div>
        <div class="warning">
          <strong>This link expires in 1 hour.</strong> If you did not request a password reset, you can safely ignore this email — your password will not change.
        </div>
        <p style="font-size: 13px; color: #888;">If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${esc(resetUrl)}" style="color: #e94560; word-break: break-all;">${esc(resetUrl)}</a></p>
        <p>— The Nursing Rocks Team</p>
      </div>
      <div class="footer">
        <p><strong style="color: #fff;">Nursing Rocks Concert Series</strong></p>
        <p style="font-size: 11px; margin-top: 8px;">If you didn't request this, no action is needed.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const response = await resend.emails.send({
      from: 'Nursing Rocks <noreply@nursingrocksconcerts.com>',
      to: userEmail,
      subject: 'Reset your Nursing Rocks password',
      html: emailHtml,
    });

    if (response.error) {
      console.error('Password reset email error:', response.error);
      return { success: false, error: response.error.message };
    }

    console.log('Password reset email sent:', response.data?.id);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}
