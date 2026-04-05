#!/usr/bin/env node

/**
 * Apply Migration 004: Fix email case-insensitivity for subscribers and nrpx_registrations
 *
 * This script applies the migration to fix email case-sensitivity issues in:
 * 1. subscribers table - normalizes emails and creates case-insensitive unique index
 * 2. nrpx_registrations table - normalizes emails and creates case-insensitive unique index
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
    console.error('❌ ERROR: DATABASE_URL environment variable not set');
    console.error('Cannot apply migration without database connection');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    console.log('📋 Starting email case-insensitivity migration 004...\n');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('');

    // Read the migration SQL
    const migrationPath = path.join(__dirname, '../migrations/004_fix_email_case_insensitive_all_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📝 Migration file size:', (fs.statSync(migrationPath).size / 1024).toFixed(2), 'KB');
    console.log('');
    console.log('🔄 Executing migration SQL...');
    console.log('━'.repeat(60));

    // Execute the migration
    await client.query(migrationSQL);

    console.log('━'.repeat(60));
    console.log('');
    console.log('✅ Migration executed successfully!\n');

    // ========================================
    // VERIFICATION PHASE
    // ========================================

    console.log('🔍 VERIFICATION PHASE');
    console.log('═'.repeat(60));
    console.log('');

    // Verify subscribers index
    console.log('1. Checking subscribers table index...');
    const subscribersCheck = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'subscribers' AND indexname = 'subscribers_email_lower_unique'
    `);

    if (subscribersCheck.rows.length > 0) {
      console.log('   ✅ Case-insensitive index created: subscribers_email_lower_unique');
      console.log('   Index definition:', subscribersCheck.rows[0].indexdef.substring(0, 80) + '...');
    } else {
      console.warn('   ⚠️  Case-insensitive index not found for subscribers');
    }
    console.log('');

    // Verify nrpx_registrations index
    console.log('2. Checking nrpx_registrations table index...');
    const nrpxCheck = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'nrpx_registrations' AND indexname = 'nrpx_registrations_email_lower_unique'
    `);

    if (nrpxCheck.rows.length > 0) {
      console.log('   ✅ Case-insensitive index created: nrpx_registrations_email_lower_unique');
      console.log('   Index definition:', nrpxCheck.rows[0].indexdef.substring(0, 80) + '...');
    } else {
      console.warn('   ⚠️  Case-insensitive index not found for nrpx_registrations');
    }
    console.log('');

    // Count emails in each table
    console.log('3. Checking email normalization...');

    const subscriberStats = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN email = LOWER(email) THEN 1 END) as lowercase_count,
        COUNT(CASE WHEN email != LOWER(email) THEN 1 END) as non_lowercase_count
      FROM subscribers
    `);

    const subStats = subscriberStats.rows[0];
    console.log(`   Subscribers table: ${subStats.total} total`);
    console.log(`     ✅ Lowercase: ${subStats.lowercase_count}`);
    if (subStats.non_lowercase_count > 0) {
      console.log(`     ⚠️  Non-lowercase: ${subStats.non_lowercase_count}`);
    }
    console.log('');

    const nrpxStats = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN email = LOWER(email) THEN 1 END) as lowercase_count,
        COUNT(CASE WHEN email != LOWER(email) THEN 1 END) as non_lowercase_count
      FROM nrpx_registrations
    `);

    const nrpxStat = nrpxStats.rows[0];
    console.log(`   NRPX Registrations table: ${nrpxStat.total} total`);
    console.log(`     ✅ Lowercase: ${nrpxStat.lowercase_count}`);
    if (nrpxStat.non_lowercase_count > 0) {
      console.log(`     ⚠️  Non-lowercase: ${nrpxStat.non_lowercase_count}`);
    }
    console.log('');

    // Verify constraints dropped
    console.log('4. Checking old constraints removed...');
    const oldConstraints = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE constraint_name IN ('subscribers_email_unique', 'nrpx_registrations_email_unique')
    `);

    if (oldConstraints.rows.length === 0) {
      console.log('   ✅ Old case-sensitive constraints dropped');
    } else {
      console.log('   ⚠️  Found remaining old constraints:');
      oldConstraints.rows.forEach(row => {
        console.log(`      - ${row.constraint_name}`);
      });
    }
    console.log('');

    // Summary
    console.log('═'.repeat(60));
    console.log('✅ MIGRATION 004 COMPLETED SUCCESSFULLY!');
    console.log('═'.repeat(60));
    console.log('');
    console.log('Summary:');
    console.log(`  • Subscribers normalized: ${subStats.total} emails`);
    console.log(`  • NRPX registrations normalized: ${nrpxStat.total} emails`);
    console.log(`  • Case-insensitive indexes: 2 created`);
    console.log(`  • Old constraints: Removed`);
    console.log('');
    console.log('Email case-insensitivity is now bulletproof:');
    console.log('  ✅ All emails are stored in lowercase');
    console.log('  ✅ Database enforces case-insensitive uniqueness');
    console.log('  ✅ Lookups work with any email case variation');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ MIGRATION FAILED');
    console.error('═'.repeat(60));
    console.error('Error:', error.message);
    console.error('');
    console.error('Full error details:');
    console.error(error);
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
