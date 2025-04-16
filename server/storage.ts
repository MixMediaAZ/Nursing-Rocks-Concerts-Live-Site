import { 
  Event, InsertEvent, 
  Artist, InsertArtist, 
  Venue, InsertVenue, 
  Gallery, InsertGallery, 
  Subscriber, InsertSubscriber,
  events, artists, venues, gallery, subscribers
} from "@shared/schema";

export interface IStorage {
  // Events
  getAllEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  getFeaturedEvent(): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  
  // Artists
  getAllArtists(): Promise<Artist[]>;
  getArtist(id: number): Promise<Artist | undefined>;
  createArtist(artist: InsertArtist): Promise<Artist>;
  
  // Venues
  getAllVenues(): Promise<Venue[]>;
  getVenue(id: number): Promise<Venue | undefined>;
  createVenue(venue: InsertVenue): Promise<Venue>;
  
  // Gallery
  getAllGalleryImages(): Promise<Gallery[]>;
  getEventGalleryImages(eventId: number): Promise<Gallery[]>;
  createGalleryImage(image: InsertGallery): Promise<Gallery>;
  
  // Subscribers
  createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber>;
  getSubscriberByEmail(email: string): Promise<Subscriber | undefined>;
}

export class MemStorage implements IStorage {
  private events: Map<number, Event>;
  private artists: Map<number, Artist>;
  private venues: Map<number, Venue>;
  private gallery: Map<number, Gallery>;
  private subscribers: Map<number, Subscriber>;
  
  private eventId: number;
  private artistId: number;
  private venueId: number;
  private galleryId: number;
  private subscriberId: number;
  
  constructor() {
    this.events = new Map();
    this.artists = new Map();
    this.venues = new Map();
    this.gallery = new Map();
    this.subscribers = new Map();
    
    this.eventId = 1;
    this.artistId = 1;
    this.venueId = 1;
    this.galleryId = 1;
    this.subscriberId = 1;
    
    // Initialize with sample data
    this.initSampleData();
  }
  
  // Events
  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }
  
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }
  
  async getFeaturedEvent(): Promise<Event | undefined> {
    return Array.from(this.events.values()).find(event => event.is_featured);
  }
  
  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.eventId++;
    const event: Event = { ...insertEvent, id };
    this.events.set(id, event);
    return event;
  }
  
  // Artists
  async getAllArtists(): Promise<Artist[]> {
    return Array.from(this.artists.values());
  }
  
  async getArtist(id: number): Promise<Artist | undefined> {
    return this.artists.get(id);
  }
  
  async createArtist(insertArtist: InsertArtist): Promise<Artist> {
    const id = this.artistId++;
    const artist: Artist = { ...insertArtist, id };
    this.artists.set(id, artist);
    return artist;
  }
  
  // Venues
  async getAllVenues(): Promise<Venue[]> {
    return Array.from(this.venues.values());
  }
  
  async getVenue(id: number): Promise<Venue | undefined> {
    return this.venues.get(id);
  }
  
  async createVenue(insertVenue: InsertVenue): Promise<Venue> {
    const id = this.venueId++;
    const venue: Venue = { ...insertVenue, id };
    this.venues.set(id, venue);
    return venue;
  }
  
  // Gallery
  async getAllGalleryImages(): Promise<Gallery[]> {
    return Array.from(this.gallery.values());
  }
  
  async getEventGalleryImages(eventId: number): Promise<Gallery[]> {
    return Array.from(this.gallery.values()).filter(
      image => image.event_id === eventId,
    );
  }
  
  async createGalleryImage(insertImage: InsertGallery): Promise<Gallery> {
    const id = this.galleryId++;
    const image: Gallery = { ...insertImage, id };
    this.gallery.set(id, image);
    return image;
  }
  
  // Subscribers
  async createSubscriber(insertSubscriber: InsertSubscriber): Promise<Subscriber> {
    const id = this.subscriberId++;
    const subscriber: Subscriber = { 
      ...insertSubscriber, 
      id, 
      created_at: new Date() 
    };
    this.subscribers.set(id, subscriber);
    return subscriber;
  }
  
  async getSubscriberByEmail(email: string): Promise<Subscriber | undefined> {
    return Array.from(this.subscribers.values()).find(
      subscriber => subscriber.email === email,
    );
  }
  
  // Initialize with sample data
  private initSampleData() {
    // Create Artists
    const astralWaves = this.setupArtist({
      name: "The Astral Waves",
      bio: "Born from the fusion of classical rock influences and modern electronic sounds, The Astral Waves have been redefining the music landscape since 2015. Their unique sound, characterized by haunting vocals and ethereal guitar riffs, has earned them critical acclaim and a dedicated global following.",
      image_url: "https://images.unsplash.com/photo-1499364615650-ec38552f4f34?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=600&q=80",
      genre: "Alternative Rock, Psychedelic, Electronic",
      latest_album: "Cosmic Harmony (2023)",
      social_links: { spotify: "#", apple: "#", youtube: "#", instagram: "#" },
      featured_song: "Interstellar Dreams",
      song_duration: "3:45"
    });
    
    const neonDreams = this.setupArtist({
      name: "Neon Dreams",
      bio: "Neon Dreams blends synth-pop with modern electronic beats to create a nostalgic yet fresh sound that has captivated audiences worldwide.",
      image_url: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      genre: "Pop, Electronic",
      latest_album: "Synth Revival (2023)",
      social_links: { spotify: "#", apple: "#", youtube: "#", instagram: "#" },
      featured_song: "Neon Lights",
      song_duration: "3:22"
    });
    
    const violetEchoes = this.setupArtist({
      name: "Violet Echoes",
      bio: "Violet Echoes creates dreamy, atmospheric indie music that transports listeners to another dimension. Their introspective lyrics and haunting melodies have garnered a dedicated following.",
      image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      genre: "Indie, Dream Pop",
      latest_album: "Midnight Reverie (2023)",
      social_links: { spotify: "#", apple: "#", youtube: "#", instagram: "#" },
      featured_song: "Twilight Whispers",
      song_duration: "4:15"
    });
    
    const emberJazz = this.setupArtist({
      name: "Ember Jazz Collective",
      bio: "The Ember Jazz Collective brings together accomplished jazz musicians to create sophisticated, soulful compositions that push the boundaries of contemporary jazz.",
      image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      genre: "Jazz, Fusion",
      latest_album: "Autumn Sessions (2023)",
      social_links: { spotify: "#", apple: "#", youtube: "#", instagram: "#" },
      featured_song: "Crimson Leaves",
      song_duration: "5:30"
    });
    
    // Create Venues
    const riversideArena = this.setupVenue({
      name: "Riverside Arena",
      location: "New York, NY",
      capacity: 1800,
      image_url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      description: "A state-of-the-art venue featuring exceptional acoustics and an intimate setting despite its size. Perfect for rock and alternative shows.",
      rating: 5,
      seating_chart_url: "#"
    });
    
    const metroHall = this.setupVenue({
      name: "Metro Hall",
      location: "Chicago, IL",
      capacity: 1100,
      image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      description: "Historic venue with amazing ambiance, known for its perfect sound engineering. Popular for indie and pop performances.",
      rating: 4,
      seating_chart_url: "#"
    });
    
    const echoLounge = this.setupVenue({
      name: "The Echo Lounge",
      location: "Los Angeles, CA",
      capacity: 750,
      image_url: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      description: "Intimate venue with incredible atmosphere, perfect for discovering new artists. Known for showcasing up-and-coming indie talent.",
      rating: 4,
      seating_chart_url: "#"
    });
    
    const blueNote = this.setupVenue({
      name: "Blue Note",
      location: "San Francisco, CA",
      capacity: 500,
      image_url: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      description: "Legendary jazz venue with intimate seating and superior acoustics. The perfect place to experience world-class jazz performances.",
      rating: 5,
      seating_chart_url: "#"
    });
    
    // Create Events
    const oct21Event = this.setupEvent({
      title: "The Astral Waves",
      subtitle: "Cosmic Harmony Tour",
      description: "Experience the ultimate live show with The Astral Waves, featuring special guests The Lunar Tides",
      date: new Date("2023-10-21T20:00:00"),
      venue_id: riversideArena.id,
      artist_id: astralWaves.id,
      image_url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      start_time: "8:00 PM",
      doors_time: "7:00 PM",
      price: "$45-$120",
      is_featured: true,
      genre: "Rock",
      tickets_url: "#"
    });
    
    const oct28Event = this.setupEvent({
      title: "Neon Dreams",
      subtitle: "Synth Revival",
      description: "Step into a world of vibrant synth-pop and mesmerizing visuals with Neon Dreams' groundbreaking show",
      date: new Date("2023-10-28T19:30:00"),
      venue_id: metroHall.id,
      artist_id: neonDreams.id,
      image_url: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      start_time: "7:30 PM",
      doors_time: "6:30 PM",
      price: "$35-$85",
      is_featured: false,
      genre: "Pop",
      tickets_url: "#"
    });
    
    const nov4Event = this.setupEvent({
      title: "Violet Echoes",
      subtitle: "Midnight Reverie",
      description: "Let Violet Echoes transport you through their ethereal soundscapes and captivating performances",
      date: new Date("2023-11-04T21:00:00"),
      venue_id: echoLounge.id,
      artist_id: violetEchoes.id,
      image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      start_time: "9:00 PM",
      doors_time: "8:00 PM",
      price: "$30-$65",
      is_featured: false,
      genre: "Indie",
      tickets_url: "#"
    });
    
    const nov11Event = this.setupEvent({
      title: "Ember Jazz Collective",
      subtitle: "Autumn Sessions",
      description: "An evening of sophisticated jazz improvisations and soulful melodies with the acclaimed Ember Jazz Collective",
      date: new Date("2023-11-11T20:30:00"),
      venue_id: blueNote.id,
      artist_id: emberJazz.id,
      image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      start_time: "8:30 PM",
      doors_time: "7:30 PM",
      price: "$40-$90",
      is_featured: false,
      genre: "Jazz",
      tickets_url: "#"
    });
    
    // Setup Gallery
    [
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1508252592163-5d3c3c559387?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1442504028989-ab58b5f29a4a?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6a3?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1524012435847-659cf8c3d158?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1551696785-927d4ac2d35b?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=400&q=80",
    ].forEach((url, index) => {
      this.setupGalleryImage({
        image_url: url,
        alt_text: "Concert moment",
        event_id: index % 2 === 0 ? oct21Event.id : oct28Event.id
      });
    });
  }
  
  private setupArtist(artist: InsertArtist): Artist {
    const id = this.artistId++;
    const newArtist: Artist = { ...artist, id };
    this.artists.set(id, newArtist);
    return newArtist;
  }
  
  private setupVenue(venue: InsertVenue): Venue {
    const id = this.venueId++;
    const newVenue: Venue = { ...venue, id };
    this.venues.set(id, newVenue);
    return newVenue;
  }
  
  private setupEvent(event: InsertEvent): Event {
    const id = this.eventId++;
    const newEvent: Event = { ...event, id };
    this.events.set(id, newEvent);
    return newEvent;
  }
  
  private setupGalleryImage(image: InsertGallery): Gallery {
    const id = this.galleryId++;
    const newImage: Gallery = { ...image, id };
    this.gallery.set(id, newImage);
    return newImage;
  }
}

export const storage = new MemStorage();
