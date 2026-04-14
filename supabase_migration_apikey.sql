-- ============================================
-- Add API key to users table for Chrome extension integration
-- Run this in Supabase SQL Editor
-- ============================================

-- Add api_key column
ALTER TABLE users ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex');

-- Generate API keys for existing users that don't have one
UPDATE users SET api_key = encode(gen_random_bytes(24), 'hex') WHERE api_key IS NULL;

-- Remove old triggers that cause registration errors
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create index for fast API key lookup
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);
