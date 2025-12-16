import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getEmailImportSettings,
  toggleEmailImport,
  disconnectEmailImport,
  getImportedBills,
  updateLastSyncedAt,
  updateSyncError,
  triggerEmailSync,
  type EmailImportSettings,
  type ImportedBill,
} from '@/integrations/email/gmailService';
import { toast } from '@/hooks/use-toast';

export const useEmailImport = () => {
  const { userId } = useAuth();
  const [settings, setSettings] = useState<EmailImportSettings | null>(null);
  const [importedBills, setImportedBills] = useState<ImportedBill[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Fetch email import settings
  const fetchSettings = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const data = await getEmailImportSettings(userId);
      setSettings(data);
    } catch (error) {
      console.error('Error fetching email import settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email import settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch imported bills
  const fetchImportedBills = useCallback(async () => {
    if (!userId) return;

    try {
      const bills = await getImportedBills(userId);
      setImportedBills(bills);
    } catch (error) {
      console.error('Error fetching imported bills:', error);
      toast({
        title: 'Error',
        description: 'Failed to load imported bills',
        variant: 'destructive',
      });
    }
  }, [userId]);

  // Toggle email import
  const handleToggle = useCallback(async (enabled: boolean) => {
    if (!userId) return;

    setLoading(true);
    try {
      if (enabled) {
        // Will trigger OAuth flow
        toast({
          title: 'Connecting Gmail',
          description: 'You will be redirected to authorize access to your email',
        });
        // OAuth flow should be triggered by component
      } else {
        // Disable and revoke tokens
        await disconnectEmailImport(userId);
        setSettings(prev => prev ? { ...prev, enabled: false } : null);
        toast({
          title: 'Disconnected',
          description: 'Email bill import has been disabled',
        });
        await fetchSettings();
      }
    } catch (error) {
      console.error('Error toggling email import:', error);
      toast({
        title: 'Error',
        description: 'Failed to update email import settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [userId, fetchSettings]);

  // Manually sync emails
  const handleSync = useCallback(async () => {
    if (!userId || !settings?.enabled) return;

    setSyncing(true);
    try {
      // Trigger backend sync job and refresh data
      await triggerEmailSync();
      toast({
        title: 'Syncing',
        description: 'Syncing your email for new bills...',
      });
      await fetchImportedBills();
    } catch (error) {
      console.error('Error syncing emails:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      await updateSyncError(userId, errorMsg);
      toast({
        title: 'Sync Error',
        description: 'Failed to sync emails. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  }, [userId, settings?.enabled, fetchImportedBills]);

  return {
    settings,
    importedBills,
    loading,
    syncing,
    fetchSettings,
    fetchImportedBills,
    handleToggle,
    handleSync,
  };
};
