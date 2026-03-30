import { db } from "../db";
import { users, tickets, events } from "@shared/schema";
import { eq } from "drizzle-orm";

// Initialize Resend client if API key is available (lazy loading)
let resendClient: any = null;
let resendInitError: Error | null = null;

async function initializeResendClient() {
  if (!resendClient && !resendInitError) {
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        resendClient = new Resend(process.env.RESEND_API_KEY);
        // Production: silently succeed. Development: log for debugging
        const isDev = process.env.NODE_ENV !== "production";
        if (isDev) {
          console.log("[Email] ✅ Resend client initialized successfully");
        }
      } catch (error) {
        resendInitError = error instanceof Error ? error : new Error(String(error));
        const isDev = process.env.NODE_ENV !== "production";
        const msg = `[Email] Failed to initialize Resend: ${error instanceof Error ? error.message : String(error)}`;
        if (isDev) {
          console.warn(msg + " (development mode - emails will be logged to console)");
        } else {
          console.error("[Email] Failed to initialize Resend email service");
        }
      }
    } else {
      const isDev = process.env.NODE_ENV !== "production";
      if (!isDev) {
        console.warn("[Email] RESEND_API_KEY not configured");
      } else {
        console.log("[Email] Development mode - emails will be logged to console");
      }
    }
  }
  if (resendInitError) {
    const isDev = process.env.NODE_ENV !== "production";
    if (!isDev) throw resendInitError;
  }
  return resendClient;
}

const SENDER_EMAIL = process.env.SENDER_EMAIL || "noreply@nursingrocks.com";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@nursingrocks.com";

/**
 * Validate UUID format
 */
function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Send ticket issuance email to a newly verified user
 *
 * Email includes:
 * - Welcome message (they just got verified!)
 * - Event details (date, time, location)
 * - QR code image (scannable at gate)
 * - Ticket code (readable backup)
 * - Anti-sharing warning
 * - Support contact
 */
export async function sendTicketIssuedEmail(userId: number, eventId: number, ticketId: string) {
  // FIX: Validate all input parameters
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Invalid user ID");
  }
  if (!Number.isInteger(eventId) || eventId <= 0) {
    throw new Error("Invalid event ID");
  }
  if (!isValidUUID(ticketId)) {
    throw new Error("Invalid ticket ID format");
  }

  // Load all necessary data
  const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!userResult.length) throw new Error("User not found");
  const user = userResult[0];

  // FIX: Validate email format before using
  if (!user.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    throw new Error("User has invalid email address");
  }

  const eventResult = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!eventResult.length) throw new Error("Event not found");
  const event = eventResult[0];

  const ticketResult = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  if (!ticketResult.length) throw new Error("Ticket not found");
  const ticket = ticketResult[0];

  // Build email
  const emailSubject = `Your Free Nursing Rocks Ticket is Ready! 🎸`;

  const emailBody = buildTicketEmailHtml({
    userName: user.first_name,
    eventTitle: event.title || "Nursing Rocks Event",
    eventDate: event.date?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) || "TBA",
    eventTime: (event.start_time as string) || "TBA",
    eventLocation: (event.location as string) || "TBA",
    ticketCode: ticket.ticket_code,
    qrImageUrl: ticket.qr_image_url || "",
  });

  // Initialize Resend client if needed
  const client = await initializeResendClient();

  // Send via Resend if available, otherwise log for development
  if (client && process.env.RESEND_API_KEY) {
    try {
      const result = await client.emails.send({
        from: SENDER_EMAIL,
        to: user.email,
        subject: emailSubject,
        html: emailBody,
      });

      // FIX: Don't log user email addresses in production
      const isDev = process.env.NODE_ENV !== "production";
      if (isDev) {
        console.log(`[EMAIL] Sent ticket ${ticket.ticket_code}`);
      }
      return { success: true, emailId: result.id };
    } catch (error) {
      // FIX: Don't expose user email in error logs
      console.error(`[EMAIL] Failed to send ticket ${ticket.ticket_code}:`, error instanceof Error ? error.message : String(error));
      throw new Error(`Email service error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  } else {
    // Development mode: log to console
    console.log(`\n${"=".repeat(60)}`);
    console.log(`[EMAIL - DEV MODE] Would send to: ${user.email}`);
    console.log(`Subject: ${emailSubject}`);
    console.log(`Ticket: ${ticket.ticket_code}`);
    console.log(`QR Token: ${ticket.qr_token ? ticket.qr_token.substring(0, 20) + '...' : 'N/A'}`);
    console.log(`HTML Preview: ${emailBody.substring(0, 200)}...`);
    console.log(`${"=".repeat(60)}\n`);

    return { success: true };
  }
}

/**
 * Build beautiful HTML email template for newly verified nurses
 * Message is personalized, welcoming, and emphasizes the free gift
 */
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
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; background: #f3f4f6; }
        .outer { background: #f3f4f6; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { font-size: 32px; margin-bottom: 10px; }
        .header p { font-size: 18px; opacity: 0.95; }
        .content { padding: 40px 30px; }
        .welcome-box { background: #fef3c7; border-left: 4px solid #dc2626; padding: 20px; border-radius: 6px; margin-bottom: 30px; }
        .welcome-box strong { color: #92400e; }
        h2 { font-size: 24px; color: #1f2937; margin: 25px 0 15px; }
        .event-details { background: #f9fafb; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
        .event-detail-row { display: flex; align-items: center; margin: 12px 0; font-size: 16px; }
        .event-detail-row span:first-child { min-width: 100px; font-weight: 600; color: #374151; }
        .qr-section { text-align: center; margin: 35px 0; padding: 30px; background: #fafafa; border-radius: 8px; }
        .qr-label { font-size: 14px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 15px; }
        .qr-image { max-width: 280px; height: auto; margin: 15px 0; border-radius: 6px; border: 2px solid #e5e7eb; }
        .ticket-code { font-size: 20px; font-weight: 700; font-family: 'Monaco', 'Courier New', monospace; background: white; padding: 15px; border-radius: 6px; border: 2px dashed #dc2626; margin-top: 15px; word-break: break-all; }
        .backup-info { font-size: 12px; color: #6b7280; margin-top: 12px; }
        .instructions { background: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; border-radius: 6px; margin: 25px 0; }
        .instructions h3 { color: #1e40af; font-size: 14px; font-weight: 600; margin-bottom: 10px; }
        .instructions ul { margin-left: 20px; color: #374151; }
        .instructions li { margin: 8px 0; }
        .warning { background: #fee2e2; border-left: 4px solid #dc2626; padding: 20px; border-radius: 6px; margin: 25px 0; }
        .warning strong { color: #7f1d1d; }
        .warning p { color: #991b1b; font-size: 14px; }
        .support-section { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        .support-section p { font-size: 14px; color: #6b7280; }
        .support-link { color: #dc2626; text-decoration: none; font-weight: 600; }
        .footer { background: #f3f4f6; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
        .footer-logo { font-weight: 600; color: #1f2937; margin: 10px 0; }
        .footer-tagline { color: #9ca3af; font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="outer">
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>🎸 You're Verified!</h1>
            <p>Your free Nursing Rocks ticket is ready</p>
          </div>

          <!-- Main Content -->
          <div class="content">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${escapeHtml(data.userName)},</p>

            <div class="welcome-box">
              <strong>Welcome to the Nursing Rocks community!</strong> We're thrilled to have verified you. You now have a free ticket to the upcoming Nursing Rocks concert — our way of saying thank you for all you do.
            </div>

            <!-- Event Details -->
            <h2>Your Event Details</h2>
            <div class="event-details">
              <h3 style="margin: 0 0 15px 0; color: #dc2626; font-size: 20px;">${escapeHtml(data.eventTitle)}</h3>
              <div class="event-detail-row">
                <span>📅 Date:</span>
                <span>${escapeHtml(data.eventDate)}</span>
              </div>
              <div class="event-detail-row">
                <span>🕐 Time:</span>
                <span>${escapeHtml(data.eventTime)}</span>
              </div>
              <div class="event-detail-row">
                <span>📍 Location:</span>
                <span>${escapeHtml(data.eventLocation)}</span>
              </div>
            </div>

            <!-- QR Code -->
            <h2>Your Ticket</h2>
            <div class="qr-section">
              <div class="qr-label">Scan this QR code at the gate</div>
              ${data.qrImageUrl ? `<img src="${escapeHtml(data.qrImageUrl)}" alt="Your QR Ticket" class="qr-image">` : '<p style="color: #9ca3af; padding: 40px 0;">[QR code unavailable]</p>'}
              <div style="margin-top: 20px;">
                <p style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">Or provide this code:</p>
                <div class="ticket-code">${escapeHtml(data.ticketCode)}</div>
              </div>
              <div class="backup-info">✓ Save this code as a backup</div>
            </div>

            <!-- How It Works -->
            <div class="instructions">
              <h3>How to Check In:</h3>
              <ul>
                <li><strong>Option 1:</strong> Show this email and the QR code to staff at the gate</li>
                <li><strong>Option 2:</strong> Tell them your ticket code: <code style="background: white; padding: 2px 4px; border-radius: 2px;">${escapeHtml(data.ticketCode)}</code></li>
                <li><strong>Option 3:</strong> Take a screenshot of this QR code for offline access</li>
              </ul>
            </div>

            <!-- Important Notice -->
            <div class="warning">
              <strong>⚠️ Important - Please Read:</strong>
              <p style="margin-top: 8px;">This ticket is <strong>exclusively yours</strong> and single-use. Once scanned at the event, it cannot be used again. Please do not share your QR code or ticket number with others. Tickets are tied to your name and verification status — attempting to share them violates our terms and may result in removal from the event.</p>
            </div>

            <!-- Support -->
            <div class="support-section">
              <p><strong>Questions?</strong> We're here to help!</p>
              <p>📧 Email: <a href="mailto:${SUPPORT_EMAIL}" class="support-link">${SUPPORT_EMAIL}</a></p>
              <p style="margin-top: 15px; font-size: 13px;">If you didn't receive this email, check your spam folder. If you lose your ticket, reply to this email or contact support and we'll help you out.</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="footer-logo">🎵 Nursing Rocks Foundation</div>
            <div class="footer-tagline">Benefiting Gateway Community College Scholarships</div>
            <p style="margin-top: 12px;">This is an automated message. Please do not reply directly — use the support email above.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Resend a ticket email (admin action)
 * Called when user didn't receive original email or needs a new copy
 */
export async function resendTicketEmail(ticketId: string) {
  // FIX: Validate ticket ID format
  if (!isValidUUID(ticketId)) {
    throw new Error("Invalid ticket ID format");
  }

  const ticketResult = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  if (!ticketResult.length) throw new Error("Ticket not found");

  const ticket = ticketResult[0];

  // FIX: Validate ticket is in a state where it can be resent
  if (ticket.status === "revoked") {
    throw new Error("Cannot resend email for revoked ticket");
  }
  if (ticket.status === "expired") {
    throw new Error("Cannot resend email for expired ticket");
  }

  try {
    await sendTicketIssuedEmail(ticket.user_id, ticket.event_id, ticketId);

    // Update email status to success
    await db
      .update(tickets)
      .set({
        email_status: "sent",
        emailed_at: new Date(),
        email_error: "",
        updated_at: new Date(),
      })
      .where(eq(tickets.id, ticketId));

    return { success: true, message: "Ticket email resent successfully" };
  } catch (error) {
    // Log the error but still update DB to track failure
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await db
      .update(tickets)
      .set({
        email_status: "failed",
        email_error: errorMessage,
        updated_at: new Date(),
      })
      .where(eq(tickets.id, ticketId));

    throw error;
  }
}

/**
 * Get QR code data for admin viewing/downloading
 * Returns both the data URL and the raw token
 */
export async function getTicketQrCode(ticketId: string) {
  // FIX: Validate ticket ID format
  if (!isValidUUID(ticketId)) {
    throw new Error("Invalid ticket ID format");
  }

  const ticketResult = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  if (!ticketResult.length) throw new Error("Ticket not found");

  const ticket = ticketResult[0];

  // FIX: Handle nullable qr_token safely (legacy tickets may not have it)
  if (!ticket.qr_token) {
    throw new Error("QR token not available for this ticket (legacy ticket)");
  }

  return {
    ticketCode: ticket.ticket_code,
    qrToken: ticket.qr_token, // Now safely typed as string (null check above)
    qrImageUrl: ticket.qr_image_url,
    createdAt: ticket.issued_at,
    expiresAt: ticket.expires_at,
    status: ticket.status,
    emailStatus: ticket.email_status,
  };
}

/**
 * Get email delivery history for a ticket
 */
export async function getTicketEmailHistory(ticketId: string) {
  // FIX: Validate ticket ID format
  if (!isValidUUID(ticketId)) {
    throw new Error("Invalid ticket ID format");
  }

  const ticketResult = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  if (!ticketResult.length) throw new Error("Ticket not found");

  const ticket = ticketResult[0];

  // FIX: Clarify attempts logic - this is simplified since we don't track multiple attempts yet
  const attempts = ticket.email_status === "sent" || ticket.email_status === "failed" ? 1 : 0;

  return {
    ticketCode: ticket.ticket_code,
    emailStatus: ticket.email_status,
    sentAt: ticket.emailed_at,
    lastError: ticket.email_error,
    attempts,
  };
}

/**
 * Admin approval endpoint: Approve and send pending ticket confirmation email
 * FIX: Safety-first design - requires explicit admin action to send emails
 *
 * Validates:
 * - Ticket exists and is in pending_approval state
 * - User and event data is valid
 * - Email service is available
 * - Updates email_status to "sent" only after successful delivery
 * - Logs audit trail of approval
 */
export async function approveAndSendTicketEmail(ticketId: string, adminUserId: number): Promise<{ success: boolean; message: string; emailStatus?: string; error?: string }> {
  // FIX: Validate all input parameters
  if (!isValidUUID(ticketId)) {
    throw new Error("Invalid ticket ID format");
  }
  if (!Number.isInteger(adminUserId) || adminUserId <= 0) {
    throw new Error("Invalid admin user ID");
  }

  // FIX: Fetch ticket and validate it exists
  const ticketResult = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  if (!ticketResult.length) {
    throw new Error("Ticket not found");
  }

  const ticket = ticketResult[0];

  // FIX: Safety check - only approve if in pending_approval state
  if (ticket.email_status !== "pending_approval") {
    return {
      success: false,
      message: `Ticket email is not pending approval (current status: ${ticket.email_status})`,
      emailStatus: ticket.email_status,
    };
  }

  // FIX: Fetch user and event data with validation
  const userResult = await db.select().from(users).where(eq(users.id, ticket.user_id)).limit(1);
  if (!userResult.length) {
    throw new Error("User not found for ticket");
  }
  const user = userResult[0];

  const eventResult = await db.select().from(events).where(eq(events.id, ticket.event_id)).limit(1);
  if (!eventResult.length) {
    throw new Error("Event not found for ticket");
  }
  const event = eventResult[0];

  try {
    // Initialize Resend client
    const resend = await initializeResendClient();
    if (!resend) {
      throw new Error("Email service not configured");
    }

    // Prepare email data
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const nurseName = `${user.first_name} ${user.last_name}`;

    // Build HTML email
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
      <p>Hi ${nurseName},</p>

      <p>Thank you for purchasing your ticket to the Nursing Rocks! Concert Series! We're excited to see you at the event.</p>

      <div class="event-details">
        <h3>${event.title}</h3>
        <p><span class="label">Date:</span> ${formattedDate}</p>
        <p><span class="label">Time:</span> ${event.start_time || 'TBD'}</p>
        <p><span class="label">Location:</span> ${event.location}</p>
        <p><span class="label">Ticket Type:</span> ${ticket.ticket_type || 'General Admission'}</p>
        <p><span class="label">Price:</span> ${ticket.price || 'Free'}</p>
      </div>

      <div class="ticket-code">
        ${ticket.ticket_code}
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

    // FIX: Send email via Resend
    const emailResult = await resend.emails.send({
      from: SENDER_EMAIL,
      to: user.email,
      subject: `Your Nursing Rocks! Ticket for ${event.title}`,
      html: emailHtml,
    });

    if (!emailResult || emailResult.error) {
      throw new Error(`Failed to send email: ${emailResult?.error?.message || 'Unknown error'}`);
    }

    // FIX: Update ticket status to "sent" after successful delivery
    const now = new Date();
    await db
      .update(tickets)
      .set({
        email_status: "sent",
        emailed_at: now,
        updated_at: now,
      })
      .where(eq(tickets.id, ticketId));

    console.log(`✅ Ticket email approved and sent for ticket ${ticketId} by admin ${adminUserId}`);

    return {
      success: true,
      message: `Ticket confirmation email sent to ${user.email}`,
      emailStatus: "sent",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`❌ Failed to send ticket email for ticket ${ticketId}:`, errorMessage);

    // FIX: Mark email as failed in database
    await db
      .update(tickets)
      .set({
        email_status: "failed",
        email_error: errorMessage,
        updated_at: new Date(),
      })
      .where(eq(tickets.id, ticketId));

    throw new Error(errorMessage);
  }
}
