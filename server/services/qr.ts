import jwt from "jsonwebtoken";
import QRCode from "qrcode";

export interface QRPayload {
  ticketId: string;
  userId: number;
  eventId: number;
  ticketCode: string;
  type: "event_ticket";
}

function normalizeSecretList(value: string | undefined): string[] {
  return (value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// CRITICAL: QR token secret - MUST be set in production.
// Primary secret signs all new tickets. Previous secrets are verify-only for
// preserving already-issued tickets during a planned rotation.
const QR_PRIMARY_SECRET = (() => {
  if (!process.env.QR_TOKEN_SECRET) {
    const isDev = process.env.NODE_ENV !== "production";
    if (isDev) {
      console.warn("⚠️ [QR] QR_TOKEN_SECRET not set - using development default. NEVER use in production.");
      return "dev-secret-key-change-in-production";
    }
    throw new Error(
      "CRITICAL: QR_TOKEN_SECRET environment variable is not set. " +
      "QR codes cannot be generated or verified securely. " +
      "Set QR_TOKEN_SECRET to a strong random string (min 32 chars)."
    );
  }
  if (process.env.QR_TOKEN_SECRET.length < 32 && process.env.NODE_ENV === "production") {
    throw new Error("QR_TOKEN_SECRET must be at least 32 characters long in production");
  }
  return process.env.QR_TOKEN_SECRET;
})();

const QR_PREVIOUS_SECRETS = (() => {
  const previousSecrets = normalizeSecretList(process.env.QR_TOKEN_SECRET_PREVIOUS);
  if (process.env.NODE_ENV === "production") {
    for (const secret of previousSecrets) {
      if (secret.length < 32) {
        console.warn(
          "⚠️ [QR] QR_TOKEN_SECRET_PREVIOUS contains a short legacy secret. " +
            "Use it only long enough to support already-issued tickets, then remove it."
        );
      }
    }
  }
  return previousSecrets;
})();

const QR_VERIFY_SECRETS = [QR_PRIMARY_SECRET, ...QR_PREVIOUS_SECRETS];

/**
 * Sign a QR payload into a JWT token
 * This token is embedded in the QR code and verified at scan time
 */
export function signQrPayload(payload: QRPayload, expiresAt: Date): string {
  const exp = Math.floor(expiresAt.getTime() / 1000);

  return jwt.sign(payload, QR_PRIMARY_SECRET, {
    algorithm: "HS256",
    expiresIn: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
  });
}

/**
 * Verify and decode a QR token
 * Throws if token is invalid, expired, or tampered with
 */
export function verifyQrToken(token: string): QRPayload {
  let lastError: unknown = null;

  for (const secret of QR_VERIFY_SECRETS) {
    try {
      const decoded = jwt.verify(token, secret, {
        algorithms: ["HS256"],
      }) as QRPayload;

      if (decoded.type !== "event_ticket") {
        throw new Error("Invalid token type");
      }

      return decoded;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`Invalid QR token: ${lastError instanceof Error ? lastError.message : "Unknown error"}`);
}

/**
 * Generate a human-readable ticket code
 * Format: NR-YYYY-XXX (e.g., NR-2026-7K4M9Q)
 * FIX: Uses crypto.randomBytes() instead of Math.random() for secure random generation
 */
export function generateTicketCode(eventId: number, year: number = new Date().getFullYear()): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let random = "";
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(bytes[i] % chars.length);
  }
  return `NR-${year}-${random}`;
}

/**
 * Render a QR code as a data URL (SVG)
 * Can be embedded directly in HTML or sent as image
 */
export async function renderQrCode(qrToken: string): Promise<string> {
  try {
    // Generate QR code as data URL (PNG format)
    const qrDataUrl = await QRCode.toDataURL(qrToken, {
      errorCorrectionLevel: "H" as const,
      width: 300,
      margin: 1,
    });
    return qrDataUrl;
  } catch (error) {
    console.error("QR code generation failed:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Generate and store QR code image on external service
 * Returns a URL that can be used to display or download the QR
 */
export async function generateAndStoreQrImage(qrToken: string, ticketId: string): Promise<string> {
  try {
    const qrDataUrl = await renderQrCode(qrToken);

    // For now, return the data URL directly
    // In production, you might want to store this on Cloudinary or similar
    // and return a CDN URL instead for better performance
    return qrDataUrl;
  } catch (error) {
    console.error("Failed to store QR image:", error);
    throw error;
  }
}
