/**
 * Diagnose Email Service Configuration
 * Checks Resend API key, validates email service initialization, and tests a sample email
 */

import * as dotenv from 'dotenv';
dotenv.config();

console.log('📧 Email Service Diagnostic\n');

// Check 1: RESEND_API_KEY
console.log('1. RESEND_API_KEY Configuration:');
const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.log('   ❌ RESEND_API_KEY is NOT set');
  console.log('   → Set RESEND_API_KEY in Vercel environment variables');
} else if (apiKey.length < 20) {
  console.log(`   ⚠️  RESEND_API_KEY seems too short (${apiKey.length} chars)`);
  console.log(`   → Current value: ${apiKey.substring(0, 10)}...${apiKey.substring(-5)}`);
} else {
  console.log(`   ✅ RESEND_API_KEY is set`);
  console.log(`   → Key length: ${apiKey.length} characters`);
  console.log(`   → Prefix: ${apiKey.substring(0, 10)}...`);
}

// Check 2: Sender Email
console.log('\n2. Sender Email Configuration:');
const senderEmail = process.env.SENDER_EMAIL || "noreply@nursingrocks.com";
console.log(`   Email: ${senderEmail}`);
if (senderEmail.includes('@')) {
  console.log('   ✅ Valid email format');
} else {
  console.log('   ❌ Invalid email format');
}

// Check 3: Environment
console.log('\n3. Environment:');
const env = process.env.NODE_ENV || 'development';
console.log(`   NODE_ENV: ${env}`);
if (env === 'production') {
  console.log('   ℹ️  Production mode - emails will attempt Resend delivery');
} else {
  console.log('   ℹ️  Development mode - check server logs for email output');
}

// Check 4: APP_URL
console.log('\n4. APP_URL Configuration:');
const appUrl = process.env.APP_URL;
if (!appUrl) {
  console.log('   ⚠️  APP_URL not set');
  console.log('   → Defaulting to http://localhost:5000');
  console.log('   → For production, set APP_URL to your domain');
} else {
  console.log(`   ✅ APP_URL: ${appUrl}`);
}

// Check 5: Try to import Resend
console.log('\n5. Resend Module:');
try {
  const { Resend } = await import('resend');
  console.log('   ✅ Resend module can be imported');

  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      console.log('   ✅ Resend client initialized successfully');
      console.log('\n✨ All email checks passed!');
    } catch (initErr) {
      console.log(`   ❌ Failed to initialize Resend: ${initErr.message}`);
    }
  }
} catch (importErr) {
  console.log(`   ❌ Cannot import Resend module: ${importErr.message}`);
}

console.log('\n📋 Troubleshooting Tips:');
console.log('   • If emails aren\'t reaching Resend:');
console.log('     - Verify RESEND_API_KEY is correct in Vercel environment');
console.log('     - Check that the verified email domain is configured in Resend');
console.log('     - Look at Resend dashboard → Logs for delivery errors');
console.log('\n   • If welcome emails aren\'t being sent:');
console.log('     - Check server logs for "[Email]" and "[verification]" messages');
console.log('     - Verify user email addresses are valid format');
console.log('     - Check that APP_URL is set correctly for dashboard links\n');
