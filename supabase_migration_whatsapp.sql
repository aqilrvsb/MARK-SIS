-- Add whatsapp_number to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
