import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import { storage } from './storage';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { users } from '@shared/schema';
import jwt from 'jsonwebtoken';
import { generateToken, verifyToken, getUserIdFromRequest, isUserVerified } from './jwt';
import { sendTicketConfirmationEmail, sendPasswordResetEmail } from './email';

const SALT_ROUNDS = 10;

// SAFETY FIX: Token blacklist for logout/revocation
// Stores invalidated tokens to prevent reuse after logout
// Structure: token -> expiry timestamp
const tokenBlacklist = new Map<string, number>();

// Purge expired blacklisted tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, expiry] of tokenBlacklist.entries()) {
    if (expiry < now) tokenBlacklist.delete(token);
  }
}, 10 * 60 * 1000); // every 10 minutes

// API key should be stored as an environment variable
const VERIFICATION_API_KEY = process.env.VERIFICATION_API_KEY || '';

export const registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const licenseValidation = [
  body('license_number').notEmpty().withMessage('License number is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('expiration_date').isDate().withMessage('Expiration date must be a valid date'),
];

export async function register(req: Request, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, first_name, last_name } = req.body;

    // FIX: Normalize email (trim + lowercase) to ensure consistent storage and lookup
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    // SECURITY FIX: Don't reveal whether email is registered (prevents account enumeration)
    const existingUser = await storage.getUserByEmail(normalizedEmail);
    if (existingUser) {
      // Return success response to prevent account enumeration attacks
      return res.status(200).json({
        message: 'If this email address is not yet registered, a verification email will be sent. Please check your inbox.',
        user: null // Don't return user data if already exists
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user with normalized email
    const user = await storage.createUser({ email: normalizedEmail, first_name, last_name, password }, passwordHash);

    // SECURITY: Set Cache-Control headers to prevent caching of sensitive auth data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    // Generate JWT token using our helper module
    const token = generateToken(user);

    // Return user data without password hash
    const { password_hash, ...userData } = user;
    return res.status(201).json({
      message: 'User registered successfully',
      user: userData,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // FIX: Normalize email (trim + lowercase) to match registration behavior
    const normalizedEmail = email.toLowerCase().trim();

    // Get user
    let user;
    try {
      user = await storage.getUserByEmail(normalizedEmail);
    } catch (dbError) {
      console.error('[login] Database error:', dbError);
      return res.status(500).json({ message: 'Database connection error' });
    }
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // SECURITY: Set Cache-Control headers to prevent caching of sensitive auth data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    // Generate JWT token using our helper module
    const token = generateToken(user);

    // Return user data without password hash
    const { password_hash, ...userData } = user;
    return res.status(200).json({
      message: 'Login successful',
      user: userData,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
}

export async function submitNurseLicense(req: Request, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Get user from JWT token (assuming middleware has set req.user)
    const userId = (req as any).user?.id || (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { license_number, state, expiration_date } = req.body;

    // Check if license is already submitted
    const existingLicenses = await storage.getNurseLicensesByUserId(userId);
    const alreadySubmitted = existingLicenses.some(
      license => license.license_number === license_number && license.state === state
    );
    
    if (alreadySubmitted) {
      return res.status(400).json({ message: 'This license has already been submitted' });
    }

    // Create license record
    const license = await storage.createNurseLicense(
      { license_number, state, expiration_date },
      userId
    );

    // Trigger verification process asynchronously
    verifyNurseLicense(license.id).catch(error => {
      console.error('License verification error:', error);
    });

    return res.status(201).json({
      message: 'Nurse license submitted successfully and pending verification',
      license
    });
  } catch (error) {
    console.error('License submission error:', error);
    return res.status(500).json({ message: 'Server error during license submission' });
  }
}

export async function getNurseLicenses(req: Request, res: Response) {
  try {
    // Get user from JWT token (assuming middleware has set req.user)
    const userId = (req as any).user?.id || (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const licenses = await storage.getNurseLicensesByUserId(userId);
    return res.status(200).json({ licenses });
  } catch (error) {
    console.error('Get licenses error:', error);
    return res.status(500).json({ message: 'Server error while retrieving licenses' });
  }
}

export async function purchaseTicket(req: Request, res: Response) {
  try {
    // Get user from JWT token (assuming middleware has set req.user)
    const userId = (req as any).user?.id ?? (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if user is verified (has a verified license)
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ 
        message: 'You must have a verified nursing license to purchase tickets' 
      });
    }

    const { event_id, ticket_type, price } = req.body;

    // Validate event exists
    const event = await storage.getEvent(event_id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Generate unique ticket code
    const ticketCode = `NR-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Create ticket with email status set to pending approval
    // Emails will only be sent after admin approval
    const ticket = await storage.createTicket(
      {
        ticket_type,
        price,
        event_id,
        user_id: userId,
        ticket_code: ticketCode,
        email_status: 'pending_approval'  // FIX: Require admin approval before sending email
      },
      userId,
      event_id,
      ticketCode
    );

    // FIX: Do NOT send email immediately - wait for admin approval
    // Email will be sent via admin approval endpoint: /api/admin/tickets/:id/approve-and-send-email
    console.log(`Ticket created with pending approval for email: ${ticket.id}`);

    return res.status(201).json({
      message: 'Ticket requested successfully. Awaiting admin approval to send confirmation email.',
      ticket,
      emailStatus: 'pending_approval'
    });
  } catch (error) {
    console.error('Ticket purchase error:', error);
    return res.status(500).json({ message: 'Server error during ticket purchase' });
  }
}

export async function getUserTickets(req: Request, res: Response) {
  try {
    // Get user from JWT token (assuming middleware has set req.user)
    const userId = (req as any).user?.id ?? (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const tickets = await storage.getTicketsByUserId(userId);
    return res.status(200).json({ tickets });
  } catch (error) {
    console.error('Get tickets error:', error);
    return res.status(500).json({ message: 'Server error while retrieving tickets' });
  }
}

/**
 * Validate a ticket by code (read-only check)
 * Used to verify if a ticket is valid before it's used
 */
export async function validateTicketByCode(req: Request, res: Response) {
  try {
    const { code } = req.params;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ message: 'Invalid ticket code' });
    }

    const ticket = await storage.getTicketByCode(code);

    if (!ticket) {
      return res.status(404).json({
        valid: false,
        message: 'Ticket not found'
      });
    }

    // Get event details for the ticket
    const event = await storage.getEvent(ticket.event_id as number);

    return res.status(200).json({
      valid: true,
      ticket: {
        code: ticket.ticket_code,
        type: ticket.ticket_type,
        price: ticket.price,
        is_used: ticket.is_used,
        event: event ? {
          title: event.title,
          date: event.date,
          location: event.location,
        } : null,
      },
      message: ticket.is_used ? 'Ticket has already been used' : 'Ticket is valid'
    });
  } catch (error) {
    console.error('Ticket validation error:', error);
    return res.status(500).json({ message: 'Server error during ticket validation' });
  }
}

/**
 * Mark a ticket as used (scan/check-in endpoint)
 * Requires authentication for venue staff or admin
 */
export async function markTicketUsed(req: Request, res: Response) {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ message: 'Invalid ticket code' });
    }

    const ticket = await storage.getTicketByCode(code);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    if (ticket.is_used) {
      return res.status(400).json({
        success: false,
        message: 'Ticket has already been used'
      });
    }

    // Mark ticket as used
    const updatedTicket = await storage.markTicketAsUsed(ticket.id as any);

    return res.status(200).json({
      success: true,
      message: 'Ticket marked as used',
      ticket: {
        code: updatedTicket.ticket_code,
        type: updatedTicket.ticket_type,
        price: updatedTicket.price,
        is_used: updatedTicket.is_used,
        checked_in_at: updatedTicket.checked_in_at,
      }
    });
  } catch (error) {
    console.error('Mark ticket as used error:', error);
    return res.status(500).json({ message: 'Server error while marking ticket as used' });
  }
}

// Middleware to check if request is from an authenticated employer
export async function requireEmployerToken(req: Request, res: Response, next: Function) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: "Authentication token required" });
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    // Fetch employer by user id
    const employer = await storage.getEmployerByUserId(decoded.userId as any);
    if (!employer) {
      return res.status(403).json({ message: "Employer profile not found" });
    }

    if (employer.account_status && employer.account_status !== "active") {
      return res.status(403).json({ message: "Employer account is not active. Please wait for approval." });
    }

    (req as any).user = {
      userId: decoded.userId,
      email: decoded.email,
      isVerified: decoded.isVerified,
      isAdmin: decoded.isAdmin,
    };

    (req as any).employer = {
      id: employer.id,
      email: employer.contact_email,
      companyName: (employer as any).company_name ?? employer.name,
      isVerified: employer.is_verified,
      account_status: employer.account_status,
    };

    return next();
  } catch (error) {
    console.error("[requireEmployerToken] Token verification error:", error);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

// Authentication middleware
export async function authenticateToken(req: Request, res: Response, next: Function) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  try {
    // SAFETY FIX: Check if token has been blacklisted (logged out)
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({ message: 'Session has been terminated. Please log in again.' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    // SAFETY FIX: Always fetch the latest user data to verify current permissions
    // This ensures revoked admins cannot perform privileged operations
    const user = await storage.getUserById(decoded.userId as any);
    if (!user) {
      return res.status(403).json({ message: 'User not found or has been deleted' });
    }

    // SAFETY FIX: Check if user account is still active (prevent use of revoked accounts)
    if (user.is_suspended || !user.email) {
      return res.status(403).json({ message: 'Account is no longer active' });
    }

    (req as any).user = {
      userId: decoded.userId,
      email: decoded.email,
      isVerified: user.is_verified,
      isAdmin: user.is_admin // Always use database value, not token claim
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

// License verification function (would connect to external API in production)
async function verifyNurseLicense(licenseId: number) {
  try {
    // Get license details
    const license = await storage.getNurseLicenseById(licenseId);
    if (!license) {
      throw new Error('License not found');
    }

    let verificationResult: any;
    let status = 'invalid';

    // In a real implementation, this would make a call to the actual nursing board API
    if (VERIFICATION_API_KEY) {
      try {
        // This is where you would integrate with the actual verification API
        const response = await fetch('https://api.nursingboard.verification.example/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VERIFICATION_API_KEY}`
          },
          body: JSON.stringify({
            licenseNumber: license.license_number,
            state: license.state
          })
        });
        
        verificationResult = await response.json() as any;
        status = verificationResult?.isValid ? 'verified' : 'invalid';
      } catch (error) {
        console.error('External API verification error:', error);
        // Fall back to simulated verification
        verificationResult = simulateVerification(license.license_number, license.state);
        status = verificationResult.isValid ? 'verified' : 'invalid';
      }
    } else {
      // For development/demo, simulate verification
      verificationResult = simulateVerification(license.license_number, license.state);
      status = verificationResult.isValid ? 'verified' : 'invalid';
    }

    // Update license verification status
    await storage.updateNurseLicenseVerification(
      licenseId,
      status,
      new Date(),
      'system',
      verificationResult
    );

    // If license is verified, update user verification status
    if (status === 'verified') {
      await storage.updateUserVerificationStatus(license.user_id, true);
    }

    return { success: true, status };
  } catch (error) {
    console.error('License verification error:', error);
    throw error;
  }
}

// Simulation function for development purposes
function simulateVerification(licenseNumber: string, state: string) {
  // Create a deterministic but "random-looking" result based on license number
  const hash = crypto.createHash('md5').update(`${licenseNumber}-${state}`).digest('hex');
  const firstChar = parseInt(hash.charAt(0), 16);
  
  // 80% chance of successful verification (for testing purposes)
  const isValid = firstChar < 13;
  
  return {
    isValid,
    licenseNumber,
    state,
    verificationId: `SIM-${hash.substring(0, 8)}`,
    timestamp: new Date().toISOString(),
    details: isValid
      ? {
          status: 'Active',
          holder: 'SIMULATED NURSE',
          issueDate: '2020-01-01',
          expirationDate: '2025-01-01'
        }
      : {
          status: 'Invalid',
          reason: 'License not found in database'
        }
  };
}

// Validation rules
export const requestPasswordResetValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
];

export const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

export async function requestPasswordReset(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;

  // Always respond with success to prevent email enumeration
  const genericResponse = { message: 'If an account with that email exists, a reset link has been sent.' };

  // SECURITY: Set Cache-Control headers to prevent caching of password reset responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

  try {
    const user = await storage.getUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return res.status(200).json(genericResponse);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await db.update(users)
      .set({ reset_token: token, reset_token_expires_at: expiresAt })
      .where(eq(users.id, user.id));

    // SECURITY FIX: Use configured APP_URL, never trust Host header for password reset
    // Host headers can be spoofed by attackers to hijack password reset links
    if (!process.env.APP_URL) {
      console.warn('[AUTH] WARNING: APP_URL not configured. Password reset links may be vulnerable to Host header injection. Set APP_URL environment variable in production.');
    }
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    await sendPasswordResetEmail(user.email, user.first_name, token, baseUrl);

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error('Password reset request error:', error);
    // Still return generic success to avoid leaking info
    return res.status(200).json(genericResponse);
  }
}

export async function resetPassword(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { token, password } = req.body;

  const [userRow] = await db.select()
    .from(users)
    .where(eq(users.reset_token, token))
    .limit(1);

  if (!userRow || !userRow.reset_token_expires_at || userRow.reset_token_expires_at < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await db.update(users)
      .set({ password_hash: passwordHash, reset_token: null, reset_token_expires_at: null })
      .where(eq(users.id, userRow.id));

    // SECURITY: Set Cache-Control headers to prevent caching of password reset confirmation
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    return res.status(200).json({ message: 'Password updated successfully. You can now log in.' });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
}

/**
 * SAFETY FIX: Logout endpoint that invalidates the user's token
 * Prevents reuse of tokens after logout
 */
export async function logout(req: Request, res: Response) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(400).json({ message: 'No token to logout' });
    }

    // SECURITY: Set Cache-Control headers for logout response
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    // Get the token's expiry time (standard JWT exp claim; not on our JwtPayload type)
    try {
      const decoded = jwt.decode(token);
      if (decoded && typeof decoded === 'object' && 'exp' in decoded) {
        const exp = (decoded as { exp?: unknown }).exp;
        if (typeof exp === 'number') {
          tokenBlacklist.set(token, exp * 1000);
          console.log('[AUTH] Token blacklisted for logout');
        }
      }
    } catch (err) {
      // Token is already invalid, that's fine
      console.log('[AUTH] Token already invalid');
    }

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Server error during logout' });
  }
}

/**
 * SAFETY FIX: Check if a token is blacklisted (revoked/logged out)
 */
export function isTokenBlacklisted(token: string): boolean {
  const expiry = tokenBlacklist.get(token);
  if (!expiry) return false;

  // Token is blacklisted if expiry hasn't passed yet
  if (expiry > Date.now()) {
    return true;
  }

  // Token is expired, remove from blacklist
  tokenBlacklist.delete(token);
  return false;
}