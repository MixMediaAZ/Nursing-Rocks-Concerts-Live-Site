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

async function streamToFile(body: any, filePath: string, maxBytes: number) {
  const readable = body as Readable;
  await new Promise<void>((resolve, reject) => {
    const out = fs.createWriteStream(filePath);
    let written = 0;
    const fail = (err: Error) => {
      readable.destroy();
      out.destroy();
      reject(err);
    };
    readable.on("data", (chunk: Buffer | string) => {
      written += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk);
      if (written > maxBytes) {
        fail(new Error(`Source video exceeds max size (${maxBytes} bytes)`));
      }
    });
    readable.pipe(out);
    readable.on("error", (err) => fail(err instanceof Error ? err : new Error(String(err))));
    out.on("error", (err) => fail(err instanceof Error ? err : new Error(String(err))));
    out.on("finish", () => resolve());
  });
}

async function run(cmd: string, args: string[], opts: { cwd?: string; timeoutMs?: number } = {}) {
  await new Promise<void>((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"], cwd: opts.cwd });
    let stderr = "";
    const timeoutMs = opts.timeoutMs ?? 10 * 60 * 1000;
    const timeout = setTimeout(() => {
      p.kill("SIGKILL");
      reject(new Error(`Command timed out after ${timeoutMs}ms: ${cmd}`));
    }, timeoutMs);
    p.stderr.on("data", (d) => {
      const s = String(d);
      stderr += s;
      if (stderr.length > 20_000) stderr = stderr.slice(-20_000);
    });
    p.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
    p.on("close", (code) => {
      clearTimeout(timeout);
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

  const workRoot = await fsp.mkdtemp(path.join(os.tmpdir(), `nr-hls-${videoId}-`));
  const inputPath = path.join(workRoot, "input.mp4");
  const outDir = path.join(workRoot, "out");
  await fsp.mkdir(outDir, { recursive: true });

  try {
    const maxSourceBytes = Number(process.env.HLS_SOURCE_MAX_BYTES || 1_073_741_824); // 1 GiB default

    // 1) Download MP4 from B2
    const getResp = await s3.send(new GetObjectCommand({ Bucket, Key: opts.sourceKey }));
    if (!getResp.Body) throw new Error("Missing GetObject body");
    if (typeof getResp.ContentLength === "number" && getResp.ContentLength > maxSourceBytes) {
      throw new Error(`Source video too large (${getResp.ContentLength} bytes)`);
    }
    await streamToFile(getResp.Body, inputPath, maxSourceBytes);

    // 2) Generate poster
    const posterLocal = path.join(workRoot, "poster.jpg");
    await run("ffmpeg", ["-y", "-ss", "2", "-i", inputPath, "-frames:v", "1", "-q:v", "2", posterLocal], { timeoutMs: 120_000 });

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

    await run("ffmpeg", hlsArgs, { timeoutMs: 15 * 60_000 });

    // 4) Upload outputs to B2
    const hlsPrefix = hlsPrefixForVideoId(videoId);
    const files = await listFilesRecursive(outDir);
    let uploadedCount = 0;

    for (const file of files) {
      const rel = path.relative(outDir, file).split(path.sep).join("/");
      const key = `${hlsPrefix}/${rel}`;
      const body = fs.createReadStream(file);
      try {
        await s3.send(
          new PutObjectCommand({
            Bucket,
            Key: key,
            Body: body,
            ContentType: contentTypeForKey(key),
            CacheControl: key.endsWith(".m3u8") ? "public, max-age=60" : "public, max-age=31536000, immutable",
          }),
        );
      } finally {
        body.destroy();
      }
      uploadedCount++;
    }

    const posterKey = posterKeyForVideoId(videoId);
    const posterBody = fs.createReadStream(posterLocal);
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket,
          Key: posterKey,
          Body: posterBody,
          ContentType: "image/jpeg",
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
    } finally {
      posterBody.destroy();
    }
    uploadedCount++;

    return {
      videoId,
      sourceKey: opts.sourceKey,
      manifestKey: `${hlsPrefix}/master.m3u8`,
      posterKey,
      uploadedCount,
    };
  } finally {
    // Best-effort cleanup
    try {
      await fsp.rm(workRoot, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}


