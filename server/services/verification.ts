import { db } from "../db";
import { users, tickets, verificationAuditLogs } from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  getEligibleEventsForUser,
  issueTicketForEvent,
  revokeTicket,
  getActiveFutureTicketsForUser,
} from "./tickets";
import { sendTicketIssuedEmail, sendNurseVerifiedWelcomeEmail, ticketIssuedEmailStatusFromDelivery } from "./email";

/**
 * Verified nurses: create free tickets for eligible published events and send issuance emails.
 * Intended to run when the user clicks "Get your ticket(s)" on the dashboard (not on admin verify).
 */
export async function claimVerifiedUserTickets(userId: number) {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Invalid user ID");
  }

  const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!userResult.length) {
    throw new Error("User not found");
  }
  if (!userResult[0].is_verified) {
    const err = new Error("Account must be verified by Nursing Rocks before claiming free tickets.");
    (err as { code?: string }).code = "VERIFICATION_REQUIRED";
    throw err;
  }

  const now = new Date();
  let eligibleEvents;
  try {
    eligibleEvents = await getEligibleEventsForUser(userId);
  } catch (eventError) {
    console.error(`Failed to get eligible events for user ${userId}:`, eventError);
    throw new Error(
      `Failed to get eligible events: ${eventError instanceof Error ? eventError.message : "Unknown error"}`
    );
  }

  const ticketResults = {
    created: 0,
    skippedExisting: 0,
    failed: 0,
    emailFailed: 0,
    emailsDelivered: 0,
    emailsSimulated: 0,
  };

  for (const event of eligibleEvents) {
    try {
      const { ticket, newlyIssued } = await issueTicketForEvent(userId, event.id, {
        end_at: event.end_at,
        ticket_expiration_at: event.ticket_expiration_at,
      });

      if (newlyIssued) {
        ticketResults.created++;
      } else {
        ticketResults.skippedExisting++;
        continue;
      }

      try {
        const sendResult = await sendTicketIssuedEmail(userId, event.id, ticket.id);
        const emailStatus = ticketIssuedEmailStatusFromDelivery(sendResult.deliveryMode);
        if (sendResult.deliveryMode === "resend") {
          ticketResults.emailsDelivered++;
        } else {
          ticketResults.emailsSimulated++;
        }

        await db
          .update(tickets)
          .set({
            email_status: emailStatus,
            emailed_at: now,
            updated_at: now,
          })
          .where(eq(tickets.id, ticket.id));
      } catch (emailError) {
        console.error(`Failed to send email for ticket ${ticket.id}:`, emailError);
        ticketResults.emailFailed++;

        await db
          .update(tickets)
          .set({
            email_status: "failed",
            email_error: emailError instanceof Error ? emailError.message : "Unknown error",
            updated_at: now,
          })
          .where(eq(tickets.id, ticket.id));
      }
    } catch (ticketError) {
      console.error(`Failed to issue ticket for event ${event.id}:`, ticketError);
      ticketResults.failed++;
    }
  }

  return {
    success: true,
    message:
      eligibleEvents.length === 0
        ? "No published upcoming events are open for free tickets right now."
        : "Tickets processed.",
    details: {
      eligibleEventCount: eligibleEvents.length,
      ticketsCreated: ticketResults.created,
      ticketsSkippedExisting: ticketResults.skippedExisting,
      ticketsFailed: ticketResults.failed,
      emailsFailed: ticketResults.emailFailed,
      emailsDelivered: ticketResults.emailsDelivered,
      emailsSimulated: ticketResults.emailsSimulated,
      hasErrors: ticketResults.failed > 0 || ticketResults.emailFailed > 0,
    },
  };
}

/**
 * Verify a user (admin action)
 * Updates verification status only. Free tickets + emails are claimed by the user from their dashboard.
 */
export async function verifyUser(userId: number, adminUserId: number) {
  // FIX: Validate input parameters
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Invalid user ID - must be positive integer");
  }
  if (!Number.isInteger(adminUserId) || adminUserId <= 0) {
    throw new Error("Invalid admin user ID - must be positive integer");
  }

  // FIX: Verify admin user actually exists and is admin
  const adminResult = await db.select().from(users).where(eq(users.id, adminUserId)).limit(1);
  if (!adminResult.length) {
    throw new Error("Admin user not found");
  }
  if (!adminResult[0].is_admin) {
    throw new Error("User is not an admin");
  }

  // Check if user exists
  const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!userResult.length) {
    throw new Error("User not found");
  }

  const user = userResult[0];
  const wasVerified = !!user.is_verified;

  // FIX: Return detail on whether action was taken
  if (wasVerified) {
    return { success: true, action: "already_verified", message: "User was already verified" };
  }

  // Only perform actions on false -> true transition
  if (!wasVerified) {
    const now = new Date();

    try {
      // Update user verification status
      await db
        .update(users)
        .set({
          is_verified: true,
          status: "verified",
          verified_at: now,
          verification_source: "admin",
        })
        .where(eq(users.id, userId));

      // Create audit log entry
      await db.insert(verificationAuditLogs).values({
        user_id: userId,
        admin_user_id: adminUserId,
        action: "admin_verify",
        previous_verified_state: false,
        new_verified_state: true,
      });
    } catch (dbError) {
      console.error(`Failed to update user verification status:`, dbError);
      throw new Error(`Failed to verify user: ${dbError instanceof Error ? dbError.message : "Unknown error"}`);
    }

    let welcomeEmailMode: "resend" | "dev_log" | null = null;
    let welcomeEmailError: string | undefined;
    try {
      const w = await sendNurseVerifiedWelcomeEmail(userId);
      welcomeEmailMode = w.deliveryMode;
    } catch (welcomeErr) {
      console.error(`[verification] Welcome email failed for user ${userId}:`, welcomeErr);
      welcomeEmailError = welcomeErr instanceof Error ? welcomeErr.message : String(welcomeErr);
    }

    return {
      success: true,
      action: "verified",
      message:
        welcomeEmailError == null
          ? "User verified — a welcome email with a dashboard link was sent. They can sign in and use Get your ticket(s) to receive QR ticket emails."
          : "User verified in the database, but the welcome email failed to send. They can still sign in and use Get your ticket(s) on the dashboard.",
      details: {
        ticketsCreated: 0,
        ticketsSkippedExisting: 0,
        ticketsFailed: 0,
        emailsFailed: 0,
        emailsDelivered: 0,
        emailsSimulated: 0,
        hasErrors: !!welcomeEmailError,
        claimOnDashboard: true,
        welcomeEmailMode,
        welcomeEmailError,
      },
    };
  }

  return { success: true, action: "skipped" };
}

/**
 * Unverify a user (admin action)
 * This triggers:
 * 1. User status update
 * 2. Revocation of active future tickets
 * 3. Preservation of checked-in tickets (audit trail)
 * 4. Audit log entry
 */
export async function unverifyUser(userId: number, adminUserId: number) {
  // FIX: Validate input parameters
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Invalid user ID - must be positive integer");
  }
  if (!Number.isInteger(adminUserId) || adminUserId <= 0) {
    throw new Error("Invalid admin user ID - must be positive integer");
  }

  // FIX: Verify admin user actually exists and is admin
  const adminResult = await db.select().from(users).where(eq(users.id, adminUserId)).limit(1);
  if (!adminResult.length) {
    throw new Error("Admin user not found");
  }
  if (!adminResult[0].is_admin) {
    throw new Error("User is not an admin");
  }

  // Check if user exists
  const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!userResult.length) {
    throw new Error("User not found");
  }

  const user = userResult[0];
  // FIX: Capture previous state BEFORE any changes for accurate audit log
  const wasVerified = !!user.is_verified;

  // FIX: Return detail on whether action was taken
  if (!wasVerified) {
    return { success: true, action: "already_unverified", message: "User was already unverified" };
  }

  try {
    // Update user status
    await db
      .update(users)
      .set({
        is_verified: false,
        status: "unverified",
      })
      .where(eq(users.id, userId));

    // Create audit log entry - record ACTUAL previous state (was verified)
    await db.insert(verificationAuditLogs).values({
      user_id: userId,
      admin_user_id: adminUserId,
      action: "admin_unverify",
      previous_verified_state: wasVerified, // Now accurately true since we checked above
      new_verified_state: false,
    });
  } catch (dbError) {
    console.error(`Failed to update user unverification status:`, dbError);
    throw new Error(`Failed to unverify user: ${dbError instanceof Error ? dbError.message : "Unknown error"}`);
  }

  // Revoke active future tickets (but keep checked-in ones for audit)
  let activeFutureTickets;
  try {
    activeFutureTickets = await getActiveFutureTicketsForUser(userId);
  } catch (error) {
    console.error(`Failed to get active tickets for user ${userId}:`, error);
    throw new Error(`Failed to get active tickets: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  // FIX: Track revocation results
  let revokedCount = 0;
  for (const ticket of activeFutureTickets) {
    try {
      // Pass adminUserId for audit logging
      await revokeTicket(ticket.id, "User unverified by admin", adminUserId);
      revokedCount++;
    } catch (revokeError) {
      console.error(`Failed to revoke ticket ${ticket.id}:`, revokeError);
      // Continue revoking other tickets
    }
  }

  // FIX: Return detailed results
  return {
    success: true,
    action: "unverified",
    message: "User unverified successfully",
    details: {
      ticketsRevoked: revokedCount,
      ticketsNotRevoked: activeFutureTickets.length - revokedCount,
    },
  };
}

/**
 * Get user verification status and ticket summary
 */
export async function getUserVerificationStatus(userId: number) {
  const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!userResult.length) {
    throw new Error("User not found");
  }

  const user = userResult[0];

  let eligible;
  let userTickets;
  try {
    [eligible, userTickets] = await Promise.all([
      getEligibleEventsForUser(userId),
      db.select().from(tickets).where(eq(tickets.user_id, userId)),
    ]);
  } catch (error) {
    console.error(`Failed to fetch user data:`, error);
    throw new Error(`Failed to get verification status: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  return {
    user,
    isVerified: user.is_verified,
    status: user.status,
    verifiedAt: user.verified_at,
    verificationSource: user.verification_source,
    eligibleEventCount: eligible.length,
    activeTicketCount: userTickets.filter((t: typeof userTickets[number]) => t.status === "issued").length,
    checkedInCount: userTickets.filter((t: typeof userTickets[number]) => t.status === "checked_in").length,
    revokedCount: userTickets.filter((t: typeof userTickets[number]) => t.status === "revoked").length,
  };
}
