-- ============================================================
-- VibeBeats Auth Fix Migration v2
-- Execute this in Supabase SQL Editor
-- Fixes: "type user_type does not exist" error
-- Created: 2026-01-16
-- ============================================================

-- =====================
-- STEP 1: Drop existing trigger first (to avoid conflicts)
-- =====================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- =====================
-- STEP 2: Recreate the trigger function with FULLY QUALIFIED type name
-- =====================

-- The key fix: use public.user_type instead of just user_type
-- This ensures the ENUM type is found even when running in auth schema context
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_type public.user_type;
    v_name TEXT;
BEGIN
    -- Safely get user_type with fallback to 'artist'
    BEGIN
        v_user_type := COALESCE(
            (NEW.raw_user_meta_data->>'user_type')::public.user_type,
            'artist'::public.user_type
        );
    EXCEPTION WHEN OTHERS THEN
        v_user_type := 'artist'::public.user_type;
    END;

    -- Get name with fallback to email prefix
    v_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    -- Insert into users table
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
        'managed_by_supabase_auth',
        v_name,
        v_user_type,
        NULL,
        NULL,
        '{}'::jsonb,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, public.users.name),
        updated_at = NOW();

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the auth signup
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;

-- =====================
-- STEP 3: Recreate the trigger
-- =====================
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- STEP 4: Verify the setup
-- =====================

-- Check that user_type ENUM exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'user_type'
    ) THEN
        RAISE EXCEPTION 'user_type ENUM does not exist! Create it first.';
    END IF;
    RAISE NOTICE 'user_type ENUM exists: OK';
END $$;

-- Check that trigger exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE t.tgname = 'on_auth_user_created'
        AND n.nspname = 'auth'
        AND c.relname = 'users'
    ) THEN
        RAISE EXCEPTION 'Trigger on_auth_user_created does not exist!';
    END IF;
    RAISE NOTICE 'Trigger on_auth_user_created exists: OK';
END $$;

-- ============================================================
-- Migration v2 Complete!
-- Key changes:
-- 1. SET search_path = public in function definition
-- 2. All type references use public.user_type
-- 3. Added exception handling to prevent auth failures
-- ============================================================
