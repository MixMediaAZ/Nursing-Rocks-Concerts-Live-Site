import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Fetch videos from a Cloudinary folder
 * GET /api/cloudinary/videos?folder=folder_name
 */
export async function getCloudinaryVideos(req: Request, res: Response) {
  try {
    const { folder = '' } = req.query;
    
    if (!folder) {
      return res.status(400).json({ error: 'Folder parameter is required' });
    }

    const folderPath = String(folder).trim();
    
    // Use Cloudinary SDK to search for videos in the specified folder
    const result = await cloudinary.search
      .expression(`folder=${folderPath} AND resource_type:video`)
      .sort_by('created_at', 'desc')
      .max_results(100)
      .execute();

    return res.json({
      success: true,
      resources: result.resources,
      total: result.total_count
    });
  } catch (error) {
    console.error('Cloudinary API error:', error);
    return res.status(500).json({ 
      error: 'Error fetching videos from Cloudinary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get Cloudinary signature for direct uploads (client-side)
 * POST /api/cloudinary/signature
 */
export async function getCloudinarySignature(req: Request, res: Response) {
  try {
    const { timestamp = Math.round(new Date().getTime() / 1000) } = req.body;
    
    // Generate the signature
    const signature = cloudinary.utils.api_sign_request({
      timestamp,
      // Add any other parameters you want to include in the signature
    }, process.env.CLOUDINARY_API_SECRET || '');
    
    return res.json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY
    });
  } catch (error) {
    console.error('Cloudinary signature error:', error);
    return res.status(500).json({ 
      error: 'Error generating Cloudinary signature',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Check Cloudinary connection and credentials
 * GET /api/cloudinary/status
 */
export async function checkCloudinaryConnection(req: Request, res: Response) {
  try {
    // Try to ping the Cloudinary API
    const result = await cloudinary.api.ping();
    
    return res.json({
      success: true,
      connected: true,
      status: result.status,
      message: 'Connected to Cloudinary API successfully'
    });
  } catch (error) {
    console.error('Cloudinary connection error:', error);
    return res.status(500).json({ 
      success: false,
      connected: false,
      error: 'Failed to connect to Cloudinary API',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}