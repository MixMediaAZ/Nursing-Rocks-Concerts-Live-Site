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
      await registerRoutes(app);
      // Serve static files in production (Vercel)
      serveStatic(app);
    })();
  }
  await initPromise;
}

export default async function handler(req: Request, res: Response) {
  await ensureInitialized();
  return app(req as any, res as any);
}


