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
      name: "The Healing Harmonies",
      bio: "Founded by a group of musically talented nurses, The Healing Harmonies combine powerful vocals with uplifting melodies. Since 2015, these healthcare professionals have been using music to inspire and support both patients and fellow medical workers, earning acclaim for their moving performances.",
      image_url: "https://images.unsplash.com/photo-1499364615650-ec38552f4f34?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=600&q=80",
      genre: "Pop Rock, Inspirational",
      latest_album: "Heroes in Scrubs (2023)",
      social_links: { spotify: "#", apple: "#", youtube: "#", instagram: "#" },
      featured_song: "Healing Hands",
      song_duration: "3:45"
    });
    
    const neonDreams = this.setupArtist({
      name: "Vital Signs",
      bio: "Vital Signs is a dynamic band composed of physicians and medical students who bring infectious energy to their performances. Their music combines medical themes with upbeat melodies, creating anthems of hope and resilience.",
      image_url: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      genre: "Pop, Electronic",
      latest_album: "Code Blue (2023)",
      social_links: { spotify: "#", apple: "#", youtube: "#", instagram: "#" },
      featured_song: "Frontline Heroes",
      song_duration: "3:22"
    });
    
    const violetEchoes = this.setupArtist({
      name: "Night Shift",
      bio: "Night Shift brings together ER nurses who find solace in music after long shifts. Their soul-stirring melodies and heartfelt lyrics reflect their experiences on the frontlines of healthcare, resonating deeply with audiences everywhere.",
      image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      genre: "Indie, Folk",
      latest_album: "After Hours (2023)",
      social_links: { spotify: "#", apple: "#", youtube: "#", instagram: "#" },
      featured_song: "Sacred Silence",
      song_duration: "4:15"
    });
    
    const emberJazz = this.setupArtist({
      name: "The Caregivers Collective",
      bio: "The Caregivers Collective unites healthcare workers from diverse specialties who share a passion for jazz. Their soulful compositions celebrate the art of caregiving while raising awareness about healthcare issues.",
      image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      genre: "Jazz, Soul",
      latest_album: "Compassionate Care (2023)",
      social_links: { spotify: "#", apple: "#", youtube: "#", instagram: "#" },
      featured_song: "Healing Rhythms",
      song_duration: "5:30"
    });
    
    // Create Venues
    const riversideArena = this.setupVenue({
      name: "City Medical Center Auditorium",
      location: "New York, NY",
      capacity: 1800,
      image_url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      description: "This modern auditorium within NYC's largest hospital has been transformed into a concert venue to celebrate healthcare workers. Features exceptional acoustics and comfortable seating.",
      rating: 5,
      seating_chart_url: "#"
    });
    
    const metroHall = this.setupVenue({
      name: "Nurses Memorial Hall",
      location: "Chicago, IL",
      capacity: 1100,
      image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      description: "Historic venue dedicated to the nursing profession with amazing ambiance. Recently renovated to provide perfect sound engineering while maintaining its historic charm.",
      rating: 4,
      seating_chart_url: "#"
    });
    
    const echoLounge = this.setupVenue({
      name: "The Healing Center",
      location: "Los Angeles, CA",
      capacity: 750,
      image_url: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      description: "An intimate venue created by healthcare professionals to showcase medical talent. The space doubles as a wellness center during the day and transforms into a concert venue at night.",
      rating: 4,
      seating_chart_url: "#"
    });
    
    const blueNote = this.setupVenue({
      name: "Grace Medical Theater",
      location: "San Francisco, CA",
      capacity: 500,
      image_url: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      description: "Once a medical lecture hall, this intimate venue now hosts concerts by healthcare professionals with a portion of proceeds benefiting medical research and education.",
      rating: 5,
      seating_chart_url: "#"
    });
    
    // Create Events
    const oct21Event = this.setupEvent({
      title: "The Healing Harmonies",
      subtitle: "Heroes in Scrubs Tour",
      description: "Experience a powerful night of music performed by nurses who are using their musical talents to inspire hope and healing. Proceeds support the Healthcare Workers Foundation.",
      date: new Date("2023-10-21T20:00:00"),
      venue_id: riversideArena.id,
      artist_id: astralWaves.id,
      image_url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      start_time: "8:00 PM",
      doors_time: "7:00 PM",
      price: "$45-$120",
      is_featured: true,
      genre: "Inspirational",
      tickets_url: "#"
    });
    
    const oct28Event = this.setupEvent({
      title: "Vital Signs",
      subtitle: "Frontline Heroes Tribute",
      description: "Join this dynamic group of physicians and medical students for an energetic performance celebrating the resilience of healthcare workers everywhere.",
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
      title: "Night Shift",
      subtitle: "After Hours Tour",
      description: "ER nurses by day, musicians by night - experience the soulful melodies inspired by their frontline experiences in healthcare during this intimate performance.",
      date: new Date("2023-11-04T21:00:00"),
      venue_id: echoLounge.id,
      artist_id: violetEchoes.id,
      image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      start_time: "9:00 PM",
      doors_time: "8:00 PM",
      price: "$30-$65",
      is_featured: false,
      genre: "Folk",
      tickets_url: "#"
    });
    
    const nov11Event = this.setupEvent({
      title: "The Caregivers Collective",
      subtitle: "Healing Rhythms Benefit",
      description: "An evening of soulful jazz performed by healthcare professionals united by their passion for music and healing. Ticket sales benefit nursing scholarship programs.",
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
        alt_text: "Healthcare heroes concert",
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
