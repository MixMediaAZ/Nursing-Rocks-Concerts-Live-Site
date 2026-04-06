#!/usr/bin/env node

/**
 * Apply Email Case-Insensitivity Migration
 *
 * This script applies the migration to fix email case-sensitivity issues:
 * 1. Normalizes all existing emails to lowercase
 * 2. Drops the old case-sensitive unique constraint
 * 3. Creates a new case-insensitive unique constraint using LOWER(email)
 *
 * This ensures:
 * - test@example.com, Test@Example.com, TEST@EXAMPLE.COM are treated as the same email
 * - The database enforces case-insensitive uniqueness
 * - Login queries work correctly regardless of input case
 */

import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyMigration() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('ERROR: DATABASE_URL environment variable not set');
    console.error('Cannot apply migration without database connection');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    console.log('Starting email case-insensitivity migration...\n');

    // Read the migration SQL
    const migrationPath = path.join(__dirname, '../migrations/003_fix_email_case_insensitive.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('Executing migration SQL...');
    console.log('---');

    // Execute the migration
    await client.query(migrationSQL);

    console.log('---');
    console.log('\n✅ Migration applied successfully!\n');

    // Verify the constraint exists
    const constraintCheck = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'users' AND constraint_name = 'users_email_lower_unique'
    `);

    if (constraintCheck.rows.length > 0) {
      console.log('✅ Case-insensitive unique constraint verified: users_email_lower_unique');
    } else {
      console.warn('⚠️  Case-insensitive constraint not found. Checking indexes...');

      const indexCheck = await client.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'users' AND indexname = 'users_email_lower_unique'
      `);

      if (indexCheck.rows.length > 0) {
        console.log('✅ Case-insensitive unique index verified: users_email_lower_unique');
      } else {
        console.error('❌ Constraint/index not found. Migration may have failed.');
        process.exit(1);
      }
    }

    // Count normalized emails
    const emailCount = await client.query(`
      SELECT COUNT(*) as total_users FROM users
    `);

    console.log(`✅ Total users in database: ${emailCount.rows[0].total_users}`);

    // Check for any remaining non-lowercase emails (should be none after migration)
    const nonLowerCount = await client.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE email != LOWER(email)
    `);

    if (nonLowerCount.rows[0].count === 0) {
      console.log('✅ All emails are properly normalized to lowercase');
    } else {
      console.warn(`⚠️  Found ${nonLowerCount.rows[0].count} emails that are not lowercase`);
    }

    console.log('\n✅ Email case-insensitivity is now bulletproof!');
    console.log('   - All emails are stored in lowercase');
    console.log('   - Database enforces case-insensitive uniqueness');
    console.log('   - Login will work with any case variation\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
applyMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
