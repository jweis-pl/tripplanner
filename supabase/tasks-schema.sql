-- Tasks Table Schema
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow trip members to manage tasks
CREATE POLICY "tasks_select" ON tasks
  FOR SELECT
  TO authenticated
  USING (
    category_id IN (
      SELECT c.id FROM categories c
      JOIN trip_members tm ON tm.trip_id = c.trip_id
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    category_id IN (
      SELECT c.id FROM categories c
      JOIN trip_members tm ON tm.trip_id = c.trip_id
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    category_id IN (
      SELECT c.id FROM categories c
      JOIN trip_members tm ON tm.trip_id = c.trip_id
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE
  TO authenticated
  USING (
    category_id IN (
      SELECT c.id FROM categories c
      JOIN trip_members tm ON tm.trip_id = c.trip_id
      WHERE tm.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Verify table was created
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks'
ORDER BY ordinal_position;
