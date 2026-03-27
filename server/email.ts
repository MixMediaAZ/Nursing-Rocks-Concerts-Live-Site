import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

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
      <p>Hi ${data.nurseName},</p>

      <p>Thank you for purchasing your ticket to the Nursing Rocks! Concert Series! We're excited to see you at the event.</p>

      <div class="event-details">
        <h3>${data.eventTitle}</h3>
        <p><span class="label">Date:</span> ${data.eventDate}</p>
        <p><span class="label">Time:</span> ${data.eventTime}</p>
        <p><span class="label">Location:</span> ${data.eventLocation}</p>
        <p><span class="label">Ticket Type:</span> ${data.ticketType}</p>
        <p><span class="label">Price:</span> ${data.price}</p>
      </div>

      <div class="ticket-code">
        ${data.ticketCode}
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
      subject: `Your ${data.eventTitle} Ticket - Nursing Rocks!`,
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
      <h1>✓ License Verified</h1>
    </div>

    <div class="content">
      <p>Hi ${nurseName},</p>

      <div class="success-box">
        <p><strong>Your nursing license has been verified!</strong></p>
        <p>License #${licenseNumber}</p>
      </div>

      <p>You're now able to purchase tickets and access exclusive content on Nursing Rocks! Concert Series.</p>

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
      subject: 'Your License Has Been Verified - Nursing Rocks!',
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
      <p>Hi ${data.nurseName},</p>

      <p>We found a healthcare position that matches your professional profile and interests.</p>

      <div class="job-details">
        <h3>${data.jobTitle}</h3>
        <p><span class="label">Employer:</span> ${data.employer}</p>
        <p><span class="label">Specialty:</span> ${data.specialty}</p>
        <p><span class="label">Location:</span> ${data.location}</p>
        ${data.salary ? `<p><span class="label">Salary:</span> ${data.salary}</p>` : ''}
      </div>

      <p>This position aligns with your experience and certifications. Apply today to connect with the employer!</p>

      <div style="text-align: center;">
        <a href="${data.jobUrl}" class="cta-button">View Job & Apply</a>
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
      subject: `New Job Alert: ${data.jobTitle} at ${data.employer}`,
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
      <p>Your concert is coming up in ${data.daysUntilEvent} days!</p>
    </div>

    <div class="content">
      <p>Hi ${data.nurseName},</p>

      <p>Your Nursing Rocks! Concert Series event is just around the corner. Get ready for an amazing experience!</p>

      <div class="event-details">
        <h3>${data.eventTitle}</h3>
        <p><span class="label">Date:</span> ${data.eventDate}</p>
        <p><span class="label">Time:</span> ${data.eventTime}</p>
        <p><span class="label">Location:</span> ${data.eventLocation}</p>
      </div>

      <div class="reminder-box">
        <strong>Your Ticket Code:</strong><br>
        <span class="ticket-code">${data.ticketCode}</span>
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
      subject: `Reminder: ${data.eventTitle} - ${data.daysUntilEvent} Days Away!`,
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

// ========== NRPX PHOENIX TICKET EMAIL ==========

export interface NrpxTicketEmailData {
  firstName: string;
  lastName: string;
  email: string;
  ticketCode: string;
  qrBuffer: Buffer;
}

/**
 * Send QR ticket email for NRPX Phoenix event registration
 */
export async function sendNrpxTicketEmail(data: NrpxTicketEmailData): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend API key not configured - skipping NRPX ticket email');
    return { success: false, error: 'Email service not configured' };
  }

  const qrBase64 = data.qrBuffer.toString('base64');

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background: #f4f4f4; }
    .wrapper { background: #f4f4f4; padding: 24px 0; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: white; padding: 40px 32px; text-align: center; }
    .header img { height: 48px; margin-bottom: 16px; }
    .header h1 { margin: 0 0 8px; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 0; font-size: 16px; opacity: 0.85; }
    .rock-accent { color: #e94560; }
    .content { padding: 32px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
    .event-card { background: #f8f9ff; border: 2px solid #e94560; border-radius: 10px; padding: 20px 24px; margin: 24px 0; }
    .event-card h2 { margin: 0 0 16px; font-size: 20px; color: #0f3460; }
    .event-detail { display: flex; align-items: flex-start; margin-bottom: 10px; font-size: 15px; }
    .event-detail .icon { font-size: 18px; margin-right: 10px; flex-shrink: 0; }
    .qr-section { text-align: center; padding: 24px 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee; margin: 24px 0; }
    .qr-section h3 { margin: 0 0 16px; font-size: 16px; color: #555; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
    .qr-section img { width: 220px; height: 220px; border: 4px solid #1a1a2e; border-radius: 8px; display: block; margin: 0 auto 16px; }
    .ticket-code { font-family: 'Courier New', monospace; font-size: 22px; font-weight: 700; letter-spacing: 3px; color: #0f3460; background: #f0f4ff; border: 2px dashed #0f3460; border-radius: 8px; padding: 12px 20px; display: inline-block; margin-top: 4px; }
    .backup-info { background: #fff8e1; border-left: 4px solid #f9a825; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 20px 0; font-size: 14px; color: #5a4000; }
    .backup-info strong { display: block; margin-bottom: 6px; font-size: 15px; }
    .footer { background: #1a1a2e; color: #aaa; text-align: center; padding: 24px 32px; font-size: 13px; }
    .footer a { color: #e94560; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>🎸 Nursing Rocks Phoenix</h1>
        <p>Your ticket is confirmed — see you at the show!</p>
      </div>

      <div class="content">
        <p class="greeting">Hi ${data.firstName},</p>
        <p>You're registered for <strong>Nursing Rocks Phoenix</strong>! Show this QR code at the door for entry. No printing needed — your phone works great.</p>

        <div class="event-card">
          <h2>🎤 Event Details</h2>
          <div class="event-detail"><span class="icon">📅</span><div><strong>Date:</strong> Friday, May 16, 2026</div></div>
          <div class="event-detail"><span class="icon">📍</span><div><strong>Venue:</strong> The Walter Studio, Phoenix, AZ</div></div>
          <div class="event-detail"><span class="icon">🎵</span><div><strong>Featuring:</strong> PsychoStar + special guests</div></div>
          <div class="event-detail"><span class="icon">🎟️</span><div><strong>Ticket:</strong> Free — registered nurses only</div></div>
        </div>

        <div class="qr-section">
          <h3>Your Entry QR Code</h3>
          <img src="data:image/png;base64,${qrBase64}" alt="QR Code for entry" />
          <div class="ticket-code">${data.ticketCode}</div>
        </div>

        <div class="backup-info">
          <strong>Can't scan? No problem.</strong>
          Give the door volunteer your name: <strong>${data.firstName} ${data.lastName}</strong><br>
          Or your ticket code: <strong>${data.ticketCode}</strong>
        </div>

        <p style="font-size: 14px; color: #666;">Questions? Reach us at <a href="mailto:hello@nursingrocksconcerts.com" style="color: #e94560;">hello@nursingrocksconcerts.com</a></p>
        <p style="font-size: 14px; color: #666;">See you on May 16th! 🤘<br><strong>— The Nursing Rocks Team</strong></p>
      </div>

      <div class="footer">
        <p><strong style="color: #fff;">Nursing Rocks Concert Series</strong></p>
        <p>Benefiting Gateway Community College Scholarships</p>
        <p style="margin-top: 12px; font-size: 11px; color: #666;">This is a transactional email confirming your event registration.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const response = await resend.emails.send({
      from: 'Nursing Rocks <tickets@nursingrocksconcerts.com>',
      to: data.email,
      subject: 'Your Nursing Rocks Phoenix Ticket 🎸',
      html: emailHtml,
      attachments: [
        {
          filename: 'ticket-qr.png',
          content: data.qrBuffer,
          contentType: 'image/png',
        },
      ],
    });

    if (response.error) {
      console.error('[NRPX] Resend error:', response.error);
      return { success: false, error: response.error.message };
    }

    console.log('[NRPX] Ticket email sent:', response.data?.id, 'to', data.email);
    return { success: true };
  } catch (error: any) {
    console.error('[NRPX] Error sending ticket email:', error);
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
        <p>Hi ${firstName},</p>
        <p>We received a request to reset the password for your Nursing Rocks account. Click the button below to choose a new password.</p>
        <div style="text-align: center;">
          <a href="${resetUrl}" class="reset-button">Reset My Password</a>
        </div>
        <div class="warning">
          <strong>This link expires in 1 hour.</strong> If you did not request a password reset, you can safely ignore this email — your password will not change.
        </div>
        <p style="font-size: 13px; color: #888;">If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${resetUrl}" style="color: #e94560; word-break: break-all;">${resetUrl}</a></p>
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
