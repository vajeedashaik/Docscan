You are a senior full-stack web engineer.

I have a web application called "ReNotify".

CURRENT SETUP:
- Web app (Next.js / React)
- Clerk authentication
- Supabase database
- Google Cloud Vision OCR
- Existing logic to extract dates and create reminders from scanned images

I want to add a new feature: "Auto Email Bill Import" (Cred-like behavior).

GOAL:
Automatically fetch bills sent to the user's email address (the same email they used to sign in with Clerk),
extract due/expiry dates from those bills, and create reminders — without manual uploads.

IMPORTANT CONSTRAINTS:
- The app is a WEBSITE, not a mobile app
- Use the email associated with the logged-in Clerk user
- Do NOT read emails without explicit user consent
- Use OAuth-based access (Gmail only for now)
- Read-only access
- Only scan bill-related emails

AUTH & USER CONTEXT:
1. User logs in via Clerk
2. Fetch the user's primary email from Clerk
3. Show a toggle: "Enable Auto Email Bill Import"
4. If enabled:
   - If the email provider is Gmail, start Google OAuth
   - Request ONLY this scope:
     https://www.googleapis.com/auth/gmail.readonly
5. Store OAuth tokens securely per user

GMAIL INTEGRATION (WEB):
- Use Gmail API
- Fetch emails from the last 30–60 days
- Filter emails using keywords:
  "bill", "invoice", "statement", "due", "payment", "amount due"
- For each matching email:
  - If attachment exists (PDF/image), download it
  - If email contains a bill download link, extract the link

PROCESSING PIPELINE:
1. Download attachment or fetch document via link
2. Send file to existing OCR pipeline (Google Cloud Vision)
3. Extract full text
4. Reuse existing date extraction logic
5. Identify the most relevant upcoming date
6. Ignore past dates
7. If multiple dates exist, choose the highest confidence date
8. Save document metadata in Supabase

DATABASE CHANGES:
Add a new table:

email_imports:
- id (uuid)
- user_id (Clerk userId)
- provider (gmail)
- email_address
- enabled (boolean)
- last_synced_at (timestamp)

For imported documents:
- Mark source = "email"
- Store Gmail messageId
- Prevent duplicate imports

REMINDER LOGIC:
- Automatically create reminders (7 days, 3 days, 1 day before)
- Use existing reminder scheduling logic
- Reminders should appear in the existing dashboard

SECURITY & PRIVACY:
- Read-only Gmail access
- Only bill-related emails
- No email content stored unless a bill is detected
- Allow user to disable email import anytime
- Delete stored OAuth tokens when disabled

DELIVERABLES:
- Gmail OAuth integration for a web app
- Clerk user email retrieval
- Backend email scanning service
- Attachment and bill-link extraction
- Integration with existing OCR + reminder pipeline
- Supabase schema updates with RLS
