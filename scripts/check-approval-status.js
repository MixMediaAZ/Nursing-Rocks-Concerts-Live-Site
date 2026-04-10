import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Client } = pg;

async function checkStatus() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT id, title, is_active, is_approved, source_job_id
      FROM job_listings
      WHERE source_name = 'phoenixchildrens'
      AND source_job_id IN ('973964', '1003185', '1003178')
      ORDER BY source_job_id
    `);
    
    console.log('[CHECK] Premium roles approval status:');
    result.rows.forEach(row => {
      console.log(`  ${row.title}`);
      console.log(`    - is_active: ${row.is_active}`);
      console.log(`    - is_approved: ${row.is_approved}`);
    });
    
  } catch (error) {
    console.error('[CHECK] Error:', error.message);
  } finally {
    await client.end();
  }
}

checkStatus();
