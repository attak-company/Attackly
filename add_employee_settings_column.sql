-- Add employee_settings JSONB column to settings table
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS employee_settings JSONB DEFAULT '{}'::jsonb;
