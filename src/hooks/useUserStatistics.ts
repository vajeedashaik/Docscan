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
  const { user } = useAuth();

  const fetchStatistics = useCallback(async () => {
    if (!user) {
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
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        throw fetchError;
      }

      if (data) {
        setStatistics(data as UserStatistics);
      } else {
        // Create initial statistics record if it doesn't exist
        const { data: newStats, error: insertError } = await supabase
          .from('user_statistics')
          .insert({
            user_id: user.id,
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

        if (insertError) throw insertError;
        setStatistics(newStats as UserStatistics);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updateStatistics = useCallback(
    async (updates: Partial<UserStatistics>) => {
      if (!user || !statistics) return;

      try {
        const { data, error: updateError } = await supabase
          .from('user_statistics')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .select()
          .single();

        if (updateError) throw updateError;
        setStatistics(data as UserStatistics);
      } catch (err) {
        console.error('Error updating statistics:', err);
        setError(err as Error);
      }
    },
    [user, statistics]
  );

  // Set up real-time subscription
  useEffect(() => {
    fetchStatistics();

    if (!user) return;

    const channel = supabase
      .channel(`user_statistics:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_statistics',
          filter: `user_id=eq.${user.id}`,
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
  }, [user, fetchStatistics]);

  return {
    statistics,
    isLoading,
    error,
    refetch: fetchStatistics,
    updateStatistics,
  };
}
