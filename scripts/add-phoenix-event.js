/**
 * Add Phoenix Nursing Rocks Concert Event to Database
 * Event: Friday, May 16, 2026 at 3:00 PM, Phoenix Children's Hospital presents Nursing Rocks
 */

import * as dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addPhoenixEvent() {
  const client = await pool.connect();

  try {
    console.log('🎵 Adding Phoenix Nursing Rocks Concert event...');

    // Get or create the artist for this event (reuse existing if available)
    const artistResult = await client.query(
      `SELECT id FROM artists WHERE name = 'Nursing Rocks All-Stars' LIMIT 1`
    );

    let artistId;
    if (artistResult.rows.length > 0) {
      artistId = artistResult.rows[0].id;
      console.log(`✅ Using existing artist: Nursing Rocks All-Stars (ID: ${artistId})`);
    } else {
      // Create the artist if it doesn't exist
      const insertArtist = await client.query(
        `INSERT INTO artists (name, bio, genre)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [
          'Nursing Rocks All-Stars',
          'Talented nurses celebrating the nursing profession through music',
          'Rock, Pop'
        ]
      );
      artistId = insertArtist.rows[0].id;
      console.log(`✅ Created new artist: Nursing Rocks All-Stars (ID: ${artistId})`);
    }

    // Create the Phoenix event
    const eventDate = new Date('2026-05-16T15:00:00'); // 3:00 PM on May 16, 2026
    const eventEndDate = new Date('2026-05-16T22:00:00'); // 10:00 PM same day

    const result = await client.query(
      `INSERT INTO events
       (title, subtitle, description, date, end_at, artist_id, image_url, start_time, doors_time,
        price, location, genre, status, ticket_expiration_at, is_featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id, title, date, end_at, status`,
      [
        'Nursing Rocks Phoenix',
        'Phoenix Children\'s Presents Nursing Rocks',
        'A sponsored concert event celebrating nurses and the nursing profession! Presented by Phoenix Children\'s Hospital and Lucid Motors. Nurses attend FREE! Benefiting Gateway Community College Nursing Program.',
        eventDate,
        eventEndDate,
        artistId,
        '/assets/NRCS%20Phoenix%20Poster%201.PNG',
        '3:00 PM',
        '2:30 PM',
        'Free for nurses, $25 general admission',
        'The Walter Studio, Phoenix, AZ',
        'Rock',
        'published',
        eventEndDate, // tickets expire at end of event
        true // featured event
      ]
    );

    const event = result.rows[0];
    console.log('\n✅ Phoenix Event Created Successfully!');
    console.log(`   ID: ${event.id}`);
    console.log(`   Title: ${event.title}`);
    console.log(`   Date: ${event.date}`);
    console.log(`   End: ${event.end_at}`);
    console.log(`   Status: ${event.status}`);
    console.log('\n🎸 Event is now eligible for free tickets (published + future end_at)\n');

  } catch (error) {
    console.error('❌ Error adding Phoenix event:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addPhoenixEvent().then(() => {
  console.log('✨ Done!');
  process.exit(0);
});
