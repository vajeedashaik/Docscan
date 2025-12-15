import { useEffect, useCallback } from 'react';
import { useReminders, type Reminder } from '@/hooks/useReminders';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface NotificationPreferences {
  warranty_reminders: boolean;
  service_reminders: boolean;
  subscription_reminders: boolean;
  payment_reminders: boolean;
  notifications_enabled: boolean;
  email_reminders_enabled: boolean;
}

export interface UseNotificationsReturn {
  preferences: NotificationPreferences;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  checkAndNotify: () => Promise<void>;
}

/**
 * Hook to manage reminder notifications
 * Handles browser notifications and email reminders
 */
export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuth();
  const { upcomingReminders } = useReminders();

  // Default preferences
  const defaultPreferences: NotificationPreferences = {
    warranty_reminders: true,
    service_reminders: true,
    subscription_reminders: true,
    payment_reminders: true,
    notifications_enabled: true,
    email_reminders_enabled: false, // Email reminders disabled by default
  };

  const checkAndNotify = useCallback(async () => {
    if (!user || !upcomingReminders.length) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check each reminder to see if it needs notification
    for (const reminder of upcomingReminders) {
      if (reminder.is_notified || reminder.is_dismissed) continue;

      const reminderDate = new Date(reminder.reminder_date);
      reminderDate.setHours(0, 0, 0, 0);

      // Calculate when to notify based on notify_before_days
      const notifyDate = new Date(reminderDate);
      notifyDate.setDate(notifyDate.getDate() - reminder.notify_before_days);

      // If today is on or after the notify date, send notification
      // Also notify if the reminder date has passed (up to 7 days overdue)
      const daysPastDue = Math.ceil((today.getTime() - reminderDate.getTime()) / (1000 * 60 * 60 * 24));
      const shouldNotify = (today >= notifyDate && today <= reminderDate) || (daysPastDue > 0 && daysPastDue <= 7);
      
      if (shouldNotify && !reminder.is_notified) {
        await sendNotification(reminder);

        // Mark as notified in database
        try {
          await supabase
            .from('reminders')
            .update({ is_notified: true })
            .eq('id', reminder.id);
        } catch (err) {
          console.error('Error marking reminder as notified:', err);
        }
      }
    }
  }, [user, upcomingReminders]);

  /**
   * Send browser notification
   */
  const sendNotification = async (reminder: Reminder) => {
    const title = reminder.title || 'Reminder';
    const options: NotificationOptions = {
      body: reminder.description || 'You have a pending reminder',
      icon: '/reminder-icon.png',
      tag: `reminder-${reminder.id}`,
      requireInteraction: false,
    };

    // Try browser notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, options);
      } catch (err) {
        console.error('Error sending browser notification:', err);
      }
    }

    // Always show in-app toast notification
    const daysUntil = Math.ceil(
      (new Date(reminder.reminder_date).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );

    let message = reminder.description || title;
    if (daysUntil <= 0) {
      message = `${title} - Due today or overdue!`;
    } else if (daysUntil === 1) {
      message = `${title} - Due tomorrow!`;
    } else {
      message = `${title} - ${daysUntil} days remaining`;
    }

    toast({
      title: title,
      description: message,
      variant: daysUntil <= 3 ? 'destructive' : 'default',
    });

    // Send email notification if enabled
    if (reminder.reminder_type === 'warranty_expiry' && daysUntil <= 7) {
      await sendEmailNotification(reminder, 'warranty_expiry');
    } else if (reminder.reminder_type === 'service_due' && daysUntil <= 7) {
      await sendEmailNotification(reminder, 'service_due');
    } else if (reminder.reminder_type === 'payment_due' && daysUntil <= 3) {
      await sendEmailNotification(reminder, 'payment_due');
    }
  };

  /**
   * Send email notification using Supabase function
   */
  const sendEmailNotification = async (
    reminder: Reminder,
    type: 'warranty_expiry' | 'service_due' | 'payment_due'
  ) => {
    if (!user) return;

    try {
      // You can integrate with Supabase Edge Functions or email service
      // For now, we'll just log it
      console.log(`Email notification queued for ${user.id}:`, {
        type,
        reminder,
        timestamp: new Date().toISOString(),
      });

      // In production, you would call an edge function:
      // await supabase.functions.invoke('send-reminder-email', {
      //   body: { reminderId: reminder.id, userId: user.id }
      // });
    } catch (err) {
      console.error('Error sending email notification:', err);
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          toast({
            title: 'Notifications Enabled',
            description: 'You will receive reminders for upcoming deadlines',
          });
        }
      });
    }
  }, []);

  // Check for notifications periodically
  useEffect(() => {
    // Check immediately on mount
    checkAndNotify();
    
    // Then check every 5 minutes
    const interval = setInterval(() => {
      checkAndNotify();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkAndNotify]);

  const updatePreferences = useCallback(
    async (prefs: Partial<NotificationPreferences>) => {
      if (!user) return;

      try {
        await (supabase as any)
          .from('notification_preferences')
          .upsert({
            user_id: user.id,
            warranty_reminders: prefs.warranty_reminders ?? defaultPreferences.warranty_reminders,
            service_reminders: prefs.service_reminders ?? defaultPreferences.service_reminders,
            subscription_reminders:
              prefs.subscription_reminders ?? defaultPreferences.subscription_reminders,
            payment_reminders: prefs.payment_reminders ?? defaultPreferences.payment_reminders,
            updated_at: new Date().toISOString(),
          });

        toast({
          title: 'Preferences Updated',
          description: 'Your notification preferences have been saved',
        });
      } catch (err) {
        console.error('Error updating notification preferences:', err);
        toast({
          title: 'Error',
          description: 'Failed to update preferences',
          variant: 'destructive',
        });
      }
    },
    [user]
  );

  return {
    preferences: defaultPreferences,
    updatePreferences,
    checkAndNotify,
  };
}
