import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { appSettings } from '@shared/schema';

const userRevokedBeforeCache = new Map<number, { value: number; loadedAt: number }>();
const USER_REVOCATION_CACHE_TTL_MS = 60 * 1000;
const USER_REVOCATION_KEY_PREFIX = 'JWT_REVOKED_BEFORE_USER_';

function userRevocationKey(userId: number): string {
  return `${USER_REVOCATION_KEY_PREFIX}${userId}`;
}

function parseMs(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function getTokenIssuedAtMs(token: string): number {
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded !== 'object' || !('iat' in decoded)) {
    return 0;
  }
  const iat = (decoded as { iat?: unknown }).iat;
  return typeof iat === 'number' ? iat * 1000 : 0;
}

async function getUserRevokedBeforeMs(userId: number): Promise<number> {
  const cached = userRevokedBeforeCache.get(userId);
  const now = Date.now();
  if (cached && now - cached.loadedAt < USER_REVOCATION_CACHE_TTL_MS) {
    return cached.value;
  }

  const key = userRevocationKey(userId);
  const [setting] = await db
    .select({ value: appSettings.value })
    .from(appSettings)
    .where(eq(appSettings.key, key))
    .limit(1);

  const value = parseMs(setting?.value);
  userRevokedBeforeCache.set(userId, { value, loadedAt: now });
  return value;
}

export async function setUserRevokedBeforeMs(userId: number, revokedBeforeMs: number): Promise<void> {
  const key = userRevocationKey(userId);
  const value = String(revokedBeforeMs);

  const [existing] = await db
    .select({ id: appSettings.id })
    .from(appSettings)
    .where(eq(appSettings.key, key))
    .limit(1);

  if (existing) {
    await db
      .update(appSettings)
      .set({
        value,
        is_sensitive: true,
        description: 'Per-user JWT revocation timestamp (ms)',
        updated_at: new Date(),
      })
      .where(eq(appSettings.key, key));
  } else {
    await db
      .insert(appSettings)
      .values({
        key,
        value,
        is_sensitive: true,
        description: 'Per-user JWT revocation timestamp (ms)',
        created_at: new Date(),
        updated_at: new Date(),
      });
  }

  userRevokedBeforeCache.set(userId, { value: revokedBeforeMs, loadedAt: Date.now() });
}

export async function isTokenRevokedForUser(userId: number, token: string): Promise<boolean> {
  const tokenIssuedAtMs = getTokenIssuedAtMs(token);
  if (!tokenIssuedAtMs) {
    return false;
  }
  const revokedBeforeMs = await getUserRevokedBeforeMs(userId);
  return revokedBeforeMs > 0 && tokenIssuedAtMs <= revokedBeforeMs;
}
