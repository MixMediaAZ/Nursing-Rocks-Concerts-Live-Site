import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import type { Readable } from "stream";
import {
  getB2Bucket,
  getB2S3Client,
  hlsPrefixForVideoId,
  posterKeyForVideoId,
  stableVideoIdFromKey,
} from "./b2-s3";

type HlsPackagerResult = {
  videoId: string;
  sourceKey: string;
  manifestKey: string;
  posterKey: string;
  uploadedCount: number;
};

function contentTypeForKey(key: string): string {
  const lower = key.toLowerCase();
  if (lower.endsWith(".m3u8")) return "application/vnd.apple.mpegurl";
  if (lower.endsWith(".ts")) return "video/MP2T";
  if (lower.endsWith(".m4s")) return "video/iso.segment";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

async function streamToFile(body: any, filePath: string) {
  const readable = body as Readable;
  await new Promise<void>((resolve, reject) => {
    const out = fs.createWriteStream(filePath);
    readable.pipe(out);
    readable.on("error", reject);
    out.on("error", reject);
    out.on("finish", () => resolve());
  });
}

async function run(cmd: string, args: string[], opts: { cwd?: string } = {}) {
  await new Promise<void>((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"], cwd: opts.cwd });
    let stderr = "";
    p.stderr.on("data", (d) => {
      const s = String(d);
      stderr += s;
      if (stderr.length > 20_000) stderr = stderr.slice(-20_000);
    });
    p.on("error", (err) => {
      if ((err as any).code === "ENOENT") {
        reject(new Error(`${cmd} not found. Please install ffmpeg: https://ffmpeg.org/download.html`));
      } else {
        reject(err);
      }
    });
    p.on("close", (code) => {
      if (code === 0) return resolve();
      reject(new Error(`Command failed: ${cmd} ${args.join(" ")} (code ${code})\n${stderr}`));
    });
  });
}

async function listFilesRecursive(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await listFilesRecursive(full)));
    } else {
      out.push(full);
    }
  }
  return out;
}

export async function packageMp4KeyToHlsInB2(opts: { sourceKey: string; videoId?: string }): Promise<HlsPackagerResult> {
  const s3 = getB2S3Client();
  const Bucket = getB2Bucket();
  const videoId = opts.videoId || stableVideoIdFromKey(opts.sourceKey);

  console.log(`[HLS Packager] Starting packaging for ${opts.sourceKey} -> ${videoId}`);
  
  const workRoot = await fsp.mkdtemp(path.join(os.tmpdir(), `nr-hls-${videoId}-`));
  const inputPath = path.join(workRoot, "input.mp4");
  const outDir = path.join(workRoot, "out");
  await fsp.mkdir(outDir, { recursive: true });

  console.log(`[HLS Packager] Work directory: ${workRoot}`);

  try {
    // 1) Download MP4 from B2
    console.log(`[HLS Packager] Downloading ${opts.sourceKey} from B2...`);
    const getResp = await s3.send(new GetObjectCommand({ Bucket, Key: opts.sourceKey }));
    if (!getResp.Body) throw new Error("Missing GetObject body");
    await streamToFile(getResp.Body, inputPath);
    console.log(`[HLS Packager] Downloaded to ${inputPath}`);

    // 2) Generate poster
    console.log(`[HLS Packager] Generating poster thumbnail...`);
    const posterLocal = path.join(workRoot, "poster.jpg");
    await run("ffmpeg", ["-y", "-ss", "2", "-i", inputPath, "-frames:v", "1", "-q:v", "2", posterLocal]);
    console.log(`[HLS Packager] Poster generated at ${posterLocal}`);

    // 3) Generate multi-bitrate HLS (2 renditions to start: 360p, 720p)
    await fsp.mkdir(path.join(outDir, "v0"), { recursive: true });
    await fsp.mkdir(path.join(outDir, "v1"), { recursive: true });

    const hlsArgs = [
      "-y",
      "-i",
      inputPath,
      "-preset",
      "veryfast",
      "-g",
      "48",
      "-sc_threshold",
      "0",
      // variant 0 (360p)
      "-map",
      "0:v:0",
      "-map",
      "0:a:0?",
      "-s:v:0",
      "640x360",
      "-b:v:0",
      "800k",
      "-maxrate:v:0",
      "856k",
      "-bufsize:v:0",
      "1200k",
      "-b:a:0",
      "96k",
      // variant 1 (720p)
      "-map",
      "0:v:0",
      "-map",
      "0:a:0?",
      "-s:v:1",
      "1280x720",
      "-b:v:1",
      "2800k",
      "-maxrate:v:1",
      "2996k",
      "-bufsize:v:1",
      "4200k",
      "-b:a:1",
      "128k",
      "-f",
      "hls",
      "-hls_time",
      "6",
      "-hls_playlist_type",
      "vod",
      "-hls_segment_filename",
      path.join(outDir, "v%v", "seg_%03d.ts"),
      "-master_pl_name",
      "master.m3u8",
      "-var_stream_map",
      "v:0,a:0 v:1,a:1",
      path.join(outDir, "v%v", "index.m3u8"),
    ];

    console.log(`[HLS Packager] Starting HLS transcoding...`);
    await run("ffmpeg", hlsArgs);
    console.log(`[HLS Packager] HLS transcoding complete`);

    // 4) Upload outputs to B2
    console.log(`[HLS Packager] Uploading HLS files to B2...`);
    const hlsPrefix = hlsPrefixForVideoId(videoId);
    const files = await listFilesRecursive(outDir);
    let uploadedCount = 0;

    for (const file of files) {
      const rel = path.relative(outDir, file).split(path.sep).join("/");
      const key = `${hlsPrefix}/${rel}`;
      const body = fs.createReadStream(file);
      await s3.send(
        new PutObjectCommand({
          Bucket,
          Key: key,
          Body: body,
          ContentType: contentTypeForKey(key),
          CacheControl: key.endsWith(".m3u8") ? "public, max-age=60" : "public, max-age=31536000, immutable",
        }),
      );
      uploadedCount++;
    }

    const posterKey = posterKeyForVideoId(videoId);
    await s3.send(
      new PutObjectCommand({
        Bucket,
        Key: posterKey,
        Body: fs.createReadStream(posterLocal),
        ContentType: "image/jpeg",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    uploadedCount++;

    console.log(`[HLS Packager] Upload complete. Uploaded ${uploadedCount} files total`);
    console.log(`[HLS Packager] Successfully packaged ${videoId}`);
    
    return {
      videoId,
      sourceKey: opts.sourceKey,
      manifestKey: `${hlsPrefix}/master.m3u8`,
      posterKey,
      uploadedCount,
    };
  } catch (err) {
    console.error(`[HLS Packager] Error packaging ${videoId}:`, err);
    throw err;
  } finally {
    // Best-effort cleanup
    console.log(`[HLS Packager] Cleaning up temp directory: ${workRoot}`);
    try {
      await fsp.rm(workRoot, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}


