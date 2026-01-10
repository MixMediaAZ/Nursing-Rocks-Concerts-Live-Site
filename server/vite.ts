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
    allowedHosts: true,
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
  // In Vercel/serverless, the dist folder is at the project root
  // In local production, it's relative to server directory
  // Try multiple possible paths to find the dist/public directory
  const possiblePaths = [
    // Vercel serverless environment - check VERCEL env var
    process.env.VERCEL ? path.resolve(process.cwd(), "dist", "public") : null,
    // Vercel also uses /var/task as working directory sometimes
    process.env.VERCEL ? path.resolve("/var/task", "dist", "public") : null,
    // Local production (relative to server directory)
    path.resolve(import.meta.dirname, "..", "dist", "public"),
    // Alternative: absolute from project root
    path.resolve(process.cwd(), "dist", "public"),
    // Fallback: relative to current working directory
    path.join(process.cwd(), "dist", "public"),
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
    throw new Error(errorMsg);
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath!, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.error(`[serveStatic] index.html not found at: ${indexPath}`);
      res.status(404).send("index.html not found");
    }
  });
}
