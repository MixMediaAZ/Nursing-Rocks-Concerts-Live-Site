import { Pool } from '@neondatabase/serverless';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkSchemaStatus() {
  try {
    console.log('Checking schema status...\n');
    
    // Check is_suspended column
    const isSuspendedCheck = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'is_suspended';
    `);
    console.log('✅ users.is_suspended:', isSuspendedCheck.rows.length > 0 ? 'EXISTS' : 'MISSING');
    
    // Check deleted_at column
    const deletedAtCheck = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'approved_videos' AND column_name = 'deleted_at';
    `);
    console.log('✅ approved_videos.deleted_at:', deletedAtCheck.rows.length > 0 ? 'EXISTS' : 'MISSING');
    
    // Check unique constraint
    const uniqueConstraintCheck = await pool.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints 
      WHERE table_name = 'approved_videos' 
      AND constraint_name = 'approved_videos_public_id_unique';
    `);
    console.log('✅ approved_videos.public_id unique constraint:', uniqueConstraintCheck.rows.length > 0 ? 'EXISTS' : 'MISSING');
    
    // Check for duplicate public_ids
    const duplicateCheck = await pool.query(`
      SELECT public_id, COUNT(*) as count
      FROM approved_videos 
      GROUP BY public_id 
      HAVING COUNT(*) > 1;
    `);
    
    if (duplicateCheck.rows.length > 0) {
      console.log('\n⚠️  WARNING: Duplicate public_id values found:');
      duplicateCheck.rows.forEach(row => {
        console.log(`   - ${row.public_id}: ${row.count} occurrences`);
      });
    } else {
      console.log('✅ No duplicate public_id values found');
    }
    
    console.log('\n✅ Schema check complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking schema:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkSchemaStatus();
