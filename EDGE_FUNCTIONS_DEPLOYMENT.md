# Supabase Edge Functions Deployment Guide

This guide covers deploying all the Edge Functions needed for the Email Bill Import feature.

## Prerequisites

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login
```

## Functions to Deploy

### 1. OAuth Token Exchange - `auth-gmail-token`
Handles the OAuth 2.0 token exchange with Google API.

**Location**: `supabase/functions/auth-gmail-token/index.ts`

**Environment Variables Required**:
- `VITE_GOOGLE_CLIENT_ID` - Your Google Cloud Console Client ID
- `GOOGLE_CLIENT_SECRET` - Your Google Cloud Console Client Secret (secret only)
- `APP_URL` - Your application URL (e.g., http://localhost:5173 or https://yourdomain.com)
- `TOKEN_ENCRYPTION_KEY` - Master key for token encryption

**Deploy**:
```bash
supabase functions deploy auth-gmail-token
```

### 2. Email Sync Cron Job - `sync-email-bills`
Periodically syncs emails and imports bills. Runs on a schedule (default: every 6 hours).

**Location**: `supabase/functions/sync-email-bills/index.ts`

**Configuration**: `supabase/functions/sync-email-bills/config.toml`

**Schedule Options**:
```toml
# Every 6 hours (default)
crons = ["0 */6 * * *"]

# Every 4 hours
crons = ["0 */4 * * *"]

# Every 2 hours
crons = ["0 */2 * * *"]

# Twice daily
crons = ["0 9,17 * * *"]

# Daily at midnight UTC
crons = ["0 0 * * *"]
```

**Deploy**:
```bash
supabase functions deploy sync-email-bills
```

### 3. OCR Processing - `ocr-process-bill`
Processes imported bills through Google Vision API for text extraction.

**Location**: `supabase/functions/ocr-process-bill/index.ts`

**Environment Variables Required**:
- `VITE_GOOGLE_VISION_API_KEY` - Your Google Vision API key

**Deploy**:
```bash
supabase functions deploy ocr-process-bill
```

## Complete Deployment Steps

```bash
# 1. Set environment variables in Supabase
supabase secrets set \
  VITE_GOOGLE_CLIENT_ID="your-client-id" \
  GOOGLE_CLIENT_SECRET="your-client-secret" \
  APP_URL="http://localhost:5173" \
  TOKEN_ENCRYPTION_KEY="your-encryption-key" \
  VITE_GOOGLE_VISION_API_KEY="your-vision-api-key"

# 2. Deploy all functions
supabase functions deploy auth-gmail-token
supabase functions deploy sync-email-bills
supabase functions deploy ocr-process-bill

# 3. Verify deployment
supabase functions list

# 4. View logs (after functions run)
supabase functions logs auth-gmail-token
supabase functions logs sync-email-bills
supabase functions logs ocr-process-bill
```

## Testing Functions Locally

```bash
# Start local Supabase
supabase start

# Test auth-gmail-token endpoint
curl -X POST http://localhost:54321/functions/v1/auth-gmail-token \
  -H "Content-Type: application/json" \
  -d '{"code":"auth-code-from-oauth","userId":"user-id"}'

# Test sync-email-bills endpoint
curl -X POST http://localhost:54321/functions/v1/sync-email-bills \
  -H "Content-Type: application/json" \
  -d '{}'

# Test ocr-process-bill endpoint
curl -X POST http://localhost:54321/functions/v1/ocr-process-bill \
  -H "Content-Type: application/json" \
  -d '{
    "importedBillId":"bill-id",
    "userId":"user-id",
    "storagePath":"bills/user/file.pdf",
    "billSubject":"Invoice #123"
  }'
```

## Viewing Logs

```bash
# Real-time logs for a function
supabase functions logs auth-gmail-token --follow

# Filter logs by level
supabase functions logs sync-email-bills --level=error

# View logs for specific time range
supabase functions logs ocr-process-bill --start-date 2024-01-01
```

## Troubleshooting

### Function fails with 401 error
- Check that `VITE_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correctly set
- Verify Client Secret is not exposed in frontend code (backend only)

### Cron job not running
- Verify `config.toml` exists and has correct syntax
- Check Supabase cron extension is enabled: `supabase edge-functions crons list`
- Cron times are in UTC

### OCR processing fails
- Ensure `VITE_GOOGLE_VISION_API_KEY` is set correctly
- Check bill document is properly uploaded to storage
- Verify Google Vision API is enabled in Google Cloud Console

### Token expiration issues
- Implement token refresh logic using refresh token
- Verify `token_expires_at` is set correctly after OAuth exchange
- Check encryption key is consistent across function invocations

## Production Deployment

For production deployment to Supabase Cloud:

```bash
# Link to production project
supabase projects list
supabase link --project-ref <production-project-id>

# Deploy to production
supabase functions deploy --prod auth-gmail-token
supabase functions deploy --prod sync-email-bills
supabase functions deploy --prod ocr-process-bill

# Set production secrets
supabase secrets set --prod \
  VITE_GOOGLE_CLIENT_ID="prod-client-id" \
  GOOGLE_CLIENT_SECRET="prod-client-secret" \
  ...
```

## Function URLs

After deployment, functions are available at:

```
https://<project-id>.supabase.co/functions/v1/auth-gmail-token
https://<project-id>.supabase.co/functions/v1/sync-email-bills
https://<project-id>.supabase.co/functions/v1/ocr-process-bill
```

For local development:
```
http://localhost:54321/functions/v1/auth-gmail-token
http://localhost:54321/functions/v1/sync-email-bills
http://localhost:54321/functions/v1/ocr-process-bill
```
