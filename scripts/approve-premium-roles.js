import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Client } = pg;

async function approvePremiumRoles() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    
    // Update to approved + add approval notes
    const result = await client.query(`
      UPDATE job_listings
      SET is_approved = true,
          approved_by = (SELECT id FROM users WHERE email LIKE '%admin%' LIMIT 1),
          approved_at = NOW(),
          approval_notes = 'Premium nursing leadership role - featured'
      WHERE source_name = 'phoenixchildrens'
      AND source_job_id IN ('973964', '1003185', '1003178')
      RETURNING id, title, is_approved
    `);
    
    console.log('[APPROVE] Updated premium roles:');
    result.rows.forEach(row => {
      console.log(`  ✅ ${row.title} (ID: ${row.id})`);
    });
    
  } catch (error) {
    console.error('[APPROVE] Error:', error.message);
  } finally {
    await client.end();
  }
}

approvePremiumRoles();
