# Dashboard Database - Quick Reference Card

## 📍 Files You Need

| File | Purpose | Location |
|------|---------|----------|
| **Migration SQL** | Run this in Supabase | `supabase/migrations/20251210_dashboard_tables.sql` |
| **Step-by-Step Guide** | How to execute migration | `HOW_TO_RUN_MIGRATION.md` |
| **Full Documentation** | Table details & relationships | `DASHBOARD_MIGRATION_GUIDE.md` |
| **Implementation Summary** | Overview & next steps | `DASHBOARD_IMPLEMENTATION_SUMMARY.md` |
| **TypeScript Types** | Use in your code | `src/types/dashboard.ts` |

---

## 🚀 Quick Start (3 Steps)

### 1. Copy Migration SQL
```
Open: supabase/migrations/20251210_dashboard_tables.sql
Select All (Ctrl+A)
Copy (Ctrl+C)
```

### 2. Execute in Supabase
```
1. Go to https://supabase.co/dashboard
2. Select project: vdusyjayoekgfbrxquwa
3. Click: SQL Editor → New Query
4. Paste (Ctrl+V)
5. Click: RUN ▶️
```

### 3. Verify Tables
```
Click: Table Editor
Look for: reminders, user_profiles, document_metadata, etc.
Should see: All 12 tables
```

✅ **Done!** You now have all dashboard tables.

---

## 📊 12 Tables Overview

### Critical (Dashboard Needs These)
- **reminders** - User reminders from documents
- **user_profiles** - User account info
- **user_statistics** - Dashboard metrics (docs, storage, scans)
- **document_metadata** - Extended OCR info (dates, vendors, etc.)

### Important (Subscriptions)
- **subscription_plans** - Free/Pro/Business tiers
- **user_subscriptions** - User's active plan

### Supporting (Organization)
- **document_categories** - User-created categories
- **document_tags** - User-created tags
- **notification_preferences** - Email/notification settings

### Tracking (Analytics)
- **user_activity_log** - All user actions
- **document_exports** - Export history
- **monthly_usage** - Monthly metrics

---

## 🔑 Key Fields (Most Important)

### reminders
- `user_id` - Who this reminder belongs to
- `reminder_date` - When reminder is due
- `reminder_type` - warranty_expiry, service_due, subscription_renewal, payment_due, custom
- `is_dismissed` - Filter for "upcoming" reminders

### user_profiles
- `user_id` - Links to Clerk auth
- `email`, `full_name`, `avatar_url` - Display info
- `theme_preference`, `timezone` - User settings

### user_statistics
- `total_documents_scanned` - Dashboard total
- `total_storage_used_bytes` - Storage used
- `successful_scans`, `failed_scans` - Success rate
- `average_confidence_score` - Quality metric

### document_metadata
- `ocr_result_id` - Links to scanned document
- `expiry_date`, `renewal_date` - For auto-reminders
- `vendor_name`, `vendor_email` - Contact info
- `is_starred` - User favorites

---

## 💻 Using in Code

### Import Types
```typescript
import { 
  Reminder, 
  UserProfile, 
  DocumentMetadata, 
  UserStatistics 
} from '@/types/dashboard';
```

### Query Reminders
```typescript
const { data: reminders } = await supabase
  .from('reminders')
  .select('*')
  .eq('user_id', userId)
  .eq('is_dismissed', false)
  .gte('reminder_date', today)
  .order('reminder_date', { ascending: true });
```

### Create Reminder
```typescript
await supabase.from('reminders').insert({
  user_id: userId,
  ocr_result_id: resultId,
  title: 'Warranty Expiring',
  reminder_type: 'warranty_expiry',
  reminder_date: expiryDate,
  notify_before_days: 30,
});
```

### Get User Stats
```typescript
const { data: stats } = await supabase
  .from('user_statistics')
  .select('*')
  .eq('user_id', userId)
  .single();
```

---

## 🔒 Security (RLS Enabled)

All user data is protected:
```sql
-- Users can ONLY see their own data
SELECT * FROM reminders WHERE user_id = current_user_id()
```

✅ User A cannot see User B's reminders  
✅ User A cannot see User B's statistics  
✅ System can update user_statistics  

---

## ❓ Common Questions

**Q: When do I run the migration?**  
A: Once, now, before building dashboard features.

**Q: Will it delete existing data?**  
A: No, it only creates new tables. OCR tables stay intact.

**Q: Can I modify table structure after?**  
A: Yes, but you'll need a new migration. Better to get it right first.

**Q: How do I know if it worked?**  
A: Check Supabase Table Editor. Should see all 12 tables.

**Q: What if I get an error?**  
A: See `HOW_TO_RUN_MIGRATION.md` Troubleshooting section.

**Q: Do I need to seed data?**  
A: Only subscription_plans table (optional but recommended).

**Q: How do reminders work?**  
A: Extract dates from OCR → Store in document_metadata → Create reminders automatically.

---

## 📋 Checklist

Before running migration:
- [ ] You have Supabase project open
- [ ] You can access SQL Editor
- [ ] You copied the migration SQL

After running migration:
- [ ] No SQL errors shown
- [ ] All 12 tables in Table Editor
- [ ] Can view table structures
- [ ] RLS is enabled (pg_tables shows 't')

Before building dashboard:
- [ ] TypeScript types compile
- [ ] Can query a table from React code
- [ ] Can insert a reminder
- [ ] RLS prevents cross-user access

---

## 🔗 Dashboard Data Flow

```
OCR Result
    ↓
Store in ocr_results (existing)
    ↓
Create document_metadata (new)
    ├→ Extract expiry_date
    ├→ Extract vendor_name
    └→ Extract other info
    ↓
Create reminders (new) ← If dates found
    ├→ warranty_expiry
    ├→ service_due
    ├→ subscription_renewal
    └→ payment_due
    ↓
Update user_statistics (new)
    ├→ +1 total_documents_scanned
    ├→ +file_size total_storage_used_bytes
    ├→ +1 successful_scans
    └→ Update average_confidence_score
    ↓
Dashboard Displays
    ├→ Total Documents (from user_statistics)
    ├→ Storage Used (from user_statistics)
    ├→ Upcoming Reminders (from reminders, is_dismissed=false)
    ├→ Recent Scans (from ocr_jobs + ocr_results)
    └→ Subscription Status (from user_subscriptions)
```

---

## 📞 Help Resources

- **Step-by-Step:** Read `HOW_TO_RUN_MIGRATION.md`
- **Table Details:** Read `DASHBOARD_MIGRATION_GUIDE.md`
- **Full Overview:** Read `DASHBOARD_IMPLEMENTATION_SUMMARY.md`
- **Supabase Docs:** https://supabase.com/docs

---

## ⏱️ Timeline

| Phase | Time | What |
|-------|------|------|
| **Now** | 5 min | Run migration SQL |
| **Now+5** | 2 min | Verify tables exist |
| **Now+10** | 1 min | Insert sample plans |
| **Next Day** | 1 hour | Create React hooks |
| **Next Day** | 2 hours | Update dashboard UI |
| **Next Day** | 1 hour | Add reminder auto-creation |
| **Ongoing** | - | Add features (exports, analytics, etc.) |

---

**Ready to start? Follow these 3 steps:**

1. 📋 Copy migration SQL from `supabase/migrations/20251210_dashboard_tables.sql`
2. 🚀 Paste and run in Supabase SQL Editor
3. ✅ Verify all 12 tables appear

**Total time: ~10 minutes**

Good luck! 🎉
