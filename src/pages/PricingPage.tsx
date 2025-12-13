import React from 'react';
import { Helmet } from 'react-helmet';
import { PricingTable } from '@clerk/clerk-react';
import { dark, light } from '@clerk/themes';
import { Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';

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

      <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Simple, Transparent Pricing
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the perfect plan for your needs. All plans include our core AI-powered OCR features.
            </p>
          </div>



          {/* Clerk Pricing Table */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
              <p className="text-muted-foreground">
                Subscribe now and start your free trial
              </p>
            </div>
            <div className="bg-card/50 backdrop-blur border border-border/50 rounded-lg p-8">
              <PricingTable appearance={{ baseTheme: theme === 'dark' ? dark : light }} />
            </div>
          </div>

          {/* Features Comparison */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">What's Included</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-card/50 backdrop-blur border border-border/50">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{feature.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="text-center py-12 border-t border-border/40">
            <h2 className="text-2xl font-bold mb-4">Have Questions?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Check out our documentation or contact our support team. We're here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline">View Docs</Button>
              <Button className="bg-gradient-to-r from-primary to-accent">Contact Support</Button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default PricingPage;
