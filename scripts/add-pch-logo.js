import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Client } = pg;

async function addLogo() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    
    const result = await client.query(
      `UPDATE employers
       SET logo_url = $1
       WHERE id = 1
       RETURNING id, name, logo_url`,
      ['/assets/employers/phoenix-childrens-logo.png']
    );
    
    if (result.rows.length > 0) {
      const emp = result.rows[0];
      console.log('[LOGO] Employer updated:');
      console.log(`  Name: ${emp.name}`);
      console.log(`  Logo URL: ${emp.logo_url}`);
    }
    
  } catch (error) {
    console.error('[LOGO] Error:', error.message);
  } finally {
    await client.end();
  }
}

addLogo();
