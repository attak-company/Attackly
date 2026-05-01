-- Add time_settings JSONB column to settings table
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS time_settings JSONB DEFAULT '{}'::jsonb;
