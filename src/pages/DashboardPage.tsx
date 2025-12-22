import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useUser, SignedIn, SignedOut } from '@clerk/clerk-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { 
  Sparkles,
  ScanLine,
  History,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Mail,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/Navbar';
import { RemindersList } from '@/components/reminders/RemindersList';
import { DocumentList } from '@/components/dashboard/DocumentList';
import { ImportedBillsDashboardCard } from '@/components/dashboard/ImportedBillsDashboardCard';
import { useReminders } from '@/hooks/useReminders';
import { useDocumentMetadata } from '@/hooks/useDocumentMetadata';
import { useOCRStats } from '@/hooks/useOCRStats';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const DashboardPage: React.FC = () => {
  const { user, isLoaded } = useUser();
  const { userId } = useAuth();
  const { upcomingReminders } = useReminders();
  const { documents, isLoading: docsLoading, starDocument, deleteDocument } = useDocumentMetadata();
  const { totalDocuments, totalStorageUsedGB, recentScans, successfulScans, failedScans, fetchStats, isLoading } = useOCRStats();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'reminders' | 'importedBills' | 'settings'>('overview');

  // Listen for OCR job completion and refresh stats
  useEffect(() => {
    if (!userId) return;

    console.log('Setting up real-time subscription for userId:', userId);

    const channel = supabase
      .channel(`ocr-jobs:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ocr_jobs',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Received OCR job update:', payload);
          if (payload.new?.status === 'completed' || payload.new?.status === 'failed') {
            console.log('Job completed/failed, fetching stats...');
            fetchStats();
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchStats]);

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
        <title>Dashboard | DocScan AI</title>
        <meta 
          name="description" 
          content="Manage your scanned documents, set reminders, and view your account details." 
        />
      </Helmet>

      <SignedOut>
        <Navigate to="/" replace />
      </SignedOut>

      <SignedIn>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
          <div className="max-w-7xl mx-auto px-4 py-12">
            {/* Header */}
            <div className="mb-12">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-4xl sm:text-5xl font-bold">
                    Welcome back, <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {user?.firstName || 'there'}
                    </span>
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    Manage your documents and stay on top of important dates
                  </p>
                </div>
                <Button onClick={() => navigate('/ocr')} className="bg-gradient-to-r from-primary to-accent gap-2 w-full sm:w-auto">
                  <ScanLine className="h-4 w-4" />
                  Scan New Document
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Documents Scanned</p>
                      <p className="text-2xl font-bold mt-1">{isLoading ? '-' : totalDocuments}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                      <ScanLine className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Upcoming Reminders</p>
                      <p className="text-2xl font-bold mt-1">{upcomingReminders.length}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-accent/30 to-primary/30 flex items-center justify-center">
                      <Bell className="h-5 w-5 text-accent" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-8 border-b border-border/40">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-all ${
                  activeTab === 'overview'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sparkles className="h-4 w-4 inline mr-2" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('reminders')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-all ${
                  activeTab === 'reminders'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Bell className="h-4 w-4 inline mr-2" />
                Reminders
              </button>
              <button
                onClick={() => setActiveTab('importedBills')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-all ${
                  activeTab === 'importedBills'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Mail className="h-4 w-4 inline mr-2" />
                Imported Bills
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-all ${
                  activeTab === 'settings'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Settings className="h-4 w-4 inline mr-2" />
                Settings
              </button>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'overview' && (
                <>
                  {/* Recent Documents */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <DocumentList
                        documents={documents}
                        isLoading={docsLoading}
                        onStar={starDocument}
                        onDelete={deleteDocument}
                      />
                    </div>

                    {/* Quick Actions + Tips */}
                    <div className="space-y-4">
                      <Card className="border-border/50 bg-card/50 backdrop-blur">
                        <CardHeader>
                          <CardTitle className="text-lg">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Button onClick={() => navigate('/ocr')} className="w-full bg-gradient-to-r from-primary to-accent justify-start gap-2">
                            <ScanLine className="h-4 w-4" />
                            New Scan
                          </Button>
                          <Button onClick={() => setActiveTab('reminders')} variant="outline" className="w-full justify-start gap-2">
                            <Bell className="h-4 w-4" />
                            Manage Reminders
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="border-border/50 bg-card/50 backdrop-blur border-primary/20 bg-primary/5">
                        <CardHeader>
                          <CardTitle className="text-lg text-primary">Pro Tip</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Scanned {totalDocuments} document{totalDocuments !== 1 ? 's' : ''} so far. Auto-reminders are created for important dates!
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'reminders' && (
                <Card className="border-border/50 bg-card/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle>Your Reminders</CardTitle>
                    <CardDescription>Manage and track all your important dates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RemindersList showAll />
                  </CardContent>
                </Card>
              )}

              {activeTab === 'importedBills' && (
                <ImportedBillsDashboardCard />
              )}

              {activeTab === 'settings' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <Card className="border-border/50 bg-card/50 backdrop-blur">
                      <CardHeader>
                        <CardTitle>Account Settings</CardTitle>
                        <CardDescription>Manage your account preferences</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="pb-6 border-b border-border/40">
                          <h3 className="font-semibold mb-2">Account Information</h3>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Email</p>
                              <p className="text-sm font-medium">{user?.emailAddresses?.[0]?.emailAddress || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Name</p>
                              <p className="text-sm font-medium">{user?.firstName} {user?.lastName || ''}</p>
                            </div>
                          </div>
                        </div>

                        <div className="pb-6 border-b border-border/40">
                          <h3 className="font-semibold mb-2">Statistics</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Documents Scanned</p>
                              <p className="text-lg font-bold">{totalDocuments}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Success Rate</p>
                              <p className="text-lg font-bold">{totalDocuments > 0 ? `${Math.round((successfulScans / totalDocuments) * 100)}%` : '0%'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Storage Used</p>
                              <p className="text-lg font-bold">{totalStorageUsedGB} GB</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Failed Scans</p>
                              <p className="text-lg font-bold text-red-500">{failedScans}</p>
                            </div>
                          </div>
                        </div>

                        <div className="pb-6 border-b border-border/40">
                          <h3 className="font-semibold mb-2">Email Notifications</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Get notified about reminders and updates
                          </p>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                            <span className="text-sm">Enable email reminders</span>
                          </label>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-2">Danger Zone</h3>
                          <Button variant="destructive" className="gap-2">
                            <LogOut className="h-4 w-4" />
                            Delete Account
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <Card className="border-border/50 bg-card/50 backdrop-blur border-primary/20 bg-primary/5">
                      <CardHeader>
                        <CardTitle className="text-sm text-primary">Usage Stats</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Successful Scans:</span>
                          <span className="font-medium text-green-600">{successfulScans}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Failed Scans:</span>
                          <span className="font-medium text-red-600">{failedScans}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reminders Set:</span>
                          <span className="font-medium">{upcomingReminders.length}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </SignedIn>
    </>
  );
};

export default DashboardPage;
