import {
  S3Client,
  ListObjectsV2Command,
  HeadObjectCommand,
  PutObjectCommand,
  type ListObjectsV2CommandOutput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import fs from "fs";
import path from "path";

export type B2VideoObject = {
  key: string;
  lastModified?: string;
  size?: number;
};

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    // #region agent log
    const envKeys = Object.keys(process.env).filter(k => k.includes('VIDEO') || k.includes('B2')).sort();
    fetch('http://127.0.0.1:7253/ingest/a70d3c4c-5483-4936-8dc1-1a2a5745df39',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'b2-s3.ts:requiredEnv',message:'Missing env var - debugging',data:{missingVar:name,availableVideoKeys:envKeys,hasDotEnv:!!process.env.DATABASE_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'env-debug',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

export type B2ConnectionStatus =
  | {
      ok: true;
      bucket: string;
      endpoint: string;
      region: string;
      cdnBaseUrl: string;
    }
  | {
      ok: false;
      missingEnv?: string;
      message: string;
    };

export function getB2S3Client() {
  const endpoint = requiredEnv("VIDEO_B2_S3_ENDPOINT");
  const region = process.env.VIDEO_B2_REGION || "us-west-004";
  const accessKeyId = requiredEnv("VIDEO_B2_ACCESS_KEY_ID");
  const secretAccessKey = requiredEnv("VIDEO_B2_SECRET_ACCESS_KEY");

  return new S3Client({
    region,
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function getB2Bucket(): string {
  return requiredEnv("VIDEO_B2_BUCKET");
}

export function stableVideoIdFromKey(key: string): string {
  // Deterministic id from object key; does not leak bucket secrets.
  const hash = crypto.createHash("sha256").update(key).digest("hex").slice(0, 32);
  return `b2_${hash}`;
}

export function hlsPrefixForVideoId(videoId: string): string {
  const base = (process.env.VIDEO_HLS_PREFIX || "hls").replace(/\/+$/, "");
  return `${base}/${videoId}`;
}

export function posterKeyForVideoId(videoId: string): string {
  const base = (process.env.VIDEO_POSTER_PREFIX || "poster").replace(/\/+$/, "");
  return `${base}/${videoId}.jpg`;
}

export async function listB2Objects(prefix?: string): Promise<B2VideoObject[]> {
  const s3 = getB2S3Client();
  const Bucket = getB2Bucket();
  const out: B2VideoObject[] = [];

  let ContinuationToken: string | undefined = undefined;
  do {
    const resp: ListObjectsV2CommandOutput = await s3.send(
      new ListObjectsV2Command({
        Bucket,
        Prefix: prefix,
        ContinuationToken,
        MaxKeys: 1000,
      }),
    );
    for (const o of resp.Contents || []) {
      if (!o.Key) continue;
      out.push({
        key: o.Key,
        lastModified: o.LastModified ? o.LastModified.toISOString() : undefined,
        size: typeof o.Size === "number" ? o.Size : undefined,
      });
    }
    ContinuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
  } while (ContinuationToken);

  return out;
}

export async function checkB2Connection(): Promise<B2ConnectionStatus> {
  try {
    const endpoint = requiredEnv("VIDEO_B2_S3_ENDPOINT");
    const region = process.env.VIDEO_B2_REGION || "us-west-004";
    const bucket = requiredEnv("VIDEO_B2_BUCKET");
    const cdnBaseUrl = requiredEnv("VIDEO_CDN_BASE_URL").replace(/\/+$/, "");

    const s3 = getB2S3Client();
    await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        MaxKeys: 1,
      }),
    );

    return { ok: true, bucket, endpoint, region, cdnBaseUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const m = message.match(/Missing required env var:\s*([A-Z0-9_]+)/);

    return {
      ok: false,
      missingEnv: m?.[1],
      message,
    };
  }
}

export async function headB2Object(key: string): Promise<boolean> {
  const s3 = getB2S3Client();
  const Bucket = getB2Bucket();
  try {
    await s3.send(new HeadObjectCommand({ Bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

export async function createPresignedPutUrl(opts: { key: string; contentType: string; expiresInSeconds?: number }) {
  const s3 = getB2S3Client();
  const Bucket = getB2Bucket();
  const expiresIn = opts.expiresInSeconds ?? 60 * 10;
  const cmd = new PutObjectCommand({
    Bucket,
    Key: opts.key,
    ContentType: opts.contentType,
  });
  const url = await getSignedUrl(s3, cmd, { expiresIn });
  return { url, bucket: Bucket, key: opts.key, expiresIn };
}

export function publicUrlForKey(key: string): string {
  const base = requiredEnv("VIDEO_CDN_BASE_URL").replace(/\/+$/, "");
  return `${base}/${encodeURI(key)}`;
}

export function manifestUrlForVideoId(videoId: string): string {
  const manifestKey = `${hlsPrefixForVideoId(videoId)}/master.m3u8`;
  return publicUrlForKey(manifestKey);
}

export function posterUrlForVideoId(videoId: string): string {
  return publicUrlForKey(posterKeyForVideoId(videoId));
}


