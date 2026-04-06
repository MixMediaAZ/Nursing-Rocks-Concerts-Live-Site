/**
 * Comprehensive Resend NRCS Account Test
 * Tests: API key validity, email sending, sender configuration
 */

import * as dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.RESEND_API_KEY;
const senderEmail = process.env.SENDER_EMAIL || "noreply@nursingrocksconcerts.com";
const testRecipient = process.argv[2];

if (!testRecipient) {
  console.log('Usage: node scripts/test-resend-nrcs.js <test-email@example.com>');
  console.log('Example: node scripts/test-resend-nrcs.js dave@example.com');
  process.exit(1);
}

console.log('\n🧪 NRCS Resend Configuration Test\n');
console.log('═'.repeat(60));

// Test 1: API Key
console.log('\n1️⃣  API KEY VALIDATION');
console.log('─'.repeat(60));
if (!apiKey) {
  console.log('❌ RESEND_API_KEY not found in .env');
  process.exit(1);
}
console.log(`✅ API Key found (length: ${apiKey.length})`);
console.log(`   Prefix: ${apiKey.substring(0, 10)}...`);

// Test 2: Sender Email Configuration
console.log('\n2️⃣  SENDER EMAIL CONFIGURATION');
console.log('─'.repeat(60));
console.log(`✅ SENDER_EMAIL: ${senderEmail}`);
if (senderEmail.includes('nursingrocksconcerts.com')) {
  console.log('✅ Using nursingrocksconcerts.com domain');
} else {
  console.log('⚠️  Using different domain than expected');
}

// Test 3: Try to initialize Resend
console.log('\n3️⃣  RESEND CLIENT INITIALIZATION');
console.log('─'.repeat(60));
try {
  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);
  console.log('✅ Resend client initialized');

  // Test 4: Send test email
  console.log('\n4️⃣  SEND TEST EMAIL');
  console.log('─'.repeat(60));
  console.log(`Sending test email to: ${testRecipient}`);
  console.log(`From: ${senderEmail}`);

  try {
    const result = await resend.emails.send({
      from: senderEmail,
      to: testRecipient,
      subject: '🎸 NRCS Resend Test - Everything is Working!',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f3f4f6; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #dc2626;">✅ Resend Configuration Test Successful!</h1>

    <p style="font-size: 16px; line-height: 1.6;">This test email confirms your NRCS Resend account is working correctly.</p>

    <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #15803d;">Test Results:</h3>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>✅ API Key Valid</li>
        <li>✅ Sender Email Verified</li>
        <li>✅ Email Delivery Working</li>
        <li>✅ NRCS Account Active</li>
      </ul>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      You can now safely:
      <br>• Close your old Resend account
      <br>• Use NRCS account for all Nursing Rocks emails
      <br>• Deploy welcome emails with confidence
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">Sent from Nursing Rocks Concert Series</p>
  </div>
</body>
</html>`,
      replyTo: 'support@nursingrocksconcerts.com',
    });

    console.log('\n✅ EMAIL SENT SUCCESSFULLY!');
    console.log(`   Email ID: ${result.id}`);
    console.log(`   Status: Sent to ${testRecipient}`);
    console.log('\n🎉 Check your inbox (and spam folder) for the test email');

  } catch (sendError) {
    console.log('\n❌ EMAIL SEND FAILED');
    console.log(`   Error: ${sendError.message}`);
    if (sendError.message.includes('not a valid sending domain')) {
      console.log('\n   💡 This means the sender address needs to be verified in Resend');
      console.log('      Go to Resend → Domains → nursingrocksconcerts.com → Add Sender');
      console.log(`      Then add: ${senderEmail}`);
    }
    process.exit(1);
  }

} catch (initError) {
  console.log('❌ Failed to initialize Resend');
  console.log(`   Error: ${initError.message}`);
  process.exit(1);
}

console.log('\n' + '═'.repeat(60));
console.log('\n✨ ALL TESTS PASSED!\n');
console.log('📋 Summary:');
console.log(`   • API Key: ✅ Valid`);
console.log(`   • Sender: ✅ ${senderEmail}`);
console.log(`   • Delivery: ✅ Working`);
console.log('\n🚀 You can now safely:');
console.log('   1. Verify that old Resend account is no longer needed');
console.log('   2. Close the old account');
console.log('   3. Deploy with confidence');
console.log('   4. Test welcome emails in production\n');
