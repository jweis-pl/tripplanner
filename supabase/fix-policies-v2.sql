-- Fix RLS Policies v2 - Complete Reset
-- Run this in your Supabase SQL Editor

-- ============================================
-- STEP 1: DROP ALL POLICIES (by querying system catalog)
-- ============================================

DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on trips
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'trips'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON trips', pol.policyname);
    END LOOP;

    -- Drop all policies on trip_members
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'trip_members'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON trip_members', pol.policyname);
    END LOOP;

    -- Drop all policies on categories
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'categories'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON categories', pol.policyname);
    END LOOP;

    -- Drop all policies on invitations
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'invitations'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON invitations', pol.policyname);
    END LOOP;
END $$;

-- ============================================
-- STEP 2: Verify RLS is enabled
-- ============================================
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Create SIMPLE policies (no subqueries that could recurse)
-- ============================================

-- TRIPS: Users can do everything with trips they created
CREATE POLICY "trips_all" ON trips
  FOR ALL
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- TRIP_MEMBERS: Users can insert themselves, view/manage their own memberships
CREATE POLICY "trip_members_insert_self" ON trip_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trip_members_select_self" ON trip_members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "trip_members_delete_self" ON trip_members
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- CATEGORIES: Based on trip ownership (via trips table, not trip_members)
CREATE POLICY "categories_all" ON categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = categories.trip_id AND trips.created_by = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = categories.trip_id AND trips.created_by = auth.uid())
  );

-- INVITATIONS: Based on trip ownership (via trips table, not trip_members)
CREATE POLICY "invitations_all" ON invitations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = invitations.trip_id AND trips.created_by = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = invitations.trip_id AND trips.created_by = auth.uid())
  );

-- ============================================
-- STEP 4: Verify policies were created
-- ============================================
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('trips', 'trip_members', 'categories', 'invitations')
ORDER BY tablename, policyname;
