import express, { type Express } from "express";
import fs from "fs";
import path from "path";

/**
 * Production-only static file serving (no vite dependency)
 */
export function serveStatic(app: Express) {
  // Try to find dist/public directory
  const possiblePaths = [
    // Vercel serverless environment
    process.env.VERCEL ? path.resolve(process.cwd(), "dist", "public") : null,
    process.env.VERCEL ? path.resolve("/var/task", "dist", "public") : null,
    // Local production (relative to server directory)
    path.resolve(import.meta.dirname, "..", "dist", "public"),
    // Alternative: absolute from project root
    path.resolve(process.cwd(), "dist", "public"),
  ].filter(Boolean) as string[];

  let distPath: string | null = null;
  for (const possiblePath of possiblePaths) {
    try {
      if (fs.existsSync(possiblePath)) {
        distPath = possiblePath;
        console.log(`[serveStatic] Found dist directory at: ${distPath}`);
        break;
      }
    } catch (err) {
      // Continue to next path
    }
  }

  if (!distPath) {
    const errorMsg = `Could not find the build directory. Tried: ${possiblePaths.join(", ")}. cwd: ${process.cwd()}, VERCEL: ${process.env.VERCEL}`;
    console.error(`[serveStatic] ${errorMsg}`);
    // In Vercel, don't throw - static files might be served by CDN
    if (!process.env.VERCEL) {
      throw new Error(errorMsg);
    }
  } else {
    // Serve static files
    app.use(express.static(distPath));
  }

  // Fall through to index.html for SPA routes (after API routes)
  app.use("*", (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith("/api/")) {
      return next();
    }
    
    // Skip static asset requests (they should be served by express.static or Vercel CDN)
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|webp)$/)) {
      return res.status(404).send("Static file not found");
    }
    
    // Serve index.html for all other routes (SPA routing)
    if (distPath) {
      const indexPath = path.resolve(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.sendFile(indexPath);
      }
    }
    
    res.status(404).send("index.html not found");
  });
}
