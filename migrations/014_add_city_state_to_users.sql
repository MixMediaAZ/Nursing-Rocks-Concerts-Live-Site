-- Add city and state fields to users table
ALTER TABLE "users" ADD COLUMN "city" text;
ALTER TABLE "users" ADD COLUMN "state" text;
