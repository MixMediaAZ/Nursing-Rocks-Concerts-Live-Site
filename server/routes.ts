import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import path from "path";
import fs from "fs";
import { db } from "./db";
import { eq, sql, and, desc, ilike, or, inArray } from "drizzle-orm";
import { storage } from "./storage";
import { approvedVideos, gallery, mediaFolders, events, nrpxRegistrations } from "@shared/schema";
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

// Initialize Stripe with the secret key if it exists
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe | undefined;
if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2023-10-16", // Use the latest supported API version
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
  insertStoreOrderItemSchema
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
  requestPasswordReset,
  resetPassword,
  requireEmployerToken
} from "./auth";
import { setupAuth, requireAuth, requireVerifiedUser, requireAdmin } from "./session-auth";
import { generateToken, isUserAdmin, getPayloadFromRequest } from './jwt';
import {
  upload,
  uploadMediaFiles,
  getMediaList,
  getMediaById,
  updateMedia,
  deleteMedia
} from "./media";
import { authRateLimiter, adminPinRateLimiter, registerRateLimiter, passwordResetRateLimiter } from "./rate-limit";
import { runAllEmailSchedules, getEmailScheduleStatus } from "./email-scheduler";
import { searchJobs, searchEvents, searchNurses, getSearchSuggestions } from "./search";
import { handleJobAlertsCron, handleEventRemindersCron, handleCronHealth } from "./cron-handlers";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session-based authentication
  setupAuth(app);
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

      const results = await searchJobs({
        query: q as string,
        specialty: specialty ? (Array.isArray(specialty) ? specialty as string[] : [specialty as string]) : undefined,
        location: location as string,
        salaryMin: salaryMin ? parseInt(salaryMin as string) : undefined,
        salaryMax: salaryMax ? parseInt(salaryMax as string) : undefined,
        sortBy: (sortBy as any) || 'relevance',
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0,
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

      const results = await searchEvents({
        query: q as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        location: location as string,
        isFeatured: featured === 'true' ? true : featured === 'false' ? false : undefined,
        sortBy: (sortBy as any) || 'relevance',
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0,
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

      const results = await searchNurses({
        query: q as string,
        specialty: specialty as string,
        experience: experience ? parseInt(experience as string) : undefined,
        certifications: certifications ? (Array.isArray(certifications) ? certifications as string[] : [certifications as string]) : undefined,
        sortBy: (sortBy as any) || 'relevance',
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0,
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
  
  // Gallery media management endpoints
  app.post("/api/gallery/upload", galleryUpload.array('images', 20), uploadGalleryImages);
  app.delete("/api/gallery/:id", deleteGalleryImage);
  app.patch("/api/gallery/:id", updateGalleryImage);
  app.post("/api/gallery/:id/replace", galleryUpload.single('image'), replaceGalleryImage);
  app.post("/api/gallery/replace/:id", replaceGalleryImage);
  
  // City backgrounds upload
  app.post("/api/upload/city-background", uploadCityBackground);
  app.post("/api/upload/city-backgrounds/bulk", uploadMultipleCityBackgrounds);
  
  // Replace one gallery image with another
  app.post("/api/gallery/:id/replace-with/:replacementId", async (req: Request, res: Response) => {
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
  
  // Media Folders management 
  app.get("/api/media-folders", getMediaFolders);
  app.post("/api/media-folders", createMediaFolder);
  app.patch("/api/media-folders/:id", updateMediaFolder);
  app.delete("/api/media-folders/:id", deleteMediaFolder);

  // Newsletter subscription
  app.post("/api/subscribe", async (req: Request, res: Response) => {
    try {
      const validationResult = insertSubscriberSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid subscription data", 
          errors: validationResult.error.format() 
        });
      }
      
      const { email } = validationResult.data;
      
      // Check if user is already subscribed
      const existingSubscriber = await storage.getSubscriberByEmail(email);
      if (existingSubscriber) {
        return res.status(409).json({ message: "Email is already subscribed" });
      }
      
      const subscriber = await storage.createSubscriber({ email });
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
  app.post("/api/auth/forgot-password", passwordResetRateLimiter, requestPasswordResetValidation, requestPasswordReset);
  app.post("/api/auth/reset-password", resetPasswordValidation, resetPassword);

  // Protected routes (require authentication)
  app.post("/api/license/submit", requireAuth, licenseValidation, submitNurseLicense);
  app.get("/api/license", requireAuth, getNurseLicenses);
  app.post("/api/tickets/purchase", requireAuth, purchaseTicket);
  app.get("/api/tickets", requireAuth, getUserTickets);

  // QR Ticket Validation Routes
  app.get("/api/tickets/validate/:code", validateTicketByCode); // Public read-only validation
  app.post("/api/tickets/validate", requireAdmin, markTicketUsed); // Admin/venue staff only

  // Media Management API
  app.get("/api/media", getMediaList);
  app.get("/api/media/:id", getMediaById);
  app.post("/api/media/upload", upload.array('files'), uploadMediaFiles);
  app.patch("/api/media/:id", requireAuth, updateMedia);
  app.delete("/api/media/:id", requireAuth, deleteMedia);

  // Nurse License API Routes
  app.get("/api/licenses", requireAuth, async (req: Request, res: Response) => {
    try {
      // Get the user id from the request
      const userId = (req.user as any)?.id;
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
  app.post("/api/create-payment-intent", async (req: Request, res: Response) => {
    try {
      const { amount, items } = req.body;
      
      if (!amount || amount <= 0) {
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
      res.status(500).json({ message: error.message || "Failed to create payment intent" });
    }
  });

  // ========== JOB BOARD API ==========
  
  // Job Listings
  app.get("/api/jobs", async (req: Request, res: Response) => {
    try {
      const filters: any = {};
      
      // Extract filter parameters from query
      if (req.query.specialty) filters.specialty = req.query.specialty;
      if (req.query.location) filters.location = req.query.location;
      if (req.query.jobType) filters.jobType = req.query.jobType;
      if (req.query.experienceLevel) filters.experienceLevel = req.query.experienceLevel;
      if (req.query.keywords) filters.keywords = req.query.keywords as string;
      if (req.query.salaryMin) filters.salaryMin = parseInt(req.query.salaryMin as string);
      if (req.query.employerId) filters.employerId = parseInt(req.query.employerId as string);
      
      // Default to active jobs only
      filters.isActive = req.query.showInactive ? undefined : true;
      
      const jobs = await storage.getAllJobListings(filters);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });
  
  app.get("/api/jobs/featured", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
      const featuredJobs = await storage.getFeaturedJobListings(limit);
      res.json(featuredJobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured jobs" });
    }
  });
  
  app.get("/api/jobs/recent", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const recentJobs = await storage.getRecentJobListings(limit);
      res.json(recentJobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent jobs" });
    }
  });
  
  app.get("/api/jobs/:id", async (req: Request, res: Response) => {
    try {
      // Optional auth: set req.user when Bearer token present so has_applied/is_saved work
      const payload = getPayloadFromRequest(req);
      if (payload) {
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
      
      // Increment view count
      await storage.incrementJobListingViews(id);
      
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
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
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
      
      // Get employer for the user
      const employer = await storage.getEmployerByUserId(req.user.userId);
      if (!employer) {
        return res.status(403).json({ message: "You must register as an employer first" });
      }
      if (employer.account_status && employer.account_status !== "active") {
        return res.status(403).json({ message: "Employer account is not active. Please wait for approval." });
      }

      const credits = (employer as any).job_post_credits ?? 0;
      const passExpiresAt = (employer as any).job_post_pass_expires_at ?? null;
      const lifetime = !!(employer as any).job_post_lifetime;
      const passActive = !!passExpiresAt && new Date(passExpiresAt).getTime() > Date.now();
      const canPost = lifetime || passActive || credits > 0;
      if (!canPost) {
        return res.status(402).json({ message: "Payment required to post jobs (no active entitlement)" });
      }
      
      const jobListing = await storage.createJobListing(validationResult.data, employer.id);

      // Consume one credit when applicable
      if (!lifetime && !passActive) {
        await db
          .update(employers)
          .set({
            job_post_credits: sql`${employers.job_post_credits} - 1`,
            updated_at: new Date(),
          })
          .where(eq(employers.id, employer.id));
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

      // Update editable fields
      await storage.updateJobListing(id, {
        title, description, responsibilities, requirements, benefits, location,
        job_type, work_arrangement, specialty, experience_level, education_required,
        certification_required, shift_type, salary_min, salary_max, salary_period,
        application_url, contact_email, expiry_date,
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
      return res.json(applications);
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
      return res.status(500).json({ message: error.message || "Failed to fetch entitlements" });
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

      const finalQty = purchaseType === "perPost" ? Math.max(1, quantity || 1) : 1;
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
      return res.status(500).json({ message: error.message || "Failed to create payment intent" });
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
        quantity = Number.isFinite(q) && q > 0 ? q : 1;
      } else {
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (!pi) return res.status(404).json({ message: "PaymentIntent not found" });
        if (pi.status !== "succeeded") return res.status(400).json({ message: `Payment not completed (status=${pi.status})` });
        const meta = (pi.metadata || {}) as any;
        if (meta.employerId && String(meta.employerId) !== String(employerRow.id)) {
          return res.status(403).json({ message: "PaymentIntent does not belong to this employer" });
        }
        purchaseType = meta.purchaseType || null;
        quantity = parseInt(meta.quantity || "1", 10) || 1;
      }

      if (!purchaseType || !["perPost", "pass", "lifetime"].includes(purchaseType)) {
        return res.status(400).json({ message: "Invalid purchaseType for confirmation" });
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

      return res.json({ success: true });
    } catch (error: any) {
      console.error("Error confirming employer job-post payment:", error);
      return res.status(500).json({ message: error.message || "Failed to confirm payment" });
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
  app.post("/api/jobs/apply", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user?.isVerified) {
        return res.status(403).json({ message: "You must be verified to apply for jobs" });
      }
      
      const { jobId, coverLetter, resumeUrl } = req.body;
      if (!jobId) {
        return res.status(400).json({ message: "Job ID is required" });
      }
      
      // Check if job exists
      const job = await storage.getJobListingById(parseInt(jobId));
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
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
  app.post("/api/jobs/save", requireAuth, async (req: Request, res: Response) => {
    try {
      const { jobId, notes } = req.body;
      if (!jobId) {
        return res.status(400).json({ message: "Job ID is required" });
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
      
      await storage.deleteJobAlert(id);
      res.json({ message: "Job alert deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete job alert" });
    }
  });
  
  // Authentication status - should now be handled by session-auth
  // This route is kept for backward compatibility
  app.get("/api/auth/status", (req: Request, res: Response) => {
    const sessionAuthenticated =
      typeof req.isAuthenticated === "function" && req.isAuthenticated();
    const sessionUser = sessionAuthenticated ? (req.user as any) : null;

    const jwtPayload = sessionAuthenticated ? null : getPayloadFromRequest(req);
    const jwtUser = jwtPayload
      ? {
          id: jwtPayload.userId,
          email: jwtPayload.email,
          is_verified: jwtPayload.isVerified,
          is_admin: jwtPayload.isAdmin,
        }
      : null;

    const user = sessionUser ?? jwtUser;

    res.json({
      isAuthenticated: !!user,
      isVerified: !!user?.is_verified,
      isAdmin: !!user?.is_admin,
      user: user || null,
    });
  });

  // Self-service profile update (authenticated user updates their own first/last name)
  app.patch("/api/auth/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.userId ?? (req.user as any)?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

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

  app.post("/api/videos/upload-url", async (req: Request, res: Response) => {
    try {
      const provider = getVideoProvider();
      const filename = typeof req.body?.filename === "string" ? req.body.filename : "upload.mp4";
      const contentType = typeof req.body?.contentType === "string" ? req.body.contentType : "video/mp4";
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
      res.status(500).json({ success: false, message: err instanceof Error ? err.message : "Failed to create upload URL" });
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
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  });

  // ========== VIDEO APPROVAL API (Admin only) ==========

  const requireAdminToken = (req: Request, res: Response, next: any) => {
    if (!isUserAdmin(req)) return res.status(403).json({ message: "Admin privileges required" });
    return next();
  };

  // Admin: Get all users (exclude password_hash from response)
  app.get("/api/admin/users", requireAdminToken, async (_req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.map(({ password_hash: _p, ...u }) => u);
      return res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin: Update user
  app.patch("/api/admin/users/:id", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid user ID" });
      
      const user = await storage.getUserById(id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const { is_admin, is_verified, is_suspended } = req.body;
      const updates: any = {};
      if (typeof is_admin === 'boolean') updates.is_admin = is_admin;
      if (typeof is_verified === 'boolean') updates.is_verified = is_verified;
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

      await storage.deleteUser(id);
      return res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      return res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Admin: Get all jobs (with employer name joined)
  app.get("/api/admin/jobs", requireAdminToken, async (_req: Request, res: Response) => {
    try {
      const rows = await db
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
        .leftJoin(employers, eq(jobListings.employer_id, employers.id))
        .orderBy(desc(jobListings.posted_date));

      return res.json(rows.map(r => {
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
        const email = sub.email.replace(/"/g, '""'); // Escape quotes
        const createdAt = sub.created_at 
          ? new Date(sub.created_at).toISOString() 
          : "";
        return `"${email}","${createdAt}"`;
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

      const updated = await storage.updateEmployer(id, req.body);
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

      const adminId = (req as any).user?.userId;
      const updated = await storage.updateJobListing(id, {
        is_approved: true,
        approved_by: adminId,
        approved_at: new Date(),
        approval_notes: req.body?.notes,
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

      const adminId = (req as any).user?.userId;
      const updated = await storage.updateJobListing(id, {
        is_approved: false,
        approved_by: adminId,
        approved_at: new Date(),
        approval_notes: req.body?.notes,
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

  // Admin: contact request decisions
  app.patch("/api/admin/contact-requests/:id/approve", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid contact request ID" });

      const adminId = (req as any).user?.userId;
      const [updated] = await db
        .update(contactRequests)
        .set({
          status: "approved",
          reviewed_at: new Date(),
          reviewed_by: adminId,
          contact_revealed_at: new Date(),
          admin_notes: req.body?.notes,
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

      const adminId = (req as any).user?.userId;
      const [updated] = await db
        .update(contactRequests)
        .set({
          status: "denied",
          reviewed_at: new Date(),
          reviewed_by: adminId,
          admin_notes: req.body?.notes,
          denial_reason: req.body?.reason,
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
    try {
      if (getVideoProviderId() !== "b2") {
        return res.status(400).json({ success: false, message: "Backfill only supported for VIDEO_PROVIDER=b2" });
      }

      const sourcePrefix = (process.env.VIDEO_SOURCE_PREFIX || "").replace(/\/+$/, "");
      const limit = Number(req.body?.limit ?? 25);
      const mp4s = (await listB2Objects(sourcePrefix || undefined))
        .filter((o) => o.key.toLowerCase().endsWith(".mp4"))
        .slice(0, Number.isFinite(limit) ? limit : 25);

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

      const Key = posterKeyForVideoId(videoId);
      const Bucket = getB2Bucket();
      const s3 = getB2S3Client();

      await s3.send(
        new PutObjectCommand({
          Bucket,
          Key,
          Body: file.buffer,
          ContentType: file.mimetype || "image/jpeg",
        }),
      );

      res.json({ success: true, videoId, key: Key, url: publicUrlForKey(Key) });
    } catch (error) {
      console.error("Error uploading thumbnail:", error);
      res.status(500).json({ message: "Failed to upload thumbnail" });
    }
  });

  // Thumbnails: server-side generation (requires ffmpeg)
  app.post("/api/admin/videos/generate-thumbnail", requireAdminToken, async (req: Request, res: Response) => {
    try {
      const videoUrl = typeof req.body?.videoUrl === "string" ? req.body.videoUrl : "";
      const videoId = typeof req.body?.videoId === "string" ? req.body.videoId : "";

      if (!videoUrl) return res.status(400).json({ message: "videoUrl is required" });
      if (!videoId) return res.status(400).json({ message: "videoId is required" });
      if (!ffmpegPath) return res.status(500).json({ message: "ffmpeg binary not available" });

      ffmpeg.setFfmpegPath(ffmpegPath as any);

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nr-thumb-"));
      const outPath = path.join(tmpDir, `${videoId}.jpg`);

      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoUrl)
          .outputOptions(["-ss 00:00:03.000", "-frames:v 1"])
          .output(outPath)
          .on("end", () => resolve())
          .on("error", (err: any) => reject(err))
          .run();
      });

      const buf = fs.readFileSync(outPath);
      const Key = posterKeyForVideoId(videoId);
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

      res.json({ success: true, videoId, key: Key, url: publicUrlForKey(Key) });
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to generate thumbnail" });
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
  app.post("/api/store/orders", requireAuth, async (req: Request, res: Response) => {
    try {
      const { order, items } = req.body;
      
      if (!order || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Invalid order data" });
      }
      
      // Validate order data
      const orderValidation = insertStoreOrderSchema.safeParse({
        ...order,
        user_id: req.user!.userId
      });
      
      if (!orderValidation.success) {
        return res.status(400).json({
          message: "Invalid order data",
          errors: orderValidation.error.format()
        });
      }
      
      // Validate order items
      for (const item of items) {
        const itemValidation = insertStoreOrderItemSchema.safeParse(item);
        if (!itemValidation.success) {
          return res.status(400).json({
            message: "Invalid order item data",
            errors: itemValidation.error.format()
          });
        }
        
        // Verify product exists
        const product = await storage.getStoreProductById(item.product_id);
        if (!product) {
          return res.status(404).json({ 
            message: `Product with ID ${item.product_id} not found` 
          });
        }
        
        // Check stock availability
        if (product.stock_quantity < item.quantity) {
          return res.status(400).json({ 
            message: `Insufficient stock for product ${product.name}` 
          });
        }
      }
      
      const createdOrder = await storage.createStoreOrder(
        orderValidation.data,
        items
      );
      
      res.status(201).json({ 
        id: createdOrder.id,
        message: "Order created successfully"
      });
    } catch (error) {
      console.error("Error creating order:", error);
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
        validatedData.description || null,
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
      if (!submittedPin || submittedPin !== ADMIN_PIN) {
        return res.status(401).json({ message: "Invalid admin PIN" });
      }
      const adminUser = {
        id: 999999,
        email: "admin@nursingrocks.com",
        is_verified: true,
        is_admin: true
      };
      const token = generateToken(adminUser as any);
      res.status(200).json({ token });
    } catch (error) {
      console.error("Error generating admin token:", error);
      res.status(500).json({ message: "Failed to generate admin token" });
    }
  });
  
  // Admin logout endpoint
  app.post("/api/admin/logout", (_req: Request, res: Response) => {
    try {
      // Since we're using JWT tokens, we only need to return success
      // The actual token invalidation happens client-side by removing the token
      res.status(200).json({ message: "Admin logout successful" });
    } catch (error) {
      console.error("Error in admin logout:", error);
      res.status(500).json({ message: "Failed to process logout" });
    }
  });

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
        message: "Failed to run email schedules",
        error: error instanceof Error ? error.message : 'Unknown error',
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
        message: "Failed to get email schedule status",
        error: error instanceof Error ? error.message : 'Unknown error',
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
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error"
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
          console.error("CustomCat API connection failed:", result.errors || result.message);
          return res.status(400).json({ 
            success: false, 
            message: result.message || "Failed to connect to CustomCat API. Please check your API key.",
            errors: result.errors,
            statusCode: 400
          });
        }
        
        // Get products from the result
        const rawProductsData = result.products || [];
        
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
                metadata: product.metadata, // This contains all the original CustomCat data
                is_featured: existingProduct.is_featured, // Preserve featured status
                is_available: product.is_available
              });
              syncResults.updated++;
            } else {
              // Create new product
              await storage.createStoreProduct(product);
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
          error: error instanceof Error ? error.message : "Unknown error",
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

  // Ticket code generator — unambiguous chars, collision-safe
  function generateTicketCode(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `NRPX-${segment()}-${segment()}`;
  }

  // Simple in-memory rate limiter: IP → [timestamps]
  const nrpxRateLimitMap = new Map<string, number[]>();
  function nrpxRateLimit(ip: string): boolean {
    const now = Date.now();
    const window = 60 * 60 * 1000; // 1 hour
    const hits = (nrpxRateLimitMap.get(ip) || []).filter(t => now - t < window);
    if (hits.length >= 5) return false;
    hits.push(now);
    nrpxRateLimitMap.set(ip, hits);
    return true;
  }

  // POST /api/nrpx/register — public nurse registration
  app.post("/api/nrpx/register", async (req: Request, res: Response) => {
    try {
      const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
      if (!nrpxRateLimit(ip)) {
        return res.status(429).json({ success: false, message: "Too many registrations from this IP. Please try again later." });
      }

      // Validate input
      const { firstName, lastName, email, employer } = req.body;
      if (!firstName?.trim() || firstName.trim().length > 100) return res.status(400).json({ success: false, message: "First name is required (max 100 chars)." });
      if (!lastName?.trim() || lastName.trim().length > 100) return res.status(400).json({ success: false, message: "Last name is required (max 100 chars)." });
      const emailNorm = email?.trim().toLowerCase();
      if (!emailNorm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) return res.status(400).json({ success: false, message: "A valid email address is required." });
      if (employer && employer.trim().length > 255) return res.status(400).json({ success: false, message: "Employer name is too long (max 255 chars)." });

      // Cap check: max 500 registrations
      const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(nrpxRegistrations);
      if (count >= 500) {
        return res.status(409).json({ success: false, message: "Registration is full. Thank you for your interest!" });
      }

      // Duplicate email check
      const existing = await db.select({ id: nrpxRegistrations.id }).from(nrpxRegistrations)
        .where(eq(nrpxRegistrations.email, emailNorm)).limit(1);
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: "This email is already registered. Check your inbox for your ticket." });
      }

      // Generate unique ticket code
      let ticketCode = '';
      for (let i = 0; i < 10; i++) {
        const candidate = generateTicketCode();
        const collision = await db.select({ id: nrpxRegistrations.id }).from(nrpxRegistrations)
          .where(eq(nrpxRegistrations.ticket_code, candidate)).limit(1);
        if (collision.length === 0) { ticketCode = candidate; break; }
      }
      if (!ticketCode) return res.status(500).json({ success: false, message: "Could not generate ticket code. Please try again." });

      // Insert registration
      const [reg] = await db.insert(nrpxRegistrations).values({
        ticket_code: ticketCode,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: emailNorm,
        employer: employer?.trim() || null,
      }).returning();

      // Generate QR code
      const qrBuffer = await QRCode.toBuffer(ticketCode, {
        type: 'png',
        width: 400,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
        errorCorrectionLevel: 'H',
      });

      // Send ticket email
      const emailResult = await sendNrpxTicketEmail({
        firstName: reg.first_name,
        lastName: reg.last_name,
        email: reg.email,
        ticketCode: reg.ticket_code,
        qrBuffer,
      });

      // Mark email sent
      if (emailResult.success) {
        await db.update(nrpxRegistrations)
          .set({ email_sent: true, email_sent_at: new Date() })
          .where(eq(nrpxRegistrations.id, reg.id));
      }

      console.log(`[NRPX] Registered: ${reg.email} → ${ticketCode} | email: ${emailResult.success}`);
      res.status(201).json({ success: true, message: "Check your email for your ticket! 🎸" });
    } catch (error) {
      console.error("[NRPX] Registration error:", error);
      res.status(500).json({ success: false, message: "Registration failed. Please try again." });
    }
  });

  // GET /api/nrpx/verify/:code — QR scanner verification (marks check-in)
  app.get("/api/nrpx/verify/:code", async (req: Request, res: Response) => {
    try {
      const code = req.params.code?.toUpperCase().trim();
      if (!code) return res.status(400).json({ valid: false, message: "No ticket code provided." });

      const [reg] = await db.select().from(nrpxRegistrations)
        .where(eq(nrpxRegistrations.ticket_code, code)).limit(1);

      if (!reg) return res.status(404).json({ valid: false, message: "Ticket not found." });

      if (reg.checked_in) {
        const checkedInAt = reg.checked_in_at
          ? new Date(reg.checked_in_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          : 'earlier';
        return res.json({
          valid: false,
          alreadyUsed: true,
          message: `Already checked in at ${checkedInAt}`,
          name: `${reg.first_name} ${reg.last_name}`,
        });
      }

      await db.update(nrpxRegistrations)
        .set({ checked_in: true, checked_in_at: new Date() })
        .where(eq(nrpxRegistrations.id, reg.id));

      console.log(`[NRPX] Checked in: ${reg.first_name} ${reg.last_name} (${code})`);
      res.json({ valid: true, name: `${reg.first_name} ${reg.last_name}`, message: "Welcome!" });
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
      res.json({ total, checkedIn });
    } catch (error) {
      console.error("[NRPX] Stats error:", error);
      res.status(500).json({ total: 0, checkedIn: 0 });
    }
  });

  // GET /api/admin/nrpx/registrations — admin list with search/filter
  app.get("/api/admin/nrpx/registrations", requireAdmin, async (req: Request, res: Response) => {
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
  app.post("/api/admin/nrpx/registrations/resend/:id", requireAdmin, async (req: Request, res: Response) => {
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
  app.get("/api/admin/nrpx/registrations/export", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const regs = await db.select().from(nrpxRegistrations).orderBy(nrpxRegistrations.registered_at);
      const header = 'Ticket Code,First Name,Last Name,Email,Employer,Registered At,Email Sent,Checked In,Checked In At\n';
      const rows = regs.map(r =>
        [
          r.ticket_code,
          `"${r.first_name}"`,
          `"${r.last_name}"`,
          r.email,
          r.employer ? `"${r.employer}"` : '',
          r.registered_at ? new Date(r.registered_at).toISOString() : '',
          r.email_sent ? 'Yes' : 'No',
          r.checked_in ? 'Yes' : 'No',
          r.checked_in_at ? new Date(r.checked_in_at).toISOString() : '',
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

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
