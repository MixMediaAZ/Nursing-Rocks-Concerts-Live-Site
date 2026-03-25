import { db } from "./db";
import { artists, events, gallery } from "@shared/schema";

// SAFETY: Do not run in production — clears events, artists, gallery. User accounts are NOT touched, but content is.
if (process.env.NODE_ENV === "production") {
  console.error("❌ Refusing to run seed-nursing-rocks in production. User data is safe; this script would clear content data.");
  process.exit(1);
}

async function seedNursingRocks() {
  console.log("🌱 Starting Nursing Rocks seed process...");

  try {
    // Clear existing data
    console.log("Clearing existing data...");
    await db.delete(gallery);
    await db.delete(events);
    await db.delete(artists);
    
    console.log("Creating new artists...");
    // Create new artists with Nursing Rocks branding
    const [nursingRocksAllStars] = await db.insert(artists).values({
      name: "Nursing Rocks All-Stars",
      bio: "The Nursing Rocks All-Stars features talented nurses from across the country who use music to celebrate the nursing profession and bring joy to patients and colleagues alike. Founded in 2021, this revolving collective of healthcare professionals combines powerful vocals with uplifting melodies.",
      image_url: "https://images.unsplash.com/photo-1499364615650-ec38552f4f34?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=600&q=80",
      genre: "Rock, Pop",
      latest_album: "Beyond the Call of Duty (2023)",
      social_links: { spotify: "#", apple: "#", youtube: "#", instagram: "#" },
      featured_song: "Heroes in Blue",
      song_duration: "3:45"
    }).returning();

    const [nightShiftNurses] = await db.insert(artists).values({
      name: "Night Shift Nurses",
      bio: "Night Shift Nurses brings together RNs who discovered their shared passion for music during long overnight shifts. Their energetic performances and authentic lyrics reflect their experiences on the frontlines of healthcare with a rock edge that resonates with audiences everywhere.",
      image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      genre: "Rock, Alternative",
      latest_album: "Vital Signs (2023)",
      social_links: { spotify: "#", apple: "#", youtube: "#", instagram: "#" },
      featured_song: "Code Blue",
      song_duration: "4:15"
    }).returning();

    const [nursingBeat] = await db.insert(artists).values({
      name: "Nursing Beat",
      bio: "Nursing Beat combines the talents of ICU and ER nurses with a shared passion for rhythm and blues. Their uplifting performances celebrate the strength and resilience of the nursing community while raising awareness about healthcare issues.",
      image_url: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      genre: "R&B, Soul",
      latest_album: "Compassionate Care (2023)",
      social_links: { spotify: "#", apple: "#", youtube: "#", instagram: "#" },
      featured_song: "Healing Hands",
      song_duration: "5:10"
    }).returning();

    const [scrubsAndSoul] = await db.insert(artists).values({
      name: "Scrubs & Soul",
      bio: "A passionate collective of nurse vocalists and musicians who bring their experiences from hospital floors to the stage. Their soulful performances spread messages of hope, resilience, and the unique perspective that comes from a career in nursing.",
      image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      genre: "Soul, Jazz",
      latest_album: "Beyond the Charts (2023)",
      social_links: { spotify: "#", apple: "#", youtube: "#", instagram: "#" },
      featured_song: "Patient Heart",
      song_duration: "4:45"
    }).returning();

    console.log("Creating new events...");
    // Create events with Nursing Rocks branding
    const [featuredEvent] = await db.insert(events).values({
      title: "Nursing Rocks All-Stars",
      subtitle: "Beyond the Call of Duty Tour",
      description: "Experience an electrifying night of music performed by nurses who are using their musical talents to celebrate the nursing profession. This flagship event of the Nursing Rocks Concert Series features stunning performances and special guests. Proceeds support nursing scholarships and initiatives.",
      date: new Date("2023-10-21T20:00:00"),
      location: "New York, NY",
      artist_id: nursingRocksAllStars.id,
      image_url: "/assets/NRCS%20Phoenix%20Poster%201.PNG",
      start_time: "8:00 PM",
      doors_time: "7:00 PM",
      price: "$45-$120",
      is_featured: true,
      genre: "Rock",
      tickets_url: "#"
    }).returning();

    await db.insert(events).values({
      title: "Night Shift Nurses",
      subtitle: "Vital Signs Tour",
      description: "Join the Night Shift Nurses for an energetic rock performance celebrating the dedication and resilience of nurses working the overnight hours. Their authentic lyrics and powerful performances showcase the unique perspective of frontline healthcare workers.",
      date: new Date("2023-10-28T19:30:00"),
      location: "Chicago, IL",
      artist_id: nightShiftNurses.id,
      image_url: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      start_time: "7:30 PM",
      doors_time: "6:30 PM",
      price: "$35-$85",
      is_featured: false,
      genre: "Rock",
      tickets_url: "#"
    });

    await db.insert(events).values({
      title: "Nursing Beat",
      subtitle: "Healing Rhythms Tour",
      description: "Experience the soulful sounds of Nursing Beat as they blend R&B with stories from nursing. This group of ICU and ER nurses brings passion and artistry to their performances while celebrating the nursing profession.",
      date: new Date("2023-11-04T21:00:00"),
      location: "Los Angeles, CA",
      artist_id: nursingBeat.id,
      image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      start_time: "9:00 PM",
      doors_time: "8:00 PM",
      price: "$30-$65",
      is_featured: false,
      genre: "R&B",
      tickets_url: "#"
    });

    await db.insert(events).values({
      title: "Scrubs & Soul",
      subtitle: "Nursing Notes Benefit",
      description: "An evening of soulful jazz performed by nurses united by their passion for music and healing. Scrubs & Soul delivers powerful performances that celebrate nursing excellence while raising funds for nursing education initiatives.",
      date: new Date("2023-11-11T20:30:00"),
      location: "New York, NY",
      artist_id: scrubsAndSoul.id,
      image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      start_time: "8:30 PM",
      doors_time: "7:30 PM",
      price: "$40-$90",
      is_featured: false,
      genre: "Jazz",
      tickets_url: "#"
    });

    console.log("Creating gallery images...");
    // Create gallery images
    const imageUrls = [
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1508252592163-5d3c3c559387?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1442504028989-ab58b5f29a4a?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6a3?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1524012435847-659cf8c3d158?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1551696785-927d4ac2d35b?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=400&q=80",
    ];

    for (let i = 0; i < imageUrls.length; i++) {
      await db.insert(gallery).values({
        image_url: imageUrls[i],
        alt_text: "Nursing Rocks concert series",
        event_id: featuredEvent.id
      });
    }

    console.log("✅ Nursing Rocks seed completed successfully!");
  } catch (error) {
    console.error("❌ Error during Nursing Rocks seed:", error);
  }
}

// Run the seed function
seedNursingRocks();