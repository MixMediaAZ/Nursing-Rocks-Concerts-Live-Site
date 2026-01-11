import "dotenv/config";
import type { Request, Response } from "express";

let cached: ((req: Request, res: Response) => Promise<any>) | null = null;

async function getHandler() {
  if (cached) {
    // #region agent log
    fetch('http://127.0.0.1:7253/ingest/a70d3c4c-5483-4936-8dc1-1a2a5745df39',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/index.ts:getHandler',message:'Using cached handler',timestamp:Date.now(),sessionId:'debug-session',runId:'old-site-debug',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    return cached;
  }

  // IMPORTANT: We intentionally import the pre-bundled handler from dist at runtime.
  // This prevents Vercel's TypeScript compilation step from type-checking the entire
  // server codebase (which is not required for runtime execution).
  //
  // Using a variable path avoids TS module resolution at build time.
  const modPath = "../dist/vercel-handler.js";
  // #region agent log
  fetch('http://127.0.0.1:7253/ingest/a70d3c4c-5483-4936-8dc1-1a2a5745df39',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/index.ts:getHandler',message:'Importing handler from dist',data:{modPath,cwd:process.cwd(),vercelEnv:process.env.VERCEL},timestamp:Date.now(),sessionId:'debug-session',runId:'old-site-debug',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const mod: any = await import(modPath);
  cached = mod?.default ?? mod?.handler ?? mod;
  // #region agent log
  fetch('http://127.0.0.1:7253/ingest/a70d3c4c-5483-4936-8dc1-1a2a5745df39',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/index.ts:getHandler',message:'Handler loaded',data:{hasDefault:!!mod?.default,hasHandler:!!mod?.handler,hasCached:!!cached},timestamp:Date.now(),sessionId:'debug-session',runId:'old-site-debug',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  return cached!;
}

export default async function handler(req: Request, res: Response) {
  // #region agent log
  fetch('http://127.0.0.1:7253/ingest/a70d3c4c-5483-4936-8dc1-1a2a5745df39',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/index.ts:handler',message:'Handler invoked',data:{url:req.url,method:req.method,userAgent:req.headers['user-agent']},timestamp:Date.now(),sessionId:'debug-session',runId:'old-site-debug',hypothesisId:'A,B,C'})}).catch(()=>{});
  // #endregion
  try {
    const fn = await getHandler();
    return await fn(req, res);
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7253/ingest/a70d3c4c-5483-4936-8dc1-1a2a5745df39',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/index.ts:handler',message:'Handler error',data:{error:error instanceof Error?error.message:String(error),stack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'old-site-debug',hypothesisId:'B,E'})}).catch(()=>{});
    // #endregion
    console.error("Vercel handler error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}


