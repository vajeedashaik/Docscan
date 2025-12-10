# Dashboard Database Migration Guide

**Created:** December 10, 2025  
**Purpose:** Complete database schema for DocScan dashboard

## Overview

This migration creates 12 comprehensive tables to support all dashboard functionality. The tables are organized into logical groups:

- **User Management:** user_profiles, user_statistics, subscription_plans, user_subscriptions
- **Reminders & Notifications:** reminders, notification_preferences
- **Document Management:** document_metadata, document_categories, document_tags
- **Analytics & Tracking:** user_activity_log, monthly_usage, document_exports

## Tables Created

### 1. **reminders** (Critical)
Stores user reminders extracted from scanned documents.

**Fields:**
- `id` (UUID) - Primary key
- `user_id` (TEXT) - User identifier from Clerk
- `ocr_result_id` (UUID) - Reference to scanned document
- `title` (TEXT) - Reminder title
- `description` (TEXT) - Reminder details
- `reminder_type` (TEXT) - Type: warranty_expiry, service_due, subscription_renewal, payment_due, custom
- `reminder_date` (DATE) - When reminder is due
- `notify_before_days` (INT) - How many days before to notify (default: 7)
- `is_notified` (BOOLEAN) - Whether notification was sent
- `is_dismissed` (BOOLEAN) - Whether user dismissed it
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Usage:** Dashboard shows `upcomingReminders` count filtered by `reminder_date >= today AND is_dismissed = false`

---

### 2. **user_profiles** (Important)
Stores extended user information and preferences.

**Fields:**
- `id` (UUID) - Primary key
- `user_id` (TEXT) - Unique user identifier from Clerk
- `email` (TEXT) - User email
- `full_name` (TEXT) - Display name
- `avatar_url` (TEXT) - Profile picture
- `theme_preference` (TEXT) - 'light' or 'dark'
- `notifications_enabled` (BOOLEAN)
- `email_reminders_enabled` (BOOLEAN)
- `language` (TEXT) - Default: 'en'
- `timezone` (TEXT) - Default: 'UTC'
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Note:** One profile per user (UNIQUE constraint on user_id)

---

### 3. **document_categories** (Optional)
Allows users to organize documents by category.

**Fields:**
- `id` (UUID)
- `user_id` (TEXT) - Owner of category
- `name` (TEXT) - Category name (Warranty, Invoice, etc.)
- `description` (TEXT)
- `color` (TEXT) - Hex color for UI display
- `icon` (TEXT) - Icon name
- `display_order` (INT) - Sort order
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Constraint:** UNIQUE(user_id, name) - Users can't have duplicate category names

---

### 4. **document_tags** (Optional)
Simple tagging system for documents.

**Fields:**
- `id` (UUID)
- `user_id` (TEXT)
- `name` (TEXT) - Tag name
- `color` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

### 5. **document_metadata** (Important)
Extended information about OCR results.

**Fields:**
- `id` (UUID)
- `ocr_result_id` (UUID) - Foreign key to ocr_results
- `user_id` (TEXT)
- `category_id` (UUID) - FK to document_categories
- `tags` (TEXT[]) - Array of tag names
- `vendor_name` (TEXT) - Company/vendor name
- `vendor_phone` (TEXT)
- `vendor_email` (TEXT)
- `document_number` (TEXT) - Invoice no, warranty no, etc.
- `document_date` (DATE)
- `expiry_date` (DATE) - For auto-reminder generation
- `renewal_date` (DATE)
- `amount` (NUMERIC) - Document amount
- `currency` (TEXT) - Default: 'USD'
- `is_starred` (BOOLEAN) - User favorites
- `notes` (TEXT) - User notes
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

### 6. **user_activity_log** (Analytics)
Tracks all user actions for analytics and audit trail.

**Fields:**
- `id` (UUID)
- `user_id` (TEXT)
- `activity_type` (TEXT) - document_upload, reminder_created, reminder_dismissed, export, etc.
- `action_description` (TEXT)
- `metadata` (JSONB) - Flexible additional data
- `created_at` (TIMESTAMP)

---

### 7. **document_exports** (Export Feature)
Tracks document export operations (PDF, CSV, Excel).

**Fields:**
- `id` (UUID)
- `user_id` (TEXT)
- `export_type` (TEXT) - pdf, csv, json, excel
- `document_ids` (UUID[]) - Array of exported document IDs
- `file_name` (TEXT)
- `file_size` (INT) - Bytes
- `file_url` (TEXT) - Storage URL
- `status` (TEXT) - pending, processing, completed, failed
- `error_message` (TEXT)
- `created_at` (TIMESTAMP)
- `completed_at` (TIMESTAMP)

---

### 8. **notification_preferences** (Granular Control)
Fine-grained notification settings per user.

**Fields:**
- `id` (UUID)
- `user_id` (TEXT) - UNIQUE
- `warranty_reminders` (BOOLEAN)
- `service_reminders` (BOOLEAN)
- `subscription_reminders` (BOOLEAN)
- `payment_reminders` (BOOLEAN)
- `new_features` (BOOLEAN)
- `tips_and_tricks` (BOOLEAN)
- `weekly_digest` (BOOLEAN)
- `digest_day` (TEXT) - monday, tuesday, etc.
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

### 9. **user_statistics** (Dashboard Metrics)
Aggregated user statistics for dashboard display.

**Fields:**
- `id` (UUID)
- `user_id` (TEXT) - UNIQUE
- `total_documents_scanned` (INT)
- `total_storage_used_bytes` (BIGINT)
- `successful_scans` (INT)
- `failed_scans` (INT)
- `total_reminders_created` (INT)
- `total_reminders_completed` (INT)
- `average_confidence_score` (NUMERIC 5,4) - 0.0000 to 1.0000
- `most_common_document_type` (TEXT)
- `last_scan_date` (TIMESTAMP)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Note:** Updated whenever OCR job completes

---

### 10. **subscription_plans** (Subscription Management)
Defines available subscription tiers.

**Fields:**
- `id` (UUID)
- `plan_name` (TEXT) - UNIQUE (Free, Pro, Business)
- `plan_slug` (TEXT) - UNIQUE (free, pro, business)
- `description` (TEXT)
- `price` (NUMERIC 10,2)
- `documents_per_month` (INT)
- `max_file_size_mb` (INT)
- `api_calls_per_day` (INT)
- `priority_support` (BOOLEAN)
- `custom_templates` (BOOLEAN)
- `batch_processing` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

### 11. **user_subscriptions** (Subscription Status)
Tracks user subscription status and renewal dates.

**Fields:**
- `id` (UUID)
- `user_id` (TEXT) - UNIQUE
- `plan_id` (UUID) - FK to subscription_plans
- `status` (TEXT) - active, inactive, cancelled, expired
- `stripe_subscription_id` (TEXT)
- `started_at` (TIMESTAMP)
- `ended_at` (TIMESTAMP)
- `renewal_date` (TIMESTAMP)
- `auto_renew` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

### 12. **monthly_usage** (Usage Tracking)
Monthly breakdown of usage for tracking and billing.

**Fields:**
- `id` (UUID)
- `user_id` (TEXT)
- `year` (INT)
- `month` (INT)
- `documents_scanned` (INT)
- `storage_used_bytes` (BIGINT)
- `api_calls_made` (INT)
- `successful_extractions` (INT)
- `failed_extractions` (INT)
- `average_confidence` (NUMERIC)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Constraint:** UNIQUE(user_id, year, month)

---

## Security Features

### Row Level Security (RLS)
All user data tables have RLS enabled with policies that ensure:
- Users can only view/edit their own data
- Service functions can update user_statistics and monthly_usage
- Subscription plans are publicly readable

### Indexes for Performance
Created strategic indexes on:
- **User filters:** user_id, user subscriptions
- **Time-based queries:** reminder_date, created_at, year/month
- **Foreign keys:** ocr_result_id, category_id, plan_id
- **Common filters:** is_dismissed, status, support_status

---

## How to Execute Migration

### Option 1: Supabase Dashboard (Recommended for First Time)

1. Go to [Supabase Dashboard](https://supabase.co)
2. Login to your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the entire contents of `supabase/migrations/20251210_dashboard_tables.sql`
6. Paste into the SQL editor
7. Click **Run**
8. Verify all tables appear in **Table Editor**

### Option 2: Via Supabase CLI

```bash
# First, install Supabase CLI if not already installed
npm install -g supabase

# Then run migrations
supabase db push

# This will execute all migrations in supabase/migrations/ folder
```

### Option 3: Via Postgres Direct Connection

```bash
# Using psql (PostgreSQL command line)
psql "postgresql://postgres:[your-password]@[your-project].db.supabase.co:5432/postgres" \
  -f supabase/migrations/20251210_dashboard_tables.sql
```

---

## Verification Steps

After running the migration:

1. **Check Tables Exist** (Supabase Dashboard → Table Editor):
   - [ ] reminders
   - [ ] user_profiles
   - [ ] document_categories
   - [ ] document_tags
   - [ ] document_metadata
   - [ ] user_activity_log
   - [ ] document_exports
   - [ ] notification_preferences
   - [ ] user_statistics
   - [ ] subscription_plans
   - [ ] user_subscriptions
   - [ ] monthly_usage

2. **Verify RLS is Enabled** (Supabase Dashboard → SQL Editor):
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('reminders', 'user_profiles', 'user_statistics');
   ```

3. **Check Indexes Created**:
   ```sql
   SELECT * FROM pg_indexes 
   WHERE schemaname = 'public' 
   AND tablename LIKE 'reminders%' OR tablename LIKE 'user_%';
   ```

---

## Next Steps

### Update TypeScript Types
After tables are created, update `src/integrations/supabase/types.ts`:

```typescript
// Add to Database.Tables interface
reminders: {
  Row: Reminder;
  Insert: RemindersInsert;
  Update: RemindersUpdate;
  // ... etc
}
```

Or regenerate types using Supabase CLI:
```bash
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### Create React Hooks
Create hooks for common operations:
- `useUserProfile()` - Get/update user profile
- `useUserStatistics()` - Get user stats
- `useDocumentMetadata()` - Get/create/update document info
- `useNotificationPreferences()` - Manage notification settings

### Seed Sample Data
Before user testing:
```sql
-- Insert sample subscription plans
INSERT INTO public.subscription_plans (plan_name, plan_slug, price, documents_per_month, max_file_size_mb)
VALUES
  ('Free', 'free', 0, 10, 5),
  ('Pro', 'pro', 9.99, 500, 25),
  ('Business', 'business', 29.99, NULL, 100);
```

---

## Important Notes

⚠️ **About auth.uid() in RLS Policies:**
- Clerk stores user_id as TEXT in our tables
- But auth.uid() returns UUID from Supabase auth
- We need a custom approach or trigger to sync Clerk user_id → Supabase auth

**Recommended Solution:**
1. Store Clerk user_id in Supabase auth metadata
2. Create trigger to auto-create user_profile when Clerk user is created
3. Use service role key for backend operations

Or modify RLS to work with Clerk:
```sql
-- Alternative that might work better with Clerk
CREATE POLICY "Users can view own reminders" ON public.reminders
  FOR SELECT USING (user_id = (auth.jwt() ->> 'sub'));
```

---

## Rollback Instructions

If you need to undo this migration:

```sql
-- WARNING: This will delete all data!
DROP TABLE IF EXISTS public.monthly_usage CASCADE;
DROP TABLE IF EXISTS public.user_subscriptions CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;
DROP TABLE IF EXISTS public.user_statistics CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP TABLE IF EXISTS public.document_exports CASCADE;
DROP TABLE IF EXISTS public.user_activity_log CASCADE;
DROP TABLE IF EXISTS public.document_metadata CASCADE;
DROP TABLE IF EXISTS public.document_tags CASCADE;
DROP TABLE IF EXISTS public.document_categories CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.reminders CASCADE;
```

---

## Related Files

- **Migration SQL:** `supabase/migrations/20251210_dashboard_tables.sql`
- **Dashboard Component:** `src/pages/Dashboard.tsx`
- **Enhanced Dashboard:** `src/pages/DashboardPage.tsx`
- **Reminders Hook:** `src/hooks/useReminders.ts`
- **OCR Stats Hook:** `src/hooks/useOCRStats.ts`
- **Environment Config:** `.env.local` (with VITE_SUPABASE_* variables)

---

## Support

For issues with migration:
1. Check Supabase error logs (SQL Editor shows detailed errors)
2. Verify all foreign key references exist
3. Ensure RLS policies don't conflict
4. Check that user_id format is consistent (TEXT)

Created: December 10, 2025
