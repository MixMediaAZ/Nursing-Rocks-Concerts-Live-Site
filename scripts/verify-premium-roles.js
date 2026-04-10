import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Client } = pg;

async function verifyRoles() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT id, source_job_id, title, is_featured, is_active, data_quality_score
      FROM job_listings
      WHERE source_name = 'phoenixchildrens'
      AND source_job_id IN ('973964', '1003185', '1003178')
      ORDER BY source_job_id
    `);
    
    console.log('[VERIFY] Premium roles in database:');
    if (result.rows.length === 0) {
      console.log('[VERIFY] ❌ No premium roles found!');
    } else {
      result.rows.forEach(row => {
        console.log(`[VERIFY] ✅ ID ${row.id}: ${row.title}`);
        console.log(`        source_job_id=${row.source_job_id}, featured=${row.is_featured}, active=${row.is_active}, quality=${row.data_quality_score}`);
      });
    }

    // Also count total jobs
    const countResult = await client.query(
      `SELECT COUNT(*) as total FROM job_listings WHERE is_active = true`
    );
    console.log(`\n[VERIFY] Total active jobs in database: ${countResult.rows[0].total}`);
    
  } catch (error) {
    console.error('[VERIFY] Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyRoles();
