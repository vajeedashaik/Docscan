-- Comprehensive Dashboard Tables Migration
-- Created: December 10, 2025
-- Purpose: Create all necessary tables for dashboard functionality

-- 1. REMINDERS TABLE - For user reminders based on scanned documents
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  ocr_result_id UUID REFERENCES public.ocr_results(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  reminder_type TEXT NOT NULL DEFAULT 'custom',
  reminder_date DATE NOT NULL,
  notify_before_days INTEGER DEFAULT 7,
  is_notified BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. USER PROFILES TABLE - Store user preferences and stats
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  theme_preference TEXT DEFAULT 'dark', -- 'light' or 'dark'
  notifications_enabled BOOLEAN DEFAULT true,
  email_reminders_enabled BOOLEAN DEFAULT true,
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. DOCUMENT CATEGORIES TABLE - For organizing documents
CREATE TABLE IF NOT EXISTS public.document_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'file',
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- 4. DOCUMENT TAGS TABLE - For tagging documents
CREATE TABLE IF NOT EXISTS public.document_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- 5. DOCUMENT METADATA TABLE - Additional info for OCR results
CREATE TABLE IF NOT EXISTS public.document_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ocr_result_id UUID NOT NULL UNIQUE REFERENCES public.ocr_results(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  category_id UUID REFERENCES public.document_categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array of tag names
  vendor_name TEXT,
  vendor_phone TEXT,
  vendor_email TEXT,
  document_number TEXT, -- Invoice no, warranty card no, etc.
  document_date DATE,
  expiry_date DATE,
  renewal_date DATE,
  amount NUMERIC(10, 2),
  currency TEXT DEFAULT 'USD',
  is_starred BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. USER ACTIVITY LOG TABLE - Track user actions for analytics
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  activity_type TEXT NOT NULL, -- 'document_upload', 'reminder_created', 'reminder_dismissed', 'export', etc.
  action_description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. DOCUMENT_EXPORTS TABLE - Track document/data exports
CREATE TABLE IF NOT EXISTS public.document_exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  export_type TEXT NOT NULL, -- 'pdf', 'csv', 'json', 'excel'
  document_ids UUID[] NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  file_url TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 8. NOTIFICATION_PREFERENCES TABLE - Fine-grained notification control
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  warranty_reminders BOOLEAN DEFAULT true,
  service_reminders BOOLEAN DEFAULT true,
  subscription_reminders BOOLEAN DEFAULT true,
  payment_reminders BOOLEAN DEFAULT true,
  new_features BOOLEAN DEFAULT true,
  tips_and_tricks BOOLEAN DEFAULT false,
  weekly_digest BOOLEAN DEFAULT true,
  digest_day TEXT DEFAULT 'monday',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. USER_STATISTICS TABLE - Aggregated user stats for dashboard
CREATE TABLE IF NOT EXISTS public.user_statistics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  total_documents_scanned INTEGER DEFAULT 0,
  total_storage_used_bytes BIGINT DEFAULT 0,
  successful_scans INTEGER DEFAULT 0,
  failed_scans INTEGER DEFAULT 0,
  total_reminders_created INTEGER DEFAULT 0,
  total_reminders_completed INTEGER DEFAULT 0,
  average_confidence_score NUMERIC(5, 4),
  most_common_document_type TEXT,
  last_scan_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 10. SUBSCRIPTION_PLANS TABLE - Track subscription tiers
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_name TEXT NOT NULL UNIQUE,
  plan_slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC(10, 2),
  documents_per_month INTEGER,
  max_file_size_mb INTEGER,
  api_calls_per_day INTEGER,
  priority_support BOOLEAN DEFAULT false,
  custom_templates BOOLEAN DEFAULT false,
  batch_processing BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 11. USER_SUBSCRIPTIONS TABLE - Track user subscription status
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'cancelled', 'expired'
  stripe_subscription_id TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  renewal_date TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 12. MONTHLY_USAGE TABLE - Track monthly document/API usage
CREATE TABLE IF NOT EXISTS public.monthly_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  documents_scanned INTEGER DEFAULT 0,
  storage_used_bytes BIGINT DEFAULT 0,
  api_calls_made INTEGER DEFAULT 0,
  successful_extractions INTEGER DEFAULT 0,
  failed_extractions INTEGER DEFAULT 0,
  average_confidence NUMERIC(5, 4),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, year, month)
);

-- INDEXES FOR PERFORMANCE

-- Reminders indexes
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_reminder_date ON public.reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_reminders_is_dismissed ON public.reminders(is_dismissed);
CREATE INDEX IF NOT EXISTS idx_reminders_user_date ON public.reminders(user_id, reminder_date);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

-- Document metadata indexes
CREATE INDEX IF NOT EXISTS idx_document_metadata_user_id ON public.document_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_document_metadata_ocr_result_id ON public.document_metadata(ocr_result_id);
CREATE INDEX IF NOT EXISTS idx_document_metadata_category_id ON public.document_metadata(category_id);
CREATE INDEX IF NOT EXISTS idx_document_metadata_expiry_date ON public.document_metadata(expiry_date);

-- Document categories indexes
CREATE INDEX IF NOT EXISTS idx_document_categories_user_id ON public.document_categories(user_id);

-- Document tags indexes
CREATE INDEX IF NOT EXISTS idx_document_tags_user_id ON public.document_tags(user_id);

-- Activity log indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON public.user_activity_log(created_at);

-- Document exports indexes
CREATE INDEX IF NOT EXISTS idx_document_exports_user_id ON public.document_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_document_exports_status ON public.document_exports(status);

-- User statistics indexes
CREATE INDEX IF NOT EXISTS idx_user_statistics_user_id ON public.user_statistics(user_id);

-- Monthly usage indexes
CREATE INDEX IF NOT EXISTS idx_monthly_usage_user_id ON public.monthly_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_usage_year_month ON public.monthly_usage(year, month);

-- Enable Row Level Security
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_usage ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR USER DATA ACCESS
-- Note: We use application-level filtering via Clerk's userId instead of auth.uid()
-- This allows the frontend to properly authenticate with Clerk
-- Drop existing policies if they exist (idempotent approach)
DROP POLICY IF EXISTS "Users can view own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can insert own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can update own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can delete own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own document metadata" ON public.document_metadata;
DROP POLICY IF EXISTS "Users can insert own document metadata" ON public.document_metadata;
DROP POLICY IF EXISTS "Users can update own document metadata" ON public.document_metadata;
DROP POLICY IF EXISTS "Users can delete own document metadata" ON public.document_metadata;
DROP POLICY IF EXISTS "Users can view own categories" ON public.document_categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON public.document_categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.document_categories;
DROP POLICY IF EXISTS "Users can view own tags" ON public.document_tags;
DROP POLICY IF EXISTS "Users can insert own tags" ON public.document_tags;
DROP POLICY IF EXISTS "Users can update own tags" ON public.document_tags;
DROP POLICY IF EXISTS "Users can view own activity" ON public.user_activity_log;
DROP POLICY IF EXISTS "Users can insert own activity" ON public.user_activity_log;
DROP POLICY IF EXISTS "Users can view own exports" ON public.document_exports;
DROP POLICY IF EXISTS "Users can insert own exports" ON public.document_exports;
DROP POLICY IF EXISTS "Users can view own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can view own statistics" ON public.user_statistics;
DROP POLICY IF EXISTS "Users can insert own statistics" ON public.user_statistics;
DROP POLICY IF EXISTS "Users can update own statistics" ON public.user_statistics;
DROP POLICY IF EXISTS "Users can view own usage" ON public.monthly_usage;
DROP POLICY IF EXISTS "Everyone can view subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;

-- Allow all authenticated operations (filtering happens at application level via Clerk userId)
CREATE POLICY "Enable select for authenticated users" ON public.reminders
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.reminders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.reminders
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON public.reminders
  FOR DELETE USING (true);

CREATE POLICY "Enable select for authenticated users" ON public.user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.user_profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.user_profiles
  FOR UPDATE USING (true);

CREATE POLICY "Enable select for authenticated users" ON public.document_metadata
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.document_metadata
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.document_metadata
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON public.document_metadata
  FOR DELETE USING (true);

CREATE POLICY "Enable select for authenticated users" ON public.document_categories
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.document_categories
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.document_categories
  FOR UPDATE USING (true);

CREATE POLICY "Enable select for authenticated users" ON public.document_tags
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.document_tags
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.document_tags
  FOR UPDATE USING (true);

CREATE POLICY "Enable select for authenticated users" ON public.user_activity_log
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.user_activity_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users" ON public.document_exports
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.document_exports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users" ON public.notification_preferences
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.notification_preferences
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.notification_preferences
  FOR UPDATE USING (true);

CREATE POLICY "Enable select for authenticated users" ON public.user_statistics
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.user_statistics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.user_statistics
  FOR UPDATE USING (true);

CREATE POLICY "Enable select for authenticated users" ON public.monthly_usage
  FOR SELECT USING (true);

CREATE POLICY "Enable select for all users" ON public.subscription_plans
  FOR SELECT USING (true);

CREATE POLICY "Enable select for authenticated users" ON public.user_subscriptions
  FOR SELECT USING (true);
