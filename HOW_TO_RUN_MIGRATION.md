# How to Execute Dashboard Migration - Step by Step

**Project:** DocScan AI  
**Supabase URL:** https://vdusyjayoekgfbrxquwa.supabase.co  
**Date:** December 10, 2025

## Quick Start (Recommended)

### Step 1: Access Supabase Dashboard
1. Open https://supabase.co/dashboard
2. Click on your project **vdusyjayoekgfbrxquwa**
3. You should see the dashboard overview

### Step 2: Open SQL Editor
1. In left sidebar, click **SQL Editor**
2. Click **New Query** (top right)
3. You'll see a blank SQL editor

### Step 3: Copy Migration SQL
1. In your project, open file: `supabase/migrations/20251210_dashboard_tables.sql`
2. Select all the content (Ctrl+A)
3. Copy it (Ctrl+C)

### Step 4: Paste and Execute
1. Click in the SQL editor
2. Paste the migration (Ctrl+V)
3. Click the **RUN** button (top right, looks like a play button ▶)
4. Wait for execution to complete (takes 5-10 seconds)

### Step 5: Verify Tables Were Created
1. Click **Table Editor** in left sidebar
2. Scroll through the list of tables
3. You should see these new tables:
   - reminders
   - user_profiles
   - document_categories
   - document_tags
   - document_metadata
   - user_activity_log
   - document_exports
   - notification_preferences
   - user_statistics
   - subscription_plans
   - user_subscriptions
   - monthly_usage

---

## Detailed Verification

### Check Individual Tables

**For reminders table:**
1. Click **Table Editor** → **reminders**
2. You should see columns: id, user_id, ocr_result_id, title, description, reminder_type, reminder_date, notify_before_days, is_notified, is_dismissed, created_at, updated_at
3. All columns should have correct data types

**For user_profiles table:**
1. Click **Table Editor** → **user_profiles**
2. Verify columns: id, user_id (UNIQUE), email, full_name, avatar_url, theme_preference, notifications_enabled, email_reminders_enabled, language, timezone, created_at, updated_at

**For user_statistics table:**
1. Click **Table Editor** → **user_statistics**
2. Verify columns: id, user_id (UNIQUE), total_documents_scanned, total_storage_used_bytes, successful_scans, failed_scans, etc.

### Check RLS is Enabled

1. Go to **SQL Editor**
2. Create new query and run:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('reminders', 'user_profiles', 'user_statistics')
ORDER BY tablename;
```
3. Result should show:
   - tablename | rowsecurity
   - reminders | t (true)
   - user_profiles | t (true)
   - user_statistics | t (true)

### Check Foreign Keys

1. Go to **SQL Editor** → New Query
2. Run:
```sql
SELECT constraint_name, table_name, column_name, foreign_table_name, foreign_column_name
FROM information_schema.key_column_usage
WHERE table_schema = 'public'
AND foreign_table_name IS NOT NULL
ORDER BY table_name;
```
3. Should show relationships like:
   - document_metadata → ocr_results (ocr_result_id)
   - document_metadata → document_categories (category_id)
   - user_subscriptions → subscription_plans (plan_id)

---

## If You Get Errors

### Error: "Syntax Error"
- **Cause:** Invalid SQL syntax
- **Solution:** 
  1. Copy migration file again (might have copy/paste issues)
  2. Clear the SQL editor and paste fresh
  3. Check that entire file was copied

### Error: "Relation 'ocr_results' does not exist"
- **Cause:** document_metadata trying to reference ocr_results that doesn't exist
- **Solution:**
  1. This means your OCR tables aren't set up yet
  2. Create ocr_results table first (should already exist from previous migration)
  3. Or comment out document_metadata table creation

### Error: "RLS policy for table 'reminders' already exists"
- **Cause:** Running migration twice
- **Solution:**
  1. Drop existing tables first:
  ```sql
  DROP TABLE IF EXISTS public.reminders CASCADE;
  DROP TABLE IF EXISTS public.user_profiles CASCADE;
  -- ... etc
  ```
  2. Then run migration again

### Error: "Column 'user_id' does not exist"
- **Cause:** Different data structure than expected
- **Solution:**
  1. Check your actual auth setup in Supabase
  2. Modify user_id column type if needed (might be UUID instead of TEXT)
  3. Update RLS policies accordingly

---

## Post-Migration Tasks

### 1. Insert Subscription Plans (Optional but Recommended)

1. Go to **SQL Editor** → **New Query**
2. Run:
```sql
INSERT INTO public.subscription_plans (plan_name, plan_slug, price, documents_per_month, max_file_size_mb, priority_support, custom_templates, batch_processing)
VALUES
  ('Free', 'free', 0, 10, 5, false, false, false),
  ('Pro', 'pro', 9.99, 500, 25, true, false, false),
  ('Business', 'business', 29.99, 1000, 100, true, true, true),
  ('Enterprise', 'enterprise', 99.99, NULL, NULL, true, true, true);

SELECT * FROM public.subscription_plans;
```
3. Should return 4 plans

### 2. Test RLS Policies

1. Go to **Policies** tab (in left sidebar under your project)
2. You should see policies for all tables
3. Each table should have 4 policies: SELECT, INSERT, UPDATE, DELETE
4. Policies should reference `user_id`

### 3. Update .env.local (If Needed)

Verify your `.env.local` has these variables:
```
VITE_SUPABASE_URL=https://vdusyjayoekgfbrxquwa.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_j4VStggUhIlDiIpqHJeEyw_hfvMic52
VITE_SUPABASE_PROJECT_ID=vdusyjayoekgfbrxquwa
```

If you want to use service role (for backend operations):
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Understanding What Was Created

### Critical Tables (For Dashboard)
- **reminders** - User reminders from documents
- **user_profiles** - User account info
- **user_statistics** - Dashboard metrics
- **document_metadata** - Extended OCR result info

### Important Tables (For Subscriptions)
- **subscription_plans** - Pricing tiers
- **user_subscriptions** - User subscription status

### Supporting Tables (For Organization)
- **document_categories** - User-created categories
- **document_tags** - User-created tags
- **notification_preferences** - User notification settings

### Tracking Tables (For Analytics)
- **user_activity_log** - All user actions
- **document_exports** - Export history
- **monthly_usage** - Monthly metrics

---

## Next Development Steps

### 1. Generate Updated TypeScript Types

```bash
# Option A: Via Supabase CLI
supabase gen types typescript --project-id vdusyjayoekgfbrxquwa > src/integrations/supabase/types.ts

# Option B: Manual in Supabase Dashboard
# Settings → API → Schema
# Copy the TypeScript type definitions
```

### 2. Create React Hooks

Create files for common operations:

**src/hooks/useUserProfile.ts**
```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useUserProfile() {
  const [profile, setProfile] = useState(null);
  
  useEffect(() => {
    const fetchProfile = async () => {
      const user = await getCurrentUser(); // From Clerk or Supabase auth
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setProfile(data);
    };
    
    fetchProfile();
  }, []);
  
  return { profile };
}
```

**src/hooks/useUserStatistics.ts**
- Get total documents, storage used, successful/failed scans
- Update stats when OCR completes

**src/hooks/useDocumentMetadata.ts**
- Get/create/update document category and tags
- Store vendor info, document dates, etc.

### 3. Update Dashboard Components

Update existing components to use new tables:

**src/pages/DashboardPage.tsx**
- Add user profile section
- Add subscription status
- Add monthly usage charts

**src/components/ocr/OCRDashboard.tsx**
- Store document metadata after OCR
- Apply categories and tags
- Extract dates for reminders

### 4. Auto-Create Reminders

Create service to extract dates from OCR and auto-create reminders:

```typescript
async function createRemindersFromOCR(ocrResultId: string, extractedData: any) {
  const reminders = [];
  
  if (extractedData.warranty_expiry_date) {
    reminders.push({
      ocr_result_id: ocrResultId,
      title: `Warranty expiring: ${extractedData.product_name}`,
      reminder_date: extractedData.warranty_expiry_date,
      reminder_type: 'warranty_expiry',
      notify_before_days: 30
    });
  }
  
  // Insert reminders to database
  await supabase.from('reminders').insert(reminders);
}
```

---

## Troubleshooting Checklist

- [ ] Migration SQL executed without errors
- [ ] All 12 tables visible in Table Editor
- [ ] RLS enabled on all tables
- [ ] Foreign keys working (no integrity errors)
- [ ] Can view subscription plans
- [ ] RLS policies prevent cross-user access
- [ ] User can create reminder (tests INSERT policy)
- [ ] User can't see other user's reminders (tests SELECT policy)

---

## File Locations

- **Migration SQL:** `supabase/migrations/20251210_dashboard_tables.sql`
- **This Guide:** `DASHBOARD_MIGRATION_GUIDE.md`
- **Execution Guide:** `HOW_TO_RUN_MIGRATION.md` (this file)
- **Dashboard Components:** `src/pages/Dashboard.tsx`, `src/pages/DashboardPage.tsx`
- **Hooks:** `src/hooks/useReminders.ts`, `src/hooks/useOCRStats.ts`
- **Supabase Client:** `src/integrations/supabase/client.ts`

---

**Questions?**
- Check Supabase documentation: https://supabase.com/docs
- View your schema: Supabase Dashboard → Database → Tables
- Run diagnostic queries in SQL Editor

**Last Updated:** December 10, 2025
