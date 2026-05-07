-- Add business_hours JSONB column to settings table
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '[]'::jsonb;
