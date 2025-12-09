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
import { useReminders } from '@/hooks/useReminders';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'reminders' | 'history'>('upload');
  const { user, isLoaded } = useUser();
  const { upcomingReminders } = useReminders();

  // Show loading state while auth is being checked
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
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
          {/* Hero - Compact for mobile */}
          <section className="px-4 py-5 text-center border-b border-border bg-card/50">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-2">
              <Sparkles className="h-3 w-3" />
              Smart Reminders
            </div>
            
            <h1 className="text-xl font-bold text-foreground mb-1">
              Never Miss an Expiry
            </h1>
            
            <p className="text-sm text-muted-foreground">
              Scan bills & warranties → Get auto-reminders
            </p>
          </section>

          {/* Tab Navigation */}
          <div className="sticky top-[57px] z-40 bg-background border-b border-border">
            <div className="flex">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === 'upload' 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                }`}
              >
                <ScanLine className="h-4 w-4" />
                Scan
                {activeTab === 'upload' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('reminders')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === 'reminders' 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                }`}
              >
                <Bell className="h-4 w-4" />
                Reminders
                {upcomingReminders.length > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="h-5 min-w-5 px-1.5 text-xs ml-1"
                  >
                    {upcomingReminders.length}
                  </Badge>
                )}
                {activeTab === 'reminders' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === 'history' 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                }`}
              >
                <History className="h-4 w-4" />
                History
                {activeTab === 'history' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4">
            {activeTab === 'upload' && <OCRModule />}
            {activeTab === 'reminders' && <RemindersList showAll />}
            {activeTab === 'history' && <OCRDashboard />}
          </div>
        </main>
      </div>
    </>
  );
};

export default Dashboard;
