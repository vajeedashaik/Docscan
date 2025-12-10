import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserStatistics {
  id: string;
  user_id: string;
  total_documents_scanned: number;
  total_storage_used_bytes: number;
  successful_scans: number;
  failed_scans: number;
  total_reminders_created: number;
  total_reminders_completed: number;
  average_confidence_score: number | null;
  most_common_document_type: string | null;
  last_scan_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface UseUserStatisticsReturn {
  statistics: UserStatistics | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updateStatistics: (updates: Partial<UserStatistics>) => Promise<void>;
}

export function useUserStatistics(): UseUserStatisticsReturn {
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { userId } = useAuth();

  const fetchStatistics = useCallback(async () => {
    if (!userId) {
      setStatistics(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try to fetch existing statistics
      const { data, error: fetchError } = await supabase
        .from('user_statistics')
        .select('*')
        .eq('user_id', userId)
        .single();

      // If table doesn't exist (406) or no rows (PGRST116), create initial record
      if ((fetchError?.code === 'PGRST116') || (fetchError?.status === 406) || !data) {
        // Create initial statistics record
        const { data: newStats, error: insertError } = await supabase
          .from('user_statistics')
          .insert({
            user_id: userId,
            total_documents_scanned: 0,
            total_storage_used_bytes: 0,
            successful_scans: 0,
            failed_scans: 0,
            total_reminders_created: 0,
            total_reminders_completed: 0,
            average_confidence_score: null,
            most_common_document_type: null,
            last_scan_date: null,
          })
          .select()
          .single();

        if (insertError && insertError.code !== 'PGRST116') {
          console.warn('Could not create statistics record:', insertError);
          // Set empty stats if table doesn't exist yet
          setStatistics(null);
        } else if (newStats) {
          setStatistics(newStats as UserStatistics);
        }
      } else if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      } else if (data) {
        setStatistics(data as UserStatistics);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const updateStatistics = useCallback(
    async (updates: Partial<UserStatistics>) => {
      if (!userId) return;

      try {
        // Ensure statistics record exists
        let currentStats = statistics;
        
        if (!currentStats) {
          const { data: existingStats, error: fetchError } = await supabase
            .from('user_statistics')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (fetchError?.code === 'PGRST116' || !existingStats) {
            // Create initial statistics record if it doesn't exist
            const { data: newStats, error: insertError } = await supabase
              .from('user_statistics')
              .insert({
                user_id: userId,
                total_documents_scanned: 0,
                total_storage_used_bytes: 0,
                successful_scans: 0,
                failed_scans: 0,
                total_reminders_created: 0,
                total_reminders_completed: 0,
                average_confidence_score: null,
                most_common_document_type: null,
                last_scan_date: null,
              })
              .select()
              .single();

            if (insertError) {
              if (insertError.code !== '406') { // Ignore "table not found" errors
                throw insertError;
              }
              console.warn('user_statistics table not available yet');
              return;
            }
            currentStats = newStats as UserStatistics;
          } else if (fetchError) {
            throw fetchError;
          } else {
            currentStats = existingStats as UserStatistics;
          }
        }

        // Now update the statistics
        const { data, error: updateError } = await supabase
          .from('user_statistics')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (updateError) {
          if (updateError.code === '406') {
            // Table not available yet, skip silently
            console.warn('user_statistics table not available yet');
            return;
          }
          throw updateError;
        }
        if (data) {
          setStatistics(data as UserStatistics);
        }
      } catch (err) {
        console.error('Error updating statistics:', err);
        setError(err as Error);
      }
    },
    [userId, statistics]
  );

  // Set up real-time subscription
  useEffect(() => {
    fetchStatistics();

    if (!userId) return;

    const channel = supabase
      .channel(`user_statistics:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_statistics',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            setStatistics(payload.new as UserStatistics);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, fetchStatistics]);

  return {
    statistics,
    isLoading,
    error,
    refetch: fetchStatistics,
    updateStatistics,
  };
}
