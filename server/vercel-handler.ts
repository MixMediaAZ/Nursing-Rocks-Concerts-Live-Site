import "dotenv/config";
import type { Request, Response } from "express";
import { createApp } from "./create-app";
import { registerRoutes } from "./routes";
import { serveStatic } from "./vite";

const app = createApp();

let initPromise: Promise<void> | null = null;

async function ensureInitialized() {
  if (!initPromise) {
    initPromise = (async () => {
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
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

