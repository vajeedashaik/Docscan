import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { 
  Sparkles,
  ScanLine,
  History,
  Bell
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { OCRModule } from '@/components/ocr/OCRModule';
import { OCRDashboard } from '@/components/ocr/OCRDashboard';
import { RemindersList } from '@/components/reminders/RemindersList';
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { DocumentList } from '@/components/dashboard/DocumentList';
import { useReminders } from '@/hooks/useReminders';
import { useNotifications } from '@/hooks/useNotifications';
import { useUserStatistics } from '@/hooks/useUserStatistics';
import { useDocumentMetadata } from '@/hooks/useDocumentMetadata';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'reminders' | 'history'>('upload');
  const [showNotificationPrefs, setShowNotificationPrefs] = useState(false);
  const { user, isLoaded } = useUser();
  const { upcomingReminders } = useReminders();
  const { checkAndNotify } = useNotifications(); // Initialize notification system
  const { statistics, isLoading: statsLoading } = useUserStatistics();
  const { documents, isLoading: docsLoading, starDocument, deleteDocument, refetch } = useDocumentMetadata();

  // Wrap refetch with logging
  const handleScanComplete = async () => {
    console.log('Dashboard: handleScanComplete called, refetching documents...');
    try {
      await refetch();
      console.log('Dashboard: Documents refetched successfully');
    } catch (error) {
      console.error('Dashboard: Error refetching documents:', error);
    }
  };

  console.log('Dashboard: handleScanComplete defined?', typeof handleScanComplete);
  console.log('Dashboard: Passing handleScanComplete to OCRModule');  // Show loading state while auth is being checked
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to landing if not signed in
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Helmet>
        <title>OCR Extractor | Scan Documents & Set Reminders</title>
        <meta 
          name="description" 
          content="Scan documents, extract expiry dates, and get automatic reminders before warranties and services expire." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1 flex flex-col">
          {/* Hero Section - Improved visual hierarchy */}
          <section className="px-4 sm:px-6 py-6 sm:py-8 border-b border-border bg-gradient-surface">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              Smart Reminders
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Never Miss an Expiry
            </h1>
            
            <p className="text-base sm:text-lg text-muted-foreground font-medium max-w-md">
              Scan bills & warranties → Get auto-reminders before they expire
            </p>
          </section>

          {/* Tab Navigation - Better styling */}
          <div className="sticky top-[57px] z-40 bg-background border-b border-border shadow-sm">
            <div className="flex divide-x divide-border">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-smooth relative group ${
                  activeTab === 'upload' 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ScanLine className="h-4.5 w-4.5" />
                <span className="hidden sm:inline">Scan</span>
                {activeTab === 'upload' && (
                  <span className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-lg" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('reminders')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-smooth relative group ${
                  activeTab === 'reminders' 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Bell className="h-4.5 w-4.5" />
                <span className="hidden sm:inline">Reminders</span>
                {upcomingReminders.length > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="h-5 min-w-5 px-1.5 text-xs ml-1 animate-pulse"
                  >
                    {upcomingReminders.length}
                  </Badge>
                )}
                {activeTab === 'reminders' && (
                  <span className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-lg" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-smooth relative group ${
                  activeTab === 'history' 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <History className="h-4.5 w-4.5" />
                <span className="hidden sm:inline">History</span>
                {activeTab === 'history' && (
                  <span className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-lg" />
                )}
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'upload' && (
              <div className="p-4 sm:p-6 space-y-8">
                <OCRModule onScanComplete={handleScanComplete} />
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
                  <StatsGrid statistics={statistics} isLoading={statsLoading} />
                </div>
                <DocumentList
                  documents={documents}
                  isLoading={docsLoading}
                  onStar={starDocument}
                  onDelete={deleteDocument}
                />
              </div>
            )}
            {activeTab === 'reminders' && (
              <div className="p-4 sm:p-6">
                <RemindersList showAll />
              </div>
            )}
            {activeTab === 'history' && (
              <div className="p-4 sm:p-6 space-y-8">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-foreground">Your Activity</h2>
                  <StatsGrid statistics={statistics} isLoading={statsLoading} />
                </div>
                <OCRDashboard />
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default Dashboard;
