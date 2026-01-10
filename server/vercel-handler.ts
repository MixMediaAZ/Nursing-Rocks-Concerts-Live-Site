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
  await ensureInitialized();
  return app(req as any, res as any);
}

