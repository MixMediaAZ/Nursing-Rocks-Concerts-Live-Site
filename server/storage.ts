import { 
  Event, InsertEvent, 
  Artist, InsertArtist, 
  Venue, InsertVenue, 
  Gallery, InsertGallery, 
  Subscriber, InsertSubscriber,
  User, InsertUser,
  NurseLicense, InsertNurseLicense,
  Ticket, InsertTicket,
  Employer, InsertEmployer,
  JobListing, InsertJobListing,
  NurseProfile, InsertNurseProfile,
  JobApplication, InsertJobApplication,
  SavedJob, InsertSavedJob,
  JobAlert, InsertJobAlert,
  StoreProduct, InsertStoreProduct,
  StoreOrder, InsertStoreOrder,
  StoreOrderItem, InsertStoreOrderItem,
  events, artists, venues, gallery, subscribers,
  users, nurseLicenses, tickets,
  employers, jobListings, nurseProfiles, 
  jobApplications, savedJobs, jobAlerts,
  storeProducts, storeOrders, storeOrderItems
} from "@shared/schema";
import { DatabaseStorage } from "./storage-db";

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
  
  // Gallery
  getAllGalleryImages(): Promise<Gallery[]>;
  getEventGalleryImages(eventId: number): Promise<Gallery[]>;
  createGalleryImage(image: InsertGallery): Promise<Gallery>;
  
  // Subscribers
  createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber>;
  getSubscriberByEmail(email: string): Promise<Subscriber | undefined>;
  
  // User Management
  createUser(user: InsertUser, passwordHash: string): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  updateUserVerificationStatus(userId: number, isVerified: boolean): Promise<User>;
  
  // Nurse License Verification
  createNurseLicense(license: InsertNurseLicense, userId: number): Promise<NurseLicense>;
  getNurseLicensesByUserId(userId: number): Promise<NurseLicense[]>;
  getNurseLicenseById(id: number): Promise<NurseLicense | undefined>;
  updateNurseLicenseVerification(
    licenseId: number, 
    status: string, 
    verificationDate: Date, 
    verificationSource: string,
    verificationResult: any
  ): Promise<NurseLicense>;
  
  // Ticket Management
  createTicket(
    ticket: InsertTicket, 
    userId: number, 
    eventId: number, 
    ticketCode: string
  ): Promise<Ticket>;
  getTicketsByUserId(userId: number): Promise<Ticket[]>;
  getTicketByCode(ticketCode: string): Promise<Ticket | undefined>;
  markTicketAsUsed(ticketId: number): Promise<Ticket>;
  
  // ========== JOB BOARD FUNCTIONS ==========
  
  // Employer Management
  createEmployer(employer: InsertEmployer, userId: number): Promise<Employer>;
  getEmployerById(id: number): Promise<Employer | undefined>;
  getEmployerByUserId(userId: number): Promise<Employer | undefined>;
  getAllEmployers(): Promise<Employer[]>;
  getVerifiedEmployers(): Promise<Employer[]>;
  updateEmployer(id: number, data: Partial<InsertEmployer>): Promise<Employer>;
  verifyEmployer(id: number): Promise<Employer>;
  
  // Job Listings
  createJobListing(jobListing: InsertJobListing, employerId: number): Promise<JobListing>;
  getJobListingById(id: number): Promise<JobListing | undefined>;
  getAllJobListings(filters?: {
    specialty?: string | string[];
    location?: string | string[];
    jobType?: string | string[];
    experienceLevel?: string | string[];
    salaryMin?: number;
    keywords?: string;
    employerId?: number;
    isActive?: boolean;
    isFeatured?: boolean;
  }): Promise<JobListing[]>;
  getFeaturedJobListings(limit?: number): Promise<JobListing[]>;
  getRecentJobListings(limit?: number): Promise<JobListing[]>;
  updateJobListing(id: number, data: Partial<InsertJobListing>): Promise<JobListing>;
  incrementJobListingViews(id: number): Promise<JobListing>;
  incrementJobApplicationsCount(id: number): Promise<JobListing>;
  
  // Nurse Profiles
  createNurseProfile(profile: InsertNurseProfile, userId: number): Promise<NurseProfile>;
  getNurseProfileByUserId(userId: number): Promise<NurseProfile | undefined>;
  getNurseProfileById(id: number): Promise<NurseProfile | undefined>;
  updateNurseProfile(id: number, data: Partial<InsertNurseProfile>): Promise<NurseProfile>;
  getPublicNurseProfiles(filters?: {
    specialties?: string | string[];
    skills?: string | string[];
    yearsOfExperience?: number;
    preferredLocations?: string | string[];
    preferredShift?: string;
  }): Promise<NurseProfile[]>;
  
  // Job Applications
  createJobApplication(application: InsertJobApplication, userId: number, jobId: number): Promise<JobApplication>;
  getJobApplicationById(id: number): Promise<JobApplication | undefined>;
  getJobApplicationsByUserId(userId: number): Promise<JobApplication[]>;
  getJobApplicationsByJobId(jobId: number): Promise<JobApplication[]>;
  updateJobApplicationStatus(id: number, status: string, notes?: string): Promise<JobApplication>;
  withdrawJobApplication(id: number): Promise<JobApplication>;
  
  // Saved Jobs
  saveJob(userId: number, jobId: number, notes?: string): Promise<SavedJob>;
  unsaveJob(userId: number, jobId: number): Promise<void>;
  getSavedJobsByUserId(userId: number): Promise<SavedJob[]>;
  
  // Job Alerts
  createJobAlert(alert: InsertJobAlert, userId: number): Promise<JobAlert>;
  getJobAlertsByUserId(userId: number): Promise<JobAlert[]>;
  updateJobAlert(id: number, data: Partial<InsertJobAlert>): Promise<JobAlert>;
  deleteJobAlert(id: number): Promise<void>;
  
  // Job Search & Recommendations
  searchJobs(query: string, filters?: any): Promise<JobListing[]>;
  getRecommendedJobs(userId: number, limit?: number): Promise<JobListing[]>;
  getSimilarJobs(jobId: number, limit?: number): Promise<JobListing[]>;
  
  // ========== STORE FUNCTIONS ==========
  
  // Store Products
  getAllStoreProducts(): Promise<StoreProduct[]>;
  getStoreProductById(id: number): Promise<StoreProduct | undefined>;
  getFeaturedStoreProducts(limit?: number): Promise<StoreProduct[]>;
  getStoreProductsByCategory(category: string): Promise<StoreProduct[]>;
  createStoreProduct(product: InsertStoreProduct): Promise<StoreProduct>;
  updateStoreProduct(id: number, data: Partial<InsertStoreProduct>): Promise<StoreProduct>;
  deleteStoreProduct(id: number): Promise<void>;
  
  // Store Orders
  createStoreOrder(order: InsertStoreOrder, items: InsertStoreOrderItem[]): Promise<StoreOrder>;
  getStoreOrderById(id: number): Promise<StoreOrder | undefined>;
  getStoreOrdersByUserId(userId: number): Promise<StoreOrder[]>;
  updateStoreOrderStatus(id: number, status: string): Promise<StoreOrder>;
  updateStoreOrderPaymentStatus(id: number, paymentStatus: string): Promise<StoreOrder>;
  
  // Store Order Items
  getStoreOrderItemsByOrderId(orderId: number): Promise<StoreOrderItem[]>;
}

export class MemStorage implements IStorage {
  private events: Map<number, Event>;
  private artists: Map<number, Artist>;
  private gallery: Map<number, Gallery>;
  private subscribers: Map<number, Subscriber>;
  private users: Map<number, User>;
  private nurseLicenses: Map<number, NurseLicense>;
  private tickets: Map<number, Ticket>;
  private employers: Map<number, Employer>;
  private jobListings: Map<number, JobListing>;
  private nurseProfiles: Map<number, NurseProfile>;
  private jobApplications: Map<number, JobApplication>;
  private savedJobs: Map<number, SavedJob>;
  private jobAlerts: Map<number, JobAlert>;
  private storeProducts: Map<number, StoreProduct>;
  private storeOrders: Map<number, StoreOrder>;
  private storeOrderItems: Map<number, StoreOrderItem>;
  
  private eventId: number;
  private artistId: number;
  private galleryId: number;
  private subscriberId: number;
  private userId: number;
  private nurseLicenseId: number;
  private ticketId: number;
  private employerId: number;
  private jobListingId: number;
  private nurseProfileId: number;
  private jobApplicationId: number;
  private savedJobId: number;
  private jobAlertId: number;
  private storeProductId: number;
  private storeOrderId: number;
  private storeOrderItemId: number;
  
  constructor() {
    this.events = new Map();
    this.artists = new Map();
    this.gallery = new Map();
    this.subscribers = new Map();
    this.users = new Map();
    this.nurseLicenses = new Map();
    this.tickets = new Map();
    this.employers = new Map();
    this.jobListings = new Map();
    this.nurseProfiles = new Map();
    this.jobApplications = new Map();
    this.savedJobs = new Map();
    this.jobAlerts = new Map();
    this.storeProducts = new Map();
    this.storeOrders = new Map();
    this.storeOrderItems = new Map();
    
    this.eventId = 1;
    this.artistId = 1;
    // venueId no longer needed
    this.galleryId = 1;
    this.subscriberId = 1;
    this.userId = 1;
    this.nurseLicenseId = 1;
    this.ticketId = 1;
    this.employerId = 1;
    this.jobListingId = 1;
    this.nurseProfileId = 1;
    this.jobApplicationId = 1;
    this.savedJobId = 1;
    this.jobAlertId = 1;
    this.storeProductId = 1;
    this.storeOrderId = 1;
    this.storeOrderItemId = 1;
    
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
  
  // Venues section removed
  
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
    // Initialize store products data
    this.initializeStoreData();
    
    // Initialize some sample job data
    this.initializeJobBoardData();
    
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
    
    // Create Events with location instead of venue_id
    const oct21Event = this.setupEvent({
      title: "The Healing Harmonies",
      subtitle: "Heroes in Scrubs Tour",
      description: "Experience a powerful night of music performed by nurses who are using their musical talents to inspire hope and healing. Proceeds support the Healthcare Workers Foundation.",
      date: new Date("2023-10-21T20:00:00"),
      location: "New York, NY",
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
      location: "Chicago, IL",
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
      location: "Los Angeles, CA",
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
      location: "San Francisco, CA",
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
  
  // setupVenue method removed
  
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
  
  // Store Products
  async getAllStoreProducts(): Promise<StoreProduct[]> {
    return Array.from(this.storeProducts.values());
  }
  
  async getStoreProductById(id: number): Promise<StoreProduct | undefined> {
    return this.storeProducts.get(id);
  }
  
  async getFeaturedStoreProducts(limit?: number): Promise<StoreProduct[]> {
    const featured = Array.from(this.storeProducts.values())
      .filter(product => product.is_featured);
    
    return limit ? featured.slice(0, limit) : featured;
  }
  
  async getStoreProductsByCategory(category: string): Promise<StoreProduct[]> {
    return Array.from(this.storeProducts.values())
      .filter(product => product.category === category);
  }
  
  async createStoreProduct(product: InsertStoreProduct): Promise<StoreProduct> {
    const id = this.storeProductId++;
    const created_at = new Date();
    const updated_at = new Date();
    const newProduct: StoreProduct = { 
      ...product, 
      id, 
      created_at, 
      updated_at,
    };
    this.storeProducts.set(id, newProduct);
    return newProduct;
  }
  
  async updateStoreProduct(id: number, data: Partial<InsertStoreProduct>): Promise<StoreProduct> {
    const product = this.storeProducts.get(id);
    if (!product) {
      throw new Error(`Store product with ID ${id} not found`);
    }
    
    const updatedProduct: StoreProduct = { 
      ...product, 
      ...data, 
      updated_at: new Date() 
    };
    
    this.storeProducts.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async deleteStoreProduct(id: number): Promise<void> {
    if (!this.storeProducts.has(id)) {
      throw new Error(`Store product with ID ${id} not found`);
    }
    
    this.storeProducts.delete(id);
  }
  
  // Store Orders
  async createStoreOrder(order: InsertStoreOrder, items: InsertStoreOrderItem[]): Promise<StoreOrder> {
    const orderId = this.storeOrderId++;
    const created_at = new Date();
    const updated_at = new Date();
    
    // Create the order
    const newOrder: StoreOrder = {
      ...order,
      id: orderId,
      created_at,
      updated_at
    };
    
    this.storeOrders.set(orderId, newOrder);
    
    // Create the order items
    for (const item of items) {
      const itemId = this.storeOrderItemId++;
      const orderItem: StoreOrderItem = {
        ...item,
        id: itemId,
        order_id: orderId,
        created_at: new Date()
      };
      
      this.storeOrderItems.set(itemId, orderItem);
    }
    
    return newOrder;
  }
  
  async getStoreOrderById(id: number): Promise<StoreOrder | undefined> {
    return this.storeOrders.get(id);
  }
  
  async getStoreOrdersByUserId(userId: number): Promise<StoreOrder[]> {
    return Array.from(this.storeOrders.values())
      .filter(order => order.user_id === userId);
  }
  
  async updateStoreOrderStatus(id: number, status: string): Promise<StoreOrder> {
    const order = this.storeOrders.get(id);
    if (!order) {
      throw new Error(`Store order with ID ${id} not found`);
    }
    
    const updatedOrder: StoreOrder = {
      ...order,
      status,
      updated_at: new Date()
    };
    
    this.storeOrders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  async updateStoreOrderPaymentStatus(id: number, paymentStatus: string): Promise<StoreOrder> {
    const order = this.storeOrders.get(id);
    if (!order) {
      throw new Error(`Store order with ID ${id} not found`);
    }
    
    const updatedOrder: StoreOrder = {
      ...order,
      payment_status: paymentStatus,
      updated_at: new Date()
    };
    
    this.storeOrders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  // Store Order Items
  async getStoreOrderItemsByOrderId(orderId: number): Promise<StoreOrderItem[]> {
    return Array.from(this.storeOrderItems.values())
      .filter(item => item.order_id === orderId);
  }

  // Initialize the store with sample data
  private initializeStoreData() {
    // T-shirts
    this.createStoreProduct({
      name: "Nursing Rocks Logo T-Shirt",
      description: "Show your nursing pride with this comfortable cotton t-shirt featuring the Nursing Rocks concert series logo.",
      price: "24.99",
      image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      category: "Apparel",
      is_featured: true,
      is_available: true,
      stock_quantity: 100
    });
    
    this.createStoreProduct({
      name: "Healthcare Heroes Concert Tour T-Shirt",
      description: "Commemorate the Healthcare Heroes tour with this limited edition t-shirt. Features tour dates on the back.",
      price: "29.99",
      image_url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      category: "Apparel",
      is_featured: true,
      is_available: true,
      stock_quantity: 75
    });
    
    // Support a Nurse merchandise
    this.createStoreProduct({
      name: "Support a Nurse T-Shirt",
      description: "Help support nursing scholarships with this special edition t-shirt. 50% of proceeds go directly to the Nursing Rocks Scholarship Fund.",
      price: "29.99",
      image_url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      category: "Support a Nurse",
      is_featured: true,
      is_available: true,
      stock_quantity: 100
    });
    
    this.createStoreProduct({
      name: "Support a Nurse Tank Top",
      description: "This comfortable tank top supports nursing education initiatives. 50% of proceeds go to nursing scholarships.",
      price: "24.99",
      image_url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      category: "Support a Nurse",
      is_featured: true,
      is_available: true,
      stock_quantity: 85
    });
    
    // Accessories
    this.createStoreProduct({
      name: "Nursing Rocks Stethoscope ID Tag",
      description: "Personalize your stethoscope with this stylish ID tag featuring the Nursing Rocks logo.",
      price: "12.99",
      image_url: "https://images.unsplash.com/photo-1584982751601-97dcc096659c?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      category: "Accessories",
      is_featured: false,
      is_available: true,
      stock_quantity: 150
    });
    
    this.createStoreProduct({
      name: "Healing Harmonies Medical Badge Holder",
      description: "Keep your ID badge secure and stylish with this retractable badge holder featuring artwork from The Healing Harmonies.",
      price: "14.99",
      image_url: "https://images.unsplash.com/photo-1584982751601-97dcc096659c?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      category: "Accessories",
      is_featured: false,
      is_available: true,
      stock_quantity: 120
    });
    
    // Music
    this.createStoreProduct({
      name: "The Healing Harmonies - Heroes in Scrubs Album",
      description: "Digital download of the critically acclaimed album by The Healing Harmonies, performed by real nurses.",
      price: "9.99",
      image_url: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      category: "Music",
      is_featured: true,
      is_available: true,
      stock_quantity: 999
    });
    
    // Drinkware
    this.createStoreProduct({
      name: "Night Shift Insulated Travel Mug",
      description: "Keep your coffee hot during those long shifts with this insulated travel mug inspired by the Night Shift band.",
      price: "19.99",
      image_url: "https://images.unsplash.com/photo-1530968033775-2c92736b131e?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      category: "Drinkware",
      is_featured: false,
      is_available: true,
      stock_quantity: 85
    });
    
    // Gift Items
    this.createStoreProduct({
      name: "Nursing Rocks Gift Box",
      description: "The perfect gift for the music-loving nurse in your life! Includes t-shirt, stethoscope tag, badge holder, and digital album download.",
      price: "49.99",
      image_url: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      category: "Gift Items",
      is_featured: true,
      is_available: true,
      stock_quantity: 50
    });
  }
  
  // Initialize job board data with sample data for testing
  private initializeJobBoardData() {
    // Create a demo admin user
    const adminUser: User = {
      id: this.userId++,
      email: 'admin@nursingrocks.com',
      password_hash: '$2b$10$X/4YF4r7EYeAK6c1x2gkn.Wa3Wx4Bq2YtZIzNSESzwXMJ1vkEJRRm', // 'password123'
      first_name: 'Admin',
      last_name: 'User',
      created_at: new Date(),
      updated_at: new Date(),
      is_admin: true,
      is_verified: true
    };
    this.users.set(adminUser.id, adminUser);
    
    // Create some demo nurse users
    const nurseUser1: User = {
      id: this.userId++,
      email: 'jane.doe@example.com',
      password_hash: '$2b$10$X/4YF4r7EYeAK6c1x2gkn.Wa3Wx4Bq2YtZIzNSESzwXMJ1vkEJRRm', // 'password123'
      first_name: 'Jane',
      last_name: 'Doe',
      created_at: new Date(),
      updated_at: new Date(),
      is_admin: false,
      is_verified: true
    };
    this.users.set(nurseUser1.id, nurseUser1);
    
    const nurseUser2: User = {
      id: this.userId++,
      email: 'john.smith@example.com',
      password_hash: '$2b$10$X/4YF4r7EYeAK6c1x2gkn.Wa3Wx4Bq2YtZIzNSESzwXMJ1vkEJRRm', // 'password123'
      first_name: 'John',
      last_name: 'Smith',
      created_at: new Date(),
      updated_at: new Date(),
      is_admin: false,
      is_verified: true
    };
    this.users.set(nurseUser2.id, nurseUser2);
    
    // Create sample nurse profiles
    const nurseProfile1: NurseProfile = {
      id: this.nurseProfileId++,
      user_id: nurseUser1.id,
      headline: "Experienced ICU Nurse",
      summary: "Dedicated ICU nurse with over 5 years of experience in high-pressure medical environments, specializing in cardiac care and trauma response.",
      years_of_experience: 5,
      specialties: ["ICU", "Cardiac Care", "Trauma"],
      skills: ["Critical Care", "Ventilator Management", "Advanced Cardiac Life Support"],
      education: [
        {
          degree: "BSN",
          institution: "University of Nursing",
          year: "2018"
        }
      ],
      certifications: [
        {
          name: "ACLS",
          issuer: "American Heart Association",
          year: "2020"
        },
        {
          name: "PALS",
          issuer: "American Heart Association",
          year: "2019"
        }
      ],
      preferred_shift: "Day",
      preferred_locations: ["New York, NY", "Boston, MA"],
      resume_url: "https://example.com/jane-doe-resume.pdf",
      is_public: true,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.nurseProfiles.set(nurseProfile1.id, nurseProfile1);
    
    const nurseProfile2: NurseProfile = {
      id: this.nurseProfileId++,
      user_id: nurseUser2.id,
      headline: "Experienced ER Nurse",
      summary: "Emergency Room nurse with 3 years of experience in fast-paced hospital settings. Skilled in triage and emergency response procedures.",
      years_of_experience: 3,
      specialties: ["Emergency Medicine", "Triage", "Trauma"],
      skills: ["Emergency Response", "Wound Care", "Patient Assessment"],
      education: [
        {
          degree: "BSN",
          institution: "Metro College of Nursing",
          year: "2019"
        }
      ],
      certifications: [
        {
          name: "BLS",
          issuer: "American Heart Association",
          year: "2020"
        }
      ],
      preferred_shift: "Night",
      preferred_locations: ["Chicago, IL", "Milwaukee, WI"],
      resume_url: "https://example.com/john-smith-resume.pdf",
      is_public: true,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.nurseProfiles.set(nurseProfile2.id, nurseProfile2);
    
    // Create sample employers
    const employer1: Employer = {
      id: this.employerId++,
      name: "General Hospital Medical Center",
      user_id: this.userId++,
      description: "A leading healthcare provider with multiple facilities across the United States. Known for excellence in patient care and innovative medical practices.",
      logo_url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=300&q=80",
      website: "https://www.generalhospital.example.com",
      location: "New York, NY",
      contact_email: "careers@generalhospital.example.com",
      contact_phone: "212-555-1000",
      industry: "Healthcare",
      size: "Large (1000+ employees)",
      founded_year: "1950",
      is_verified: true,
      verification_date: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };
    this.employers.set(employer1.id, employer1);
    
    const employer2: Employer = {
      id: this.employerId++,
      name: "Caring Hearts Clinic",
      user_id: this.userId++,
      description: "A community-focused clinic providing compassionate healthcare services to underserved populations. We prioritize patient-centered care and holistic treatment approaches.",
      logo_url: "https://images.unsplash.com/photo-1518152006812-edab29b069ac?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=300&q=80",
      website: "https://www.caringhearts.example.com",
      location: "Chicago, IL",
      contact_email: "jobs@caringhearts.example.com",
      contact_phone: "312-555-2000",
      industry: "Healthcare",
      size: "Medium (100-999 employees)",
      founded_year: "1995",
      is_verified: true,
      verification_date: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };
    this.employers.set(employer2.id, employer2);
    
    const employer3: Employer = {
      id: this.employerId++,
      name: "Nightingale Healthcare Services",
      user_id: this.userId++,
      description: "A premier healthcare staffing agency providing temporary and permanent placement services for nurses and healthcare professionals across the country.",
      logo_url: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=300&q=80",
      website: "https://www.nightingalehcs.example.com",
      location: "Boston, MA",
      contact_email: "careers@nightingalehcs.example.com",
      contact_phone: "617-555-3000",
      industry: "Healthcare Staffing",
      size: "Medium (100-999 employees)",
      founded_year: "2005",
      is_verified: true,
      verification_date: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };
    this.employers.set(employer3.id, employer3);
    
    // Create sample job listings
    const job1: JobListing = {
      id: this.jobListingId++,
      title: "ICU Registered Nurse",
      employer_id: employer1.id,
      description: "Join our Intensive Care Unit team at General Hospital Medical Center, where you'll provide critical care to patients in need. As an ICU RN, you'll be responsible for monitoring, assessing, and caring for critically ill patients with complex medical needs.",
      responsibilities: "• Monitor and assess critically ill patients\n• Administer medications and treatments\n• Collaborate with interdisciplinary team members\n• Respond quickly to changes in patient condition\n• Document patient care and progress\n• Provide education and support to patients and families",
      requirements: "• Active RN license\n• BSN preferred\n• 2+ years of ICU experience\n• BLS and ACLS certifications\n• Strong critical thinking and problem-solving skills\n• Excellent communication abilities",
      benefits: "• Competitive salary\n• Comprehensive health benefits\n• 401(k) with employer match\n• Tuition reimbursement\n• Professional development opportunities\n• Relocation assistance available",
      location: "New York, NY",
      job_type: "Full-time",
      shift_type: "Day",
      experience_level: "Mid-Level",
      specialty: "ICU",
      education_required: "Bachelor's Degree",
      certification_required: "ACLS, BLS",
      salary_min: 85000,
      salary_max: 110000,
      salary_period: "yearly",
      contact_email: "careers@generalhospital.example.com",
      contact_phone: "212-555-1234",
      is_featured: true,
      is_active: true,
      posted_date: new Date(),
      updated_at: new Date(),
      views_count: 125,
      applications_count: 12
    };
    this.jobListings.set(job1.id, job1);
    
    const job2: JobListing = {
      id: this.jobListingId++,
      title: "Emergency Room Nurse",
      employer_id: employer2.id,
      description: "Caring Hearts Clinic is seeking an experienced Emergency Room Nurse to join our dedicated team. In this role, you'll provide immediate assessment and care to patients with urgent medical needs in our fast-paced ER department.",
      responsibilities: "• Triage and assess patients with varying levels of acuity\n• Administer medications and treatments as ordered\n• Assist with procedures and tests\n• Monitor patient vital signs and condition\n• Document patient care accurately\n• Provide discharge instructions to patients",
      requirements: "• Active RN license\n• 1+ years of ER experience\n• BLS and ACLS certifications\n• Strong assessment skills\n• Ability to work under pressure\n• Excellent multitasking capabilities",
      benefits: "• Competitive hourly rates\n• Flexible scheduling\n• Health insurance options\n• Retirement savings plans\n• Continuing education support\n• Employee wellness program",
      location: "Chicago, IL",
      job_type: "Full-time",
      shift_type: "Night",
      experience_level: "Entry-Level",
      specialty: "Emergency",
      education_required: "Associate's Degree",
      certification_required: "BLS, ACLS",
      salary_min: 75000,
      salary_max: 95000,
      salary_period: "yearly",
      contact_email: "jobs@caringhearts.example.com",
      contact_phone: "312-555-2345",
      is_featured: false,
      is_active: true,
      posted_date: new Date(),
      updated_at: new Date(),
      views_count: 98,
      applications_count: 8
    };
    this.jobListings.set(job2.id, job2);
    
    const job3: JobListing = {
      id: this.jobListingId++,
      title: "Cardiac Care Unit Nurse",
      employer_id: employer1.id,
      description: "General Hospital Medical Center is recruiting for a skilled Cardiac Care Unit Nurse to join our specialized cardiac team. This position involves caring for patients recovering from cardiac surgeries, heart attacks, and other cardiovascular conditions.",
      responsibilities: "• Monitor cardiac patients using telemetry and other equipment\n• Administer cardiac medications\n• Assist with cardiac procedures\n• Educate patients on heart health and recovery\n• Collaborate with cardiologists and cardiac surgeons\n• Respond to cardiac emergencies",
      requirements: "• Active RN license\n• BSN preferred\n• 2+ years of cardiac nursing experience\n• BLS and ACLS certifications\n• Knowledge of cardiac medications and treatments\n• Experience with cardiac monitoring equipment",
      benefits: "• Competitive salary with clinical ladder advancement\n• Comprehensive benefits package\n• Night shift differential\n• Continuing education reimbursement\n• On-site fitness center\n• Employee assistance program",
      location: "New York, NY",
      job_type: "Full-time",
      shift_type: "Night",
      experience_level: "Mid-Level",
      specialty: "Cardiac",
      education_required: "Bachelor's Degree",
      certification_required: "ACLS, BLS",
      salary_min: 90000,
      salary_max: 115000,
      salary_period: "yearly",
      contact_email: "careers@generalhospital.example.com",
      contact_phone: "212-555-1234",
      is_featured: true,
      is_active: true,
      posted_date: new Date(),
      updated_at: new Date(),
      views_count: 110,
      applications_count: 9
    };
    this.jobListings.set(job3.id, job3);
    
    const job4: JobListing = {
      id: this.jobListingId++,
      title: "Travel ICU Nurse",
      employer_id: employer3.id,
      description: "Nightingale Healthcare Services is looking for experienced Travel ICU Nurses for 13-week assignments in various locations nationwide. This is an excellent opportunity to gain diverse clinical experience while traveling to different healthcare facilities.",
      responsibilities: "• Provide critical care to ICU patients at assigned facilities\n• Adapt quickly to new hospital systems and protocols\n• Monitor and assess critically ill patients\n• Administer medications and treatments per orders\n• Document patient care according to facility requirements\n• Communicate effectively with new healthcare teams",
      requirements: "• Active RN license (or compact license)\n• BSN preferred\n• Minimum 2 years recent ICU experience\n• BLS and ACLS certifications\n• Flexibility to relocate for assignments\n• Strong adaptability and independent practice skills",
      benefits: "• Premium pay rates\n• Tax-free housing stipend\n• Travel reimbursement\n• Medical benefits from day one\n• 401(k) with immediate vesting\n• 24/7 clinical support",
      location: "Multiple Locations",
      job_type: "Contract",
      shift_type: "Various",
      experience_level: "Mid-Level",
      specialty: "ICU",
      education_required: "Bachelor's Degree",
      certification_required: "ACLS, BLS",
      salary_min: 100000,
      salary_max: 140000,
      salary_period: "yearly",
      contact_email: "careers@nightingalehcs.example.com",
      contact_phone: "617-555-3456",
      is_featured: true,
      is_active: true,
      posted_date: new Date(),
      updated_at: new Date(),
      views_count: 205,
      applications_count: 18
    };
    this.jobListings.set(job4.id, job4);
    
    const job5: JobListing = {
      id: this.jobListingId++,
      title: "Pediatric Nurse",
      employer_id: employer2.id,
      description: "Caring Hearts Clinic is seeking a compassionate Pediatric Nurse to join our children's health department. In this role, you'll provide care to infants, children, and adolescents in an outpatient setting.",
      responsibilities: "• Assess pediatric patients of various ages\n• Administer vaccinations and medications\n• Assist with well-child visits and sick appointments\n• Provide patient and family education\n• Document growth and development milestones\n• Collaborate with pediatricians",
      requirements: "• Active RN license\n• 1+ years of pediatric nursing experience\n• BLS certification\n• PALS certification preferred\n• Strong communication skills with children and families\n• Patience and compassion",
      benefits: "• Competitive salary\n• Family-friendly scheduling\n• Comprehensive benefits\n• Continuing education opportunities\n• Child care assistance program\n• Work-life balance initiatives",
      location: "Chicago, IL",
      job_type: "Full-time",
      shift_type: "Day",
      experience_level: "Entry-Level",
      specialty: "Pediatrics",
      education_required: "Associate's Degree",
      certification_required: "BLS",
      salary_min: 70000,
      salary_max: 90000,
      salary_period: "yearly",
      contact_email: "jobs@caringhearts.example.com",
      contact_phone: "312-555-2345",
      is_featured: false,
      is_active: true,
      posted_date: new Date(),
      updated_at: new Date(),
      views_count: 87,
      applications_count: 7
    };
    this.jobListings.set(job5.id, job5);
    
    // Create a sample job application
    const jobApplication1: JobApplication = {
      id: this.jobApplicationId++,
      user_id: nurseUser1.id,
      job_id: job1.id,
      cover_letter: "I am very interested in the ICU Registered Nurse position at General Hospital Medical Center. With my 5 years of experience in critical care and specialization in cardiac patients, I believe I would be an excellent fit for your team.",
      resume_url: "https://example.com/jane-doe-resume.pdf",
      status: "submitted",
      application_date: new Date(),
      updated_at: new Date(),
      employer_notes: null,
      is_withdrawn: false
    };
    this.jobApplications.set(jobApplication1.id, jobApplication1);
    
    // Create sample saved jobs
    const savedJob1: SavedJob = {
      id: this.savedJobId++,
      user_id: nurseUser1.id,
      job_id: job3.id,
      saved_date: new Date(),
      notes: "Great opportunity for career advancement in cardiac care"
    };
    this.savedJobs.set(savedJob1.id, savedJob1);
    
    const savedJob2: SavedJob = {
      id: this.savedJobId++,
      user_id: nurseUser2.id,
      job_id: job2.id,
      saved_date: new Date(),
      notes: "Perfect match for my ER experience and night shift preference"
    };
    this.savedJobs.set(savedJob2.id, savedJob2);
    
    // Create sample job alerts
    const jobAlert1: JobAlert = {
      id: this.jobAlertId++,
      user_id: nurseUser1.id,
      name: "ICU Positions in New York",
      specialties: ["ICU", "Cardiac"],
      locations: ["New York, NY", "Boston, MA"],
      job_types: ["Full-time"],
      experience_levels: ["Mid-Level", "Senior"],
      salary_min: "85000",
      keywords: "cardiac, critical care",
      frequency: "daily",
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      last_sent: null
    };
    this.jobAlerts.set(jobAlert1.id, jobAlert1);
  }
  
  // User Management
  async createUser(user: InsertUser, passwordHash: string): Promise<User> {
    const id = this.userId++;
    const newUser: User = { 
      ...user, 
      id, 
      password_hash: passwordHash,
      created_at: new Date(),
      updated_at: new Date(),
      is_admin: false,
      is_verified: false
    };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }
  
  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async updateUserVerificationStatus(userId: number, isVerified: boolean): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const updatedUser = { ...user, is_verified: isVerified, updated_at: new Date() };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  // Nurse License Verification
  async createNurseLicense(license: InsertNurseLicense, userId: number): Promise<NurseLicense> {
    const id = this.nurseLicenseId++;
    const newLicense: NurseLicense = {
      ...license,
      id,
      user_id: userId,
      submission_date: new Date(),
      verification_date: null,
      verification_status: "pending",
      verification_source: null,
      verification_result: null
    };
    this.nurseLicenses.set(id, newLicense);
    return newLicense;
  }
  
  async getNurseLicensesByUserId(userId: number): Promise<NurseLicense[]> {
    return Array.from(this.nurseLicenses.values()).filter(
      license => license.user_id === userId
    );
  }
  
  async getNurseLicenseById(id: number): Promise<NurseLicense | undefined> {
    return this.nurseLicenses.get(id);
  }
  
  async updateNurseLicenseVerification(
    licenseId: number,
    status: string,
    verificationDate: Date,
    verificationSource: string,
    verificationResult: any
  ): Promise<NurseLicense> {
    const license = this.nurseLicenses.get(licenseId);
    if (!license) {
      throw new Error("License not found");
    }
    
    const updatedLicense: NurseLicense = {
      ...license,
      verification_status: status,
      verification_date: verificationDate,
      verification_source: verificationSource,
      verification_result: verificationResult
    };
    this.nurseLicenses.set(licenseId, updatedLicense);
    return updatedLicense;
  }
  
  // Ticket Management
  async createTicket(
    ticket: InsertTicket,
    userId: number,
    eventId: number,
    ticketCode: string
  ): Promise<Ticket> {
    const id = this.ticketId++;
    const newTicket: Ticket = {
      ...ticket,
      id,
      user_id: userId,
      event_id: eventId,
      ticket_code: ticketCode,
      purchase_date: new Date(),
      used: false,
      used_date: null
    };
    this.tickets.set(id, newTicket);
    return newTicket;
  }
  
  async getTicketsByUserId(userId: number): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).filter(
      ticket => ticket.user_id === userId
    );
  }
  
  async getTicketByCode(ticketCode: string): Promise<Ticket | undefined> {
    return Array.from(this.tickets.values()).find(
      ticket => ticket.ticket_code === ticketCode
    );
  }
  
  async markTicketAsUsed(ticketId: number): Promise<Ticket> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      throw new Error("Ticket not found");
    }
    
    const updatedTicket: Ticket = {
      ...ticket,
      used: true,
      used_date: new Date()
    };
    this.tickets.set(ticketId, updatedTicket);
    return updatedTicket;
  }
  
  // ========== JOB BOARD METHODS ==========
  
  // Employer Management
  async createEmployer(employer: InsertEmployer, userId: number): Promise<Employer> {
    const id = this.employerId++;
    const newEmployer: Employer = {
      ...employer,
      id,
      user_id: userId,
      created_at: new Date(),
      updated_at: new Date(),
      is_verified: false,
      verification_date: null
    };
    this.employers.set(id, newEmployer);
    return newEmployer;
  }
  
  async getEmployerById(id: number): Promise<Employer | undefined> {
    return this.employers.get(id);
  }
  
  async getEmployerByUserId(userId: number): Promise<Employer | undefined> {
    return Array.from(this.employers.values()).find(
      employer => employer.user_id === userId
    );
  }
  
  async getAllEmployers(): Promise<Employer[]> {
    return Array.from(this.employers.values());
  }
  
  async getVerifiedEmployers(): Promise<Employer[]> {
    return Array.from(this.employers.values()).filter(
      employer => employer.is_verified
    );
  }
  
  async updateEmployer(id: number, data: Partial<InsertEmployer>): Promise<Employer> {
    const employer = this.employers.get(id);
    if (!employer) {
      throw new Error("Employer not found");
    }
    
    const updatedEmployer: Employer = {
      ...employer,
      ...data,
      updated_at: new Date()
    };
    this.employers.set(id, updatedEmployer);
    return updatedEmployer;
  }
  
  async verifyEmployer(id: number): Promise<Employer> {
    const employer = this.employers.get(id);
    if (!employer) {
      throw new Error("Employer not found");
    }
    
    const updatedEmployer: Employer = {
      ...employer,
      is_verified: true,
      verification_date: new Date(),
      updated_at: new Date()
    };
    this.employers.set(id, updatedEmployer);
    return updatedEmployer;
  }
  
  // Job Listings
  async createJobListing(jobListing: InsertJobListing, employerId: number): Promise<JobListing> {
    const id = this.jobListingId++;
    const newJobListing: JobListing = {
      ...jobListing,
      id,
      employer_id: employerId,
      posted_date: new Date(),
      updated_at: new Date(),
      views_count: 0,
      applications_count: 0
    };
    this.jobListings.set(id, newJobListing);
    return newJobListing;
  }
  
  async getJobListingById(id: number): Promise<JobListing | undefined> {
    return this.jobListings.get(id);
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
    let jobs = Array.from(this.jobListings.values());
    
    if (filters) {
      // Filter by employerId
      if (filters.employerId) {
        jobs = jobs.filter(job => job.employer_id === filters.employerId);
      }
      
      // Filter by isActive
      if (filters.isActive !== undefined) {
        jobs = jobs.filter(job => job.is_active === filters.isActive);
      }
      
      // Filter by isFeatured
      if (filters.isFeatured !== undefined) {
        jobs = jobs.filter(job => job.is_featured === filters.isFeatured);
      }
      
      // Filter by specialty
      if (filters.specialty) {
        const specialties = Array.isArray(filters.specialty) 
          ? filters.specialty 
          : [filters.specialty];
        jobs = jobs.filter(job => specialties.includes(job.specialty));
      }
      
      // Filter by location
      if (filters.location) {
        const locations = Array.isArray(filters.location) 
          ? filters.location 
          : [filters.location];
        jobs = jobs.filter(job => 
          locations.some(loc => job.location.toLowerCase().includes(loc.toLowerCase()))
        );
      }
      
      // Filter by jobType
      if (filters.jobType) {
        const jobTypes = Array.isArray(filters.jobType) 
          ? filters.jobType 
          : [filters.jobType];
        jobs = jobs.filter(job => jobTypes.includes(job.job_type));
      }
      
      // Filter by experienceLevel
      if (filters.experienceLevel) {
        const expLevels = Array.isArray(filters.experienceLevel) 
          ? filters.experienceLevel 
          : [filters.experienceLevel];
        jobs = jobs.filter(job => expLevels.includes(job.experience_level));
      }
      
      // Filter by minimum salary
      if (filters.salaryMin !== undefined) {
        jobs = jobs.filter(job => 
          job.salary_min !== null && job.salary_min >= filters.salaryMin!
        );
      }
      
      // Filter by keywords
      if (filters.keywords) {
        const keywords = filters.keywords.toLowerCase();
        jobs = jobs.filter(job => 
          job.title.toLowerCase().includes(keywords) ||
          (job.description && job.description.toLowerCase().includes(keywords)) ||
          (job.responsibilities && job.responsibilities.toLowerCase().includes(keywords)) ||
          (job.requirements && job.requirements.toLowerCase().includes(keywords))
        );
      }
    }
    
    // Sort by posted date (newest first)
    return jobs.sort((a, b) => 
      new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime()
    );
  }
  
  async getFeaturedJobListings(limit?: number): Promise<JobListing[]> {
    const featuredJobs = Array.from(this.jobListings.values())
      .filter(job => job.is_featured && job.is_active)
      .sort((a, b) => 
        new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime()
      );
    
    return limit ? featuredJobs.slice(0, limit) : featuredJobs;
  }
  
  async getRecentJobListings(limit?: number): Promise<JobListing[]> {
    const recentJobs = Array.from(this.jobListings.values())
      .filter(job => job.is_active)
      .sort((a, b) => 
        new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime()
      );
    
    return limit ? recentJobs.slice(0, limit) : recentJobs;
  }
  
  async updateJobListing(id: number, data: Partial<InsertJobListing>): Promise<JobListing> {
    const jobListing = this.jobListings.get(id);
    if (!jobListing) {
      throw new Error("Job listing not found");
    }
    
    const updatedJobListing: JobListing = {
      ...jobListing,
      ...data,
      updated_at: new Date()
    };
    this.jobListings.set(id, updatedJobListing);
    return updatedJobListing;
  }
  
  async incrementJobListingViews(id: number): Promise<JobListing> {
    const jobListing = this.jobListings.get(id);
    if (!jobListing) {
      throw new Error("Job listing not found");
    }
    
    const updatedJobListing: JobListing = {
      ...jobListing,
      views_count: jobListing.views_count + 1
    };
    this.jobListings.set(id, updatedJobListing);
    return updatedJobListing;
  }
  
  async incrementJobApplicationsCount(id: number): Promise<JobListing> {
    const jobListing = this.jobListings.get(id);
    if (!jobListing) {
      throw new Error("Job listing not found");
    }
    
    const updatedJobListing: JobListing = {
      ...jobListing,
      applications_count: jobListing.applications_count + 1
    };
    this.jobListings.set(id, updatedJobListing);
    return updatedJobListing;
  }
  
  // Nurse Profiles
  async createNurseProfile(profile: InsertNurseProfile, userId: number): Promise<NurseProfile> {
    const id = this.nurseProfileId++;
    const newProfile: NurseProfile = {
      ...profile,
      id,
      user_id: userId,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.nurseProfiles.set(id, newProfile);
    return newProfile;
  }
  
  async getNurseProfileByUserId(userId: number): Promise<NurseProfile | undefined> {
    return Array.from(this.nurseProfiles.values()).find(
      profile => profile.user_id === userId
    );
  }
  
  async getNurseProfileById(id: number): Promise<NurseProfile | undefined> {
    return this.nurseProfiles.get(id);
  }
  
  async updateNurseProfile(id: number, data: Partial<InsertNurseProfile>): Promise<NurseProfile> {
    const profile = this.nurseProfiles.get(id);
    if (!profile) {
      throw new Error("Profile not found");
    }
    
    const updatedProfile: NurseProfile = {
      ...profile,
      ...data,
      updated_at: new Date()
    };
    this.nurseProfiles.set(id, updatedProfile);
    return updatedProfile;
  }
  
  async getPublicNurseProfiles(filters?: {
    specialties?: string | string[];
    skills?: string | string[];
    yearsOfExperience?: number;
    preferredLocations?: string | string[];
    preferredShift?: string;
  }): Promise<NurseProfile[]> {
    let profiles = Array.from(this.nurseProfiles.values())
      .filter(profile => profile.public_profile);
    
    if (filters) {
      // Filter by specialties
      if (filters.specialties) {
        const specialtiesArray = Array.isArray(filters.specialties) 
          ? filters.specialties 
          : [filters.specialties];
        profiles = profiles.filter(profile => 
          profile.specialties.some(specialty => 
            specialtiesArray.includes(specialty)
          )
        );
      }
      
      // Filter by skills
      if (filters.skills) {
        const skillsArray = Array.isArray(filters.skills) 
          ? filters.skills 
          : [filters.skills];
        profiles = profiles.filter(profile => 
          profile.skills && profile.skills.some(skill => 
            skillsArray.includes(skill)
          )
        );
      }
      
      // Filter by years of experience
      if (filters.yearsOfExperience !== undefined) {
        profiles = profiles.filter(profile => 
          profile.years_experience >= filters.yearsOfExperience!
        );
      }
      
      // Filter by preferred locations
      if (filters.preferredLocations) {
        const locationsArray = Array.isArray(filters.preferredLocations) 
          ? filters.preferredLocations 
          : [filters.preferredLocations];
        profiles = profiles.filter(profile => 
          profile.preferred_locations && profile.preferred_locations.some(location => 
            locationsArray.includes(location)
          )
        );
      }
      
      // Filter by preferred shift
      if (filters.preferredShift) {
        profiles = profiles.filter(profile => 
          profile.preferred_shift === filters.preferredShift
        );
      }
    }
    
    return profiles;
  }
  
  // Job Applications
  async createJobApplication(application: InsertJobApplication, userId: number, jobId: number): Promise<JobApplication> {
    const id = this.jobApplicationId++;
    const newApplication: JobApplication = {
      ...application,
      id,
      user_id: userId,
      job_id: jobId,
      application_date: new Date(),
      status: "submitted",
      updated_at: new Date(),
      employer_notes: null
    };
    this.jobApplications.set(id, newApplication);
    return newApplication;
  }
  
  async getJobApplicationById(id: number): Promise<JobApplication | undefined> {
    return this.jobApplications.get(id);
  }
  
  async getJobApplicationsByUserId(userId: number): Promise<JobApplication[]> {
    return Array.from(this.jobApplications.values())
      .filter(app => app.user_id === userId)
      .sort((a, b) => 
        new Date(b.application_date).getTime() - new Date(a.application_date).getTime()
      );
  }
  
  async getJobApplicationsByJobId(jobId: number): Promise<JobApplication[]> {
    return Array.from(this.jobApplications.values())
      .filter(app => app.job_id === jobId)
      .sort((a, b) => 
        new Date(b.application_date).getTime() - new Date(a.application_date).getTime()
      );
  }
  
  async updateJobApplicationStatus(id: number, status: string, notes?: string): Promise<JobApplication> {
    const application = this.jobApplications.get(id);
    if (!application) {
      throw new Error("Application not found");
    }
    
    const updatedApplication: JobApplication = {
      ...application,
      status,
      employer_notes: notes || application.employer_notes,
      updated_at: new Date()
    };
    this.jobApplications.set(id, updatedApplication);
    return updatedApplication;
  }
  
  async withdrawJobApplication(id: number): Promise<JobApplication> {
    const application = this.jobApplications.get(id);
    if (!application) {
      throw new Error("Application not found");
    }
    
    const updatedApplication: JobApplication = {
      ...application,
      status: "withdrawn",
      updated_at: new Date()
    };
    this.jobApplications.set(id, updatedApplication);
    return updatedApplication;
  }
  
  // Saved Jobs
  async saveJob(userId: number, jobId: number, notes?: string): Promise<SavedJob> {
    const id = this.savedJobId++;
    const newSavedJob: SavedJob = {
      id,
      user_id: userId,
      job_id: jobId,
      saved_date: new Date(),
      notes: notes || null
    };
    this.savedJobs.set(id, newSavedJob);
    return newSavedJob;
  }
  
  async unsaveJob(userId: number, jobId: number): Promise<void> {
    const savedJobEntry = Array.from(this.savedJobs.values()).find(
      saved => saved.user_id === userId && saved.job_id === jobId
    );
    
    if (savedJobEntry) {
      this.savedJobs.delete(savedJobEntry.id);
    }
  }
  
  async getSavedJobsByUserId(userId: number): Promise<SavedJob[]> {
    return Array.from(this.savedJobs.values())
      .filter(saved => saved.user_id === userId)
      .sort((a, b) => 
        new Date(b.saved_date).getTime() - new Date(a.saved_date).getTime()
      );
  }
  
  // Job Alerts
  async createJobAlert(alert: InsertJobAlert, userId: number): Promise<JobAlert> {
    const id = this.jobAlertId++;
    const newAlert: JobAlert = {
      ...alert,
      id,
      user_id: userId,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.jobAlerts.set(id, newAlert);
    return newAlert;
  }
  
  async getJobAlertsByUserId(userId: number): Promise<JobAlert[]> {
    return Array.from(this.jobAlerts.values())
      .filter(alert => alert.user_id === userId)
      .sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }
  
  async updateJobAlert(id: number, data: Partial<InsertJobAlert>): Promise<JobAlert> {
    const alert = this.jobAlerts.get(id);
    if (!alert) {
      throw new Error("Job alert not found");
    }
    
    const updatedAlert: JobAlert = {
      ...alert,
      ...data,
      updated_at: new Date()
    };
    this.jobAlerts.set(id, updatedAlert);
    return updatedAlert;
  }
  
  async deleteJobAlert(id: number): Promise<void> {
    if (!this.jobAlerts.has(id)) {
      throw new Error("Job alert not found");
    }
    this.jobAlerts.delete(id);
  }
  
  // Job Search & Recommendations
  async searchJobs(query: string, filters?: any): Promise<JobListing[]> {
    const keywords = query.toLowerCase();
    let jobs = Array.from(this.jobListings.values()).filter(job => 
      job.is_active && (
        job.title.toLowerCase().includes(keywords) ||
        (job.description && job.description.toLowerCase().includes(keywords)) ||
        (job.responsibilities && job.responsibilities.toLowerCase().includes(keywords)) ||
        (job.requirements && job.requirements.toLowerCase().includes(keywords)) ||
        (job.location.toLowerCase().includes(keywords)) ||
        (job.specialty.toLowerCase().includes(keywords))
      )
    );
    
    if (filters) {
      // Apply additional filters similar to getAllJobListings method
    }
    
    return jobs.sort((a, b) => 
      new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime()
    );
  }
  
  async getRecommendedJobs(userId: number, limit?: number): Promise<JobListing[]> {
    // Get the nurse profile to determine recommendations
    const profile = await this.getNurseProfileByUserId(userId);
    if (!profile) {
      return [];
    }
    
    // Get active jobs
    let jobs = Array.from(this.jobListings.values()).filter(job => job.is_active);
    
    // Score jobs based on profile match
    const scoredJobs = jobs.map(job => {
      let score = 0;
      
      // Match specialty (highest weight)
      if (profile.specialties.includes(job.specialty)) {
        score += 5;
      }
      
      // Match location
      if (profile.preferred_locations && 
          profile.preferred_locations.some(loc => 
            job.location.toLowerCase().includes(loc.toLowerCase())
          )) {
        score += 3;
      }
      
      // Match shift preference
      if (profile.preferred_shift && job.shift_type && 
          profile.preferred_shift === job.shift_type) {
        score += 2;
      }
      
      // Match job type
      if (profile.preferred_job_type && 
          profile.preferred_job_type === job.job_type) {
        score += 2;
      }
      
      return { job, score };
    });
    
    // Sort by score (highest first) and then by date (newest first)
    const sortedJobs = scoredJobs
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return new Date(b.job.posted_date).getTime() - new Date(a.job.posted_date).getTime();
      })
      .map(item => item.job);
    
    return limit ? sortedJobs.slice(0, limit) : sortedJobs;
  }
  
  async getSimilarJobs(jobId: number, limit?: number): Promise<JobListing[]> {
    const job = await this.getJobListingById(jobId);
    if (!job) {
      return [];
    }
    
    // Get active jobs except the current one
    let jobs = Array.from(this.jobListings.values()).filter(j => 
      j.is_active && j.id !== jobId
    );
    
    // Score jobs based on similarity
    const scoredJobs = jobs.map(j => {
      let score = 0;
      
      // Match specialty (highest weight)
      if (j.specialty === job.specialty) {
        score += 5;
      }
      
      // Match location
      if (j.location === job.location) {
        score += 3;
      }
      
      // Match job type
      if (j.job_type === job.job_type) {
        score += 2;
      }
      
      // Match shift type
      if (j.shift_type && job.shift_type && j.shift_type === job.shift_type) {
        score += 2;
      }
      
      // Match experience level
      if (j.experience_level === job.experience_level) {
        score += 1;
      }
      
      return { job: j, score };
    });
    
    // Sort by score (highest first) and then by date (newest first)
    const sortedJobs = scoredJobs
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return new Date(b.job.posted_date).getTime() - new Date(a.job.posted_date).getTime();
      })
      .map(item => item.job);
    
    return limit ? sortedJobs.slice(0, limit) : sortedJobs;
  }
}

// Using database storage for this implementation
export const storage = new DatabaseStorage();
