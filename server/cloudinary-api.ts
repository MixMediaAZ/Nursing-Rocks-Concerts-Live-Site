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
 * Get videos from a Cloudinary folder
 * This endpoint handles the API keys securely on the server
 */
export async function getCloudinaryVideos(req: Request, res: Response) {
  try {
    const folder = req.query.folder as string || '';
    
    // Verify Cloudinary credentials are set
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cloudinary credentials are not configured' 
      });
    }
    
    // Fetch videos from Cloudinary
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder ? `${folder}/` : '',
      resource_type: 'video',
      max_results: 100
    });
    
    return res.json({
      success: true,
      resources: result.resources || [],
      total: (result.resources || []).length,
      nextCursor: result.next_cursor
    });
  } catch (error) {
    console.error('Error getting Cloudinary videos:', error);
    return res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

/**
 * Generate a Cloudinary upload signature for secure direct uploads
 */
export async function getCloudinarySignature(req: Request, res: Response) {
  try {
    // Verify Cloudinary credentials are set
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cloudinary credentials are not configured' 
      });
    }
    
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = req.body.folder || 'nursing-rocks';
    
    // Generate signature with additional parameters
    const signature = cloudinary.utils.api_sign_request({
      timestamp,
      folder,
      // You can add additional parameters here as needed
      // resource_type: 'video',
      // ...etc
    }, process.env.CLOUDINARY_API_SECRET as string);
    
    return res.json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder
    });
  } catch (error) {
    console.error('Error generating Cloudinary signature:', error);
    return res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

/**
 * Check if Cloudinary connection is working
 */
export async function checkCloudinaryConnection(req: Request, res: Response) {
  try {
    // Verify Cloudinary credentials are set
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      return res.json({ 
        success: false, 
        connected: false,
        status: 'error',
        message: 'Cloudinary credentials are not configured' 
      });
    }
    
    // Make a simple API request to check connectivity
    await cloudinary.api.ping();
    
    return res.json({
      success: true,
      connected: true,
      status: 'online',
      message: 'Connected to Cloudinary API successfully'
    });
  } catch (error) {
    console.error('Error checking Cloudinary connection:', error);
    return res.json({ 
      success: false, 
      connected: false,
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}