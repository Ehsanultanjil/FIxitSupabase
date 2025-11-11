-- Supabase Database Schema for Campus Reporting System
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/_/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'staff', 'admin')),
  student_id TEXT UNIQUE,
  staff_id TEXT UNIQUE,
  profile_image TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location JSONB NOT NULL,
  photo TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT NOT NULL CHECK (status IN ('pending', 'in-progress', 'completed', 'resolved', 'rejected')) DEFAULT 'pending',
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  assigned_to TEXT,
  assigned_to_name TEXT,
  was_ever_assigned BOOLEAN DEFAULT FALSE,
  upvotes_count INTEGER DEFAULT 0,
  rejection_note TEXT,
  assignment_note TEXT,
  status_notes JSONB DEFAULT '[]'::jsonb,
  conversation_notes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_users_staff_id ON users(staff_id);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_reports_created_by ON reports(created_by);
CREATE INDEX idx_reports_assigned_to ON reports(assigned_to);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_created_by_created_at ON reports(created_by, created_at DESC);
CREATE INDEX idx_reports_assigned_to_created_at ON reports(assigned_to, created_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Allow users to read their own data
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Allow admins to view all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for reports table
-- Users can view their own reports
CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT USING (created_by = auth.uid());

-- Staff can view assigned reports
CREATE POLICY "Staff can view assigned reports" ON reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'staff' AND staff_id = reports.assigned_to
    )
  );

-- Admins can view all reports
CREATE POLICY "Admins can view all reports" ON reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Students can view public reports (pending, in-progress, completed, resolved)
CREATE POLICY "Students can view public reports" ON reports
  FOR SELECT USING (
    status IN ('pending', 'in-progress', 'completed', 'resolved') AND
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'student'
    )
  );

-- Users can create reports
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Admins and staff can update reports
CREATE POLICY "Admins can update reports" ON reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores user information including students, staff, and admins';
COMMENT ON TABLE reports IS 'Stores campus maintenance and issue reports';

COMMENT ON COLUMN users.role IS 'User role: student, staff, or admin';
COMMENT ON COLUMN users.student_id IS 'Unique student ID for students (e.g., 22235103189)';
COMMENT ON COLUMN users.staff_id IS 'Unique staff ID for staff members (e.g., 5551, 5552)';

COMMENT ON COLUMN reports.status IS 'Report status: pending, in-progress, completed, resolved, or rejected';
COMMENT ON COLUMN reports.priority IS 'Report priority level: low, medium, high, or urgent';
COMMENT ON COLUMN reports.location IS 'JSON object with building and room information';
COMMENT ON COLUMN reports.conversation_notes IS 'Array of conversation messages between staff and admin';
COMMENT ON COLUMN reports.status_notes IS 'Array of status update notes (legacy system)';
