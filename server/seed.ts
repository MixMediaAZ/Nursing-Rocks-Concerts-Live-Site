import { db } from "./db";
import {
  events, artists, gallery, storeProducts,
  InsertArtist, InsertEvent, InsertGallery, InsertStoreProduct
} from "@shared/schema";
import { seedStoreProducts } from "./seed-store";

// SAFETY: Do not run in production — clears events, artists, gallery, store. User accounts are NOT touched, but content is.
if (process.env.NODE_ENV === "production") {
  console.error("❌ Refusing to run seed in production. User data is safe; this script would clear content data (events, artists, gallery).");
  process.exit(1);
}

async function seed() {
  console.log("🌱 Seeding database...");
  
  try {
    // Clear existing data
    await db.delete(gallery);
    await db.delete(events);
    await db.delete(artists);

    console.log("✓ Cleared existing data");
    
    // Create Artists
    const artistsData: InsertArtist[] = [
      {
        name: "The Healing Harmonies",
        bio: "Founded by a group of musically talented nurses, The Healing Harmonies combine powerful vocals with uplifting melodies. Since 2015, these healthcare professionals have been using music to inspire and support both patients and fellow medical workers, earning acclaim for their moving performances.",
        image_url: "https://images.unsplash.com/photo-1499364615650-ec38552f4f34?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=600&q=80",
        genre: "Pop Rock, Inspirational",
        latest_album: "Heroes in Scrubs (2023)",
        social_links: { spotify: "#", apple: "#", youtube: "#", instagram: "#" },
        featured_song: "Healing Hands",
        song_duration: "3:45"
      },
      {
        name: "Vital Signs",
        bio: "Vital Signs is a dynamic band composed of physicians and medical students who bring infectious energy to their performances. Their music combines medical themes with upbeat melodies, creating anthems of hope and resilience.",
        image_url: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
        genre: "Pop, Electronic",
        latest_album: "Code Blue (2023)",
        social_links: { spotify: "#", apple: "#", youtube: "#", instagram: "#" },
        featured_song: "Frontline Heroes",
        song_duration: "3:22"
      },
      {
        name: "Night Shift",
        bio: "Night Shift brings together ER nurses who find solace in music after long shifts. Their soul-stirring melodies and heartfelt lyrics reflect their experiences on the frontlines of healthcare, resonating deeply with audiences everywhere.",
        image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
        genre: "Indie, Folk",
        latest_album: "After Hours (2023)",
        social_links: { spotify: "#", apple: "#", youtube: "#", instagram: "#" },
        featured_song: "Sacred Silence",
        song_duration: "4:15"
      },
      {
        name: "The Caregivers Collective",
        bio: "The Caregivers Collective unites healthcare workers from diverse specialties who share a passion for jazz. Their soulful compositions celebrate the art of caregiving while raising awareness about healthcare issues.",
        image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
        genre: "Jazz, Soul",
        latest_album: "Compassionate Care (2023)",
        social_links: { spotify: "#", apple: "#", youtube: "#", instagram: "#" },
        featured_song: "Healing Rhythms",
        song_duration: "5:30"
      }
    ];
    
    const artistsInserted = await db.insert(artists).values(artistsData).returning();
    console.log(`✓ Inserted ${artistsInserted.length} artists`);

    // Create Events
    const eventsData: InsertEvent[] = [
      {
        title: "The Healing Harmonies",
        subtitle: "Heroes in Scrubs Tour",
        description: "Experience a powerful night of music performed by nurses who are using their musical talents to inspire hope and healing. Proceeds support the Healthcare Workers Foundation.",
        date: new Date("2023-10-21T20:00:00"),
        location: "New York, NY",
        artist_id: artistsInserted[0].id,
        image_url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
        start_time: "8:00 PM",
        doors_time: "7:00 PM",
        price: "$45-$120",
        is_featured: true,
        genre: "Inspirational",
        tickets_url: "#"
      },
      {
        title: "Vital Signs",
        subtitle: "Frontline Heroes Tribute",
        description: "Join this dynamic group of physicians and medical students for an energetic performance celebrating the resilience of healthcare workers everywhere.",
        date: new Date("2023-10-28T19:30:00"),
        location: "Chicago, IL",
        artist_id: artistsInserted[1].id,
        image_url: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
        start_time: "7:30 PM",
        doors_time: "6:30 PM",
        price: "$35-$85",
        is_featured: false,
        genre: "Pop",
        tickets_url: "#"
      },
      {
        title: "Night Shift",
        subtitle: "After Hours Tour",
        description: "ER nurses by day, musicians by night - experience the soulful melodies inspired by their frontline experiences in healthcare during this intimate performance.",
        date: new Date("2023-11-04T21:00:00"),
        location: "Los Angeles, CA",
        artist_id: artistsInserted[2].id,
        image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
        start_time: "9:00 PM",
        doors_time: "8:00 PM",
        price: "$30-$65",
        is_featured: false,
        genre: "Folk",
        tickets_url: "#"
      },
      {
        title: "The Caregivers Collective",
        subtitle: "Healing Rhythms Benefit",
        description: "An evening of soulful jazz performed by healthcare professionals united by their passion for music and healing. Ticket sales benefit nursing scholarship programs.",
        date: new Date("2023-11-11T20:30:00"),
        location: "San Francisco, CA",
        artist_id: artistsInserted[3].id,
        image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
        start_time: "8:30 PM",
        doors_time: "7:30 PM",
        price: "$40-$90",
        is_featured: false,
        genre: "Jazz",
        tickets_url: "#"
      }
    ];
    
    const eventsInserted = await db.insert(events).values(eventsData).returning();
    console.log(`✓ Inserted ${eventsInserted.length} events`);
    
    // Create Gallery Images
    const galleryData: InsertGallery[] = [
      {
        image_url: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=400&q=80",
        alt_text: "Healthcare heroes concert",
        event_id: eventsInserted[0].id
      },
      {
        image_url: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=400&q=80",
        alt_text: "Healthcare heroes concert",
        event_id: eventsInserted[1].id
      },
      {
        image_url: "https://images.unsplash.com/photo-1508252592163-5d3c3c559387?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=400&q=80",
        alt_text: "Healthcare heroes concert",
        event_id: eventsInserted[0].id
      },
      {
        image_url: "https://images.unsplash.com/photo-1442504028989-ab58b5f29a4a?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=400&q=80",
        alt_text: "Healthcare heroes concert",
        event_id: eventsInserted[1].id
      },
      {
        image_url: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6a3?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=400&q=80",
        alt_text: "Healthcare heroes concert",
        event_id: eventsInserted[0].id
      },
      {
        image_url: "https://images.unsplash.com/photo-1524012435847-659cf8c3d158?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=400&q=80",
        alt_text: "Healthcare heroes concert",
        event_id: eventsInserted[1].id
      },
      {
        image_url: "https://images.unsplash.com/photo-1551696785-927d4ac2d35b?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=400&q=80",
        alt_text: "Healthcare heroes concert",
        event_id: eventsInserted[0].id
      },
      {
        image_url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=400&q=80",
        alt_text: "Healthcare heroes concert",
        event_id: eventsInserted[1].id
      }
    ];
    
    const galleryInserted = await db.insert(gallery).values(galleryData).returning();
    console.log(`✓ Inserted ${galleryInserted.length} gallery images`);
    
    // Clear store products first
    await db.delete(storeProducts);
    
    // Seed store products
    await seedStoreProducts();
    console.log("✓ Inserted store products");
    
    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seed function
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unhandled error during seeding:", error);
    process.exit(1);
  });