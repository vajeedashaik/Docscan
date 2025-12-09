import React from 'react';
import { Helmet } from 'react-helmet';
import { useUser, SignedOut, SignedIn } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { Zap, FileText, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OCRModule } from '@/components/ocr/OCRModule';
import { Navbar } from '@/components/layout/Navbar';

const OCRPage: React.FC = () => {
  const { user, isLoaded } = useUser();

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
        <title>OCR Scanner | DocScan AI</title>
        <meta 
          name="description" 
          content="Scan and extract text from documents with AI-powered OCR technology." 
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
            <div className="mb-12 space-y-4">
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Document Scanner
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground">
                  Upload and scan your documents with AI-powered text extraction
                </p>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <Card className="border-border/50 bg-card/50 backdrop-blur">
                  <CardContent className="pt-6 flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Fast Processing</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Extract text instantly from any document
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur">
                  <CardContent className="pt-6 flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-accent/30 to-primary/30 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Multiple Formats</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Support for PDF, images, and more
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur">
                  <CardContent className="pt-6 flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Accurate Results</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Advanced AI ensures high accuracy
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* OCR Module */}
            <div className="mb-12">
              <OCRModule />
            </div>
          </div>
        </main>
      </SignedIn>
    </>
  );
};

export default OCRPage;
