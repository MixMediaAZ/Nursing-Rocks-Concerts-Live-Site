import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { MediaAsset } from '@shared/schema';
import { authenticateToken } from './auth';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    // Generate a unique filename with the original extension
    const originalExt = path.extname(file.originalname);
    const filename = `${uuidv4()}${originalExt}`;
    cb(null, filename);
  },
});

// Configure file filter to limit file types
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    // Videos
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a',
    // Documents
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/rtf'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`));
  }
};

// Configure upload limits
const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB max file size
  files: 10, // Max number of files per upload
};

// Create the multer upload instance
export const upload = multer({ storage, fileFilter, limits });

// Function to determine media type from mimetype
function getMediaTypeFromMimetype(mimetype: string): string {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.includes('pdf') || mimetype.includes('word') || mimetype.includes('text/')) return 'document';
  return 'other';
}

/**
 * Handle media file uploads
 */
export async function uploadMediaFiles(req: Request, res: Response) {
  try {
    // Check if files were uploaded
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    
    // Process the files
    const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
    const uploadedAssets: MediaAsset[] = [];
    
    // Process each file and create asset records
    files.forEach((file, index) => {
      // Get metadata for this file if available
      let metadata = {};
      if (req.body[`metadata[${index}]`]) {
        try {
          metadata = JSON.parse(req.body[`metadata[${index}]`]);
        } catch (err) {
          console.error('Error parsing metadata:', err);
        }
      }
      
      // Construct the file URL (relative path from server root)
      const fileUrl = `/uploads/${file.filename}`;
      
      // Create a media asset record
      const asset: MediaAsset = {
        id: uuidv4(),
        path: fileUrl,
        type: getMediaTypeFromMimetype(file.mimetype),
        title: metadata.title || file.originalname.split('.')[0],
        alt: metadata.alt || file.originalname,
        description: metadata.description || '',
        created_at: new Date(),
        updated_at: new Date(),
        user_id: req.user?.userId || null,
        filesize: file.size,
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
      };
      
      uploadedAssets.push(asset);
      
      // TODO: If using a database, save the asset record here
    });
    
    // Return success response with uploaded assets
    res.status(200).json({
      success: true,
      message: `${uploadedAssets.length} files uploaded successfully`,
      assets: uploadedAssets,
    });
  } catch (error: any) {
    console.error('Media upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading files',
      error: error.message,
    });
  }
}

/**
 * Get a list of all media assets
 */
export async function getMediaList(_req: Request, res: Response) {
  try {
    // TODO: Replace with actual database query if using a database
    // For now, we'll scan the uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      return res.status(200).json({ assets: [] });
    }
    
    // Read the directory
    const files = fs.readdirSync(uploadsDir);
    
    // Create asset objects for each file
    const assets: MediaAsset[] = files.map(filename => {
      const filePath = path.join(uploadsDir, filename);
      const stats = fs.statSync(filePath);
      const ext = path.extname(filename).toLowerCase();
      
      // Determine media type based on extension
      let type = 'other';
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) type = 'image';
      if (['.mp4', '.webm', '.ogg', '.mov'].includes(ext)) type = 'video';
      if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) type = 'audio';
      if (['.pdf', '.doc', '.docx', '.txt', '.rtf'].includes(ext)) type = 'document';
      
      return {
        id: path.basename(filename, ext), // Use filename (without extension) as ID
        path: `/uploads/${filename}`,
        type,
        title: filename.split('.')[0],
        alt: filename,
        description: '',
        created_at: stats.birthtime,
        updated_at: stats.mtime,
        user_id: null,
        filesize: stats.size,
        filename,
        originalname: filename,
        mimetype: '', // We don't have this info when scanning the directory
      };
    });
    
    res.status(200).json({ assets });
  } catch (error: any) {
    console.error('Error getting media list:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving media assets',
      error: error.message,
    });
  }
}

/**
 * Delete a media asset by ID
 */
export async function deleteMedia(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    // Find the file by ID (scanning directory)
    const files = fs.readdirSync(uploadsDir);
    const fileToDelete = files.find(file => path.basename(file, path.extname(file)) === id);
    
    if (!fileToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Media asset not found',
      });
    }
    
    // Delete the file
    fs.unlinkSync(path.join(uploadsDir, fileToDelete));
    
    // TODO: Delete the database record if using a database
    
    res.status(200).json({
      success: true,
      message: 'Media asset deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting media:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting media asset',
      error: error.message,
    });
  }
}

/**
 * Get a single media asset by ID
 */
export async function getMediaById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    // Find the file by ID (scanning directory)
    const files = fs.readdirSync(uploadsDir);
    const file = files.find(file => path.basename(file, path.extname(file)) === id);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Media asset not found',
      });
    }
    
    const filePath = path.join(uploadsDir, file);
    const stats = fs.statSync(filePath);
    const ext = path.extname(file).toLowerCase();
    
    // Determine media type based on extension
    let type = 'other';
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) type = 'image';
    if (['.mp4', '.webm', '.ogg', '.mov'].includes(ext)) type = 'video';
    if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) type = 'audio';
    if (['.pdf', '.doc', '.docx', '.txt', '.rtf'].includes(ext)) type = 'document';
    
    const asset: MediaAsset = {
      id,
      path: `/uploads/${file}`,
      type,
      title: file.split('.')[0],
      alt: file,
      description: '',
      created_at: stats.birthtime,
      updated_at: stats.mtime,
      user_id: null,
      filesize: stats.size,
      filename: file,
      originalname: file,
      mimetype: '', // We don't have this info when scanning the directory
    };
    
    res.status(200).json({ asset });
  } catch (error: any) {
    console.error('Error getting media by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving media asset',
      error: error.message,
    });
  }
}

/**
 * Update a media asset's metadata
 */
export async function updateMedia(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { metadata } = req.body;
    
    if (!metadata) {
      return res.status(400).json({
        success: false,
        message: 'No metadata provided for update',
      });
    }
    
    // In a real implementation, you would update the database record
    // For now, we'll just return a success response with the updated metadata
    
    // Get the original asset first
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const files = fs.readdirSync(uploadsDir);
    const file = files.find(file => path.basename(file, path.extname(file)) === id);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Media asset not found',
      });
    }
    
    const filePath = path.join(uploadsDir, file);
    const stats = fs.statSync(filePath);
    const ext = path.extname(file).toLowerCase();
    
    // Determine media type based on extension
    let type = 'other';
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) type = 'image';
    if (['.mp4', '.webm', '.ogg', '.mov'].includes(ext)) type = 'video';
    if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) type = 'audio';
    if (['.pdf', '.doc', '.docx', '.txt', '.rtf'].includes(ext)) type = 'document';
    
    // Merge with new metadata
    const asset: MediaAsset = {
      id,
      path: `/uploads/${file}`,
      type,
      title: metadata.title || file.split('.')[0],
      alt: metadata.alt || file,
      description: metadata.description || '',
      created_at: stats.birthtime,
      updated_at: new Date(),
      user_id: req.user?.userId || null,
      filesize: stats.size,
      filename: file,
      originalname: file,
      mimetype: '', // We don't have this info when scanning the directory
    };
    
    res.status(200).json({
      success: true,
      message: 'Media asset updated successfully',
      asset,
    });
  } catch (error: any) {
    console.error('Error updating media:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating media asset',
      error: error.message,
    });
  }
}