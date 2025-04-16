import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date } from "drizzle-orm/pg-core";
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
