import { db } from "../db";
import { users, tickets, events } from "@shared/schema";
import { eq } from "drizzle-orm";
import { ensureTicketQrToken } from "./tickets";

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

/** Subject line for nurse verification / free ticket issuance emails (Resend or dev log). */
export const TICKET_ISSUED_EMAIL_SUBJECT = "Thank You from Nursing Rocks! 🎸";

/** Subject when an admin verifies a nurse — links to site; ticket QR is sent separately when they claim. */
export const NURSE_VERIFIED_WELCOME_SUBJECT = "You're verified — welcome to Nursing Rocks! 🎸";

function getPublicSiteBaseUrl(): string {
  const appUrl = process.env.APP_URL?.trim();
  if (process.env.NODE_ENV === "production" && !appUrl) {
    throw new Error("[Email] APP_URL is required in production for verification welcome email links. Set it in your environment variables.");
  }
  return (appUrl || "http://localhost:5000").replace(/\/+$/, "");
}

export type TicketIssuedEmailDeliveryMode = "resend" | "dev_log";

/** Public metadata for admin UI — what the verification ticket email is and how it is dispatched. */
export function getTicketIssuedEmailDispatchInfo() {
  const hasResend = !!process.env.RESEND_API_KEY;
  return {
    templateName: "Verified nurse — free event ticket",
    subject: TICKET_ISSUED_EMAIL_SUBJECT,
    fromAddress: SENDER_EMAIL,
    supportEmail: SUPPORT_EMAIL,
    dispatchMode: hasResend ? ("resend" as const) : ("dev_log" as const),
    dispatchExplanation: hasResend
      ? "With RESEND_API_KEY set, each ticket email is sent to the user’s registered address via Resend."
      : "Without RESEND_API_KEY, the app only prints email content to the server log — nothing is delivered to the user’s inbox.",
    welcomeEmailSubject: NURSE_VERIFIED_WELCOME_SUBJECT,
    welcomeEmailExplanation:
      "Sent when an admin verifies a nurse. Includes a sign-in link to the dashboard — the QR ticket email is sent when they click Get your ticket(s).",
  };
}

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
  let ticket = ticketResult[0];

  const emailSubject = TICKET_ISSUED_EMAIL_SUBJECT;

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
        replyTo: "NursingRocksConcerts@gmail.com",
      });

      // FIX: Don't log user email addresses in production
      const isDev = process.env.NODE_ENV !== "production";
      if (isDev) {
        console.log(`[EMAIL] Sent ticket ${ticket.ticket_code}`);
      }
      return { success: true as const, deliveryMode: "resend" as const, emailId: result.id };
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

    return { success: true as const, deliveryMode: "dev_log" as const };
  }
}

/** DB `email_status` for successful verification sends: real delivery vs server log only. */
export function ticketIssuedEmailStatusFromDelivery(
  mode: TicketIssuedEmailDeliveryMode
): "sent" | "simulated" {
  return mode === "resend" ? "sent" : "simulated";
}

/**
 * Build thank-you email for nurses who attended/registered for a Nursing Rocks event.
 * Replaces the original ticket-issuance email as of May 2026 (post-inaugural event).
 */
function buildTicketEmailHtml(_data: {
  userName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  ticketCode: string;
  qrImageUrl: string;
}): string {
  return buildThankYouEmailHtml();
}

function buildThankYouEmailHtml(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
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
        <img src="https://www.nursingrocksconcerts.com/assets/logos/NursingRocks_NewLogo.png" alt="Nursing Rocks" style="height: 80px; margin-bottom: 16px;" />
        <h1>Nursing Rocks!</h1>
        <p>Concert Series</p>
      </div>
      <div class="content">
        <p>For those of you who joined us at your inaugural Nursing Rocks! Concert Series event, Thank you! Your involvement is what made the night special!</p>
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

function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

/**
 * Welcome email after admin verifies a nurse: link to sign in → dashboard → "Get your ticket(s)".
 * Does not include QR; ticket issuance email is sent when the user claims from the dashboard.
 */
export async function sendNurseVerifiedWelcomeEmail(userId: number): Promise<{
  deliveryMode: TicketIssuedEmailDeliveryMode;
}> {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Invalid user ID");
  }

  const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!userResult.length) throw new Error("User not found");
  const user = userResult[0];
  if (!user.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    throw new Error("User has invalid email address");
  }

  const subject = "Thank You from Nursing Rocks! 🎸";
  const html = buildThankYouEmailHtml();

  const client = await initializeResendClient();
  if (client && process.env.RESEND_API_KEY) {
    try {
      const result = await client.emails.send({
        from: SENDER_EMAIL,
        to: user.email,
        subject: sanitizeHeader(subject),
        html,
        replyTo: "NursingRocksConcerts@gmail.com",
      });
      console.log(`[Email] ✅ Nurse welcome email sent successfully - ID: ${result.id}`);
      return { deliveryMode: "resend" };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(
        `[Email] ❌ Welcome email failed for user ${userId} (${user.email}): ${errorMsg}`
      );
      throw new Error(`Email service error: ${errorMsg}`);
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`[EMAIL - DEV LOG ONLY] Welcome email for user ${userId}`);
  console.log(`To: ${user.email}`);
  console.log(`Subject: ${subject}`);
  console.log(`Note: RESEND_API_KEY not configured - email NOT sent to Resend, only logged here`);
  console.log(`${"=".repeat(60)}\n`);
  return { deliveryMode: "dev_log" };
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

  let ticket = ticketResult[0];

  // FIX: Validate ticket is in a state where it can be resent
  if (ticket.status === "revoked") {
    throw new Error("Cannot resend email for revoked ticket");
  }
  if (ticket.status === "expired") {
    throw new Error("Cannot resend email for expired ticket");
  }
  await ensureTicketQrToken(ticket);

  try {
    const sendResult = await sendTicketIssuedEmail(ticket.user_id, ticket.event_id, ticketId);
    const status = ticketIssuedEmailStatusFromDelivery(sendResult.deliveryMode);

    await db
      .update(tickets)
      .set({
        email_status: status,
        emailed_at: new Date(),
        email_error: "",
        updated_at: new Date(),
      })
      .where(eq(tickets.id, ticketId));

    return {
      success: true,
      message:
        status === "sent"
          ? "Ticket email resent successfully"
          : "Ticket email content logged on server only (Resend not configured) — not delivered to inbox",
    };
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

  const ticket = await ensureTicketQrToken(ticketResult[0]);

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

  let ticket = ticketResult[0];

  // FIX: Safety check - only approve if in pending_approval state
  if (ticket.email_status !== "pending_approval") {
    return {
      success: false,
      message: `Ticket email is not pending approval (current status: ${ticket.email_status})`,
      emailStatus: ticket.email_status ?? undefined,
    };
  }
  ticket = await ensureTicketQrToken(ticket);

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
    const emailHtml = buildThankYouEmailHtml();

    // FIX: Send email via Resend
    const emailResult = await resend.emails.send({
      from: SENDER_EMAIL,
      to: user.email,
      subject: sanitizeHeader("Thank You from Nursing Rocks! 🎸"),
      html: emailHtml,
      replyTo: "NursingRocksConcerts@gmail.com",
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
