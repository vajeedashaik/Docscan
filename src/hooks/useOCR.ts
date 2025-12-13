import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { preprocessImage, analyzeImageQuality } from '@/lib/image-preprocessing';
import { useAuth } from '@/contexts/AuthContext';
import { useReminders } from '@/hooks/useReminders';
import { useUserStatistics } from '@/hooks/useUserStatistics';
import type { 
  UploadedFile, 
  OCRResult, 
  ProcessingStatus,
  DocumentType 
} from '@/types/ocr';
import { toast } from '@/hooks/use-toast';

interface UseOCROptions {
  autoPreprocess?: boolean;
  enhanceContrast?: boolean;
  denoise?: boolean;
  extractReminders?: boolean;
  languages?: string[];
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

      // Create result from OCR
      const result: OCRResult = {
        id: crypto.randomUUID(),
        documentType: 'invoice', // Default to invoice for now
        status: 'completed',
        confidence: confidence,
        extractedFields: {
          vendor: {
            name: null,
            address: null,
            phone: null,
            email: null,
            gstin: null,
            pan: null,
          },
          product: {
            name: null,
            model: null,
            serialNumber: null,
            category: null,
            quantity: null,
            unitPrice: null,
            totalPrice: null,
          },
          dates: {
            purchaseDate: null,
            warrantyExpiry: null,
            serviceInterval: null,
            nextServiceDue: null,
            invoiceDate: null,
          },
          amount: {
            subtotal: null,
            tax: null,
            total: null,
            currency: 'INR',
          },
          custom: [],
        },
        rawText: fullTextAnnotation,
        reminderData: {
          suggestedReminders: [],
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
      
      // Auto-create reminders from OCR results
      if (user && result.reminderData?.suggestedReminders?.length > 0) {
        await createRemindersFromOCR(
          ocrResultId,
          result.reminderData.suggestedReminders
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
  }, [autoPreprocess, enhanceContrast, denoise, languages, extractReminders, user, createRemindersFromOCR, updateStatistics]);

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
