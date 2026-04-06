import { Request } from 'express';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { User } from '@shared/schema';

// Use environment variable or fallback for development only.
// In production, JWT_SECRET must be set to a secure random value.
const DEV_SECRET = 'dev_jwt_secret_key_nursing_rocks';
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '' || process.env.JWT_SECRET === DEV_SECRET) {
    throw new Error('JWT_SECRET must be set to a secure random value in production. Do not use the dev default.');
  }
}
const JWT_SECRET = process.env.JWT_SECRET || DEV_SECRET;

// Keep short-lived access tokens in production to reduce compromise window.
// Can be overridden via JWT_EXPIRES_IN when needed.
const TOKEN_EXPIRATION = process.env.JWT_EXPIRES_IN
  || (process.env.NODE_ENV === 'production' ? '24h' : '7d');

// ─────────────────────────────────────────────────────────────────────────
// CENTRALIZED TOKEN BLACKLIST
// Moved here so ALL auth paths (authenticateToken, requireAuth, requireAdmin,
// requireAdminToken, requireEmployerToken) check the blacklist automatically.
// ─────────────────────────────────────────────────────────────────────────

// Structure: token -> expiry timestamp (ms)
const tokenBlacklist = new Map<string, number>();

// Purge expired blacklisted tokens periodically (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [token, expiry] of tokenBlacklist.entries()) {
    if (expiry < now) tokenBlacklist.delete(token);
  }
}, 10 * 60 * 1000);

/**
 * Add a token to the blacklist (called on logout)
 */
export function blacklistToken(token: string, expiryMs: number): void {
  tokenBlacklist.set(token, expiryMs);
}

/**
 * Check if a token has been blacklisted (revoked/logged out)
 */
export function isTokenBlacklisted(token: string): boolean {
  const expiry = tokenBlacklist.get(token);
  if (!expiry) return false;

  if (expiry > Date.now()) {
    return true;
  }

  // Token has naturally expired — remove from blacklist
  tokenBlacklist.delete(token);
  return false;
}

// Interfaces for JWT payload
export interface JwtPayload {
  userId: number;
  email: string;
  isVerified: boolean;
  isAdmin: boolean;
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: User): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    isVerified: user.is_verified || false,
    isAdmin: user.is_admin || false
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION as SignOptions['expiresIn'] });
}

/**
 * Verify a JWT token
 * @returns The decoded payload or null if invalid
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Extract JWT payload from request
 * SECURITY: Checks token blacklist before returning payload.
 * This ensures ALL auth paths (requireAuth, requireAdmin, requireAdminToken,
 * requireEmployerToken, authenticateToken) reject logged-out tokens.
 * @returns The decoded payload or null if invalid/missing/blacklisted token
 */
export function getPayloadFromRequest(req: Request): JwtPayload | null {
  try {
    // Get token from Authorization header
    const token = getTokenFromRequest(req);
    if (!token) {
      return null;
    }

    // SECURITY FIX: Check blacklist BEFORE verifying token
    // This ensures logged-out tokens are rejected in ALL middlewares
    if (isTokenBlacklisted(token)) {
      return null;
    }

    // Verify and decode token
    return verifyToken(token);
  } catch (error) {
    return null;
  }
}

export function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  return token || null;
}

/**
 * Extract user ID from JWT token in request
 * @returns User ID or null if not authenticated
 */
export function getUserIdFromRequest(req: Request): number | null {
  const payload = getPayloadFromRequest(req);
  return payload ? payload.userId : null;
}

/**
 * Check if user from request is verified
 * @returns true if user is verified, false otherwise
 */
export function isUserVerified(req: Request): boolean {
  const payload = getPayloadFromRequest(req);
  return payload ? payload.isVerified : false;
}

/**
 * Check if user from request is an admin
 * @returns true if user is an admin, false otherwise
 */
export function isUserAdmin(req: Request): boolean {
  const payload = getPayloadFromRequest(req);
  return payload ? payload.isAdmin : false;
}