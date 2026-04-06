/**
 * Diagnose Admin Dashboard Email Issues
 * Tests if basic email works and checks what's broken in admin resend
 */

import * as dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function diagnoseAdminEmail() {
  const client = await pool.connect();

  try {
    console.log('\n📧 Admin Email Diagnostics\n');
    console.log('═'.repeat(60));

    // Check 1: RESEND_API_KEY
    console.log('\n1️⃣  RESEND Configuration');
    console.log('─'.repeat(60));
    const apiKey = process.env.RESEND_API_KEY;
    const sender = process.env.SENDER_EMAIL;

    if (!apiKey) {
      console.log('❌ RESEND_API_KEY missing');
      process.exit(1);
    }
    console.log(`✅ API Key: ${apiKey.substring(0, 10)}...`);
    console.log(`✅ Sender: ${sender}`);

    // Check 2: Get a sample ticket from database
    console.log('\n2️⃣  Sample Ticket');
    console.log('─'.repeat(60));

    const ticketResult = await client.query(
      `SELECT t.id, t.ticket_code, t.email_status, u.email, u.first_name, e.title
       FROM tickets t
       JOIN users u ON t.user_id = u.id
       JOIN events e ON t.event_id = e.id
       ORDER BY t.issued_at DESC
       LIMIT 1`
    );

    if (!ticketResult.rows.length) {
      console.log('⚠️  No tickets in database');
      console.log('   Create a ticket first (verify user → click "Get your ticket(s)")');
      process.exit(0);
    }

    const ticket = ticketResult.rows[0];
    console.log(`✅ Found ticket: ${ticket.ticket_code}`);
    console.log(`   ID: ${ticket.id}`);
    console.log(`   User: ${ticket.first_name} (${ticket.email})`);
    console.log(`   Event: ${ticket.title}`);
    console.log(`   Email Status: ${ticket.email_status}`);

    // Check 3: Try to import and call resendTicketEmail directly
    console.log('\n3️⃣  Test Email Service Function');
    console.log('─'.repeat(60));

    try {
      const { resendTicketEmail } = await import('../server/services/email.ts');
      console.log('✅ Email service imported successfully');

      // Try to resend
      console.log(`\nAttempting to resend ticket ${ticket.ticket_code}...`);
      const result = await resendTicketEmail(ticket.id);

      console.log('✅ Email function executed');
      console.log(`   Result:`, result);

    } catch (importError) {
      console.log(`❌ Error with email service:`, importError.message);
      console.log('\n💡 Possible causes:');
      console.log('   • Email service has a runtime error');
      console.log('   • Resend API key is invalid');
      console.log('   • User or event data is missing');
    }

    console.log('\n' + '═'.repeat(60));
    console.log('\n📋 Checklist:');
    console.log('   ✅ RESEND_API_KEY configured');
    console.log('   ✅ Sample ticket found');
    console.log('   ? Email function working (see results above)\n');

  } catch (error) {
    console.error('Diagnostic error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

diagnoseAdminEmail();
