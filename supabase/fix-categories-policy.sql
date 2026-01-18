-- Fix categories RLS policy to allow all trip members to see categories
-- Run this in Supabase SQL Editor

-- Drop existing categories policy
DROP POLICY IF EXISTS "categories_all" ON categories;

-- Create new policy that allows trip members to view/manage categories
-- We check trip_members table which is safe because trip_members policies don't reference categories

CREATE POLICY "categories_select" ON categories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = categories.trip_id
      AND trip_members.user_id = auth.uid()
    )
  );

CREATE POLICY "categories_insert" ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = categories.trip_id
      AND trip_members.user_id = auth.uid()
    )
  );

CREATE POLICY "categories_update" ON categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = categories.trip_id
      AND trip_members.user_id = auth.uid()
    )
  );

CREATE POLICY "categories_delete" ON categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = categories.trip_id
      AND trip_members.user_id = auth.uid()
    )
  );

-- Verify policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'categories';
