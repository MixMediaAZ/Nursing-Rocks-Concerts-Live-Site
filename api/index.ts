import "dotenv/config";
import type { Request, Response } from "express";
import { createApp } from "../server/create-app";
import { registerRoutes } from "../server/routes";
import { serveStatic } from "../server/vite";

const app = createApp();

let initPromise: Promise<void> | null = null;

async function ensureInitialized() {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await registerRoutes(app);
        // Serve static files in production (Vercel)
        serveStatic(app);
      } catch (error) {
        console.error("Initialization error:", error);
        throw error;
      }
    })();
  }
  await initPromise;
}

export default async function handler(req: Request, res: Response) {
  try {
    await ensureInitialized();
    return app(req as any, res as any);
  } catch (error) {
    console.error("Handler error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}


