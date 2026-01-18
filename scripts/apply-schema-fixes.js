import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function applySchemaFixes() {
  try {
    console.log('Applying schema fixes...');
    
    // Add is_suspended column to users table
    await pool.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'users' AND column_name = 'is_suspended'
          ) THEN
              ALTER TABLE users ADD COLUMN is_suspended BOOLEAN DEFAULT false;
              RAISE NOTICE 'Added is_suspended column to users table';
          ELSE
              RAISE NOTICE 'is_suspended column already exists in users table';
          END IF;
      END $$;
    `);

    // Add deleted_at column to approved_videos table
    await pool.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'approved_videos' AND column_name = 'deleted_at'
          ) THEN
              ALTER TABLE approved_videos ADD COLUMN deleted_at TIMESTAMP;
              RAISE NOTICE 'Added deleted_at column to approved_videos table';
          ELSE
              RAISE NOTICE 'deleted_at column already exists in approved_videos table';
          END IF;
      END $$;
    `);

    // Check for duplicate public_ids before adding unique constraint
    const duplicateCheck = await pool.query(`
      SELECT public_id, COUNT(*) as count
      FROM approved_videos 
      GROUP BY public_id 
      HAVING COUNT(*) > 1;
    `);

    if (duplicateCheck.rows.length > 0) {
      console.warn('⚠️  WARNING: Duplicate public_id values found:');
      duplicateCheck.rows.forEach(row => {
        console.warn(`   - ${row.public_id}: ${row.count} occurrences`);
      });
      console.warn('Cannot add unique constraint until duplicates are resolved.');
    } else {
      // Add unique constraint to approved_videos.public_id
      await pool.query(`
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE table_name = 'approved_videos' 
                AND constraint_name = 'approved_videos_public_id_unique'
            ) THEN
                ALTER TABLE approved_videos ADD CONSTRAINT approved_videos_public_id_unique UNIQUE (public_id);
                RAISE NOTICE 'Added unique constraint to approved_videos.public_id';
            ELSE
                RAISE NOTICE 'Unique constraint already exists on approved_videos.public_id';
            END IF;
        END $$;
      `);
    }

    console.log('✅ Schema fixes applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error applying schema fixes:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applySchemaFixes();
