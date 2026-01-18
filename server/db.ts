import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "@shared/schema";

// Use fetch for serverless environments (better for Vercel)
// Neon automatically uses fetch-based connections when WebSocket is not available
neonConfig.fetchConnectionCache = true;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Verify DATABASE_URL is for Neon (not Supabase)
const dbUrl = process.env.DATABASE_URL;
if (dbUrl.includes('supabase') || dbUrl.includes('@supabase')) {
  console.warn('[db] WARNING: DATABASE_URL appears to be for Supabase, but this project uses Neon. Please update your DATABASE_URL to point to a Neon database.');
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Test database connection on startup (non-blocking)
pool.query('SELECT 1').then(() => {
  console.log('[db] Database connection successful');
}).catch((err) => {
  console.error('[db] Database connection failed:', err.message);
});