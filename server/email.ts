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
