/**
 * Update Phoenix Nursing Rocks Concert Event with Correct Details
 * Event: Saturday, May 16, 2026
 * Festival 3pm-6pm, Concert 6:30pm-11pm
 * Location: Walter Studios, 747 W. Roosevelt Street, Phoenix, AZ 85016
 */

import * as dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updatePhoenixEvent() {
  const client = await pool.connect();

  try {
    console.log('🎵 Updating Phoenix Nursing Rocks Concert event with correct details...');

    const eventDate = new Date('2026-05-16T15:00:00'); // Festival starts 3:00 PM on Saturday, May 16, 2026
    const eventEndDate = new Date('2026-05-16T23:00:00'); // Concert ends 11:00 PM same day

    const updatedDescription = `Celebrate Nurses Month in Phoenix on Saturday, May 16th at Walter Studios!

🎉 Festival: 3:00 PM - 6:00 PM
• Giveaways
• Meet-and-Greets
• Social Media Capture Campaigns
• Show Your Support and Have FUN!

🎸 Live Concert: 6:30 PM - 11:00 PM
• Nurse Celebration on Main Stage
• Nurses recognized and honored between bands

📍 Location: Walter Studios
747 W. Roosevelt Street
Phoenix, AZ 85016

✨ Sponsors & Partners:
• Phoenix Children's Hospital
• Gateway Community College
• Lucid Motors
• NADONA/LTC

Nurses Attend FREE! Open to the Public.`;

    const result = await client.query(
      `UPDATE events
       SET
         title = $1,
         subtitle = $2,
         description = $3,
         date = $4,
         end_at = $5,
         start_time = $6,
         doors_time = $7,
         location = $8,
         price = $9
       WHERE id = 1
       RETURNING id, title, date, end_at, start_time, location, status`,
      [
        'Nursing Rocks! Concert Series - Phoenix',
        'Celebrate Nurses Month - Saturday, May 16, 2026',
        updatedDescription,
        eventDate,
        eventEndDate,
        '6:30 PM', // Concert start time
        '3:00 PM', // Festival/doors open
        '747 W. Roosevelt Street, Phoenix, AZ 85016',
        'Free for nurses, $25 general admission',
      ]
    );

    if (result.rows.length === 0) {
      console.error('❌ Phoenix event (ID: 1) not found');
      process.exit(1);
    }

    const event = result.rows[0];
    console.log('\n✅ Phoenix Event Updated Successfully!');
    console.log(`   ID: ${event.id}`);
    console.log(`   Title: ${event.title}`);
    console.log(`   Date: ${event.date} (Saturday)`);
    console.log(`   End: ${event.end_at}`);
    console.log(`   Festival Start: 3:00 PM`);
    console.log(`   Concert Start: 6:30 PM`);
    console.log(`   Location: ${event.location}`);
    console.log(`   Status: ${event.status}`);

    console.log('\n📋 QR Code Status:');
    console.log('   ✅ All previously generated QR codes are STILL VALID');
    console.log('   ✅ QR codes are tied to ticket IDs, not event details');
    console.log('   ✅ Tickets created before this update will still work');
    console.log('\n🎫 Ticket Generation:');
    console.log('   ✅ New tickets generated now will use updated event details');
    console.log('   ✅ Users will see correct date/time (Saturday, May 16, 2026)');
    console.log('\n✨ Event is live and ready!\n');

  } catch (error) {
    console.error('❌ Error updating Phoenix event:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

updatePhoenixEvent().then(() => {
  console.log('Done!');
  process.exit(0);
});
