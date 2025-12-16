import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

const GmailCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userId, isLoaded } = useAuth();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to be loaded before processing
    if (!isLoaded) {
      return;
    }

    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');

        if (errorParam) {
          throw new Error(`OAuth error: ${errorParam}`);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        if (!userId) {
          throw new Error('User not authenticated. Please sign in first.');
        }

        // Get the Supabase project URL from environment
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl) {
          throw new Error('Supabase URL not configured');
        }

        // Exchange code for tokens via Supabase Edge Function
        const response = await fetch(
          `${supabaseUrl}/functions/v1/auth-gmail-token`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code,
              userId,
              redirectUri: window.location.origin,
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.error || 'Failed to exchange authorization code');
          } catch {
            throw new Error(`Server error: ${response.status}`);
          }
        }

        const data = await response.json();

        // The Edge Function returns: { success: true, message: "...", email: "..." }
        // Tokens are stored directly in the database by the Edge Function
        // We just need to show success and redirect
        const email = data.email;

        toast({
          title: 'Connected',
          description: `Gmail connected successfully: ${email}`,
        });

        // Redirect to settings
        setTimeout(() => {
          navigate('/settings?tab=email-import');
        }, 1500);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('OAuth callback error:', errorMsg);
        setError(errorMsg);
        toast({
          title: 'Connection Failed',
          description: errorMsg,
          variant: 'destructive',
        });
      } finally {
        setProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, userId, isLoaded, navigate]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
        <div className="max-w-md mx-auto px-4 py-12 flex items-center justify-center min-h-screen">
          <Card className="border-border/50 shadow-md w-full">
            <CardContent className="p-8 text-center space-y-4">
              {processing ? (
                <>
                  <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Connecting Gmail...</h2>
                    <p className="text-sm text-muted-foreground mt-2">
                      Please wait while we set up your email bill import
                    </p>
                  </div>
                </>
              ) : error ? (
                <>
                  <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
                    <span className="text-destructive text-lg font-bold">!</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Connection Failed</h2>
                    <p className="text-sm text-destructive mt-2">{error}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center mx-auto">
                    <span className="text-success text-lg font-bold">✓</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Connected Successfully!</h2>
                    <p className="text-sm text-muted-foreground mt-2">
                      Redirecting you back to settings...
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
};

export default GmailCallbackPage;
