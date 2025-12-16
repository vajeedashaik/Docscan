# 🚀 DEPLOYMENT GUIDE - Steps 5-9

## Prerequisites Check
- [ ] Gmail API key obtained (Step 1)
- [ ] bill-documents bucket created (Step 4 - done ✓)
- [ ] Database migration run (Step 3 - done ✓)
- [ ] Supabase CLI installed: `npm install -g supabase`
- [ ] Logged in to Supabase: `supabase login`

## 1️⃣ Set Environment Secrets

Open terminal and run:

```bash
# Windows PowerShell
supabase secrets set `
  VITE_GOOGLE_CLIENT_ID="abc123.apps.googleusercontent.com" `
  GOOGLE_CLIENT_SECRET="your-client-secret-here" `
  APP_URL="https://yourdomain.com" `
  TOKEN_ENCRYPTION_KEY="your-random-32-char-key" `
  VITE_GOOGLE_VISION_API_KEY="your-vision-api-key"

# OR Linux/Mac bash
supabase secrets set \
  VITE_GOOGLE_CLIENT_ID="abc123.apps.googleusercontent.com" \
  GOOGLE_CLIENT_SECRET="your-client-secret-here" \
  APP_URL="https://yourdomain.com" \
  TOKEN_ENCRYPTION_KEY="your-random-32-char-key" \
  VITE_GOOGLE_VISION_API_KEY="your-vision-api-key"
```

**Replace these values:**
- `abc123.apps.googleusercontent.com` → Your actual Client ID
- `your-client-secret-here` → Your actual Client Secret
- `https://yourdomain.com` → Your actual app URL
- `your-random-32-char-key` → Generate random key (save securely!)
- `your-vision-api-key` → Your Vision API key

**For local development**, use:
```
APP_URL="http://localhost:5173"
```

## 2️⃣ Deploy Edge Functions

Deploy in this order:

### Function 1: OAuth Token Exchange
```bash
supabase functions deploy auth-gmail-token
```

Expected output:
```
✓ Function auth-gmail-token deployed successfully
```

### Function 2: Email Sync Cron
```bash
supabase functions deploy sync-email-bills
```

Expected output:
```
✓ Function sync-email-bills deployed successfully
```

### Function 3: OCR Processing
```bash
supabase functions deploy ocr-process-bill
```

Expected output:
```
✓ Function ocr-process-bill deployed successfully
```

### Verify All Functions
```bash
supabase functions list
```

Expected output:
```
ocr-extract              | Deployed
auth-gmail-token         | Deployed
sync-email-bills         | Deployed
ocr-process-bill         | Deployed
```

## 3️⃣ Update Local Environment

Edit `.env.local`:

```env
# Add these lines
VITE_GOOGLE_CLIENT_ID=abc123.apps.googleusercontent.com
VITE_GOOGLE_VISION_API_KEY=your-vision-api-key
```

**Do NOT add:**
- GOOGLE_CLIENT_SECRET (backend only!)
- TOKEN_ENCRYPTION_KEY (backend only!)

## 4️⃣ Restart Application

```bash
npm run dev
```

## 5️⃣ Test the Implementation

### Test 1: Routes
```
✓ Can navigate to http://localhost:5173/settings
✓ Settings page loads without errors
```

### Test 2: Gmail Connection
```
✓ Click "Connect Gmail" button
✓ Redirected to Google login
✓ See OAuth consent screen
✓ Redirected back to app
✓ See "Connected as: user@gmail.com"
```

### Test 3: Manual Email Sync
```
✓ Click "Sync Now" button
✓ See "Syncing..." message
✓ After sync completes, see imported bills list
✓ Bills show subject, sender, date
```

### Test 4: OCR Processing
```
✓ Click "Process" on an imported bill
✓ See "Processing..." spinner
✓ After processing, see "OCR Processed" badge
✓ Navigate to Reminders page
✓ See auto-created reminder with due date
```

### Test 5: Cron Automation
Wait 6 hours OR manually check logs:
```bash
supabase functions logs sync-email-bills --follow
```

Expected logs:
```
Found N active email imports to sync
Found M potential bill emails
Successfully synced emails for N users
```

## 6️⃣ Verify Database Records

### Check Email Imports
```sql
SELECT id, user_id, email_address, enabled, last_synced_at
FROM email_imports;
```

Expected: One row per connected user

### Check Imported Bills
```sql
SELECT id, subject, from_email, file_type, ocr_result_id
FROM imported_bills
ORDER BY created_at DESC
LIMIT 10;
```

Expected: Bills appear after sync

### Check OCR Results
```sql
SELECT id, user_id, extracted_data, created_at
FROM ocr_results
WHERE extracted_data IS NOT NULL
LIMIT 5;
```

Expected: OCR data with extracted text and dates

## 7️⃣ View Function Logs

### See Recent Logs
```bash
# OAuth endpoint
supabase functions logs auth-gmail-token

# Email sync
supabase functions logs sync-email-bills

# OCR processing
supabase functions logs ocr-process-bill
```

### Live Tail Logs
```bash
supabase functions logs sync-email-bills --follow
```

Press Ctrl+C to stop.

## 🐛 Troubleshooting

### "Function not found" error
```bash
# Verify functions deployed
supabase functions list

# If missing, deploy again
supabase functions deploy auth-gmail-token
```

### "Missing environment variable" error
```bash
# Check secrets set
supabase secrets list

# If missing, set them again
supabase secrets set VITE_GOOGLE_CLIENT_ID="..."
```

### OAuth callback fails
- Check `APP_URL` environment variable matches redirect URI
- Verify redirect URI in Google Cloud Console includes `/auth/gmail-callback`
- Check VITE_GOOGLE_CLIENT_ID matches Google Console

### Emails not syncing
- Check sync-email-bills logs: `supabase functions logs sync-email-bills`
- Verify OAuth token is not expired
- Check Gmail API is enabled in Google Cloud
- Wait up to 10 minutes for first cron run

### OCR processing fails
- Check ocr-process-bill logs: `supabase functions logs ocr-process-bill`
- Verify bill document uploaded to storage
- Check VITE_GOOGLE_VISION_API_KEY is valid
- Verify file format is supported (PDF, JPG, PNG)

## 📋 Production Deployment

For production Supabase project:

```bash
# Link to production project
supabase link --project-ref your-production-project-ref

# Set production secrets
supabase secrets set --prod \
  VITE_GOOGLE_CLIENT_ID="..." \
  GOOGLE_CLIENT_SECRET="..." \
  APP_URL="https://yourdomain.com" \
  TOKEN_ENCRYPTION_KEY="..." \
  VITE_GOOGLE_VISION_API_KEY="..."

# Deploy to production
supabase functions deploy --prod auth-gmail-token
supabase functions deploy --prod sync-email-bills
supabase functions deploy --prod ocr-process-bill

# Verify production
supabase functions --prod list
```

## 🎯 Success Checklist

- [ ] All 3 functions deployed successfully
- [ ] Environment variables set in Supabase
- [ ] .env.local updated with Client ID and Vision API key
- [ ] Application runs without errors
- [ ] Can navigate to /settings page
- [ ] "Connect Gmail" button works
- [ ] OAuth flow completes successfully
- [ ] Emails sync after clicking "Sync Now"
- [ ] Imported bills display in list
- [ ] OCR "Process" button works
- [ ] Reminder created with due date
- [ ] Email sync works automatically every 6 hours (check logs)
- [ ] No errors in Supabase function logs

## 📞 Getting Help

If deployment fails:

1. Check function logs:
   ```bash
   supabase functions logs <function-name>
   ```

2. Verify secrets:
   ```bash
   supabase secrets list
   ```

3. Check Google Cloud Console:
   - OAuth consent screen approved
   - Redirect URIs configured correctly
   - APIs enabled (Gmail, Vision)

4. Check Supabase database:
   - email_imports table has correct schema
   - RLS policies are enabled
   - bill-documents bucket exists and is public

---

**Expected Time**: 10-15 minutes
**Difficulty**: Medium
**Support**: Check EDGE_FUNCTIONS_DEPLOYMENT.md for detailed info
