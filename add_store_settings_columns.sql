-- Add store_setting JSONB column to settings table
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS store_setting JSONB DEFAULT '{}'::jsonb;
