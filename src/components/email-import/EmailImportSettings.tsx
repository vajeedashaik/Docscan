import React, { useEffect, useState } from 'react';
import { Mail, RefreshCw, CheckCircle, AlertCircle, Unlink, Lock } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useEmailImport } from '@/hooks/useEmailImport';
import { format } from 'date-fns';

interface EmailImportSettingsProps {
  googleClientId: string;
}

export const EmailImportSettings: React.FC<EmailImportSettingsProps> = ({ googleClientId }) => {
  const { userId, isLoaded } = useAuth();
  const { settings, loading, syncing, fetchSettings, handleToggle, handleSync } = useEmailImport();
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleConnect = async () => {
    if (!userId) {
      // Don't allow connection without being signed in
      return;
    }
    
    setIsConnecting(true);
    try {
      // Redirect to OAuth flow
      const redirectUri = `${window.location.origin}/auth/gmail-callback`;
      
      const params = new URLSearchParams({
        client_id: googleClientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/gmail.readonly',
        access_type: 'offline',
        prompt: 'consent',
        state: Math.random().toString(36).substring(7),
      });

      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    } catch (error) {
      console.error('Error initiating OAuth:', error);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect email bill import? This will disable automatic bill scanning.')) {
      await handleToggle(false);
    }
  };

  if (loading || !isLoaded) {
    return (
      <Card className="border-border/50 shadow-md">
        <CardContent className="p-6 text-center">
          <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </CardContent>
      </Card>
    );
  }

  if (!userId) {
    return (
      <Card className="border-border/50 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Lock className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground mb-2">Sign in to Enable Email Import</p>
              <p className="text-sm text-muted-foreground">
                Please sign in to your account to connect Gmail and enable automatic bill imports.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/30 to-blue-600/30 flex items-center justify-center">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Auto Email Bill Import</CardTitle>
              <CardDescription>
                Automatically fetch bills from your email and create reminders
              </CardDescription>
            </div>
          </div>
          {settings?.enabled ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="text-sm font-semibold text-success">Connected</span>
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Email */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Email Account</Label>
          <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
            <p className="text-sm font-medium text-foreground">{settings?.email_address}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Emails from this account will be scanned for bills
            </p>
          </div>
        </div>

        {/* Enable/Disable Toggle */}
        {settings?.enabled ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold">Service Status</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Email scanning is {settings.enabled ? 'active' : 'inactive'}
                </p>
              </div>
              <Switch
                checked={settings.enabled}
                onCheckedChange={handleToggle}
                disabled={loading}
              />
            </div>

            {/* Last Synced */}
            {settings.last_synced_at && (
              <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground">
                  Last synced: {format(new Date(settings.last_synced_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            )}

            {/* Sync Error */}
            {settings.sync_error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-destructive">Sync Error</p>
                  <p className="text-xs text-destructive/80 mt-1">{settings.sync_error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSync}
                disabled={syncing || loading}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Button>
              <Button
                onClick={handleDisconnect}
                disabled={loading || syncing}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                <Unlink className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>

            {/* Info Box */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                <strong>How it works:</strong> We scan your email for bills (PDFs, invoices, statements) and automatically extract due dates to create reminders. Only bill-related emails are processed.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                Connect your Gmail account to automatically import bills and get reminders for due dates.
              </p>
            </div>

            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full h-10 font-semibold"
            >
              <Mail className="h-4 w-4 mr-2" />
              {isConnecting ? 'Connecting...' : 'Connect Gmail'}
            </Button>

            <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
              <p className="text-xs text-muted-foreground space-y-2">
                <span className="block">✓ Read-only access to bills only</span>
                <span className="block">✓ Your email and password are never stored</span>
                <span className="block">✓ You can disconnect anytime</span>
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
