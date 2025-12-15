import React, { useState } from 'react';
import { Bell, Settings2, Check, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from '@/hooks/use-toast';

export const NotificationPreferences: React.FC = () => {
  const { preferences, updatePreferences } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localPreferences, setLocalPreferences] = useState(preferences);

  const handleToggle = (key: keyof typeof preferences, value: boolean) => {
    setLocalPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updatePreferences(localPreferences);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Bell className="h-4 w-4" />
        <span className="hidden sm:inline">Notifications</span>
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>Notification Preferences</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              ✕
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Manage how you receive reminders for upcoming deadlines
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Browser Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="notifications-enabled" className="text-sm font-semibold cursor-pointer">
                  Browser Notifications
                </Label>
              </div>
              <Switch
                id="notifications-enabled"
                checked={localPreferences.notifications_enabled}
                onCheckedChange={(value) =>
                  handleToggle('notifications_enabled', value)
                }
              />
            </div>
            {localPreferences.notifications_enabled && (
              <p className="text-xs text-muted-foreground ml-6">
                Get desktop and mobile notifications when reminders are due
              </p>
            )}
          </div>

          {/* Warranty Reminders */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="warranty-reminders" className="text-sm font-semibold cursor-pointer">
                Warranty Expiry Alerts
              </Label>
              <Switch
                id="warranty-reminders"
                checked={localPreferences.warranty_reminders}
                onCheckedChange={(value) =>
                  handleToggle('warranty_reminders', value)
                }
              />
            </div>
            <p className="text-xs text-muted-foreground ml-0">
              Notify before product warranties expire
            </p>
          </div>

          {/* Service Reminders */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="service-reminders" className="text-sm font-semibold cursor-pointer">
                Service Due Reminders
              </Label>
              <Switch
                id="service-reminders"
                checked={localPreferences.service_reminders}
                onCheckedChange={(value) =>
                  handleToggle('service_reminders', value)
                }
              />
            </div>
            <p className="text-xs text-muted-foreground ml-0">
              Notify when scheduled maintenance or service is due
            </p>
          </div>

          {/* Payment Reminders */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="payment-reminders" className="text-sm font-semibold cursor-pointer">
                Payment Due Alerts
              </Label>
              <Switch
                id="payment-reminders"
                checked={localPreferences.payment_reminders}
                onCheckedChange={(value) =>
                  handleToggle('payment_reminders', value)
                }
              />
            </div>
            <p className="text-xs text-muted-foreground ml-0">
              Notify before bill payments are due
            </p>
          </div>

          {/* Subscription Reminders */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="subscription-reminders" className="text-sm font-semibold cursor-pointer">
                Subscription Renewal Alerts
              </Label>
              <Switch
                id="subscription-reminders"
                checked={localPreferences.subscription_reminders}
                onCheckedChange={(value) =>
                  handleToggle('subscription_reminders', value)
                }
              />
            </div>
            <p className="text-xs text-muted-foreground ml-0">
              Notify before subscriptions and renewals are due
            </p>
          </div>

          {/* Email Reminders */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-reminders" className="text-sm font-semibold cursor-pointer">
                Email Reminders
              </Label>
              <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
            </div>
            <Switch
              id="email-reminders"
              checked={localPreferences.email_reminders_enabled}
              onCheckedChange={(value) =>
                handleToggle('email_reminders_enabled', value)
              }
              disabled={true}
            />
            <p className="text-xs text-muted-foreground ml-0">
              Receive email notifications for important reminders (coming soon)
            </p>
          </div>

          {/* Info Alert */}
          <div className="flex gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Notifications will be checked every 5 minutes. Critical reminders (within 3 days) will show as alerts.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setLocalPreferences(preferences);
                setIsOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <>Saving...</>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
