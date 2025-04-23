import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import path from "path";
import fs from "fs";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { storage } from "./storage";
import { gallery, mediaFolders } from "@shared/schema";
import sharp from "sharp";
import { processImage } from "./image-utils";
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
  insertStoreProductSchema,
  insertStoreOrderSchema,
  insertStoreOrderItemSchema
} from "@shared/schema";
import { z } from "zod";
import {
  register,
  login,
  registerValidation,
  loginValidation,
  licenseValidation,
  submitNurseLicense,
  getNurseLicenses,
  purchaseTicket,
  getUserTickets,
  authenticateToken
} from "./auth";
import { generateToken } from './jwt';
import {
  upload,
  uploadMediaFiles,
  getMediaList,
  getMediaById,
  updateMedia,
  deleteMedia
} from "./media";

export async function registerRoutes(app: Express): Promise<Server> {
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
              
              if (fs.existsSync(originalPath)) {
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
              } else {
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
          
          try {
            const originalImage2 = await sharp(originalPath);
            const originalMetadata = await originalImage2.metadata();
            dimensions = {
              width: originalMetadata.width,
              height: originalMetadata.height
            };
          } catch (err) {
            console.warn('Could not determine dimensions from original image, using default');
            // Continue without dimensions to use the original replacement size
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

  // Authentication and License Verification
  app.post("/api/auth/register", registerValidation, register);
  app.post("/api/auth/login", loginValidation, login);

  // Protected routes (require authentication)
  app.post("/api/license/submit", authenticateToken, licenseValidation, submitNurseLicense);
  app.get("/api/license", authenticateToken, getNurseLicenses);
  app.post("/api/tickets/purchase", authenticateToken, purchaseTicket);
  app.get("/api/tickets", authenticateToken, getUserTickets);

  // Media Management API
  app.get("/api/media", getMediaList);
  app.get("/api/media/:id", getMediaById);
  app.post("/api/media/upload", upload.array('files'), uploadMediaFiles);
  app.patch("/api/media/:id", authenticateToken, updateMedia);
  app.delete("/api/media/:id", authenticateToken, deleteMedia);

  // Nurse License API Routes
  app.get("/api/licenses", authenticateToken, async (req: Request, res: Response) => {
    try {
      // Get the user id from the request (could be id or userId depending on the source)
      const userId = (req as any).user?.id || (req as any).user?.userId;
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

  app.post("/api/licenses", authenticateToken, licenseValidation, submitNurseLicense);

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
  
  app.post("/api/jobs", authenticateToken, async (req: Request, res: Response) => {
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
      
      const jobListing = await storage.createJobListing(validationResult.data, employer.id);
      res.status(201).json({ 
        id: jobListing.id,
        message: "Job listing created successfully"
      });
    } catch (error) {
      console.error("Error creating job:", error);
      res.status(500).json({ message: "Failed to create job listing" });
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
  
  app.post("/api/employers", authenticateToken, async (req: Request, res: Response) => {
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
  app.get("/api/profile", authenticateToken, async (req: Request, res: Response) => {
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
  
  app.post("/api/profile", authenticateToken, async (req: Request, res: Response) => {
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
  app.post("/api/jobs/apply", authenticateToken, async (req: Request, res: Response) => {
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
          status: "submitted",
          submitted_at: new Date()
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
  
  app.get("/api/jobs/applications", authenticateToken, async (req: Request, res: Response) => {
    try {
      const applications = await storage.getJobApplicationsByUserId(req.user!.userId);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });
  
  // Saved Jobs
  app.post("/api/jobs/save", authenticateToken, async (req: Request, res: Response) => {
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
  
  app.get("/api/jobs/saved", authenticateToken, async (req: Request, res: Response) => {
    try {
      const savedJobs = await storage.getSavedJobsByUserId(req.user!.userId);
      res.json(savedJobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch saved jobs" });
    }
  });
  
  // Job Alerts
  app.post("/api/jobs/alerts", authenticateToken, async (req: Request, res: Response) => {
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
  
  app.get("/api/jobs/alerts", authenticateToken, async (req: Request, res: Response) => {
    try {
      const alerts = await storage.getJobAlertsByUserId(req.user!.userId);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job alerts" });
    }
  });
  
  app.delete("/api/jobs/alerts/:id", authenticateToken, async (req: Request, res: Response) => {
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
  
  // Authentication status
  app.get("/api/auth/status", (req: Request, res: Response) => {
    const isAuthenticated = !!req.user;
    const isVerified = !!req.user?.isVerified;
    
    res.json({
      isAuthenticated,
      isVerified,
      user: req.user ? {
        id: req.user.userId,
        email: req.user.email
      } : null
    });
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
  
  app.post("/api/store/products", authenticateToken, async (req: Request, res: Response) => {
    try {
      // Only admins can create products
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized: Admin privileges required" });
      }
      
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
  
  app.patch("/api/store/products/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      // Only admins can update products
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized: Admin privileges required" });
      }
      
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
  
  app.delete("/api/store/products/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      // Only admins can delete products
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized: Admin privileges required" });
      }
      
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
  app.post("/api/store/orders", authenticateToken, async (req: Request, res: Response) => {
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
  
  app.get("/api/store/orders/user/:userId", authenticateToken, async (req: Request, res: Response) => {
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
      // @ts-ignore
      const isAdmin = req.user?.is_admin === true;
      
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
      
      // Only return sensitive settings to admins
      // @ts-ignore
      if (setting.is_sensitive && (!req.isAuthenticated() || req.user?.is_admin !== true)) {
        return res.status(403).json({ message: "You don't have permission to access this setting" });
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
  app.get("/api/settings/store/customcat-status", async (_req: Request, res: Response) => {
    try {
      const apiKeySetting = await storage.getAppSettingByKey("CUSTOMCAT_API_KEY");
      const isConfigured = !!apiKeySetting && !!apiKeySetting.value;
      
      res.json({ 
        configured: isConfigured,
        message: isConfigured 
          ? "CustomCat API is configured" 
          : "CustomCat API key not configured"
      });
    } catch (error) {
      console.error("Error checking CustomCat API status:", error);
      res.status(500).json({ 
        configured: false,
        message: "Error checking CustomCat API configuration"
      });
    }
  });
  
  // Admin token generation for admin interface operations
  app.post("/api/admin/token", async (req: Request, res: Response) => {
    try {
      const { pin } = req.body;
      
      // Hard-coded admin PIN - in production, this should be stored securely
      const ADMIN_PIN = "1234567";
      
      if (!pin || pin !== ADMIN_PIN) {
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

  // Check if the CustomCat API connection is valid by making a test request
  app.get("/api/store/customcat/verify-connection", async (_req: Request, res: Response) => {
    try {
      const apiKeySetting = await storage.getAppSettingByKey("CUSTOMCAT_API_KEY");
      
      if (!apiKeySetting || !apiKeySetting.value) {
        return res.status(400).json({ 
          success: false, 
          message: "CustomCat API key not configured" 
        });
      }
      
      // Make a simple request to CustomCat API to check if the key is valid
      // We're just checking their /products endpoint to see if we get an authorized response
      const response = await fetch("https://api.customcat.com/api/v1/products", {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKeySetting.value}`
        }
      });
      
      if (response.ok) {
        return res.json({ 
          success: true, 
          message: "CustomCat API connection successful" 
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        return res.status(response.status).json({ 
          success: false, 
          message: errorData.message || "Invalid API key or connection error",
          statusCode: response.status
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
  app.post("/api/store/customcat/sync-products", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Not authorized to sync products. Admin privileges required" });
      }
      
      const apiKeySetting = await storage.getAppSettingByKey("CUSTOMCAT_API_KEY");
      
      if (!apiKeySetting || !apiKeySetting.value) {
        return res.status(400).json({ 
          success: false, 
          message: "CustomCat API key not configured" 
        });
      }
      
      // Fetch products from CustomCat API
      const response = await fetch("https://api.customcat.com/api/v1/products", {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKeySetting.value}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return res.status(response.status).json({ 
          success: false, 
          message: errorData.message || "Failed to fetch products from CustomCat",
          statusCode: response.status
        });
      }
      
      const productsData = await response.json();
      
      if (!Array.isArray(productsData)) {
        return res.status(500).json({ 
          success: false, 
          message: "Invalid response format from CustomCat API" 
        });
      }
      
      // Process and insert/update products in our database
      const syncResults = {
        total: productsData.length,
        added: 0,
        updated: 0,
        skipped: 0,
        errors: 0
      };
      
      for (const product of productsData) {
        try {
          // Check if product already exists in our database by external_id
          const existingProduct = await storage.getStoreProductByExternalId("customcat", product.id.toString());
          
          const productData = {
            name: product.title || product.name,
            description: product.description || "",
            price: product.retail_price ? product.retail_price.toString() : "0.00",
            image_url: product.image_url || product.featured_image || null,
            category: product.product_type || "CustomCat",
            is_featured: false,
            is_available: true,
            stock_quantity: 999, // CustomCat handles inventory, so we set a high value
            external_id: product.id.toString(),
            external_source: "customcat",
            metadata: {
              customcat_data: product,
              variants: product.variants || []
            }
          };
          
          if (existingProduct) {
            // Update existing product
            await storage.updateStoreProduct(existingProduct.id, productData);
            syncResults.updated++;
          } else {
            // Create new product
            await storage.createStoreProduct(productData);
            syncResults.added++;
          }
        } catch (err) {
          console.error("Error processing product:", err);
          syncResults.errors++;
        }
      }
      
      res.json({ 
        success: true, 
        message: "Product synchronization complete",
        results: syncResults
      });
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
