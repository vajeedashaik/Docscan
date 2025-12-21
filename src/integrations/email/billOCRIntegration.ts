/**
 * Email-to-OCR Integration
 * Handles automatic OCR processing of imported bills from email
 * Now uses backend Edge Function for secure Gmail attachment downloads
 */

import { supabase } from '@/integrations/supabase/client';
import type { OCRResult } from '@/types/ocr';

// Helper to normalize various date string formats to ISO (YYYY-MM-DD) for Postgres DATE columns
function normalizeDateString(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = String(raw).trim();
  if (!value) return null;

  // Try native Date parsing first
  let date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  // Try DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  let m = value.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})$/);
  if (m) {
    const [, dd, mm, yyyyRaw] = m;
    const yyyy = yyyyRaw.length === 2 ? `20${yyyyRaw}` : yyyyRaw;
    date = new Date(`${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  // Try MM-DD-YYYY or MM/DD/YYYY or MM.DD.YYYY
  m = value.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})$/);
  if (m) {
    const [, mm, dd, yyyyRaw] = m;
    const yyyy = yyyyRaw.length === 2 ? `20${yyyyRaw}` : yyyyRaw;
    date = new Date(`${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  // Fallback: return null if we can't confidently parse
  return null;
}

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
 * Process bill OCR using backend Edge Function
 * This handles downloading Gmail attachments securely with proper authentication
 */
export const processBillOCRViaEdgeFunction = async (
  importedBillId: string,
  userId: string
): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke<{
      success?: boolean;
      error?: string;
      ocrResultId?: string;
      [key: string]: any;
    }>('process-bill-ocr', {
      body: {
        importedBillId,
        userId,
      },
    });

    console.log('[process-bill-ocr] invoke result', { data, error });

    // Network / HTTP-level error (non-2xx)
    if (error) {
      console.error('Edge Function error object:', error);

      const httpError = error as any;
      const contextErrorMessage =
        // For FunctionsHttpError, context.error usually contains the JSON body
        (typeof httpError?.context?.error === 'string'
          ? httpError.context.error
          : undefined) ||
        (httpError?.context && JSON.stringify(httpError.context)) ||
        httpError?.message ||
        JSON.stringify(httpError);
      throw new Error(contextErrorMessage || 'Edge Function error');
    }

    // No error, but no data at all
    if (!data) {
      throw new Error('Edge Function returned no data');
    }

    // Some environments may return raw JSON string even on success.
    let payload: any = data;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        // leave as string; we'll handle below
      }
    }

    // If parsing failed and it's still a string, surface it directly
    if (typeof payload === 'string') {
      throw new Error(payload);
    }

    // If the function responded with an explicit error field
    if (typeof payload.error === 'string' && payload.error.length > 0) {
      throw new Error(payload.error);
    }

    // If the function uses a success flag and it is explicitly false
    if (payload.success === false) {
      throw new Error(
        typeof payload.error === 'string' && payload.error.length > 0
          ? payload.error
          : 'Edge Function reported failure'
      );
    }

    // At this point we expect a valid ocrResultId
    if (!payload.ocrResultId) {
      throw new Error('Edge Function response missing ocrResultId');
    }

    return payload.ocrResultId;
  } catch (error) {
    console.error('Error processing bill via Edge Function:', error);
    throw error;
  }
};

/**
 * Extract dates from OCR result and create reminders
 */
export const processBillOCRResult = async (
  importedBillId: string,
  ocrResult: any,
  userId: string
): Promise<{ dueDate?: string; reminderId?: string }> => {
  try {
    // Extract dates from the OCR result text or extracted items
    let dueDate: string | undefined;
    
    // Support both legacy `extracted_items` and new `extracted_data` JSON shapes
    const datesSource =
      ocrResult?.extracted_items?.dates ||
      ocrResult?.extracted_data?.dates ||
      ocrResult?.extracted_data?.dates?.values ||
      [];

    if (Array.isArray(datesSource) && datesSource.length > 0) {
      const rawDate = datesSource[0];
      const normalized = normalizeDateString(rawDate);
      if (normalized) {
        dueDate = normalized; // Always store ISO (YYYY-MM-DD)
      }
    }

    if (!dueDate) {
      console.log('No valid due date found in OCR result');
      return {};
    }

    // Update imported bill with extracted due date (DATE column expects ISO yyyy-mm-dd)
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
    const reminderTitle = `Bill Reminder`;

    const { data: reminder, error: reminderError } = await supabase
      .from('reminders')
      .insert({
        user_id: userId,
        title: reminderTitle,
        description: `Bill imported from email - extracted text preview`,
        reminder_type: 'payment_due',
        // reminders.reminder_date is DATE; send ISO string (yyyy-mm-dd)
        reminder_date: dueDate,
        notify_before_days: 7,
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
 * Full pipeline: Process bill OCR via Edge Function -> Create reminder
 */
export const processImportedBillFull = async (
  importedBill: any,
  userId: string,
  _accessToken?: string
): Promise<void> => {
  try {
    console.log(`Processing bill: ${importedBill.subject}`);

    // Step 1: Call Edge Function to download bill and run OCR
    console.log('Step 1: Processing bill through Edge Function...');
    const ocrResultId = await processBillOCRViaEdgeFunction(
      importedBill.id,
      userId
    );

    // Step 2: Fetch OCR result
    console.log('Step 2: Fetching OCR result...');
    const { data: ocrResult } = await supabase
      .from('ocr_results')
      .select('*')
      .eq('id', ocrResultId)
      .single();

    if (ocrResult) {
      // Step 3: Extract dates and create reminders
      console.log('Step 3: Extracting dates and creating reminders...');
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
