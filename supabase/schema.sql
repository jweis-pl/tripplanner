-- TripPlanner Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TRIPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TRIP MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trip_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📌',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INVITATIONS TABLE (for future invitation system)
-- ============================================
CREATE TABLE IF NOT EXISTS invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, email)
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- TRIPS POLICIES
-- Users can view trips they are members of
CREATE POLICY "Users can view their trips" ON trips
  FOR SELECT USING (
    id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())
  );

-- Users can create trips
CREATE POLICY "Users can create trips" ON trips
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Trip owners can update their trips
CREATE POLICY "Owners can update trips" ON trips
  FOR UPDATE USING (
    id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid() AND role = 'owner')
  );

-- Trip owners can delete their trips
CREATE POLICY "Owners can delete trips" ON trips
  FOR DELETE USING (
    id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid() AND role = 'owner')
  );

-- TRIP MEMBERS POLICIES
-- Users can view members of trips they belong to
CREATE POLICY "Users can view trip members" ON trip_members
  FOR SELECT USING (
    trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())
  );

-- Users can add themselves as members (for trip creation)
CREATE POLICY "Users can add themselves as members" ON trip_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Owners can add/remove members
CREATE POLICY "Owners can manage members" ON trip_members
  FOR ALL USING (
    trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid() AND role = 'owner')
  );

-- CATEGORIES POLICIES
-- Users can view categories for their trips
CREATE POLICY "Users can view categories" ON categories
  FOR SELECT USING (
    trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())
  );

-- Trip members can create categories
CREATE POLICY "Members can create categories" ON categories
  FOR INSERT WITH CHECK (
    trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())
  );

-- Trip members can update categories
CREATE POLICY "Members can update categories" ON categories
  FOR UPDATE USING (
    trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())
  );

-- Owners can delete categories
CREATE POLICY "Owners can delete categories" ON categories
  FOR DELETE USING (
    trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- INVITATIONS POLICIES
-- Users can view invitations for their trips
CREATE POLICY "Users can view invitations" ON invitations
  FOR SELECT USING (
    trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Trip owners/admins can create invitations
CREATE POLICY "Owners can create invitations" ON invitations
  FOR INSERT WITH CHECK (
    trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================
-- INDEXES for better query performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_trips_created_by ON trips(created_by);
CREATE INDEX IF NOT EXISTS idx_trip_members_trip_id ON trip_members(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_user_id ON trip_members(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_trip_id ON categories(trip_id);
CREATE INDEX IF NOT EXISTS idx_invitations_trip_id ON invitations(trip_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
