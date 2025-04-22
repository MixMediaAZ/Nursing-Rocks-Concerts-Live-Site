import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import { gallery } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { storage } from './storage';

// Configure multer for gallery image uploads
const galleryStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    // Ensure the gallery directory exists
    const galleryDir = path.join(process.cwd(), 'public/gallery');
    if (!fs.existsSync(galleryDir)) {
      fs.mkdirSync(galleryDir, { recursive: true });
    }
    cb(null, galleryDir);
  },
  filename: (_req, file, cb) => {
    // Generate a unique filename with the original extension
    const originalExt = path.extname(file.originalname);
    const filename = `${Date.now()}-${uuidv4().substring(0, 8)}${originalExt}`;
    cb(null, filename);
  },
});

// Configure file filter to limit to images only
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Only images are allowed.`));
  }
};

// Configure upload limits
const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB max file size
  files: 20, // Max number of files per upload
};

// Create the multer upload instance for gallery
export const galleryUpload = multer({ 
  storage: galleryStorage, 
  fileFilter, 
  limits 
});

/**
 * Upload gallery images
 */
export async function uploadGalleryImages(req: Request, res: Response) {
  try {
    // Check if files were uploaded
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      return res.status(400).json({ success: false, message: 'No images uploaded' });
    }
    
    const eventId = req.body.event_id ? parseInt(req.body.event_id) : null;
    
    // Process the files
    const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
    const uploadedImages = [];
    
    for (const file of files) {
      // Create database record for the gallery image
      const [newImage] = await db.insert(gallery).values({
        image_url: `/gallery/${file.filename}`,
        alt_text: req.body.alt_text || 'Nursing Rocks Concert Image',
        event_id: eventId
      }).returning();
      
      uploadedImages.push(newImage);
    }
    
    res.status(201).json({ 
      success: true, 
      message: `Successfully uploaded ${uploadedImages.length} images`,
      images: uploadedImages 
    });
  } catch (error: any) {
    console.error('Error uploading gallery images:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to upload images' });
  }
}

/**
 * Delete a gallery image
 */
export async function deleteGalleryImage(req: Request, res: Response) {
  try {
    const imageId = parseInt(req.params.id);
    if (isNaN(imageId)) {
      return res.status(400).json({ success: false, message: 'Invalid image ID' });
    }
    
    // Get the image to delete
    const [imageToDelete] = await db.select().from(gallery).where(eq(gallery.id, imageId));
    
    if (!imageToDelete) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    
    // Remove the database record
    await db.delete(gallery).where(eq(gallery.id, imageId));
    
    // Extract the filename from the URL path
    // Only delete from local storage if it's a local file (starts with /gallery/)
    if (imageToDelete.image_url.startsWith('/gallery/')) {
      const filename = path.basename(imageToDelete.image_url);
      const filePath = path.join(process.cwd(), 'public/gallery', filename);
      
      // Delete the file if it exists
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting gallery image:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete image' });
  }
}

/**
 * Update gallery image metadata
 */
export async function updateGalleryImage(req: Request, res: Response) {
  try {
    const imageId = parseInt(req.params.id);
    if (isNaN(imageId)) {
      return res.status(400).json({ success: false, message: 'Invalid image ID' });
    }
    
    const { alt_text, event_id } = req.body;
    const updates: any = {};
    
    if (alt_text !== undefined) updates.alt_text = alt_text;
    if (event_id !== undefined) updates.event_id = parseInt(event_id);
    
    // Update the image record
    const [updatedImage] = await db
      .update(gallery)
      .set(updates)
      .where(eq(gallery.id, imageId))
      .returning();
    
    if (!updatedImage) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    
    res.json({ success: true, image: updatedImage });
  } catch (error: any) {
    console.error('Error updating gallery image:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update image' });
  }
}

/**
 * Get gallery images by event
 */
export async function getGalleryImagesByEvent(req: Request, res: Response) {
  try {
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID' });
    }
    
    const images = await storage.getEventGalleryImages(eventId);
    res.json(images);
  } catch (error: any) {
    console.error('Error fetching gallery images:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch images' });
  }
}

/**
 * Get all gallery images
 */
export async function getAllGalleryImages(req: Request, res: Response) {
  try {
    const images = await storage.getAllGalleryImages();
    res.json(images);
  } catch (error: any) {
    console.error('Error fetching gallery images:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch images' });
  }
}