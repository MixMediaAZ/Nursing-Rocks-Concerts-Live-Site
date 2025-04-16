import { eq } from "drizzle-orm";
import { db } from "./db";
import { 
  Event, InsertEvent, 
  Artist, InsertArtist, 
  Venue, InsertVenue, 
  Gallery, InsertGallery, 
  Subscriber, InsertSubscriber,
  events, artists, venues, gallery, subscribers
} from "@shared/schema";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Events
  async getAllEvents(): Promise<Event[]> {
    return await db.select().from(events);
  }
  
  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }
  
  async getFeaturedEvent(): Promise<Event | undefined> {
    const [featuredEvent] = await db
      .select()
      .from(events)
      .where(eq(events.is_featured, true));
    return featuredEvent;
  }
  
  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values(insertEvent)
      .returning();
    return event;
  }
  
  // Artists
  async getAllArtists(): Promise<Artist[]> {
    return await db.select().from(artists);
  }
  
  async getArtist(id: number): Promise<Artist | undefined> {
    const [artist] = await db.select().from(artists).where(eq(artists.id, id));
    return artist;
  }
  
  async createArtist(insertArtist: InsertArtist): Promise<Artist> {
    const [artist] = await db
      .insert(artists)
      .values(insertArtist)
      .returning();
    return artist;
  }
  
  // Venues
  async getAllVenues(): Promise<Venue[]> {
    return await db.select().from(venues);
  }
  
  async getVenue(id: number): Promise<Venue | undefined> {
    const [venue] = await db.select().from(venues).where(eq(venues.id, id));
    return venue;
  }
  
  async createVenue(insertVenue: InsertVenue): Promise<Venue> {
    const [venue] = await db
      .insert(venues)
      .values(insertVenue)
      .returning();
    return venue;
  }
  
  // Gallery
  async getAllGalleryImages(): Promise<Gallery[]> {
    return await db.select().from(gallery);
  }
  
  async getEventGalleryImages(eventId: number): Promise<Gallery[]> {
    return await db
      .select()
      .from(gallery)
      .where(eq(gallery.event_id, eventId));
  }
  
  async createGalleryImage(insertImage: InsertGallery): Promise<Gallery> {
    const [image] = await db
      .insert(gallery)
      .values(insertImage)
      .returning();
    return image;
  }
  
  // Subscribers
  async createSubscriber(insertSubscriber: InsertSubscriber): Promise<Subscriber> {
    const [subscriber] = await db
      .insert(subscribers)
      .values(insertSubscriber)
      .returning();
    return subscriber;
  }
  
  async getSubscriberByEmail(email: string): Promise<Subscriber | undefined> {
    const [subscriber] = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, email));
    return subscriber;
  }
}