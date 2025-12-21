# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Setup
```powershell
# Install dependencies
npm i

# Start development server (runs on localhost:8080)
npm run dev
```

### Build & Deploy
```powershell
# Production build
npm run build

# Development build (with source maps)
npm run build:dev

# Preview production build
npm run preview
```

### Code Quality
```powershell
# Run ESLint
npm run lint
```

Note: There are no test scripts configured. To add testing, you'll need to install a test framework (e.g., Vitest, Jest).

## High-Level Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript, Vite, SWC compiler
- **UI Framework**: shadcn-ui components + Radix UI primitives + Tailwind CSS
- **Authentication**: Clerk (user auth & management)
- **Backend/Database**: Supabase (PostgreSQL + real-time subscriptions + edge functions)
- **OCR Engine**: Google Vision API
- **State Management**: React Query (@tanstack/react-query) + Context API

### Core Application Flow

**Document Processing Pipeline:**
1. User uploads document → `useOCR` hook
2. Image preprocessing (contrast, denoise, resize) → `lib/image-preprocessing`
3. OCR extraction via Google Vision API → extracts text + confidence
4. Entity extraction → `lib/entity-extraction` (dates, vendor, amounts, document type)
5. Reminder generation → based on extracted dates (warranty expiry, service due, etc.)
6. Database persistence → Supabase tables (`ocr_jobs`, `ocr_results`, `document_metadata`, `reminders`)
7. Real-time updates → subscriptions notify all connected clients

**Real-time Sync:**
- All major data tables use PostgreSQL change events via Supabase subscriptions
- Hooks (`useReminders`, `useDocumentMetadata`) auto-subscribe on mount
- Changes appear instantly across all open browser tabs/windows

**Authentication Flow:**
- Clerk provides auth layer with JWT tokens
- User ID synced between Clerk and Supabase
- All database queries filtered by `user_id` (row-level security)

### Directory Structure

```
src/
├── components/
│   ├── dashboard/        # Dashboard UI components
│   ├── email-import/     # Gmail integration components
│   ├── layout/           # Header, nav, layout wrappers
│   ├── notifications/    # Notification system UI
│   ├── ocr/              # OCR upload & processing UI
│   ├── reminders/        # Reminder list & management
│   └── ui/               # shadcn-ui base components
├── contexts/
│   └── AuthContext.tsx   # Clerk authentication wrapper
├── hooks/
│   ├── useOCR.ts         # Main OCR processing hook
│   ├── useReminders.ts   # Reminder CRUD + real-time sync
│   ├── useDocumentMetadata.ts  # Document data management
│   ├── useNotifications.ts     # Browser notifications
│   └── useUserStatistics.ts    # Usage tracking
├── integrations/
│   ├── supabase/         # Supabase client + types
│   └── email/            # Gmail API integration
├── lib/
│   ├── entity-extraction.ts    # Extract dates, vendors, amounts from text
│   └── image-preprocessing.ts  # Image quality enhancement
├── pages/               # Route components
└── types/
    └── ocr.ts          # Core TypeScript types
```

### Key Database Tables

**Core OCR Data:**
- `ocr_jobs` - Original upload metadata
- `ocr_results` - Extracted text + structured data (JSONB fields)
- `document_metadata` - User-facing document info (vendor, dates, amount)

**Reminders & Notifications:**
- `reminders` - Deadline alerts (warranty expiry, service due, payment due)
- `notification_preferences` - Per-user notification settings
- `user_statistics` - Usage metrics (scans, confidence, etc.)

**Email Integration:**
- `email_imports` - Imported bills from Gmail
- Related edge functions: `sync-email-bills`, `ocr-process-bill`

### Important Patterns

**Entity Extraction (Priority-Based Date Detection):**
The system uses a priority scoring system to identify important dates:
- Warranty expiry (priority 100) - highest importance
- Service due (priority 85)
- Payment due (priority 75)
- Purchase/invoice dates (priority 50)

Each date in the document is scored based on surrounding keywords, and the highest-priority date for each category is selected. This prevents confusion when documents contain multiple dates.

**Real-time Subscriptions:**
All hooks that need real-time data follow this pattern:
```typescript
useEffect(() => {
  if (!userId) return;
  
  const channel = supabase
    .channel(`table_name:${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'table_name',
      filter: `user_id=eq.${userId}`
    }, (payload) => {
      // Update local state based on payload.eventType
    })
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}, [userId]);
```

**Date Parsing:**
Both `useOCR.ts` and `useReminders.ts` have a `parseDate()` helper that handles multiple formats:
- ISO (YYYY-MM-DD)
- European (DD/MM/YYYY or DD.MM.YYYY)
- US (MM/DD/YYYY)

This ensures consistent date storage in the database as ISO strings.

**Toast Notifications:**
Use `sonner` for user-facing toast messages:
```typescript
import { toast } from 'sonner';
toast.success('Operation completed');
toast.error('Something went wrong');
```

### Environment Variables

Required in `.env.local`:
```
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=

# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=

# Google Vision OCR
VITE_GOOGLE_VISION_API_KEY=

# Gmail Integration (optional)
VITE_GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

All client-side env vars must be prefixed with `VITE_` to be exposed by Vite.

### Path Aliases

The project uses `@/` as an alias for `src/`:
```typescript
import { supabase } from '@/integrations/supabase/client';
import { useOCR } from '@/hooks/useOCR';
```

Configured in `vite.config.ts` and `tsconfig.json`.

### ESLint Configuration

- TypeScript ESLint enabled
- React Hooks rules enforced
- `@typescript-eslint/no-unused-vars` disabled (set to "off")
- React Refresh plugin active for fast HMR

### Supabase Edge Functions

Located in `supabase/functions/`:
- `auth-gmail-token` - OAuth token exchange for Gmail
- `ocr-extract`, `ocr-process-bill`, `process-bill-ocr` - Server-side OCR processing
- `sync-email-bills` - Automated bill import from Gmail

Deploy with Supabase CLI:
```bash
supabase functions deploy function-name
```

### Common Development Workflows

**Adding a new reminder type:**
1. Update `Reminder` interface in `hooks/useReminders.ts`
2. Add to `validTypes` array in `createRemindersFromOCR()`
3. Update `reminder_type` enum in Supabase migration
4. Add UI handling in reminder components

**Adding new entity extraction:**
1. Add pattern/keywords in `lib/entity-extraction.ts`
2. Create extraction function (e.g., `extractNewField()`)
3. Call from `useOCR.processSingleFile()`
4. Store in `ocr_results.extracted_data` JSONB field

**Creating a new real-time hook:**
1. Follow pattern from `useReminders.ts` or `useDocumentMetadata.ts`
2. Set up subscription with user-filtered channel
3. Handle INSERT, UPDATE, DELETE events
4. Clean up subscription on unmount

### Debugging Tips

**OCR not extracting dates correctly:**
- Check `lib/entity-extraction.ts` patterns
- Review priority scoring in `extractDateDetails()`
- Console log `dateContexts` array to see all found dates + scores

**Real-time updates not working:**
- Verify Supabase row-level security policies allow user access
- Check browser console for subscription errors
- Ensure `user_id` filter matches authenticated user

**Image quality issues:**
- Review preprocessing logic in `lib/image-preprocessing.ts`
- Adjust quality thresholds in `useOCR` hook
- Google Vision works best with images 2048px or smaller

### Key External Documentation

- Supabase: https://supabase.com/docs
- Clerk: https://clerk.com/docs
- Google Vision API: https://cloud.google.com/vision/docs
- shadcn-ui: https://ui.shadcn.com
- Vite: https://vitejs.dev
