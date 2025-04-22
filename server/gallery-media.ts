import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import { gallery, mediaFolders } from '@shared/schema';
import { eq, and, isNull, desc, asc } from 'drizzle-orm';
import { processImage, SUPPORTED_IMAGE_TYPES } from './image-utils';

// Configure storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'gallery');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter to accept only image files
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (SUPPORTED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

// Set up multer
export const galleryUpload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * Create a media folder
 */
export async function createMediaFolder(req: Request, res: Response) {
  try {
    const { name, description, folder_type = 'general', parent_id = null, is_featured = false } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Folder name is required' });
    }
    
    const newFolder = await db.insert(mediaFolders).values({
      name: name.trim(),
      description: description ? description.trim() : null,
      folder_type,
      parent_id,
      is_featured: is_featured || false,
      sort_order: 0, // Default sort order
    }).returning();
    
    res.json(newFolder[0]);
  } catch (error) {
    console.error('Error creating media folder:', error);
    res.status(500).json({ error: 'Failed to create media folder' });
  }
}

/**
 * Get all media folders
 */
export async function getMediaFolders(req: Request, res: Response) {
  try {
    const folderType = req.query.type as string | undefined;
    const parentId = req.query.parent_id !== undefined 
      ? (req.query.parent_id === 'null' ? null : parseInt(req.query.parent_id as string, 10)) 
      : undefined;
    
    let query = db.select().from(mediaFolders);
    
    // Filter by folder type if specified
    if (folderType) {
      query = query.where(eq(mediaFolders.folder_type, folderType));
    }
    
    // Filter by parent_id if specified
    if (parentId !== undefined) {
      if (parentId === null) {
        query = query.where(isNull(mediaFolders.parent_id));
      } else {
        query = query.where(eq(mediaFolders.parent_id, parentId));
      }
    }
    
    // Order by sort_order and then by name
    query = query.orderBy(asc(mediaFolders.sort_order), asc(mediaFolders.name));
    
    const folders = await query;
    res.json(folders);
  } catch (error) {
    console.error('Error getting media folders:', error);
    res.status(500).json({ error: 'Failed to get media folders' });
  }
}

/**
 * Update a media folder
 */
export async function updateMediaFolder(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, folder_type, parent_id, is_featured, sort_order } = req.body;
    
    if (!id || isNaN(parseInt(id, 10))) {
      return res.status(400).json({ error: 'Invalid folder ID' });
    }
    
    const folderId = parseInt(id, 10);
    
    // Check if folder exists
    const [existingFolder] = await db.select().from(mediaFolders).where(eq(mediaFolders.id, folderId));
    if (!existingFolder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    // Update the folder
    const updatedFolder = await db.update(mediaFolders)
      .set({
        name: name !== undefined ? name.trim() : existingFolder.name,
        description: description !== undefined ? (description.trim() || null) : existingFolder.description,
        folder_type: folder_type || existingFolder.folder_type,
        parent_id: parent_id !== undefined ? parent_id : existingFolder.parent_id,
        is_featured: is_featured !== undefined ? is_featured : existingFolder.is_featured,
        sort_order: sort_order !== undefined ? sort_order : existingFolder.sort_order,
        updated_at: new Date(),
      })
      .where(eq(mediaFolders.id, folderId))
      .returning();
    
    res.json(updatedFolder[0]);
  } catch (error) {
    console.error('Error updating media folder:', error);
    res.status(500).json({ error: 'Failed to update media folder' });
  }
}

/**
 * Delete a media folder
 */
export async function deleteMediaFolder(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id, 10))) {
      return res.status(400).json({ error: 'Invalid folder ID' });
    }
    
    const folderId = parseInt(id, 10);
    
    // Check if folder exists
    const [existingFolder] = await db.select().from(mediaFolders).where(eq(mediaFolders.id, folderId));
    if (!existingFolder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    // Check if folder has child folders
    const childFolders = await db.select().from(mediaFolders).where(eq(mediaFolders.parent_id, folderId));
    if (childFolders.length > 0) {
      return res.status(400).json({ error: 'Cannot delete folder with child folders. Delete child folders first.' });
    }
    
    // Check if folder has gallery items
    const folderGalleryItems = await db.select().from(gallery).where(eq(gallery.folder_id, folderId));
    if (folderGalleryItems.length > 0) {
      return res.status(400).json({ error: 'Cannot delete folder with gallery items. Move or delete gallery items first.' });
    }
    
    // Delete the folder
    await db.delete(mediaFolders).where(eq(mediaFolders.id, folderId));
    
    res.json({ success: true, message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting media folder:', error);
    res.status(500).json({ error: 'Failed to delete media folder' });
  }
}

/**
 * Upload gallery images
 */
export async function uploadGalleryImages(req: Request, res: Response) {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const uploadedFiles = req.files as Express.Multer.File[];
    const event_id = req.body.event_id ? parseInt(req.body.event_id, 10) : null;
    const folder_id = req.body.folder_id ? parseInt(req.body.folder_id, 10) : null;
    const alt_text = req.body.alt_text || '';
    const media_type = req.body.media_type || 'image';
    
    const uploadResults = [];
    
    // Process each uploaded file
    for (const file of uploadedFiles) {
      const uploadDir = path.join(process.cwd(), 'uploads', 'gallery');
      
      // Process image to create different sizes
      const sizes = await processImage(
        file.path,
        uploadDir,
        path.parse(file.filename).name
      );
      
      // Insert into database
      const newImage = await db.insert(gallery).values({
        image_url: sizes.original,
        thumbnail_url: sizes.thumbnail,
        alt_text,
        event_id,
        folder_id,
        media_type,
        file_size: file.size,
        dimensions: null, // Could extract from metadata if needed
        sort_order: 0,
        z_index: 0,
        metadata: {},
      }).returning();
      
      uploadResults.push(newImage[0]);
    }
    
    res.json({ images: uploadResults });
  } catch (error) {
    console.error('Error uploading gallery images:', error);
    res.status(500).json({ error: 'Failed to upload gallery images' });
  }
}

/**
 * Delete a gallery image
 */
export async function deleteGalleryImage(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id, 10))) {
      return res.status(400).json({ error: 'Invalid image ID' });
    }
    
    const imageId = parseInt(id, 10);
    
    // Find the image to get the file paths
    const [image] = await db.select().from(gallery).where(eq(gallery.id, imageId));
    
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Delete from database
    await db.delete(gallery).where(eq(gallery.id, imageId));
    
    // Delete the files (could be made optional)
    // This would need to be adjusted based on your path format
    const basePath = path.join(process.cwd(), image.image_url.replace(/^\/uploads\/gallery\//, 'uploads/gallery/'));
    const thumbnailPath = path.join(process.cwd(), image.thumbnail_url.replace(/^\/uploads\/gallery\//, 'uploads/gallery/'));
    
    try {
      if (fs.existsSync(basePath)) fs.unlinkSync(basePath);
      if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);
      
      // Could also delete other sizes if they are stored
    } catch (fsError) {
      console.error('Error deleting image files:', fsError);
      // Continue even if file deletion fails
    }
    
    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    res.status(500).json({ error: 'Failed to delete gallery image' });
  }
}

/**
 * Update gallery image metadata
 */
export async function updateGalleryImage(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { 
      alt_text, 
      event_id, 
      folder_id, 
      sort_order,
      z_index,
      metadata
    } = req.body;
    
    if (!id || isNaN(parseInt(id, 10))) {
      return res.status(400).json({ error: 'Invalid image ID' });
    }
    
    const imageId = parseInt(id, 10);
    
    // Check if image exists
    const [existingImage] = await db.select().from(gallery).where(eq(gallery.id, imageId));
    if (!existingImage) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Update the image
    const updatedImage = await db.update(gallery)
      .set({
        alt_text: alt_text !== undefined ? alt_text : existingImage.alt_text,
        event_id: event_id !== undefined ? event_id : existingImage.event_id,
        folder_id: folder_id !== undefined ? folder_id : existingImage.folder_id,
        sort_order: sort_order !== undefined ? sort_order : existingImage.sort_order,
        z_index: z_index !== undefined ? z_index : existingImage.z_index,
        metadata: metadata !== undefined ? metadata : existingImage.metadata,
        updated_at: new Date(),
      })
      .where(eq(gallery.id, imageId))
      .returning();
    
    res.json(updatedImage[0]);
  } catch (error) {
    console.error('Error updating gallery image:', error);
    res.status(500).json({ error: 'Failed to update gallery image' });
  }
}

/**
 * Get gallery images by event
 */
export async function getGalleryImagesByEvent(req: Request, res: Response) {
  try {
    const { event_id } = req.params;
    
    if (!event_id || isNaN(parseInt(event_id, 10))) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }
    
    const eventId = parseInt(event_id, 10);
    
    const images = await db.select()
      .from(gallery)
      .where(eq(gallery.event_id, eventId))
      .orderBy(asc(gallery.sort_order), desc(gallery.id));
    
    res.json(images);
  } catch (error) {
    console.error('Error getting gallery images by event:', error);
    res.status(500).json({ error: 'Failed to get gallery images' });
  }
}

/**
 * Get gallery images by folder
 */
export async function getGalleryImagesByFolder(req: Request, res: Response) {
  try {
    const { folder_id } = req.params;
    
    if (!folder_id || (folder_id !== 'null' && isNaN(parseInt(folder_id, 10)))) {
      return res.status(400).json({ error: 'Invalid folder ID' });
    }
    
    let images;
    
    if (folder_id === 'null') {
      // Get images without a folder
      images = await db.select()
        .from(gallery)
        .where(isNull(gallery.folder_id))
        .orderBy(asc(gallery.sort_order), desc(gallery.id));
    } else {
      const folderId = parseInt(folder_id, 10);
      
      // Get images for the specified folder
      images = await db.select()
        .from(gallery)
        .where(eq(gallery.folder_id, folderId))
        .orderBy(asc(gallery.sort_order), desc(gallery.id));
    }
    
    res.json(images);
  } catch (error) {
    console.error('Error getting gallery images by folder:', error);
    res.status(500).json({ error: 'Failed to get gallery images' });
  }
}

/**
 * Get all gallery images
 */
export async function getAllGalleryImages(req: Request, res: Response) {
  try {
    const mediaType = req.query.media_type as string | undefined;
    
    let query = db.select().from(gallery);
    
    // Filter by media type if specified
    if (mediaType) {
      query = query.where(eq(gallery.media_type, mediaType));
    }
    
    // Apply ordering
    query = query.orderBy(asc(gallery.sort_order), desc(gallery.id));
    
    const images = await query;
    res.json(images);
  } catch (error) {
    console.error('Error getting all gallery images:', error);
    res.status(500).json({ error: 'Failed to get gallery images' });
  }
}

/**
 * Replace gallery image with a new image
 */
export async function replaceGalleryImage(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id, 10))) {
      return res.status(400).json({ error: 'Invalid image ID' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const imageId = parseInt(id, 10);
    const file = req.file;
    
    // Find the original image
    const [originalImage] = await db.select().from(gallery).where(eq(gallery.id, imageId));
    
    if (!originalImage) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Process the new image
    const uploadDir = path.join(process.cwd(), 'uploads', 'gallery');
    const sizes = await processImage(
      file.path,
      uploadDir,
      path.parse(file.filename).name
    );
    
    // Update the image record
    const updatedImage = await db.update(gallery)
      .set({
        image_url: sizes.original,
        thumbnail_url: sizes.thumbnail,
        file_size: file.size,
        dimensions: null, // Could extract from metadata if needed
        updated_at: new Date(),
      })
      .where(eq(gallery.id, imageId))
      .returning();
    
    // Clean up old files (optional)
    const oldBasePath = path.join(process.cwd(), originalImage.image_url.replace(/^\/uploads\/gallery\//, 'uploads/gallery/'));
    const oldThumbnailPath = path.join(process.cwd(), originalImage.thumbnail_url.replace(/^\/uploads\/gallery\//, 'uploads/gallery/'));
    
    try {
      if (fs.existsSync(oldBasePath)) fs.unlinkSync(oldBasePath);
      if (fs.existsSync(oldThumbnailPath)) fs.unlinkSync(oldThumbnailPath);
    } catch (fsError) {
      console.error('Error deleting old image files:', fsError);
      // Continue even if file deletion fails
    }
    
    res.json(updatedImage[0]);
  } catch (error) {
    console.error('Error replacing gallery image:', error);
    res.status(500).json({ error: 'Failed to replace gallery image' });
  }
}