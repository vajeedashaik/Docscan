# Deployment Guide: Bill OCR Gmail Authentication Fix

## Overview
This document provides step-by-step instructions to deploy the fix for the 401 Unauthorized error when downloading Gmail bill attachments.

## What Was Fixed
- **Issue**: Frontend was attempting to download Gmail attachments without proper authentication tokens
- **Error**: `401 Unauthorized` when calling Gmail API from browser
- **Solution**: Moved all Gmail operations to a secure Supabase Edge Function

## Pre-Deployment Checklist

✅ **Required**:
- [ ] Supabase CLI installed (`npm install -g supabase` or `bun install -g supabase`)
- [ ] Access to Supabase project settings
- [ ] Google Vision API key configured in Supabase environment
- [ ] Supabase Project URL and Service Role Key

## Deployment Steps

### Step 1: Deploy the Edge Function

```bash
# Navigate to project root
cd "c:\Users\vajee\OneDrive\Desktop\DOCSCAN-3\Docscan"

# Link to Supabase (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the process-bill-ocr Edge Function
supabase functions deploy process-bill-ocr

# Verify deployment (should show success message)
# Output: "✓ Function process-bill-ocr deployed successfully"
```

### Step 2: Verify Environment Variables

In Supabase Dashboard:
1. Go to **Settings > Edge Functions > Secrets**
2. Ensure these variables exist:
   - `GOOGLE_VISION_API_KEY` - Your Google Cloud Vision API key
   - `SUPABASE_URL` - Your Supabase project URL (auto-set)
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key (auto-set)

If `GOOGLE_VISION_API_KEY` is missing:
```bash
supabase secrets set GOOGLE_VISION_API_KEY="your-api-key-here"
```

### Step 3: Build and Deploy Frontend

```bash
# Install dependencies
npm install
# or
bun install

# Build the frontend
npm run build
# or
bun run build

# The build should complete without errors
```

### Step 4: Test Locally (Optional)

```bash
# Start development server
npm run dev
# or
bun run dev

# Open browser to http://localhost:5173
# Navigate to Email Import section
# Try to process a bill
```

### Step 5: Deploy to Production

Choose your deployment method:

#### Option A: Vercel/Netlify
```bash
# Push changes to Git
git add .
git commit -m "Fix: Bill OCR Gmail authentication - use Edge Function"
git push

# Deployment will trigger automatically based on your CI/CD setup
```

#### Option B: Manual Build
```bash
npm run build
# Upload dist/ folder to your hosting service
```

#### Option C: Docker
```bash
# If using Docker, rebuild and deploy
docker build -t docscan:latest .
docker push your-registry/docscan:latest
```

## Testing the Fix

### Local Testing
1. Start dev server: `npm run dev`
2. Navigate to "Email Import" → "Imported Bills"
3. Find an imported bill with an attachment
4. Click "Process Bill"
5. **Expected result**: Bill processes successfully, dates are extracted, reminder is created

### Production Testing
1. Go to production URL
2. Same steps as local testing
3. Check browser console (F12) for no errors

### Success Indicators
✅ Browser console shows:
```
Step 1: Processing bill through Edge Function...
Step 2: Fetching OCR result...
Step 3: Extracting dates and creating reminders...
Bill processing complete: [Subject]
```

✅ UI shows:
- "Bill processed: [Subject]" success toast
- OCR Processed badge appears on bill

### Error Scenarios

If you see **"Email settings not found"**:
- User must reconnect Gmail
- Go to Settings → Email Import → Reconnect Gmail

If you see **"Failed to decrypt access token"**:
- Gmail token is corrupted
- User must reconnect Gmail

If you see **"Google Vision API error"**:
- Check GOOGLE_VISION_API_KEY is set correctly
- Verify API key has Vision API enabled in Google Cloud Console

If you see **"Failed to download Gmail attachment: 401"**:
- User's OAuth token has expired
- User must reconnect Gmail
- Consider implementing token refresh (future enhancement)

## Rollback Plan

If issues occur, to revert to previous version:

```bash
# If deployed to Supabase, delete the function
supabase functions delete process-bill-ocr

# Revert source code changes
git checkout HEAD~ 1

# Redeploy old version
npm run build
git push
```

## Monitoring

After deployment, monitor:

1. **Supabase Edge Function Logs**
   - Dashboard → Edge Functions → process-bill-ocr → Logs
   - Look for error patterns

2. **Application Logs**
   - Browser console (F12)
   - Application's error tracking (Sentry, etc.)

3. **Database Queries**
   - Monitor `imported_bills` table for `ocr_status` changes
   - Monitor `ocr_results` table for successful inserts

## Performance Impact

- **Frontend**: No additional network overhead, faster UI response
- **Backend**: ~2-5 seconds per bill (download + OCR)
- **API Quotas**: Each bill uses 1 Google Vision API call

## Files Changed

### Modified
1. `src/integrations/email/billOCRIntegration.ts`
   - Removed: `downloadBillDocument()`, `uploadBillToStorage()`, `createOCRJobFromBill()`
   - Added: `processBillOCRViaEdgeFunction()`
   - Updated: `processImportedBillFull()`, `processBillOCRResult()`

2. `src/components/email-import/ImportedBillsList.tsx`
   - Updated comment on access token handling

3. `src/hooks/useOCRBillIntegration.ts`
   - Removed: Access token requirement from all functions
   - Updated: `processBill()`, `processBatch()`, `retryFailedBill()`

### New
1. `supabase/functions/process-bill-ocr/index.ts`
   - Complete Edge Function for secure Gmail operations

## Support

For issues during deployment:

1. Check [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
2. Review Edge Function logs in Supabase dashboard
3. Verify all environment variables are set
4. Check Google Vision API quota and billing

## Next Steps

After successful deployment:

1. **Token Refresh**: Implement automatic OAuth token refresh when expired
2. **Batch Processing**: Add progress bar for processing multiple bills
3. **Error Notifications**: Send user notifications when bills fail to process
4. **Attachment Types**: Support DOCX, XLSX, and other formats
5. **Caching**: Cache extracted text to avoid re-processing

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Status**: [ ] Successful [ ] Needs Review [ ] Rollback Required
