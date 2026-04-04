import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "@shared/schema";

// IMPORTANT: For serverless (Vercel), use Neon's PgBouncer connection pool
// Regular fetchConnectionCache can cause stale connections after cold starts
// Use DATABASE_URL with -pooler in the hostname for proper connection pooling
// Example: postgresql://user:password@ep-xxx-pooler.neon.tech/dbname

// Disable edge-level connection caching (causes stale connections in serverless)
neonConfig.fetchConnectionCache = false;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database? For Vercel + Neon, use the PgBouncer connection string (includes '-pooler' in hostname).",
  );
}

// Verify DATABASE_URL is for Neon (not Supabase)
const dbUrl = process.env.DATABASE_URL;
if (dbUrl.includes('supabase') || dbUrl.includes('@supabase')) {
  console.warn('[db] WARNING: DATABASE_URL appears to be for Supabase, but this project uses Neon. Please update your DATABASE_URL to point to a Neon database.');
}

// Check if using PgBouncer (recommended for serverless)
if (!dbUrl.includes('-pooler')) {
  console.warn('[db] WARNING: DATABASE_URL does not include "-pooler". For Vercel serverless, use Neon\'s PgBouncer URL (with "-pooler" in hostname) to avoid connection exhaustion. Current URL uses direct connection which may cause "Database error" failures.');
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Test database connection on startup (non-blocking)
pool.query('SELECT 1').then(() => {
  console.log('[db] Database connection successful');
}).catch((err) => {
  console.error('[db] Database connection failed:', err.message);
});