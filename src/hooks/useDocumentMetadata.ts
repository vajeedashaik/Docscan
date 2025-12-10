import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DocumentMetadata {
  id: string;
  ocr_result_id: string;
  user_id: string;
  category_id: string | null;
  tags: string[];
  vendor_name: string | null;
  vendor_phone: string | null;
  vendor_email: string | null;
  document_number: string | null;
  document_date: string | null;
  expiry_date: string | null;
  renewal_date: string | null;
  amount: number | null;
  currency: string;
  is_starred: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UseDocumentMetadataReturn {
  documents: DocumentMetadata[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updateDocument: (id: string, updates: Partial<DocumentMetadata>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  starDocument: (id: string, starred: boolean) => Promise<void>;
}

export function useDocumentMetadata(): UseDocumentMetadataReturn {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchDocuments = useCallback(async () => {
    if (!user) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('document_metadata')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        if (fetchError.code === '406') {
          // Table doesn't exist yet, return empty list
          console.warn('document_metadata table not available yet');
          setDocuments([]);
        } else {
          throw fetchError;
        }
      } else {
        setDocuments((data as DocumentMetadata[]) || []);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updateDocument = useCallback(
    async (id: string, updates: Partial<DocumentMetadata>) => {
      if (!user) return;

      try {
        const { error: updateError } = await supabase
          .from('document_metadata')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', user.id);

        if (updateError) throw updateError;
        await fetchDocuments();
      } catch (err) {
        console.error('Error updating document:', err);
        setError(err as Error);
      }
    },
    [user, fetchDocuments]
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      if (!user) return;

      try {
        const { error: deleteError } = await supabase
          .from('document_metadata')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;
        await fetchDocuments();
      } catch (err) {
        console.error('Error deleting document:', err);
        setError(err as Error);
      }
    },
    [user, fetchDocuments]
  );

  const starDocument = useCallback(
    async (id: string, starred: boolean) => {
      await updateDocument(id, { is_starred: starred });
    },
    [updateDocument]
  );

  // Set up real-time subscription
  useEffect(() => {
    fetchDocuments();

    if (!user) return;

    const channel = supabase
      .channel(`document_metadata:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_metadata',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDocuments((prev) => [payload.new as DocumentMetadata, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setDocuments((prev) =>
              prev.map((doc) =>
                doc.id === (payload.new as DocumentMetadata).id
                  ? (payload.new as DocumentMetadata)
                  : doc
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setDocuments((prev) =>
              prev.filter((doc) => doc.id !== (payload.old as DocumentMetadata).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, fetchDocuments]);

  return {
    documents,
    isLoading,
    error,
    refetch: fetchDocuments,
    updateDocument,
    deleteDocument,
    starDocument,
  };
}
