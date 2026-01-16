-- ============================================================
-- VibeBeats Auth Fix Migration
-- Execute this in Supabase SQL Editor
-- This fixes the user registration flow
-- Created: 2026-01-16
-- ============================================================

-- =====================
-- STEP 1: Fix users table schema
-- =====================

-- Remove the password_hash column (Supabase Auth handles passwords)
-- First, make it nullable to avoid issues with existing data
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Set a default value for existing rows (if any)
UPDATE users SET password_hash = 'managed_by_supabase_auth' WHERE password_hash IS NULL;

-- =====================
-- STEP 2: Create trigger function to auto-create user profile
-- =====================

-- This function is called when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id,
        email,
        password_hash,
        name,
        user_type,
        bio,
        avatar_url,
        social_links,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        'managed_by_supabase_auth', -- Placeholder since Supabase Auth handles passwords
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), -- Use name from metadata or email prefix
        COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'artist'), -- Default to artist
        NULL,
        NULL,
        '{}',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, users.name),
        user_type = COALESCE(EXCLUDED.user_type, users.user_type),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- =====================
-- STEP 3: Create trigger on auth.users table
-- =====================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires after a new user is created in auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- STEP 4: Update RLS policies for users table
-- =====================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Recreate policies
-- Anyone can view user profiles (public info)
CREATE POLICY "Users are viewable by everyone"
    ON users FOR SELECT
    USING (TRUE);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow service role to insert (trigger uses SECURITY DEFINER)
-- Regular users don't need INSERT policy since trigger handles it
CREATE POLICY "Service role can insert users"
    ON users FOR INSERT
    WITH CHECK (TRUE);

-- =====================
-- STEP 5: Fix existing auth.users without profiles
-- =====================

-- Create profiles for any existing auth users that don't have a profile yet
INSERT INTO public.users (id, email, password_hash, name, user_type, created_at, updated_at)
SELECT
    au.id,
    au.email,
    'managed_by_supabase_auth',
    COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
    COALESCE((au.raw_user_meta_data->>'user_type')::user_type, 'artist'),
    COALESCE(au.created_at, NOW()),
    NOW()
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Migration Complete!
-- New users will automatically get a profile created
-- ============================================================
