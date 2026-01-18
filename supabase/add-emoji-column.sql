-- Add missing emoji column to categories table
-- Run this in Supabase SQL Editor

ALTER TABLE categories ADD COLUMN IF NOT EXISTS emoji TEXT NOT NULL DEFAULT '📌';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'categories';
