// Note: Vercel provides environment variables natively - no dotenv needed
import type { Request, Response } from "express";

let cached: ((req: Request, res: Response) => Promise<any>) | null = null;

async function getHandler() {
  if (cached) {
    return cached;
  }

  // IMPORTANT: We intentionally import the pre-bundled handler from .vercel-build at runtime.
  // This prevents Vercel's TypeScript compilation step from type-checking the entire
  // server codebase (which is not required for runtime execution).
  //
  // Using a variable path avoids TS module resolution at build time.
  const modPath = "../.vercel-build/vercel-handler.cjs";
  const mod: any = await import(modPath);
  const candidate =
    mod?.default ??
    mod?.handler ??
    mod?.default?.handler ??
    mod;

  if (typeof candidate === "function") {
    cached = candidate;
    return cached!;
  }

  // Some CJS bundles nest the handler under default
  if (typeof mod?.default?.default === "function") {
    cached = mod.default.default;
    return cached!;
  }

  const keys = mod && typeof mod === "object" ? Object.keys(mod) : [];
  throw new Error(
    `Invalid handler export from ${modPath}. Keys: ${keys.join(", ")}`,
  );
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


