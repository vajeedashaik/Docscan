/**
 * Hook to manage OCR processing for imported bills
 * Handles the entire workflow from bill download to reminder creation
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  processImportedBillFull,
  getUnprocessedBills,
  getBillOCRStatus,
  type BillOCRJob,
} from '@/integrations/email/billOCRIntegration';
import { toast } from '@/hooks/use-toast';

interface UseOCRBillIntegrationReturn {
  processing: boolean;
  processedCount: number;
  errorCount: number;
  processBill: (importedBillId: string, accessToken: string) => Promise<void>;
  processBatch: (accessToken: string) => Promise<number>;
  getBillStatus: (importedBillId: string) => Promise<BillOCRJob | null>;
  retryFailedBill: (
    importedBillId: string,
    accessToken: string
  ) => Promise<void>;
}

export const useOCRBillIntegration = (
  userId: string
): UseOCRBillIntegrationReturn => {
  const [processing, setProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  const processBill = useCallback(
    async (importedBillId: string, accessToken: string) => {
      try {
        setProcessing(true);

        // Fetch bill details
        const { data: bill, error: fetchError } = await supabase
          .from('imported_bills')
          .select('*')
          .eq('id', importedBillId)
          .single();

        if (fetchError || !bill) {
          throw new Error('Failed to fetch bill');
        }

        // Process the bill
        await processImportedBillFull(bill, userId, accessToken);

        setProcessedCount((count) => count + 1);
        toast({
          title: 'Success',
          description: `Bill processed: ${bill.subject}`,
        });
      } catch (error) {
        console.error('Error processing bill:', error);
        setErrorCount((count) => count + 1);
        toast({
          title: 'Error',
          description:
            error instanceof Error
              ? error.message
              : 'Failed to process bill',
          variant: 'destructive',
        });
      } finally {
        setProcessing(false);
      }
    },
    [userId]
  );

  const processBatch = useCallback(
    async (accessToken: string): Promise<number> => {
      try {
        setProcessing(true);
        const unprocessedBills = await getUnprocessedBills(userId);

        if (unprocessedBills.length === 0) {
          toast({
            title: 'Info',
            description: 'No unprocessed bills found',
          });
          return 0;
        }

        let successCount = 0;

        for (const bill of unprocessedBills) {
          try {
            await processImportedBillFull(bill, userId, accessToken);
            successCount++;
          } catch (error) {
            console.error(`Error processing bill ${bill.id}:`, error);
            setErrorCount((count) => count + 1);
          }
        }

        setProcessedCount((count) => count + successCount);

        toast({
          title: 'Batch Processing Complete',
          description: `Processed ${successCount} of ${unprocessedBills.length} bills`,
        });

        return successCount;
      } catch (error) {
        console.error('Error in batch processing:', error);
        toast({
          title: 'Error',
          description: 'Batch processing failed',
          variant: 'destructive',
        });
        return 0;
      } finally {
        setProcessing(false);
      }
    },
    [userId]
  );

  const getBillStatus = useCallback(
    async (importedBillId: string): Promise<BillOCRJob | null> => {
      try {
        return await getBillOCRStatus(importedBillId);
      } catch (error) {
        console.error('Error fetching bill status:', error);
        return null;
      }
    },
    []
  );

  const retryFailedBill = useCallback(
    async (importedBillId: string, accessToken: string) => {
      try {
        // Reset OCR result
        await supabase
          .from('imported_bills')
          .update({
            ocr_result_id: null,
            extracted_due_date: null,
            reminder_created: false,
          })
          .eq('id', importedBillId);

        // Retry processing
        await processBill(importedBillId, accessToken);
      } catch (error) {
        console.error('Error retrying bill:', error);
        toast({
          title: 'Error',
          description: 'Failed to retry bill processing',
          variant: 'destructive',
        });
      }
    },
    [processBill]
  );

  return {
    processing,
    processedCount,
    errorCount,
    processBill,
    processBatch,
    getBillStatus,
    retryFailedBill,
  };
};
