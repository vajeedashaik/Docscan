# Google Cloud Vision API Setup Instructions

## The 401 Error Issue

The 401 error when calling Google Vision API from the browser means:

1. **API Key Restrictions**: Your API key likely has HTTP referrer restrictions that don't include `localhost:8080`
2. **Vision API Not Enabled**: The Vision API might not be enabled in your Google Cloud project
3. **Quota Issues**: Your project might have quota limits

## How to Fix

### Option 1: Fix API Key Restrictions (Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Credentials** → Select your API key
3. Under **Application restrictions**:
   - Select **HTTP referrers (web sites)**
   - Add these referrers:
     ```
     http://localhost:*
     http://192.168.0.110:*
     http://127.0.0.1:*
     ```
4. Click **Save**
5. Wait 1-2 minutes for changes to propagate

### Option 2: Create an Unrestricted API Key (Development Only)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Credentials** → **+ Create Credentials** → **API Key**
3. Copy the new key

u share screen
### Option 3: Enable Vision API

yes sorry i was saying that i alr told u tht its porlly we dont seeeachotehr and i fr dot lik the way u text im not tkaig it in the way ur meaning

no no this si fine inacse my dad comaes this is better
anyways aryan now go gym n cm back hafi is calling 
il tla
Console](https://console.cloud.google.com/)
2. Search for "Cloud Vision API"
3. Click **Enable**
4. Wait for enablement to complete
tgeres sn 

## Alternative Approach: Use Anthropic Claude (Backup)

If you want a backup OCR provider that works better with web apps, consider using:

```typescript
// In useOCR.ts
const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
// Use Claude's vision capabilities instead
```

## Testing

After fixing the API key restrictions:

1. Hard refresh your browser (Ctrl+Shift+R)
2. Clear browser cache
3. Open Developer Console (F12)
4. Try uploading an image again
5. Check console for detailed error messages
