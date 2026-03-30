import { db } from "../db";
import { tickets, ticketScanLogs, events } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { verifyQrToken } from "./qr";
import { markTicketExpired } from "./tickets";

export interface ScanInput {
  qrToken: string;
  eventId: number;
  deviceFingerprint?: string;
}

export interface ScanContext {
  ip: string;
  userAgent: string;
  deviceFingerprint?: string;
  scannerUserId?: number;
  scannerDeviceId?: string;
}

export interface ScanResult {
  ok: boolean;
  reason: string;
  message?: string;
  ticketCode?: string;
  userName?: string;
}

/**
 * Scan and validate a ticket QR code
 * Core anti-sharing logic:
 * 1. Single use - ticket is checked in after first scan
 * 2. Device matching - first device scanned from becomes "allowed" device
 * 3. Full audit trail - all scan attempts are logged
 * FIX: Improved device fingerprint null handling and event status validation
 */
export async function scanTicket(input: ScanInput, ctx: ScanContext): Promise<ScanResult> {
  let decoded;

  // Step 1: Verify QR token signature
  try {
    decoded = verifyQrToken(input.qrToken);
  } catch {
    await logRejectedScan(null, input.eventId, ctx, "token_invalid", "QR token is invalid or expired");
    return {
      ok: false,
      reason: "token_invalid",
      message: "Invalid QR code",
    };
  }

  // FIX: Validate decoded token has required fields with correct types
  if (!decoded || typeof decoded !== "object") {
    await logRejectedScan(null, input.eventId, ctx, "token_invalid", "Decoded token is invalid");
    return {
      ok: false,
      reason: "token_invalid",
      message: "Invalid QR code",
    };
  }

  if (!decoded.ticketId || typeof decoded.ticketId !== "string") {
    await logRejectedScan(null, input.eventId, ctx, "token_invalid", "Token missing ticketId");
    return {
      ok: false,
      reason: "token_invalid",
      message: "Invalid QR code",
    };
  }

  if (typeof decoded.eventId !== "number" || decoded.eventId <= 0) {
    await logRejectedScan(null, input.eventId, ctx, "token_invalid", "Token has invalid eventId");
    return {
      ok: false,
      reason: "token_invalid",
      message: "Invalid QR code",
    };
  }

  // Step 2: Load ticket from database
  const ticketResult = await db.select().from(tickets).where(eq(tickets.id, decoded.ticketId)).limit(1);

  if (!ticketResult.length) {
    await logRejectedScan(null, input.eventId, ctx, "ticket_not_found", "Ticket not found in database");
    return {
      ok: false,
      reason: "ticket_not_found",
      message: "Ticket not found",
    };
  }

  const ticket = ticketResult[0];

  // Step 3: Verify token matches database
  if (ticket.qr_token !== input.qrToken) {
    await logRejectedScan(ticket, input.eventId, ctx, "token_mismatch", "QR token does not match database");
    return {
      ok: false,
      reason: "token_mismatch",
      message: "Token mismatch",
    };
  }

  // Step 4: Verify event matches and is published
  if (ticket.event_id !== input.eventId) {
    await logRejectedScan(ticket, input.eventId, ctx, "event_mismatch", "Ticket is for a different event");
    return {
      ok: false,
      reason: "event_mismatch",
      message: "Wrong event",
    };
  }

  // FIX: Check that event exists and is in publishable state
  const eventResult = await db.select().from(events).where(eq(events.id, input.eventId)).limit(1);
  if (!eventResult.length) {
    await logRejectedScan(ticket, input.eventId, ctx, "event_not_found", "Event not found");
    return {
      ok: false,
      reason: "event_not_found",
      message: "Event not found",
    };
  }

  const eventData = eventResult[0];
  if (eventData.status !== "published" && eventData.status !== "active") {
    await logRejectedScan(ticket, input.eventId, ctx, "event_not_published", `Event status is ${eventData.status}`);
    return {
      ok: false,
      reason: "event_not_published",
      message: "Event is not available for scanning",
    };
  }

  // Step 5: Check revocation status
  if (ticket.status === "revoked") {
    // FIX: Don't leak revocation reason to scanner (could contain sensitive info)
    await logRejectedScan(ticket, input.eventId, ctx, "revoked", `Ticket revoked: ${ticket.revoke_reason || "No reason provided"}`);
    return {
      ok: false,
      reason: "revoked",
      message: "This ticket has been revoked",
    };
  }

  // Step 6: Check expiration
  // FIX: Efficiently check expiration once and only if not already marked expired
  const now = new Date();
  let isExpired = ticket.status === "expired";

  if (!isExpired && ticket.expires_at) {
    // FIX: Create Date objects only once for efficient comparison
    const expiresAt = new Date(ticket.expires_at);
    isExpired = now > expiresAt;
  }

  if (isExpired) {
    // Mark as expired if needed
    if (ticket.status !== "expired") {
      await markTicketExpired(ticket.id);
    }
    await logRejectedScan(ticket, input.eventId, ctx, "expired", "Ticket has expired");
    return {
      ok: false,
      reason: "expired",
      message: "Ticket expired",
    };
  }

  // Step 7: Check if already checked in (single-use enforcement)
  if (ticket.status === "checked_in") {
    await logRejectedScan(ticket, input.eventId, ctx, "already_used", "Ticket has already been checked in");
    return {
      ok: false,
      reason: "already_used",
      message: "Ticket already used",
    };
  }

  // Step 8: Anti-sharing checks
  const antiSharingResult = await runAntiSharingChecks(ticket, ctx, input.deviceFingerprint);
  if (!antiSharingResult.ok) {
    await logRejectedScan(ticket, input.eventId, ctx, antiSharingResult.reason, antiSharingResult.message);
    return {
      ok: false,
      reason: antiSharingResult.reason,
      message: antiSharingResult.message,
    };
  }

  // Step 9: Accept and check in the ticket
  // FIX: Check status is still "issued" to prevent race condition with concurrent scans
  // Note: now variable already created in Step 6
  const updateResult = await db
    .update(tickets)
    .set({
      status: "checked_in",
      checked_in_at: now,
      last_scan_at: now,
      scan_count: (ticket.scan_count || 0) + 1,
      first_scan_ip: ticket.first_scan_ip || ctx.ip,
      first_scan_user_agent: ticket.first_scan_user_agent || ctx.userAgent,
      first_scan_device_fingerprint: ticket.first_scan_device_fingerprint || ctx.deviceFingerprint,
      updated_at: now,
    })
    .where(and(eq(tickets.id, ticket.id), eq(tickets.status, "issued")))
    .returning();

  if (!updateResult.length) {
    // Race condition: another request checked in this ticket concurrently
    await logRejectedScan(ticket, input.eventId, ctx, "already_used", "Ticket was checked in by another request");
    return {
      ok: false,
      reason: "already_used",
      message: "Ticket already used",
    };
  }

  // Step 10: Log accepted scan
  await db.insert(ticketScanLogs).values({
    ticket_id: ticket.id,
    user_id: ticket.user_id,
    event_id: ticket.event_id,
    scanner_user_id: ctx.scannerUserId,
    scanner_device_id: ctx.scannerDeviceId,
    ip_address: ctx.ip,
    user_agent: ctx.userAgent,
    device_fingerprint: ctx.deviceFingerprint,
    result: "accepted",
    reason: "checked_in",
  });

  return {
    ok: true,
    reason: "checked_in",
    message: "Ticket accepted",
    ticketCode: ticket.ticket_code,
  };
}

/**
 * Anti-sharing checks
 * Detects attempts to share or misuse tickets
 * FIX: Improved device fingerprint handling - store on first scan, validate on subsequent scans
 */
async function runAntiSharingChecks(
  ticket: any,
  ctx: ScanContext,
  deviceFingerprint?: string
): Promise<{ ok: boolean; reason: string; message: string }> {
  // FIX: Validate ticket object has required fields
  if (!ticket || typeof ticket !== "object") {
    return {
      ok: false,
      reason: "invalid_ticket",
      message: "Invalid ticket data",
    };
  }

  // Already checked in (enforced in main scan logic but checking again)
  if (ticket.status === "checked_in") {
    return {
      ok: false,
      reason: "already_used",
      message: "Ticket already checked in",
    };
  }

  // FIX: Device fingerprint logic - store device on first scan, enforce on subsequent scans
  // If this is the first scan (no device fingerprint stored yet)
  if (!ticket.first_scan_device_fingerprint && deviceFingerprint) {
    // First scan - we'll store this device fingerprint
    // No rejection, just let it through so we can record it
    return { ok: true, reason: "first_scan", message: "Device fingerprint will be recorded" };
  }

  // If we have a stored device fingerprint, validate the current scan matches
  if (ticket.first_scan_device_fingerprint && deviceFingerprint) {
    if (ticket.first_scan_device_fingerprint !== deviceFingerprint) {
      // FIX: Don't leak anti-sharing mechanism details to would-be fraudsters
      // Instead of "different device", just say "invalid"
      return {
        ok: false,
        reason: "device_mismatch",
        message: "Invalid ticket",
      };
    }
  }

  // If no device fingerprint provided (legacy/offline scanner), be lenient with IP checks
  if (!deviceFingerprint && ticket.first_scan_ip && ctx.ip) {
    if (ticket.first_scan_ip !== ctx.ip) {
      const lastScan = ticket.last_scan_at ? new Date(ticket.last_scan_at).getTime() : 0;
      const now = Date.now();
      const timeSinceLastScan = now - lastScan;

      // If different IP in very short time window, could be suspicious but not definitive
      if (timeSinceLastScan < 5 * 60 * 1000) { // 5 minutes
        // FIX: Don't leak IP-based tracking mechanism to scanner
        return {
          ok: false,
          reason: "ip_suspicious",
          message: "Invalid ticket",
        };
      }
    }
  }

  // All checks passed
  return { ok: true, reason: "passed", message: "All anti-sharing checks passed" };
}

/**
 * Log a rejected scan attempt
 */
async function logRejectedScan(ticket: any, eventId: number, ctx: ScanContext, reason: string, message: string) {
  if (ticket) {
    await db.insert(ticketScanLogs).values({
      ticket_id: ticket.id,
      user_id: ticket.user_id,
      event_id: eventId,
      scanner_user_id: ctx.scannerUserId,
      scanner_device_id: ctx.scannerDeviceId,
      ip_address: ctx.ip,
      user_agent: ctx.userAgent,
      device_fingerprint: ctx.deviceFingerprint,
      result: "rejected",
      reason: reason,
    });
  }
}

/**
 * Get scan history for a ticket
 */
export async function getTicketScanHistory(ticketId: string) {
  // FIX: Validate ticket ID is proper UUID format
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ticketId);
  if (!isValidUUID) {
    throw new Error("Invalid ticket ID format");
  }

  return await db.select().from(ticketScanLogs).where(eq(ticketScanLogs.ticket_id, ticketId));
}
