import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date, decimal, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Event model
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  description: text("description"),
  date: timestamp("date").notNull(),
  venue_id: integer("venue_id").notNull(),
  artist_id: integer("artist_id").notNull(),
  image_url: text("image_url"),
  start_time: text("start_time").notNull(),
  doors_time: text("doors_time"),
  price: text("price"),
  is_featured: boolean("is_featured").default(false),
  genre: text("genre"),
  tickets_url: text("tickets_url"),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
});

export const eventsRelations = relations(events, ({ one }) => ({
  artist: one(artists, {
    fields: [events.artist_id],
    references: [artists.id],
  }),
  venue: one(venues, {
    fields: [events.venue_id],
    references: [venues.id],
  }),
}));

// Artist model
export const artists = pgTable("artists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio"),
  image_url: text("image_url"),
  genre: text("genre"),
  latest_album: text("latest_album"),
  social_links: jsonb("social_links"),
  featured_song: text("featured_song"),
  song_duration: text("song_duration"),
});

export const insertArtistSchema = createInsertSchema(artists).omit({
  id: true,
});

export const artistsRelations = relations(artists, ({ many }) => ({
  events: many(events),
}));

// Venue model
export const venues = pgTable("venues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  capacity: integer("capacity"),
  image_url: text("image_url"),
  description: text("description"),
  rating: integer("rating"),
  seating_chart_url: text("seating_chart_url"),
});

export const insertVenueSchema = createInsertSchema(venues).omit({
  id: true,
});

export const venuesRelations = relations(venues, ({ many }) => ({
  events: many(events),
}));

// Gallery model
export const gallery = pgTable("gallery", {
  id: serial("id").primaryKey(),
  image_url: text("image_url").notNull(),
  alt_text: text("alt_text"),
  event_id: integer("event_id"),
});

export const insertGallerySchema = createInsertSchema(gallery).omit({
  id: true,
});

export const galleryRelations = relations(gallery, ({ one }) => ({
  event: one(events, {
    fields: [gallery.event_id],
    references: [events.id],
  }),
}));

// Newsletter subscribers
export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertSubscriberSchema = createInsertSchema(subscribers).omit({
  id: true, 
  created_at: true,
});

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  is_verified: boolean("is_verified").default(false),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
  password_hash: true,
}).extend({
  password: z.string().min(8),
});

// Nurse License model
export const nurseLicenses = pgTable("nurse_licenses", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  license_number: text("license_number").notNull(),
  state: text("state").notNull(),
  expiration_date: date("expiration_date").notNull(),
  status: text("status").default("pending"),
  verification_date: timestamp("verification_date"),
  verification_source: text("verification_source"),
  verification_result: jsonb("verification_result"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertNurseLicenseSchema = createInsertSchema(nurseLicenses).omit({
  id: true,
  user_id: true,
  verification_date: true,
  verification_source: true,
  verification_result: true,
  created_at: true,
});

// Tickets model
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  event_id: integer("event_id").notNull(),
  purchase_date: timestamp("purchase_date").defaultNow(),
  ticket_type: text("ticket_type").notNull(),
  price: text("price").notNull(),
  is_used: boolean("is_used").default(false),
  ticket_code: text("ticket_code").notNull().unique(),
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  purchase_date: true,
  is_used: true,
  ticket_code: true,
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  licenses: many(nurseLicenses),
  tickets: many(tickets),
}));

export const nurseLicensesRelations = relations(nurseLicenses, ({ one }) => ({
  user: one(users, {
    fields: [nurseLicenses.user_id],
    references: [users.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  user: one(users, {
    fields: [tickets.user_id],
    references: [users.id],
  }),
  event: one(events, {
    fields: [tickets.event_id],
    references: [events.id],
  }),
}));

// Types
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Artist = typeof artists.$inferSelect;
export type InsertArtist = z.infer<typeof insertArtistSchema>;

export type Venue = typeof venues.$inferSelect;
export type InsertVenue = z.infer<typeof insertVenueSchema>;

export type Gallery = typeof gallery.$inferSelect;
export type InsertGallery = z.infer<typeof insertGallerySchema>;

export type Subscriber = typeof subscribers.$inferSelect;
export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type NurseLicense = typeof nurseLicenses.$inferSelect;
export type InsertNurseLicense = z.infer<typeof insertNurseLicenseSchema>;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

// Media Assets for file uploads
export const mediaAssets = pgTable("media_assets", {
  id: text("id").primaryKey(),
  path: text("path").notNull(),
  type: text("type").notNull().default("other"),
  title: text("title"),
  alt: text("alt"),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  user_id: integer("user_id").references(() => users.id),
  filesize: integer("filesize"),
  filename: text("filename"),
  originalname: text("originalname"),
  mimetype: text("mimetype"),
});

export const insertMediaAssetSchema = createInsertSchema(mediaAssets).omit({
  created_at: true,
  updated_at: true,
});

export const mediaAssetsRelations = relations(mediaAssets, ({ one }) => ({
  user: one(users, {
    fields: [mediaAssets.user_id],
    references: [users.id],
  }),
}));

export type MediaAsset = typeof mediaAssets.$inferSelect;
export type InsertMediaAsset = z.infer<typeof insertMediaAssetSchema>;

// ========== JOBS BOARD MODELS ==========

// Employer model
export const employers = pgTable("employers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  website: text("website"),
  logo_url: text("logo_url"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip_code: text("zip_code"),
  contact_email: text("contact_email").notNull(),
  contact_phone: text("contact_phone"),
  user_id: integer("user_id").references(() => users.id),
  is_verified: boolean("is_verified").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertEmployerSchema = createInsertSchema(employers).omit({
  id: true,
  created_at: true,
  updated_at: true,
  is_verified: true,
});

// Job listing model
export const jobListings = pgTable("job_listings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  employer_id: integer("employer_id").notNull().references(() => employers.id),
  description: text("description").notNull(),
  responsibilities: text("responsibilities"),
  requirements: text("requirements"),
  benefits: text("benefits"),
  location: text("location").notNull(),
  job_type: text("job_type").notNull(), // Full-time, Part-time, Contract, etc.
  work_arrangement: text("work_arrangement").notNull(), // On-site, Remote, Hybrid
  specialty: text("specialty").notNull(), // Nursing specialty
  experience_level: text("experience_level").notNull(), // Entry, Mid, Senior
  education_required: text("education_required"), // Degree requirements
  certification_required: text("certification_required").array(), // Required certifications
  shift_type: text("shift_type"), // Day, Night, Rotating
  salary_min: decimal("salary_min", { precision: 10, scale: 2 }),
  salary_max: decimal("salary_max", { precision: 10, scale: 2 }),
  salary_period: text("salary_period").default("annual"), // annual, hourly, etc.
  application_url: text("application_url"),
  contact_email: text("contact_email"),
  is_featured: boolean("is_featured").default(false),
  is_active: boolean("is_active").default(true),
  posted_date: timestamp("posted_date").defaultNow(),
  expiry_date: timestamp("expiry_date"),
  views_count: integer("views_count").default(0),
  applications_count: integer("applications_count").default(0),
});

export const insertJobListingSchema = createInsertSchema(jobListings).omit({
  id: true,
  posted_date: true,
  views_count: true,
  applications_count: true,
});

// Nurse profiles (extension of user profiles)
export const nurseProfiles = pgTable("nurse_profiles", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id).unique(),
  headline: text("headline"),
  summary: text("summary"),
  years_of_experience: integer("years_of_experience"),
  specialties: text("specialties").array(),
  skills: text("skills").array(),
  certifications: jsonb("certifications"),
  education: jsonb("education"),
  resume_url: text("resume_url"),
  profile_image_url: text("profile_image_url"),
  availability: text("availability"),
  preferred_shift: text("preferred_shift"),
  preferred_work_arrangement: text("preferred_work_arrangement"),
  preferred_locations: text("preferred_locations").array(),
  current_employer: text("current_employer"),
  is_public: boolean("is_public").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertNurseProfileSchema = createInsertSchema(nurseProfiles).omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
});

// Job applications
export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  job_id: integer("job_id").notNull().references(() => jobListings.id),
  user_id: integer("user_id").notNull().references(() => users.id),
  cover_letter: text("cover_letter"),
  resume_url: text("resume_url"),
  status: text("status").default("pending"), // pending, reviewed, interviewed, offered, hired, rejected
  application_date: timestamp("application_date").defaultNow(),
  last_updated: timestamp("last_updated").defaultNow(),
  employer_notes: text("employer_notes"),
  is_withdrawn: boolean("is_withdrawn").default(false),
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({
  id: true,
  application_date: true,
  last_updated: true,
  employer_notes: true,
  is_withdrawn: true,
});

// Saved jobs (favorites)
export const savedJobs = pgTable("saved_jobs", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  job_id: integer("job_id").notNull().references(() => jobListings.id),
  saved_date: timestamp("saved_date").defaultNow(),
  notes: text("notes"),
});

export const insertSavedJobSchema = createInsertSchema(savedJobs).omit({
  id: true,
  saved_date: true,
});

// Job alerts for users
export const jobAlerts = pgTable("job_alerts", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  keywords: text("keywords"),
  specialties: text("specialties").array(),
  locations: text("locations").array(),
  job_types: text("job_types").array(),
  experience_levels: text("experience_levels").array(),
  salary_min: decimal("salary_min", { precision: 10, scale: 2 }),
  frequency: text("frequency").default("daily"), // daily, weekly, immediate
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  last_sent: timestamp("last_sent"),
});

export const insertJobAlertSchema = createInsertSchema(jobAlerts).omit({
  id: true,
  created_at: true,
  last_sent: true,
});

// Relations
export const employersRelations = relations(employers, ({ many, one }) => ({
  jobListings: many(jobListings),
  user: one(users, {
    fields: [employers.user_id],
    references: [users.id],
  }),
}));

export const jobListingsRelations = relations(jobListings, ({ one, many }) => ({
  employer: one(employers, {
    fields: [jobListings.employer_id],
    references: [employers.id],
  }),
  applications: many(jobApplications),
  savedBy: many(savedJobs),
}));

export const nurseProfilesRelations = relations(nurseProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [nurseProfiles.user_id],
    references: [users.id],
  }),
  applications: many(jobApplications, { relationName: "profile_applications" }),
  savedJobs: many(savedJobs, { relationName: "profile_saved_jobs" }),
  alerts: many(jobAlerts, { relationName: "profile_job_alerts" }),
}));

export const jobApplicationsRelations = relations(jobApplications, ({ one }) => ({
  job: one(jobListings, {
    fields: [jobApplications.job_id],
    references: [jobListings.id],
  }),
  applicant: one(users, {
    fields: [jobApplications.user_id],
    references: [users.id],
  }),
}));

export const savedJobsRelations = relations(savedJobs, ({ one }) => ({
  job: one(jobListings, {
    fields: [savedJobs.job_id],
    references: [jobListings.id],
  }),
  user: one(users, {
    fields: [savedJobs.user_id],
    references: [users.id],
  }),
}));

export const jobAlertsRelations = relations(jobAlerts, ({ one }) => ({
  user: one(users, {
    fields: [jobAlerts.user_id],
    references: [users.id],
  }),
}));

// Update user relations to include jobs relationships
export const updatedUsersRelations = relations(users, ({ many, one }) => ({
  licenses: many(nurseLicenses),
  tickets: many(tickets),
  profile: one(nurseProfiles, {
    fields: [users.id],
    references: [nurseProfiles.user_id],
  }),
  jobApplications: many(jobApplications),
  savedJobs: many(savedJobs),
  jobAlerts: many(jobAlerts),
  employer: one(employers, {
    fields: [users.id],
    references: [employers.user_id],
  }),
}));

// Job board types
export type Employer = typeof employers.$inferSelect;
export type InsertEmployer = z.infer<typeof insertEmployerSchema>;

export type JobListing = typeof jobListings.$inferSelect;
export type InsertJobListing = z.infer<typeof insertJobListingSchema>;

export type NurseProfile = typeof nurseProfiles.$inferSelect;
export type InsertNurseProfile = z.infer<typeof insertNurseProfileSchema>;

export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;

export type SavedJob = typeof savedJobs.$inferSelect;
export type InsertSavedJob = z.infer<typeof insertSavedJobSchema>;

export type JobAlert = typeof jobAlerts.$inferSelect;
export type InsertJobAlert = z.infer<typeof insertJobAlertSchema>;

// ========== STORE MODELS ==========

// Store Product model
export const storeProducts = pgTable("store_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  image_url: text("image_url"),
  category: text("category").notNull(),
  is_featured: boolean("is_featured").default(false),
  is_available: boolean("is_available").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  stock_quantity: integer("stock_quantity").default(0),
});

export const insertStoreProductSchema = createInsertSchema(storeProducts).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Store Order model
export const storeOrders = pgTable("store_orders", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  total_amount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("pending"), // pending, processing, shipped, delivered, cancelled
  payment_status: text("payment_status").default("pending"), // pending, paid, failed, refunded
  shipping_address: jsonb("shipping_address"),
  contact_email: text("contact_email").notNull(),
  contact_phone: text("contact_phone"),
  tracking_number: text("tracking_number"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertStoreOrderSchema = createInsertSchema(storeOrders).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Store Order Items model (junction table between orders and products)
export const storeOrderItems = pgTable("store_order_items", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id").notNull().references(() => storeOrders.id),
  product_id: integer("product_id").notNull().references(() => storeProducts.id),
  quantity: integer("quantity").notNull().default(1),
  price_at_time: decimal("price_at_time", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertStoreOrderItemSchema = createInsertSchema(storeOrderItems).omit({
  id: true,
  created_at: true,
});

// Relations
export const storeProductsRelations = relations(storeProducts, ({ many }) => ({
  orderItems: many(storeOrderItems),
}));

export const storeOrdersRelations = relations(storeOrders, ({ one, many }) => ({
  user: one(users, {
    fields: [storeOrders.user_id],
    references: [users.id],
  }),
  orderItems: many(storeOrderItems),
}));

export const storeOrderItemsRelations = relations(storeOrderItems, ({ one }) => ({
  order: one(storeOrders, {
    fields: [storeOrderItems.order_id],
    references: [storeOrders.id],
  }),
  product: one(storeProducts, {
    fields: [storeOrderItems.product_id],
    references: [storeProducts.id],
  }),
}));

// Update user relations to include store relationships
export const updatedUsersRelationsWithStore = relations(users, ({ many, one }) => ({
  licenses: many(nurseLicenses),
  tickets: many(tickets),
  profile: one(nurseProfiles, {
    fields: [users.id],
    references: [nurseProfiles.user_id],
  }),
  jobApplications: many(jobApplications),
  savedJobs: many(savedJobs),
  jobAlerts: many(jobAlerts),
  employer: one(employers, {
    fields: [users.id],
    references: [employers.user_id],
  }),
  storeOrders: many(storeOrders),
}));

// Store types
export type StoreProduct = typeof storeProducts.$inferSelect;
export type InsertStoreProduct = z.infer<typeof insertStoreProductSchema>;

export type StoreOrder = typeof storeOrders.$inferSelect;
export type InsertStoreOrder = z.infer<typeof insertStoreOrderSchema>;

export type StoreOrderItem = typeof storeOrderItems.$inferSelect;
export type InsertStoreOrderItem = z.infer<typeof insertStoreOrderItemSchema>;
