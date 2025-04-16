import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { 
  Event, InsertEvent, 
  Artist, InsertArtist, 
  Venue, InsertVenue, 
  Gallery, InsertGallery, 
  Subscriber, InsertSubscriber,
  User, InsertUser,
  NurseLicense, InsertNurseLicense,
  Ticket, InsertTicket,
  events, artists, venues, gallery, subscribers,
  users, nurseLicenses, tickets
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
  
  // User Management
  async createUser(user: InsertUser, passwordHash: string): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values({
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        password_hash: passwordHash,
        is_verified: false
      })
      .returning();
    return newUser;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }
  
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }
  
  async updateUserVerificationStatus(userId: number, isVerified: boolean): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ is_verified: isVerified })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
  
  // Nurse License Verification
  async createNurseLicense(license: InsertNurseLicense, userId: number): Promise<NurseLicense> {
    const [newLicense] = await db
      .insert(nurseLicenses)
      .values({
        user_id: userId,
        license_number: license.license_number,
        state: license.state,
        expiration_date: license.expiration_date,
        status: 'pending'
      })
      .returning();
    return newLicense;
  }
  
  async getNurseLicensesByUserId(userId: number): Promise<NurseLicense[]> {
    return await db
      .select()
      .from(nurseLicenses)
      .where(eq(nurseLicenses.user_id, userId));
  }
  
  async getNurseLicenseById(id: number): Promise<NurseLicense | undefined> {
    const [license] = await db
      .select()
      .from(nurseLicenses)
      .where(eq(nurseLicenses.id, id));
    return license;
  }
  
  async updateNurseLicenseVerification(
    licenseId: number, 
    status: string, 
    verificationDate: Date, 
    verificationSource: string,
    verificationResult: any
  ): Promise<NurseLicense> {
    const [updatedLicense] = await db
      .update(nurseLicenses)
      .set({
        status,
        verification_date: verificationDate,
        verification_source: verificationSource,
        verification_result: verificationResult
      })
      .where(eq(nurseLicenses.id, licenseId))
      .returning();
    return updatedLicense;
  }
  
  // Ticket Management
  async createTicket(
    ticket: InsertTicket, 
    userId: number, 
    eventId: number, 
    ticketCode: string
  ): Promise<Ticket> {
    const [newTicket] = await db
      .insert(tickets)
      .values({
        user_id: userId,
        event_id: eventId,
        ticket_type: ticket.ticket_type,
        price: ticket.price,
        ticket_code: ticketCode,
        is_used: false
      })
      .returning();
    return newTicket;
  }
  
  async getTicketsByUserId(userId: number): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .where(eq(tickets.user_id, userId));
  }
  
  async getTicketByCode(ticketCode: string): Promise<Ticket | undefined> {
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.ticket_code, ticketCode));
    return ticket;
  }
  
  async markTicketAsUsed(ticketId: number): Promise<Ticket> {
    const [updatedTicket] = await db
      .update(tickets)
      .set({ is_used: true })
      .where(eq(tickets.id, ticketId))
      .returning();
    return updatedTicket;
  }
}