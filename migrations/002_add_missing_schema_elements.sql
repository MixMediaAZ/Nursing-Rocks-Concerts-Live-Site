-- Add missing columns and constraints to existing tables
-- This migration adds elements that exist in the database but were missing from the schema

-- Add is_suspended column to users table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_suspended'
    ) THEN
        ALTER TABLE users ADD COLUMN is_suspended BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add deleted_at column to approved_videos table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'approved_videos' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE approved_videos ADD COLUMN deleted_at TIMESTAMP;
    END IF;
END $$;

-- Add unique constraint to approved_videos.public_id (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'approved_videos' 
        AND constraint_name = 'approved_videos_public_id_unique'
    ) THEN
        -- First check if there are any duplicate public_ids
        IF NOT EXISTS (
            SELECT public_id, COUNT(*) 
            FROM approved_videos 
            GROUP BY public_id 
            HAVING COUNT(*) > 1
        ) THEN
            ALTER TABLE approved_videos ADD CONSTRAINT approved_videos_public_id_unique UNIQUE (public_id);
        ELSE
            RAISE EXCEPTION 'Cannot add unique constraint: duplicate public_id values exist';
        END IF;
    END IF;
END $$;
