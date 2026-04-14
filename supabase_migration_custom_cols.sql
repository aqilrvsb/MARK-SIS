-- Add is_active toggle to custom_columns
ALTER TABLE custom_columns ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
