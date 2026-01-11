import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

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
        // #region agent log
        try{const files=fs.readdirSync(distPath);fetch('http://127.0.0.1:7253/ingest/a70d3c4c-5483-4936-8dc1-1a2a5745df39',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/vite.ts:serveStatic',message:'Found dist/public',data:{distPath,fileCount:files.length,hasIndexHtml:files.includes('index.html'),hasAssets:files.includes('assets')},timestamp:Date.now(),sessionId:'debug-session',runId:'old-site-debug',hypothesisId:'A,C,E'})}).catch(()=>{});}catch(e){}
        // #endregion
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
