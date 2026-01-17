import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import path from "path";
import fs from "fs";
import { db } from "./db";
import { eq, sql, and } from "drizzle-orm";
import { storage } from "./storage";
import { approvedVideos, gallery, mediaFolders, events } from "@shared/schema";
import { processImage } from "./image-utils";

// Dynamic import for sharp (handles serverless environments where sharp might not be available)
let sharp: typeof import('sharp') | null = null;
try {
  sharp = require('sharp');
} catch (e) {
  console.warn('[routes] Sharp not available - some image features disabled');
}
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
  authenticateToken,
  registerValidation,
  loginValidation,
  register,
  login,
  requireEmployerToken
} from "./auth";
import { setupAuth, requireAuth, requireVerifiedUser, requireAdmin } from "./session-auth";
import { generateToken, isUserAdmin } from './jwt';
import {
  upload,
  uploadMediaFiles,
  getMediaList,
  getMediaById,
  updateMedia,
  deleteMedia
} from "./media";

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
                  image_url: processedImage.original,
                  updated_at: new Date()
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
  app.post("/api/auth/register", registerValidation, register);
  app.post("/api/auth/login", loginValidation, login);

  // Protected routes (require authentication)
  app.post("/api/license/submit", requireAuth, licenseValidation, submitNurseLicense);
  app.get("/api/license", requireAuth, getNurseLicenses);
  app.post("/api/tickets/purchase", requireAuth, purchaseTicket);
  app.get("/api/tickets", requireAuth, getUserTickets);

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
      
      if (req.user?.userId) {
        const applications = await storage.getJobApplicationsByUserId(req.user.userId);
        hasApplied = applications.some(app => app.job_id === id);
        
        const savedJobs = await storage.getSavedJobsByUserId(req.user.userId);
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
    const isAuthenticated = req.isAuthenticated();
    const isVerified = req.isAuthenticated() && (req.user as any)?.is_verified;
    const isAdmin = req.isAuthenticated() && (req.user as any)?.is_admin;
    
    res.json({
      isAuthenticated,
      isVerified,
      isAdmin,
      user: req.user || null
    });
  });

  // ========== VIDEO API (Provider-neutral) ==========

  app.get("/api/videos", async (req: Request, res: Response) => {
    try {
      const provider = getVideoProvider();
      const prefix = (req.query.folder as string) || undefined;
      const fetchAll = req.query.all === "true";
      const isAdmin = isUserAdmin(req);

      let resources = await provider.listSourceVideos({ prefix });
      if (!(fetchAll && isAdmin)) {
        const approvedList = await db
          .select({ public_id: approvedVideos.public_id })
          .from(approvedVideos)
          .where(eq(approvedVideos.approved, true));
        const approvedIds = new Set(approvedList.map((v) => v.public_id));
        resources = resources.filter((r) => approvedIds.has(r.public_id));
      }

      res.json({ success: true, resources, total: resources.length });
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

  // Admin: Get all users
  app.get("/api/admin/users", requireAdminToken, async (_req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      return res.json(users);
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
      if (typeof is_suspended === 'boolean') {
        // Assuming there's a suspended field or we use account_status
        // For now, we'll skip this if the storage doesn't support it
      }

      const updated = await storage.updateUser(id, updates);
      return res.json(updated);
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

  // Admin: Get all jobs
  app.get("/api/admin/jobs", requireAdminToken, async (_req: Request, res: Response) => {
    try {
      const jobs = await storage.getAllJobListings();
      return res.json(jobs);
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
      
      // Check if user is requesting their own orders or is an admin
      if (userId !== req.user!.userId && !req.user?.isAdmin) {
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
      
      // Only return sensitive settings to admins - use isUserAdmin helper for reliable JWT checks
      // For sensitive keys (like API keys), always check for proper admin authentication
      if (setting.is_sensitive) {
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
  app.post("/api/admin/token", async (req: Request, res: Response) => {
    try {
      const { pin } = req.body;
      
      // Admin PIN from environment variable (trim whitespace)
      const ADMIN_PIN = (process.env.ADMIN_PIN || "1234567").trim();
      
      // Normalize the submitted PIN (convert to string and trim)
      const submittedPin = pin ? String(pin).trim() : "";
      
      // Debug logging (remove in production)
      console.log("Admin PIN validation attempt:", {
        submittedPin: submittedPin ? `${submittedPin.substring(0, 2)}***` : "(empty)",
        submittedPinLength: submittedPin.length,
        expectedPin: ADMIN_PIN ? `${ADMIN_PIN.substring(0, 2)}***` : "(empty)",
        expectedPinLength: ADMIN_PIN.length,
        hasEnvPin: !!process.env.ADMIN_PIN,
        pinMatch: submittedPin === ADMIN_PIN,
        rawPinType: typeof pin,
        rawPinValue: pin ? String(pin).substring(0, 2) + "***" : "(empty)"
      });
      
      if (!submittedPin || submittedPin !== ADMIN_PIN) {
        return res.status(401).json({ message: "Invalid admin PIN" });
      }
      
      // Create a fake admin user object for token generation
      const adminUser = {
        id: 999999, // Use a reserved ID for admin
        email: "admin@nursingrocks.com",
        is_verified: true,
        is_admin: true // Admin-specific flag
      };
      
      // Generate a token with admin privileges
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
            productCount: result.products ? result.products.length : 0,
            configured: true,
            status: "connected"
          });
        } else {
          console.error("CustomCat API verification failed:", result.message || result.errors);
          
          return res.status(400).json({ 
            success: false, 
            message: result.message || "Failed to connect to CustomCat API. Please check your API key.",
            errors: result.errors,
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
  
  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
