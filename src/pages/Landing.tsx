import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, SignUpButton, useUser } from '@clerk/clerk-react';
import { dark, light } from '@clerk/themes';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';
import { 
  Sparkles,
  FileText,
  Bell,
  Shield,
  Zap,
  ArrowRight,
  Scan,
  CheckCircle,
  Clock
} from 'lucide-react';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();
  const [theme, setTheme] = React.useState<'light' | 'dark'>('dark');

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const logoSrc = theme === 'dark'
    ? '/dark_theme-removebg-preview.png'
    : '/light_theme-removebg-preview.png';

  // If signed in, redirect to dashboard
  React.useEffect(() => {
    // Only redirect if Clerk has loaded and user is signed in
    if (isLoaded && isSignedIn) {
      navigate('/dashboard');
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <>
      <Helmet>
        <title>DocScan AI - Smart Document Scanning & Reminders</title>
        <meta 
          name="description" 
          content="Scan documents, extract expiry dates, and get automatic reminders. Never miss an important deadline again." 
        />
      </Helmet>

      <Navbar />

      {!isLoaded ? (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      ) : isSignedIn ? (
        <SignedIn>
          {/* Auto-redirect happens in useEffect */}
        </SignedIn>
      ) : (
        <SignedOut>
          <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 relative overflow-hidden pt-16">
            {/* Animated background elements */}
            <div className="fixed inset-0 pointer-events-none">
              <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-3xl animate-blob"></div>
              <div className="absolute bottom-40 right-10 w-72 h-72 bg-gradient-to-r from-accent/20 to-primary/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
              <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
            </div>

            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-4 py-20 sm:py-32 relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-8 animate-fade-in-up">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 hover:border-primary/60 transition-all duration-300 animate-slide-right">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </div>
                    <span className="text-sm font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">AI-Powered Intelligence</span>
                  </div>
                  
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-tight animate-fade-in">
                    <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient-shift">
                      Never Miss
                    </span>
                    <br />
                    <span>What Matters</span>
                  </h1>
                  
                  <p className="text-lg text-muted-foreground leading-relaxed max-w-md animate-fade-in-up animation-delay-200">
                    Scan, detect, remind. Let AI handle your document deadlines.
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animation-delay-400">
                  <SignUpButton mode="modal" appearance={{ baseTheme: theme === 'dark' ? dark : light }}>
                    <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 hover:scale-105">
                      Start Free
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </SignUpButton>
                  <SignInButton mode="modal" appearance={{ baseTheme: theme === 'dark' ? dark : light }}>
                    <Button size="lg" variant="outline" className="hover:bg-card/80 transition-all duration-300 hover:scale-105">
                      Sign In
                    </Button>
                  </SignInButton>
                </div>

                {/* Quick Features */}
                <div className="space-y-3 pt-4 animate-fade-in-up animation-delay-600">
                  <div className="flex items-center gap-3 hover:translate-x-2 transition-transform">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center flex-shrink-0">
                      <Scan className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">Lightning-fast scanning</span>
                  </div>
                  <div className="flex items-center gap-3 hover:translate-x-2 transition-transform">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-accent/30 to-primary/30 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-accent" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">Smart reminders</span>
                  </div>
                  <div className="flex items-center gap-3 hover:translate-x-2 transition-transform">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">100% secure</span>
                  </div>
                </div>
              </div>

              {/* Right Visual - Enhanced with animations */}
              <div className="relative hidden md:flex items-center justify-center animate-fade-in-up animation-delay-300">
                {/* Floating background elements */}
                <div className="absolute inset-0 opacity-40">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl blur-2xl"></div>
                </div>

                {/* Main animated card container */}
                <div className="relative w-full max-w-sm">
                  {/* Glowing background */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-2xl blur opacity-50 animate-gradient-shift"></div>
                  
                  {/* Card */}
                  <div className="relative bg-card/90 backdrop-blur border border-border rounded-2xl p-8 shadow-2xl overflow-hidden group hover:shadow-2xl hover:shadow-primary/30 transition-all duration-500">
                    {/* Inner glow effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-tr from-primary/5 to-accent/5"></div>

                    {/* Animated visual elements */}
                    <div className="relative space-y-6">
                      {/* Top indicator */}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <div className="h-3 w-3 rounded-full bg-primary/60 animate-pulse"></div>
                          <div className="h-3 w-3 rounded-full bg-accent/60 animate-pulse animation-delay-200"></div>
                          <div className="h-3 w-3 rounded-full bg-primary/60 animate-pulse animation-delay-400"></div>
                        </div>
                        <div className="text-xs font-semibold text-primary/70">SCANNING</div>
                      </div>

                      {/* Main visual - Document animation */}
                      <div className="relative h-40 flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl animate-pulse"></div>
                        <div className="relative z-10 space-y-3 w-full">
                          <div className="h-8 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg animate-shimmer"></div>
                          <div className="h-6 bg-gradient-to-r from-primary/15 to-transparent rounded-lg w-4/5 animate-shimmer animation-delay-200"></div>
                          <div className="h-4 bg-gradient-to-r from-accent/15 to-transparent rounded-lg w-3/4 animate-shimmer animation-delay-400"></div>
                        </div>
                      </div>

                      {/* Status indicators */}
                      <div className="space-y-2 pt-4">
                        <div className="flex items-center gap-2 animate-slide-right">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-xs text-muted-foreground">Document detected</span>
                        </div>
                        <div className="flex items-center gap-2 animate-slide-right animation-delay-100">
                          <Sparkles className="h-4 w-4 text-primary flex-shrink-0 animate-spin-slow" />
                          <span className="text-xs text-muted-foreground">Extracting details</span>
                        </div>
                        <div className="flex items-center gap-2 animate-slide-right animation-delay-200">
                          <Bell className="h-4 w-4 text-accent flex-shrink-0" />
                          <span className="text-xs text-muted-foreground">Ready for reminders</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="max-w-7xl mx-auto px-4 py-20 relative z-10">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient-shift">
                Powerful Features
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Everything built for simplicity and speed
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-7">
              {/* Feature 1 */}
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/40 to-accent/40 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-tilt"></div>
                <div className="relative border border-border rounded-xl p-8 hover:border-primary/50 transition-all duration-300 hover:bg-card hover:shadow-lg bg-card/50 backdrop-blur">
                  <div className="space-y-5">
                    <div className="h-16 w-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/25 transition-all duration-300 border border-primary/20">
                      <Scan className="h-8 w-8 text-primary group-hover:animate-spin-slow" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">Instant Scanning</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                        Upload and scan documents with advanced AI processing
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-accent/40 to-primary/40 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-tilt animation-delay-300"></div>
                <div className="relative border border-border rounded-xl p-8 hover:border-accent/50 transition-all duration-300 hover:bg-card hover:shadow-lg bg-card/50 backdrop-blur">
                  <div className="space-y-5">
                    <div className="h-16 w-16 bg-gradient-to-br from-accent/20 to-accent/5 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:bg-accent/25 transition-all duration-300 border border-accent/20">
                      <Sparkles className="h-8 w-8 text-accent group-hover:animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">Smart Detection</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                        AI automatically finds and extracts important dates
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/40 to-accent/40 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-tilt animation-delay-600"></div>
                <div className="relative border border-border rounded-xl p-8 hover:border-primary/50 transition-all duration-300 hover:bg-card hover:shadow-lg bg-card/50 backdrop-blur">
                  <div className="space-y-5">
                    <div className="h-16 w-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/25 transition-all duration-300 border border-primary/20">
                      <Bell className="h-8 w-8 text-primary group-hover:animate-bounce" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">Timely Alerts</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                        Never miss a deadline with intelligent reminders
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="max-w-7xl mx-auto px-4 py-20 relative z-10">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-3xl blur-2xl opacity-60 group-hover:opacity-100 transition duration-500 animate-gradient-shift"></div>
              <div className="relative bg-gradient-to-r from-card/90 via-card/80 to-card/90 backdrop-blur border border-primary/20 rounded-3xl p-16 text-center overflow-hidden group-hover:border-primary/50 transition-all duration-300">
                {/* Background animation */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse"></div>
                </div>

                <div className="relative z-10 space-y-6">
                  <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Ready to Transform Your Documents?
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                    Join users who've already taken control of their document deadlines
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-fade-in-up">
                    <SignUpButton mode="modal" appearance={{ baseTheme: theme === 'dark' ? dark : light }}>
                      <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 hover:scale-105">
                        Create Free Account
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </SignUpButton>
                    <SignInButton mode="modal" appearance={{ baseTheme: theme === 'dark' ? dark : light }}>
                      <Button size="lg" variant="outline" className="hover:bg-card/80 transition-all duration-300 hover:scale-105">
                        Sign In
                      </Button>
                    </SignInButton>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-border/40 bg-card/30 backdrop-blur py-8 relative z-10">
            <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
              <p>&copy; 2025 DocScan AI. All rights reserved.</p>
            </div>
          </footer>
          </div>
        </SignedOut>
      )}
    </>
  );
};

export default Landing;
