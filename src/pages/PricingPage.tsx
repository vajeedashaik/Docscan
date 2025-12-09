import React from 'react';
import { Helmet } from 'react-helmet';
import { PricingTable } from '@clerk/clerk-react';
import { Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';

const PricingPage: React.FC = () => {
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

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Free Plan */}
            <Card className="border-border/50 relative overflow-hidden group hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <CardDescription>Get started with basic features</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg">
                  Get Started
                </Button>
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">5 scans/month</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Basic text extraction</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Community support</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pro Plan - Featured */}
            <Card className="border-primary/50 relative overflow-hidden group hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 md:scale-105">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"></div>
              <CardHeader className="relative">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <CardTitle>Pro</CardTitle>
                    <CardDescription>Perfect for most users</CardDescription>
                  </div>
                  <span className="text-xs font-semibold text-primary bg-primary/20 px-3 py-1 rounded-full">
                    Popular
                  </span>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-bold">$9.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 relative">
                <Button className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg">
                  Start Free Trial
                </Button>
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Unlimited scans</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Advanced text extraction</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Smart reminders</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Cloud storage</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Priority support</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="border-border/50 relative overflow-hidden group hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <CardDescription>Advanced features for teams</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">Custom</span>
                  <span className="text-muted-foreground"> pricing</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full">
                  Contact Sales
                </Button>
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Everything in Pro</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Team collaboration</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Custom integrations</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Dedicated support</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">SLA guarantee</span>
                  </div>
                </div>
              </CardContent>
            </Card>
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
              <PricingTable />
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
