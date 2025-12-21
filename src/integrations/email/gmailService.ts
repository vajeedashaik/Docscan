import { supabase } from '@/integrations/supabase/client';

const GMAIL_API_URL = 'https://www.googleapis.com/gmail/v1';
const FUNCTIONS_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
// Request both Gmail access and permission to read the user's email address.
// We include standard OpenID/userinfo scopes so the token works with the
// https://www.googleapis.com/oauth2/v2/userinfo endpoint used in the Edge Function.
const GMAIL_OAUTH_SCOPE = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/gmail.readonly',
].join(' ');

export interface EmailImportSettings {
  id: string;
  user_id: string;
  provider: 'gmail';
  email_address: string;
  enabled: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ImportedBill {
  id: string;
  user_id: string;
  gmail_message_id: string;
  subject: string;
  from_email: string;
  received_at: string;
  file_url: string;
  file_type: 'attachment' | 'link';
  extracted_due_date: string | null;
  created_at: string;
}

// Initialize Gmail OAuth flow
export const initiateGmailOAuth = async (clientId: string): Promise<string> => {
  const redirectUri = `${window.location.origin}/auth/gmail-callback`;
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GMAIL_OAUTH_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state: generateState(),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

// Generate a random state for OAuth security
const generateState = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Save email import settings
export const saveEmailImportSettings = async (
  userId: string,
  email: string,
  enabled: boolean,
  accessToken?: string,
  refreshToken?: string,
  expiresIn?: number
) => {
  try {
    const tokenExpiresAt = expiresIn 
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from('email_imports')
      .upsert({
        user_id: userId,
        email_address: email,
        enabled,
        oauth_token: accessToken || null,
        oauth_refresh_token: refreshToken || null,
        token_expires_at: tokenExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as EmailImportSettings;
  } catch (error) {
    console.error('Error saving email import settings:', error);
    throw error;
  }
};

// Get email import settings for a user
export const getEmailImportSettings = async (userId: string): Promise<EmailImportSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('email_imports')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
    return data as EmailImportSettings | null;
  } catch (error) {
    console.error('Error fetching email import settings:', error);
    throw error;
  }
};

// Toggle email import
export const toggleEmailImport = async (userId: string, enabled: boolean): Promise<EmailImportSettings> => {
  try {
    const { data, error } = await supabase
      .from('email_imports')
      .update({
        enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as EmailImportSettings;
  } catch (error) {
    console.error('Error toggling email import:', error);
    throw error;
  }
};

// Disconnect email import (delete OAuth tokens)
export const disconnectEmailImport = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('email_imports')
      .update({
        enabled: false,
        oauth_token: null,
        oauth_refresh_token: null,
        token_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error disconnecting email import:', error);
    throw error;
  }
};

// Fetch emails from Gmail API
export const fetchEmailsFromGmail = async (
  accessToken: string,
  query: string = 'bill OR invoice OR statement OR "due date" OR "payment due"',
  maxResults: number = 10
): Promise<any[]> => {
  try {
    // First, get message IDs
    const listResponse = await fetch(
      `${GMAIL_API_URL}/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!listResponse.ok) {
      throw new Error(`Gmail API error: ${listResponse.statusText}`);
    }

    const listData = await listResponse.json();
    const messageIds = listData.messages || [];

    // Fetch full message details for each ID
    const messages = await Promise.all(
      messageIds.map(({ id }: { id: string }) =>
        fetch(`${GMAIL_API_URL}/users/me/messages/${id}?format=full`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
          .then(res => res.json())
          .catch(err => {
            console.error(`Failed to fetch message ${id}:`, err);
            return null;
          })
      )
    );

    return messages.filter(msg => msg !== null);
  } catch (error) {
    console.error('Error fetching emails from Gmail:', error);
    throw error;
  }
};

// Extract headers from Gmail message
export const extractMessageHeaders = (message: any) => {
  const headers = message.payload?.headers || [];
  const headerMap: Record<string, string> = {};

  headers.forEach(({ name, value }: { name: string; value: string }) => {
    headerMap[name.toLowerCase()] = value;
  });

  return {
    subject: headerMap['subject'] || '',
    from: headerMap['from'] || '',
    date: headerMap['date'] || '',
    messageId: message.id,
  };
};

// Extract attachment info from Gmail message
export const extractAttachments = (message: any): any[] => {
  const attachments: any[] = [];
  const parts = message.payload?.parts || [];

  parts.forEach((part: any) => {
    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType,
        attachmentId: part.body.attachmentId,
        partId: part.partId,
      });
    }
  });

  return attachments;
};

// Download attachment from Gmail
export const downloadGmailAttachment = async (
  accessToken: string,
  messageId: string,
  attachmentId: string
): Promise<Blob> => {
  try {
    const response = await fetch(
      `${GMAIL_API_URL}/users/me/messages/${messageId}/attachments/${attachmentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to download attachment: ${response.statusText}`);
    }

    const data = await response.json();
    const base64Data = data.data.replace(/-/g, '+').replace(/_/g, '/');
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return new Blob([bytes]);
  } catch (error) {
    console.error('Error downloading attachment:', error);
    throw error;
  }
};

// Save imported bill to database
export const saveImportedBill = async (
  userId: string,
  emailImportId: string,
  billData: {
    gmailMessageId: string;
    subject: string;
    fromEmail: string;
    receivedAt: string;
    fileUrl: string;
    fileType: 'attachment' | 'link';
    extractedDueDate?: string;
  }
): Promise<ImportedBill> => {
  try {
    const { data, error } = await supabase
      .from('imported_bills')
      .insert({
        user_id: userId,
        email_import_id: emailImportId,
        gmail_message_id: billData.gmailMessageId,
        subject: billData.subject,
        from_email: billData.fromEmail,
        received_at: billData.receivedAt,
        file_url: billData.fileUrl,
        file_type: billData.fileType,
        extracted_due_date: billData.extractedDueDate || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as ImportedBill;
  } catch (error) {
    console.error('Error saving imported bill:', error);
    throw error;
  }
};

// Check if bill already imported
export const isBillAlreadyImported = async (userId: string, gmailMessageId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('imported_bills')
      .select('id')
      .eq('user_id', userId)
      .eq('gmail_message_id', gmailMessageId)
      .limit(1);

    if (error) throw error;
    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking if bill imported:', error);
    return false;
  }
};

// Get imported bills for a user
export const getImportedBills = async (userId: string, limit: number = 50): Promise<ImportedBill[]> => {
  try {
    const { data, error } = await supabase
      .from('imported_bills')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as ImportedBill[];
  } catch (error) {
    console.error('Error fetching imported bills:', error);
    return [];
  }
};

// Manually trigger the sync-email-bills edge function
export const triggerEmailSync = async (): Promise<{
  success: boolean;
  synced: number;
  errors: number;
  errorDetails?: string[];
  message: string;
}> => {
  if (!import.meta.env.VITE_SUPABASE_URL) {
    throw new Error('SUPABASE_URL is not configured');
  }

  const response = await fetch(`${FUNCTIONS_BASE_URL}/sync-email-bills`, {
    method: 'POST',
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `Failed to trigger email sync: ${response.status} ${response.statusText} ${text}`,
    );
  }

  const result = await response.json();
  return result;
};

// Update last synced time
export const updateLastSyncedAt = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('email_imports')
      .update({
        last_synced_at: new Date().toISOString(),
        sync_error: null,
      })
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating last synced time:', error);
    throw error;
  }
};

// Update sync error
export const updateSyncError = async (userId: string, errorMessage: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('email_imports')
      .update({
        sync_error: errorMessage,
      })
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating sync error:', error);
    throw error;
  }
};
