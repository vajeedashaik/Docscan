# 🔧 Quick Fix for OAuth Callback Issues

## Error Analysis

You're getting these errors because:

1. **404 Not Found** on `/api/auth/gmail-token` - The Edge Function hasn't been deployed
2. **User not authenticated** - You might not be signed in with Clerk
3. **JSON parsing error** - Getting 404 HTML instead of JSON response

## ✅ Fixed in Code

Updated `src/pages/GmailCallback.tsx` to:
- Call the correct Supabase Edge Function endpoint
- Handle the actual response format from the function
- Better error handling

## 🚀 What You Need to Do Now

### 1. Ensure You're Signed In with Clerk
Before clicking "Connect Gmail":
- [ ] Sign in at `/auth` page with Clerk first
- [ ] You should see your profile in top right
- [ ] Only then click "Connect Gmail"

### 2. Deploy the Edge Function
```bash
cd c:\Users\vajee\Downloads\Docscan

# Set secrets first (one-time)
supabase secrets set \
  VITE_GOOGLE_CLIENT_ID="your-client-id" \
  GOOGLE_CLIENT_SECRET="your-client-secret" \
  APP_URL="http://localhost:5173" \
  TOKEN_ENCRYPTION_KEY="test-key-32-chars-long-string" \
  VITE_GOOGLE_VISION_API_KEY="your-vision-key"

# Deploy the OAuth endpoint
supabase functions deploy auth-gmail-token
```

### 3. Verify Function Deployed
```bash
# Check if function exists
supabase functions list

# You should see:
# auth-gmail-token | Deployed
```

### 4. Check Logs
```bash
# Watch the function logs while you test
supabase functions logs auth-gmail-token --follow
```

### 5. Add Test User to Google Console
Go to [Google Cloud Console](https://console.cloud.google.com/):
1. **APIs & Services** → **OAuth consent screen**
2. Scroll to **Test users**
3. Click **Add users**
4. Add: `shaiksofihafi@gmail.com`
5. Click **Save**

### 6. Restart App
```bash
npm run dev
```

### 7. Test the Flow
1. Go to `http://localhost:5173`
2. Click **Sign in with Clerk** (top right) → Sign in
3. Go to `/settings` page
4. Click **Connect Gmail** button
5. Allow the permissions
6. You should see: "Gmail connected successfully: your-email@gmail.com"

## 🐛 If Still Getting Errors

### Check these in order:

**Error: "User not authenticated"**
```
→ Sign in with Clerk first before clicking "Connect Gmail"
```

**Error: "404 Not Found"**
```bash
→ Deploy the function: supabase functions deploy auth-gmail-token
→ Check it's deployed: supabase functions list
→ Check logs: supabase functions logs auth-gmail-token
```

**Error: "Supabase URL not configured"**
```
→ Add to .env.local:
  VITE_SUPABASE_URL=https://your-project.supabase.co
```

**Error: "access_denied" from Google**
```
→ Add test user to Google Cloud Console OAuth consent screen
→ Make sure using the right Google account
```

**Error in function logs about missing secrets**
```bash
→ Set secrets: supabase secrets set VITE_GOOGLE_CLIENT_ID="..."
→ Redeploy: supabase functions deploy auth-gmail-token
```

## ✨ Expected Behavior After Fix

1. Sign in with Clerk ✓
2. Click "Connect Gmail" ✓
3. Redirected to Google login ✓
4. See OAuth consent screen ✓
5. Redirect back with success message ✓
6. See "Connected as: email@gmail.com" in settings ✓

---

**Next:** Deploy the function and test!
