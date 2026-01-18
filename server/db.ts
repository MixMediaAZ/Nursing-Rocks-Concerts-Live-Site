import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "@shared/schema";

// Configure WebSocket for non-serverless environments (local dev)
// In Vercel serverless, Neon uses fetch-based connections automatically
if (typeof globalThis.WebSocket === 'undefined') {
  try {
    const ws = require('ws');
    neonConfig.webSocketConstructor = ws;
  } catch (e) {
    // ws not available - likely in serverless environment, Neon will use fetch
    console.log('[db] WebSocket not available, using fetch-based connection');
  }
}

// Use fetch for serverless environments (better for Vercel)
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