-- ============================================================
-- Attackly Database Schema Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 0. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    phone TEXT,
    name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'business', 'admin')),
    line_user_id TEXT UNIQUE,
    line_display_name TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. BUSINESSES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    phone TEXT,
    address TEXT,
    logo_url TEXT,
    timezone TEXT DEFAULT 'Asia/Taipei',
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_businesses_owner ON public.businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_active ON public.businesses(is_active);

-- ============================================================
-- 3. SERVICES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 60,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    category TEXT,
    color TEXT DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_services_business ON public.services(business_id);

-- ============================================================
-- 4. STAFF
-- ============================================================
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    color TEXT DEFAULT '#10B981',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_staff_business ON public.staff(business_id);

-- ============================================================
-- 5. BUSINESS HOURS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.business_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE,
    UNIQUE(business_id, day_of_week)
);

ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_hours_business ON public.business_hours(business_id);

-- ============================================================
-- 6. APPOINTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.profiles(id),
    staff_id UUID REFERENCES public.staff(id),
    service_id UUID REFERENCES public.services(id),
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'ai', 'line', 'web')),
    ai_notes TEXT,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_appts_business ON public.appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_appts_customer ON public.appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appts_date ON public.appointments(business_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appts_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appts_source ON public.appointments(source);

-- ============================================================
-- 7. PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    business_id UUID NOT NULL REFERENCES public.businesses(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'TWD',
    method TEXT DEFAULT 'newebpay' CHECK (method IN ('newebpay', 'line_pay', 'cash', 'card', 'other')),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
    trade_no TEXT UNIQUE,
    merchant_trade_no TEXT,
    payment_url TEXT,
    paid_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_payments_appointment ON public.payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_business ON public.payments(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- ============================================================
-- 8. FAQ
-- ============================================================
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_faqs_business ON public.faqs(business_id);

-- ============================================================
-- 9. CHAT MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_chat_session ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_user ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_created ON public.chat_messages(created_at);

-- ============================================================
-- MIGRATION: shop_bookings_v3 → appointments (legacy support)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shop_bookings_v3 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    all_bookings JSONB DEFAULT '[]',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Profiles: users can read/update own profile
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Businesses: owners have full access
CREATE POLICY "Business owners full access"
    ON public.businesses FOR ALL
    USING (auth.uid() = owner_id);

-- Appointments: business owners can see all, customers see own
CREATE POLICY "Business owners manage appointments"
    ON public.appointments FOR ALL
    USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Customers can view own appointments"
    ON public.appointments FOR SELECT
    USING (customer_id = auth.uid());

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Get appointments for a date range (business owner)
CREATE OR REPLACE FUNCTION public.get_appointments_range(
    p_business_id UUID,
    p_start_date DATE,
    p_end_date DATE
) RETURNS SETOF public.appointments AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.appointments
    WHERE business_id = p_business_id
        AND appointment_date >= p_start_date
        AND appointment_date <= p_end_date
    ORDER BY appointment_date, start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get upcoming appointments
CREATE OR REPLACE FUNCTION public.get_upcoming_appointments(
    p_business_id UUID,
    p_limit INT DEFAULT 10
) RETURNS SETOF public.appointments AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.appointments
    WHERE business_id = p_business_id
        AND appointment_date >= CURRENT_DATE
        AND status NOT IN ('cancelled', 'no_show')
    ORDER BY appointment_date, start_time
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGER: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_businesses_updated_at
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_staff_updated_at
    BEFORE UPDATE ON public.staff
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_faqs_updated_at
    BEFORE UPDATE ON public.faqs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- DONE!
-- ============================================================
