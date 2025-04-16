import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
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
