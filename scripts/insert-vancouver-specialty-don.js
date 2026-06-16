#!/usr/bin/env node
/**
 * Insert Vancouver Specialty & Rehabilitation Care employer + Director of Nursing listing.
 * Idempotent: re-running will not create duplicates (matches employer by contact_email,
 * listing by title + employer_id). Runs in a single transaction.
 *
 * Run: node scripts/insert-vancouver-specialty-don.js
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Client } = pg;

// ---- Employer ----------------------------------------------------------------
const employer = {
  company_name: 'Vancouver Specialty & Rehabilitation Care',
  name: 'Vancouver Specialty & Rehabilitation Care',
  description:
    'At Vancouver Specialty & Rehabilitation Care, we are dedicated to enhancing the health and well-being of our patients. ' +
    'Our skilled nursing facility is equipped with advanced technology and staffed by professionals who are deeply committed ' +
    'to your care. From long-term care to post-acute recovery, we ensure every patient receives individualized attention.',
  website: 'https://vancouverspecialty.com',
  logo_url: '/assets/employers/IMG_8613.jpeg',
  address: '1015 N. Garrison Rd.',
  city: 'Vancouver',
  state: 'WA',
  zip_code: '98664',
  contact_email: 'clingo@vancouverspecialty.com'.toLowerCase().trim(),
  contact_phone: '(360) 694-7501',
};

// ---- Listing -----------------------------------------------------------------
const listing = {
  title: 'Director of Nursing',
  description:
    'We are seeking a highly skilled and compassionate Director of Nursing to lead our team at Vancouver Specialty & ' +
    'Rehabilitation Care in Vancouver, WA. As a key member of our leadership team, you will be responsible for overseeing ' +
    'the daily operations of our skilled nursing facility, ensuring the highest level of patient care and satisfaction. ' +
    'If you are a driven and dedicated nursing professional with a passion for delivering exceptional care, we encourage ' +
    'you to apply for this rewarding opportunity.',
  responsibilities: [
    'Leadership: Provide strategic direction and support to the nursing team, ensuring compliance with regulatory requirements and company policies',
    'Quality Improvement: Develop and implement quality improvement initiatives to enhance patient outcomes and satisfaction',
    'Staff Management: Recruit, mentor, and develop a talented team of nursing professionals, promoting a positive work environment and culture of excellence',
    'Patient Care: Collaborate with interdisciplinary teams to develop and implement individualized care plans, ensuring the unique needs of each patient are met',
    'Regulatory Compliance: Ensure compliance with regulatory requirements, accreditation standards, and company policies',
    'Budget Management: Manage the nursing budget, making informed decisions to optimize resources and improve patient care',
  ].join('\n'),
  requirements: [
    "Bachelor's Degree in Nursing or related field",
    'Minimum 3 years of experience as a Director of Nursing or in a similarly senior role',
    'Current RN licensure in the state of Washington',
    'Excellent leadership, communication, and problem-solving skills',
    'Ability to work in a fast-paced environment and prioritize multiple tasks',
    'Commitment to delivering exceptional patient care and promoting a positive work environment',
  ].join('\n'),
  location: 'Vancouver, WA',
  job_type: 'Full-time',
  work_arrangement: 'On-site',
  specialty: 'Nursing',
  experience_level: 'Executive',
  education_required: "Bachelor's Degree in Nursing or related field",
  certification_required: ['RN License (Washington)'],
  location_city: 'Vancouver',
  location_state: 'WA',
  location_postal_code: '98664',
  normalized_role_level: 'Director/Executive',
};

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    console.log('[VANCOUVER DON] Connected to database');
    await client.query('BEGIN');

    // --- Employer (idempotent by contact_email) ---
    let employerId;
    const existingEmp = await client.query(
      `SELECT id FROM employers WHERE lower(contact_email) = $1 LIMIT 1`,
      [employer.contact_email]
    );

    if (existingEmp.rows.length > 0) {
      employerId = existingEmp.rows[0].id;
      await client.query(
        `UPDATE employers SET
           company_name = $2, name = $3, description = $4, website = $5, logo_url = $6,
           address = $7, city = $8, state = $9, zip_code = $10, contact_phone = $11,
           is_verified = true, account_status = 'active', updated_at = NOW()
         WHERE id = $1`,
        [employerId, employer.company_name, employer.name, employer.description,
         employer.website, employer.logo_url, employer.address, employer.city,
         employer.state, employer.zip_code, employer.contact_phone]
      );
      console.log(`[VANCOUVER DON] Updated existing employer id=${employerId}`);
    } else {
      const ins = await client.query(
        `INSERT INTO employers (
           company_name, name, description, website, logo_url,
           address, city, state, zip_code, contact_email, contact_phone,
           is_verified, account_status, created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true,'active',NOW(),NOW())
         RETURNING id`,
        [employer.company_name, employer.name, employer.description, employer.website,
         employer.logo_url, employer.address, employer.city, employer.state,
         employer.zip_code, employer.contact_email, employer.contact_phone]
      );
      employerId = ins.rows[0].id;
      console.log(`[VANCOUVER DON] Inserted new employer id=${employerId}`);
    }

    // --- Listing (idempotent by title + employer_id) ---
    const existingJob = await client.query(
      `SELECT id FROM job_listings WHERE title = $1 AND employer_id = $2 LIMIT 1`,
      [listing.title, employerId]
    );

    if (existingJob.rows.length > 0) {
      console.log(`[VANCOUVER DON] Listing already exists id=${existingJob.rows[0].id} — skipping insert`);
    } else {
      const insJob = await client.query(
        `INSERT INTO job_listings (
           title, employer_id, description, responsibilities, requirements,
           location, job_type, work_arrangement, specialty, experience_level,
           education_required, certification_required,
           application_url, contact_email,
           is_featured, is_active, is_approved, approved_at, approval_notes,
           location_city, location_state, location_postal_code,
           source_type, sync_status, data_quality_score, normalized_role_level,
           posted_date, first_seen_at, last_seen_at, last_synced_at
         ) VALUES (
           $1,$2,$3,$4,$5,
           $6,$7,$8,$9,$10,
           $11,$12,
           NULL,NULL,
           false,true,true,NOW(),'Manually added by admin',
           $13,$14,$15,
           'manual','active',95,$16,
           NOW(),NOW(),NOW(),NOW()
         ) RETURNING id`,
        [listing.title, employerId, listing.description, listing.responsibilities,
         listing.requirements, listing.location, listing.job_type, listing.work_arrangement,
         listing.specialty, listing.experience_level, listing.education_required,
         listing.certification_required, listing.location_city, listing.location_state,
         listing.location_postal_code, listing.normalized_role_level]
      );
      console.log(`[VANCOUVER DON] ✅ Inserted listing id=${insJob.rows[0].id}`);
    }

    await client.query('COMMIT');

    // --- Verify it would show on the public board (is_active && is_approved) ---
    const verify = await client.query(
      `SELECT j.id, j.title, j.is_active, j.is_approved, j.specialty, j.experience_level,
              e.name AS employer, e.logo_url, e.city, e.state
         FROM job_listings j JOIN employers e ON e.id = j.employer_id
        WHERE j.employer_id = $1 AND j.title = $2`,
      [employerId, listing.title]
    );
    console.log('[VANCOUVER DON] 🔎 Public-visibility check:');
    console.table(verify.rows);
    console.log('[VANCOUVER DON] 🎉 Done.');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[VANCOUVER DON] ❌ Error:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
