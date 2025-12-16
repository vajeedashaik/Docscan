/**
 * Email-to-OCR Integration
 * Handles automatic OCR processing of imported bills from email
 */

import { supabase } from '@/integrations/supabase/client';
import type { OCRResult } from '@/types/ocr';

export interface BillOCRJob {
  id: string;
  imported_bill_id: string;
  user_id: string;
  ocr_status: 'pending' | 'processing' | 'completed' | 'failed';
  ocr_job_id?: string;
  ocr_result_id?: string;
  extracted_due_date?: string;
  extraction_error?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Download bill document from Gmail attachment or link
 */
export const downloadBillDocument = async (
  fileUrl: string,
  fileType: 'attachment' | 'link',
  accessToken: string
): Promise<Blob> => {
  try {
    if (fileType === 'link') {
      // Download from direct link
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to download from link: ${response.statusText}`);
      }
      return await response.blob();
    } else if (fileType === 'attachment') {
      // fileUrl format: gmail://messageId/partId
      const [, messageId, partId] = fileUrl.match(/gmail:\/\/(.*?)\/(.*)/);

      const response = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${partId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to download Gmail attachment: ${response.statusText}`
        );
      }

      const data = await response.json();
      const binaryString = atob(data.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new Blob([bytes]);
    }

    throw new Error(`Unknown file type: ${fileType}`);
  } catch (error) {
    console.error('Error downloading bill document:', error);
    throw error;
  }
};

/**
 * Upload bill document to Supabase storage for OCR processing
 */
export const uploadBillToStorage = async (
  bill: any,
  blob: Blob,
  userId: string
): Promise<string> => {
  try {
    const fileName = `bills/${userId}/${bill.id}_${Date.now()}`;
    const fileExtension = blob.type.includes('pdf') ? 'pdf' : 'jpg';
    const filePath = `${fileName}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from('bill-documents')
      .upload(filePath, blob, {
        contentType: blob.type,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data } = supabase.storage
      .from('bill-documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading bill to storage:', error);
    throw error;
  }
};

/**
 * Create OCR job from imported bill
 */
export const createOCRJobFromBill = async (
  importedBillId: string,
  userId: string,
  storagePath: string,
  billSubject: string
): Promise<string> => {
  try {
    // Call the Google Vision API through supabase edge function
    const response = await fetch('/api/ocr-process-bill', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        importedBillId,
        userId,
        storagePath,
        billSubject,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create OCR job');
    }

    const data = await response.json();
    return data.ocrResultId;
  } catch (error) {
    console.error('Error creating OCR job:', error);
    throw error;
  }
};

/**
 * Extract dates from OCR result and create reminders
 */
export const processBillOCRResult = async (
  importedBillId: string,
  ocrResult: OCRResult,
  userId: string
): Promise<{ dueDate?: string; reminderId?: string }> => {
  try {
    const dateDetails = ocrResult.extracted_data?.date_details || {};

    // Priority: warranty expiry > next service due > payment due date
    const dueDate =
      dateDetails.warrantyExpiry ||
      dateDetails.nextServiceDue ||
      dateDetails.paymentDueDate;

    if (!dueDate) {
      console.log('No due date found in OCR result');
      return {};
    }

    // Update imported bill with extracted due date
    const { error: updateError } = await supabase
      .from('imported_bills')
      .update({
        extracted_due_date: dueDate,
        reminder_created: true,
      })
      .eq('id', importedBillId);

    if (updateError) {
      console.error('Error updating imported bill:', updateError);
    }

    // Create a reminder for this bill
    const vendorName =
      ocrResult.extracted_data?.vendor_details?.name || 'Imported Bill';
    const reminderTitle = `Bill Reminder: ${vendorName}`;

    const { data: reminder, error: reminderError } = await supabase
      .from('reminders')
      .insert({
        user_id: userId,
        title: reminderTitle,
        description: ocrResult.extracted_data?.text?.substring(0, 200),
        due_date: dueDate,
        source_type: 'email_import',
        source_id: importedBillId,
        status: 'pending',
      })
      .select()
      .single();

    if (reminderError) {
      console.error('Error creating reminder:', reminderError);
      return { dueDate };
    }

    console.log('Reminder created successfully:', reminder.id);
    return { dueDate, reminderId: reminder.id };
  } catch (error) {
    console.error('Error processing bill OCR result:', error);
    throw error;
  }
};

/**
 * Link OCR result to imported bill
 */
export const linkOCRToImportedBill = async (
  importedBillId: string,
  ocrJobId: string,
  ocrResultId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('imported_bills')
      .update({
        ocr_job_id: ocrJobId,
        ocr_result_id: ocrResultId,
        updated_at: new Date(),
      })
      .eq('id', importedBillId);

    if (error) {
      throw error;
    }

    console.log('OCR linked to imported bill successfully');
  } catch (error) {
    console.error('Error linking OCR to imported bill:', error);
    throw error;
  }
};

/**
 * Full pipeline: Download bill -> Upload -> Process with OCR -> Create reminder
 */
export const processImportedBillFull = async (
  importedBill: any,
  userId: string,
  accessToken: string
): Promise<void> => {
  try {
    console.log(`Processing bill: ${importedBill.subject}`);

    // Step 1: Download bill document
    console.log('Step 1: Downloading bill document...');
    const billBlob = await downloadBillDocument(
      importedBill.file_url,
      importedBill.file_type,
      accessToken
    );

    // Step 2: Upload to storage
    console.log('Step 2: Uploading bill to storage...');
    const storagePath = await uploadBillToStorage(
      importedBill,
      billBlob,
      userId
    );

    // Step 3: Create OCR job
    console.log('Step 3: Creating OCR job...');
    const ocrResultId = await createOCRJobFromBill(
      importedBill.id,
      userId,
      storagePath,
      importedBill.subject
    );

    // Step 4: Fetch OCR result (after processing)
    console.log('Step 4: Fetching OCR result...');
    const { data: ocrResult } = await supabase
      .from('ocr_results')
      .select('*')
      .eq('id', ocrResultId)
      .single();

    if (ocrResult) {
      // Step 5: Extract dates and create reminders
      console.log('Step 5: Extracting dates and creating reminders...');
      await processBillOCRResult(importedBill.id, ocrResult, userId);
    }

    console.log(`Bill processing complete: ${importedBill.subject}`);
  } catch (error) {
    console.error('Error in bill processing pipeline:', error);

    // Update bill with error status
    try {
      await supabase
        .from('imported_bills')
        .update({
          ocr_result_id: null,
          updated_at: new Date(),
        })
        .eq('id', importedBill.id);
    } catch (updateError) {
      console.error('Error updating bill error status:', updateError);
    }

    throw error;
  }
};

/**
 * Get all imported bills needing OCR processing
 */
export const getUnprocessedBills = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('imported_bills')
      .select('*')
      .eq('user_id', userId)
      .is('ocr_result_id', null)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching unprocessed bills:', error);
    return [];
  }
};

/**
 * Get processing status of a bill
 */
export const getBillOCRStatus = async (
  importedBillId: string
): Promise<BillOCRJob | null> => {
  try {
    const { data, error } = await supabase
      .from('imported_bills')
      .select('id, ocr_job_id, ocr_result_id, extracted_due_date, updated_at')
      .eq('id', importedBillId)
      .single();

    if (error) {
      console.error('Error fetching bill OCR status:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      imported_bill_id: data.id,
      user_id: '',
      ocr_status: data.ocr_result_id ? 'completed' : 'pending',
      ocr_result_id: data.ocr_result_id,
      extracted_due_date: data.extracted_due_date,
      created_at: data.updated_at,
      updated_at: data.updated_at,
    };
  } catch (error) {
    console.error('Error getting bill OCR status:', error);
    return null;
  }
};
