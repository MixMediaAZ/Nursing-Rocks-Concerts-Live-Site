import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { 
  Event, InsertEvent, 
  Artist, InsertArtist, 
  Gallery, InsertGallery, 
  Subscriber, InsertSubscriber,
  User, InsertUser,
  NurseLicense, InsertNurseLicense,
  Ticket, InsertTicket,
  StoreProduct, InsertStoreProduct,
  StoreOrder, InsertStoreOrder,
  StoreOrderItem, InsertStoreOrderItem,
  Employer, InsertEmployer,
  JobListing, InsertJobListing,
  NurseProfile, InsertNurseProfile,
  JobApplication, InsertJobApplication,
  SavedJob, InsertSavedJob,
  JobAlert, InsertJobAlert,
  AppSetting, InsertAppSetting,
  events, artists, gallery, subscribers,
  users, nurseLicenses, tickets,
  storeProducts, storeOrders, storeOrderItems,
  employers, jobListings, nurseProfiles,
  jobApplications, savedJobs, jobAlerts,
  appSettings
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
  
  // Venue methods removed
  
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

  // ========== STORE FUNCTIONS ==========
  
  // Store Products
  async getAllStoreProducts(): Promise<StoreProduct[]> {
    return await db.select().from(storeProducts);
  }
  
  async getStoreProductById(id: number): Promise<StoreProduct | undefined> {
    const [product] = await db
      .select()
      .from(storeProducts)
      .where(eq(storeProducts.id, id));
    return product;
  }
  
  async getFeaturedStoreProducts(limit?: number): Promise<StoreProduct[]> {
    const products = await db
      .select()
      .from(storeProducts)
      .where(eq(storeProducts.is_featured, true));
    
    return limit ? products.slice(0, limit) : products;
  }
  
  async getStoreProductsByCategory(category: string): Promise<StoreProduct[]> {
    return await db
      .select()
      .from(storeProducts)
      .where(eq(storeProducts.category, category));
  }
  
  async createStoreProduct(product: InsertStoreProduct): Promise<StoreProduct> {
    const [newProduct] = await db
      .insert(storeProducts)
      .values(product)
      .returning();
    return newProduct;
  }
  
  async updateStoreProduct(id: number, data: Partial<InsertStoreProduct>): Promise<StoreProduct> {
    const [updatedProduct] = await db
      .update(storeProducts)
      .set(data)
      .where(eq(storeProducts.id, id))
      .returning();
    return updatedProduct;
  }
  
  async deleteStoreProduct(id: number): Promise<void> {
    await db
      .delete(storeProducts)
      .where(eq(storeProducts.id, id));
  }
  
  // Store Orders
  async createStoreOrder(order: InsertStoreOrder, items: InsertStoreOrderItem[]): Promise<StoreOrder> {
    // Insert the order first
    const [newOrder] = await db
      .insert(storeOrders)
      .values(order)
      .returning();
    
    // Then insert all order items
    const orderItems = items.map(item => ({
      ...item,
      order_id: newOrder.id
    }));
    
    await db
      .insert(storeOrderItems)
      .values(orderItems);
    
    return newOrder;
  }
  
  async getStoreOrderById(id: number): Promise<StoreOrder | undefined> {
    const [order] = await db
      .select()
      .from(storeOrders)
      .where(eq(storeOrders.id, id));
    return order;
  }
  
  async getStoreOrdersByUserId(userId: number): Promise<StoreOrder[]> {
    return await db
      .select()
      .from(storeOrders)
      .where(eq(storeOrders.user_id, userId));
  }
  
  async updateStoreOrderStatus(id: number, status: string): Promise<StoreOrder> {
    const [updatedOrder] = await db
      .update(storeOrders)
      .set({ status })
      .where(eq(storeOrders.id, id))
      .returning();
    return updatedOrder;
  }
  
  async updateStoreOrderPaymentStatus(id: number, paymentStatus: string): Promise<StoreOrder> {
    const [updatedOrder] = await db
      .update(storeOrders)
      .set({ payment_status: paymentStatus })
      .where(eq(storeOrders.id, id))
      .returning();
    return updatedOrder;
  }
  
  // Store Order Items
  async getStoreOrderItemsByOrderId(orderId: number): Promise<StoreOrderItem[]> {
    return await db
      .select()
      .from(storeOrderItems)
      .where(eq(storeOrderItems.order_id, orderId));
  }

  // ========== JOB BOARD FUNCTIONS ==========
  
  // Employer Management
  async createEmployer(employer: InsertEmployer, userId: number): Promise<Employer> {
    throw new Error("Method not implemented.");
  }

  async getEmployerById(id: number): Promise<Employer | undefined> {
    throw new Error("Method not implemented.");
  }

  async getEmployerByUserId(userId: number): Promise<Employer | undefined> {
    throw new Error("Method not implemented.");
  }

  async getAllEmployers(): Promise<Employer[]> {
    throw new Error("Method not implemented.");
  }

  async getVerifiedEmployers(): Promise<Employer[]> {
    throw new Error("Method not implemented.");
  }

  async updateEmployer(id: number, data: Partial<InsertEmployer>): Promise<Employer> {
    throw new Error("Method not implemented.");
  }

  async verifyEmployer(id: number): Promise<Employer> {
    throw new Error("Method not implemented.");
  }
  
  // Job Listings
  async createJobListing(jobListing: InsertJobListing, employerId: number): Promise<JobListing> {
    throw new Error("Method not implemented.");
  }

  async getJobListingById(id: number): Promise<JobListing | undefined> {
    throw new Error("Method not implemented.");
  }

  async getAllJobListings(filters?: {
    specialty?: string | string[];
    location?: string | string[];
    jobType?: string | string[];
    experienceLevel?: string | string[];
    salaryMin?: number;
    keywords?: string;
    employerId?: number;
    isActive?: boolean;
    isFeatured?: boolean;
  }): Promise<JobListing[]> {
    throw new Error("Method not implemented.");
  }

  async getFeaturedJobListings(limit?: number): Promise<JobListing[]> {
    throw new Error("Method not implemented.");
  }

  async getRecentJobListings(limit?: number): Promise<JobListing[]> {
    throw new Error("Method not implemented.");
  }

  async updateJobListing(id: number, data: Partial<InsertJobListing>): Promise<JobListing> {
    throw new Error("Method not implemented.");
  }

  async incrementJobListingViews(id: number): Promise<JobListing> {
    throw new Error("Method not implemented.");
  }

  async incrementJobApplicationsCount(id: number): Promise<JobListing> {
    throw new Error("Method not implemented.");
  }
  
  // Nurse Profiles
  async createNurseProfile(profile: InsertNurseProfile, userId: number): Promise<NurseProfile> {
    throw new Error("Method not implemented.");
  }

  async getNurseProfileByUserId(userId: number): Promise<NurseProfile | undefined> {
    throw new Error("Method not implemented.");
  }

  async getNurseProfileById(id: number): Promise<NurseProfile | undefined> {
    throw new Error("Method not implemented.");
  }

  async updateNurseProfile(id: number, data: Partial<InsertNurseProfile>): Promise<NurseProfile> {
    throw new Error("Method not implemented.");
  }

  async getPublicNurseProfiles(filters?: {
    specialties?: string | string[];
    skills?: string | string[];
    yearsOfExperience?: number;
    preferredLocations?: string | string[];
    preferredShift?: string;
  }): Promise<NurseProfile[]> {
    throw new Error("Method not implemented.");
  }
  
  // Job Applications
  async createJobApplication(application: InsertJobApplication, userId: number, jobId: number): Promise<JobApplication> {
    throw new Error("Method not implemented.");
  }

  async getJobApplicationById(id: number): Promise<JobApplication | undefined> {
    throw new Error("Method not implemented.");
  }

  async getJobApplicationsByUserId(userId: number): Promise<JobApplication[]> {
    throw new Error("Method not implemented.");
  }

  async getJobApplicationsByJobId(jobId: number): Promise<JobApplication[]> {
    throw new Error("Method not implemented.");
  }

  async updateJobApplicationStatus(id: number, status: string, notes?: string): Promise<JobApplication> {
    throw new Error("Method not implemented.");
  }

  async withdrawJobApplication(id: number): Promise<JobApplication> {
    throw new Error("Method not implemented.");
  }
  
  // Saved Jobs
  async saveJob(userId: number, jobId: number, notes?: string): Promise<SavedJob> {
    throw new Error("Method not implemented.");
  }

  async unsaveJob(userId: number, jobId: number): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async getSavedJobsByUserId(userId: number): Promise<SavedJob[]> {
    throw new Error("Method not implemented.");
  }
  
  // Job Alerts
  async createJobAlert(alert: InsertJobAlert, userId: number): Promise<JobAlert> {
    throw new Error("Method not implemented.");
  }

  async getJobAlertsByUserId(userId: number): Promise<JobAlert[]> {
    throw new Error("Method not implemented.");
  }

  async updateJobAlert(id: number, data: Partial<InsertJobAlert>): Promise<JobAlert> {
    throw new Error("Method not implemented.");
  }

  async deleteJobAlert(id: number): Promise<void> {
    throw new Error("Method not implemented.");
  }
  
  // Job Search & Recommendations
  async searchJobs(query: string, filters?: any): Promise<JobListing[]> {
    throw new Error("Method not implemented.");
  }

  async getRecommendedJobs(userId: number, limit?: number): Promise<JobListing[]> {
    throw new Error("Method not implemented.");
  }

  async getSimilarJobs(jobId: number, limit?: number): Promise<JobListing[]> {
    throw new Error("Method not implemented.");
  }
  
  // ========== APP SETTINGS ==========
  
  async getAppSettingByKey(key: string): Promise<AppSetting | undefined> {
    const [setting] = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, key));
    return setting;
  }
  
  async getAllAppSettings(): Promise<AppSetting[]> {
    return await db.select().from(appSettings);
  }
  
  async createOrUpdateAppSetting(
    key: string, 
    value: string, 
    description?: string, 
    isSensitive: boolean = false
  ): Promise<AppSetting> {
    const now = new Date();
    
    // Check if setting already exists
    const existingSetting = await this.getAppSettingByKey(key);
    
    if (existingSetting) {
      // Update existing setting
      const [updatedSetting] = await db
        .update(appSettings)
        .set({
          value,
          description: description || existingSetting.description,
          is_sensitive: isSensitive !== undefined ? isSensitive : existingSetting.is_sensitive,
          updated_at: now
        })
        .where(eq(appSettings.key, key))
        .returning();
      
      return updatedSetting;
    } else {
      // Create new setting
      const [newSetting] = await db
        .insert(appSettings)
        .values({
          key,
          value,
          description: description || null,
          is_sensitive: isSensitive,
          created_at: now,
          updated_at: now
        })
        .returning();
      
      return newSetting;
    }
  }
  
  async deleteAppSetting(key: string): Promise<void> {
    await db
      .delete(appSettings)
      .where(eq(appSettings.key, key));
  }
}