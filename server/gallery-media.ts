import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { db } from "./db";
import { gallery, mediaFolders } from "@shared/schema";
import { and, eq } from "drizzle-orm";
import { processImage, SUPPORTED_IMAGE_TYPES } from "./image-utils";

// Upload directory
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const GALLERY_DIR = path.join(UPLOAD_DIR, "gallery");

// Create directories if they don't exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(GALLERY_DIR)) {
  fs.mkdirSync(GALLERY_DIR, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, GALLERY_DIR);
  },
  filename: function (_req, file, cb) {
    const uniqueFilename = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  },
});

// File filter to only allow specific image types
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (SUPPORTED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type. Supported types: ${SUPPORTED_IMAGE_TYPES.join(", ")}`));
  }
};

// Configure multer upload
export const galleryUpload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

/**
 * Create a media folder
 */
export async function createMediaFolder(req: Request, res: Response) {
  try {
    const { name, description, folder_type, parent_id, sort_order, is_featured } = req.body;
    
    // Default folder type to 'general' if not provided
    const folderType = folder_type || 'general';
    
    // Make sure folder name is unique within the parent folder
    if (parent_id) {
      const existingFolder = await db.select().from(mediaFolders).where(
        and(
          eq(mediaFolders.name, name),
          eq(mediaFolders.parent_id, parent_id)
        )
      );
      
      if (existingFolder.length > 0) {
        return res.status(400).json({ 
          error: "A folder with this name already exists in the parent folder" 
        });
      }
    } else {
      // Check uniqueness at root level
      const existingFolder = await db.select().from(mediaFolders).where(
        and(
          eq(mediaFolders.name, name),
          eq(mediaFolders.parent_id, null)
        )
      );
      
      if (existingFolder.length > 0) {
        return res.status(400).json({ 
          error: "A folder with this name already exists at the root level" 
        });
      }
    }
    
    // Create the folder
    const [folder] = await db.insert(mediaFolders).values({
      name,
      description,
      folder_type: folderType,
      parent_id: parent_id || null,
      sort_order: sort_order || 0,
      is_featured: is_featured || false,
    }).returning();
    
    // Create physical folder if it doesn't exist
    const folderPath = path.join(GALLERY_DIR, `folder-${folder.id}`);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    res.status(201).json(folder);
  } catch (error) {
    console.error("Error creating media folder:", error);
    res.status(500).json({ error: "Failed to create media folder" });
  }
}

/**
 * Get all media folders
 */
export async function getMediaFolders(req: Request, res: Response) {
  try {
    const folderType = req.query.type as string;
    const parentId = req.query.parent_id ? Number(req.query.parent_id) : null;
    
    let query = db.select().from(mediaFolders);
    
    // Filter by folder type if provided
    if (folderType) {
      query = query.where(eq(mediaFolders.folder_type, folderType));
    }
    
    // Filter by parent_id if provided
    if (parentId !== null) {
      query = query.where(eq(mediaFolders.parent_id, parentId));
    } else if (req.query.parent_id === 'null') {
      // Get root folders
      query = query.where(eq(mediaFolders.parent_id, null));
    }
    
    // Sort by sort_order and then by name
    const folders = await query.orderBy(mediaFolders.sort_order, mediaFolders.name);
    
    res.json(folders);
  } catch (error) {
    console.error("Error fetching media folders:", error);
    res.status(500).json({ error: "Failed to fetch media folders" });
  }
}

/**
 * Update a media folder
 */
export async function updateMediaFolder(req: Request, res: Response) {
  try {
    const folderId = Number(req.params.id);
    const { name, description, folder_type, parent_id, sort_order, is_featured, thumbnail_url } = req.body;
    
    // Get the current folder to check if it exists
    const [existingFolder] = await db.select().from(mediaFolders).where(eq(mediaFolders.id, folderId));
    
    if (!existingFolder) {
      return res.status(404).json({ error: "Media folder not found" });
    }
    
    // Make sure name is unique within the parent folder if changing the name or parent
    if ((name && name !== existingFolder.name) || 
        (parent_id !== undefined && parent_id !== existingFolder.parent_id)) {
      
      const newParentId = parent_id !== undefined ? parent_id : existingFolder.parent_id;
      const newName = name || existingFolder.name;
      
      if (newParentId) {
        const conflictFolder = await db.select().from(mediaFolders).where(
          and(
            eq(mediaFolders.name, newName),
            eq(mediaFolders.parent_id, newParentId),
            mediaFolders.id.notEquals(folderId)
          )
        );
        
        if (conflictFolder.length > 0) {
          return res.status(400).json({ 
            error: "A folder with this name already exists in the parent folder" 
          });
        }
      } else {
        const conflictFolder = await db.select().from(mediaFolders).where(
          and(
            eq(mediaFolders.name, newName),
            eq(mediaFolders.parent_id, null),
            mediaFolders.id.notEquals(folderId)
          )
        );
        
        if (conflictFolder.length > 0) {
          return res.status(400).json({ 
            error: "A folder with this name already exists at the root level" 
          });
        }
      }
    }
    
    // Update the folder
    const [updatedFolder] = await db.update(mediaFolders)
      .set({
        name: name || existingFolder.name,
        description: description !== undefined ? description : existingFolder.description,
        folder_type: folder_type || existingFolder.folder_type,
        parent_id: parent_id !== undefined ? parent_id : existingFolder.parent_id,
        sort_order: sort_order !== undefined ? sort_order : existingFolder.sort_order,
        is_featured: is_featured !== undefined ? is_featured : existingFolder.is_featured,
        thumbnail_url: thumbnail_url !== undefined ? thumbnail_url : existingFolder.thumbnail_url,
        updated_at: new Date()
      })
      .where(eq(mediaFolders.id, folderId))
      .returning();
    
    res.json(updatedFolder);
  } catch (error) {
    console.error("Error updating media folder:", error);
    res.status(500).json({ error: "Failed to update media folder" });
  }
}

/**
 * Delete a media folder
 */
export async function deleteMediaFolder(req: Request, res: Response) {
  try {
    const folderId = Number(req.params.id);
    
    // Check if the folder exists
    const [folder] = await db.select().from(mediaFolders).where(eq(mediaFolders.id, folderId));
    
    if (!folder) {
      return res.status(404).json({ error: "Media folder not found" });
    }
    
    // Check if folder has media items
    const mediaItems = await db.select().from(gallery).where(eq(gallery.folder_id, folderId));
    
    if (mediaItems.length > 0 && !req.query.force) {
      return res.status(400).json({ 
        error: "Cannot delete folder that contains media items. Use ?force=true to force deletion." 
      });
    }
    
    // Check if folder has subfolders
    const subfolders = await db.select().from(mediaFolders).where(eq(mediaFolders.parent_id, folderId));
    
    if (subfolders.length > 0 && !req.query.force) {
      return res.status(400).json({ 
        error: "Cannot delete folder that contains subfolders. Use ?force=true to force deletion." 
      });
    }
    
    // If force is true, delete all media items and subfolders recursively
    if (req.query.force === 'true') {
      // Delete all media items in the folder
      if (mediaItems.length > 0) {
        await db.delete(gallery).where(eq(gallery.folder_id, folderId));
      }
      
      // Recursively delete subfolders and their content
      for (const subfolder of subfolders) {
        // Simulate a request to delete the subfolder
        const deleteReq = { 
          params: { id: subfolder.id.toString() }, 
          query: { force: 'true' } 
        } as unknown as Request;
        
        const deleteRes = {
          status: (code: number) => ({ 
            json: (data: any) => console.log(`Deleted subfolder ${subfolder.id}: ${code}`, data) 
          }),
        } as unknown as Response;
        
        await deleteMediaFolder(deleteReq, deleteRes);
      }
    }
    
    // Delete the folder
    await db.delete(mediaFolders).where(eq(mediaFolders.id, folderId));
    
    // Delete the physical folder if it exists
    const folderPath = path.join(GALLERY_DIR, `folder-${folderId}`);
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
    }
    
    res.json({ success: true, message: "Media folder deleted successfully" });
  } catch (error) {
    console.error("Error deleting media folder:", error);
    res.status(500).json({ error: "Failed to delete media folder" });
  }
}

/**
 * Upload gallery images
 */
export async function uploadGalleryImages(req: Request, res: Response) {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: "No files were uploaded" });
    }
    
    const folderId = req.body.folder_id ? Number(req.body.folder_id) : null;
    const eventId = req.body.event_id ? Number(req.body.event_id) : null;
    const mediaType = req.body.media_type || 'image';
    const altText = req.body.alt_text || '';
    const sortOrder = req.body.sort_order ? Number(req.body.sort_order) : 0;
    const zIndex = req.body.z_index ? Number(req.body.z_index) : 0;
    const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : null;
    
    // Process uploaded files
    const uploadedImages = [];
    
    for (const file of req.files as Express.Multer.File[]) {
      console.log("Processing file:", file.filename);
      
      try {
        // Determine target folder path
        let targetFolderPath = GALLERY_DIR;
        
        if (folderId) {
          targetFolderPath = path.join(GALLERY_DIR, `folder-${folderId}`);
          if (!fs.existsSync(targetFolderPath)) {
            fs.mkdirSync(targetFolderPath, { recursive: true });
          }
        }
        
        // Process image with various sizes
        const processedFiles = await processImage(
          file.path, 
          targetFolderPath, 
          path.parse(file.filename).name
        );
        
        // Get file dimensions if it's an image
        let dimensions = null;
        let duration = null;
        let fileSize = file.size;
        
        // Add record to database
        const [galleryImage] = await db.insert(gallery).values({
          image_url: processedFiles.original,
          thumbnail_url: processedFiles.thumbnail,
          alt_text: altText,
          event_id: eventId,
          folder_id: folderId,
          media_type: mediaType,
          file_size: fileSize,
          dimensions: dimensions,
          duration: duration,
          sort_order: sortOrder,
          z_index: zIndex,
          metadata: metadata,
        }).returning();
        
        // If this is the first image in the folder and the folder has no thumbnail, set it
        if (folderId && galleryImage) {
          const [folder] = await db.select().from(mediaFolders).where(eq(mediaFolders.id, folderId));
          
          if (folder && !folder.thumbnail_url) {
            await db.update(mediaFolders)
              .set({ thumbnail_url: processedFiles.thumbnail })
              .where(eq(mediaFolders.id, folderId));
          }
        }
        
        uploadedImages.push({
          ...galleryImage,
          processedFiles
        });
        
        // Clean up the original uploaded file if it's different from our processed files
        if (file.path !== processedFiles.original) {
          fs.unlinkSync(file.path);
        }
      } catch (procError) {
        console.error(`Error processing file ${file.filename}:`, procError);
        // Continue with the next file instead of failing the entire operation
      }
    }
    
    res.status(201).json(uploadedImages);
  } catch (error) {
    console.error("Error uploading gallery images:", error);
    res.status(500).json({ error: "Failed to upload gallery images" });
  }
}

/**
 * Delete a gallery image
 */
export async function deleteGalleryImage(req: Request, res: Response) {
  try {
    const imageId = Number(req.params.id);
    
    // Get the image data before deletion
    const [image] = await db.select().from(gallery).where(eq(gallery.id, imageId));
    
    if (!image) {
      return res.status(404).json({ error: "Gallery image not found" });
    }
    
    // Delete the record from the database
    await db.delete(gallery).where(eq(gallery.id, imageId));
    
    // Delete the files
    if (image.image_url) {
      const imagePath = path.join(process.cwd(), image.image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    if (image.thumbnail_url) {
      const thumbnailPath = path.join(process.cwd(), image.thumbnail_url);
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
    }
    
    // Check if this image was used as the folder thumbnail and update it
    if (image.folder_id && image.thumbnail_url) {
      const [folder] = await db.select().from(mediaFolders).where(eq(mediaFolders.id, image.folder_id));
      
      if (folder && folder.thumbnail_url === image.thumbnail_url) {
        // Find another image in the folder to use as thumbnail
        const [anotherImage] = await db.select()
          .from(gallery)
          .where(eq(gallery.folder_id, image.folder_id))
          .orderBy(gallery.id)
          .limit(1);
        
        if (anotherImage) {
          await db.update(mediaFolders)
            .set({ thumbnail_url: anotherImage.thumbnail_url })
            .where(eq(mediaFolders.id, image.folder_id));
        } else {
          // No images left in the folder, clear the thumbnail
          await db.update(mediaFolders)
            .set({ thumbnail_url: null })
            .where(eq(mediaFolders.id, image.folder_id));
        }
      }
    }
    
    res.json({ success: true, message: "Gallery image deleted successfully" });
  } catch (error) {
    console.error("Error deleting gallery image:", error);
    res.status(500).json({ error: "Failed to delete gallery image" });
  }
}

/**
 * Update gallery image metadata
 */
export async function updateGalleryImage(req: Request, res: Response) {
  try {
    const imageId = Number(req.params.id);
    const { 
      alt_text, 
      folder_id, 
      event_id, 
      sort_order, 
      z_index, 
      metadata,
      media_type
    } = req.body;
    
    // Check if the image exists
    const [existingImage] = await db.select().from(gallery).where(eq(gallery.id, imageId));
    
    if (!existingImage) {
      return res.status(404).json({ error: "Gallery image not found" });
    }
    
    // Update the image
    const [updatedImage] = await db.update(gallery)
      .set({
        alt_text: alt_text !== undefined ? alt_text : existingImage.alt_text,
        folder_id: folder_id !== undefined ? folder_id : existingImage.folder_id,
        event_id: event_id !== undefined ? event_id : existingImage.event_id,
        sort_order: sort_order !== undefined ? sort_order : existingImage.sort_order,
        z_index: z_index !== undefined ? z_index : existingImage.z_index,
        metadata: metadata !== undefined ? metadata : existingImage.metadata,
        media_type: media_type !== undefined ? media_type : existingImage.media_type,
        updated_at: new Date()
      })
      .where(eq(gallery.id, imageId))
      .returning();
    
    // If folder changed and the image was used as a thumbnail, update the old folder
    if (folder_id !== undefined && 
        existingImage.folder_id !== folder_id && 
        existingImage.folder_id !== null && 
        existingImage.thumbnail_url
    ) {
      const [oldFolder] = await db.select()
        .from(mediaFolders)
        .where(eq(mediaFolders.id, existingImage.folder_id));
      
      if (oldFolder && oldFolder.thumbnail_url === existingImage.thumbnail_url) {
        // Find another image in the old folder to use as thumbnail
        const [anotherImage] = await db.select()
          .from(gallery)
          .where(eq(gallery.folder_id, existingImage.folder_id))
          .orderBy(gallery.id)
          .limit(1);
        
        if (anotherImage) {
          await db.update(mediaFolders)
            .set({ thumbnail_url: anotherImage.thumbnail_url })
            .where(eq(mediaFolders.id, existingImage.folder_id));
        } else {
          // No images left in the old folder, clear the thumbnail
          await db.update(mediaFolders)
            .set({ thumbnail_url: null })
            .where(eq(mediaFolders.id, existingImage.folder_id));
        }
      }
    }
    
    // If moved to a new folder with no thumbnail, update the new folder
    if (folder_id !== undefined && 
        existingImage.folder_id !== folder_id && 
        folder_id !== null && 
        existingImage.thumbnail_url
    ) {
      const [newFolder] = await db.select()
        .from(mediaFolders)
        .where(eq(mediaFolders.id, folder_id));
      
      if (newFolder && !newFolder.thumbnail_url) {
        await db.update(mediaFolders)
          .set({ thumbnail_url: existingImage.thumbnail_url })
          .where(eq(mediaFolders.id, folder_id));
      }
    }
    
    res.json(updatedImage);
  } catch (error) {
    console.error("Error updating gallery image:", error);
    res.status(500).json({ error: "Failed to update gallery image" });
  }
}

/**
 * Get gallery images by event
 */
export async function getGalleryImagesByEvent(req: Request, res: Response) {
  try {
    const eventId = Number(req.params.eventId);
    
    const images = await db.select()
      .from(gallery)
      .where(eq(gallery.event_id, eventId))
      .orderBy(gallery.sort_order, gallery.id);
    
    res.json(images);
  } catch (error) {
    console.error("Error fetching gallery images by event:", error);
    res.status(500).json({ error: "Failed to fetch gallery images" });
  }
}

/**
 * Get gallery images by folder
 */
export async function getGalleryImagesByFolder(req: Request, res: Response) {
  try {
    const folderId = Number(req.params.folderId);
    
    const images = await db.select()
      .from(gallery)
      .where(eq(gallery.folder_id, folderId))
      .orderBy(gallery.sort_order, gallery.id);
    
    res.json(images);
  } catch (error) {
    console.error("Error fetching gallery images by folder:", error);
    res.status(500).json({ error: "Failed to fetch gallery images" });
  }
}

/**
 * Get all gallery images
 */
export async function getAllGalleryImages(req: Request, res: Response) {
  try {
    const mediaType = req.query.media_type as string;
    
    let query = db.select().from(gallery);
    
    // Filter by media type if provided
    if (mediaType) {
      query = query.where(eq(gallery.media_type, mediaType));
    }
    
    const images = await query.orderBy(gallery.sort_order, gallery.id);
    
    res.json(images);
  } catch (error) {
    console.error("Error fetching all gallery images:", error);
    res.status(500).json({ error: "Failed to fetch gallery images" });
  }
}

/**
 * Replace gallery image with a new image
 */
export async function replaceGalleryImage(req: Request, res: Response) {
  try {
    const imageId = Number(req.params.id);
    
    if (!req.file) {
      return res.status(400).json({ error: "No file was uploaded" });
    }
    
    // Get the existing image
    const [existingImage] = await db.select().from(gallery).where(eq(gallery.id, imageId));
    
    if (!existingImage) {
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: "Gallery image not found" });
    }
    
    // Determine target folder path
    let targetFolderPath = GALLERY_DIR;
    
    if (existingImage.folder_id) {
      targetFolderPath = path.join(GALLERY_DIR, `folder-${existingImage.folder_id}`);
      if (!fs.existsSync(targetFolderPath)) {
        fs.mkdirSync(targetFolderPath, { recursive: true });
      }
    }
    
    // Process the new image
    const processedFiles = await processImage(
      req.file.path, 
      targetFolderPath, 
      `replaced-${imageId}-${path.parse(req.file.filename).name}`
    );
    
    // Store the old image paths for cleanup
    const oldImageUrl = existingImage.image_url;
    const oldThumbnailUrl = existingImage.thumbnail_url;
    
    // Update the database record
    const [updatedImage] = await db.update(gallery)
      .set({
        image_url: processedFiles.original,
        thumbnail_url: processedFiles.thumbnail,
        file_size: req.file.size,
        // Keep all other metadata the same
        updated_at: new Date()
      })
      .where(eq(gallery.id, imageId))
      .returning();
    
    // Update folder thumbnail if this image was used
    if (existingImage.folder_id && oldThumbnailUrl) {
      const [folder] = await db.select()
        .from(mediaFolders)
        .where(eq(mediaFolders.id, existingImage.folder_id));
      
      if (folder && folder.thumbnail_url === oldThumbnailUrl) {
        await db.update(mediaFolders)
          .set({ thumbnail_url: processedFiles.thumbnail })
          .where(eq(mediaFolders.id, existingImage.folder_id));
      }
    }
    
    // Delete old files
    if (oldImageUrl) {
      const oldImagePath = path.join(process.cwd(), oldImageUrl);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    
    if (oldThumbnailUrl) {
      const oldThumbnailPath = path.join(process.cwd(), oldThumbnailUrl);
      if (fs.existsSync(oldThumbnailPath)) {
        fs.unlinkSync(oldThumbnailPath);
      }
    }
    
    // Clean up the original uploaded file
    if (fs.existsSync(req.file.path) && req.file.path !== processedFiles.original) {
      fs.unlinkSync(req.file.path);
    }
    
    res.json({
      ...updatedImage,
      processedFiles
    });
  } catch (error) {
    console.error("Error replacing gallery image:", error);
    res.status(500).json({ error: "Failed to replace gallery image" });
  }
}