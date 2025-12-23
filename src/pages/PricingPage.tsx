import React from 'react';
import { Helmet } from 'react-helmet';
import { PricingTable } from '@clerk/clerk-react';
import { dark, light } from '@clerk/themes';
import { Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';
import { Link } from 'react-router-dom';

const PricingPage: React.FC = () => {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('dark');

  React.useEffect(() => {
    // Function to get current theme
    const getCurrentTheme = (): 'light' | 'dark' => {
      const root = window.document.documentElement;
      return root.classList.contains('light') ? 'light' : 'dark';
    };

    // Set initial theme
    setTheme(getCurrentTheme());

    // Watch for changes to the document element's class
    const observer = new MutationObserver(() => {
      setTheme(getCurrentTheme());
    });

    observer.observe(window.document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'],
      attributeOldValue: true
    });

    return () => observer.disconnect();
  }, []);

  const features = [
    { name: 'AI-Powered OCR', description: 'Extract text from any document' },
    { name: 'Unlimited Scanning', description: 'Process as many documents as you need' },
    { name: 'Smart Reminders', description: 'Never miss an expiry date' },
    { name: 'Cloud Storage', description: 'Secure backup of all documents' },
    { name: 'Priority Support', description: 'Get help when you need it' },
    { name: 'Advanced Analytics', description: 'Track your document history' },
  ];

  return (
    <>
      <Helmet>
        <title>Pricing | DocScan AI</title>
        <meta 
          name="description" 
          content="Simple, transparent pricing for DocScan AI. Get started with our free tier or upgrade for advanced features." 
        />
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-primary/15 to-accent/15 rounded-full blur-3xl animate-blob opacity-60"></div>
          <div className="absolute bottom-40 right-10 w-72 h-72 bg-gradient-to-r from-accent/15 to-primary/15 rounded-full blur-3xl animate-blob animation-delay-2000 opacity-60"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
          {/* Header */}
          <div className="text-center mb-20 space-y-5">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Simple, Transparent Pricing
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Choose the perfect plan for your needs. All plans include our core AI-powered OCR features.
            </p>
          </div>

          {/* Clerk Pricing Table */}
          <div className="mb-20">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-3 text-foreground">Choose Your Plan</h2>
              <p className="text-muted-foreground text-base">
                Subscribe now and start your free trial
              </p>
            </div>
            <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <PricingTable appearance={{ baseTheme: theme === 'dark' ? dark : light }} />
            </div>
          </div>

          {/* Features Comparison */}
          <div className="mb-20">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-foreground">What's Included</h2>
              <p className="text-muted-foreground mt-2">Everything you need to manage your documents</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4 p-5 rounded-xl bg-card/60 backdrop-blur border border-border hover:border-primary/40 hover:bg-card hover:shadow-md transition-all duration-300 group">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/80 to-accent/80 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base text-foreground">{feature.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1.5">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="text-center py-16 border-t border-border/40 relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative space-y-6">
              <h2 className="text-3xl font-bold text-foreground">Have Questions?</h2>
              <p className="text-muted-foreground text-base max-w-2xl mx-auto leading-relaxed">
                Browse the documentation to understand how DocScan works end to end.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                <Link to="/docs">
                  <Button variant="outline" className="font-semibold transition-smooth hover:border-primary/50 hover:bg-primary/5">
                    View Docs
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Contact support footer */}
          <footer className="mt-10 border-t border-border/40 bg-background/80">
            <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>Need help with billing, subscriptions or technical questions?</span>
              <a href="mailto:renotify34@gmail.com" className="font-medium text-primary hover:underline">
                renotify34@gmail.com
              </a>
            </div>
          </footer>
        </div>
      </main>
    </>
  );
};

export default PricingPage;
