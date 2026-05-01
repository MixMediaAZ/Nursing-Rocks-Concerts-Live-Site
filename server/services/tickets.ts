import { db } from "../db";
import { tickets, events, users, verificationAuditLogs } from "@shared/schema";
import { eq, and, or, isNull, gte, lt, not, desc } from "drizzle-orm";
import { signQrPayload, generateTicketCode, generateAndStoreQrImage } from "./qr";

/**
 * Validate UUID format
 */
function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Get eligible events for a user
 * Eligible events: published, with end_at >= now()
 * FIX: Requires end_at to be set (not null) since issueTicketForEvent needs it
 */
export async function getEligibleEventsForUser(userId: number) {
  const now = new Date();

  const eligible = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.status, "published"),
        // FIX: end_at must be set (not null) for ticket expiration calculation
        // Events without end_at cannot be used for ticketing
        not(isNull(events.end_at)),
        gte(events.end_at, now)
      )
    );

  return eligible;
}

export type IssueTicketForEventResult = {
  ticket: typeof tickets.$inferSelect;
  /** False when an existing row was returned (no new insert) — callers must not send duplicate issuance emails. */
  newlyIssued: boolean;
};

/**
 * Issue a ticket for a specific event
 * Idempotent: returns existing issued/checked-in ticket if one already exists (`newlyIssued: false`)
 * FIX: Uses database UNIQUE constraint to prevent race conditions
 * FIX: Accepts optional event data to prevent N+1 queries when called in a loop
 */
export async function issueTicketForEvent(
  userId: number,
  eventId: number,
  eventData?: { end_at: Date | null; ticket_expiration_at: Date | null } | null
): Promise<IssueTicketForEventResult> {
  // Check if ticket already exists
  const existing = await db
    .select()
    .from(tickets)
    .where(and(eq(tickets.user_id, userId), eq(tickets.event_id, eventId)))
    .limit(1);

  if (existing.length > 0) {
    const ticket = existing[0];

    // If issued or checked-in, return existing (FIX: standardized to "issued" from schema default)
    if (ticket.status === "issued" || ticket.status === "checked_in") {
      return { ticket, newlyIssued: false };
    }

    // If revoked or expired, don't auto-reissue (controlled policy)
    if (ticket.status === "revoked" || ticket.status === "expired") {
      return { ticket, newlyIssued: false };
    }
  }

  // Get event details - FIX: Use passed eventData if available (prevents N+1 queries)
  let event;
  if (eventData) {
    // Event data passed in (from parent loop), use directly
    event = eventData;
  } else {
    // Event data not provided, fetch from database
    const eventResult = await db.select().from(events).where(eq(events.id, eventId)).limit(1);

    if (!eventResult.length) {
      throw new Error(`Event ${eventId} not found`);
    }

    event = eventResult[0];
  }

  // Validate event has required data
  if (!event.end_at) {
    throw new Error(`Event ${eventId} must have an end_at date set to issue tickets`);
  }

  const ticketId = crypto.randomUUID();
  const ticketCode = generateTicketCode(eventId);
  // FIX: Use 'event' variable (which is validated above), not 'eventData' parameter
  // Calculate expiration as either ticket_expiration_at or 7 days after event end
  const baseDate = event.ticket_expiration_at || new Date((event.end_at as Date).getTime() + 7 * 24 * 60 * 60 * 1000);
  const expiresAt = baseDate;

  // Build and sign QR payload
  const qrPayload = {
    ticketId,
    userId,
    eventId,
    ticketCode,
    type: "event_ticket" as const,
  };

  const qrToken = signQrPayload(qrPayload, expiresAt);

  // Create ticket record
  // FIX: Database handles race conditions via UNIQUE(user_id, event_id) constraint
  let newTicket;
  try {
    newTicket = (await db
      .insert(tickets)
      .values({
        id: ticketId,
        user_id: userId,
        event_id: eventId,
        ticket_code: ticketCode,
        qr_token: qrToken,
        status: "issued", // FIX: standardized to match schema default
        expires_at: expiresAt,
        email_status: "pending",
      })
      .returning()) as Array<typeof tickets.$inferSelect>;
  } catch (error) {
    // Race condition: concurrent request created ticket between our check and insert
    // Re-fetch and return the existing ticket
    // FIX: Check for UNIQUE constraint error more robustly
    const isUniqueViolation =
      (error instanceof Error && error.message.includes("unique")) ||
      (error as any).code === "23505"; // PostgreSQL unique violation error code

    if (isUniqueViolation) {
      console.log(`[Tickets] Race condition detected for user ${userId} event ${eventId} - returning existing ticket`);
      const existingAgain = await db
        .select()
        .from(tickets)
        .where(and(eq(tickets.user_id, userId), eq(tickets.event_id, eventId)))
        .limit(1);
      if (existingAgain.length > 0) {
        return { ticket: existingAgain[0], newlyIssued: false };
      }
    }
    throw error;
  }

  if (!newTicket.length) {
    throw new Error("Failed to create ticket");
  }

  const ticket = newTicket[0];

  // Generate and store QR image
  try {
    const qrImageUrl = await generateAndStoreQrImage(qrToken, ticketId);
    await db
      .update(tickets)
      .set({ qr_image_url: qrImageUrl, updated_at: new Date() })
      .where(eq(tickets.id, ticketId));

    ticket.qr_image_url = qrImageUrl;
  } catch (error) {
    // FIX: Log QR generation errors instead of silently failing
    console.error(
      `[Tickets] Failed to generate QR image for ticket ${ticketId} (${ticket.ticket_code}):`,
      error instanceof Error ? error.message : String(error)
    );
    // Continue without QR image - tickets can still be used with ticket code
  }

  return { ticket, newlyIssued: true };
}

/**
 * Revoke a ticket
 * FIX: Now accepts optional adminUserId to create audit log
 */
export async function revokeTicket(
  ticketId: string,
  reason: string,
  adminUserId?: number | null
) {
  // FIX: Validate ticketId format
  if (!isValidUUID(ticketId)) {
    throw new Error("Invalid ticket ID format");
  }

  const now = new Date();

  // FIX: Create audit log for ticket revocation
  if (adminUserId && adminUserId > 0) {
    // Get ticket details for audit log
    const ticketResult = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (ticketResult.length > 0) {
      const ticket = ticketResult[0];
      try {
        await db.insert(verificationAuditLogs).values({
          user_id: ticket.user_id,
          admin_user_id: adminUserId,
          action: "ticket_revoked",
          notes: `Ticket ${ticket.ticket_code} revoked: ${reason}`,
        });
      } catch (logError) {
        console.error(`Failed to create audit log for ticket revocation ${ticketId}:`, logError);
        // Continue with revocation even if audit log fails
      }
    }
  }

  return await db
    .update(tickets)
    .set({
      status: "revoked",
      revoked_at: now,
      revoke_reason: reason,
      updated_at: now,
    })
    .where(eq(tickets.id, ticketId))
    .returning();
}

/**
 * Mark a ticket as expired
 */
export async function markTicketExpired(ticketId: string) {
  return await db
    .update(tickets)
    .set({
      status: "expired",
      updated_at: new Date(),
    })
    .where(eq(tickets.id, ticketId))
    .returning();
}

/**
 * Get all active tickets for a user that are eligible for an event
 */
export async function getUserTicketsForEvent(userId: number, eventId: number) {
  return await db
    .select()
    .from(tickets)
    .where(and(eq(tickets.user_id, userId), eq(tickets.event_id, eventId)))
    .limit(1);
}

/**
 * Get all tickets for a user (active and past)
 */
export async function getUserTickets(userId: number) {
  return await db.select().from(tickets).where(eq(tickets.user_id, userId));
}

/** Admin list: tickets with event title for verification / email status UI */
export async function getUserTicketsWithEvents(userId: number) {
  return await db
    .select({
      id: tickets.id,
      event_id: tickets.event_id,
      ticket_code: tickets.ticket_code,
      status: tickets.status,
      checked_in_at: tickets.checked_in_at,
      email_status: tickets.email_status,
      email_error: tickets.email_error,
      emailed_at: tickets.emailed_at,
      created_at: tickets.created_at,
      event_title: events.title,
      event_date: events.date,
    })
    .from(tickets)
    .innerJoin(events, eq(tickets.event_id, events.id))
    .where(eq(tickets.user_id, userId))
    .orderBy(desc(tickets.created_at));
}

/**
 * Expire all tickets past their expiration date
 * Run this hourly or daily as a scheduled job
 * FIX: Updated to use "issued" status instead of "active"
 */
export async function expireTicketsForPastEvents() {
  const now = new Date();

  return await db
    .update(tickets)
    .set({
      status: "expired",
      updated_at: now,
    })
    .where(
      and(
        eq(tickets.status, "issued"), // FIX: standardized to match schema default
        lt(tickets.expires_at, now)
      )
    );
}

/**
 * Get active future tickets for a user that should be revoked
 */
export async function getActiveFutureTicketsForUser(userId: number) {
  const now = new Date();

  return await db
    .select()
    .from(tickets)
    .where(
      and(
        eq(tickets.user_id, userId),
        eq(tickets.status, "issued"),
        isNull(tickets.checked_in_at),
        gte(tickets.expires_at, now)
      )
    );
}
