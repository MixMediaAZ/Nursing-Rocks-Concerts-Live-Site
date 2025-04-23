// Type definitions for shared types across the application

// Gallery item type definition
export interface Gallery {
  id: number;
  image_url: string;
  thumbnail_url: string | null;
  alt_text: string | null;
  event_id: number | null;
  folder_id: number | null;
  media_type: string;
  file_size: number | null;
  dimensions: string | null;
  duration: number | null;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
  z_index: number;
  tags: string[] | null;
  metadata: Record<string, any>;
}

// Event type
export interface Event {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  date: string;
  artist_id: number;
  image_url: string | null;
  start_time: string;
  doors_time: string | null;
  price: string | null;
  is_featured: boolean;
  genre: string | null;
  tickets_url: string | null;
  location: string;
}

// Artist type
export interface Artist {
  id: number;
  name: string;
  bio: string | null;
  image_url: string | null;
  genre: string | null;
  latest_album: string | null;
  social_links: Record<string, string> | null;
  featured_song: string | null;
  song_duration: string | null;
}

// Media Folder type
export interface MediaFolder {
  id: number;
  name: string;
  description: string | null;
  folder_type: string;
  parent_id: number | null;
  created_at: Date;
  updated_at: Date;
  thumbnail_url: string | null;
  sort_order: number;
  is_featured: boolean;
}

// Store Product type
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  is_featured: boolean;
  stock_quantity: number;
  created_at: Date;
  sku: string;
}