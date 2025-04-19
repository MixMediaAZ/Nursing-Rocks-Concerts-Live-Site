import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '@shared/schema';

// Use environment variable or fallback for development
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_key_nursing_rocks';

// Token expiration (24 hours)
const TOKEN_EXPIRATION = '24h';

// Interfaces for JWT payload
export interface JwtPayload {
  userId: number;
  email: string;
  isVerified: boolean;
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: User): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    isVerified: user.is_verified || false
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
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
 * Extract user ID from JWT token in request
 * @returns User ID or null if not authenticated
 */
export function getUserIdFromRequest(req: Request): number | null {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      return null;
    }
    
    // Verify and decode token
    const payload = verifyToken(token);
    if (!payload) {
      return null;
    }
    
    return payload.userId;
  } catch (error) {
    return null;
  }
}

/**
 * Check if user from request is verified
 * @returns true if user is verified, false otherwise
 */
export function isUserVerified(req: Request): boolean {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      return false;
    }
    
    // Verify and decode token
    const payload = verifyToken(token);
    if (!payload) {
      return false;
    }
    
    return payload.isVerified;
  } catch (error) {
    return false;
  }
}