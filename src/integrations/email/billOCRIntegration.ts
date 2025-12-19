/**
 * Email-to-OCR Integration
 * Handles automatic OCR processing of imported bills from email
 * Now uses backend Edge Function for secure Gmail attachment downloads
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
 * Process bill OCR using backend Edge Function
 * This handles downloading Gmail attachments securely with proper authentication
 */
export const processBillOCRViaEdgeFunction = async (
  importedBillId: string,
  userId: string
): Promise<string> => {
  try {
    // Call the backend Edge Function using Supabase client
    const { data, error } = await supabase.functions.invoke('process-bill-ocr', {
      body: {
        importedBillId,
        userId,
      },
    });

    if (error) {
      console.error('Edge Function error:', error);
      throw new Error(error.message || 'Edge Function error');
    }

    if (!data) {
      throw new Error('Edge Function returned no data');
    }

    if (!data.success) {
      throw new Error(data.error || 'Edge Function returned error');
    }

    return data.ocrResultId;
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
  ocrResult: OCRResult,
  userId: string
): Promise<{ dueDate?: string; reminderId?: string }> => {
  try {
    // Extract dates from the OCR result text or extracted items
    let dueDate: string | undefined;
    
    // Check if we have extracted dates in the OCR result
    if (ocrResult.extracted_items?.dates) {
      const dates = ocrResult.extracted_items.dates;
      if (Array.isArray(dates) && dates.length > 0) {
        dueDate = dates[0]; // Take first date found
      }
    }

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
    const reminderTitle = `Bill Reminder`;

    const { data: reminder, error: reminderError } = await supabase
      .from('reminders')
      .insert({
        user_id: userId,
        title: reminderTitle,
        description: `Bill imported from email - extracted text preview`,
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
