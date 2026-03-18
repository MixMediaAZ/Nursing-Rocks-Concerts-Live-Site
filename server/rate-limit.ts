import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication endpoints
 * Limits login attempts to prevent brute force attacks
 *
 * Configuration:
 * - 5 attempts per 15 minutes per IP address
 * - Stored in memory (suitable for single-process deployments)
 * - For distributed systems, consider using redis-based store
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.',
  },
  statusCode: 429, // Too Many Requests
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  keyGenerator: (req, _res) => {
    // Use IP address as key (behind proxy-aware)
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  skip: (req, _res) => {
    // Skip rate limiting for health checks or specific paths if needed
    return false;
  },
});

/**
 * Rate limiter for admin PIN endpoint
 * Limits PIN attempts to prevent PIN brute force attacks
 *
 * Configuration:
 * - 3 attempts per 15 minutes per IP address (stricter than login)
 * - Stored in memory
 */
export const adminPinRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per windowMs (stricter for PIN)
  message: {
    success: false,
    message: 'Too many admin PIN attempts. Please try again later.',
  },
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, _res) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
});

/**
 * Rate limiter for general API endpoints
 * Optional limiter for other API routes to prevent abuse
 *
 * Configuration:
 * - 100 requests per 15 minutes per IP address
 * - Can be applied to public endpoints
 */
export const generalApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
  },
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, _res) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
});
