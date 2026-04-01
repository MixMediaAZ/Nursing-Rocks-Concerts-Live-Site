import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { InsertUser, User } from "@shared/schema";
import { getPayloadFromRequest } from "./jwt";

// Extend Express.User to cover both session auth (Passport/schema User) and JWT auth shapes.
// JWT middleware (requireAuth) always sets userId, isVerified, isAdmin before protected routes run.
declare global {
  namespace Express {
    interface User {
      // JWT auth fields (always present on protected routes)
      userId: number;
      email: string;
      isVerified: boolean;
      isAdmin: boolean;
      // Session auth (Passport) fields — optional fallbacks
      id?: number;
      username?: string;
      is_verified?: boolean;
      is_admin?: boolean;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Authentication middleware for protected routes
function getSessionUser(req: Request) {
  if (typeof req.isAuthenticated === "function" && req.isAuthenticated()) {
    return req.user as any;
  }
  return null;
}

function getJwtUser(req: Request) {
  const payload = getPayloadFromRequest(req);
  if (!payload) return null;
  return {
    id: payload.userId,
    email: payload.email,
    is_verified: payload.isVerified,
    is_admin: payload.isAdmin,
  };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const sessionUser = getSessionUser(req);
  if (sessionUser) {
    return next();
  }

  const jwtUser = getJwtUser(req);
  if (jwtUser) {
    (req as any).user = jwtUser;
    return next();
  }

  return res.status(401).json({ message: "Unauthorized: Authentication required" });
}

// Middleware to require verified user
export function requireVerifiedUser(req: Request, res: Response, next: NextFunction) {
  const sessionUser = getSessionUser(req);
  const jwtUser = sessionUser ? null : getJwtUser(req);

  const user = sessionUser ?? jwtUser;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized: Authentication required" });
  }

  if (!(user as any).is_verified) {
    return res.status(403).json({ message: "Forbidden: Account verification required" });
  }

  if (jwtUser) {
    (req as any).user = jwtUser;
  }
  next();
}

// Middleware to require admin user
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const sessionUser = getSessionUser(req);
  const jwtUser = sessionUser ? null : getJwtUser(req);
  const user = sessionUser ?? jwtUser;

  if (!user) {
    return res.status(401).json({ message: "Unauthorized: Authentication required" });
  }

  if (!(user as any).is_admin) {
    return res.status(403).json({ message: "Forbidden: Admin privileges required" });
  }

  if (jwtUser) {
    (req as any).user = jwtUser;
  }
  next();
}

export function setupAuth(app: Express) {
  if (!process.env.SESSION_SECRET) {
    // For development, use a default secret
    process.env.SESSION_SECRET = "nursing-rocks-development-secret";
    console.warn("No SESSION_SECRET environment variable found, using default (unsafe for production)");
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true, // Prevent JavaScript from accessing the cookie (XSS protection)
      sameSite: 'strict', // Prevent CSRF attacks by restricting cross-site cookie transmission
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email", // Use email as the username field
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password_hash))) {
            return done(null, false, { message: "Invalid email or password" });
          }
          return done(null, user as any);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id || user.userId);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const dbUser = await storage.getUserById(id);
      if (!dbUser) return done(null, false);
      // Map snake_case DB user to Express.User format
      const user: Express.User = {
        id: dbUser.id,
        userId: dbUser.id,
        email: dbUser.email,
        isVerified: dbUser.is_verified ?? false,
        isAdmin: dbUser.is_admin ?? false,
      };
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Registration endpoint
  app.post("/api/auth/register", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, first_name, last_name } = req.body;

      // Validate password strength (minimum 8 characters)
      if (!password || typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      // Check if email is already registered
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash the password
      const hashedPassword = await hashPassword(password);
      
      // Create the new user
      const user = await storage.createUser(
        { 
          email, 
          first_name, 
          last_name,
          password: password // Include in schema object for type compatibility
        },
        hashedPassword
      );
      
      // Log in the new user
      req.login(user as any, (err) => {
        if (err) return next(err);
        return res.status(201).json(user);
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login endpoint - DISABLED: Using JWT-based auth from routes.ts instead
  // The JWT endpoint returns { token, user } which the frontend expects
  // app.post("/api/auth/login", (req: Request, res: Response, next: NextFunction) => {
  //   passport.authenticate("local", (err, user, info) => {
  //     if (err) return next(err);
  //     if (!user) {
  //       return res.status(401).json({ message: info?.message || "Authentication failed" });
  //     }
  //     
  //     req.login(user, (loginErr) => {
  //       if (loginErr) return next(loginErr);
  //       return res.json(user);
  //     });
  //   })(req, res, next);
  // });

  // Logout endpoint
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed", error: err.message });
      }
      res.json({ message: "Successfully logged out" });
    });
  });
}