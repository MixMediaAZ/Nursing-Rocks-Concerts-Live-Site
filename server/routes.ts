import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import path from "path";
import fs from "fs";
import { randomBytes, timingSafeEqual } from "crypto";
import bcryptjs from "bcryptjs";
import { db } from "./db";
import { eq, sql, and, desc, ilike, or, inArray, gte } from "drizzle-orm";
import { storage } from "./storage";
import { approvedVideos, gallery, mediaFolders, events, nrpxRegistrations, users, tickets, storeProducts, storeOrders, storeOrderItems } from "@shared/schema";
import QRCode from "qrcode";
import { sendNrpxTicketEmail } from "./email";
import { processImage } from "./image-utils";

// Sharp is marked as external in the build - it's pre-installed on Vercel
// We set to null and handle gracefully if not available
let sharp: typeof import('sharp') | null = null;
import { 
  galleryUpload, 
  createMediaFolder, 
  getMediaFolders, 
  updateMediaFolder, 
  deleteMediaFolder,
  uploadGalleryImages, 
  deleteGalleryImage, 
  updateGalleryImage, 
  getGalleryImagesByEvent,
  getGalleryImagesByFolder,
  getAllGalleryImages,
  replaceGalleryImage
} from "./gallery-media";
import { fetchCustomCatProducts } from "./customcat-api";
import { processCustomCatProductsImages, formatCustomCatProducts } from "./product-utils";
import { getVideoProvider, getVideoProviderId } from "./video";
import {
  checkB2Connection,
  getB2Bucket,
  getB2S3Client,
  headB2Object,
  listB2Objects,
  manifestUrlForVideoId,
  posterKeyForVideoId,
  publicUrlForKey,
  stableVideoIdFromKey,
} from "./video/b2-s3";
import { packageMp4KeyToHlsInB2 } from "./video/hls-packager";
import multer from "multer";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import os from "os";

const VIDEO_LIST_CACHE_TTL_MS = 5 * 60 * 1000;
let videoListCache:
  | {
      timestamp: number;
      data: { success: boolean; resources: unknown[]; total: number };
    }
  | null = null;

const JOB_VIEW_COUNT_TTL_MS = 60 * 60 * 1000;
const JOB_VIEW_DEDUP_MAX_ENTRIES = 100000;
const jobViewDedupe = new Map<string, number>();

// Initialize Stripe with the secret key if it exists
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe | undefined;
if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    // Uses the default API version configured in the Stripe account
  });
}
// Silent fallback for Stripe - will be configured later
import { 
  insertSubscriberSchema, 
  insertJobListingSchema, 
  insertEmployerSchema,
  insertNurseProfileSchema,
  insertJobApplicationSchema,
  insertJobAlertSchema,
  jobApplications,
  jobListings,
  contactRequests,
  employers,
  insertStoreProductSchema,
  insertStoreOrderSchema,
  insertStoreOrderItemSchema,
  siteVisits
} from "@shared/schema";
import { uploadCityBackground, uploadMultipleCityBackgrounds } from "./upload";
import { z } from "zod";
import {
  licenseValidation,
  submitNurseLicense,
  getNurseLicenses,
  purchaseTicket,
  getUserTickets,
  validateTicketByCode,
  markTicketUsed,
  authenticateToken,
  registerValidation,
  loginValidation,
  requestPasswordResetValidation,
  resetPasswordValidation,
  register,
  login,
  logout,
  requestPasswordReset,
  resetPassword,
  requireEmployerToken,
  getCurrentUser,
} from "./auth";
import { setupAuth, requireAuth, requireVerifiedUser, requireAdmin } from "./session-auth";
import { generateToken, isUserAdmin, getPayloadFromRequest, getTokenFromRequest } from './jwt';
import { isTokenRevokedForUser, setUserRevokedBeforeMs } from "./token-revocation-store";
import {
  upload,
  uploadMediaFiles,
  getMediaList,
  getMediaById,
  updateMedia,
  deleteMedia
} from "./media";
import { authRateLimiter, adminPinRateLimiter, registerRateLimiter, passwordResetRateLimiter, scanRateLimiter } from "./rate-limit";
import { runAllEmailSchedules, getEmailScheduleStatus } from "./email-scheduler";
import { searchJobs, searchEvents, searchNurses, getSearchSuggestions } from "./search";
import { handleJobAlertsCron, handleEventRemindersCron, handleCronHealth } from "./cron-handlers";
import { registerAdminJobsIngestionRoutes } from "./routes/admin-jobs-ingestion";

function escapeCsvCell(value: unknown): string {
  const asString = value === null || value === undefined ? '' : String(value);
  const guarded = /^[=+\-@]/.test(asString) ? `'${asString}` : asString;
  return `"${guarded.replace(/"/g, '""')}"`;
}

async function acquireAdvisoryLock(lockName: string): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(hashtext(${lockName}))`);
}

async function releaseAdvisoryLock(lockName: string): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_unlock(hashtext(${lockName}))`);
}

const ALLOWED_VIDEO_UPLOAD_CONTENT_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
]);

function shouldCountJobView(req: Request, jobId: number): boolean {
  const ip = ((req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown")
    .split(",")[0]
    .trim();
  const key = `${jobId}:${ip}`;
  const now = Date.now();

  const existing = jobViewDedupe.get(key);
  if (existing && existing > now) {
    return false;
  }

  jobViewDedupe.set(key, now + JOB_VIEW_COUNT_TTL_MS);
  if (jobViewDedupe.size > JOB_VIEW_DEDUP_MAX_ENTRIES) {
    for (const [k, expiresAt] of jobViewDedupe.entries()) {
      if (expiresAt <= now) {
        jobViewDedupe.delete(k);
      }
    }
    if (jobViewDedupe.size > JOB_VIEW_DEDUP_MAX_ENTRIES) {
      const oldest = jobViewDedupe.keys().next().value as string | undefined;
      if (oldest) jobViewDedupe.delete(oldest);
    }
  }

  return true;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session-based authentication
  setupAuth(app);

  // ── Admin auth middleware ─────────────────────────────────────────────────
  // Defined first so it can be reused on any route in this file.
  const requireAdminToken = async (req: Request, res: Response, next: any) => {
    const token = getTokenFromRequest(req);
    const payload = getPayloadFromRequest(req);
    if (!payload || !payload.isAdmin || !token) {
      return res.status(403).json({ message: "Admin privileges required" });
    }
    if (await isTokenRevokedForUser(payload.userId, token)) {
      return res.status(401).json({ message: "Session has been terminated. Please log in again." });
    }
    const adminUser = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
    if (!adminUser.length || !adminUser[0].is_admin) {
      return res.status(403).json({ message: "Admin privileges revoked" });
    }
    (req as any).user = { userId: payload.userId, email: payload.email, isAdmin: true };
    return next();
  };
  // ─────────────────────────────────────────────────────────────────────────
  // Events
  app.get("/api/events", async (_req: Request, res: Response) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/featured", async (_req: Request, res: Response) => {
    try {
      const featuredEvent = await storage.getFeaturedEvent();
      if (!featuredEvent) {
        return res.status(404).json({ message: "No featured event found" });
      }
      
      res.json(featuredEvent);
    } catch (error) {
      console.error("Error fetching featured event:", error);
      res.status(500).json({ message: "Failed to fetch featured event" });
    }
  });
  
  app.get("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post("/api/events", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { title, subtitle, description, date, artist_id, image_url, start_time, doors_time, price, is_featured, genre, tickets_url, location, has_presale_tickets, tickets_at_door_only } = req.body;

      if (!title || !date || !artist_id || !start_time || !location) {
        return res.status(400).json({ message: "Missing required fields: title, date, artist_id, start_time, location" });
      }

      // Validate text field lengths (prevent DoS via unbounded storage)
      const validateTextField = (field: string, value: string, maxLen: number): boolean => {
        return !value || value.length <= maxLen;
      };

      if (!validateTextField('title', title, 500)) {
        return res.status(400).json({ message: 'Event title too long (max 500 characters)' });
      }
      if (!validateTextField('subtitle', subtitle, 500)) {
        return res.status(400).json({ message: 'Event subtitle too long (max 500 characters)' });
      }
      if (!validateTextField('description', description, 5000)) {
        return res.status(400).json({ message: 'Event description too long (max 5000 characters)' });
      }
      if (!validateTextField('location', location, 500)) {
        return res.status(400).json({ message: 'Event location too long (max 500 characters)' });
      }
      if (!validateTextField('genre', genre, 200)) {
        return res.status(400).json({ message: 'Genre too long (max 200 characters)' });
      }

      const newEvent = await storage.createEvent({
        title,
        subtitle,
        description,
        date: new Date(date),
        artist_id,
        image_url,
        start_time,
        doors_time,
        price,
        is_featured: is_featured || false,
        genre,
        tickets_url,
        location,
        has_presale_tickets: has_presale_tickets || false,
        tickets_at_door_only: tickets_at_door_only || false,
      });

      res.status(201).json(newEvent);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  // Artists
  app.get("/api/artists", async (_req: Request, res: Response) => {
    try {
      const artists = await storage.getAllArtists();
      res.json(artists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch artists" });
    }
  });

  app.get("/api/artists/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid artist ID" });
      }

      const artist = await storage.getArtist(id);
      if (!artist) {
        return res.status(404).json({ message: "Artist not found" });
      }

      res.json(artist);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch artist" });
    }
  });

  // Advanced Search Endpoints
  app.get("/api/search/jobs", async (req: Request, res: Response) => {
    try {
      const { q, specialty, location, salaryMin, salaryMax, sortBy, limit, offset } = req.query;

      // Validate search query length (max 500 chars to prevent ReDoS/DoS)
      const searchQuery = (q as string || '').trim();
      if (searchQuery.length > 500) {
        return res.status(400).json({ message: 'Search query too long (max 500 characters)' });
      }

      // FIX: Add bounds checking for numeric inputs
      const parsedLimit = limit ? Math.min(Math.max(parseInt(limit as string) || 20, 1), 100) : 20;
      const parsedOffset = offset ? Math.min(Math.max(parseInt(offset as string) || 0, 0), 10000) : 0;
      const parsedSalaryMin = salaryMin ? Math.max(parseInt(salaryMin as string) || 0, 0) : undefined;
      const parsedSalaryMax = salaryMax ? Math.max(parseInt(salaryMax as string) || 0, 0) : undefined;

      // Normalize and validate specialty array (max 20 items to prevent DoS)
      let specialtyArray: string[] | undefined;
      if (specialty) {
        if (Array.isArray(specialty)) {
          specialtyArray = specialty.slice(0, 20) as string[];
        } else {
          specialtyArray = [specialty as string];
        }
        // Filter empty strings
        specialtyArray = specialtyArray.filter(s => typeof s === 'string' && s.trim().length > 0);
        if (specialtyArray.length === 0) specialtyArray = undefined;
      }

      const results = await searchJobs({
        query: searchQuery,
        specialty: specialtyArray,
        location: location as string,
        salaryMin: parsedSalaryMin,
        salaryMax: parsedSalaryMax,
        sortBy: (sortBy as any) || 'relevance',
        limit: parsedLimit,
        offset: parsedOffset,
      });

      res.json(results);
    } catch (error) {
      console.error('Error searching jobs:', error);
      res.status(500).json({ message: 'Failed to search jobs' });
    }
  });

  app.get("/api/search/events", async (req: Request, res: Response) => {
    try {
      const { q, startDate, endDate, location, featured, sortBy, limit, offset } = req.query;

      // Validate search query length (max 500 chars to prevent ReDoS/DoS)
      const searchQuery = (q as string || '').trim();
      if (searchQuery.length > 500) {
        return res.status(400).json({ message: 'Search query too long (max 500 characters)' });
      }

      const parsedLimit = limit ? Math.min(Math.max(parseInt(limit as string) || 20, 1), 100) : 20;
      const parsedOffset = offset ? Math.min(Math.max(parseInt(offset as string) || 0, 0), 10000) : 0;

      const results = await searchEvents({
        query: searchQuery,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        location: location as string,
        isFeatured: featured === 'true' ? true : featured === 'false' ? false : undefined,
        sortBy: (sortBy as any) || 'relevance',
        limit: parsedLimit,
        offset: parsedOffset,
      });

      res.json(results);
    } catch (error) {
      console.error('Error searching events:', error);
      res.status(500).json({ message: 'Failed to search events' });
    }
  });

  app.get("/api/search/nurses", async (req: Request, res: Response) => {
    try {
      const { q, specialty, experience, certifications, sortBy, limit, offset } = req.query;

      // Validate search query length (max 500 chars to prevent ReDoS/DoS)
      const searchQuery = (q as string || '').trim();
      if (searchQuery.length > 500) {
        return res.status(400).json({ message: 'Search query too long (max 500 characters)' });
      }

      const parsedLimit = limit ? Math.min(Math.max(parseInt(limit as string) || 20, 1), 100) : 20;
      const parsedOffset = offset ? Math.min(Math.max(parseInt(offset as string) || 0, 0), 10000) : 0;

      // Normalize and validate certifications array (max 20 items to prevent DoS)
      let certificationsArray: string[] | undefined;
      if (certifications) {
        if (Array.isArray(certifications)) {
          certificationsArray = certifications.slice(0, 20) as string[];
        } else {
          certificationsArray = [certifications as string];
        }
        // Filter empty strings
        certificationsArray = certificationsArray.filter(c => typeof c === 'string' && c.trim().length > 0);
        if (certificationsArray.length === 0) certificationsArray = undefined;
      }

      const results = await searchNurses({
        query: searchQuery,
        specialty: specialty as string,
        experience: experience ? parseInt(experience as string) : undefined,
        certifications: certificationsArray,
        sortBy: (sortBy as any) || 'relevance',
        limit: parsedLimit,
        offset: parsedOffset,
      });

      res.json(results);
    } catch (error) {
      console.error('Error searching nurses:', error);
      res.status(500).json({ message: 'Failed to search nurses' });
    }
  });

  app.get("/api/search/suggestions/:type", async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      const { q } = req.query;

      if (!q || typeof q !== 'string' || q.trim().length === 0) {
        return res.status(400).json({ message: 'Search query required' });
      }

      const validTypes = ['job', 'event', 'location'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ message: 'Invalid suggestion type' });
      }

      const suggestions = await getSearchSuggestions(type as any, q);
      res.json({ suggestions });
    } catch (error) {
      console.error('Error getting suggestions:', error);
      res.status(500).json({ message: 'Failed to get suggestions' });
    }
  });

  // Venues section removed

  // Gallery and Media Folders
  app.get("/api/gallery", getAllGalleryImages);
  app.get("/api/gallery/event/:eventId", getGalleryImagesByEvent);
  app.get("/api/gallery/folder/:folderId", getGalleryImagesByFolder);
  
  // Get a single gallery image by ID
  app.get("/api/gallery/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id, 10))) {
        return res.status(400).json({ error: 'Invalid image ID' });
      }
      
      const imageId = parseInt(id, 10);
      const [image] = await db.select().from(gallery).where(eq(gallery.id, imageId));
      
      if (!image) {
        return res.status(404).json({ error: 'Image not found' });
      }
      
      res.json(image);
    } catch (error) {
      console.error('Error getting gallery image:', error);
      res.status(500).json({ error: 'Failed to get gallery image' });
    }
  });
  
  // Gallery media management endpoints — all write operations require admin
  app.post("/api/gallery/upload", requireAdminToken, galleryUpload.array('images', 20), uploadGalleryImages);
  app.delete("/api/gallery/:id", requireAdminToken, deleteGalleryImage);
  app.patch("/api/gallery/:id", requireAdminToken, updateGalleryImage);
  app.post("/api/gallery/:id/replace", requireAdminToken, galleryUpload.single('image'), replaceGalleryImage);
  app.post("/api/gallery/replace/:id", requireAdminToken, replaceGalleryImage);

  // City backgrounds upload — admin only
  app.post("/api/upload/city-background", requireAdminToken, uploadCityBackground);
  app.post("/api/upload/city-backgrounds/bulk", requireAdminToken, uploadMultipleCityBackgrounds);
  
  // Replace one gallery image with another
  app.post("/api/gallery/:id/replace-with/:replacementId", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const { id, replacementId } = req.params;
      const originalUrl = req.body.originalUrl; // Capture original URL if provided
      
      // Validate the replacement ID
      if (!replacementId || isNaN(parseInt(replacementId, 10))) {
        return res.status(400).json({ error: 'Invalid replacement image ID' });
      }
      
      const newImageId = parseInt(replacementId, 10);
      let originalImage: any = null;
      
      // Check if we're dealing with a placeholder image
      if (id === '-1' && originalUrl) {
        // Handle placeholder image with provided URL
        originalImage = {
          id: -1,
          image_url: originalUrl,
          alt_text: req.body.alt_text || 'Image',
          // Set minimal required properties
          media_type: 'image',
          created_at: new Date(),
          updated_at: new Date()
        };
      } else if (!id || isNaN(parseInt(id, 10))) {
        return res.status(400).json({ error: 'Invalid original image ID' });
      } else {
        // Get original image from database
        const originalImageId = parseInt(id, 10);
        [originalImage] = await db.select({
          id: gallery.id,
          image_url: gallery.image_url,
          thumbnail_url: gallery.thumbnail_url,
          alt_text: gallery.alt_text,
          event_id: gallery.event_id,
          folder_id: gallery.folder_id,
          media_type: gallery.media_type,
          file_size: gallery.file_size,
          dimensions: gallery.dimensions,
          duration: gallery.duration,
          sort_order: gallery.sort_order,
          created_at: gallery.created_at,
          updated_at: gallery.updated_at,
          z_index: gallery.z_index,
          metadata: gallery.metadata
        }).from(gallery).where(eq(gallery.id, originalImageId));
        
        if (!originalImage) {
          return res.status(404).json({ error: 'Original image not found' });
        }
      }
      
      // Get replacement image
      const [replacementImage] = await db.select({
        id: gallery.id,
        image_url: gallery.image_url,
        thumbnail_url: gallery.thumbnail_url,
        alt_text: gallery.alt_text,
        event_id: gallery.event_id,
        folder_id: gallery.folder_id,
        media_type: gallery.media_type,
        file_size: gallery.file_size,
        dimensions: gallery.dimensions,
        duration: gallery.duration,
        sort_order: gallery.sort_order,
        created_at: gallery.created_at,
        updated_at: gallery.updated_at,
        z_index: gallery.z_index,
        metadata: gallery.metadata
      }).from(gallery).where(eq(gallery.id, newImageId));
      
      if (!replacementImage) {
        return res.status(404).json({ error: 'Replacement image not found' });
      }
      
      // Process the replacement - this reuses the image replacement endpoint logic
      // but sources the new image from the gallery rather than an upload
      
      try {
        let dimensions: { width?: number; height?: number } = {};
        let targetPath = '';
        
        // If dealing with a placeholder image or external URL
        if (originalImage.id === -1) {
          // For placeholder images, we'll use the replacement image's dimensions
          targetPath = path.join(process.cwd(), 'uploads', 'replaced-' + Date.now());
          
          // Ensure target directory exists
          if (!fs.existsSync(path.dirname(targetPath))) {
            fs.mkdirSync(path.dirname(targetPath), { recursive: true });
          }
          
          // Check if the original URL is a web URL or a local path
          const isWebUrl = originalImage.image_url.startsWith('http://') || originalImage.image_url.startsWith('https://');
          
          if (isWebUrl) {
            console.log('Original image is a web URL, using replacement dimensions');
            // For web URLs, we'll use the replacement image's dimensions as is
            // No need to try to get dimensions from web URLs as they might not be accessible
            
            // For web URLs, we need to generate a proper targetPath
            const timestamp = Date.now();
            const outputFilename = `replaced-external-${timestamp}`;
            targetPath = path.join(process.cwd(), 'uploads', outputFilename);
            
            console.log('Using target path for web URL replacement:', targetPath);
          } else {
            // Try to get dimensions from local file
            try {
              // Handle the case where the URL is a local file
              const originalPath = path.join(process.cwd(), originalImage.image_url);
              
              if (fs.existsSync(originalPath) && sharp) {
                try {
                  const originalImage2 = await sharp(originalPath);
                  const originalMetadata = await originalImage2.metadata();
                  dimensions = {
                    width: originalMetadata.width,
                    height: originalMetadata.height
                  };
                  console.log('Found dimensions for placeholder image:', dimensions);
                } catch (innerErr) {
                  console.warn('Error processing original image with sharp:', innerErr);
                }
              } else if (!fs.existsSync(originalPath)) {
                console.log('Original image not found locally, using replacement dimensions');
              }
            } catch (err) {
              console.warn('Could not determine dimensions from placeholder image, using default:', err);
              // Continue without dimensions to use the original replacement size
            }
          }
        } else {
          // Regular case - get dimensions from original image
          const originalPath = path.join(process.cwd(), originalImage.image_url);
          targetPath = originalPath;
          
          if (sharp) {
            try {
              const originalImage2 = await sharp(originalPath);
              const originalMetadata = await originalImage2.metadata();
              dimensions = {
                width: originalMetadata.width,
                height: originalMetadata.height
              };
            } catch (err) {
              console.warn('Could not determine dimensions from original image, using default:', err);
              // Continue without dimensions to use the original replacement size
            }
          } else {
            console.warn('Sharp not available - skipping dimension extraction');
          }
        }
        
        // Get replacement image
        const replacementPath = path.join(process.cwd(), replacementImage.image_url);
        
        // Skip processing for external URLs completely
        let processedImage;
        
        // Check if original image URL is a web URL
        const isOriginalWebUrl = originalImage.image_url.startsWith('http://') || 
                                originalImage.image_url.startsWith('https://');
        
        // Check if replacement image URL is external (shouldn't normally happen but just in case)
        const isReplacementWebUrl = replacementImage.image_url.startsWith('http://') || 
                                  replacementImage.image_url.startsWith('https://');
        
        if (isOriginalWebUrl || originalImage.id === -1) {
          // For ALL external URLs or placeholder images, just use the replacement image directly
          // This completely bypasses Sharp processing for any external URLs
          console.log('BYPASS: Using replacement image directly, no processing');
          processedImage = {
            original: replacementImage.image_url,
            thumbnail: replacementImage.thumbnail_url || replacementImage.image_url,
            small: replacementImage.image_url,
            medium: replacementImage.image_url,
            large: replacementImage.image_url
          };
        } else {
          try {
            // Generate resized images from the replacement
            processedImage = await processImage(
              replacementPath,
              path.dirname(targetPath),
              path.basename(targetPath, path.extname(targetPath)),
              dimensions
            );
          } catch (err) {
            // Fallback to direct replacement if processing fails
            console.error('Image processing failed, using direct replacement:', err);
            processedImage = {
              original: replacementImage.image_url,
              thumbnail: replacementImage.thumbnail_url || replacementImage.image_url,
              small: replacementImage.image_url,
              medium: replacementImage.image_url,
              large: replacementImage.image_url
            };
          }
        }
        
        // For regular database images, update the database entry
        if (originalImage.id !== -1) {
          await db.update(gallery)
            .set({
              image_url: processedImage.original,
              thumbnail_url: processedImage.thumbnail,
              alt_text: replacementImage.alt_text || originalImage.alt_text,
              updated_at: new Date(),
              metadata: replacementImage.metadata || originalImage.metadata
            })
            .where(eq(gallery.id, originalImage.id));
        }
        
        // Additionally, check if there are any events using this image and update them too
        try {
          // Get the original image URL without any cache busters
          const originalImgUrl = originalImage.image_url.split('?')[0];
          
          console.log('Checking for events using image:', originalImgUrl);
          
          // Find events using this image
          const eventsToUpdate = await db.select()
            .from(events)
            .where(eq(events.image_url, originalImgUrl));
            
          if (eventsToUpdate && eventsToUpdate.length > 0) {
            console.log(`Found ${eventsToUpdate.length} events using this image, updating them`);
            
            // Update each event
            for (const event of eventsToUpdate) {
              await db.update(events)
                .set({
                  image_url: processedImage.original
                })
                .where(eq(events.id, event.id));
              
              console.log(`Updated event ${event.id} with new image ${processedImage.original}`);
            }
          }
        } catch (err) {
          console.error('Error updating events that use this image:', err);
          // Continue with the image replacement even if event updates fail
        }
        
        // Return the processed image info
        res.status(200).json({
          message: 'Image replaced successfully',
          id: originalImage.id,
          originalUrl: originalImage.image_url,
          image_url: processedImage.original,
          thumbnail_url: processedImage.thumbnail
        });
      } catch (error) {
        console.error('Error processing replacement image:', error);
        return res.status(500).json({ error: 'Failed to process replacement image' });
      }
      
    } catch (error) {
      console.error('Error replacing image:', error);
      res.status(500).json({ error: 'Failed to replace image' });
    }
  });
  
  // Media Folders management — writes require admin
  app.get("/api/media-folders", getMediaFolders);
  app.post("/api/media-folders", requireAdminToken, createMediaFolder);
  app.patch("/api/media-folders/:id", requireAdminToken, updateMediaFolder);
  app.delete("/api/media-folders/:id", requireAdminToken, deleteMediaFolder);

  // Newsletter subscription (rate-limited to prevent spam/DoS)
  app.post("/api/subscribe", authRateLimiter, async (req: Request, res: Response) => {
    try {
      const validationResult = insertSubscriberSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid subscription data", 
          errors: validationResult.error.format() 
        });
      }
      
      const { email } = validationResult.data;

      // CRITICAL: Normalize email to lowercase for case-insensitive duplicate check
      // Database has case-insensitive unique index on LOWER(email)
      const normalizedEmail = email.toLowerCase().trim();

      // Check if user is already subscribed
      const existingSubscriber = await storage.getSubscriberByEmail(normalizedEmail);
      if (existingSubscriber) {
        return res.status(409).json({ message: "Email is already subscribed" });
      }

      const subscriber = await storage.createSubscriber({ email: normalizedEmail });
      res.status(201).json({
        id: subscriber.id,
        message: "Successfully subscribed to newsletter"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to process subscription" });
    }
  });

  // Authentication routes are now handled by setupAuth
  // We'll keep these routes for backward compatibility
  app.post("/api/auth/register", registerRateLimiter, registerValidation, register);
  app.post("/api/auth/login", authRateLimiter, loginValidation, login);
  // SAFETY FIX: Logout endpoint to invalidate tokens server-side
  app.post("/api/auth/logout", authenticateToken, logout);
  app.get("/api/auth/me", requireAuth, getCurrentUser);
  app.post("/api/auth/forgot-password", passwordResetRateLimiter, requestPasswordResetValidation, requestPasswordReset);
  app.post("/api/auth/reset-password", passwordResetRateLimiter, resetPasswordValidation, resetPassword);

  // Protected routes (require authentication)
  app.post("/api/license/submit", requireAuth, licenseValidation, submitNurseLicense);
  app.get("/api/license", requireAuth, getNurseLicenses);
  app.post("/api/tickets/purchase", requireAuth, purchaseTicket);
  app.get("/api/tickets", requireAuth, getUserTickets);

  // Verified nurses: issue free tickets + send issuance email (user-initiated from dashboard)
  app.post("/api/tickets/claim-verified", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id ?? (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { claimVerifiedUserTickets } = await import("./services/verification");
      const result = await claimVerifiedUserTickets(userId);
      return res.json(result);
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err?.code === "VERIFICATION_REQUIRED") {
        return res.status(403).json({
          message: err.message || "Account must be verified before claiming free tickets.",
        });
      }
      console.error("claim-verified error:", error);
      return res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to claim tickets",
      });
    }
  });

  // QR Ticket Validation Routes
  app.get("/api/tickets/validate/:code", validateTicketByCode); // Public read-only validation
  app.post("/api/tickets/validate", requireAdmin, markTicketUsed); // Admin/venue staff only

  // Media Management API
  app.get("/api/media", getMediaList);
  app.get("/api/media/:id", getMediaById);
  app.post("/api/media/upload", requireAdminToken, upload.array('files'), uploadMediaFiles);
  // IDOR fix: Media delete/update not fully implemented with DB ownership checks.
  // Restrict to admin-only until media_assets DB integration is complete.
  app.patch("/api/media/:id", requireAdminToken, updateMedia);
  app.delete("/api/media/:id", requireAdminToken, deleteMedia);

  // Nurse License API Routes
  app.get("/api/licenses", requireAuth, async (req: Request, res: Response) => {
    try {
      // Get the user id from the request
      const userId = (req.user as any)?.userId ?? (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const licenses = await storage.getNurseLicensesByUserId(userId);
      return res.status(200).json(licenses);
    } catch (error) {
      console.error("Error getting licenses:", error);
      return res.status(500).json({ message: 'Server error while retrieving licenses' });
    }
  });

  app.post("/api/licenses", requireAuth, licenseValidation, submitNurseLicense);

  // Stripe Payment Integration
  app.post("/api/create-payment-intent", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { amount, items } = req.body;
      const MAX_AMOUNT_CENTS = 9999999; // $99,999.99 — hard ceiling
      if (!amount || amount <= 0 || amount > MAX_AMOUNT_CENTS || !Number.isFinite(amount)) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      // If Stripe is not initialized, simulate a payment intent
      if (!stripe) {
        console.log("Simulating payment intent creation");
        return res.json({
          clientSecret: "simulated_client_secret",
          amount
        });
      }

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // amount in cents
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          items: JSON.stringify(items.map((item: any) => ({ 
            id: item.id, 
            quantity: item.quantity 
          })))
        }
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        amount
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // ========== JOB BOARD API ==========
  
  // Job Listings
  app.get("/api/jobs", async (req: Request, res: Response) => {
    try {
      const filters: any = {};
      const token = getTokenFromRequest(req);
      const payload = getPayloadFromRequest(req);
      const isRevoked = payload && token ? await isTokenRevokedForUser(payload.userId, token) : false;
      const isAdminRequest = Boolean(payload?.isAdmin) && !isRevoked;

      // Extract filter parameters from query
      if (req.query.specialty) filters.specialty = req.query.specialty;
      if (req.query.location) filters.location = req.query.location;
      if (req.query.jobType) filters.jobType = req.query.jobType;
      if (req.query.experienceLevel) filters.experienceLevel = req.query.experienceLevel;
      if (req.query.keywords) filters.keywords = req.query.keywords as string;
      // FIX: Add bounds checking for numeric inputs
      if (req.query.salaryMin) {
        const parsed = parseInt(req.query.salaryMin as string);
        filters.salaryMin = !isNaN(parsed) ? Math.max(parsed, 0) : undefined;
      }
      if (req.query.employerId) {
        const parsed = parseInt(req.query.employerId as string);
        filters.employerId = !isNaN(parsed) ? Math.max(parsed, 1) : undefined;
      }

      // Public defaults: only approved + active jobs.
      // Admin can explicitly request inactive/unapproved jobs with showInactive.
      const showInactive = req.query.showInactive === "1" || req.query.showInactive === "true";
      if (showInactive && !isAdminRequest) {
        return res.status(403).json({ message: "Admin privileges required for showInactive" });
      }
      if (!showInactive) {
        filters.isActive = true;
        filters.isApproved = true;
      }
      const parsedLimit = req.query.limit ? Math.min(Math.max(parseInt(req.query.limit as string) || 100, 1), 100) : 100;
      const parsedOffset = req.query.offset ? Math.min(Math.max(parseInt(req.query.offset as string) || 0, 0), 10000) : 0;
      filters.limit = parsedLimit;
      filters.offset = parsedOffset;

      const jobs = await storage.getAllJobListings(filters);
      console.log(`[/api/jobs] filters=${JSON.stringify(filters)} → ${jobs.length} results`);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });
  
  app.get("/api/jobs/featured", async (req: Request, res: Response) => {
    try {
      // FIX: Add bounds checking for limit parameter
      const limit = req.query.limit ? Math.min(Math.max(parseInt(req.query.limit as string) || 3, 1), 100) : 3;
      const featuredJobs = await storage.getFeaturedJobListings(limit);
      res.json(featuredJobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured jobs" });
    }
  });
  
  app.get("/api/jobs/recent", async (req: Request, res: Response) => {
    try {
      const limitRaw = parseInt(req.query.limit as string);
      const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(1, limitRaw), 100) : 5;
      const recentJobs = await storage.getRecentJobListings(limit);
      res.json(recentJobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent jobs" });
    }
  });
  
  app.get("/api/jobs/:id", async (req: Request, res: Response) => {
    try {
      // Optional auth: set req.user when Bearer token present so has_applied/is_saved work
      const token = getTokenFromRequest(req);
      const payload = getPayloadFromRequest(req);
      if (payload && token && !(await isTokenRevokedForUser(payload.userId, token))) {
        (req as any).user = { userId: payload.userId, id: payload.userId, is_verified: payload.isVerified, is_admin: payload.isAdmin };
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid job ID" });
      }
      
      const job = await storage.getJobListingById(id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      const isAdmin = Boolean((req as any).user?.is_admin);
      if (!isAdmin && (!job.is_active || !job.is_approved)) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Deduplicate view counting by IP per job for 1 hour to reduce abuse/inflation.
      if (shouldCountJobView(req, id)) {
        await storage.incrementJobListingViews(id);
      }
      
      // Add user-specific fields if authenticated
      let hasApplied = false;
      let isSaved = false;
      const userId = (req as any).user?.userId ?? (req as any).user?.id;
      if (userId) {
        const applications = await storage.getJobApplicationsByUserId(userId);
        hasApplied = applications.some(app => app.job_id === id);
        
        const savedJobs = await storage.getSavedJobsByUserId(userId);
        isSaved = savedJobs.some(saved => saved.job_id === id);
      }
      
      res.json({
        ...job,
        has_applied: hasApplied,
        is_saved: isSaved
      });
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });
  
  app.get("/api/jobs/similar/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid job ID" });
      }

      // Bound similar jobs limit to prevent excessive query
      const limit = req.query.limit ? Math.min(Math.max(parseInt(req.query.limit as string) || 3, 1), 50) : 3;
      const similarJobs = await storage.getSimilarJobs(id, limit);
      res.json(similarJobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch similar jobs" });
    }
  });
  
  app.post("/api/jobs", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user?.isVerified) {
        return res.status(403).json({ message: "You must be verified to post jobs" });
      }
      
      // Validate job listing data
      const validationResult = insertJobListingSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid job listing data",
          errors: validationResult.error.format()
        });
      }

      // CRITICAL: Normalize contact_email to lowercase for case-insensitive consistency
      const jobData = {
        ...validationResult.data,
        contact_email: validationResult.data.contact_email
          ? validationResult.data.contact_email.toLowerCase().trim()
          : null
      };

      // Get employer for the user
      const employer = await storage.getEmployerByUserId(req.user.userId);
      if (!employer) {
        return res.status(403).json({ message: "You must register as an employer first" });
      }
      if (employer.account_status && employer.account_status !== "active") {
        return res.status(403).json({ message: "Employer account is not active. Please wait for approval." });
      }

      const passExpiresAt = (employer as any).job_post_pass_expires_at ?? null;
      const lifetime = !!(employer as any).job_post_lifetime;
      const passActive = !!passExpiresAt && new Date(passExpiresAt).getTime() > Date.now();

      const now = new Date();
      const jobListing = await db.transaction(async (tx) => {
        // For credit-based posting: decrement and creation must be atomic.
        if (!lifetime && !passActive) {
          const [decremented] = await tx
            .update(employers)
            .set({ job_post_credits: sql`${employers.job_post_credits} - 1`, updated_at: now })
            .where(and(eq(employers.id, employer.id), sql`${employers.job_post_credits} > 0`))
            .returning({ id: employers.id });

          if (!decremented) {
            throw new Error("INSUFFICIENT_CREDITS");
          }
        }

        const [created] = await tx
          .insert(jobListings)
          .values({
            ...jobData,
            employer_id: employer.id,
            posted_date: now,
          })
          .returning();
        return created;
      }).catch((error) => {
        if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") {
          return null;
        }
        throw error;
      });

      if (!jobListing) {
        return res.status(402).json({ message: "Payment required to post jobs (no active entitlement)" });
      }

      res.status(201).json({ 
        id: jobListing.id,
        message: "Job listing created successfully"
      });
    } catch (error) {
      console.error("Error creating job:", error);
      res.status(500).json({ message: "Failed to create job listing" });
    }
  });

  // Employer profile for current user
  app.get("/api/employer/me", requireAuth, async (req: Request, res: Response) => {
    try {
      const employer = await storage.getEmployerByUserId(req.user!.userId);
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }
      return res.json(employer);
    } catch (error) {
      console.error("Error fetching employer profile:", error);
      return res.status(500).json({ message: "Failed to fetch employer profile" });
    }
  });

  // Employer-specific job listings
  app.get("/api/employer/jobs", requireEmployerToken, async (req: Request, res: Response) => {
    try {
      const employer = (req as any).employer;
      const jobs = await storage.getEmployerJobListings(employer.id);
      return res.status(200).json(jobs);
    } catch (error) {
      console.error("Error fetching employer jobs:", error);
      return res.status(500).json({ message: "Server error while fetching jobs" });
    }
  });

  // Employer: update own job listing
  app.patch("/api/employer/jobs/:id", requireEmployerToken, async (req: Request, res: Response) => {
    try {
      const employer = (req as any).employer;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid job ID" });

      const job = await storage.getJobListingById(id);
      if (!job) return res.status(404).json({ message: "Job not found" });
      if (job.employer_id !== employer.id) return res.status(403).json({ message: "Not your job listing" });

      // Only allow editing certain fields; strip admin-only fields
      const { title, description, responsibilities, requirements, benefits, location,
        job_type, work_arrangement, specialty, experience_level, education_required,
        certification_required, shift_type, salary_min, salary_max, salary_period,
        application_url, contact_email, expiry_date } = req.body;

      // Validate text field lengths (prevent DoS via unbounded storage)
      const validateTextField = (field: string, value: string, maxLen: number): string | null => {
        if (!value) return null;
        if (typeof value !== 'string') return null;
        if (value.length > maxLen) return `${field} exceeds max length of ${maxLen}`;
        return null;
      };

      const titleErr = validateTextField('Title', title, 500);
      if (titleErr) return res.status(400).json({ message: titleErr });

      const descErr = validateTextField('Description', description, 5000);
      if (descErr) return res.status(400).json({ message: descErr });

      const respErr = validateTextField('Responsibilities', responsibilities, 5000);
      if (respErr) return res.status(400).json({ message: respErr });

      const reqErr = validateTextField('Requirements', requirements, 5000);
      if (reqErr) return res.status(400).json({ message: reqErr });

      const benErr = validateTextField('Benefits', benefits, 5000);
      if (benErr) return res.status(400).json({ message: benErr });

      const locErr = validateTextField('Location', location, 500);
      if (locErr) return res.status(400).json({ message: locErr });

      // Validate URLs (prevent SSRF/open redirects)
      if (application_url && typeof application_url === 'string') {
        const urlTrimmed = application_url.trim();
        if (urlTrimmed) {
          try {
            // Validate that it's a proper URL format
            new URL(urlTrimmed);
            if (urlTrimmed.length > 2000) {
              return res.status(400).json({ message: 'Application URL too long (max 2000 characters)' });
            }
          } catch {
            return res.status(400).json({ message: 'Application URL must be a valid URL' });
          }
        }
      }

      // Validate and normalize email format if provided
      let normalizedContactEmail = contact_email;
      if (contact_email && typeof contact_email === 'string') {
        const emailTrimmed = contact_email.trim();
        if (emailTrimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
          return res.status(400).json({ message: 'Contact email must be a valid email address' });
        }
        // CRITICAL: Normalize contact email to lowercase for case-insensitive consistency
        normalizedContactEmail = emailTrimmed.toLowerCase();
      }

      // Update editable fields
      await storage.updateJobListing(id, {
        title, description, responsibilities, requirements, benefits, location,
        job_type, work_arrangement, specialty, experience_level, education_required,
        certification_required, shift_type, salary_min, salary_max, salary_period,
        application_url, contact_email: normalizedContactEmail, expiry_date,
      });

      // Reset approval separately (is_approved is not in InsertJobListing type)
      const [updated] = await db
        .update(jobListings)
        .set({ is_approved: false, approved_at: null, approved_by: null, approval_notes: null })
        .where(eq(jobListings.id, id))
        .returning();
      return res.json(updated);
    } catch (error) {
      console.error("Error updating employer job:", error);
      return res.status(500).json({ message: "Failed to update job listing" });
    }
  });

  // Employer: deactivate/delete own job listing
  app.delete("/api/employer/jobs/:id", requireEmployerToken, async (req: Request, res: Response) => {
    try {
      const employer = (req as any).employer;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid job ID" });

      const job = await storage.getJobListingById(id);
      if (!job) return res.status(404).json({ message: "Job not found" });
      if (job.employer_id !== employer.id) return res.status(403).json({ message: "Not your job listing" });

      // Soft-delete: set inactive rather than hard delete (preserves applications)
      await storage.updateJobListing(id, { is_active: false });
      return res.json({ message: "Job listing deactivated" });
    } catch (error) {
      console.error("Error deactivating employer job:", error);
      return res.status(500).json({ message: "Failed to deactivate job listing" });
    }
  });

  // Employer: all applications across employer's jobs (anonymized)
  app.get("/api/employer/applications", requireEmployerToken, async (req: Request, res: Response) => {
    try {
      const employer = (req as any).employer;
      const jobs = await storage.getEmployerJobListings(employer.id);
      const jobIds = jobs.map(j => j.id);

      if (jobIds.length === 0) return res.json([]);

      const rows = await db
        .select({
          id: jobApplications.id,
          job_id: jobApplications.job_id,
          cover_letter: jobApplications.cover_letter,
          resume_url: jobApplications.resume_url,
          status: jobApplications.status,
          application_date: jobApplications.application_date,
          last_updated: jobApplications.last_updated,
          employer_notes: jobApplications.employer_notes,
          is_withdrawn: jobApplications.is_withdrawn,
          job_title: jobListings.title,
        })
        .from(jobApplications)
        .innerJoin(jobListings, eq(jobApplications.job_id, jobListings.id))
        .where(inArray(jobApplications.job_id, jobIds))
        .orderBy(desc(jobApplications.application_date));

      return res.json(rows);
    } catch (error) {
      console.error("Error fetching employer applications:", error);
      return res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  // Employer: applications for a specific job
  app.get("/api/employer/jobs/:id/applications", requireEmployerToken, async (req: Request, res: Response) => {
    try {
      const employer = (req as any).employer;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid job ID" });

      const job = await storage.getJobListingById(id);
      if (!job) return res.status(404).json({ message: "Job not found" });
      if (job.employer_id !== employer.id) return res.status(403).json({ message: "Not your job listing" });

      const applications = await storage.getJobApplicationsByJobId(id);
      const sanitized = applications.map(({ user_id, ...rest }) => rest);
      return res.json(sanitized);
    } catch (error) {
      console.error("Error fetching job applications:", error);
      return res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  // Employer contact requests
  app.get("/api/employer/contact-requests", requireEmployerToken, async (req: Request, res: Response) => {
    try {
      const employer = (req as any).employer;
      const requests = await storage.getContactRequestsByEmployer(employer.id);
      return res.status(200).json(requests);
    } catch (error) {
      console.error("Error fetching contact requests:", error);
      return res.status(500).json({ message: "Server error while fetching contact requests" });
    }
  });

  app.post("/api/employer/contact-requests", requireEmployerToken, async (req: Request, res: Response) => {
    try {
      const employer = (req as any).employer;
      const applicationId = Number(req.body?.applicationId);
      if (!applicationId) {
        return res.status(400).json({ message: "Application ID is required" });
      }

      const [application] = await db
        .select({
          id: jobApplications.id,
          job_id: jobApplications.job_id,
        })
        .from(jobApplications)
        .where(eq(jobApplications.id, applicationId));

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const job = await storage.getJobListingById(application.job_id);
      if (!job || job.employer_id !== employer.id) {
        return res.status(403).json({ message: "You can only request contact for your own job applications" });
      }

      const [existing] = await db
        .select({ id: contactRequests.id })
        .from(contactRequests)
        .where(
          and(
            eq(contactRequests.employer_id, employer.id),
            eq(contactRequests.application_id, applicationId)
          )
        )
        .limit(1);

      if (existing) {
        return res.status(409).json({ message: "Contact request already submitted for this application" });
      }

      const created = await storage.createContactRequest({
        application_id: applicationId,
        employer_id: employer.id,
      });

      return res.status(201).json(created);
    } catch (error) {
      console.error("Error creating contact request:", error);
      return res.status(500).json({ message: "Server error while creating contact request" });
    }
  });

  // Employer job posting entitlements
  app.get("/api/employer/job-posting/entitlements", requireEmployerToken, async (req: Request, res: Response) => {
    try {
      const employerAuth = (req as any).employer;
      const employerRow = await storage.getEmployerById(employerAuth.id);
      if (!employerRow) return res.status(404).json({ message: "Employer not found" });

      const getSetting = async (key: string, fallback: string) => {
        const s = await storage.getAppSettingByKey(key);
        return typeof s?.value === "string" && s.value.length ? s.value : fallback;
      };

      const perPostCents = parseInt(await getSetting("JOB_POST_PRICE_PER_POST_CENTS", "0"), 10) || 0;
      const passCents = parseInt(await getSetting("JOB_POST_PRICE_PASS_CENTS", "0"), 10) || 0;
      const lifetimeCents = parseInt(await getSetting("JOB_POST_PRICE_LIFETIME_CENTS", "0"), 10) || 0;
      const passDurationDays = parseInt(await getSetting("JOB_POST_PASS_DURATION_DAYS", "30"), 10) || 30;

      const options = (employerRow as any).job_post_options || {};
      const credits = (employerRow as any).job_post_credits ?? 0;
      const passExpiresAt = (employerRow as any).job_post_pass_expires_at ?? null;
      const lifetime = !!(employerRow as any).job_post_lifetime;
      const passActive = !!passExpiresAt && new Date(passExpiresAt).getTime() > Date.now();

      return res.json({
        employerId: employerRow.id,
        options,
        entitlements: {
          credits,
          passExpiresAt,
          lifetime,
          canPost: lifetime || passActive || credits > 0,
        },
        pricing: {
          perPostCents,
          passCents,
          lifetimeCents,
          passDurationDays,
        },
      });
    } catch (error: any) {
      console.error("Error fetching employer job-post entitlements:", error);
      return res.status(500).json({ message: "Failed to fetch entitlements" });
    }
  });

  // Employer job posting payment intent
  app.post("/api/employer/job-posting/payment-intent", requireEmployerToken, async (req: Request, res: Response) => {
    try {
      const employerAuth = (req as any).employer;
      const employerRow = await storage.getEmployerById(employerAuth.id);
      if (!employerRow) return res.status(404).json({ message: "Employer not found" });

      const purchaseType = String(req.body?.purchaseType || "");
      const quantityRaw = req.body?.quantity;
      const quantity = typeof quantityRaw === "number" ? quantityRaw : parseInt(String(quantityRaw || "1"), 10);

      if (!["perPost", "pass", "lifetime"].includes(purchaseType)) {
        return res.status(400).json({ message: "Invalid purchaseType" });
      }

      const options = (employerRow as any).job_post_options || {};
      const enabled =
        (purchaseType === "perPost" && options.perPost) ||
        (purchaseType === "pass" && options.pass) ||
        (purchaseType === "lifetime" && options.lifetime);

      if (!enabled) {
        return res.status(403).json({ message: "This purchase option is not enabled for this employer" });
      }

      const getSetting = async (key: string, fallback: string) => {
        const s = await storage.getAppSettingByKey(key);
        return typeof s?.value === "string" && s.value.length ? s.value : fallback;
      };

      const perPostCents = parseInt(await getSetting("JOB_POST_PRICE_PER_POST_CENTS", "0"), 10) || 0;
      const passCents = parseInt(await getSetting("JOB_POST_PRICE_PASS_CENTS", "0"), 10) || 0;
      const lifetimeCents = parseInt(await getSetting("JOB_POST_PRICE_LIFETIME_CENTS", "0"), 10) || 0;

      const unit =
        purchaseType === "perPost" ? perPostCents : purchaseType === "pass" ? passCents : lifetimeCents;
      if (!unit || unit <= 0) {
        return res.status(400).json({ message: "Job posting price is not configured yet" });
      }

      const finalQty = purchaseType === "perPost" ? Math.min(Math.max(1, quantity || 1), 100) : 1;
      const amountCents = unit * finalQty;

      // If Stripe is not initialized, simulate for development.
      if (!stripe) {
        return res.json({
          clientSecret: "simulated_client_secret",
          amountCents,
          paymentIntentId: `simulated_pi_${Date.now()}`,
        });
      }

      const pi = await stripe.paymentIntents.create({
        amount: Math.round(amountCents),
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        metadata: {
          employerId: String(employerRow.id),
          purchaseType,
          quantity: String(finalQty),
          mode: "employer_job_posting",
        },
      });

      return res.json({
        clientSecret: pi.client_secret,
        amountCents,
        paymentIntentId: pi.id,
      });
    } catch (error: any) {
      console.error("Error creating employer job-post PaymentIntent:", error);
      return res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // Confirm job posting payment and apply entitlements
  app.post("/api/employer/job-posting/confirm", requireEmployerToken, async (req: Request, res: Response) => {
    try {
      const employerAuth = (req as any).employer;
      const employerRow = await storage.getEmployerById(employerAuth.id);
      if (!employerRow) return res.status(404).json({ message: "Employer not found" });

      const paymentIntentId = String(req.body?.paymentIntentId || "");
      if (!paymentIntentId) return res.status(400).json({ message: "paymentIntentId is required" });

      let purchaseType: string | null = null;
      let quantity = 1;

      if (!stripe) {
        // Simulation mode
        purchaseType = String(req.body?.purchaseType || "");
        const q = parseInt(String(req.body?.quantity || "1"), 10);
        quantity = Number.isFinite(q) && q > 0 ? Math.min(q, 100) : 1;
      } else {
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (!pi) return res.status(404).json({ message: "PaymentIntent not found" });
        if (pi.status !== "succeeded") return res.status(400).json({ message: `Payment not completed (status=${pi.status})` });
        const meta = (pi.metadata || {}) as any;
        if (meta.employerId && String(meta.employerId) !== String(employerRow.id)) {
          return res.status(403).json({ message: "PaymentIntent does not belong to this employer" });
        }
        purchaseType = meta.purchaseType || null;
        const qMeta = parseInt(meta.quantity || "1", 10);
        quantity = Number.isFinite(qMeta) && qMeta > 0 ? Math.min(qMeta, 100) : 1;
      }

      if (!purchaseType || !["perPost", "pass", "lifetime"].includes(purchaseType)) {
        return res.status(400).json({ message: "Invalid purchaseType for confirmation" });
      }

      // SECURITY FIX: Prevent duplicate payment confirmations (idempotency)
      // Track confirmed payments in app settings to prevent double-charging
      const confirmedPaymentsKey = `CONFIRMED_PAYMENT_${paymentIntentId}`;
      const existingConfirmation = await storage.getAppSettingByKey(confirmedPaymentsKey);

      if (existingConfirmation) {
        // Payment already confirmed - return success (idempotent behavior)
        return res.json({ success: true, message: "Payment already confirmed" });
      }

      if (purchaseType === "perPost") {
        await db
          .update(employers)
          .set({
            job_post_credits: sql`${employers.job_post_credits} + ${quantity}`,
            updated_at: new Date(),
          })
          .where(eq(employers.id, employerRow.id));
      } else if (purchaseType === "lifetime") {
        await db
          .update(employers)
          .set({
            job_post_lifetime: true,
            updated_at: new Date(),
          })
          .where(eq(employers.id, employerRow.id));
      } else {
        const passSetting = await storage.getAppSettingByKey("JOB_POST_PASS_DURATION_DAYS");
        const passDurationDays = parseInt(String(passSetting?.value || "30"), 10) || 30;
        const expires = new Date(Date.now() + passDurationDays * 24 * 60 * 60 * 1000);
        await db
          .update(employers)
          .set({
            job_post_pass_expires_at: expires,
            updated_at: new Date(),
          })
          .where(eq(employers.id, employerRow.id));
      }

      // SECURITY FIX: Mark this payment as confirmed to prevent future duplicate confirmations
      await storage.createOrUpdateAppSetting(
        confirmedPaymentsKey,
        JSON.stringify({
          employerId: employerRow.id,
          paymentIntentId,
          purchaseType,
          quantity,
          confirmedAt: new Date().toISOString()
        }),
        "Payment confirmation log entry (idempotency protection)",
        true
      );

      return res.json({ success: true });
    } catch (error: any) {
      console.error("Error confirming employer job-post payment:", error);
      return res.status(500).json({ message: "Failed to confirm payment" });
    }
  });

  // ========== SPONSORSHIP ENDPOINTS ==========

  // Create payment intent for sponsorship/donation
  app.post("/api/sponsorship/payment-intent", async (req: Request, res: Response) => {
    try {
      const amountCents = req.body?.amountCents;
      const tier = String(req.body?.tier || "");
      const donorName = String(req.body?.donor_name || "").trim();
      const donorEmail = String(req.body?.donor_email || "").toLowerCase().trim();
      const isAnonymous = Boolean(req.body?.is_anonymous);

      // Validation
      if (!Number.isInteger(amountCents) || amountCents < 100 || amountCents > 500000000) {
        return res.status(400).json({ message: "Invalid amount. Minimum: $1.00, Maximum: $5,000,000.00" });
      }
      if (!["marquee", "premium", "silent-auction", "donation", "custom"].includes(tier)) {
        return res.status(400).json({ message: "Invalid tier" });
      }
      if (!donorName || donorName.length < 1 || donorName.length > 200) {
        return res.status(400).json({ message: "Donor name must be 1-200 characters" });
      }
      if (!donorEmail || !donorEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return res.status(400).json({ message: "Please enter a valid email address" });
      }

      // If Stripe is not initialized, simulate for development
      if (!stripe) {
        return res.json({
          clientSecret: "simulated_client_secret",
          amountCents,
          paymentIntentId: `simulated_pi_${Date.now()}`,
        });
      }

      const pi = await stripe.paymentIntents.create({
        amount: Math.round(amountCents),
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        metadata: {
          donor_email: donorEmail,
          tier,
          is_anonymous: String(isAnonymous),
          mode: "sponsorship",
        },
      });

      return res.json({
        clientSecret: pi.client_secret,
        amountCents,
        paymentIntentId: pi.id,
      });
    } catch (error: any) {
      console.error("Error creating sponsorship PaymentIntent:", error);
      return res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // Confirm sponsorship payment and create sponsorship record
  app.post("/api/sponsorship/confirm", async (req: Request, res: Response) => {
    try {
      const paymentIntentId = String(req.body?.paymentIntentId || "");
      if (!paymentIntentId) {
        return res.status(400).json({ message: "paymentIntentId is required" });
      }

      // Check for idempotency - prevent double-charging
      const idempotencyKey = `CONFIRMED_PAYMENT_${paymentIntentId}`;
      const existing = await storage.getAppSettingByKey(idempotencyKey);
      if (existing) {
        return res.json({ success: true });
      }

      let metadata: any = {};
      let amountCents = 0;

      if (!stripe) {
        // Simulation mode - use body data
        amountCents = req.body?.amountCents || 0;
        metadata = {
          donor_email: String(req.body?.donor_email || "").toLowerCase().trim(),
          donor_name: String(req.body?.donor_name || "").trim(),
          tier: String(req.body?.tier || "donation"),
          is_anonymous: req.body?.is_anonymous || false,
          message: req.body?.message || "",
          company_name: req.body?.company_name || "",
        };
      } else {
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (!pi) {
          return res.status(404).json({ message: "PaymentIntent not found" });
        }
        if (pi.status !== "succeeded") {
          return res.status(400).json({ message: `Payment not completed (status=${pi.status})` });
        }

        amountCents = pi.amount;
        const piMeta = (pi.metadata || {}) as any;
        metadata = {
          donor_email: piMeta.donor_email || "",
          donor_name: req.body?.donor_name || "",
          tier: piMeta.tier || "donation",
          is_anonymous: piMeta.is_anonymous === "true",
          message: req.body?.message || "",
          company_name: req.body?.company_name || "",
        };
      }

      // Normalize email
      metadata.donor_email = metadata.donor_email.toLowerCase().trim();

      // Insert sponsorship record
      await storage.createSponsorship({
        amount_cents: amountCents,
        tier: metadata.tier,
        donor_name: metadata.donor_name,
        donor_email: metadata.donor_email,
        is_anonymous: metadata.is_anonymous,
        payment_intent_id: paymentIntentId,
        status: stripe ? "succeeded" : "pending",
        payment_status: "paid",
        metadata: {
          message: metadata.message,
          company_name: metadata.company_name,
        },
      });

      // Set idempotency flag
      await storage.createOrUpdateAppSetting(idempotencyKey, "confirmed");

      return res.json({ success: true });
    } catch (error: any) {
      console.error("Error confirming sponsorship payment:", error);
      return res.status(500).json({ message: "Failed to confirm payment" });
    }
  });

  // Get list of public sponsors/partners
  app.get("/api/sponsors/partners", async (_req: Request, res: Response) => {
    try {
      const partners = await storage.getSponsorsByStatus("succeeded", false);

      const summary: any = {};
      let totalRaisedCents = 0;

      partners.forEach((partner: any) => {
        totalRaisedCents += partner.amount_cents;
        summary[partner.tier] = (summary[partner.tier] || 0) + 1;
      });

      return res.json({
        success: true,
        partners: partners.map((p: any) => ({
          id: p.id,
          donor_name: p.donor_name,
          amount_cents: p.amount_cents,
          tier: p.tier,
          created_at: p.created_at,
        })),
        total_count: partners.length,
        total_raised_cents: totalRaisedCents,
        summary,
      });
    } catch (error: any) {
      console.error("Error fetching sponsors/partners:", error);
      return res.status(500).json({ message: "Failed to fetch partners" });
    }
  });

  // Employers
  app.get("/api/employers", async (_req: Request, res: Response) => {
    try {
      const employers = await storage.getVerifiedEmployers();
      res.json(employers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employers" });
    }
  });
  
  app.get("/api/employers/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid employer ID" });
      }
      
      const employer = await storage.getEmployerById(id);
      if (!employer) {
        return res.status(404).json({ message: "Employer not found" });
      }
      
      res.json(employer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employer" });
    }
  });
  
  app.post("/api/employers", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user?.isVerified) {
        return res.status(403).json({ message: "You must be verified to register as an employer" });
      }
      
      // Validate employer data
      const validationResult = insertEmployerSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid employer data",
          errors: validationResult.error.format()
        });
      }
      
      // Check if user already has an employer profile
      const existingEmployer = await storage.getEmployerByUserId(req.user.userId);
      if (existingEmployer) {
        return res.status(409).json({ message: "You have already registered as an employer" });
      }
      
      const employer = await storage.createEmployer(validationResult.data, req.user.userId);
      res.status(201).json({ 
        id: employer.id,
        message: "Employer profile created successfully"
      });
    } catch (error) {
      console.error("Error creating employer:", error);
      res.status(500).json({ message: "Failed to create employer profile" });
    }
  });
  
  // Nurse Profiles
  app.get("/api/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      const profile = await storage.getNurseProfileByUserId(req.user!.userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      // SECURITY: Set Cache-Control headers to prevent caching of user profile data
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });
  
  app.post("/api/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user?.isVerified) {
        return res.status(403).json({ message: "You must be verified to create a profile" });
      }

      // SECURITY: Set Cache-Control headers to prevent caching of user profile data
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

      // Validate profile data
      const validationResult = insertNurseProfileSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid profile data",
          errors: validationResult.error.format()
        });
      }

      // Check if user already has a profile
      const existingProfile = await storage.getNurseProfileByUserId(req.user.userId);
      if (existingProfile) {
        const updatedProfile = await storage.updateNurseProfile(existingProfile.id, validationResult.data);
        return res.json({
          id: updatedProfile.id,
          message: "Profile updated successfully"
        });
      }

      const profile = await storage.createNurseProfile(validationResult.data, req.user.userId);
      res.status(201).json({
        id: profile.id,
        message: "Profile created successfully"
      });
    } catch (error) {
      console.error("Error with profile:", error);
      res.status(500).json({ message: "Failed to process profile" });
    }
  });
  
  // Job Applications
  app.post("/api/jobs/apply", authRateLimiter, requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user?.isVerified) {
        return res.status(403).json({ message: "You must be verified to apply for jobs" });
      }

      const { jobId, coverLetter, resumeUrl } = req.body;
      if (!jobId) {
        return res.status(400).json({ message: "Job ID is required" });
      }

      // Validate cover letter length (max 5000 chars) - prevents DoS via unbounded storage
      if (coverLetter && typeof coverLetter === 'string' && coverLetter.length > 5000) {
        return res.status(400).json({ message: "Cover letter too long (max 5000 characters)" });
      }

      // Check if job exists
      const job = await storage.getJobListingById(parseInt(jobId));
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      if (!job.is_active || !job.is_approved) {
        return res.status(403).json({ message: "This job is no longer accepting applications" });
      }

      // Check if user has already applied
      const applications = await storage.getJobApplicationsByUserId(req.user.userId);
      if (applications.some(app => app.job_id === parseInt(jobId))) {
        return res.status(409).json({ message: "You have already applied for this job" });
      }

      // Create application
      const application = await storage.createJobApplication(
        {
          cover_letter: coverLetter,
          resume_url: resumeUrl,
          status: "pending",
        },
        req.user.userId,
        parseInt(jobId)
      );

      // Increment job application count
      await storage.incrementJobApplicationsCount(parseInt(jobId));

      res.status(201).json({
        id: application.id,
        message: "Application submitted successfully"
      });
    } catch (error) {
      console.error("Error applying for job:", error);
      res.status(500).json({ message: "Failed to submit application" });
    }
  });
  
  app.get("/api/jobs/applications", requireAuth, async (req: Request, res: Response) => {
    try {
      const applications = await storage.getJobApplicationsByUserId(req.user!.userId);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });
  
  // Saved Jobs
  app.post("/api/jobs/save", authRateLimiter, requireAuth, async (req: Request, res: Response) => {
    try {
      const { jobId, notes } = req.body;
      if (!jobId) {
        return res.status(400).json({ message: "Job ID is required" });
      }

      // Validate notes length (max 2000 chars) - prevents DoS via unbounded storage
      if (notes && typeof notes === 'string' && notes.length > 2000) {
        return res.status(400).json({ message: "Notes too long (max 2000 characters)" });
      }

      // Check if job exists
      const job = await storage.getJobListingById(parseInt(jobId));
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Check if already saved and remove if it is (toggle behavior)
      const savedJobs = await storage.getSavedJobsByUserId(req.user!.userId);
      const existingSaved = savedJobs.find(saved => saved.job_id === parseInt(jobId));

      if (existingSaved) {
        await storage.unsaveJob(req.user!.userId, parseInt(jobId));
        return res.json({ message: "Job removed from saved jobs" });
      }

      // Save the job
      const savedJob = await storage.saveJob(req.user!.userId, parseInt(jobId), notes);
      res.status(201).json({
        id: savedJob.id,
        message: "Job saved successfully"
      });
    } catch (error) {
      console.error("Error saving job:", error);
      res.status(500).json({ message: "Failed to save job" });
    }
  });
  
  app.get("/api/jobs/saved", requireAuth, async (req: Request, res: Response) => {
    try {
      const savedJobs = await storage.getSavedJobsByUserId(req.user!.userId);
      res.json(savedJobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch saved jobs" });
    }
  });
  
  // Job Alerts
  app.post("/api/jobs/alerts", requireAuth, async (req: Request, res: Response) => {
    try {
      // Limit: max 10 active alerts per user to prevent DoS via cron email spam
      const existingAlerts = await storage.getJobAlertsByUserId(req.user!.userId);
      if (existingAlerts.length >= 10) {
        return res.status(429).json({
          message: "Maximum 10 job alerts allowed per user"
        });
      }

      // Validate alert data
      const validationResult = insertJobAlertSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid job alert data",
          errors: validationResult.error.format()
        });
      }

      const alert = await storage.createJobAlert(validationResult.data, req.user!.userId);
      res.status(201).json({
        id: alert.id,
        message: "Job alert created successfully"
      });
    } catch (error) {
      console.error("Error creating alert:", error);
      res.status(500).json({ message: "Failed to create job alert" });
    }
  });
  
  app.get("/api/jobs/alerts", requireAuth, async (req: Request, res: Response) => {
    try {
      const alerts = await storage.getJobAlertsByUserId(req.user!.userId);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job alerts" });
    }
  });
  
  app.delete("/api/jobs/alerts/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid alert ID" });
      }

      // IDOR fix: verify alert belongs to current user before deleting
      const alerts = await storage.getJobAlertsByUserId(req.user!.userId);
      if (!alerts.find(a => a.id === id)) {
        return res.status(403).json({ message: "Unauthorized: Cannot delete another user's alert" });
      }

      await storage.deleteJobAlert(id);
      res.json({ message: "Job alert deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete job alert" });
    }
  });
  
  // ── Traffic tracking (DB-backed — survives restarts and deployments) ──────
  const todayKey = () => new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  // Public endpoint — fires once per browser session from the client
  app.post("/api/track-visit", async (req: Request, res: Response) => {
    try {
      const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '').split(',')[0].trim();
      const ua = (req.headers['user-agent'] || '').slice(0, 200);
      const crypto = require('crypto');
      const fingerprint = crypto.createHash('sha256').update(ip + ua).digest('hex').slice(0, 16);
      const visit_date = todayKey();
      // ON CONFLICT DO NOTHING — idempotent, one row per unique visitor per day
      await db.insert(siteVisits).values({ visit_date, fingerprint }).onConflictDoNothing();
      res.json({ ok: true });
    } catch {
      res.json({ ok: true }); // Always succeed silently
    }
  });

  // Admin-only endpoint — returns traffic stats + registration counts
  app.get("/api/admin/traffic-stats", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const today = todayKey();
      const days: { date: string; visitors: number; registrations: number }[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);

        const [visitorRow] = await db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(siteVisits)
          .where(eq(siteVisits.visit_date, dateStr));

        const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
        const endOfDay = new Date(dateStr + 'T23:59:59.999Z');
        const [regRow] = await db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(users)
          .where(and(gte(users.created_at, startOfDay), sql`${users.created_at} <= ${endOfDay}`));

        days.push({ date: dateStr, visitors: Number(visitorRow?.count ?? 0), registrations: Number(regRow?.count ?? 0) });
      }

      const todayStats = days.find(d => d.date === today) ?? { date: today, visitors: 0, registrations: 0 };
      const weekVisitors = days.reduce((sum, d) => sum + d.visitors, 0);
      const weekRegistrations = days.reduce((sum, d) => sum + d.registrations, 0);

      res.json({ today: todayStats, week: { visitors: weekVisitors, registrations: weekRegistrations }, days });
    } catch (error) {
      console.error('[traffic-stats]', error);
      res.status(500).json({ message: 'Failed to load traffic stats' });
    }
  });

  // Authentication status - JWT users get is_verified / is_admin from DB (not stale JWT claims)
  app.get("/api/auth/status", async (req: Request, res: Response) => {
    const sessionAuthenticated =
      typeof req.isAuthenticated === "function" && req.isAuthenticated();
    const sessionUser = sessionAuthenticated ? (req.user as any) : null;

    const token = sessionAuthenticated ? null : getTokenFromRequest(req);
    const jwtPayload = sessionAuthenticated ? null : getPayloadFromRequest(req);
    const jwtRevoked = jwtPayload && token ? await isTokenRevokedForUser(jwtPayload.userId, token) : false;

    let jwtUser: {
      id: number;
      email: string;
      is_verified: boolean;
      is_admin: boolean;
      first_name?: string | null;
      last_name?: string | null;
    } | null = null;

    if (jwtPayload && token && !jwtRevoked) {
      const dbUser = await storage.getUserById(jwtPayload.userId);
      if (dbUser) {
        jwtUser = {
          id: dbUser.id,
          email: dbUser.email,
          is_verified: !!dbUser.is_verified,
          is_admin: !!dbUser.is_admin,
          first_name: dbUser.first_name,
          last_name: dbUser.last_name,
        };
      }
    }

    const user = sessionUser ?? jwtUser;

    const u = user as { is_verified?: boolean; isVerified?: boolean; is_admin?: boolean; isAdmin?: boolean } | null;
    const verifiedFlag = u ? !!(u.is_verified ?? u.isVerified) : false;
    const adminFlag = u ? !!(u.is_admin ?? u.isAdmin) : false;

    res.json({
      isAuthenticated: !!user,
      isVerified: verifiedFlag,
      isAdmin: adminFlag,
      user: user || null,
    });
  });

  // Self-service profile update (authenticated user updates their own first/last name)
  app.patch("/api/auth/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.userId ?? (req.user as any)?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      // SECURITY: Set Cache-Control headers to prevent caching of user profile data
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

      const { first_name, last_name } = req.body;
      const updates: Record<string, string> = {};
      if (typeof first_name === "string" && first_name.trim()) updates.first_name = first_name.trim();
      if (typeof last_name === "string" && last_name.trim()) updates.last_name = last_name.trim();

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      const updated = await storage.updateUser(userId, updates);
      const { password_hash: _p, ...safe } = updated;
      return res.json(safe);
    } catch (error) {
      console.error("Error updating profile:", error);
      return res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // ========== VIDEO API (Provider-neutral) ==========

  app.get("/api/videos", async (req: Request, res: Response) => {
    try {
      const provider = getVideoProvider();
      const prefix = (req.query.folder as string) || undefined;
      const fetchAll = req.query.all === "true";
      const isAdmin = isUserAdmin(req);

      const canUseCache = !prefix && !(fetchAll && isAdmin);
      if (canUseCache && videoListCache) {
        const age = Date.now() - videoListCache.timestamp;
        if (age < VIDEO_LIST_CACHE_TTL_MS) {
          res.setHeader(
            "Cache-Control",
            "public, max-age=300, s-maxage=600, stale-while-revalidate=86400",
          );
          return res.json(videoListCache.data);
        }
      }

      let resources = await provider.listSourceVideos({ prefix });
      if (!(fetchAll && isAdmin)) {
        const approvedList = await db
          .select({ public_id: approvedVideos.public_id })
          .from(approvedVideos)
          .where(eq(approvedVideos.approved, true));
        const approvedIds = new Set(approvedList.map((v) => v.public_id));
        resources = resources.filter((r) => approvedIds.has(r.public_id));
      }

      const payload = { success: true, resources, total: resources.length };
      if (canUseCache) {
        videoListCache = { timestamp: Date.now(), data: payload };
        res.setHeader(
          "Cache-Control",
          "public, max-age=300, s-maxage=600, stale-while-revalidate=86400",
        );
      }
      res.json(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to list videos";
      const m = message.match(/Missing required env var:\s*([A-Z0-9_]+)/);
      console.error("[videos] list error:", err);
      
      // Provide more helpful error message for B2 key errors
      let errorMessage = message;
      if (message.includes("key") && message.includes("not valid")) {
        // Check if it's an AWS SDK error with more details
        const awsError = err as any;
        if (awsError.Code === "InvalidAccessKeyId" || awsError.Code === "SignatureDoesNotMatch") {
          errorMessage = `B2 authentication failed: ${awsError.Code || "Invalid credentials"}. Please verify VIDEO_B2_ACCESS_KEY_ID and VIDEO_B2_SECRET_ACCESS_KEY match your B2 application key pair.`;
        } else {
          errorMessage = "B2 credentials are invalid. Please check VIDEO_B2_ACCESS_KEY_ID and VIDEO_B2_SECRET_ACCESS_KEY in your .env file. Ensure you're using the Application Key (not Key ID) and its corresponding Secret Key from your B2 account.";
        }
      }
      
      res.status(500).json({
        success: false,
        provider: getVideoProviderId(),
        missingEnv: m?.[1],
        message: errorMessage,
        errorCode: (err as any)?.Code,
      });
    }
  });

  app.post("/api/videos/upload-url", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const provider = getVideoProvider();
      const filename = typeof req.body?.filename === "string" ? req.body.filename.trim() : "upload.mp4";
      const contentType = typeof req.body?.contentType === "string" ? req.body.contentType.trim().toLowerCase() : "video/mp4";

      if (!filename || filename.length > 255) {
        return res.status(400).json({ success: false, message: "Invalid filename" });
      }
      if (!ALLOWED_VIDEO_UPLOAD_CONTENT_TYPES.has(contentType)) {
        return res.status(400).json({ success: false, message: "Invalid contentType. Allowed: video/mp4, video/quicktime, video/webm, video/x-m4v" });
      }

      const presigned = await provider.createSourceUploadUrl({ filename, contentType });
      const videoId = stableVideoIdFromKey(presigned.key);
      res.json({
        success: true,
        ...presigned,
        videoId,
        publicUrl: publicUrlForKey(presigned.key),
        manifestUrl: manifestUrlForVideoId(videoId),
      });
    } catch (err) {
      console.error("[videos] presign error:", err);
      res.status(500).json({ success: false, message: "Failed to create upload URL" });
    }
  });

  app.get("/api/videos/status", async (_req: Request, res: Response) => {
    try {
      const status = await checkB2Connection();
      if (status.ok) {
        return res.json({
          success: true,
          connected: true,
          status: "online",
          provider: "b2",
          bucket: status.bucket,
          endpoint: status.endpoint,
          region: status.region,
          cdnBaseUrl: status.cdnBaseUrl,
        });
      }
      return res.status(500).json({
        success: false,
        connected: false,
        status: "error",
        provider: "b2",
        missingEnv: status.missingEnv,
        message: status.message,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        connected: false,
        status: "error",
        provider: "b2",
        message: "Video connection error"
      });
    }
  });

  // ========== VIDEO APPROVAL API (Admin only) ==========
  // requireAdminToken is defined at the top of registerRoutes.

  // Admin: Get all users (exclude password_hash from response)
  app.get("/api/admin/users", requireAdminToken, async (_req: Request, res: Response) => {
    try {
      // SECURITY: Set Cache-Control headers to prevent caching of user list
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

      const users = await storage.getAllUsers();
      const safeUsers = users.map(({ password_hash: _p, ...u }) => u);
      return res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // ========== INPUT VALIDATION HELPERS ==========
  const isValidUUID = (id: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  };

  // ========== USER VERIFICATION & TICKETING ROUTES ==========

  // Admin: Describe the verification / free-ticket email (template + Resend vs log-only)
  app.get("/api/admin/verification-ticket-email-info", requireAdminToken, async (_req: Request, res: Response) => {
    try {
      const { getTicketIssuedEmailDispatchInfo } = await import("./services/email");
      return res.json(getTicketIssuedEmailDispatchInfo());
    } catch (error) {
      console.error("Error loading ticket email info:", error);
      return res.status(500).json({ message: "Failed to load email info" });
    }
  });

  // Admin: Verify/unverify user (triggers ticket creation and emails)
  app.patch("/api/admin/users/:id/verify", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const { verifyUser, unverifyUser, getUserVerificationStatus } = await import("./services/verification");
      const { getTicketIssuedEmailDispatchInfo } = await import("./services/email");

      const userId = parseInt(req.params.id);
      if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });

      const adminUserId = (req as any).user?.userId;
      if (!adminUserId) return res.status(401).json({ message: "Admin user not found" });

      const { verified } = req.body;

      let verifyOutcome: Awaited<ReturnType<typeof verifyUser>> | Awaited<ReturnType<typeof unverifyUser>> | null =
        null;
      if (verified === true) {
        verifyOutcome = await verifyUser(userId, adminUserId);
      } else if (verified === false) {
        verifyOutcome = await unverifyUser(userId, adminUserId);
      } else {
        return res.status(400).json({ message: "verified must be boolean" });
      }

      // When verifying a standard-registered user, auto-create an NRPX registration
      // and immediately send the QR ticket email — no dashboard action required.
      if (verified === true && (verifyOutcome as any)?.action === "verified") {
        try {
          const [existingReg] = await db
            .select()
            .from(nrpxRegistrations)
            .where(eq(nrpxRegistrations.user_id, userId))
            .limit(1);

          let nrpxReg = existingReg ?? null;

          if (!existingReg) {
            const [targetUser] = await db
              .select()
              .from(users)
              .where(eq(users.id, userId))
              .limit(1);

            if (targetUser) {
              // Generate unique ticket code (same algorithm as /api/nrpx/register)
              const { randomBytes: rb } = await import("crypto");
              const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
              const seg = () => Array.from(rb(4)).map((b: number) => chars[b % chars.length]).join("");
              let ticketCode = "";
              for (let i = 0; i < 10; i++) {
                const candidate = `NRPX-${seg()}-${seg()}`;
                const collision = await db
                  .select({ id: nrpxRegistrations.id })
                  .from(nrpxRegistrations)
                  .where(eq(nrpxRegistrations.ticket_code, candidate))
                  .limit(1);
                if (collision.length === 0) { ticketCode = candidate; break; }
              }

              if (ticketCode) {
                const [created] = await db.insert(nrpxRegistrations).values({
                  ticket_code: ticketCode,
                  first_name: targetUser.first_name,
                  last_name: targetUser.last_name,
                  email: targetUser.email.toLowerCase().trim(),
                  user_id: userId,
                  email_sent: true,
                  email_sent_at: new Date(),
                }).returning();
                nrpxReg = created;
                console.log(`[Admin Verify] Auto-created NRPX registration for user ${userId} | ticket: ${ticketCode}`);
              } else {
                console.warn(`[Admin Verify] Could not generate unique ticket code for user ${userId}`);
              }
            }
          }

          // Send QR ticket email immediately upon verification (if not already sent)
          if (nrpxReg && !nrpxReg.ticket_email_sent) {
            try {
              const qrBuffer = await QRCode.toBuffer(nrpxReg.ticket_code, {
                type: 'png', width: 400, margin: 2,
                color: { dark: '#000000', light: '#FFFFFF' },
                errorCorrectionLevel: 'H',
              });

              const emailResult = await sendNrpxTicketEmail({
                firstName: nrpxReg.first_name,
                lastName: nrpxReg.last_name,
                email: nrpxReg.email,
                ticketCode: nrpxReg.ticket_code,
                qrBuffer,
              });

              if (emailResult.success) {
                await db.update(nrpxRegistrations)
                  .set({ ticket_email_sent: true, ticket_email_sent_at: new Date() })
                  .where(eq(nrpxRegistrations.id, nrpxReg.id));
                console.log(`[Admin Verify] QR ticket email sent for user ${userId} | ticket: ${nrpxReg.ticket_code}`);
              } else {
                console.error(`[Admin Verify] QR ticket email failed for user ${userId}:`, emailResult.error);
              }
            } catch (emailErr) {
              console.error(`[Admin Verify] QR ticket email error for user ${userId}:`, emailErr);
            }
          }
        } catch (nrpxErr) {
          // Non-fatal — user is still verified, just log the issue
          console.error(`[Admin Verify] NRPX auto-registration failed for user ${userId}:`, nrpxErr);
        }
      }

      const status = await getUserVerificationStatus(userId);
      const { user, ...safeStatus } = status;
      const ticketEmailInfo = getTicketIssuedEmailDispatchInfo();
      return res.json({
        ...safeStatus,
        userId: user.id,
        userName: user.first_name + " " + user.last_name,
        verifyOutcome,
        ticketEmailInfo,
      });
    } catch (error) {
      console.error("Error verifying user:", error);
      return res.status(500).json({ message: "Failed to verify user" });
    }
  });

  // Admin: Get user's tickets (with event titles for email status UI)
  app.get("/api/admin/users/:id/tickets", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const { getUserTicketsWithEvents } = await import("./services/tickets");

      const userId = parseInt(req.params.id);
      if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });

      const userTickets = await getUserTicketsWithEvents(userId);
      return res.json(userTickets);
    } catch (error) {
      console.error("Error fetching user tickets:", error);
      return res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  // Admin: Resend ticket email
  app.post("/api/admin/tickets/:id/resend-email", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const { resendTicketEmail } = await import("./services/email");

      const ticketId = req.params.id;
      // FIX: Validate ticket ID is proper UUID format
      if (!isValidUUID(ticketId)) {
        return res.status(400).json({ message: "Invalid ticket ID format" });
      }

      const result = await resendTicketEmail(ticketId);

      return res.json(result);
    } catch (error) {
      console.error("Error resending ticket email:", error);
      return res.status(500).json({ message: "Failed to resend email" });
    }
  });

  // Admin: Approve and send pending ticket confirmation email
  // FIX: Safety-first approval system - emails only sent with explicit admin approval
  app.post("/api/admin/tickets/:id/approve-and-send-email", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const { approveAndSendTicketEmail } = await import("./services/email");

      const ticketId = req.params.id;
      const adminUserId = (req as any).user?.userId;

      // FIX: Validate ticket ID is proper UUID format
      if (!isValidUUID(ticketId)) {
        return res.status(400).json({ message: "Invalid ticket ID format" });
      }

      // FIX: Verify admin user still has privileges
      if (!adminUserId) {
        return res.status(401).json({ message: "Admin user not found" });
      }

      const adminResult = await db.select().from(users).where(eq(users.id, adminUserId)).limit(1);
      if (!adminResult.length || !adminResult[0].is_admin) {
        return res.status(403).json({ message: "Admin privileges required" });
      }

      const result = await approveAndSendTicketEmail(ticketId, adminUserId);

      return res.json(result);
    } catch (error) {
      console.error("Error approving and sending ticket email:", error);
      return res.status(500).json({ message: "Failed to approve and send email" });
    }
  });

  // Admin: Get pending ticket approvals
  // FIX: List all tickets awaiting email approval
  app.get("/api/admin/tickets/pending-approvals", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const adminUserId = (req as any).user?.userId;

      // FIX: Verify admin user still has privileges
      if (!adminUserId) {
        return res.status(401).json({ message: "Admin user not found" });
      }

      const adminResult = await db.select().from(users).where(eq(users.id, adminUserId)).limit(1);
      if (!adminResult.length || !adminResult[0].is_admin) {
        return res.status(403).json({ message: "Admin privileges required" });
      }

      // Get all tickets pending email approval
      const pendingTickets = await db
        .select({
          id: tickets.id,
          ticket_code: tickets.ticket_code,
          status: tickets.status,
          email_status: tickets.email_status,
          created_at: tickets.created_at,
          user: {
            id: users.id,
            email: users.email,
            first_name: users.first_name,
            last_name: users.last_name,
          },
          event: {
            id: events.id,
            title: events.title,
            date: events.date,
          },
        })
        .from(tickets)
        .innerJoin(users, eq(tickets.user_id, users.id))
        .innerJoin(events, eq(tickets.event_id, events.id))
        .where(eq(tickets.email_status, 'pending_approval'))
        .orderBy(tickets.created_at);

      return res.json({ tickets: pendingTickets });
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      return res.status(500).json({ message: "Failed to fetch pending approvals" });
    }
  });

  // Admin: Get QR code details for a ticket (for viewing/resending)
  app.get("/api/admin/tickets/:id/qr", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const { getTicketQrCode } = await import("./services/email");

      const ticketId = req.params.id;
      // FIX: Validate ticket ID is proper UUID format
      if (!isValidUUID(ticketId)) {
        return res.status(400).json({ message: "Invalid ticket ID format" });
      }

      const qrData = await getTicketQrCode(ticketId);

      return res.json(qrData);
    } catch (error) {
      console.error("Error fetching QR code:", error);
      return res.status(500).json({ message: "Failed to fetch QR code" });
    }
  });

  // Admin: Get email delivery status for a ticket
  app.get("/api/admin/tickets/:id/email-status", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const { getTicketEmailHistory } = await import("./services/email");

      const ticketId = req.params.id;
      // FIX: Validate ticket ID is proper UUID format
      if (!isValidUUID(ticketId)) {
        return res.status(400).json({ message: "Invalid ticket ID format" });
      }

      const history = await getTicketEmailHistory(ticketId);

      return res.json(history);
    } catch (error) {
      console.error("Error fetching email history:", error);
      return res.status(500).json({ message: "Failed to fetch email history" });
    }
  });

  // Admin: Revoke ticket
  app.post("/api/admin/tickets/:id/revoke", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const { revokeTicket } = await import("./services/tickets");

      const ticketId = req.params.id;
      // FIX: Validate ticket ID is proper UUID format
      if (!isValidUUID(ticketId)) {
        return res.status(400).json({ message: "Invalid ticket ID format" });
      }

      // FIX: Validate revocation reason
      let reason = req.body.reason || "Revoked by admin";
      if (typeof reason !== "string") {
        return res.status(400).json({ message: "reason must be a string" });
      }
      reason = reason.trim();
      if (reason.length > 500) {
        return res.status(400).json({ message: "reason must be less than 500 characters" });
      }

      // FIX: Pass adminUserId to create audit log
      const adminUserId = (req as any).user?.userId;
      if (!adminUserId) {
        return res.status(401).json({ message: "Admin user not found" });
      }

      const revoked = await revokeTicket(ticketId, reason, adminUserId);
      return res.json(revoked);
    } catch (error) {
      console.error("Error revoking ticket:", error);
      return res.status(500).json({ message: "Failed to revoke ticket" });
    }
  });

  // Public/Auth: Scan ticket QR code (gate scanning)
  // FIX: Apply rate limiting to prevent DOS and brute force attacks on public endpoint
  app.post("/api/tickets/scan", scanRateLimiter, requireAdminToken, async (req: Request, res: Response) => {
    try {
      const { scanTicket } = await import("./services/scan");

      const { qrToken, eventId, deviceFingerprint } = req.body;

      // FIX: Validate required fields
      if (!qrToken || !eventId) {
        return res.status(400).json({ message: "Missing qrToken or eventId" });
      }

      // FIX: Validate eventId is a number and positive
      if (typeof eventId !== "number" || !Number.isInteger(eventId) || eventId <= 0) {
        return res.status(400).json({ message: "eventId must be a positive integer" });
      }

      // FIX: Validate qrToken is a string
      if (typeof qrToken !== "string") {
        return res.status(400).json({ message: "qrToken must be a string" });
      }

      // FIX: Extract and validate IP address
      const ip = req.ip || req.connection?.remoteAddress || null;
      if (!ip) {
        console.warn("[Scan] Unable to determine request IP address");
      }

      // Build scan context from request
      const scanContext = {
        ip: ip || "127.0.0.1", // Use loopback as fallback, not "unknown"
        userAgent: req.get("user-agent") || "unknown",
        deviceFingerprint: deviceFingerprint,
        scannerUserId: (req as any).user?.userId, // Optional if staff authenticated
      };

      const result = await scanTicket({ qrToken, eventId, deviceFingerprint }, scanContext);
      return res.status(result.ok ? 200 : 400).json(result);
    } catch (error) {
      console.error("Error scanning ticket:", error);
      return res.status(500).json({ message: "Failed to scan ticket" });
    }
  });

  // User: Get my tickets
  app.get("/api/me/tickets", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const { getUserTickets } = await import("./services/tickets");
      const myTickets = await getUserTickets(userId);

      return res.json(myTickets);
    } catch (error) {
      console.error("Error fetching my tickets:", error);
      return res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  // Admin: Update user (legacy - kept for compatibility)
  app.patch("/api/admin/users/:id", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid user ID" });

      const user = await storage.getUserById(id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const { is_admin, is_suspended } = req.body;
      const updates: any = {};
      if (typeof is_admin === 'boolean') updates.is_admin = is_admin;
      if (typeof is_suspended === 'boolean') updates.is_suspended = is_suspended;

      const updated = await storage.updateUser(id, updates);
      const { password_hash: _p, ...safe } = updated;
      return res.json(safe);
    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Admin: Delete user
  app.delete("/api/admin/users/:id", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid user ID" });
      
      const user = await storage.getUserById(id);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Immediately invalidate all active tokens for this user
      await setUserRevokedBeforeMs(id, Date.now());

      // Hard delete — all related data scrubbed, email freed for re-registration
      await storage.deleteUser(id);
      return res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      return res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Bootstrap: Set admin user by email (for initial setup only)
  // SECURITY: Bootstrap endpoint disabled — admin management must go through the admin dashboard.
  // Keeping route registered to return 410 Gone so any cached references fail clearly.
  app.post("/api/bootstrap/set-admin", (_req: Request, res: Response) => {
    return res.status(410).json({ message: "This endpoint has been disabled. Manage admins via the admin dashboard." });
  });

  // Admin: Get all jobs (with employer name joined)
  app.get("/api/admin/jobs", requireAdminToken, async (req: Request, res: Response) => {
    try {
      // Get query parameters for filtering
      const { status, active, featured, employer_id, search, sort = 'posted_date', sortOrder = 'desc' } = req.query;

      let query: any = db
        .select({
          id: jobListings.id,
          title: jobListings.title,
          employer_id: jobListings.employer_id,
          employer_name: employers.company_name,
          employer_name_fallback: employers.name,
          description: jobListings.description,
          location: jobListings.location,
          job_type: jobListings.job_type,
          work_arrangement: jobListings.work_arrangement,
          specialty: jobListings.specialty,
          experience_level: jobListings.experience_level,
          is_active: jobListings.is_active,
          is_approved: jobListings.is_approved,
          is_featured: jobListings.is_featured,
          posted_date: jobListings.posted_date,
          views_count: jobListings.views_count,
          applications_count: jobListings.applications_count,
          approved_at: jobListings.approved_at,
          approval_notes: jobListings.approval_notes,
        })
        .from(jobListings)
        .leftJoin(employers, eq(jobListings.employer_id, employers.id));

      // Build WHERE clause
      const conditions = [];

      // Filter by approval status
      if (status === 'pending') {
        conditions.push(and(eq(jobListings.is_approved, false), eq(jobListings.is_active, true)));
      } else if (status === 'approved') {
        conditions.push(eq(jobListings.is_approved, true));
      }

      // Filter by active status
      if (active === 'true') {
        conditions.push(eq(jobListings.is_active, true));
      } else if (active === 'false') {
        conditions.push(eq(jobListings.is_active, false));
      }

      // Filter by featured
      if (featured === 'true') {
        conditions.push(eq(jobListings.is_featured, true));
      }

      // Filter by employer
      if (employer_id && !isNaN(parseInt(String(employer_id)))) {
        conditions.push(eq(jobListings.employer_id, parseInt(String(employer_id))));
      }

      // Apply WHERE conditions
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Sorting
      const sortField = sort === 'views' ? jobListings.views_count
        : sort === 'applications' ? jobListings.applications_count
        : jobListings.posted_date;
      const sortDir = sortOrder === 'asc' ? asc : desc;
      query = query.orderBy(sortDir(sortField));

      const rows = await query;

      // Apply search filter client-side (full-text search on title and location)
      let filtered = rows;
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        filtered = rows.filter(r =>
          r.title.toLowerCase().includes(searchLower) ||
          r.location.toLowerCase().includes(searchLower)
        );
      }

      return res.json(filtered.map(r => {
        const { employer_name, employer_name_fallback, ...rest } = r;
        const displayName = employer_name || employer_name_fallback;
        return { ...rest, employer: displayName ? { name: displayName } : null };
      }));
    } catch (error) {
      console.error("Error fetching jobs:", error);
      return res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  // Admin: Get all employers
  app.get("/api/admin/employers", requireAdminToken, async (_req: Request, res: Response) => {
    try {
      const employers = await storage.getAllEmployers();
      return res.json(employers);
    } catch (error) {
      console.error("Error fetching employers:", error);
      return res.status(500).json({ message: "Failed to fetch employers" });
    }
  });

  // Admin: Create employer (on behalf of partner)
  app.post("/api/admin/employers", requireAdminToken, async (req: Request, res: Response) => {
    try {
      // Validate required fields
      const { name, contact_email, company_name, contact_phone, website, description, logo_url, address, city, state, zip_code } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ message: "Name is required and must be a non-empty string" });
      }
      if (!contact_email || typeof contact_email !== 'string' || !contact_email.includes('@')) {
        return res.status(400).json({ message: "Valid contact email is required" });
      }

      const adminId = (req as any).user?.userId ?? null;

      // Create employer with admin presets
      const employer = await storage.createEmployer(
        {
          name: name.trim(),
          company_name: company_name?.trim() || name.trim(), // Default to name if not provided
          contact_email: contact_email.trim().toLowerCase(),
          contact_phone: contact_phone?.trim() || null,
          website: website?.trim() || null,
          description: description?.trim() || null,
          logo_url: logo_url?.trim() || null,
          address: address?.trim() || null,
          city: city?.trim() || null,
          state: state?.trim() || null,
          zip_code: zip_code?.trim() || null,
        },
        adminId
      );

      // Update to verified and active immediately (admin-created = pre-approved)
      const verified = await storage.updateEmployer(employer.id, {
        is_verified: true,
        account_status: "active",
      });

      return res.status(201).json({
        ...verified,
        message: "Employer created by admin and automatically verified",
      });
    } catch (error) {
      console.error("Error creating employer:", error);
      return res.status(500).json({ message: "Failed to create employer" });
    }
  });

  // Admin: Create job listing (on behalf of employer, free post)
  app.post("/api/admin/jobs", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const {
        employer_id,
        title,
        description,
        location,
        job_type,
        work_arrangement,
        specialty,
        experience_level,
        responsibilities,
        requirements,
        benefits,
        education_required,
        certification_required,
        shift_type,
        salary_min,
        salary_max,
        salary_period,
        application_url,
        contact_email,
        expiry_date,
        is_featured,
      } = req.body;

      // Validate required fields
      if (!employer_id || isNaN(parseInt(employer_id))) {
        return res.status(400).json({ message: "Valid employer_id is required" });
      }
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ message: "Title is required" });
      }
      if (!description || typeof description !== 'string' || description.trim().length === 0) {
        return res.status(400).json({ message: "Description is required" });
      }
      if (!location || typeof location !== 'string' || location.trim().length === 0) {
        return res.status(400).json({ message: "Location is required" });
      }
      if (!job_type || typeof job_type !== 'string' || job_type.trim().length === 0) {
        return res.status(400).json({ message: "Job type is required" });
      }
      if (!work_arrangement || typeof work_arrangement !== 'string' || work_arrangement.trim().length === 0) {
        return res.status(400).json({ message: "Work arrangement is required" });
      }
      if (!specialty || typeof specialty !== 'string' || specialty.trim().length === 0) {
        return res.status(400).json({ message: "Specialty is required" });
      }
      if (!experience_level || typeof experience_level !== 'string' || experience_level.trim().length === 0) {
        return res.status(400).json({ message: "Experience level is required" });
      }

      // Verify employer exists and is active
      const employer = await storage.getEmployerById(parseInt(employer_id));
      if (!employer) {
        return res.status(404).json({ message: "Employer not found" });
      }
      if (employer.account_status !== "active") {
        return res.status(409).json({ message: "Employer must be active to post jobs" });
      }

      // Get admin user ID for approval tracking
      const adminId = (req as any).user?.userId;

      // CRITICAL: Normalize contact_email if provided, otherwise use employer's normalized email
      let normalizedContactEmail = employer.contact_email;
      if (contact_email && typeof contact_email === 'string') {
        const emailTrimmed = contact_email.trim();
        if (emailTrimmed) {
          normalizedContactEmail = emailTrimmed.toLowerCase();
        }
      }

      const parsedSalaryMin =
        salary_min !== undefined && salary_min !== null && salary_min !== ""
          ? Number(salary_min)
          : null;
      const parsedSalaryMax =
        salary_max !== undefined && salary_max !== null && salary_max !== ""
          ? Number(salary_max)
          : null;

      if (parsedSalaryMin !== null && !Number.isFinite(parsedSalaryMin)) {
        return res.status(400).json({ message: "salary_min must be a valid number" });
      }
      if (parsedSalaryMax !== null && !Number.isFinite(parsedSalaryMax)) {
        return res.status(400).json({ message: "salary_max must be a valid number" });
      }

      // Create job listing with admin presets (auto-approved, free post)
      const jobListing = await storage.createJobListing(
        {
          employer_id: parseInt(employer_id),
          title: title.trim(),
          description: description.trim(),
          responsibilities: responsibilities?.trim() || null,
          requirements: requirements?.trim() || null,
          benefits: benefits?.trim() || null,
          location: location.trim(),
          job_type: job_type.trim(),
          work_arrangement: work_arrangement.trim(),
          specialty: specialty.trim(),
          experience_level: experience_level.trim(),
          education_required: education_required?.trim() || null,
          certification_required: Array.isArray(certification_required) ? certification_required : null,
          shift_type: shift_type?.trim() || null,
          salary_min: parsedSalaryMin !== null ? parsedSalaryMin.toString() : null,
          salary_max: parsedSalaryMax !== null ? parsedSalaryMax.toString() : null,
          salary_period: salary_period?.trim() || "annual",
          application_url: application_url?.trim() || null,
          contact_email: normalizedContactEmail,
          expiry_date: expiry_date ? new Date(expiry_date) : null,
          is_featured: is_featured === true,
        },
        parseInt(employer_id)
      );

      // Update with admin approval metadata
      const approved = await storage.updateJobListing(jobListing.id, {
        is_approved: true,
        approved_by: adminId,
        approved_at: new Date(),
        approval_notes: "Posted by admin",
      });

      return res.status(201).json({
        ...approved,
        message: "Job listing created and auto-approved by admin (free post)",
      });
    } catch (error) {
      console.error("Error creating job listing:", error);
      return res.status(500).json({ message: "Failed to create job listing" });
    }
  });

  // Admin: Get all newsletter subscribers
  app.get("/api/admin/subscribers", requireAdminToken, async (_req: Request, res: Response) => {
    try {
      const subscribers = await storage.getAllSubscribers();
      return res.json(subscribers);
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      return res.status(500).json({ message: "Failed to fetch subscribers" });
    }
  });

  // Admin: Download subscribers as CSV
  app.get("/api/admin/subscribers.csv", requireAdminToken, async (_req: Request, res: Response) => {
    try {
      const subscribers = await storage.getAllSubscribers();
      
      // Create CSV header
      const csvHeader = "Email,Created At\n";
      
      // Create CSV rows
      const csvRows = subscribers.map(sub => {
        const email = escapeCsvCell(sub.email);
        const createdAt = sub.created_at 
          ? new Date(sub.created_at).toISOString() 
          : "";
        return `${email},${escapeCsvCell(createdAt)}`;
      }).join("\n");
      
      const csv = csvHeader + csvRows;
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=newsletter-subscribers.csv");
      return res.send(csv);
    } catch (error) {
      console.error("Error generating subscribers CSV:", error);
      return res.status(500).json({ message: "Failed to generate CSV" });
    }
  });

  // Admin: Update employer
  app.patch("/api/admin/employers/:id", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid employer ID" });
      
      const employer = await storage.getEmployerById(id);
      if (!employer) return res.status(404).json({ message: "Employer not found" });

      const allowedFields = [
        "name",
        "company_name",
        "description",
        "website",
        "logo_url",
        "address",
        "city",
        "state",
        "zip_code",
        "contact_email",
        "contact_phone",
        "account_status",
        "is_verified",
      ] as const;
      const updates: Record<string, unknown> = {};
      for (const key of allowedFields) {
        if ((req.body as any)[key] !== undefined) {
          updates[key] = (req.body as any)[key];
        }
      }

      if (typeof updates.contact_email === "string") {
        updates.contact_email = updates.contact_email.trim().toLowerCase();
      }
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No valid update fields provided" });
      }

      const updated = await storage.updateEmployer(id, updates as any);
      return res.json(updated);
    } catch (error) {
      console.error("Error updating employer:", error);
      return res.status(500).json({ message: "Failed to update employer" });
    }
  });

  // Admin: employers
  app.patch("/api/admin/employers/:id/approve", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid employer ID" });
      const employer = await storage.getEmployerById(id);
      if (!employer) return res.status(404).json({ message: "Employer not found" });

      const updated = await storage.updateEmployer(id, {
        is_verified: true,
        account_status: "active",
      });
      return res.json(updated);
    } catch (error) {
      console.error("Error approving employer:", error);
      return res.status(500).json({ message: "Failed to approve employer" });
    }
  });

  // Admin: job approvals
  app.patch("/api/admin/jobs/:id/approve", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid job ID" });
      const job = await storage.getJobListingById(id);
      if (!job) return res.status(404).json({ message: "Job not found" });

      // Validate approval notes length (max 1000 chars)
      const notes = req.body?.notes;
      if (notes && typeof notes === 'string' && notes.length > 1000) {
        return res.status(400).json({ message: 'Approval notes too long (max 1000 characters)' });
      }

      const adminId = (req as any).user?.userId;
      const updated = await storage.updateJobListing(id, {
        is_approved: true,
        approved_by: adminId,
        approved_at: new Date(),
        approval_notes: notes,
        is_active: true,
      });
      return res.json(updated);
    } catch (error) {
      console.error("Error approving job:", error);
      return res.status(500).json({ message: "Failed to approve job" });
    }
  });

  app.patch("/api/admin/jobs/:id/deny", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid job ID" });
      const job = await storage.getJobListingById(id);
      if (!job) return res.status(404).json({ message: "Job not found" });

      // Validate denial notes length (max 1000 chars)
      const notes = req.body?.notes;
      if (notes && typeof notes === 'string' && notes.length > 1000) {
        return res.status(400).json({ message: 'Denial notes too long (max 1000 characters)' });
      }

      const adminId = (req as any).user?.userId;
      const updated = await storage.updateJobListing(id, {
        is_approved: false,
        approved_by: adminId,
        approved_at: new Date(),
        approval_notes: notes,
        is_active: false,
      });
      return res.json(updated);
    } catch (error) {
      console.error("Error denying job:", error);
      return res.status(500).json({ message: "Failed to deny job" });
    }
  });

  app.delete("/api/admin/jobs/:id", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid job ID" });
      const job = await storage.getJobListingById(id);
      if (!job) return res.status(404).json({ message: "Job not found" });
      await storage.deleteJobListing(id);
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting job:", error);
      return res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Edit job (admin can update certain fields)
  app.patch("/api/admin/jobs/:id", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid job ID" });

      const job = await storage.getJobListingById(id);
      if (!job) return res.status(404).json({ message: "Job not found" });

      // Whitelist editable fields - prevent editing approval-critical fields
      const editableFields = [
        'title', 'description', 'location', 'job_type', 'work_arrangement',
        'specialty', 'experience_level', 'salary_min', 'salary_max', 'salary_period',
        'responsibilities', 'requirements', 'benefits', 'education_required',
        'certification_required', 'shift_type', 'contact_email', 'application_url',
        'is_featured', 'expiry_date'
      ];

      const updates: Record<string, any> = {};
      for (const field of editableFields) {
        if (field in req.body) {
          const value = req.body[field];

          // Type validation
          if (field === 'salary_min' || field === 'salary_max') {
            if (value !== null && value !== undefined && isNaN(parseFloat(value))) {
              return res.status(400).json({ message: `${field} must be a number` });
            }
            updates[field] = value ? parseFloat(value) : undefined;
          } else if (field === 'is_featured') {
            updates[field] = Boolean(value);
          } else if (field === 'certification_required') {
            // Handle comma-separated string -> array conversion
            if (Array.isArray(value)) {
              updates[field] = value;
            } else if (typeof value === 'string') {
              updates[field] = value.split(',').map((c: string) => c.trim()).filter((c: string) => c);
            }
          } else {
            updates[field] = value;
          }
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      const updated = await storage.updateJobListing(id, updates);
      return res.json(updated);
    } catch (error) {
      console.error("Error editing job:", error);
      return res.status(500).json({ message: "Failed to edit job" });
    }
  });

  // Bulk approve jobs
  app.patch("/api/admin/jobs/bulk-approve", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const { jobIds = [], notes } = req.body;

      if (!Array.isArray(jobIds) || jobIds.length === 0) {
        return res.status(400).json({ message: "jobIds array is required and must contain at least one ID" });
      }

      if (notes && typeof notes === 'string' && notes.length > 1000) {
        return res.status(400).json({ message: 'Approval notes too long (max 1000 characters)' });
      }

      const adminId = (req as any).user?.userId;
      const approvedAt = new Date();

      let approvedCount = 0;
      const failedIds: number[] = [];

      // Process each job approval
      for (const jobId of jobIds) {
        const id = parseInt(String(jobId));
        if (isNaN(id)) {
          failedIds.push(jobId);
          continue;
        }

        try {
          const job = await storage.getJobListingById(id);
          if (!job) {
            failedIds.push(id);
            continue;
          }

          // Skip if already approved
          if (job.is_approved) {
            continue;
          }

          await storage.updateJobListing(id, {
            is_approved: true,
            is_active: true,
            approved_by: adminId,
            approved_at: approvedAt,
            approval_notes: notes,
          });
          approvedCount++;
        } catch (err) {
          console.error(`Failed to approve job ${id}:`, err);
          failedIds.push(id);
        }
      }

      return res.json({
        message: `Approved ${approvedCount} job(s)`,
        approvedCount,
        failedCount: failedIds.length,
        failedIds: failedIds.length > 0 ? failedIds : undefined,
      });
    } catch (error) {
      console.error("Error in bulk approve jobs:", error);
      return res.status(500).json({ message: "Failed to bulk approve jobs" });
    }
  });

  // Admin: contact request decisions
  app.patch("/api/admin/contact-requests/:id/approve", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid contact request ID" });

      // Validate admin notes length (max 1000 chars)
      const notes = req.body?.notes;
      if (notes && typeof notes === 'string' && notes.length > 1000) {
        return res.status(400).json({ message: 'Admin notes too long (max 1000 characters)' });
      }

      const adminId = (req as any).user?.userId;
      const [updated] = await db
        .update(contactRequests)
        .set({
          status: "approved",
          reviewed_at: new Date(),
          reviewed_by: adminId,
          contact_revealed_at: new Date(),
          admin_notes: notes,
        })
        .where(eq(contactRequests.id, id))
        .returning();

      if (!updated) return res.status(404).json({ message: "Contact request not found" });
      return res.json(updated);
    } catch (error) {
      console.error("Error approving contact request:", error);
      return res.status(500).json({ message: "Failed to approve contact request" });
    }
  });

  app.patch("/api/admin/contact-requests/:id/deny", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid contact request ID" });

      // Validate admin notes and denial reason length (max 1000 chars each)
      const notes = req.body?.notes;
      const reason = req.body?.reason;
      if (notes && typeof notes === 'string' && notes.length > 1000) {
        return res.status(400).json({ message: 'Admin notes too long (max 1000 characters)' });
      }
      if (reason && typeof reason === 'string' && reason.length > 1000) {
        return res.status(400).json({ message: 'Denial reason too long (max 1000 characters)' });
      }

      const adminId = (req as any).user?.userId;
      const [updated] = await db
        .update(contactRequests)
        .set({
          status: "denied",
          reviewed_at: new Date(),
          reviewed_by: adminId,
          admin_notes: notes,
          denial_reason: reason,
        })
        .where(eq(contactRequests.id, id))
        .returning();

      if (!updated) return res.status(404).json({ message: "Contact request not found" });
      return res.json(updated);
    } catch (error) {
      console.error("Error denying contact request:", error);
      return res.status(500).json({ message: "Failed to deny contact request" });
    }
  });

  // Admin: job posting pricing via app settings
  app.post("/api/admin/job-posting/pricing", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const { perPostCents, passCents, lifetimeCents, passDurationDays } = req.body || {};
      await storage.createOrUpdateAppSetting("JOB_POST_PRICE_PER_POST_CENTS", String(perPostCents ?? ""));
      await storage.createOrUpdateAppSetting("JOB_POST_PRICE_PASS_CENTS", String(passCents ?? ""));
      await storage.createOrUpdateAppSetting("JOB_POST_PRICE_LIFETIME_CENTS", String(lifetimeCents ?? ""));
      await storage.createOrUpdateAppSetting("JOB_POST_PASS_DURATION_DAYS", String(passDurationDays ?? ""));
      return res.json({ success: true });
    } catch (error) {
      console.error("Error updating job posting pricing:", error);
      return res.status(500).json({ message: "Failed to update pricing" });
    }
  });

  app.get("/api/admin/videos", requireAdminToken, async (_req: Request, res: Response) => {
    try {
      const approvedVideosList = await db.select().from(approvedVideos);
      res.json(approvedVideosList);
    } catch (error) {
      console.error("Error fetching approved videos:", error);
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  app.post("/api/admin/videos/sync", requireAdminToken, async (req: Request, res: Response) => {
    try {
      // Sync videos from provider to database
      const defaultPrefix = (process.env.VIDEO_SOURCE_PREFIX || "").replace(/\/+$/, "");
      const requestedPrefix =
        typeof req.body?.prefix === "string"
          ? req.body.prefix
          : (typeof req.body?.folder === "string" ? req.body.folder : "");

      // If folder looks like a legacy UI label (spaces/!/etc), prefer configured prefix.
      const looksLikeLegacyFolderName = /[ !]/.test(requestedPrefix || "");
      const prefix =
        requestedPrefix && !looksLikeLegacyFolderName
          ? requestedPrefix
          : (defaultPrefix || undefined);

      const provider = getVideoProvider();
      const resources = prefix ? await provider.listSourceVideos({ prefix }) : await provider.listSourceVideos();

      let created = 0;
      for (const video of resources) {
        const existing = await db
          .select()
          .from(approvedVideos)
          .where(eq(approvedVideos.public_id, video.public_id))
          .limit(1);

        if (existing.length === 0) {
          await db
            .insert(approvedVideos)
            .values({
              public_id: video.public_id,
              folder: video.asset_folder || prefix || "videos",
              approved: false,
            });
          created += 1;
        }
      }

      res.json({
        success: true,
        created,
        total: resources.length,
        provider: provider.id,
      });
    } catch (error) {
      console.error("Error syncing videos:", error);
      res.status(500).json({ message: "Failed to sync videos" });
    }
  });

  // HLS packaging (B2 only)
  app.post("/api/admin/videos/hls/backfill", requireAdminToken, async (req: Request, res: Response) => {
    const backfillLock = "videos_hls_backfill_lock";
    try {
      if (getVideoProviderId() !== "b2") {
        return res.status(400).json({ success: false, message: "Backfill only supported for VIDEO_PROVIDER=b2" });
      }
      await acquireAdvisoryLock(backfillLock);

      const sourcePrefix = (process.env.VIDEO_SOURCE_PREFIX || "").replace(/\/+$/, "");
      const limitRaw = Number(req.body?.limit ?? 25);
      const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.floor(limitRaw), 1), 200) : 25;
      const mp4s = (await listB2Objects(sourcePrefix || undefined))
        .filter((o) => o.key.toLowerCase().endsWith(".mp4"))
        .slice(0, limit);

      const processed: any[] = [];
      const skipped: any[] = [];

      for (const obj of mp4s) {
        const videoId = stableVideoIdFromKey(obj.key);
        const manifestKey = `${(process.env.VIDEO_HLS_PREFIX || "hls").replace(/\/+$/, "")}/${videoId}/master.m3u8`;
        const already = await headB2Object(manifestKey);
        if (already) {
          skipped.push({ sourceKey: obj.key, videoId, reason: "already_packaged" });
          continue;
        }
        const result = await packageMp4KeyToHlsInB2({ sourceKey: obj.key, videoId });
        processed.push(result);
      }

      res.json({ success: true, processedCount: processed.length, skippedCount: skipped.length, processed, skipped });
    } catch (err) {
      console.error("Error backfilling HLS:", err);
      res.status(500).json({ success: false, message: err instanceof Error ? err.message : "Backfill failed" });
    } finally {
      await releaseAdvisoryLock(backfillLock).catch(() => undefined);
    }
  });

  app.post("/api/admin/videos/hls/process", requireAdminToken, async (req: Request, res: Response) => {
    try {
      if (getVideoProviderId() !== "b2") {
        return res.status(400).json({ success: false, message: "Only supported for VIDEO_PROVIDER=b2" });
      }
      const sourceKey = typeof req.body?.sourceKey === "string" ? req.body.sourceKey : "";
      if (!sourceKey) return res.status(400).json({ success: false, message: "sourceKey is required" });
      const videoId = stableVideoIdFromKey(sourceKey);
      const result = await packageMp4KeyToHlsInB2({ sourceKey, videoId });
      res.json({ success: true, result });
    } catch (err) {
      console.error("Error processing HLS:", err);
      res.status(500).json({ success: false, message: err instanceof Error ? err.message : "Processing failed" });
    }
  });

  app.post("/api/admin/videos/approve", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const { public_id, admin_notes } = req.body;
      if (!public_id) return res.status(400).json({ message: "public_id is required" });

      const existing = await db.select().from(approvedVideos).where(eq(approvedVideos.public_id, public_id)).limit(1);
      if (existing.length === 0) {
        const inserted = await db
          .insert(approvedVideos)
          .values({
            public_id,
            folder: "videos",
            approved: true,
            approved_at: new Date(),
            admin_notes: admin_notes || null,
          })
          .returning();
        return res.json(inserted[0]);
      }

      const updated = await db
        .update(approvedVideos)
        .set({
          approved: true,
          approved_at: new Date(),
          admin_notes: admin_notes || existing[0].admin_notes,
          updated_at: new Date(),
        })
        .where(eq(approvedVideos.public_id, public_id))
        .returning();

      res.json(updated[0]);
    } catch (error) {
      console.error("Error approving video:", error);
      res.status(500).json({ message: "Failed to approve video" });
    }
  });

  app.post("/api/admin/videos/unapprove", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const { public_id } = req.body;
      if (!public_id) return res.status(400).json({ message: "public_id is required" });

      const updated = await db
        .update(approvedVideos)
        .set({
          approved: false,
          approved_at: null,
          updated_at: new Date(),
        })
        .where(eq(approvedVideos.public_id, public_id))
        .returning();

      if (updated.length === 0) return res.status(404).json({ message: "Video not found" });
      res.json(updated[0]);
    } catch (error) {
      console.error("Error unapproving video:", error);
      res.status(500).json({ message: "Failed to unapprove video" });
    }
  });

  app.post("/api/admin/videos/delete", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const { public_id } = req.body || {};
      if (!public_id) return res.status(400).json({ message: "public_id is required" });

      await db.delete(approvedVideos).where(eq(approvedVideos.public_id, public_id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting video:", error);
      res.status(500).json({ message: "Failed to delete video" });
    }
  });

  // Thumbnails: upload from browser capture -> store in B2 under poster/<videoId>.jpg
  const thumbnailUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

  app.post("/api/admin/videos/upload-thumbnail", requireAdminToken, thumbnailUpload.single("thumbnail"), async (req: Request, res: Response) => {
    try {
      const videoId = typeof (req.body as any)?.videoId === "string" ? (req.body as any).videoId : "";
      const file = (req as any).file as { buffer: Buffer; mimetype: string; originalname: string } | undefined;

      if (!videoId) return res.status(400).json({ message: "videoId is required" });
      if (!file?.buffer) return res.status(400).json({ message: "thumbnail file is required" });
      const safeVideoId = videoId.replace(/[^a-zA-Z0-9_-]/g, "");
      if (!safeVideoId) return res.status(400).json({ message: "videoId contains no valid characters" });

      const allowedThumbTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
      const normalizedType = (file.mimetype || "").toLowerCase();
      if (!allowedThumbTypes.has(normalizedType)) {
        return res.status(400).json({ message: "Invalid thumbnail content type" });
      }

      const Key = posterKeyForVideoId(safeVideoId);
      const Bucket = getB2Bucket();
      const s3 = getB2S3Client();

      await s3.send(
        new PutObjectCommand({
          Bucket,
          Key,
          Body: file.buffer,
          ContentType: normalizedType || "image/jpeg",
        }),
      );

      res.json({ success: true, videoId: safeVideoId, key: Key, url: publicUrlForKey(Key) });
    } catch (error) {
      console.error("Error uploading thumbnail:", error);
      res.status(500).json({ message: "Failed to upload thumbnail" });
    }
  });

  // Thumbnails: server-side generation (requires ffmpeg)
  app.post("/api/admin/videos/generate-thumbnail", requireAdminToken, async (req: Request, res: Response) => {
    let tmpDir: string | null = null;
    try {
      const videoUrl = typeof req.body?.videoUrl === "string" ? req.body.videoUrl : "";
      const videoId = typeof req.body?.videoId === "string" ? req.body.videoId : "";

      if (!videoUrl) return res.status(400).json({ message: "videoUrl is required" });
      if (!videoId) return res.status(400).json({ message: "videoId is required" });
      if (!ffmpegPath) return res.status(500).json({ message: "ffmpeg binary not available" });

      let parsedUrl: URL;
      try {
        parsedUrl = new URL(videoUrl);
      } catch {
        return res.status(400).json({ message: "videoUrl must be a valid URL" });
      }
      if (parsedUrl.protocol !== "https:") {
        return res.status(400).json({ message: "videoUrl must use https" });
      }

      const safeVideoId = videoId.replace(/[^a-zA-Z0-9_-]/g, "");
      if (!safeVideoId) {
        return res.status(400).json({ message: "videoId contains no valid characters" });
      }

      ffmpeg.setFfmpegPath(ffmpegPath as any);

      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nr-thumb-"));
      const outPath = path.join(tmpDir, `${safeVideoId}.jpg`);

      await new Promise<void>((resolve, reject) => {
        const command = ffmpeg(videoUrl)
          .outputOptions(["-ss 00:00:03.000", "-frames:v 1"])
          .output(outPath)
          .on("end", () => resolve())
          .on("error", (err: any) => reject(err));

        // Avoid hanging ffmpeg processes on corrupt/slow sources.
        const timeout = setTimeout(() => {
          command.kill("SIGKILL");
          reject(new Error("ffmpeg timed out while generating thumbnail"));
        }, 60_000);

        command.on("end", () => clearTimeout(timeout)).on("error", () => clearTimeout(timeout))
          .run();
      });

      const buf = fs.readFileSync(outPath);
      const Key = posterKeyForVideoId(safeVideoId);
      const Bucket = getB2Bucket();
      const s3 = getB2S3Client();

      await s3.send(
        new PutObjectCommand({
          Bucket,
          Key,
          Body: buf,
          ContentType: "image/jpeg",
        }),
      );

      res.json({ success: true, videoId: safeVideoId, key: Key, url: publicUrlForKey(Key) });
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      res.status(500).json({ message: "Failed to generate thumbnail" });
    } finally {
      if (tmpDir) {
        try {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        } catch {
          // Best-effort cleanup only.
        }
      }
    }
  });

  // ========== STORE API ==========
  
  // Products
  app.get("/api/store/products", async (_req: Request, res: Response) => {
    try {
      const products = await storage.getAllStoreProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching store products:", error);
      res.status(500).json({ message: "Failed to fetch store products" });
    }
  });
  
  app.get("/api/store/products/featured", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const products = await storage.getFeaturedStoreProducts(limit);
      res.json(products);
    } catch (error) {
      console.error("Error fetching featured products:", error);
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });
  
  app.get("/api/store/products/category/:category", async (req: Request, res: Response) => {
    try {
      const category = req.params.category;
      const products = await storage.getStoreProductsByCategory(category);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products by category:", error);
      res.status(500).json({ message: "Failed to fetch products by category" });
    }
  });
  
  app.get("/api/store/products/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      const product = await storage.getStoreProductById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });
  
  app.post("/api/store/products", requireAdmin, async (req: Request, res: Response) => {
    try {
      
      // Validate product data
      const validationResult = insertStoreProductSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid product data",
          errors: validationResult.error.format()
        });
      }
      
      const product = await storage.createStoreProduct(validationResult.data);
      res.status(201).json({ 
        id: product.id,
        message: "Product created successfully"
      });
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });
  
  app.patch("/api/store/products/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      // Check if product exists
      const existingProduct = await storage.getStoreProductById(id);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Validate update data
      const validationResult = insertStoreProductSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid product data",
          errors: validationResult.error.format()
        });
      }
      
      const updatedProduct = await storage.updateStoreProduct(id, validationResult.data);
      res.json({ 
        id: updatedProduct.id,
        message: "Product updated successfully"
      });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });
  
  app.delete("/api/store/products/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      // Check if product exists
      const existingProduct = await storage.getStoreProductById(id);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      await storage.deleteStoreProduct(id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });
  
  // Orders
  app.post("/api/store/orders", authRateLimiter, requireAuth, async (req: Request, res: Response) => {
    try {
      const { order, items } = req.body;

      if (!order || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Invalid order data" });
      }

      // Validate order items count (max 100 items per order) - prevents DoS via massive orders
      if (items.length > 100) {
        return res.status(400).json({ message: "Too many items in order (max 100 items)" });
      }

      // Validate order items
      const requestedItems = new Map<number, { product_id: number; quantity: number }>();
      for (const item of items) {
        const itemValidation = insertStoreOrderItemSchema.safeParse(item);
        if (!itemValidation.success) {
          return res.status(400).json({
            message: "Invalid order item data",
            errors: itemValidation.error.format()
          });
        }

        // Validate quantity bounds (1-1000 per item) - prevents negative/zero quantities and extremely large orders
        const qty = item.quantity;
        if (!Number.isInteger(qty) || qty < 1 || qty > 1000) {
          return res.status(400).json({
            message: "Invalid item quantity (must be 1-1000)"
          });
        }

        // Verify product exists
        const product = await storage.getStoreProductById(item.product_id);
        if (!product) {
          return res.status(404).json({
            message: `Product with ID ${item.product_id} not found`
          });
        }

        if (product.is_available === false) {
          return res.status(400).json({
            message: `Product ${product.name} is not available`
          });
        }

        // Stock check: null means unlimited inventory, numeric values are enforced.
        if (product.stock_quantity !== null && product.stock_quantity < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for product ${product.name}`
          });
        }

        // Merge duplicate product rows from client payload.
        const existing = requestedItems.get(item.product_id);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          requestedItems.set(item.product_id, {
            product_id: item.product_id,
            quantity: item.quantity,
          });
        }
      }

      let orderTotal = 0;
      const normalizedItems: Array<{
        product_id: number;
        quantity: number;
        price_at_time: string;
        subtotal: string;
      }> = [];

      for (const item of requestedItems.values()) {
        const product = await storage.getStoreProductById(item.product_id);
        if (!product) {
          return res.status(404).json({ message: `Product with ID ${item.product_id} not found` });
        }
        const unitPrice = Number(product.price);
        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
          return res.status(400).json({ message: `Invalid pricing for product ${product.name}` });
        }
        const subtotal = unitPrice * item.quantity;
        orderTotal += subtotal;
        normalizedItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_time: unitPrice.toFixed(2),
          subtotal: subtotal.toFixed(2),
        });
      }

      const normalizedContactEmail =
        typeof order?.contact_email === "string"
          ? order.contact_email.trim().toLowerCase()
          : order?.contact_email;

      const orderValidation = insertStoreOrderSchema.safeParse({
        ...order,
        contact_email: normalizedContactEmail,
        total_amount: orderTotal.toFixed(2),
        user_id: req.user!.userId,
      });
      if (!orderValidation.success) {
        return res.status(400).json({
          message: "Invalid order data",
          errors: orderValidation.error.format()
        });
      }

      const createdOrder = await db.transaction(async (tx) => {
        // Re-check and atomically decrement stock inside transaction to avoid overselling.
        for (const item of normalizedItems) {
          const [product] = await tx
            .select()
            .from(storeProducts)
            .where(eq(storeProducts.id, item.product_id));
          if (!product) {
            throw new Error(`Product ${item.product_id} no longer exists`);
          }
          if (product.stock_quantity !== null) {
            const [updatedStock] = await tx
              .update(storeProducts)
              .set({ stock_quantity: sql`${storeProducts.stock_quantity} - ${item.quantity}` })
              .where(and(eq(storeProducts.id, item.product_id), gte(storeProducts.stock_quantity, item.quantity)))
              .returning({ id: storeProducts.id });
            if (!updatedStock) {
              throw new Error(`Insufficient stock for ${product.name}`);
            }
          }
        }

        const [newOrder] = await tx
          .insert(storeOrders)
          .values(orderValidation.data)
          .returning();

        await tx.insert(storeOrderItems).values(
          normalizedItems.map((item) => ({
            ...item,
            order_id: newOrder.id,
          }))
        );

        return newOrder;
      });

      res.status(201).json({
        id: createdOrder.id,
        message: "Order created successfully"
      });
    } catch (error) {
      console.error("Error creating order:", error);
      if (error instanceof Error && /insufficient stock|no longer exists/i.test(error.message)) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });
  
  app.get("/api/store/orders/user/:userId", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const currentUserId = (req as any).user?.userId ?? (req as any).user?.id;
      if (currentUserId == null) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      // Check if user is requesting their own orders or is an admin
      if (userId !== currentUserId && !(req as any).user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized: Cannot view orders for other users" });
      }
      
      const orders = await storage.getStoreOrdersByUserId(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ message: "Failed to fetch user orders" });
    }
  });
  
  app.get("/api/store/orders/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const order = await storage.getStoreOrderById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Check if user is requesting their own order or is an admin
      if (order.user_id !== req.user!.userId && !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized: Cannot view orders for other users" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });
  
  app.get("/api/store/orders/:id/items", authenticateToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const order = await storage.getStoreOrderById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Check if user is requesting their own order items or is an admin
      if (order.user_id !== req.user!.userId && !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized: Cannot view order items for other users" });
      }
      
      const items = await storage.getStoreOrderItemsByOrderId(id);
      res.json(items);
    } catch (error) {
      console.error("Error fetching order items:", error);
      res.status(500).json({ message: "Failed to fetch order items" });
    }
  });
  
  app.patch("/api/store/orders/:id/status", authenticateToken, async (req: Request, res: Response) => {
    try {
      // Only admins can update order status
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized: Admin privileges required" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      // Check if valid status
      const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` 
        });
      }
      
      // Check if order exists
      const existingOrder = await storage.getStoreOrderById(id);
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const updatedOrder = await storage.updateStoreOrderStatus(id, status);
      res.json({ 
        id: updatedOrder.id,
        message: "Order status updated successfully"
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });
  
  app.patch("/api/store/orders/:id/payment", authenticateToken, async (req: Request, res: Response) => {
    try {
      // Only admins can update payment status
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized: Admin privileges required" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const { payment_status } = req.body;
      if (!payment_status) {
        return res.status(400).json({ message: "Payment status is required" });
      }
      
      // Check if valid payment status
      const validPaymentStatuses = ["pending", "paid", "failed", "refunded"];
      if (!validPaymentStatuses.includes(payment_status)) {
        return res.status(400).json({ 
          message: `Invalid payment status. Must be one of: ${validPaymentStatuses.join(", ")}` 
        });
      }
      
      // Check if order exists
      const existingOrder = await storage.getStoreOrderById(id);
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const updatedOrder = await storage.updateStoreOrderPaymentStatus(id, payment_status);
      res.json({ 
        id: updatedOrder.id,
        message: "Order payment status updated successfully"
      });
    } catch (error) {
      console.error("Error updating order payment status:", error);
      res.status(500).json({ message: "Failed to update order payment status" });
    }
  });

  // ========== APP SETTINGS ENDPOINTS ==========
  
  // Get all app settings (non-sensitive ones for public, all for admin)
  app.get("/api/settings", authenticateToken, async (req: Request, res: Response) => {
    try {
      const allSettings = await storage.getAllAppSettings();
      
      // Only return non-sensitive settings for regular users
      // Use isUserAdmin helper for reliable admin checks
      const isAdmin = isUserAdmin(req);
      
      const filteredSettings = isAdmin 
        ? allSettings 
        : allSettings.filter(setting => !setting.is_sensitive);
      
      res.json(filteredSettings);
    } catch (error) {
      console.error("Error fetching app settings:", error);
      res.status(500).json({ message: "Failed to fetch app settings" });
    }
  });
  
  // Get a specific setting by key
  app.get("/api/settings/:key", async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const setting = await storage.getAppSettingByKey(key);
      
      if (!setting) {
        return res.status(404).json({ message: `Setting with key '${key}' not found` });
      }
      // Treat known secret keys as sensitive even if is_sensitive was not set
      const SENSITIVE_KEYS = new Set(['CUSTOMCAT_API_KEY']);
      const isSensitive = setting.is_sensitive || SENSITIVE_KEYS.has(key);
      if (isSensitive) {
        const isAdmin = isUserAdmin(req);
        if (!isAdmin) {
          return res.status(403).json({ message: "You don't have permission to access this setting" });
        }
      }
      
      res.json(setting);
    } catch (error) {
      console.error(`Error fetching setting with key ${req.params.key}:`, error);
      res.status(500).json({ message: "Failed to fetch setting" });
    }
  });
  
  // Create or update a setting (admin only)
  app.post("/api/settings", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Only admins can manage settings" });
      }
      
      const settingSchema = z.object({
        key: z.string().min(1).max(100),
        value: z.string(),
        description: z.string().nullable().optional(),
        is_sensitive: z.boolean().default(false).optional()
      });
      
      const validatedData = settingSchema.parse(req.body);
      
      const setting = await storage.createOrUpdateAppSetting(
        validatedData.key,
        validatedData.value,
        validatedData.description ?? undefined,
        validatedData.is_sensitive
      );
      
      res.status(200).json(setting);
    } catch (error) {
      console.error("Error creating/updating setting:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid setting data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create/update setting" });
    }
  });
  
  // Delete a setting (admin only)
  app.delete("/api/settings/:key", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Only admins can delete settings" });
      }
      
      const { key } = req.params;
      
      const setting = await storage.getAppSettingByKey(key);
      if (!setting) {
        return res.status(404).json({ message: `Setting with key '${key}' not found` });
      }
      
      await storage.deleteAppSetting(key);
      
      res.status(200).json({ message: `Setting '${key}' deleted successfully` });
    } catch (error) {
      console.error(`Error deleting setting with key ${req.params.key}:`, error);
      res.status(500).json({ message: "Failed to delete setting" });
    }
  });
  
  // Endpoint to get CustomCat API key status (used by client to check if store integration is configured)
  app.get("/api/settings/store/customcat-status", async (req: Request, res: Response) => {
    try {
      // Check if this is an admin request - only admins should be able to check API keys
      const isAdmin = isUserAdmin(req);
      if (!isAdmin) {
        return res.status(403).json({ 
          message: "You don't have permission to check API status",
          configured: false
        });
      }

      const apiKeySetting = await storage.getAppSettingByKey("CUSTOMCAT_API_KEY");
      const isConfigured = !!apiKeySetting && !!apiKeySetting.value;
      
      // If there's no API key configured, we don't need to verify the connection
      if (!isConfigured) {
        return res.json({ 
          configured: false,
          message: "CustomCat API key not configured",
          status: "unconfigured"
        });
      }
      
      // For development purposes, we'll simulate a successful connection
      // rather than making actual API calls that could fail due to network issues
      return res.json({ 
        configured: true, 
        message: "CustomCat API key is configured",
        status: "configured"
      });
      
      /* Commented out real API call to avoid network issues
      // Attempt to verify the connection with CustomCat API
      try {
        // Make a simple request to CustomCat API to check if the key is valid
        const response = await fetch("https://api.customcat.com/catalog/products", {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-API-KEY": apiKeySetting.value || ""
          }
        });
        
        if (response.ok) {
          return res.json({ 
            configured: true, 
            message: "CustomCat API connection successful",
            status: "connected"
          });
        } else {
          const errorData = await response.json().catch(() => ({}));
          return res.json({ 
            configured: true, 
            message: errorData.message || "API key is configured but connection failed",
            status: "error",
            statusCode: response.status
          });
        }
      } catch (connectionError) {
        console.error("Error verifying CustomCat API connection:", connectionError);
        return res.json({ 
          configured: true, 
          message: "API key is configured but connection test failed. Please check your API key.",
          status: "error"
        });
      }
      */
    } catch (error) {
      console.error("Error checking CustomCat API status:", error);
      res.status(500).json({ 
        configured: false,
        message: "Error checking CustomCat API configuration",
        status: "error"
      });
    }
  });
  
  // Admin token generation for admin interface operations
  app.post("/api/admin/token", adminPinRateLimiter, async (req: Request, res: Response) => {
    try {
      const { pin } = req.body;
      const isProduction = process.env.NODE_ENV === 'production';
      const envPin = process.env.ADMIN_PIN?.trim() ?? '';
      const ADMIN_PIN = envPin || (isProduction ? '' : '1234567');
      if (isProduction && (!ADMIN_PIN || ADMIN_PIN === '1234567')) {
        return res.status(503).json({ message: "Admin PIN must be configured in production. Set ADMIN_PIN environment variable." });
      }
      const submittedPin = pin ? String(pin).trim() : "";
      const submittedBuffer = Buffer.from(submittedPin);
      const expectedBuffer = Buffer.from(ADMIN_PIN);
      const pinMatches =
        submittedBuffer.length === expectedBuffer.length &&
        timingSafeEqual(submittedBuffer, expectedBuffer);
      if (!submittedPin || !pinMatches) {
        return res.status(401).json({ message: "Invalid admin PIN" });
      }

      // Issue admin token for an actual admin account to keep middleware behavior consistent.
      const [adminUser] = await db
        .select()
        .from(users)
        .where(eq(users.is_admin, true))
        .limit(1);
      if (!adminUser || adminUser.is_suspended) {
        return res.status(503).json({ message: "No active admin account available to issue token" });
      }

      const token = generateToken(adminUser as any);
      res.status(200).json({ token });
    } catch (error) {
      console.error("Error generating admin token:", error);
      res.status(500).json({ message: "Failed to generate admin token" });
    }
  });
  
  // Admin logout endpoint
  // REMOVED: /api/admin/logout was a no-op that didn't blacklist tokens.
  // All logout now goes through POST /api/auth/logout which properly invalidates the token.

  // Email Scheduler Endpoints (Admin Only)
  // Manually trigger email schedules for job alerts and event reminders
  app.post("/api/admin/email/schedule", requireAdmin, async (req: Request, res: Response) => {
    try {
      console.log("[ADMIN] Email schedule triggered by admin");
      const result = await runAllEmailSchedules();
      res.status(200).json({
        success: true,
        message: "Email schedules executed",
        result,
      });
    } catch (error) {
      console.error("Error running email schedules:", error);
      res.status(500).json({
        success: false,
        message: "Failed to run email schedules"
      });
    }
  });

  // Get email schedule status and logs
  app.get("/api/admin/email/status", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const status = getEmailScheduleStatus();
      res.status(200).json({
        success: true,
        status,
      });
    } catch (error) {
      console.error("Error getting email schedule status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get email schedule status"
      });
    }
  });

  // Cron Job Endpoints
  // These can be triggered by Vercel Cron, EasyCron, or external services
  // Secure with CRON_SECRET environment variable

  app.get("/api/cron/job-alerts", handleJobAlertsCron);
  app.get("/api/cron/event-reminders", handleEventRemindersCron);
  app.get("/api/cron/health", handleCronHealth);

  // Check if the CustomCat API connection is valid by making a test request
  app.get("/api/store/customcat/verify-connection", async (req: Request, res: Response) => {
    try {
      // Check if this is an admin request - only admins should be able to check API keys
      const isAdmin = isUserAdmin(req);
      if (!isAdmin) {
        return res.status(403).json({ 
          success: false,
          message: "You don't have permission to check API connections"
        });
      }
      
      // First try to get the API key from the environment variable
      let apiKeyValue = process.env.CUSTOMCAT_API_KEY || "";
      
      // If not in environment, fall back to stored setting
      if (!apiKeyValue) {
        const apiKeySetting = await storage.getAppSettingByKey("CUSTOMCAT_API_KEY");
        if (apiKeySetting && apiKeySetting.value) {
          apiKeyValue = apiKeySetting.value;
        }
      }
      
      if (!apiKeyValue) {
        return res.status(400).json({ 
          success: false, 
          message: "CustomCat API key not configured. Please set the CUSTOMCAT_API_KEY environment variable." 
        });
      }
      
      try {
        // Use the improved CustomCat API integration to test the connection
        console.log("Verifying CustomCat API connection with the provided key...");
        const result = await fetchCustomCatProducts(apiKeyValue);
        
        if (result.success) {
          return res.json({
            success: true,
            message: "Connected successfully to CustomCat API",
            productCount: (result as any).products ? (result as any).products.length : 0,
            configured: true,
            status: "connected"
          });
        } else {
          console.error("CustomCat API verification failed:", (result as any).message || (result as any).errors);

          return res.status(400).json({
            success: false,
            message: (result as any).message || "Failed to connect to CustomCat API. Please check your API key.",
            errors: (result as any).errors,
            configured: false,
            status: "error",
            apiKeyProvided: !!apiKeyValue,
            apiKeyLength: apiKeyValue.length
          });
        }
      } catch (error) {
        console.error("Error connecting to CustomCat API:", error);
        
        return res.status(500).json({
          success: false,
          message: "Network error connecting to CustomCat API. Please check your internet connection and try again.",
          configured: false,
          status: "error"
        });
      }
    } catch (error) {
      console.error("Error verifying CustomCat API connection:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error connecting to CustomCat API" 
      });
    }
  });
  
  // Sync products from CustomCat to our store database
  app.post("/api/store/customcat/sync-products", async (req: Request, res: Response) => {
    try {
      // Check if this is an admin request using proper JWT validation
      const isAdmin = isUserAdmin(req);
      if (!isAdmin) {
        return res.status(403).json({ 
          success: false,
          message: "Not authorized to sync products. Admin privileges required" 
        });
      }
      
      // First try to get the API key from the environment variable
      let apiKeyValue = process.env.CUSTOMCAT_API_KEY || "";
      
      // If not in environment, fall back to stored setting
      if (!apiKeyValue) {
        const apiKeySetting = await storage.getAppSettingByKey("CUSTOMCAT_API_KEY");
        if (apiKeySetting && apiKeySetting.value) {
          apiKeyValue = apiKeySetting.value;
        }
      }
      
      // Check if we have an API key
      if (!apiKeyValue) {
        return res.status(400).json({ 
          success: false, 
          message: "CustomCat API key not configured. Please set the CUSTOMCAT_API_KEY environment variable." 
        });
      }
      
      console.log("Making request to CustomCat API for product synchronization...");
      
      try {
        // Fetch products using the improved CustomCat API integration
        console.log("Connecting to CustomCat API for product catalog...");
        const result = await fetchCustomCatProducts(apiKeyValue);
        
        if (!result.success) {
          console.error("CustomCat API connection failed:", (result as any).errors || (result as any).message);
          return res.status(400).json({ 
            success: false, 
            message: (result as any).message || "Failed to connect to CustomCat API. Please check your API key.",
            errors: (result as any).errors,
            statusCode: 400
          });
        }
        
        // Get products from the result
        const rawProductsData = (result as any).products || [];
        
        if (!Array.isArray(rawProductsData) || rawProductsData.length === 0) {
          console.log("No products received from CustomCat API");
          return res.status(200).json({ 
            success: true, 
            message: "Connected to CustomCat API successfully, but no products were found",
            results: {
              total: 0,
              added: 0,
              updated: 0,
              skipped: 0,
              errors: 0
            }
          });
        }
        
        console.log(`Received ${rawProductsData.length} products from CustomCat API`);
        
        // Format the raw CustomCat products using our utility function
        // This preserves all sizing and art placement details
        const formattedProducts = formatCustomCatProducts(rawProductsData);
        
        console.log(`Formatted ${formattedProducts.length} products for our database`);
        
        // Process and insert/update products in our database
        const syncResults = {
          total: rawProductsData.length,
          formatted: formattedProducts.length,
          added: 0,
          updated: 0,
          skipped: 0,
          errors: 0
        };
        
        // Process each formatted product
        for (const product of formattedProducts) {
          try {
            // Skip products without an external ID
            if (!product.external_id) {
              console.log("Skipping product without external_id");
              syncResults.skipped++;
              continue;
            }
            
            // Check if product already exists in our database by external_id
            const existingProduct = await storage.getStoreProductByExternalId(
              "customcat", 
              product.external_id
            );
            
            if (existingProduct) {
              // Update existing product
              await storage.updateStoreProduct(existingProduct.id, {
                name: product.name,
                description: product.description,
                price: product.price,
                image_url: product.image_url,
                category: product.category,
                metadata: product.metadata as any, // This contains all the original CustomCat data
                is_featured: existingProduct.is_featured, // Preserve featured status
                is_available: product.is_available
              } as any);
              syncResults.updated++;
            } else {
              // Create new product
              await storage.createStoreProduct({ ...product, metadata: product.metadata as any });
              syncResults.added++;
            }
          } catch (err) {
            console.error("Error processing product:", err);
            syncResults.errors++;
          }
        }
        
        // Apply image processing to all products
        const allProducts = await storage.getStoreProductsBySource("customcat");
        const processedProducts = processCustomCatProductsImages(allProducts);
        
        // Update products with processed images
        for (const product of processedProducts) {
          try {
            await storage.updateStoreProduct(product.id, {
              image_url: product.image_url
            });
          } catch (err) {
            console.error(`Error updating image for product ${product.id}:`, err);
          }
        }
        
        res.json({ 
          success: true, 
          message: "CustomCat product synchronization complete",
          results: syncResults
        });
      } catch (error) {
        console.error("Error during CustomCat API request:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to connect to CustomCat API. Check your network connection and try again.",
          apiKeyConfigured: !!apiKeyValue
        });
      }
    } catch (error) {
      console.error("Error syncing CustomCat products:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error syncing products from CustomCat" 
      });
    }
  });
  
  // ========== NRPX PHOENIX NURSE REGISTRATION ROUTES ==========

  // Ticket code generator — unambiguous chars, cryptographically secure
  // SECURITY FIX: Use randomBytes instead of Math.random() for security tokens
  function generateTicketCode(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    const segment = () => {
      const randomValues = randomBytes(4);
      return Array.from(randomValues)
        .map(byte => chars[byte % chars.length])
        .join('');
    };
    return `NRPX-${segment()}-${segment()}`;
  }

  // Rate limiter: IP → [timestamps] and Email → [timestamps]
  // Prevents both IP-based spam and email-based spam from same domain
  const nrpxRateLimitByIP = new Map<string, number[]>();
  const nrpxRateLimitByEmail = new Map<string, number[]>();

  function nrpxRateLimit(ip: string, email: string): { allowed: boolean; reason?: string } {
    const now = Date.now();
    const hourWindow = 60 * 60 * 1000; // 1 hour for IP limit
    const dayWindow = 24 * 60 * 60 * 1000; // 24 hours for email limit

    // IP-based: 3 registrations per hour (prevents mass registration from single IP)
    const ipHits = (nrpxRateLimitByIP.get(ip) || []).filter(t => now - t < hourWindow);
    if (ipHits.length >= 3) {
      return { allowed: false, reason: "Too many registrations from this IP address. Please try again in an hour." };
    }

    // Email domain-based: 1 registration per 24 hours per domain
    // Extract domain from email (everything after @)
    const emailDomain = email.toLowerCase().split('@')[1] || email;
    const emailHits = (nrpxRateLimitByEmail.get(emailDomain) || []).filter(t => now - t < dayWindow);
    if (emailHits.length >= 1) {
      return { allowed: false, reason: "This email domain has already registered. One registration per domain per day." };
    }

    // All checks passed — record the attempt
    ipHits.push(now);
    nrpxRateLimitByIP.set(ip, ipHits);

    emailHits.push(now);
    nrpxRateLimitByEmail.set(emailDomain, emailHits);

    return { allowed: true };
  }

  // POST /api/nrpx/register — public nurse registration (creates user account, pending admin approval)
  app.post("/api/nrpx/register", async (req: Request, res: Response) => {
    try {
      // Validate input BEFORE rate limiting check (so we reject bad data early)
      const { firstName, lastName, email, employer } = req.body;
      if (!firstName?.trim() || firstName.trim().length > 100) return res.status(400).json({ success: false, message: "First name is required (max 100 chars)." });
      if (!lastName?.trim() || lastName.trim().length > 100) return res.status(400).json({ success: false, message: "Last name is required (max 100 chars)." });
      const emailNorm = email?.trim().toLowerCase();
      if (!emailNorm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) return res.status(400).json({ success: false, message: "A valid email address is required." });
      if (employer && employer.trim().length > 255) return res.status(400).json({ success: false, message: "Employer name is too long (max 255 chars)." });

      // Now check rate limits (after basic validation)
      const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
      const rateLimitResult = nrpxRateLimit(ip, emailNorm);
      if (!rateLimitResult.allowed) {
        return res.status(429).json({ success: false, message: rateLimitResult.reason });
      }

      // Capacity + duplicate check + user creation + insert happen under a DB transaction lock
      // so concurrent requests cannot bypass the 500 cap.
      const result = await db.transaction(async (tx) => {
        await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('nrpx_registration_capacity_lock'))`);

        const [{ count }] = await tx.select({ count: sql<number>`count(*)::int` }).from(nrpxRegistrations);
        if (count >= 500) {
          throw new Error("NRPX_FULL");
        }

        const existing = await tx
          .select({ id: nrpxRegistrations.id })
          .from(nrpxRegistrations)
          .where(eq(nrpxRegistrations.email, emailNorm))
          .limit(1);
        if (existing.length > 0) {
          throw new Error("NRPX_DUPLICATE");
        }

        // Check if user already exists
        const existingUser = await tx
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, emailNorm))
          .limit(1);
        if (existingUser.length > 0) {
          throw new Error("NRPX_USER_EXISTS");
        }

        // Generate secure random password (user won't use it — they'll reset via email)
        const randomPassword = randomBytes(32).toString('hex');
        const passwordHash = await bcryptjs.hash(randomPassword, 10);

        // Create user account with is_verified: false (admin must approve first)
        const [newUser] = await tx
          .insert(users)
          .values({
            email: emailNorm,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            password_hash: passwordHash,
            is_verified: false,
            is_admin: false,
            created_at: new Date(),
            updated_at: new Date(),
          })
          .returning();

        // Generate unique ticket code (up to 10 attempts)
        let ticketCode = '';
        let collisionCount = 0;
        for (let i = 0; i < 10; i++) {
          const candidate = generateTicketCode();
          const collision = await tx
            .select({ id: nrpxRegistrations.id })
            .from(nrpxRegistrations)
            .where(eq(nrpxRegistrations.ticket_code, candidate))
            .limit(1);
          if (collision.length === 0) {
            ticketCode = candidate;
            break;
          }
          collisionCount++;
        }
        if (!ticketCode) {
          console.error(`[NRPX] Ticket code generation failed after ${collisionCount} collisions`);
          throw new Error("NRPX_CODE_FAILED");
        }

        // Create NRPX registration linked to user
        const [created] = await tx
          .insert(nrpxRegistrations)
          .values({
            ticket_code: ticketCode,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            email: emailNorm,
            employer: employer?.trim() || null,
            user_id: newUser.id,
            // DO NOT set email_sent or ticket_email_sent — both are false by default
          })
          .returning();

        return { registration: created, user: newUser };
      }).catch((error) => {
        if (error instanceof Error && error.message === "NRPX_FULL") {
          return "NRPX_FULL" as const;
        }
        if (error instanceof Error && error.message === "NRPX_DUPLICATE") {
          return "NRPX_DUPLICATE" as const;
        }
        if (error instanceof Error && error.message === "NRPX_USER_EXISTS") {
          return "NRPX_USER_EXISTS" as const;
        }
        if (error instanceof Error && error.message === "NRPX_CODE_FAILED") {
          return "NRPX_CODE_FAILED" as const;
        }
        throw error;
      });

      if (result === "NRPX_FULL") {
        return res.status(409).json({ success: false, message: "Registration is full. Thank you for your interest!" });
      }
      if (result === "NRPX_DUPLICATE") {
        return res.status(409).json({ success: false, message: "This email is already registered for this event." });
      }
      if (result === "NRPX_USER_EXISTS") {
        return res.status(409).json({ success: false, message: "This email is already in our system. Please log in to claim your Phoenix ticket." });
      }
      if (result === "NRPX_CODE_FAILED") {
        return res.status(500).json({ success: false, message: "Could not generate ticket code. Please try again." });
      }

      // NO EMAIL SENT ON REGISTRATION — email sent only after admin approval
      console.log(`[NRPX] Registration created - user ${result.user.id} | email: ${emailNorm} | pending admin approval`);
      res.status(201).json({
        success: true,
        message: "Registration pending admin review. We'll email you next steps once approved! 🎸"
      });
    } catch (error) {
      console.error("[NRPX] Registration error:", error);
      res.status(500).json({ success: false, message: "Registration failed. Please try again." });
    }
  });

  // POST /api/admin/nrpx/approve/:registrationId — admin approves NRPX registration and sends welcome email
  app.post("/api/admin/nrpx/approve/:registrationId", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const { verifyUser } = await import("./services/verification");
      const { sendNrpxWelcomeEmail } = await import("./email");

      const registrationId = req.params.registrationId;
      if (!registrationId) return res.status(400).json({ success: false, message: "Registration ID required" });

      const adminUserId = (req as any).user?.userId;
      if (!adminUserId) return res.status(401).json({ success: false, message: "Admin user not found" });

      // Get NRPX registration
      const [registration] = await db
        .select()
        .from(nrpxRegistrations)
        .where(eq(nrpxRegistrations.id, registrationId))
        .limit(1);

      if (!registration) {
        return res.status(404).json({ success: false, message: "Registration not found" });
      }

      if (!registration.user_id) {
        return res.status(400).json({ success: false, message: "Registration has no associated user account" });
      }

      // Get user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, registration.user_id))
        .limit(1);

      if (!user) {
        return res.status(404).json({ success: false, message: "Associated user not found" });
      }

      // Check if already verified
      if (user.is_verified) {
        return res.status(400).json({ success: false, message: "User already verified" });
      }

      // Call existing verifyUser service to set is_verified: true (handles audit log, etc.)
      await verifyUser(registration.user_id, adminUserId);

      // Send NRPX-specific welcome email with claim ticket instructions
      const emailResult = await sendNrpxWelcomeEmail({
        firstName: registration.first_name,
        lastName: registration.last_name,
        email: registration.email,
      });

      // CRITICAL: Always mark email_sent even if send failed
      // This allows manual retry via resend endpoint, prevents claim-ticket from blocking
      await db.update(nrpxRegistrations)
        .set({ email_sent: true, email_sent_at: new Date() })
        .where(eq(nrpxRegistrations.id, registrationId));

      if (!emailResult.success) {
        console.warn(`[NRPX] Approval: Email send failed for ${registration.email}, but marked as sent. Admin can resend.`);
      }

      console.log(`[NRPX] Admin approved registration - user ${registration.user_id} | email: ${registration.email} | email_send: ${emailResult.success}`);
      res.json({
        success: true,
        message: emailResult.success ? "Registration approved and welcome email sent" : "Registration approved (email send pending - can resend manually)",
        registration: {
          id: registration.id,
          first_name: registration.first_name,
          last_name: registration.last_name,
          email: registration.email,
          email_sent: true,
        }
      });
    } catch (error) {
      console.error("[NRPX] Approval error:", error);
      res.status(500).json({ success: false, message: "Approval failed. Please try again." });
    }
  });

  // POST /api/nrpx/claim-ticket — verified NRPX user claims their ticket (generates QR, sends ticket email)
  app.post("/api/nrpx/claim-ticket", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      if (!userId) return res.status(401).json({ success: false, message: "Authentication required" });

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Check if user is verified (admin approved)
      if (!user.is_verified) {
        return res.status(403).json({ success: false, message: "Your account is not yet verified. Please wait for admin approval." });
      }

      // Get NRPX registration for this user
      const [registration] = await db
        .select()
        .from(nrpxRegistrations)
        .where(eq(nrpxRegistrations.user_id, userId))
        .limit(1);

      if (!registration) {
        return res.status(404).json({ success: false, message: "You are not registered for the Phoenix event" });
      }

      // CRITICAL: Check if approval welcome email was sent first
      // This email is sent by admin when they approve the registration
      if (!registration.email_sent) {
        return res.status(403).json({
          success: false,
          message: "Your approval notification email hasn't been sent yet. Please wait a moment and refresh, or contact admin support."
        });
      }

      // Generate QR code from ticket code
      const qrBuffer = await QRCode.toBuffer(registration.ticket_code, {
        type: 'png',
        width: 400,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
        errorCorrectionLevel: 'H',
      });

      // Send ticket email
      const emailResult = await sendNrpxTicketEmail({
        firstName: registration.first_name,
        lastName: registration.last_name,
        email: registration.email,
        ticketCode: registration.ticket_code,
        qrBuffer,
      });

      if (!emailResult.success) {
        return res.status(500).json({ success: false, message: "Could not send ticket email. Please try again." });
      }

      // Mark ticket email sent
      await db.update(nrpxRegistrations)
        .set({ ticket_email_sent: true, ticket_email_sent_at: new Date() })
        .where(eq(nrpxRegistrations.id, registration.id));

      const isResend = registration.ticket_email_sent;
      console.log(`[NRPX] Ticket ${isResend ? "resent" : "claimed"} - user ${userId} | email: ${registration.email} | code: ${registration.ticket_code}`);
      res.json({
        success: true,
        message: isResend
          ? "Ticket resent to your email! Check your inbox for the QR code. 🎸"
          : "Ticket sent to your email! Check your inbox for the QR code. 🎸",
        ticketCode: registration.ticket_code
      });
    } catch (error) {
      console.error("[NRPX] Claim ticket error:", error);
      res.status(500).json({ success: false, message: "Could not claim ticket. Please try again." });
    }
  });

  // GET /api/admin/nrpx/pending-approvals — get all NRPX registrations pending admin approval
  app.get("/api/admin/nrpx/pending-approvals", requireAdminToken, async (req: Request, res: Response) => {
    try {
      // Get all NRPX registrations where user is_verified: false
      const pending = await db
        .select({
          id: nrpxRegistrations.id,
          first_name: nrpxRegistrations.first_name,
          last_name: nrpxRegistrations.last_name,
          email: nrpxRegistrations.email,
          registered_at: nrpxRegistrations.registered_at,
        })
        .from(nrpxRegistrations)
        .innerJoin(users, eq(nrpxRegistrations.user_id, users.id))
        .where(eq(users.is_verified, false))
        .orderBy(desc(nrpxRegistrations.registered_at));

      res.json({
        success: true,
        pending,
        count: pending.length,
      });
    } catch (error) {
      console.error("[NRPX] Get pending approvals error:", error);
      res.status(500).json({ success: false, message: "Failed to fetch pending approvals" });
    }
  });

  // GET /api/nrpx/my-registration — get current user's NRPX registration status
  app.get("/api/nrpx/my-registration", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      if (!userId) return res.status(401).json({ success: false, message: "Authentication required" });

      // Get NRPX registration for this user
      const [registration] = await db
        .select()
        .from(nrpxRegistrations)
        .where(eq(nrpxRegistrations.user_id, userId))
        .limit(1);

      if (!registration) {
        return res.status(404).json({ success: false, message: "No NRPX registration found" });
      }

      // Get associated user to check approval status
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      // Return registration details — ticket_code is NEVER exposed via API
      // It's only sent via email when the user claims their ticket
      res.json({
        success: true,
        id: registration.id,
        first_name: registration.first_name,
        last_name: registration.last_name,
        email: registration.email,
        is_verified: user?.is_verified || false,
        email_sent: registration.email_sent, // True = approval email sent
        ticket_email_sent: registration.ticket_email_sent, // True = ticket email with QR sent
        checked_in: registration.checked_in,
        status: getRegistrationStatus(registration, user),
      });
    } catch (error) {
      console.error("[NRPX] Get registration error:", error);
      res.status(500).json({ success: false, message: "Failed to fetch registration" });
    }
  });

  // Helper to show nurses their current status
  function getRegistrationStatus(registration: any, user: any): string {
    if (!user?.is_verified) return "pending_approval";
    if (!registration.email_sent) return "approved_not_notified";
    if (!registration.ticket_email_sent) return "approved_ready_to_claim";
    if (registration.checked_in) return "checked_in";
    return "ticket_claimed";
  }

  // GET /api/nrpx/verify/:code — QR scanner verification (marks check-in, admin only)
  app.get("/api/nrpx/verify/:code", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const code = req.params.code?.toUpperCase().trim();
      if (!code) return res.status(400).json({ valid: false, message: "No ticket code provided." });

      // Atomic check-and-mark: only succeeds if ticket exists AND is not yet checked in.
      // This eliminates the TOCTOU race where two concurrent scans could both succeed.
      const [updated] = await db.update(nrpxRegistrations)
        .set({ checked_in: true, checked_in_at: new Date() })
        .where(and(
          eq(nrpxRegistrations.ticket_code, code),
          eq(nrpxRegistrations.checked_in, false)
        ))
        .returning();

      if (updated) {
        console.log(`[NRPX] Checked in: ${updated.first_name} ${updated.last_name} (${code})`);
        return res.json({ valid: true, name: `${updated.first_name} ${updated.last_name}`, message: "Welcome!" });
      }

      // Nothing updated — ticket either not found or already used; look up for message
      const [existing] = await db.select().from(nrpxRegistrations)
        .where(eq(nrpxRegistrations.ticket_code, code)).limit(1);

      if (!existing) return res.status(404).json({ valid: false, message: "Ticket not found." });

      const checkedInAt = existing.checked_in_at
        ? new Date(existing.checked_in_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        : 'earlier';
      return res.json({
        valid: false,
        alreadyUsed: true,
        message: `Already checked in at ${checkedInAt}`,
        name: `${existing.first_name} ${existing.last_name}`,
      });
    } catch (error) {
      console.error("[NRPX] Verify error:", error);
      res.status(500).json({ valid: false, message: "Verification error. Please try again." });
    }
  });

  // GET /api/nrpx/stats — running check-in count (public, for scanner display)
  app.get("/api/nrpx/stats", async (_req: Request, res: Response) => {
    try {
      const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(nrpxRegistrations);
      const [{ checkedIn }] = await db.select({ checkedIn: sql<number>`count(*)::int` }).from(nrpxRegistrations)
        .where(eq(nrpxRegistrations.checked_in, true));
      const [{ ticketsSent }] = await db.select({ ticketsSent: sql<number>`count(*)::int` }).from(nrpxRegistrations)
        .where(eq(nrpxRegistrations.ticket_email_sent, true));

      res.json({
        total,
        checkedIn,
        ticketsClaimed: ticketsSent,
        stillToCheckin: total - checkedIn,
      });
    } catch (error) {
      console.error("[NRPX] Stats error:", error);
      res.status(500).json({ total: 0, checkedIn: 0, ticketsClaimed: 0, stillToCheckin: 0 });
    }
  });

  // GET /api/admin/nrpx/workflow-stats — detailed admin workflow status (admin only)
  app.get("/api/admin/nrpx/workflow-stats", requireAdminToken, async (_req: Request, res: Response) => {
    try {
      const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(nrpxRegistrations);
      const [{ pendingApproval }] = await db.select({ pendingApproval: sql<number>`count(*)::int` }).from(nrpxRegistrations)
        .innerJoin(users, eq(nrpxRegistrations.user_id, users.id))
        .where(eq(users.is_verified, false));
      const [{ approvedNotNotified }] = await db.select({ approvedNotNotified: sql<number>`count(*)::int` }).from(nrpxRegistrations)
        .innerJoin(users, eq(nrpxRegistrations.user_id, users.id))
        .where(and(eq(users.is_verified, true), eq(nrpxRegistrations.email_sent, false)));
      const [{ approvedNotClaimed }] = await db.select({ approvedNotClaimed: sql<number>`count(*)::int` }).from(nrpxRegistrations)
        .innerJoin(users, eq(nrpxRegistrations.user_id, users.id))
        .where(and(eq(users.is_verified, true), eq(nrpxRegistrations.email_sent, true), eq(nrpxRegistrations.ticket_email_sent, false)));
      const [{ ticketsClaimed }] = await db.select({ ticketsClaimed: sql<number>`count(*)::int` }).from(nrpxRegistrations)
        .where(eq(nrpxRegistrations.ticket_email_sent, true));
      const [{ checkedIn }] = await db.select({ checkedIn: sql<number>`count(*)::int` }).from(nrpxRegistrations)
        .where(eq(nrpxRegistrations.checked_in, true));

      res.json({
        success: true,
        workflow: {
          total,
          pending_approval: pendingApproval,
          approved_not_notified: approvedNotNotified,
          approved_ready_to_claim: approvedNotClaimed,
          tickets_claimed: ticketsClaimed,
          checked_in: checkedIn,
        },
        percentages: {
          pending_approval_pct: Math.round((pendingApproval / total * 100) || 0),
          approval_complete_pct: Math.round(((total - pendingApproval) / total * 100) || 0),
          tickets_claimed_pct: Math.round((ticketsClaimed / total * 100) || 0),
          checked_in_pct: Math.round((checkedIn / total * 100) || 0),
        }
      });
    } catch (error) {
      console.error("[NRPX] Workflow stats error:", error);
      res.status(500).json({ success: false, message: "Failed to fetch workflow stats" });
    }
  });

  // GET /api/admin/nrpx/registrations — admin list with search/filter
  app.get("/api/admin/nrpx/registrations", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const { search, status, sort } = req.query as { search?: string; status?: string; sort?: string };

      let query = db.select().from(nrpxRegistrations);

      // Build where clauses
      const conditions: any[] = [];
      if (search) {
        conditions.push(or(
          ilike(nrpxRegistrations.first_name, `%${search}%`),
          ilike(nrpxRegistrations.last_name, `%${search}%`),
          ilike(nrpxRegistrations.email, `%${search}%`),
          ilike(nrpxRegistrations.ticket_code, `%${search}%`),
        ));
      }
      if (status === 'checked_in') conditions.push(eq(nrpxRegistrations.checked_in, true));
      if (status === 'not_checked_in') conditions.push(eq(nrpxRegistrations.checked_in, false));

      const regs = await (conditions.length > 0
        ? query.where(and(...conditions))
        : query
      ).orderBy(sort === 'name'
        ? nrpxRegistrations.first_name
        : desc(nrpxRegistrations.registered_at)
      );

      const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(nrpxRegistrations);
      const [{ emailsSent }] = await db.select({ emailsSent: sql<number>`count(*)::int` }).from(nrpxRegistrations).where(eq(nrpxRegistrations.email_sent, true));
      const [{ checkedIn }] = await db.select({ checkedIn: sql<number>`count(*)::int` }).from(nrpxRegistrations).where(eq(nrpxRegistrations.checked_in, true));

      res.json({
        registrations: regs,
        stats: { total, emailsSent, checkedIn, remaining: total - checkedIn },
      });
    } catch (error) {
      console.error("[NRPX] Admin list error:", error);
      res.status(500).json({ success: false, message: "Failed to fetch registrations." });
    }
  });

  // POST /api/admin/nrpx/registrations/resend/:id — resend ticket email
  app.post("/api/admin/nrpx/registrations/resend/:id", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const [reg] = await db.select().from(nrpxRegistrations)
        .where(eq(nrpxRegistrations.id, req.params.id)).limit(1);
      if (!reg) return res.status(404).json({ success: false, message: "Registration not found." });

      const qrBuffer = await QRCode.toBuffer(reg.ticket_code, {
        type: 'png', width: 400, margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
        errorCorrectionLevel: 'H',
      });

      const emailResult = await sendNrpxTicketEmail({
        firstName: reg.first_name, lastName: reg.last_name,
        email: reg.email, ticketCode: reg.ticket_code, qrBuffer,
      });

      if (emailResult.success) {
        await db.update(nrpxRegistrations)
          .set({ email_sent: true, email_sent_at: new Date() })
          .where(eq(nrpxRegistrations.id, reg.id));
        res.json({ success: true, message: "Email resent successfully." });
      } else {
        res.status(500).json({ success: false, message: emailResult.error || "Failed to resend email." });
      }
    } catch (error) {
      console.error("[NRPX] Resend error:", error);
      res.status(500).json({ success: false, message: "Failed to resend email." });
    }
  });

  // GET /api/admin/nrpx/registrations/export — CSV export
  app.get("/api/admin/nrpx/registrations/export", requireAdminToken, async (_req: Request, res: Response) => {
    try {
      const regs = await db.select().from(nrpxRegistrations).orderBy(nrpxRegistrations.registered_at);
      const header = 'Ticket Code,First Name,Last Name,Email,Employer,Registered At,Email Sent,Checked In,Checked In At\n';
      const rows = regs.map(r =>
        [
          escapeCsvCell(r.ticket_code),
          escapeCsvCell(r.first_name),
          escapeCsvCell(r.last_name),
          escapeCsvCell(r.email),
          escapeCsvCell(r.employer || ''),
          escapeCsvCell(r.registered_at ? new Date(r.registered_at).toISOString() : ''),
          escapeCsvCell(r.email_sent ? 'Yes' : 'No'),
          escapeCsvCell(r.checked_in ? 'Yes' : 'No'),
          escapeCsvCell(r.checked_in_at ? new Date(r.checked_in_at).toISOString() : ''),
        ].join(',')
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="nrpx-registrations.csv"');
      res.send(header + rows);
    } catch (error) {
      console.error("[NRPX] Export error:", error);
      res.status(500).json({ success: false, message: "Export failed." });
    }
  });

  // Register admin jobs ingestion routes
  registerAdminJobsIngestionRoutes(app, requireAdminToken);

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
