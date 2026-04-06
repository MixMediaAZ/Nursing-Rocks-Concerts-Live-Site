/**
 * Check if a user's welcome email was successfully sent
 * Usage: node scripts/check-welcome-email.js <userId>
 */

import * as dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkWelcomeEmail(userId) {
  const client = await pool.connect();

  try {
    // Get user info
    const userResult = await client.query(
      'SELECT id, email, is_verified, verification_source, verified_at FROM users WHERE id = $1',
      [userId]
    );

    if (!userResult.rows.length) {
      console.error(`❌ User ${userId} not found`);
      process.exit(1);
    }

    const user = userResult.rows[0];
    console.log(`\n📧 User Welcome Email Status:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Verified: ${user.is_verified ? '✅ Yes' : '❌ No'}`);
    console.log(`   Verified At: ${user.verified_at}`);
    console.log(`   Verification Source: ${user.verification_source}`);

    // Check tickets created by this user
    const ticketsResult = await client.query(
      `SELECT COUNT(*) as count,
              COUNT(CASE WHEN email_status = 'sent' THEN 1 END) as emails_sent,
              COUNT(CASE WHEN email_status = 'failed' THEN 1 END) as emails_failed,
              COUNT(CASE WHEN email_status = 'simulated' THEN 1 END) as emails_simulated
       FROM tickets WHERE user_id = $1`,
      [userId]
    );

    const tickets = ticketsResult.rows[0];
    console.log(`\n🎫 Ticket Email Status:`);
    console.log(`   Total Tickets: ${tickets.count}`);
    console.log(`   Emails Sent: ${tickets.emails_sent}`);
    console.log(`   Emails Simulated (dev): ${tickets.emails_simulated}`);
    console.log(`   Emails Failed: ${tickets.emails_failed}`);

    console.log(`\n💡 Next Steps:`);
    if (user.is_verified && user.verified_at) {
      console.log(`   ✅ User is verified`);
      console.log(`   → They should receive a welcome email with a dashboard link`);
      if (parseInt(tickets.count) === 0) {
        console.log(`   → After signing in, they can click "Get your ticket(s) & email" for free tickets`);
      }
    } else {
      console.log(`   ⚠️  User is not verified or verification_source is missing`);
    }

    console.log('');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

const userId = process.argv[2];
if (!userId) {
  console.log('Usage: node scripts/check-welcome-email.js <userId>');
  console.log('Example: node scripts/check-welcome-email.js 1');
  process.exit(1);
}

checkWelcomeEmail(parseInt(userId));
