import "dotenv/config";
import type { Request, Response } from "express";

let cached: ((req: Request, res: Response) => Promise<any>) | null = null;

async function getHandler() {
  if (cached) return cached;

  // IMPORTANT: We intentionally import the pre-bundled handler from dist at runtime.
  // This prevents Vercel's TypeScript compilation step from type-checking the entire
  // server codebase (which is not required for runtime execution).
  //
  // Using a variable path avoids TS module resolution at build time.
  const modPath = "../dist/vercel-handler.js";
  const mod: any = await import(modPath);
  cached = mod?.default ?? mod?.handler ?? mod;
  return cached!;
}

export default async function handler(req: Request, res: Response) {
  try {
    const fn = await getHandler();
    return await fn(req, res);
  } catch (error) {
    console.error("Vercel handler error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}


