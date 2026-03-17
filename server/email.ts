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
