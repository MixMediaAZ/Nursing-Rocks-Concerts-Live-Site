import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Client } = pg;

async function updateEmployer() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    
    const result = await client.query(
      `UPDATE employers
       SET name = $1,
           description = $2,
           contact_email = $3
       WHERE id = 1
       RETURNING id, name, description, contact_email`,
      [
        "Phoenix Children's Hospital",
        "Phoenix Children's Hospital is a pediatric medical center dedicated to providing comprehensive healthcare services to children. As a leading provider of specialized pediatric care in Arizona, we offer state-of-the-art facilities, advanced medical technologies, and a team of highly skilled healthcare professionals committed to excellence in patient care and nursing practice.",
        "careers@phoenixchildrens.com"
      ]
    );
    
    if (result.rows.length > 0) {
      const emp = result.rows[0];
      console.log('[UPDATE] Employer profile updated:');
      console.log(`  Name: ${emp.name}`);
      console.log(`  Email: ${emp.contact_email}`);
      console.log(`  Description: ${emp.description.substring(0, 80)}...`);
    } else {
      console.log('[UPDATE] No employer found with ID 1');
    }
    
  } catch (error) {
    console.error('[UPDATE] Error:', error.message);
  } finally {
    await client.end();
  }
}

updateEmployer();
