CREATE TABLE "app_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"description" text,
	"is_sensitive" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "app_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "approved_videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" text NOT NULL,
	"folder" text,
	"approved" boolean DEFAULT false,
	"approved_by" integer,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"admin_notes" text,
	"deleted_at" timestamp,
	CONSTRAINT "approved_videos_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "artists" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"bio" text,
	"image_url" text,
	"genre" text,
	"latest_album" text,
	"social_links" jsonb,
	"featured_song" text,
	"song_duration" text
);
--> statement-breakpoint
CREATE TABLE "contact_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"employer_id" integer NOT NULL,
	"requested_at" timestamp DEFAULT now(),
	"status" text DEFAULT 'pending',
	"reviewed_at" timestamp,
	"reviewed_by" integer,
	"admin_notes" text,
	"denial_reason" text,
	"expires_at" timestamp,
	"contact_revealed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "employers" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_name" text,
	"name" text NOT NULL,
	"description" text,
	"website" text,
	"logo_url" text,
	"address" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"contact_email" text NOT NULL,
	"contact_phone" text,
	"user_id" integer,
	"is_verified" boolean DEFAULT false,
	"account_status" text DEFAULT 'pending',
	"job_post_credits" integer DEFAULT 0,
	"job_post_pass_expires_at" timestamp,
	"job_post_lifetime" boolean DEFAULT false,
	"job_post_options" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"description" text,
	"date" timestamp NOT NULL,
	"artist_id" integer NOT NULL,
	"image_url" text,
	"start_time" text NOT NULL,
	"doors_time" text,
	"price" text,
	"is_featured" boolean DEFAULT false,
	"genre" text,
	"tickets_url" text,
	"location" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery" (
	"id" serial PRIMARY KEY NOT NULL,
	"image_url" text NOT NULL,
	"thumbnail_url" text,
	"alt_text" text,
	"event_id" integer,
	"folder_id" integer,
	"media_type" text DEFAULT 'image' NOT NULL,
	"file_size" integer,
	"dimensions" text,
	"duration" integer,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"z_index" integer DEFAULT 0,
	"tags" text[],
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "job_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"keywords" text,
	"specialties" text[],
	"locations" text[],
	"job_types" text[],
	"experience_levels" text[],
	"salary_min" numeric(10, 2),
	"frequency" text DEFAULT 'daily',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"last_sent" timestamp
);
--> statement-breakpoint
CREATE TABLE "job_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"cover_letter" text,
	"resume_url" text,
	"status" text DEFAULT 'pending',
	"application_date" timestamp DEFAULT now(),
	"last_updated" timestamp DEFAULT now(),
	"employer_notes" text,
	"is_withdrawn" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "job_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"employer_id" integer NOT NULL,
	"description" text NOT NULL,
	"responsibilities" text,
	"requirements" text,
	"benefits" text,
	"location" text NOT NULL,
	"job_type" text NOT NULL,
	"work_arrangement" text NOT NULL,
	"specialty" text NOT NULL,
	"experience_level" text NOT NULL,
	"education_required" text,
	"certification_required" text[],
	"shift_type" text,
	"salary_min" numeric(10, 2),
	"salary_max" numeric(10, 2),
	"salary_period" text DEFAULT 'annual',
	"application_url" text,
	"contact_email" text,
	"is_featured" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"posted_date" timestamp DEFAULT now(),
	"expiry_date" timestamp,
	"views_count" integer DEFAULT 0,
	"applications_count" integer DEFAULT 0,
	"is_approved" boolean DEFAULT false,
	"approved_by" integer,
	"approved_at" timestamp,
	"approval_notes" text
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"type" text DEFAULT 'other' NOT NULL,
	"title" text,
	"alt" text,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"user_id" integer,
	"filesize" integer,
	"filename" text,
	"originalname" text,
	"mimetype" text
);
--> statement-breakpoint
CREATE TABLE "media_folders" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"folder_type" text DEFAULT 'general' NOT NULL,
	"parent_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"thumbnail_url" text,
	"sort_order" integer DEFAULT 0,
	"is_featured" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "nurse_licenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"license_number" text NOT NULL,
	"state" text NOT NULL,
	"expiration_date" date NOT NULL,
	"status" text DEFAULT 'pending',
	"verification_date" timestamp,
	"verification_source" text,
	"verification_result" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "nurse_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"headline" text,
	"summary" text,
	"years_of_experience" integer,
	"specialties" text[],
	"skills" text[],
	"certifications" jsonb,
	"education" jsonb,
	"resume_url" text,
	"profile_image_url" text,
	"availability" text,
	"preferred_shift" text,
	"preferred_work_arrangement" text,
	"preferred_locations" text[],
	"current_employer" text,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "nurse_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "saved_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"job_id" integer NOT NULL,
	"saved_date" timestamp DEFAULT now(),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "store_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price_at_time" numeric(10, 2) NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "store_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending',
	"payment_status" text DEFAULT 'pending',
	"shipping_address" jsonb,
	"contact_email" text NOT NULL,
	"contact_phone" text,
	"tracking_number" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "store_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"image_url" text,
	"category" text NOT NULL,
	"is_featured" boolean DEFAULT false,
	"is_available" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"stock_quantity" integer DEFAULT 0,
	"external_id" text,
	"external_source" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"event_id" integer NOT NULL,
	"purchase_date" timestamp DEFAULT now(),
	"ticket_type" text NOT NULL,
	"price" text NOT NULL,
	"is_used" boolean DEFAULT false,
	"ticket_code" text NOT NULL,
	CONSTRAINT "tickets_ticket_code_unique" UNIQUE("ticket_code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"is_verified" boolean DEFAULT false,
	"is_admin" boolean DEFAULT false,
	"is_suspended" boolean DEFAULT false,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "video_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"location" text,
	"connection" text,
	"nurse_name" text,
	"message" text,
	"video_url" text NOT NULL,
	"video_public_id" text NOT NULL,
	"video_source_key" text,
	"video_duration" integer,
	"video_bytes" integer,
	"resource_type" text,
	"consent_given" boolean DEFAULT false,
	"wants_updates" boolean DEFAULT false,
	"submitted_at" timestamp DEFAULT now(),
	"status" text DEFAULT 'pending',
	"admin_notes" text
);
--> statement-breakpoint
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_application_id_job_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."job_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_employer_id_employers_id_fk" FOREIGN KEY ("employer_id") REFERENCES "public"."employers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employers" ADD CONSTRAINT "employers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_alerts" ADD CONSTRAINT "job_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_id_job_listings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_listings" ADD CONSTRAINT "job_listings_employer_id_employers_id_fk" FOREIGN KEY ("employer_id") REFERENCES "public"."employers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_listings" ADD CONSTRAINT "job_listings_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nurse_profiles" ADD CONSTRAINT "nurse_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_job_id_job_listings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_order_items" ADD CONSTRAINT "store_order_items_order_id_store_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."store_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_order_items" ADD CONSTRAINT "store_order_items_product_id_store_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."store_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_orders" ADD CONSTRAINT "store_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;