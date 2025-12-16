/**
 * Email Bill Processing Service
 * Handles fetching bills from Gmail, processing them through OCR,
 * and creating reminders
 */

import { supabase } from '@/integrations/supabase/client';
import {
  fetchEmailsFromGmail,
  extractMessageHeaders,
  extractAttachments,
  downloadGmailAttachment,
  saveImportedBill,
  isBillAlreadyImported,
  updateLastSyncedAt,
  updateSyncError,
  type EmailImportSettings,
} from '@/integrations/email/gmailService';

const BILL_KEYWORDS = [
  'bill',
  'invoice',
  'statement',
  'due',
  'payment',
  'amount due',
  'bill due',
  'invoice due',
];

interface ProcessedBill {
  messageId: string;
  subject: string;
  from: string;
  date: string;
  fileUrl: string;
  fileType: 'attachment' | 'link';
  filename?: string;
}

/**
 * Process a single email and extract bill information
 */
export const processEmailForBill = async (
  message: any,
  accessToken: string
): Promise<ProcessedBill | null> => {
  try {
    const { subject, from, date, messageId } = extractMessageHeaders(message);

    // Check if email looks like a bill
    if (!isBillLikelyEmail(subject, from)) {
      return null;
    }

    // Try to get attachment
    const attachments = extractAttachments(message);
    const billAttachment = attachments.find(att =>
      isBillLikelyFile(att.filename) || isBillMimeType(att.mimeType)
    );

    if (billAttachment) {
      // Download and upload attachment
      const fileUrl = await downloadAndUploadAttachment(
        accessToken,
        messageId,
        billAttachment.attachmentId,
        billAttachment.filename
      );

      return {
        messageId,
        subject,
        from,
        date,
        fileUrl,
        fileType: 'attachment',
        filename: billAttachment.filename,
      };
    }

    // Try to extract bill link from email body
    const linkUrl = extractBillLinkFromMessage(message);
    if (linkUrl) {
      return {
        messageId,
        subject,
        from,
        date,
        fileUrl: linkUrl,
        fileType: 'link',
      };
    }

    return null;
  } catch (error) {
    console.error('Error processing email for bill:', error);
    return null;
  }
};

/**
 * Check if email subject/from looks like a bill
 */
const isBillLikelyEmail = (subject: string, from: string): boolean => {
  const combinedText = `${subject} ${from}`.toLowerCase();
  return BILL_KEYWORDS.some(keyword => combinedText.includes(keyword));
};

/**
 * Check if filename looks like a bill document
 */
const isBillLikelyFile = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const billExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif'];
  return billExtensions.includes(ext || '');
};

/**
 * Check if MIME type is document-like
 */
const isBillMimeType = (mimeType: string): boolean => {
  const billMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
  ];
  return billMimeTypes.includes(mimeType);
};

/**
 * Download attachment from Gmail and upload to Supabase
 */
const downloadAndUploadAttachment = async (
  accessToken: string,
  messageId: string,
  attachmentId: string,
  filename: string
): Promise<string> => {
  try {
    // Download from Gmail
    const blob = await downloadGmailAttachment(accessToken, messageId, attachmentId);

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const filePath = `email-imports/${messageId}/${timestamp}-${filename}`;

    const { data, error } = await supabase.storage
      .from('bill-documents')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('bill-documents')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error downloading and uploading attachment:', error);
    throw error;
  }
};

/**
 * Extract bill download link from email body
 */
const extractBillLinkFromMessage = (message: any): string | null => {
  try {
    const body = message.payload?.parts?.find((p: any) => p.mimeType === 'text/html')?.body?.data ||
                 message.payload?.parts?.find((p: any) => p.mimeType === 'text/plain')?.body?.data ||
                 message.payload?.body?.data;

    if (!body) return null;

    const decodedBody = decodeBase64(body);
    
    // Look for common bill link patterns
    const patterns = [
      /https?:\/\/[^\s<>]*\.pdf/gi,
      /https?:\/\/[^\s<>]*(?:download|bill|invoice|statement)[^\s<>]*/gi,
    ];

    for (const pattern of patterns) {
      const match = decodedBody.match(pattern);
      if (match) return match[0];
    }

    return null;
  } catch (error) {
    console.error('Error extracting bill link:', error);
    return null;
  }
};

/**
 * Decode base64 text
 */
const decodeBase64 = (base64String: string): string => {
  try {
    return decodeURIComponent(atob(base64String).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  } catch (error) {
    return base64String;
  }
};

/**
 * Main function to sync emails for a user
 */
export const syncEmailsForUser = async (
  userId: string,
  settings: EmailImportSettings
): Promise<{ processed: number; imported: number; errors: string[] }> => {
  const errors: string[] = [];
  let processedCount = 0;
  let importedCount = 0;

  try {
    if (!settings.oauth_token) {
      throw new Error('No OAuth token available');
    }

    // Fetch recent emails from Gmail
    const emails = await fetchEmailsFromGmail(settings.oauth_token, undefined, 20);

    // Process each email
    for (const message of emails) {
      try {
        processedCount++;

        const messageId = extractMessageHeaders(message).messageId;

        // Skip if already imported
        if (await isBillAlreadyImported(userId, messageId)) {
          continue;
        }

        // Process email for bill
        const processedBill = await processEmailForBill(message, settings.oauth_token);
        if (!processedBill) continue;

        // Save to database
        await saveImportedBill(userId, settings.id, {
          gmailMessageId: messageId,
          subject: processedBill.subject,
          fromEmail: processedBill.from,
          receivedAt: processedBill.date,
          fileUrl: processedBill.fileUrl,
          fileType: processedBill.fileType,
        });

        importedCount++;

        // TODO: Send to OCR pipeline to extract dates
        // TODO: Create reminders for extracted dates
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error processing email ${processedCount}:`, errorMsg);
        errors.push(`Email ${processedCount}: ${errorMsg}`);
      }
    }

    // Update sync timestamp
    await updateLastSyncedAt(userId);

    return { processed: processedCount, imported: importedCount, errors };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error syncing emails:', errorMsg);
    await updateSyncError(userId, errorMsg);
    throw error;
  }
};

/**
 * Schedule periodic sync for a user
 * (To be called from backend/cron job)
 */
export const scheduleSyncForUser = (userId: string, intervalMinutes: number = 60) => {
  // This should be implemented in a backend service
  // For now, it's a placeholder for the concept
  console.log(`Scheduled sync for user ${userId} every ${intervalMinutes} minutes`);
};
