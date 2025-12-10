# ⚡ Supabase Setup - Quick Start (5 Minutes)

## Problem
You can't see anything on your Supabase dashboard because the **database tables haven't been created yet**.

## Solution
Run the migration SQL that's already prepared for you.

---

## 🎯 DO THIS NOW (3 Simple Steps)

### Step 1️⃣ Go to Supabase
```
1. Open: https://supabase.co/dashboard
2. Login with your credentials
3. Select project: vdusyjayoekgfbrxquwa
```

### Step 2️⃣ Open SQL Editor
```
1. Left sidebar → SQL Editor
2. Click: New Query
3. You'll see a blank editor
```

### Step 3️⃣ Run the Migration
```
1. Open file: supabase/migrations/20251210_dashboard_tables.sql
2. Select All (Ctrl+A)
3. Copy (Ctrl+C)

4. In Supabase SQL Editor, click and paste (Ctrl+V)
5. Click: RUN button (top right)
6. Wait for completion ✓
```

---

## ✅ Verify It Worked

After running SQL, check:

```
1. Go to: Table Editor (left sidebar)
2. Look for these NEW tables:

   Dashboard Tables:
   ✅ reminders
   ✅ user_profiles
   ✅ user_statistics
   ✅ document_metadata
   ✅ document_categories
   ✅ document_tags
   ✅ subscription_plans
   ✅ user_subscriptions
   ✅ notification_preferences
   ✅ user_activity_log
   ✅ document_exports
   ✅ monthly_usage

   Existing Tables (should already be there):
   ✅ ocr_jobs
   ✅ ocr_results
   ✅ ocr_errors
   ✅ ocr_statistics
   ✅ browser_support
   ✅ web_features
   ✅ feature_support
   ✅ browser_stats
```

If you see all these tables → ✅ **YOU'RE DONE!**

---

## 🎉 Then What?

Once tables are created:

1. **Your codebase is automatically ready to use the data**
2. **Dashboard will work without changes**
3. **You can upload documents and they'll be stored**

---

## ⚠️ Common Issues

### "Relation 'reminders' does not exist"
→ You haven't run the migration yet → Do Step 1-3 above

### "SQL error - syntax issue"
→ Copy the migration file completely and try again

### "Still don't see tables"
→ Refresh page (F5) and check Table Editor again

---

## 📄 Your Setup is Already Done

Your codebase is already configured:
- ✅ `.env.local` has correct Supabase credentials
- ✅ Supabase client is properly set up
- ✅ React components can use the data immediately

**You just need to create the database tables** ← That's what the SQL does.

---

**Time Needed:** 5 minutes  
**Difficulty:** Copy & paste (very easy!)  
**Result:** Fully functional dashboard

**Let's go!** 🚀
