-- Drop existing users table if it exists (WARNING: This will delete all data)
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with correct structure
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  last_name TEXT,
  first_name TEXT,
  email TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  line_channel_access_token TEXT,
  line_channel_secret TEXT,
  ai_settings JSONB,
  ai_enabled BOOLEAN DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own data
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Create policy: Users can insert their own data
CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create policy: Users can update their own data
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Create policy: Users can delete their own data
CREATE POLICY "Users can delete own data"
  ON users FOR DELETE
  USING (auth.uid() = id);

-- Create index on username for faster lookups
CREATE INDEX idx_users_username ON users(username);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);

-- Insert existing user data from auth.users if needed
-- This will create a user record for the current authenticated user
-- You may need to run this separately after registration
