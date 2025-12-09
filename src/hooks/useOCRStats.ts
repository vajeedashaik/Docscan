import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface OCRResult {
  id: string;
  job_id: string;
  document_type: string | null;
  extracted_data: unknown;
  confidence: number | null;
  created_at: string;
}

export interface OCRJob {
  id: string;
  file_name: string;
  file_size: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  started_at: string;
  completed_at: string | null;
  processing_time_ms: number | null;
  created_at: string;
}

export interface OCRJobWithResult extends OCRJob {
  result?: OCRResult;
}

export interface UseOCRStatsReturn {
  totalDocuments: number;
  totalStorageUsed: number; // in bytes
  totalStorageUsedGB: string; // formatted as GB
  recentScans: OCRJobWithResult[];
  successfulScans: number;
  failedScans: number;
  averageConfidence: number;
  averageProcessingTime: number;
  isLoading: boolean;
  error: Error | null;
  fetchStats: () => Promise<void>;
}

export function useOCRStats(): UseOCRStatsReturn {
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [totalStorageUsed, setTotalStorageUsed] = useState(0);
  const [recentScans, setRecentScans] = useState<OCRJobWithResult[]>([]);
  const [successfulScans, setSuccessfulScans] = useState(0);
  const [failedScans, setFailedScans] = useState(0);
  const [averageConfidence, setAverageConfidence] = useState(0);
  const [averageProcessingTime, setAverageProcessingTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchStats = useCallback(async () => {
    if (!user?.userId) {
      console.log('No user ID available, skipping fetch');
      return;
    }

    console.log('Fetching OCR stats for user:', user.userId);
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all OCR jobs for the user
      const { data: jobs, error: jobsError } = await supabase
        .from('ocr_jobs')
        .select('*')
        .eq('user_id', user.userId)
        .order('created_at', { ascending: false });

      console.log('OCR jobs fetched:', jobs?.length, 'error:', jobsError);

      if (jobsError) throw jobsError;

      // Calculate total documents
      setTotalDocuments(jobs?.length || 0);

      // Calculate total storage (sum of file sizes)
      const totalStorage = jobs?.reduce((sum, job) => sum + (job.file_size || 0), 0) || 0;
      setTotalStorageUsed(totalStorage);

      // Count successful and failed scans
      const successful = jobs?.filter(job => job.status === 'completed').length || 0;
      const failed = jobs?.filter(job => job.status === 'failed').length || 0;
      setSuccessfulScans(successful);
      setFailedScans(failed);

      // Fetch OCR results for recent scans
      const { data: results, error: resultsError } = await supabase
        .from('ocr_results')
        .select('*')
        .in('job_id', jobs?.map(j => j.id) || [])
        .order('created_at', { ascending: false })
        .limit(10);

      if (resultsError) throw resultsError;

      // Calculate average confidence
      const avgConfidence = results && results.length > 0
        ? results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length
        : 0;
      setAverageConfidence(Math.round(avgConfidence * 100) / 100);

      // Calculate average processing time
      const completedJobs = jobs?.filter(j => j.status === 'completed' && j.processing_time_ms) || [];
      const avgTime = completedJobs.length > 0
        ? completedJobs.reduce((sum, j) => sum + (j.processing_time_ms || 0), 0) / completedJobs.length
        : 0;
      setAverageProcessingTime(Math.round(avgTime));

      // Prepare recent scans with results
      const recentJobsWithResults: OCRJobWithResult[] = (jobs?.slice(0, 5) || []).map(job => ({
        ...(job as OCRJob),
        result: results?.find(r => r.job_id === job.id) as OCRResult | undefined,
      }));
      setRecentScans(recentJobsWithResults);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch OCR stats';
      setError(new Error(errorMessage));
      console.error('Error fetching OCR stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.userId]);

  // Initial fetch and refetch when user changes
  useEffect(() => {
    const performFetch = async () => {
      if (!user?.userId) {
        console.log('No user ID available, skipping fetch');
        return;
      }

      console.log('useOCRStats: User ID changed, fetching stats');
      await fetchStats();
    };

    performFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  const totalStorageUsedGB = (totalStorageUsed / (1024 * 1024 * 1024)).toFixed(2);

  return {
    totalDocuments,
    totalStorageUsed,
    totalStorageUsedGB,
    recentScans,
    successfulScans,
    failedScans,
    averageConfidence,
    averageProcessingTime,
    isLoading,
    error,
    fetchStats,
  };
}
