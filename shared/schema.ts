import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date, decimal, varchar, uuid } from "drizzle-orm/pg-core";
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
  end_at: timestamp("end_at"),
  artist_id: integer("artist_id").notNull(),
  image_url: text("image_url"),
  start_time: text("start_time").notNull(),
  doors_time: text("doors_time"),
  price: text("price"),
  is_featured: boolean("is_featured").default(false),
  genre: text("genre"),
  tickets_url: text("tickets_url"),
  location: text("location").notNull(), // Main location reference
  slug: text("slug"),
  capacity: integer("capacity"),
  status: text("status").default("published"), // published, active, cancelled, completed, postponed, draft
  ticket_expiration_at: timestamp("ticket_expiration_at"),
  // Ticket availability: not every event has online sales; some presale, some door-only
  has_presale_tickets: boolean("has_presale_tickets").default(false),
  tickets_at_door_only: boolean("tickets_at_door_only").default(false),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
});

export const eventsRelations = relations(events, ({ one }) => ({
  artist: one(artists, {
    fields: [events.artist_id],
    references: [artists.id],
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

// Venue model has been removed

// Media Folders for organizing content
export const mediaFolders = pgTable("media_folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  folder_type: text("folder_type").notNull().default("general"), // slideshow, video, image, music, general
  parent_id: integer("parent_id"), // For nested folders
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  thumbnail_url: text("thumbnail_url"), // Representative image
  sort_order: integer("sort_order").default(0),
  is_featured: boolean("is_featured").default(false),
});

export const insertMediaFolderSchema = createInsertSchema(mediaFolders).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const mediaFoldersRelations = relations(mediaFolders, ({ many, one }) => ({
  parent: one(mediaFolders, {
    fields: [mediaFolders.parent_id],
    references: [mediaFolders.id],
  }),
  children: many(mediaFolders),
  media: many(gallery),
}));

// Gallery model (enhanced for multiple media types)
export const gallery = pgTable("gallery", {
  id: serial("id").primaryKey(),
  image_url: text("image_url").notNull(),
  thumbnail_url: text("thumbnail_url"),
  alt_text: text("alt_text"),
  event_id: integer("event_id"),
  folder_id: integer("folder_id"),
  media_type: text("media_type").notNull().default("image"), // image, video, audio, document
  file_size: integer("file_size"),
  dimensions: text("dimensions"), // For images: "800x600"
  duration: integer("duration"), // For videos/audio: duration in seconds
  sort_order: integer("sort_order").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  z_index: integer("z_index").default(0), // For layering/positioning
  tags: text("tags").array(), // Array of tags for categorization
  metadata: jsonb("metadata"), // Any additional metadata
});

export const insertGallerySchema = createInsertSchema(gallery).omit({
  id: true,
  created_at: true, 
  updated_at: true,
});

export const galleryRelations = relations(gallery, ({ one }) => ({
  event: one(events, {
    fields: [gallery.event_id],
    references: [events.id],
  }),
  folder: one(mediaFolders, {
    fields: [gallery.folder_id],
    references: [mediaFolders.id],
  }),
}));

// Newsletter subscribers
export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  // IMPORTANT: Email must be lowercase and trimmed. Database has case-insensitive unique constraint.
  // All email lookups must normalize: email.toLowerCase().trim()
  // See migration: 004_fix_email_case_insensitive_all_tables.sql
  email: text("email").notNull().unique(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertSubscriberSchema = createInsertSchema(subscribers).omit({
  id: true, 
  created_at: true,
});

// Video Submissions (appreciation videos from users)
export const videoSubmissions = pgTable("video_submissions", {
  id: serial("id").primaryKey(),
  name: text("name"),
  // IMPORTANT: Email should be lowercase and trimmed for case-insensitive consistency.
  // All email values should be normalized: email.toLowerCase().trim()
  email: text("email"),
  location: text("location"),
  connection: text("connection"),
  nurse_name: text("nurse_name"),
  message: text("message"),
  video_url: text("video_url").notNull(),
  video_public_id: text("video_public_id").notNull(),
  // Backblaze (or other) source object key, used for HLS packaging/backfills.
  video_source_key: text("video_source_key"),
  video_duration: integer("video_duration"),
  video_bytes: integer("video_bytes"),
  resource_type: text("resource_type"),
  consent_given: boolean("consent_given").default(false),
  wants_updates: boolean("wants_updates").default(false),
  submitted_at: timestamp("submitted_at").defaultNow(),
  status: text("status").default("pending"),
  admin_notes: text("admin_notes"),
});

export const insertVideoSubmissionSchema = createInsertSchema(videoSubmissions).omit({
  id: true,
  submitted_at: true,
});

// Approved Videos (for content moderation)
export const approvedVideos = pgTable("approved_videos", {
  id: serial("id").primaryKey(),
  public_id: text("public_id").notNull().unique(),
  folder: text("folder"),
  approved: boolean("approved").default(false),
  approved_by: integer("approved_by"),
  approved_at: timestamp("approved_at"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  admin_notes: text("admin_notes"),
  deleted_at: timestamp("deleted_at"), // Soft delete support
});

export const insertApprovedVideoSchema = createInsertSchema(approvedVideos).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type ApprovedVideo = typeof approvedVideos.$inferSelect;
export type InsertApprovedVideo = z.infer<typeof insertApprovedVideoSchema>;

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  // IMPORTANT: Email must be lowercase and trimmed. Database has case-insensitive unique constraint.
  // All email lookups must normalize: email.toLowerCase().trim()
  // See migration: 003_fix_email_case_insensitive.sql
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  is_verified: boolean("is_verified").default(false),
  verified_at: timestamp("verified_at"),
  verification_source: text("verification_source"),
  verification_notes: text("verification_notes"),
  is_admin: boolean("is_admin").default(false),
  is_suspended: boolean("is_suspended").default(false),
  status: text("status").default("active"), // active, suspended, inactive
  reset_token: text("reset_token"),
  reset_token_expires_at: timestamp("reset_token_expires_at"),
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

// Tickets model - COMPLETE SCHEMA WITH ALL FIELDS
export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: integer("user_id").notNull(),
  event_id: integer("event_id").notNull(),
  ticket_code: varchar("ticket_code", { length: 50 }).notNull().unique(),
  // FIX: Use text() for qr_token since JWT tokens can exceed 255 chars (base64 expansion of payload + signature)
  qr_token: text("qr_token").unique(),
  qr_image_url: text("qr_image_url"),
  status: text("status").default("issued"), // issued, checked_in, revoked, expired, reissued
  issued_at: timestamp("issued_at", { withTimezone: true }).defaultNow(),
  emailed_at: timestamp("emailed_at", { withTimezone: true }),
  expires_at: timestamp("expires_at", { withTimezone: true }),
  checked_in_at: timestamp("checked_in_at", { withTimezone: true }),
  revoked_at: timestamp("revoked_at", { withTimezone: true }),
  revoke_reason: text("revoke_reason"),
  reissued_from_ticket_id: uuid("reissued_from_ticket_id"),
  first_scan_ip: varchar("first_scan_ip", { length: 45 }),
  first_scan_user_agent: text("first_scan_user_agent"),
  first_scan_device_fingerprint: text("first_scan_device_fingerprint"),
  last_scan_at: timestamp("last_scan_at", { withTimezone: true }),
  scan_count: integer("scan_count").default(0),
  email_status: text("email_status").default("pending"), // pending, sent, simulated, failed, bounced
  email_error: text("email_error"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  // Legacy fields for compatibility
  purchase_date: timestamp("purchase_date"),
  ticket_type: text("ticket_type"),
  price: text("price"),
  is_used: boolean("is_used"),
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  issued_at: true,
  emailed_at: true,
  checked_in_at: true,
  revoked_at: true,
  created_at: true,
  updated_at: true,
  last_scan_at: true,
});

// Ticket Scan Logs
export const ticketScanLogs = pgTable("ticket_scan_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticket_id: uuid("ticket_id").notNull(),
  user_id: integer("user_id"),
  event_id: integer("event_id").notNull(),
  scanned_at: timestamp("scanned_at", { withTimezone: true }).defaultNow(),
  scanner_user_id: integer("scanner_user_id"),
  scanner_device_id: varchar("scanner_device_id", { length: 255 }),
  ip_address: varchar("ip_address", { length: 45 }),
  user_agent: text("user_agent"),
  device_fingerprint: text("device_fingerprint"),
  result: text("result"), // success, invalid, expired, revoked, duplicate
  reason: text("reason"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertTicketScanLogSchema = createInsertSchema(ticketScanLogs).omit({
  id: true,
  scanned_at: true,
  created_at: true,
});

// Verification Audit Logs
export const verificationAuditLogs = pgTable("verification_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: integer("user_id").notNull(),
  admin_user_id: integer("admin_user_id"),
  action: text("action").notNull(), // verified, unverified, suspended, reinstated
  previous_verified_state: boolean("previous_verified_state"),
  new_verified_state: boolean("new_verified_state"),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertVerificationAuditLogSchema = createInsertSchema(verificationAuditLogs).omit({
  id: true,
  created_at: true,
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
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

// Venue types removed

export type Gallery = typeof gallery.$inferSelect;
export type InsertGallery = z.infer<typeof insertGallerySchema>;

export type MediaFolder = typeof mediaFolders.$inferSelect;
export type InsertMediaFolder = z.infer<typeof insertMediaFolderSchema>;

export type Subscriber = typeof subscribers.$inferSelect;
export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type NurseLicense = typeof nurseLicenses.$inferSelect;
export type InsertNurseLicense = z.infer<typeof insertNurseLicenseSchema>;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

export type TicketScanLog = typeof ticketScanLogs.$inferSelect;
export type InsertTicketScanLog = z.infer<typeof insertTicketScanLogSchema>;

export type VerificationAuditLog = typeof verificationAuditLogs.$inferSelect;
export type InsertVerificationAuditLog = z.infer<typeof insertVerificationAuditLogSchema>;

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
  company_name: text("company_name"),
  name: text("name").notNull(),
  description: text("description"),
  website: text("website"),
  logo_url: text("logo_url"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip_code: text("zip_code"),
  // IMPORTANT: Contact email should be lowercase and trimmed for case-insensitive consistency.
  // All contact_email values must be normalized: email.toLowerCase().trim()
  contact_email: text("contact_email").notNull(),
  contact_phone: text("contact_phone"),
  user_id: integer("user_id").references(() => users.id),
  is_verified: boolean("is_verified").default(false),
  account_status: text("account_status").default("pending"), // pending, active, suspended
  job_post_credits: integer("job_post_credits").default(0),
  job_post_pass_expires_at: timestamp("job_post_pass_expires_at"),
  job_post_lifetime: boolean("job_post_lifetime").default(false),
  job_post_options: jsonb("job_post_options"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertEmployerSchema = createInsertSchema(employers).omit({
  id: true,
  created_at: true,
  updated_at: true,
  is_verified: true,
  account_status: true,
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
  // IMPORTANT: Contact email should be lowercase and trimmed for case-insensitive consistency.
  // All contact_email values must be normalized: email.toLowerCase().trim()
  contact_email: text("contact_email"),
  is_featured: boolean("is_featured").default(false),
  is_active: boolean("is_active").default(true),
  posted_date: timestamp("posted_date").defaultNow(),
  expiry_date: timestamp("expiry_date"),
  views_count: integer("views_count").default(0),
  applications_count: integer("applications_count").default(0),
  is_approved: boolean("is_approved").default(false),
  approved_by: integer("approved_by").references(() => users.id),
  approved_at: timestamp("approved_at"),
  approval_notes: text("approval_notes"),
  // Source tracking (Phase 1 ingestion)
  source_name: text("source_name"), // e.g., 'phoenixchildrens'
  source_job_id: text("source_job_id"), // ID from external source
  source_url: text("source_url"), // Direct URL to job posting
  source_type: text("source_type"), // 'scraped', 'api', etc.
  source_content_hash: text("source_content_hash"), // SHA256 of content for dedup
  // Location normalization (Phase 1)
  location_raw: text("location_raw"), // Raw location string from source
  location_city: text("location_city"), // Extracted city
  location_state: text("location_state"), // Extracted state/province
  location_postal_code: text("location_postal_code"), // Extracted ZIP/postal code
  is_remote: boolean("is_remote"), // Whether job is remote-eligible
  // Sync tracking
  first_seen_at: timestamp("first_seen_at"), // When first ingested
  last_seen_at: timestamp("last_seen_at"), // When last confirmed in listing
  last_synced_at: timestamp("last_synced_at"), // When data was last updated
  sync_status: text("sync_status"), // 'active', 'archived', 'pending'
  // Quality tracking
  data_quality_score: integer("data_quality_score"), // 0-100 quality rating
  manual_review_required: boolean("manual_review_required").default(false),
  // Specialty normalization
  normalized_specialty_id: integer("normalized_specialty_id"), // FK to job_specialties
  normalized_role_level: text("normalized_role_level"), // Normalized role/level from extraction
});

export const insertJobListingSchema = createInsertSchema(jobListings).omit({
  id: true,
  posted_date: true,
  views_count: true,
  applications_count: true,
  is_approved: true,
  approved_by: true,
  approved_at: true,
  approval_notes: true,
});

// Contact requests (employer requests for applicant contact info)
export const contactRequests = pgTable("contact_requests", {
  id: serial("id").primaryKey(),
  application_id: integer("application_id").notNull().references(() => jobApplications.id, { onDelete: "cascade" }),
  employer_id: integer("employer_id").notNull().references(() => employers.id, { onDelete: "cascade" }),
  requested_at: timestamp("requested_at").defaultNow(),
  status: text("status").default("pending"), // pending, approved, denied
  reviewed_at: timestamp("reviewed_at"),
  reviewed_by: integer("reviewed_by").references(() => users.id),
  admin_notes: text("admin_notes"),
  denial_reason: text("denial_reason"),
  expires_at: timestamp("expires_at"),
  contact_revealed_at: timestamp("contact_revealed_at"),
});

export const insertContactRequestSchema = createInsertSchema(contactRequests).omit({
  id: true,
  requested_at: true,
  reviewed_at: true,
  contact_revealed_at: true,
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
  contactRequests: many(contactRequests),
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

export const jobApplicationsRelations = relations(jobApplications, ({ one, many }) => ({
  job: one(jobListings, {
    fields: [jobApplications.job_id],
    references: [jobListings.id],
  }),
  applicant: one(users, {
    fields: [jobApplications.user_id],
    references: [users.id],
  }),
  contactRequests: many(contactRequests, { relationName: "application_contact_requests" }),
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

export const contactRequestsRelations = relations(contactRequests, ({ one }) => ({
  application: one(jobApplications, {
    fields: [contactRequests.application_id],
    references: [jobApplications.id],
    relationName: "application_contact_requests",
  }),
  employer: one(employers, {
    fields: [contactRequests.employer_id],
    references: [employers.id],
  }),
  reviewer: one(users, {
    fields: [contactRequests.reviewed_by],
    references: [users.id],
  }),
}));

// Update user relations to include jobs relationships
// Note: usersRelations consolidated above with all relationships

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

export type ContactRequest = typeof contactRequests.$inferSelect;
export type InsertContactRequest = z.infer<typeof insertContactRequestSchema>;

// ========== STORE MODELS ==========

// App Settings model for storing configuration
export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  description: text("description"),
  is_sensitive: boolean("is_sensitive").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertAppSettingSchema = createInsertSchema(appSettings).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type AppSetting = typeof appSettings.$inferSelect;
export type InsertAppSetting = z.infer<typeof insertAppSettingSchema>;

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
  external_id: text("external_id"),
  external_source: text("external_source"),
  metadata: jsonb("metadata"),
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
  // IMPORTANT: Contact email should be lowercase and trimmed for case-insensitive consistency.
  // All contact_email values must be normalized: email.toLowerCase().trim()
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

// ========== SPONSORSHIPS TABLE ==========
export const sponsorships = pgTable("sponsorships", {
  id: serial("id").primaryKey(),
  amount_cents: integer("amount_cents").notNull(),
  tier: text("tier").notNull(), // marquee, premium, silent-auction, donation, custom
  donor_name: text("donor_name").notNull(),
  donor_email: text("donor_email").notNull(), // MUST normalize: toLowerCase().trim()
  is_anonymous: boolean("is_anonymous").default(false),
  payment_intent_id: text("payment_intent_id").notNull().unique(),
  status: text("status").default("pending"), // pending, succeeded, failed
  payment_status: text("payment_status").default("pending"), // pending, paid
  metadata: jsonb("metadata"), // {message, company_name}
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertSponsorshipSchema = createInsertSchema(sponsorships).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Update user relations to include store relationships
// Note: usersRelations consolidated above with all relationships including storeOrders

// Store types
export type StoreProduct = typeof storeProducts.$inferSelect;
export type InsertStoreProduct = z.infer<typeof insertStoreProductSchema>;

export type StoreOrder = typeof storeOrders.$inferSelect;
export type InsertStoreOrder = z.infer<typeof insertStoreOrderSchema>;

export type StoreOrderItem = typeof storeOrderItems.$inferSelect;
export type InsertStoreOrderItem = z.infer<typeof insertStoreOrderItemSchema>;

export type Sponsorship = typeof sponsorships.$inferSelect;
export type InsertSponsorship = z.infer<typeof insertSponsorshipSchema>;

export type VideoSubmission = typeof videoSubmissions.$inferSelect;
export type InsertVideoSubmission = z.infer<typeof insertVideoSubmissionSchema>;

// ========== NRPX PHOENIX NURSE REGISTRATION ==========

export const nrpxRegistrations = pgTable("nrpx_registrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticket_code: varchar("ticket_code", { length: 14 }).unique().notNull(),
  first_name: varchar("first_name", { length: 100 }).notNull(),
  last_name: varchar("last_name", { length: 100 }).notNull(),
  // IMPORTANT: Email must be lowercase and trimmed. Database has case-insensitive unique constraint.
  // All email lookups must normalize: email.toLowerCase().trim()
  // See migration: 004_fix_email_case_insensitive_all_tables.sql
  email: varchar("email", { length: 255 }).notNull().unique(),
  employer: varchar("employer", { length: 255 }),
  // Reference to users table - admin approval workflow creates user account for each NRPX registration
  // NULLABLE to preserve existing 6 pre-workflow registrations; new registrations will have user_id
  user_id: integer("user_id").references(() => users.id),
  registered_at: timestamp("registered_at", { withTimezone: true }).defaultNow(),
  checked_in: boolean("checked_in").default(false),
  checked_in_at: timestamp("checked_in_at", { withTimezone: true }),
  // email_sent now tracks welcome email (sent on admin approval)
  email_sent: boolean("email_sent").default(false),
  email_sent_at: timestamp("email_sent_at", { withTimezone: true }),
  // ticket_email_sent tracks if ticket email with QR was sent on claim
  ticket_email_sent: boolean("ticket_email_sent").default(false),
  ticket_email_sent_at: timestamp("ticket_email_sent_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertNrpxRegistrationSchema = createInsertSchema(nrpxRegistrations).omit({
  id: true,
  user_id: true, // Server-generated when user account is created on approval
  registered_at: true,
  checked_in: true,
  checked_in_at: true,
  email_sent: true,
  email_sent_at: true,
  ticket_email_sent: true,
  ticket_email_sent_at: true,
  created_at: true,
});

export type NrpxRegistration = typeof nrpxRegistrations.$inferSelect;
export type InsertNrpxRegistration = z.infer<typeof insertNrpxRegistrationSchema>;

// ============= JOBS INGESTION (Phase 1 & 2) =============

// Job specialties reference table
export const jobSpecialties = pgTable("job_specialties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow(),
});

export type JobSpecialty = typeof jobSpecialties.$inferSelect;
export type InsertJobSpecialty = typeof jobSpecialties.$inferInsert;

// Job tags (skills, certifications, etc.)
export const jobTags = pgTable("job_tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category"), // 'skill', 'certification', 'requirement'
  created_at: timestamp("created_at").defaultNow(),
});

export type JobTag = typeof jobTags.$inferSelect;
export type InsertJobTag = typeof jobTags.$inferInsert;

// Job to tags mapping with confidence scores
export const jobTagMap = pgTable("job_tag_map", {
  id: serial("id").primaryKey(),
  job_id: integer("job_id").notNull().references(() => jobListings.id, { onDelete: "cascade" }),
  tag_id: integer("tag_id").notNull().references(() => jobTags.id, { onDelete: "cascade" }),
  confidence_score: decimal("confidence_score", { precision: 3, scale: 2 }), // 0.00-1.00
  inferred_from: text("inferred_from"), // 'extracted', 'inferred', 'manual'
  created_at: timestamp("created_at").defaultNow(),
});

export type JobTagMapping = typeof jobTagMap.$inferSelect;
export type InsertJobTagMapping = typeof jobTagMap.$inferInsert;

// Ingestion runs tracking
export const jobIngestionRuns = pgTable("job_ingestion_runs", {
  id: serial("id").primaryKey(),
  source_name: text("source_name").notNull(), // 'phoenixchildrens', etc.
  status: text("status").notNull(), // 'in_progress', 'success', 'partial', 'failed'
  jobs_fetched: integer("jobs_fetched").default(0),
  jobs_parsed: integer("jobs_parsed").default(0),
  jobs_inserted: integer("jobs_inserted").default(0),
  jobs_updated: integer("jobs_updated").default(0),
  jobs_skipped: integer("jobs_skipped").default(0),
  jobs_archived: integer("jobs_archived").default(0),
  errors_count: integer("errors_count").default(0),
  error_log: text("error_log").array(), // Array of error messages
  started_at: timestamp("started_at").notNull(),
  completed_at: timestamp("completed_at"),
  duration_seconds: integer("duration_seconds"),
  created_at: timestamp("created_at").defaultNow(),
});

export type JobIngestionRun = typeof jobIngestionRuns.$inferSelect;
export type InsertJobIngestionRun = typeof jobIngestionRuns.$inferInsert;

// Source page tracking (for detecting listing page changes)
export const jobSourcePages = pgTable("job_source_pages", {
  id: serial("id").primaryKey(),
  source_name: text("source_name").notNull(),
  page_url: text("page_url").notNull(),
  page_hash: text("page_hash"), // SHA256 of listing page content
  job_count: integer("job_count"), // Number of jobs on last fetch
  status: text("status"), // 'active', 'changed', 'error'
  fetched_at: timestamp("fetched_at").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
});

export type JobSourcePage = typeof jobSourcePages.$inferSelect;
export type InsertJobSourcePage = typeof jobSourcePages.$inferInsert;

// Type exports for JobListing with ingestion columns
export type JobListing = typeof jobListings.$inferSelect;
export type InsertJobListing = typeof jobListings.$inferInsert;
