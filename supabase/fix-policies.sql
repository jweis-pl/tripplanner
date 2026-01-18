-- Fix RLS Policies - Removes infinite recursion
-- Run this in your Supabase SQL Editor

-- ============================================
-- DROP ALL EXISTING POLICIES
-- ============================================

-- Drop trips policies
DROP POLICY IF EXISTS "Users can view their trips" ON trips;
DROP POLICY IF EXISTS "Users can create trips" ON trips;
DROP POLICY IF EXISTS "Owners can update trips" ON trips;
DROP POLICY IF EXISTS "Owners can delete trips" ON trips;

-- Drop trip_members policies
DROP POLICY IF EXISTS "Users can view trip members" ON trip_members;
DROP POLICY IF EXISTS "Users can add themselves as members" ON trip_members;
DROP POLICY IF EXISTS "Owners can manage members" ON trip_members;

-- Drop categories policies
DROP POLICY IF EXISTS "Users can view categories" ON categories;
DROP POLICY IF EXISTS "Members can create categories" ON categories;
DROP POLICY IF EXISTS "Members can update categories" ON categories;
DROP POLICY IF EXISTS "Owners can delete categories" ON categories;

-- Drop invitations policies
DROP POLICY IF EXISTS "Users can view invitations" ON invitations;
DROP POLICY IF EXISTS "Owners can create invitations" ON invitations;

-- ============================================
-- NEW TRIPS POLICIES (Simple, no recursion)
-- ============================================

-- Anyone authenticated can create a trip
CREATE POLICY "trips_insert" ON trips
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Users can view trips they created
CREATE POLICY "trips_select_owner" ON trips
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

-- Users can update trips they created
CREATE POLICY "trips_update" ON trips
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Users can delete trips they created
CREATE POLICY "trips_delete" ON trips
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- ============================================
-- NEW TRIP_MEMBERS POLICIES (No self-reference!)
-- ============================================

-- Users can view their own memberships
CREATE POLICY "trip_members_select_own" ON trip_members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert themselves as members
CREATE POLICY "trip_members_insert" ON trip_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Trip creators can manage all members (check via trips table, not trip_members)
CREATE POLICY "trip_members_update_by_owner" ON trip_members
  FOR UPDATE
  TO authenticated
  USING (
    trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid())
  );

CREATE POLICY "trip_members_delete_by_owner" ON trip_members
  FOR DELETE
  TO authenticated
  USING (
    trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid())
  );

-- ============================================
-- NEW CATEGORIES POLICIES
-- ============================================

-- Users can view categories for trips they created
CREATE POLICY "categories_select" ON categories
  FOR SELECT
  TO authenticated
  USING (
    trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid())
  );

-- Users can create categories for trips they created
CREATE POLICY "categories_insert" ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid())
  );

-- Users can update categories for trips they created
CREATE POLICY "categories_update" ON categories
  FOR UPDATE
  TO authenticated
  USING (
    trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid())
  );

-- Users can delete categories for trips they created
CREATE POLICY "categories_delete" ON categories
  FOR DELETE
  TO authenticated
  USING (
    trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid())
  );

-- ============================================
-- NEW INVITATIONS POLICIES
-- ============================================

-- Users can view invitations for trips they created
CREATE POLICY "invitations_select" ON invitations
  FOR SELECT
  TO authenticated
  USING (
    trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid())
  );

-- Users can create invitations for trips they created
CREATE POLICY "invitations_insert" ON invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid())
  );

-- Users can delete invitations for trips they created
CREATE POLICY "invitations_delete" ON invitations
  FOR DELETE
  TO authenticated
  USING (
    trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid())
  );
