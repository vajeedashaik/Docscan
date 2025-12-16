-- Email Imports Table Migration
-- Created: December 16, 2025
-- Purpose: Store email import settings and track imported bills

-- 1. EMAIL_IMPORTS TABLE - Store user email import settings and OAuth tokens
CREATE TABLE IF NOT EXISTS public.email_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'gmail', -- 'gmail' is the only provider for now
  email_address TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  oauth_token TEXT, -- Encrypted JWT or encrypted token
  oauth_refresh_token TEXT, -- For refreshing expired tokens
  token_expires_at TIMESTAMP WITH TIME ZONE,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_error TEXT, -- Store last sync error if any
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_provider CHECK (provider IN ('gmail'))
);

-- 2. IMPORTED_BILLS TABLE - Track bills imported from email to prevent duplicates
CREATE TABLE IF NOT EXISTS public.imported_bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  email_import_id UUID NOT NULL REFERENCES public.email_imports(id) ON DELETE CASCADE,
  gmail_message_id TEXT, -- Gmail's unique message ID
  subject TEXT,
  from_email TEXT,
  received_at TIMESTAMP WITH TIME ZONE,
  file_url TEXT, -- URL to the attachment or extracted link
  file_type TEXT, -- 'attachment' or 'link'
  ocr_job_id UUID REFERENCES public.ocr_jobs(id) ON DELETE SET NULL,
  ocr_result_id UUID REFERENCES public.ocr_results(id) ON DELETE SET NULL,
  extracted_due_date DATE,
  reminder_created BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, gmail_message_id)
);

-- 3. INDEXES for better query performance
CREATE INDEX IF NOT EXISTS idx_email_imports_user_id ON public.email_imports(user_id);
CREATE INDEX IF NOT EXISTS idx_email_imports_enabled ON public.email_imports(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_imported_bills_user_id ON public.imported_bills(user_id);
CREATE INDEX IF NOT EXISTS idx_imported_bills_email_import_id ON public.imported_bills(email_import_id);
CREATE INDEX IF NOT EXISTS idx_imported_bills_gmail_message_id ON public.imported_bills(gmail_message_id);
CREATE INDEX IF NOT EXISTS idx_imported_bills_created_at ON public.imported_bills(created_at);

-- 4. ROW LEVEL SECURITY POLICIES
ALTER TABLE public.email_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imported_bills ENABLE ROW LEVEL SECURITY;

-- Email imports policies
CREATE POLICY "Users can view their own email import settings" ON public.email_imports
  FOR SELECT USING (true); -- Application will filter by user_id

CREATE POLICY "Users can insert their own email import settings" ON public.email_imports
  FOR INSERT WITH CHECK (true); -- Application will set user_id

CREATE POLICY "Users can update their own email import settings" ON public.email_imports
  FOR UPDATE USING (true); -- Application will filter by user_id

CREATE POLICY "Users can delete their own email import settings" ON public.email_imports
  FOR DELETE USING (true); -- Application will filter by user_id

-- Imported bills policies
CREATE POLICY "Users can view their own imported bills" ON public.imported_bills
  FOR SELECT USING (true); -- Application will filter by user_id

CREATE POLICY "Users can insert their own imported bills" ON public.imported_bills
  FOR INSERT WITH CHECK (true); -- Application will set user_id

CREATE POLICY "Users can update their own imported bills" ON public.imported_bills
  FOR UPDATE USING (true); -- Application will filter by user_id

-- 5. COMMENTS
COMMENT ON TABLE public.email_imports IS 'Stores email import settings and OAuth tokens for users who enable email bill imports';
COMMENT ON TABLE public.imported_bills IS 'Tracks bills imported from email to prevent duplicates and store metadata';
COMMENT ON COLUMN public.email_imports.oauth_token IS 'Encrypted OAuth token for Gmail API access (read-only)';
COMMENT ON COLUMN public.email_imports.oauth_refresh_token IS 'Encrypted refresh token for obtaining new access tokens';
COMMENT ON COLUMN public.imported_bills.file_type IS 'Either "attachment" if from email attachment or "link" if extracted from email body';
