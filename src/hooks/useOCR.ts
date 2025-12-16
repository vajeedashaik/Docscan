import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { preprocessImage, analyzeImageQuality } from '@/lib/image-preprocessing';
import { useAuth } from '@/contexts/AuthContext';
import { useReminders } from '@/hooks/useReminders';
import { useUserStatistics } from '@/hooks/useUserStatistics';
import { 
  extractDates, 
  extractVendorDetails,
  extractProductDetails,
  extractDateDetails,
  extractAmounts,
  detectDocumentType,
  generateReminderSuggestions,
  extractDocumentTitle
} from '@/lib/entity-extraction';
import type { 
  UploadedFile, 
  OCRResult, 
  ProcessingStatus,
  DocumentType 
} from '@/types/ocr';
import { toast } from '@/hooks/use-toast';

// Helper function to parse dates in multiple formats
function parseDate(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  
  try {
    // Try ISO format first (YYYY-MM-DD)
    let date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    // Try European format (DD.MM.YYYY or DD/MM/YYYY)
    const europeanMatch = dateString.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
    if (europeanMatch) {
      const [, day, month, year] = europeanMatch;
      date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    // Try US format (MM/DD/YYYY or MM-DD-YYYY)
    const usMatch = dateString.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
    if (usMatch) {
      const [, month, day, year] = usMatch;
      date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    // Try parsing as-is one more time
    date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    return null;
  } catch (error) {
    console.warn('Error parsing date:', dateString, error);
    return null;
  }
}

interface UseOCROptions {
  autoPreprocess?: boolean;
  enhanceContrast?: boolean;
  denoise?: boolean;
  extractReminders?: boolean;
  languages?: string[];
  onScanComplete?: () => void | Promise<void>;
  productName?: string;
  category?: string;
  productCount?: string;
}

interface UseOCRReturn {
  files: UploadedFile[];
  results: OCRResult[];
  isProcessing: boolean;
  addFiles: (newFiles: File[]) => void;
  removeFile: (id: string) => void;
  processFiles: () => Promise<void>;
  processSingleFile: (file: UploadedFile) => Promise<OCRResult | null>;
  clearAll: () => void;
  exportResults: () => void;
}

export const useOCR = (options: UseOCROptions = {}): UseOCRReturn => {
  const {
    autoPreprocess = true,
    enhanceContrast = true,
    denoise = true,
    extractReminders = true,
    languages = ['en', 'hi'],
    onScanComplete,
    productName,
    category,
  } = options;

  const { user, userId } = useAuth();
  const { createRemindersFromOCR } = useReminders();
  const { updateStatistics } = useUserStatistics();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [results, setResults] = useState<OCRResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const generateId = () => crypto.randomUUID();

  const fileToBase64 = (file: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const addFiles = useCallback((newFiles: File[]) => {
    const uploadedFiles: UploadedFile[] = newFiles.map(file => ({
      id: generateId(),
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      status: 'pending' as ProcessingStatus,
      progress: 0,
    }));

    setFiles(prev => [...prev, ...uploadedFiles]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const updateFileStatus = (id: string, status: ProcessingStatus, progress?: number) => {
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, status, progress: progress ?? f.progress } : f
    ));
  };

  const processSingleFile = useCallback(async (file: UploadedFile): Promise<OCRResult | null> => {
    try {
      updateFileStatus(file.id, 'preprocessing', 10);

      let processedBlob: Blob = file.file;

      // Preprocess image if it's an image file
      if (autoPreprocess && file.file.type.startsWith('image/')) {
        const quality = await analyzeImageQuality(file.file);
        console.log('Image quality analysis:', quality);

        const preprocessingOptions = {
          grayscale: false,
          enhanceContrast: enhanceContrast || quality.metrics.contrast < 0.5,
          denoise: denoise || quality.metrics.noise < 0.5,
          sharpen: quality.metrics.sharpness < 0.3,
          resize: { maxWidth: 2048, maxHeight: 2048 },
        };

        const preprocessed = await preprocessImage(file.file, preprocessingOptions);
        processedBlob = preprocessed.processedImage;
        console.log('Preprocessing applied:', preprocessed.appliedOperations);
      }

      updateFileStatus(file.id, 'extracting', 40);

      // Convert to base64
      const base64Data = await fileToBase64(processedBlob);
      const cleanBase64 = base64Data.split(',')[1] || base64Data;

      updateFileStatus(file.id, 'extracting', 50);

      // Get API key from environment
      const apiKey = import.meta.env.VITE_GOOGLE_VISION_API_KEY;
      if (!apiKey) {
        throw new Error('Google Vision API key not configured in environment');
      }

      let fullTextAnnotation: string;
      let confidence: number;

      console.log('Calling Google Vision API...');
      
      // Simple direct fetch to Google Vision API
      const visionRequestBody = {
        requests: [
          {
            image: { content: cleanBase64 },
            features: [
              { type: 'TEXT_DETECTION' },
              { type: 'DOCUMENT_TEXT_DETECTION' },
            ],
          },
        ],
      };

      console.log('Request body size:', JSON.stringify(visionRequestBody).length);

      try {
        const visionResponse = await fetch(
          `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(visionRequestBody),
          }
        );

        console.log(`Vision API response status: ${visionResponse.status}`);

        const responseText = await visionResponse.text();
        console.log('Vision API raw response:', responseText.substring(0, 200));

        if (!visionResponse.ok) {
          console.error('Vision API HTTP error:', visionResponse.status);
          throw new Error(`Google Vision API HTTP ${visionResponse.status}: ${responseText}`);
        }

        const visionData = JSON.parse(responseText);
        const responses = visionData.responses?.[0];

        if (!responses) {
          throw new Error('No response from Vision API');
        }

        if (responses.error) {
          console.error('Vision API returned error:', responses.error);
          throw new Error(`Vision API error: ${responses.error.message}`);
        }

        // Extract text from response
        const documentTextAnnotation = responses.fullTextAnnotation;
        const extractedText = documentTextAnnotation?.text || '';
        const textAnnotations = responses.textAnnotations || [];

        console.log(`Extracted ${extractedText.length} characters from image`);

        updateFileStatus(file.id, 'parsing', 70);

        // Create result with extracted text
        fullTextAnnotation = extractedText;
        confidence = textAnnotations.length > 0 ? 0.95 : 0.70;

      } catch (visionError) {
        console.error('Vision API call failed:', visionError);
        throw new Error(`OCR failed: ${visionError instanceof Error ? visionError.message : String(visionError)}`);
      }

      // Extract structured data from OCR text - Simplified to focus on title and dates
      updateFileStatus(file.id, 'parsing', 75);
      
      const { type: detectedDocType, confidence: docTypeConfidence } = detectDocumentType(fullTextAnnotation);
      const documentTitle = extractDocumentTitle(fullTextAnnotation, file.file.name);
      const dateDetails = extractDateDetails(fullTextAnnotation);
      const reminderSuggestions = generateReminderSuggestions(dateDetails, detectedDocType);
      
      // Keep minimal vendor/product extraction for backward compatibility with DB
      const vendorDetails = extractVendorDetails(fullTextAnnotation);
      const productDetails = extractProductDetails(fullTextAnnotation);
      const amounts = extractAmounts(fullTextAnnotation);

      const topicName = productName || documentTitle;
      const categoryLabel = category || detectedDocType;

      // Create result from OCR
      const result: OCRResult = {
        id: crypto.randomUUID(),
        documentType: detectedDocType,
        status: 'completed',
        confidence: confidence,
        extractedFields: {
          vendor: vendorDetails,
          product: productDetails,
          dates: dateDetails,
          amount: {
            subtotal: amounts[0]?.value || null,
            tax: null,
            total: amounts[amounts.length - 1]?.value || null,
            currency: amounts[0]?.currency || 'INR',
          },
          custom: [],
        },
        rawText: fullTextAnnotation,
        reminderData: {
          suggestedReminders: reminderSuggestions,
        },
        metadata: {
          fileName: file.file.name,
          fileType: file.file.type,
          fileSize: file.file.size,
          pageCount: 1,
          language: languages,
          processedAt: new Date().toISOString(),
          processingDuration: 0,
          ocrEngine: 'google-cloud-vision',
          imageQuality: confidence > 0.7 ? 'high' : confidence > 0.4 ? 'medium' : 'low',
          preprocessingApplied: [],
        },
        errors: [],
      };

      updateFileStatus(file.id, 'parsing', 80);
    
      const ocrResultId = result.id;
      const startTime = Date.now();

      // Save to Supabase - Create OCR Job first
      if (user && userId) {
        console.log('Saving OCR result to Supabase. User:', user.id, 'UserId:', userId);
        try {
          // Create OCR job record with user_id
          const { data: jobData, error: jobError } = await supabase
            .from('ocr_jobs')
            .insert({
              file_name: file.file.name,
              file_type: file.file.type,
              file_size: file.file.size,
              status: 'completed',
              completed_at: new Date().toISOString(),
              processing_time_ms: Date.now() - startTime,
              user_id: userId, // Set user_id as TEXT to match Clerk
            })
            .select()
            .single();

          if (jobError) {
            console.warn('Error creating OCR job:', jobError);
          } else if (jobData) {
            // Save OCR results to database
            const resultsPayload: any = {
              id: ocrResultId,
              job_id: jobData.id,
              document_type: detectedDocType,
              raw_text: fullTextAnnotation,
              confidence: confidence,
              extracted_data: {
                vendor: vendorDetails,
                product: productDetails,
                dates: dateDetails,
                amounts: amounts,
              },
              vendor_details: vendorDetails,
              product_details: productDetails,
              date_details: dateDetails,
              reminder_suggestions: reminderSuggestions,
          metadata: {
            fileName: file.file.name,
            fileType: file.file.type,
            fileSize: file.file.size,
            processedAt: new Date().toISOString(),
            ocrEngine: 'google-cloud-vision',
            imageQuality: result.metadata.imageQuality,
            topicName,
            category: categoryLabel,
          },
              metadata: {
                fileName: file.file.name,
                fileType: file.file.type,
                fileSize: file.file.size,
                processedAt: new Date().toISOString(),
                ocrEngine: 'google-cloud-vision',
                imageQuality: result.metadata.imageQuality,
                topicName,
                category: categoryLabel,
              },
            };

            const { error: resultsError } = await (supabase as any)
              .from('ocr_results')
              .insert([resultsPayload]);

            if (resultsError) {
              console.warn('Error saving OCR results:', resultsError);
            } else {
              console.log('OCR results saved successfully, now saving metadata...');
              
              // Create document metadata record - include topic name and category
              let metadataSuccess = false;
              try {
                const metadataPayload = {
                  ocr_result_id: ocrResultId,
                  user_id: userId,
                  vendor_name: topicName || vendorDetails.name || null, // Topic name for display
                  vendor_phone: null, // Not needed
                  vendor_email: null, // Not needed
                  expiry_date: parseDate(dateDetails.warrantyExpiry || dateDetails.nextServiceDue), // Primary expiry/due date
                  renewal_date: parseDate(dateDetails.nextServiceDue), // Secondary date if different
                  amount: null, // Not needed
                  currency: 'USD', // Default
                  notes: categoryLabel || `Scanned document - ${detectedDocType}`,
                  tags: categoryLabel ? [categoryLabel] : [],
                };
                
                console.log('Inserting document metadata:', metadataPayload);
                
                const { data: metadataData, error: metadataError } = await (supabase as any)
                  .from('document_metadata')
                  .insert(metadataPayload)
                  .select();

                if (metadataError) {
                  console.warn('Error creating document metadata:', metadataError);
                } else {
                  console.log('Document metadata created successfully', metadataData);
                  metadataSuccess = true;
                }
              } catch (metadataError) {
                console.warn('Error creating document metadata:', metadataError);
              }
            }
          }
        } catch (dbError) {
          console.error('Error saving to database:', dbError);
        }
        
        // Always call the completion callback to refetch documents after all database operations
        if (onScanComplete) {
          try {
            await Promise.resolve(onScanComplete());
            console.log('onScanComplete callback executed successfully');
          } catch (callbackError) {
            console.error('Error in onScanComplete callback:', callbackError);
          }
        }
      }

      // Update user statistics
      if (user) {
        try {
          await updateStatistics({
            total_documents_scanned: 1,
            successful_scans: 1,
            last_scan_date: new Date().toISOString(),
            average_confidence_score: result.confidence || null,
          });
        } catch (statsError: any) {
          if (statsError?.code === '406') {
            console.warn('user_statistics table not available yet');
          } else {
            console.error('Error updating statistics:', statsError);
          }
        }
      }
      
      // Auto-create reminders from OCR results with document title
      if (user && result.reminderData?.suggestedReminders?.length > 0) {
        // Enhance reminder titles with document title if available
        const enhancedReminders = result.reminderData.suggestedReminders.map(reminder => ({
          ...reminder,
          title: documentTitle ? `${documentTitle} - ${reminder.title}` : reminder.title,
        }));
        
        await createRemindersFromOCR(
          ocrResultId,
          enhancedReminders
        );
      }
      
      updateFileStatus(file.id, 'completed', 100);
      
      // Update file with result
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, result, status: 'completed' as ProcessingStatus } : f
      ));

      return result;
    } catch (error) {
      console.error('Error processing file:', file.file.name, error);
      updateFileStatus(file.id, 'failed', 0);
      
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { 
          ...f, 
          status: 'failed' as ProcessingStatus, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        } : f
      ));

      return null;
    }
  }, [autoPreprocess, enhanceContrast, denoise, languages, extractReminders, user, userId, createRemindersFromOCR, updateStatistics, onScanComplete]);

  const processFiles = useCallback(async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    if (pendingFiles.length === 0) {
      toast({
        title: 'No files to process',
        description: 'Please upload some files first.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    const newResults: OCRResult[] = [];

    for (const file of pendingFiles) {
      const result = await processSingleFile(file);
      if (result) {
        newResults.push(result);
      }
    }

    setResults(prev => [...prev, ...newResults]);
    setIsProcessing(false);

    const successCount = newResults.length;
    const failedCount = pendingFiles.length - successCount;

    if (successCount > 0) {
      toast({
        title: 'Extraction complete',
        description: `Successfully processed ${successCount} file(s)${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
      });
    } else {
      toast({
        title: 'Extraction failed',
        description: 'No files were processed successfully.',
        variant: 'destructive',
      });
    }
  }, [files, processSingleFile]);

  const clearAll = useCallback(() => {
    // Revoke object URLs
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    
    setFiles([]);
    setResults([]);
  }, [files]);

  const exportResults = useCallback(() => {
    if (results.length === 0) {
      toast({
        title: 'No results to export',
        description: 'Process some files first.',
        variant: 'destructive',
      });
      return;
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      totalResults: results.length,
      results: results,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export successful',
      description: `Exported ${results.length} result(s) to JSON.`,
    });
  }, [results]);

  return {
    files,
    results,
    isProcessing,
    addFiles,
    removeFile,
    processFiles,
    processSingleFile,
    clearAll,
    exportResults,
  };
};
