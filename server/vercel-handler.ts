// Note: Vercel provides environment variables natively - no dotenv needed
import type { Request, Response } from "express";

// Check required environment variables early
const requiredEnvVars = ['DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Lazy imports to avoid initialization errors
let app: any = null;
let initPromise: Promise<void> | null = null;

async function ensureInitialized() {
  if (!initPromise) {
    initPromise = (async () => {
      // Check env vars before initializing
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is not set');
      }
      
      const { createApp } = await import("./create-app");
      const { registerRoutes } = await import("./routes");
      const { serveStatic } = await import("./static");
      
      app = createApp();
      await registerRoutes(app);
      // In Vercel we rewrite SPA routes to the function; serve built client if present.
      serveStatic(app);
    })();
  }

  await initPromise;
}

export default async function handler(req: Request, res: Response) {
  try {
    // In Vercel, static files should be served by CDN, not the serverless function
    // Only handle API routes and SPA routes (non-static files)
    const path = req.path || req.url || '';
    
    // Skip static file requests - these should be served by Vercel CDN
    if (path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|webp|m3u8|ts|map)$/i)) {
      return res.status(404).json({ error: 'Static file not found - should be served by CDN' });
    }
    
    // Skip /assets/* requests - these should be served by Vercel CDN
    if (path.startsWith('/assets/')) {
      return res.status(404).json({ error: 'Asset not found - should be served by CDN' });
    }
    
    await ensureInitialized();
    return app(req as any, res as any);
  } catch (error) {
    console.error('Vercel handler error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error),
      hint: 'Check Vercel environment variables (DATABASE_URL, JWT_SECRET, SESSION_SECRET)'
    });
  }
}

