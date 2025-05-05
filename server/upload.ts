import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure storage for city background uploads
const cityBackgroundsStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = path.join(process.cwd(), 'public/assets/city_backgrounds');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    // Generate a unique filename with the original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to allow only jpg/jpeg files for city backgrounds
const cityBackgroundsFileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG/JPG images are allowed for city backgrounds'));
  }
};

// Setup the upload middleware
const cityBackgroundsUpload = multer({ 
  storage: cityBackgroundsStorage,
  fileFilter: cityBackgroundsFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * Handle single city background image upload
 */
export async function uploadCityBackground(req: Request, res: Response) {
  const upload = cityBackgroundsUpload.single('file');
  
  upload(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ 
        success: false, 
        message: err.message || 'Error uploading file' 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }
    
    // Return success response with file details
    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      filename: req.file.filename,
      path: `/assets/city_backgrounds/${req.file.filename}`,
      originalName: req.file.originalname,
      size: req.file.size
    });
  });
}

/**
 * Handle bulk city background image uploads
 */
export async function uploadMultipleCityBackgrounds(req: Request, res: Response) {
  const upload = cityBackgroundsUpload.array('files', 20); // Allow up to 20 files
  
  upload(req, res, (err) => {
    if (err) {
      console.error('Bulk upload error:', err);
      return res.status(400).json({ 
        success: false, 
        message: err.message || 'Error uploading files' 
      });
    }
    
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      return res.status(400).json({ 
        success: false, 
        message: 'No files uploaded' 
      });
    }
    
    const files = req.files as Express.Multer.File[];
    
    // Return success response with file details
    res.status(200).json({
      success: true,
      message: `${files.length} files uploaded successfully`,
      files: files.map(file => ({
        filename: file.filename,
        path: `/assets/city_backgrounds/${file.filename}`,
        originalName: file.originalname,
        size: file.size
      }))
    });
  });
}