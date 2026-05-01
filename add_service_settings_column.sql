-- Add service_settings JSONB column to settings table
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS service_settings JSONB DEFAULT '{"categories": [], "services": []}'::jsonb;
