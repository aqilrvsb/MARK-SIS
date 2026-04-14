-- ============================================
-- Staff ID system for company team members
-- Run this in Supabase SQL Editor
-- ============================================

-- Add prefix to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS prefix TEXT UNIQUE;

-- Add id_staff to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_staff TEXT UNIQUE;

-- Remove old triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create index for fast staff ID lookup
CREATE INDEX IF NOT EXISTS idx_users_id_staff ON users(id_staff);
