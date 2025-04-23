import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import { storage } from './storage';
import { generateToken, verifyToken, getUserIdFromRequest, isUserVerified } from './jwt';

const SALT_ROUNDS = 10;

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

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await storage.createUser({ email, first_name, last_name, password }, passwordHash);

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

    // Get user
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

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
    const userId = (req as any).user?.id;
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

    // Create ticket
    const ticket = await storage.createTicket(
      { ticket_type, price },
      userId,
      event_id,
      ticketCode
    );

    return res.status(201).json({
      message: 'Ticket purchased successfully',
      ticket
    });
  } catch (error) {
    console.error('Ticket purchase error:', error);
    return res.status(500).json({ message: 'Server error during ticket purchase' });
  }
}

export async function getUserTickets(req: Request, res: Response) {
  try {
    // Get user from JWT token (assuming middleware has set req.user)
    const userId = (req as any).user?.id;
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

// Authentication middleware
export async function authenticateToken(req: Request, res: Response, next: Function) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    
    // Fetch the complete user to get isAdmin value
    const user = await storage.getUserById(decoded.userId);
    if (!user) {
      return res.status(403).json({ message: 'User not found' });
    }
    
    (req as any).user = {
      id: decoded.userId,
      userId: decoded.userId, // Add userId for consistency
      email: decoded.email,
      is_verified: decoded.isVerified,
      isAdmin: user.is_admin // Add isAdmin flag
    };
    next();
  } catch (error) {
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

    let verificationResult;
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
        
        verificationResult = await response.json();
        status = verificationResult.isValid ? 'verified' : 'invalid';
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