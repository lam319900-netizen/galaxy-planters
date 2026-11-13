-- ============================================================================
-- SmartCrop Agricultural Decision Support Platform
-- Migration: 20261107_init_auth_and_farmer_platform.sql
-- Description: Creates User Profiles, Farms, Saved Plans, and Activity History
--              with Row Level Security (RLS) and Automated Audit Triggers
-- ============================================================================

-- 1. PROFILES TABLE (Linked directly to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    profile_image TEXT,
    country TEXT NOT NULL DEFAULT 'Egypt',
    city TEXT NOT NULL DEFAULT 'Sohag',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. FARMS TABLE (Personal farm parcels belonging to a farmer)
CREATE TABLE IF NOT EXISTS public.farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    country TEXT NOT NULL,
    region TEXT NOT NULL,
    farm_area DOUBLE PRECISION NOT NULL CHECK (farm_area > 0),
    area_unit TEXT NOT NULL DEFAULT 'feddan' CHECK (area_unit IN ('feddan', 'hectare', 'acre')),
    soil_properties JSONB NOT NULL DEFAULT '{}'::jsonb,
    irrigation_properties JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. SAVED PLANS TABLE (Immutable snapshots of generated crop rotation plans)
CREATE TABLE IF NOT EXISTS public.saved_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
    plan_name TEXT NOT NULL,
    user_notes TEXT,
    plan_snapshot JSONB NOT NULL,
    original_inputs JSONB NOT NULL,
    soil_data_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    climate_data_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    recommendation_version TEXT NOT NULL DEFAULT 'v2.1-global-fao56',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. ACTIVITY HISTORY TABLE (Chronological audit and event ledger)
CREATE TABLE IF NOT EXISTS public.activity_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
    plan_id UUID REFERENCES public.saved_plans(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'account_created',
        'farm_created',
        'farm_updated',
        'farm_deleted',
        'plan_generated',
        'plan_saved',
        'plan_updated',
        'plan_duplicated',
        'plan_deleted'
    )),
    description_en TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_farms_user_id ON public.farms(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_plans_user_id ON public.saved_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_plans_farm_id ON public.saved_plans(farm_id);
CREATE INDEX IF NOT EXISTS idx_activity_history_user_id ON public.activity_history(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_history_created_at ON public.activity_history(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_history ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view, insert, and update only their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON public.profiles
    FOR DELETE USING (auth.uid() = id);

-- Farms: Users can view, insert, update, and delete only their own farms
CREATE POLICY "Users can read own farms" ON public.farms
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own farms" ON public.farms
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own farms" ON public.farms
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own farms" ON public.farms
    FOR DELETE USING (auth.uid() = user_id);

-- Saved Plans: Users can view, insert, update, and delete only their own plans
CREATE POLICY "Users can read own saved plans" ON public.saved_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved plans" ON public.saved_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved plans" ON public.saved_plans
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved plans" ON public.saved_plans
    FOR DELETE USING (auth.uid() = user_id);

-- Activity History: Users can view and insert their own activity entries
CREATE POLICY "Users can read own activity history" ON public.activity_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity history" ON public.activity_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- When a user registers in auth.users, automatically initialize public.profiles
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, country, city)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Farmer'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'country', 'Egypt'),
        COALESCE(NEW.raw_user_meta_data->>'city', 'Sohag')
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        country = EXCLUDED.country,
        city = EXCLUDED.city,
        updated_at = now();

    -- Automatically log account creation in activity history
    INSERT INTO public.activity_history (
        user_id,
        activity_type,
        description_en,
        description_ar,
        metadata
    ) VALUES (
        NEW.id,
        'account_created',
        'Welcome to SmartCrop! Account registered successfully.',
        'مرحباً بك في SmartCrop! تم إنشاء حسابك الزراعي بنجاح.',
        jsonb_build_object('email', NEW.email)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
