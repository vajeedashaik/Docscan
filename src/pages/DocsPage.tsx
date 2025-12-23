import React from 'react';
import { Helmet } from 'react-helmet';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BookOpen,
  ScanLine,
  Bell,
  Mail,
  Database,
  Shield,
  Rocket,
  Server,
} from 'lucide-react';

const DocsPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Documentation | DocScan AI</title>
        <meta 
          name="description" 
          content="In-depth documentation for DocScan AI / ReNotify including OCR pipeline, reminders, email bill import, and deployment."
        />
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 relative overflow-hidden">
        {/* Soft background accents */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute -top-10 -left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 py-10 relative z-10">
          {/* Hero */}
          <section className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4 max-w-2xl">
              <Badge variant="outline" className="gap-2 px-3 py-1.5 rounded-full bg-background/70 backdrop-blur border-primary/30 text-xs font-medium">
                <BookOpen className="h-3.5 w-3.5" />
                Product Documentation
              </Badge>
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3">
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    DocScan / ReNotify Docs
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  Learn how DocScan AI turns bills, warranties and email statements into smart reminders.
                  This guide covers the OCR pipeline, dashboard, Auto Email Bill Import, deployment and security.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/70 border border-border/60">
                  <ScanLine className="h-3 w-3" />
                  OCR & Entity Extraction
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/70 border border-border/60">
                  <Bell className="h-3 w-3" />
                  Smart Reminders
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/70 border border-border/60">
                  <Mail className="h-3 w-3" />
                  Auto Email Bill Import
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/70 border border-border/60">
                  <Database className="h-3 w-3" />
                  Supabase + Clerk
                </span>
              </div>
            </div>

            <Card className="w-full max-w-md border-primary/20 bg-card/80 backdrop-blur self-stretch lg:self-auto">
              <CardHeader>
                <CardTitle className="text-base">Quick Links</CardTitle>
                <CardDescription className="text-xs">
                  Jump to the most commonly used sections.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-xs">
                <a href="#getting-started" className="p-3 rounded-lg border border-border/60 hover:border-primary/60 hover:bg-primary/5 transition-colors">
                  <p className="font-semibold mb-1">Getting Started</p>
                  <p className="text-muted-foreground">Setup & first scan</p>
                </a>
                <a href="#ocr-pipeline" className="p-3 rounded-lg border border-border/60 hover:border-primary/60 hover:bg-primary/5 transition-colors">
                  <p className="font-semibold mb-1">OCR Pipeline</p>
                  <p className="text-muted-foreground">Upload → Dates → Reminders</p>
                </a>
                <a href="#email-import" className="p-3 rounded-lg border border-border/60 hover:border-primary/60 hover:bg-primary/5 transition-colors">
                  <p className="font-semibold mb-1">Email Bill Import</p>
                  <p className="text-muted-foreground">Gmail integration</p>
                </a>
                <a href="#deployment" className="p-3 rounded-lg border border-border/60 hover:border-primary/60 hover:bg-primary/5 transition-colors">
                  <p className="font-semibold mb-1">Deployment</p>
                  <p className="text-muted-foreground">Edge Functions & keys</p>
                </a>
              </CardContent>
            </Card>
          </section>

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_minmax(0,1.1fr)] gap-6 items-start">
            {/* Left: long-form docs */}
            <ScrollArea className="h-[calc(100vh-12rem)] pr-2">
              <div className="space-y-8 pb-10">
                {/* Getting Started */}
                <section id="getting-started">
                  <Card className="border-border/70 bg-card/80 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-primary" />
                        Getting Started
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Overview of the product, core concepts, and how to run DocScan locally.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                      <p>
                        DocScan (also branded as ReNotify in some screens) is a React + TypeScript web app that lets you
                        scan bills, warranties and service receipts using Google Cloud Vision OCR, extract key dates,
                        and automatically create reminders stored in Supabase.
                      </p>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Tech stack</h3>
                        <ul className="list-disc list-inside space-y-1">
                          <li>React 18 + TypeScript, Vite, Tailwind CSS, shadcn/ui components</li>
                          <li>Clerk for authentication and pricing table</li>
                          <li>Supabase for database, storage and Edge Functions</li>
                          <li>Google Cloud Vision API for OCR</li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Run locally</h3>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Install dependencies: <code className="px-1 py-0.5 rounded bg-muted text-xs">npm install</code></li>
                          <li>Create a <code className="px-1 py-0.5 rounded bg-muted text-xs">.env.local</code> with Supabase + Clerk + Google keys.</li>
                          <li>Start the dev server: <code className="px-1 py-0.5 rounded bg-muted text-xs">npm run dev</code></li>
                          <li>Open the app at <span className="font-mono">http://localhost:5173</span>.</li>
                        </ol>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                {/* OCR Pipeline */}
                <section id="ocr-pipeline">
                  <Card className="border-border/70 bg-card/80 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ScanLine className="h-5 w-5 text-primary" />
                        OCR & Reminder Pipeline
                      </CardTitle>
                      <CardDescription className="text-sm">
                        How a file moves from upload to stored metadata and reminders.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                      <p>
                        The core OCR flow is implemented around the <code className="px-1 py-0.5 rounded bg-muted text-xs">useOCR</code> hook
                        and the <code className="px-1 py-0.5 rounded bg-muted text-xs">OCRModule</code> component. A typical flow is:
                      </p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>User uploads an image in the dashboard or OCR page.</li>
                        <li>Image is optionally preprocessed (contrast, size, quality).</li>
                        <li>Image bytes are sent to Google Cloud Vision (TEXT_DETECTION + DOCUMENT_TEXT_DETECTION).</li>
                        <li>Raw text is passed through the entity extraction pipeline to detect dates, vendor and amounts.</li>
                        <li>Results are persisted into <code className="px-1 py-0.5 rounded bg-muted text-xs">ocr_jobs</code>, <code className="px-1 py-0.5 rounded bg-muted text-xs">ocr_results</code> and <code className="px-1 py-0.5 rounded bg-muted text-xs">document_metadata</code>.</li>
                        <li>Reminder suggestions are created and stored in the <code className="px-1 py-0.5 rounded bg-muted text-xs">reminders</code> table.</li>
                        <li>The dashboard and reminders list update in real-time via Supabase channel subscriptions.</li>
                      </ol>

                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Date extraction strategy</h3>
                        <p>
                          Dates are extracted with a priority-based strategy: warranty expiry and service dates get
                          highest priority, followed by payment due, subscription renewal and purchase dates. The
                          system looks for keywords around each date and assigns a confidence score.
                        </p>
                      </div>

                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Reminders</h3>
                        <p>
                          Reminders are managed via the <code className="px-1 py-0.5 rounded bg-muted text-xs">useReminders</code> hook. It fetches all non-dismissed
                          reminders for the logged-in user, computes upcoming reminders (within the next 30 days) and
                          wires them into the dashboard and notification system.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                {/* Dashboard & Stats */}
                <section id="dashboard">
                  <Card className="border-border/70 bg-card/80 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Database className="h-5 w-5 text-primary" />
                        Dashboard & Statistics
                      </CardTitle>
                      <CardDescription className="text-sm">
                        How the dashboard aggregates scans, documents and reminders.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                      <p>
                        The main dashboard page shows a high-level view of your activity: total documents scanned,
                        upcoming reminders, and a list of your most recent documents.
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>
                          <strong>Documents scanned</strong> is computed in <code className="px-1 py-0.5 rounded bg-muted text-xs">useOCRStats</code> as the sum of
                          manual <code className="px-1 py-0.5 rounded bg-muted text-xs">document_metadata</code> rows and imported bills in <code className="px-1 py-0.5 rounded bg-muted text-xs">imported_bills</code>.
                        </li>
                        <li>
                          <strong>Recent Documents</strong> uses <code className="px-1 py-0.5 rounded bg-muted text-xs">DocumentList</code> to show the 5 most recent
                          documents with a toggle to expand and view all.
                        </li>
                        <li>
                          <strong>Upcoming Reminders</strong> are derived from the shared <code className="px-1 py-0.5 rounded bg-muted text-xs">reminders</code> table and
                          include both manual scans and Auto Email Bill reminders.
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </section>

                {/* Email import */}
                <section id="email-import">
                  <Card className="border-border/70 bg-card/80 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        Auto Email Bill Import
                      </CardTitle>
                      <CardDescription className="text-sm">
                        How Gmail integration works, from OAuth to OCR and reminder creation.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                      <p>
                        The Auto Email Bill Import feature connects to the user&apos;s Gmail (read-only) using OAuth,
                        searches for bill-like emails and attachments, and automatically feeds them into the OCR
                        pipeline to create payment reminders.
                      </p>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Key components</h3>
                        <ul className="list-disc list-inside space-y-1">
                          <li>
                            <strong>Settings UI</strong>: <code className="px-1 py-0.5 rounded bg-muted text-xs">EmailImportSettings</code> and
                            <code className="px-1 py-0.5 rounded bg-muted text-xs">ImportedBillsList</code> components let users connect Gmail,
                            trigger syncs, and view imported bills.
                          </li>
                          <li>
                            <strong>Storage</strong>: The <code className="px-1 py-0.5 rounded bg-muted text-xs">email_imports</code> table stores per-user
                            OAuth configuration. The <code className="px-1 py-0.5 rounded bg-muted text-xs">imported_bills</code> table tracks each imported
                            message and its due date.
                          </li>
                          <li>
                            <strong>Processing</strong>: Supabase Edge Functions like
                            <code className="px-1 py-0.5 rounded bg-muted text-xs">process-bill-ocr</code>, together with
                            <code className="px-1 py-0.5 rounded bg-muted text-xs">billOCRIntegration.ts</code> and
                            <code className="px-1 py-0.5 rounded bg-muted text-xs">useOCRBillIntegration</code>, download attachments securely,
                            run them through Google Vision and create reminders.
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Security & privacy</h3>
                        <p>
                          Gmail access is strictly read-only and limited to bill-related content. OAuth tokens are
                          encrypted and stored server-side; users can disconnect at any time from the settings page,
                          which revokes stored tokens.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                {/* Deployment & Edge Functions */}
                <section id="deployment">
                  <Card className="border-border/70 bg-card/80 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Server className="h-5 w-5 text-primary" />
                        Deployment & Edge Functions
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Overview of Supabase Edge Functions and environment variables required in production.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                      <p>
                        The project uses several Supabase Edge Functions to securely handle OAuth flows, periodic email
                        sync and backend OCR operations. Refer to the deployment guides in the repository for
                        step-by-step commands.
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>auth-gmail-token</strong> – exchanges OAuth codes for Gmail tokens and encrypts them.</li>
                        <li><strong>sync-email-bills</strong> – scheduled function to fetch new bill emails periodically.</li>
                        <li><strong>process-bill-ocr</strong> / <strong>ocr-process-bill</strong> – download bill documents from storage or Gmail and run OCR.</li>
                      </ul>
                      <p>
                        Ensure environment variables like Google client ID/secret, Google Vision API key, Supabase URL
                        and service role key are configured correctly in Supabase secrets before deploying.
                      </p>
                    </CardContent>
                  </Card>
                </section>

                {/* Security */}
                <section id="security">
                  <Card className="border-border/70 bg-card/80 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Security & Data Protection
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Key security concepts from the architecture and quick-start guides.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Row Level Security (RLS) is enabled on core tables like <code className="px-1 py-0.5 rounded bg-muted text-xs">reminders</code>, <code className="px-1 py-0.5 rounded bg-muted text-xs">document_metadata</code> and <code className="px-1 py-0.5 rounded bg-muted text-xs">user_statistics</code>.</li>
                        <li>All queries are filtered by the current user&apos;s id from Clerk to ensure isolation.</li>
                        <li>OAuth tokens for Gmail are encrypted with a server-side key; raw tokens are never exposed in the browser.</li>
                        <li>Inputs such as file types and dates are validated and sanitized before persistence.</li>
                      </ul>
                    </CardContent>
                  </Card>
                </section>

                {/* FAQ */}
                <section id="faq">
                  <Card className="border-border/70 bg-card/80 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-lg">FAQ</CardTitle>
                      <CardDescription className="text-sm">
                        Common questions about accuracy, reminders and email imports.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full text-sm">
                        <AccordionItem value="accuracy">
                          <AccordionTrigger>How accurate is the OCR?</AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            With good quality images (sharp, well-lit documents), Google Vision OCR typically exceeds
                            90–95% accuracy. The app also tracks confidence scores and prioritizes critical fields such
                            as dates when generating reminders.
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="reminders">
                          <AccordionTrigger>Where do reminders appear?</AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            Reminders are visible on the main dashboard, in the Reminders tab and in the count badge
                            on the dashboard header. They are all backed by a single <code className="px-1 py-0.5 rounded bg-muted text-xs">reminders</code> table,
                            so reminders from both manual scans and Auto Email Bill imports are unified.
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="email-import">
                          <AccordionTrigger>Can I disable Auto Email Bill Import?</AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            Yes. In the Settings &gt; AutoImport Bills page you can disconnect Gmail at any time. This
                            revokes access and prevents further email scans. Existing reminders and imported bills
                            remain in your account unless you delete them.
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                </section>

                {/* Support */}
                <section id="support">
                  <Card className="border-border/70 bg-card/80 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-lg">Support & Contact</CardTitle>
                      <CardDescription className="text-sm">
                        How to get help if something is not working as expected.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                      <p>
                        For implementation questions, deployment issues or bugs you cannot resolve using this
                        documentation, you can reach out to the maintainers directly.
                      </p>
                      <p>
                        <span className="font-semibold text-foreground">Support email: </span>
                        <a href="mailto:renotify34@gmail.com" className="text-primary hover:underline">
                          renotify34@gmail.com
                        </a>
                      </p>
                    </CardContent>
                  </Card>
                </section>
              </div>
            </ScrollArea>

            {/* Right: compact summary panel */}
            <div className="space-y-4">
              <Card className="border-border/70 bg-card/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-base">At a Glance</CardTitle>
                  <CardDescription className="text-xs">
                    High-level summary of the system.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <ScanLine className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-0.5">End-to-end OCR</p>
                      <p>Upload documents, run OCR, extract dates and store everything in Supabase.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bell className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-0.5">Smart reminders</p>
                      <p>Priority-based reminder creation and upcoming reminder views on the dashboard.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-0.5">Email ingestion</p>
                      <p>Optional Gmail integration that imports bills and creates payment reminders automatically.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default DocsPage;
