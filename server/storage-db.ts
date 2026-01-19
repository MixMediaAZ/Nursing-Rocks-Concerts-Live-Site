import { eq, and, sql, desc } from "drizzle-orm";
import { db, pool } from "./db";
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
  ContactRequest, InsertContactRequest,
  AppSetting, InsertAppSetting,
  events, artists, gallery, subscribers,
  users, nurseLicenses, tickets,
  storeProducts, storeOrders, storeOrderItems,
  employers, jobListings, nurseProfiles,
  jobApplications, savedJobs, jobAlerts, contactRequests,
  appSettings
} from "@shared/schema";
import { IStorage } from "./storage";
import session from "express-session";
import connectPg from "connect-pg-simple";

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using 'any' to avoid type conflicts between libraries

  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'session'
    });
  }
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

  async getAllSubscribers(): Promise<Subscriber[]> {
    return await db.select().from(subscribers).orderBy(desc(subscribers.created_at));
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
    try {
      // Normalize email to lowercase for case-insensitive lookup
      const normalizedEmail = email.toLowerCase().trim();
      const [user] = await db
        .select()
        .from(users)
        .where(sql`LOWER(${users.email}) = LOWER(${normalizedEmail})`);
      return user;
    } catch (error) {
      console.error('[getUserByEmail] Database error:', error);
      throw error;
    }
  }
  
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async updateUserVerificationStatus(userId: number, isVerified: boolean): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ is_verified: isVerified })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    await db
      .delete(users)
      .where(eq(users.id, id));
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
  
  async getStoreProductByExternalId(source: string, externalId: string): Promise<StoreProduct | undefined> {
    const [product] = await db
      .select()
      .from(storeProducts)
      .where(
        and(
          eq(storeProducts.external_source, source),
          eq(storeProducts.external_id, externalId)
        )
      );
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
  
  async getStoreProductsBySource(source: string): Promise<StoreProduct[]> {
    return await db
      .select()
      .from(storeProducts)
      .where(eq(storeProducts.external_source, source));
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
    const now = new Date();
    const payload = {
      ...employer,
      company_name: employer.company_name ?? employer.name,
      user_id: userId,
      created_at: now,
      updated_at: now,
    };

    const [created] = await db.insert(employers).values(payload).returning();
    return created;
  }

  async getEmployerById(id: number): Promise<Employer | undefined> {
    const [employer] = await db
      .select()
      .from(employers)
      .where(eq(employers.id, id));
    return employer;
  }

  async getEmployerByUserId(userId: number): Promise<Employer | undefined> {
    const [employer] = await db
      .select()
      .from(employers)
      .where(eq(employers.user_id, userId));
    return employer;
  }

  async getAllEmployers(): Promise<Employer[]> {
    return await db
      .select()
      .from(employers)
      .orderBy(desc(employers.created_at));
  }

  async getVerifiedEmployers(): Promise<Employer[]> {
    return await db
      .select()
      .from(employers)
      .where(eq(employers.is_verified, true));
  }

  async updateEmployer(id: number, data: Partial<InsertEmployer>): Promise<Employer> {
    const [updated] = await db
      .update(employers)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(employers.id, id))
      .returning();
    return updated;
  }

  async verifyEmployer(id: number): Promise<Employer> {
    const [updated] = await db
      .update(employers)
      .set({
        is_verified: true,
        account_status: "active",
        updated_at: new Date(),
      })
      .where(eq(employers.id, id))
      .returning();
    return updated;
  }
  
  // Job Listings
  async createJobListing(jobListing: InsertJobListing, employerId: number): Promise<JobListing> {
    const now = new Date();
    const payload = {
      ...jobListing,
      employer_id: employerId,
      posted_date: now,
    };

    const [created] = await db.insert(jobListings).values(payload).returning();
    return created;
  }

  async getJobListingById(id: number): Promise<JobListing | undefined> {
    const [listing] = await db
      .select()
      .from(jobListings)
      .where(eq(jobListings.id, id));
    return listing;
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
    const conditions = [];

    if (filters?.employerId !== undefined) {
      conditions.push(eq(jobListings.employer_id, filters.employerId));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(jobListings.is_active, filters.isActive));
    }
    if (filters?.isFeatured !== undefined) {
      conditions.push(eq(jobListings.is_featured, filters.isFeatured));
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    return await db
      .select()
      .from(jobListings)
      .where(whereClause)
      .orderBy(desc(jobListings.posted_date));
  }

  async getEmployerJobListings(employerId: number): Promise<JobListing[]> {
    return await db
      .select()
      .from(jobListings)
      .where(eq(jobListings.employer_id, employerId))
      .orderBy(desc(jobListings.posted_date));
  }

  async getFeaturedJobListings(limit?: number): Promise<JobListing[]> {
    let query = db
      .select()
      .from(jobListings)
      .where(eq(jobListings.is_featured, true));

    if (limit) {
      query = query.limit(limit);
    }

    return await query;
  }

  async getRecentJobListings(limit?: number): Promise<JobListing[]> {
    let query = db
      .select()
      .from(jobListings)
      .orderBy(desc(jobListings.posted_date));

    if (limit) {
      query = query.limit(limit);
    }

    return await query;
  }

  async updateJobListing(id: number, data: Partial<InsertJobListing>): Promise<JobListing> {
    const [updated] = await db
      .update(jobListings)
      .set({
        ...data,
      })
      .where(eq(jobListings.id, id))
      .returning();
    return updated;
  }

  async incrementJobListingViews(id: number): Promise<JobListing> {
    const [updated] = await db
      .update(jobListings)
      .set({
        views_count: sql`${jobListings.views_count} + 1`,
      })
      .where(eq(jobListings.id, id))
      .returning();
    return updated;
  }

  async incrementJobApplicationsCount(id: number): Promise<JobListing> {
    const [updated] = await db
      .update(jobListings)
      .set({
        applications_count: sql`${jobListings.applications_count} + 1`,
      })
      .where(eq(jobListings.id, id))
      .returning();
    return updated;
  }

  // Contact Requests
  async createContactRequest(requestData: InsertContactRequest): Promise<ContactRequest> {
    const [created] = await db
      .insert(contactRequests)
      .values(requestData)
      .returning();
    return created;
  }

  async getContactRequestsByEmployer(employerId: number): Promise<ContactRequest[]> {
    return await db
      .select({
        id: contactRequests.id,
        application_id: contactRequests.application_id,
        employer_id: contactRequests.employer_id,
        requested_at: contactRequests.requested_at,
        status: contactRequests.status,
        reviewed_at: contactRequests.reviewed_at,
        reviewed_by: contactRequests.reviewed_by,
        admin_notes: contactRequests.admin_notes,
        denial_reason: contactRequests.denial_reason,
        expires_at: contactRequests.expires_at,
        contact_revealed_at: contactRequests.contact_revealed_at,
        application: jobApplications,
        applicant: users,
        job: jobListings,
      })
      .from(contactRequests)
      .leftJoin(jobApplications, eq(contactRequests.application_id, jobApplications.id))
      .leftJoin(users, eq(jobApplications.user_id, users.id))
      .leftJoin(jobListings, eq(jobApplications.job_id, jobListings.id))
      .where(eq(contactRequests.employer_id, employerId))
      .orderBy(desc(contactRequests.requested_at));
  }

  async getContactRequestById(id: number): Promise<ContactRequest | undefined> {
    const [request] = await db
      .select()
      .from(contactRequests)
      .where(eq(contactRequests.id, id));
    return request;
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
    const now = new Date();
    const [created] = await db
      .insert(jobApplications)
      .values({
        ...application,
        user_id: userId,
        job_id: jobId,
        application_date: now,
        last_updated: now,
      })
      .returning();
    return created;
  }

  async getJobApplicationById(id: number): Promise<JobApplication | undefined> {
    const [app] = await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.id, id));
    return app;
  }

  async getJobApplicationsByUserId(userId: number): Promise<JobApplication[]> {
    return await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.user_id, userId))
      .orderBy(desc(jobApplications.application_date));
  }

  async getJobApplicationsByJobId(jobId: number): Promise<JobApplication[]> {
    return await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.job_id, jobId))
      .orderBy(desc(jobApplications.application_date));
  }

  async updateJobApplicationStatus(id: number, status: string, notes?: string): Promise<JobApplication> {
    const [updated] = await db
      .update(jobApplications)
      .set({
        status,
        employer_notes: notes,
        last_updated: new Date(),
      })
      .where(eq(jobApplications.id, id))
      .returning();
    return updated;
  }

  async withdrawJobApplication(id: number): Promise<JobApplication> {
    const [updated] = await db
      .update(jobApplications)
      .set({
        is_withdrawn: true,
        status: "withdrawn",
        last_updated: new Date(),
      })
      .where(eq(jobApplications.id, id))
      .returning();
    return updated;
  }
  
  // Saved Jobs
  async saveJob(userId: number, jobId: number, notes?: string): Promise<SavedJob> {
    const [saved] = await db
      .insert(savedJobs)
      .values({
        user_id: userId,
        job_id: jobId,
        notes,
      })
      .returning();
    return saved;
  }

  async unsaveJob(userId: number, jobId: number): Promise<void> {
    await db
      .delete(savedJobs)
      .where(
        and(
          eq(savedJobs.user_id, userId),
          eq(savedJobs.job_id, jobId)
        )
      );
  }

  async getSavedJobsByUserId(userId: number): Promise<SavedJob[]> {
    return await db
      .select()
      .from(savedJobs)
      .where(eq(savedJobs.user_id, userId))
      .orderBy(desc(savedJobs.saved_date));
  }
  
  // Job Alerts
  async createJobAlert(alert: InsertJobAlert, userId: number): Promise<JobAlert> {
    const [created] = await db
      .insert(jobAlerts)
      .values({
        ...alert,
        user_id: userId,
      })
      .returning();
    return created;
  }

  async getJobAlertsByUserId(userId: number): Promise<JobAlert[]> {
    return await db
      .select()
      .from(jobAlerts)
      .where(eq(jobAlerts.user_id, userId))
      .orderBy(desc(jobAlerts.created_at));
  }

  async updateJobAlert(id: number, data: Partial<InsertJobAlert>): Promise<JobAlert> {
    const [updated] = await db
      .update(jobAlerts)
      .set(data)
      .where(eq(jobAlerts.id, id))
      .returning();
    return updated;
  }

  async deleteJobAlert(id: number): Promise<void> {
    await db
      .delete(jobAlerts)
      .where(eq(jobAlerts.id, id));
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