import React from 'react';
import { Helmet } from 'react-helmet';
import { useUser, SignedOut, SignedIn } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navbar } from '@/components/layout/Navbar';
import { EmailImportSettings } from '@/components/email-import/EmailImportSettings';
import { ImportedBillsList } from '@/components/email-import/ImportedBillsList';

const SettingsPage: React.FC = () => {
  const { user, isLoaded } = useUser();
  
  // Get Google Client ID from environment
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  if (!isLoaded) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 flex items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>AutoImport Bills | ReNotify</title>
        <meta 
          name="description" 
          content="Manage AutoImport Bills and email integration preferences" 
        />
      </Helmet>

      <SignedOut>
        <Navigate to="/" replace />
      </SignedOut>

      <SignedIn>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
          <div className="max-w-4xl mx-auto px-4 py-12">
            {/* Header */}
            <div className="mb-12 space-y-4">
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    AutoImport Bills
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground">
                  Manage your email bill import and preferences
                </p>
              </div>
            </div>

            {/* Email Import Section */}
            <div className="space-y-6">
              <EmailImportSettings googleClientId={googleClientId} />
              <ImportedBillsList />
            </div>
          </div>
        </main>
      </SignedIn>
    </>
  );
};

export default SettingsPage;
