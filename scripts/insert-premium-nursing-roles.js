#!/usr/bin/env node
/**
 * Insert premium nursing leadership roles into production database
 * Run: node scripts/insert-premium-nursing-roles.js
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const { Client } = pg;

const premiumRoles = [
  {
    sourceJobId: '973964',
    title: 'Director, Nursing Research & Innovation',
    description: 'Lead nursing science, evidence-based practice, and innovation initiatives. Monday-Friday, 8am-5pm. Requirements: DNP or PhD; 5+ years acute care; AZ RN License; National certification; BLS',
    url: 'https://careers.phoenixchildrens.com/Positions/Director-Nursing-Research',
  },
  {
    sourceJobId: '1003185',
    title: 'Director of Nursing Services - Perioperative',
    description: 'Strategic leadership of OR, Cath Lab, IR. Oversee high-acuity fast-paced environments. Monday-Friday, 6:30am-3:00pm. Requirements: BSN + MSN; 5+ years pediatric clinical with 2+ management; AZ RN; Specialty cert; BLS',
    url: 'https://careers.phoenixchildrens.com/Positions/Director-Nursing-Perioperative',
  },
  {
    sourceJobId: '1003178',
    title: 'Director, Occupational Health',
    description: 'Oversee Occupational Health Dept. Manage staff, budgets, safety, assessments, workers comp. Monday-Friday, 8am-5pm. Requirements: Bachelor\'s in Occupational Health/Healthcare Admin/Public Health; 5+ employee health admin; Case mgmt exp; 1+ EHR; BLS',
    url: 'https://careers.phoenixchildrens.com/Positions/Director-Occupational-Health',
  },
];

async function insertPremiumRoles() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('[PREMIUM ROLES] Connected to database');

    // Step 1: Delete any existing premium role attempts
    console.log('[PREMIUM ROLES] Cleaning up existing records...');
    const deleteResult = await client.query(
      `DELETE FROM job_listings
       WHERE source_name = $1 AND source_job_id = ANY($2)`,
      ['phoenixchildrens', ['973964', '1003185', '1003178']]
    );
    console.log(`[PREMIUM ROLES] Deleted ${deleteResult.rowCount} existing records`);

    // Step 2: Get employer ID (should be 1 for Phoenix Children's)
    const employerResult = await client.query(
      `SELECT id FROM employers WHERE id = 1 LIMIT 1`
    );

    if (employerResult.rows.length === 0) {
      throw new Error('Employer ID 1 not found - run db migration first');
    }

    const employerId = employerResult.rows[0].id;
    console.log(`[PREMIUM ROLES] Using employer_id: ${employerId}`);

    // Step 3: Insert premium roles
    console.log('[PREMIUM ROLES] Inserting premium roles...');

    for (const role of premiumRoles) {
      const insertResult = await client.query(
        `INSERT INTO job_listings (
          source_name, source_job_id, source_url, source_type,
          title, description,
          location, location_city, location_state, location_postal_code,
          job_type, work_arrangement, specialty, experience_level,
          is_remote, data_quality_score, is_featured, is_active,
          normalized_role_level, employer_id,
          first_seen_at, last_seen_at, last_synced_at, sync_status
        ) VALUES (
          $1, $2, $3, 'Nursing',
          $4, $5,
          'Phoenix, AZ', 'Phoenix', 'AZ', '85016',
          'Full-time', 'On-site', 'Nursing', 'Executive',
          false, 95, true, true,
          'Director/Executive', $6,
          NOW(), NOW(), NOW(), 'active'
        )`,
        [
          'phoenixchildrens',
          role.sourceJobId,
          role.url,
          role.title,
          role.description,
          employerId,
        ]
      );
      console.log(`[PREMIUM ROLES] ✅ Inserted: ${role.title} (ID: ${role.sourceJobId})`);
    }

    console.log('[PREMIUM ROLES] 🎉 All 3 premium nursing roles inserted successfully!');

  } catch (error) {
    console.error('[PREMIUM ROLES] ❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

insertPremiumRoles();
