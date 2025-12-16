/**
 * Email Import Feature Types
 */

export interface EmailImportSettings {
  id: string;
  user_id: string;
  provider: 'gmail';
  email_address: string;
  enabled: boolean;
  oauth_token?: string;
  oauth_refresh_token?: string;
  token_expires_at?: string;
  last_synced_at?: string;
  sync_error?: string;
  created_at: string;
  updated_at: string;
}

export interface ImportedBill {
  id: string;
  user_id: string;
  email_import_id: string;
  gmail_message_id: string;
  subject: string;
  from_email: string;
  received_at: string;
  file_url: string;
  file_type: 'attachment' | 'link';
  ocr_job_id?: string;
  ocr_result_id?: string;
  extracted_due_date?: string;
  reminder_created: boolean;
  created_at: string;
  updated_at: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet: string;
  payload: GmailMessagePayload;
  sizeEstimate: number;
  historyId: string;
  internalDate: string;
}

export interface GmailMessagePayload {
  partId?: string;
  mimeType: string;
  filename?: string;
  headers: Array<{
    name: string;
    value: string;
  }>;
  body: {
    size: number;
    data?: string;
    attachmentId?: string;
  };
  parts?: GmailMessagePayload[];
}

export interface GmailAttachment {
  filename: string;
  mimeType: string;
  attachmentId: string;
  partId: string;
  size?: number;
}

export interface EmailBillData {
  gmailMessageId: string;
  subject: string;
  fromEmail: string;
  receivedAt: string;
  fileUrl: string;
  fileType: 'attachment' | 'link';
  extractedDueDate?: string;
  filename?: string;
}

export interface SyncResult {
  processed: number;
  imported: number;
  errors: string[];
  startTime: Date;
  endTime: Date;
  duration: number; // in milliseconds
}

export interface EmailImportState {
  settings: EmailImportSettings | null;
  importedBills: ImportedBill[];
  loading: boolean;
  syncing: boolean;
  lastSync?: SyncResult;
  error?: string;
}

export interface OAuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  scope: string;
}

export interface GmailListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate: number;
}

export interface BillExtractionResult {
  messageId: string;
  subject: string;
  from: string;
  date: string;
  fileUrl: string;
  fileType: 'attachment' | 'link';
  confidenceScore: number;
  billType?: string; // 'invoice', 'statement', 'bill', etc.
}

export interface ReminderConfig {
  enabled: boolean;
  beforeDays: number[]; // [7, 3, 1] for 7 days, 3 days, 1 day before
  notifyVia: ('email' | 'in-app' | 'sms')[];
}

export interface EmailImportConfig {
  enabled: boolean;
  maxEmailsPerSync: number;
  lookbackDays: number;
  syncIntervalMinutes: number;
  billKeywords: string[];
  supportedFileTypes: string[];
  oauthScope: string;
  callbackPath: string;
  storageBucket: string;
  reminders: ReminderConfig;
  maxRetries: number;
  retryDelayMs: number;
}
