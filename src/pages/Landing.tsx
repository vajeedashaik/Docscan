import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { 
  Sparkles,
  FileText,
  Bell,
  Shield,
  Zap,
  ArrowRight
} from 'lucide-react';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = React.useState<'light' | 'dark'>('dark');

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const logoSrc = theme === 'dark'
    ? '/renotify-logo-cyan.png'
    : '/renotify-logo-navy.png';

  // If signed in, redirect to dashboard
  React.useEffect(() => {
    const checkAuth = async () => {
      // This effect will trigger when user signs in
    };
    checkAuth();
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>DocScan AI - Smart Document Scanning & Reminders</title>
        <meta 
          name="description" 
          content="Scan documents, extract expiry dates, and get automatic reminders. Never miss an important deadline again." 
        />
      </Helmet>

      <SignedIn>
        {/* Auto-redirect to dashboard */}
        {typeof window !== 'undefined' && window.location.pathname === '/' && navigate('/dashboard')}
      </SignedIn>

      <SignedOut>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
          {/* Navigation */}
          <nav className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img 
                  src={logoSrc}
                  alt="RENOTIFY" 
                  className="h-10 w-auto"
                />
              </div>
              <div className="flex items-center gap-3">
                <SignInButton mode="modal">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm">
                    Get Started
                  </Button>
                </SignUpButton>
              </div>
            </div>
          </nav>

          {/* Hero Section */}
          <section className="max-w-7xl mx-auto px-4 py-20 sm:py-32">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">AI-Powered Document Intelligence</span>
                  </div>
                  
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                    Never Miss an Expiry Date Again
                  </h1>
                  
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Scan your bills, warranties, and documents. Let AI automatically extract expiry dates and get smart reminders before they expire.
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <SignUpButton mode="modal">
                    <Button size="lg" className="gap-2">
                      Start Free Trial
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </SignUpButton>
                  <SignInButton mode="modal">
                    <Button size="lg" variant="outline">
                      Sign In
                    </Button>
                  </SignInButton>
                </div>

                {/* Features List */}
                <div className="space-y-3 pt-8">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">Secure cloud storage for your documents</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">Lightning-fast OCR processing</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Bell className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">Smart reminders before expiry dates</p>
                  </div>
                </div>
              </div>

              {/* Right Visual */}
              <div className="relative hidden md:block">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent rounded-3xl blur-3xl"></div>
                <div className="relative bg-card/80 backdrop-blur border border-border rounded-2xl p-8 shadow-xl">
                  <div className="space-y-4">
                    {/* Mock Document Card */}
                    <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-sm">Insurance Policy</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Expires: Dec 25, 2025</p>
                      <div className="w-full h-1 bg-primary/20 rounded-full overflow-hidden">
                        <div className="h-full w-1/3 bg-primary rounded-full"></div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-500" />
                        <span className="font-semibold text-sm">Warranty Card</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Expires: Mar 10, 2026</p>
                      <div className="w-full h-1 bg-green-500/20 rounded-full overflow-hidden">
                        <div className="h-full w-2/3 bg-green-500 rounded-full"></div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-orange-500" />
                        <span className="font-semibold text-sm">Health Insurance</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Expires: Jan 5, 2026</p>
                      <div className="w-full h-1 bg-orange-500/20 rounded-full overflow-hidden">
                        <div className="h-full w-1/2 bg-orange-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="max-w-7xl mx-auto px-4 py-20 border-t border-border/40">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Powerful Features</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Everything you need to manage your important documents and never miss a deadline.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="border border-border rounded-lg p-6 hover:bg-card/50 transition-colors">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">AI-Powered OCR</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced AI automatically extracts dates and key information from any document.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="border border-border rounded-lg p-6 hover:bg-card/50 transition-colors">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Smart Reminders</h3>
                <p className="text-sm text-muted-foreground">
                  Get notified before your insurance, warranty, or subscription expires.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="border border-border rounded-lg p-6 hover:bg-card/50 transition-colors">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Secure & Private</h3>
                <p className="text-sm text-muted-foreground">
                  Your documents are encrypted and stored securely in the cloud.
                </p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="max-w-7xl mx-auto px-4 py-20 text-center">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to get started?</h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of users who never miss an important expiry date.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <SignUpButton mode="modal">
                  <Button size="lg" className="gap-2">
                    Create Free Account
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <Button size="lg" variant="outline">
                    Sign In
                  </Button>
                </SignInButton>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-border/40 bg-card/30 py-8">
            <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
              <p>&copy; 2025 DocScan AI. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </SignedOut>
    </>
  );
};

export default Landing;
