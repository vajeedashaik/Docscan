import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw, 
  FileText,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

interface OCRJob {
  id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  status: string;
  processing_time_ms: number | null;
  error_message: string | null;
  created_at: string;
}

interface OCRResult {
  id: string;
  job_id: string;
  document_type: string | null;
  confidence: number | null;
  raw_text: string | null;
  extracted_data: unknown;
  created_at: string;
}

export const OCRDashboard = () => {
  const [jobs, setJobs] = useState<OCRJob[]>([]);
  const [results, setResults] = useState<OCRResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsRes, resultsRes] = await Promise.all([
        supabase.from('ocr_jobs').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('ocr_results').select('*').order('created_at', { ascending: false }).limit(50),
      ]);

      if (jobsRes.data) setJobs(jobsRes.data);
      if (resultsRes.data) setResults(resultsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const failedJobs = jobs.filter(j => j.status === 'failed').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-warning animate-pulse" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const selectedResult = selectedJobId ? results.find(r => r.job_id === selectedJobId) : null;
  const selectedJob = selectedJobId ? jobs.find(j => j.id === selectedJobId) : null;

  if (selectedResult && selectedJob) {
    return (
      <div className="space-y-5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedJobId(null)}
          className="mb-2 font-semibold transition-smooth hover:bg-secondary/30"
        >
          ← Back to history
        </Button>

        <Card className="border-border shadow-md">
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="font-bold text-lg text-foreground truncate">{selectedJob.file_name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(selectedJob.created_at), 'MMM d, yyyy • HH:mm')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-muted-foreground text-xs font-semibold">Type</span>
                <p className="font-bold text-foreground mt-1">{selectedResult.document_type || 'Unknown'}</p>
              </div>
              <div className="p-3 rounded-lg bg-success/5 border border-success/20">
                <span className="text-muted-foreground text-xs font-semibold">Confidence</span>
                <p className="font-bold text-success mt-1">{((selectedResult.confidence || 0) * 100).toFixed(0)}%</p>
              </div>
              <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                <span className="text-muted-foreground text-xs font-semibold">Size</span>
                <p className="font-bold text-accent mt-1">{formatFileSize(selectedJob.file_size)}</p>
              </div>
              <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                <span className="text-muted-foreground text-xs font-semibold">Time</span>
                <p className="font-bold text-warning mt-1">{selectedJob.processing_time_ms ? `${(selectedJob.processing_time_ms / 1000).toFixed(1)}s` : '-'}</p>
              </div>
            </div>

            {selectedResult.raw_text && (
              <div>
                <p className="text-sm font-semibold text-foreground mb-3">Extracted Text</p>
                <ScrollArea className="h-[200px]">
                  <div className="bg-muted/30 rounded-lg p-4 text-xs font-mono whitespace-pre-wrap border border-border/50">
                    {selectedResult.raw_text}
                  </div>
                </ScrollArea>
              </div>
            )}

            {selectedResult.extracted_data && (
              <div>
                <p className="text-sm font-semibold text-foreground mb-3">Extracted Data</p>
                <ScrollArea className="h-[200px]">
                  <pre className="bg-muted/30 rounded-lg p-4 text-xs overflow-auto border border-border/50">
                    {JSON.stringify(selectedResult.extracted_data, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 pb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Scan History</h2>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-semibold text-success">{completedJobs}</span> successful • <span className="font-semibold text-destructive">{failedJobs}</span> failed
          </p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="ghost" size="icon" className="h-10 w-10 transition-smooth hover:bg-primary/10">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Job List */}
      {jobs.length > 0 ? (
        <div className="space-y-3">
          {jobs.map((job) => {
            const result = results.find(r => r.job_id === job.id);
            return (
              <Card 
                key={job.id} 
                className="border-border cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-300 group"
                onClick={() => result && setSelectedJobId(job.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center flex-shrink-0 group-hover:from-primary/25 group-hover:to-accent/25 transition-colors border border-primary/20">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {job.file_name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{format(new Date(job.created_at), 'MMM d, HH:mm')}</span>
                        {result?.document_type && (
                          <>
                            <span>•</span>
                            <span className="capitalize font-medium">{result.document_type}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getStatusIcon(job.status)}
                      {result && <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />}
                    </div>
                  </div>

                  {job.status === 'failed' && job.error_message && (
                    <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-xs text-destructive border border-destructive/20 animate-slide-down">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{job.error_message}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed border-border/40">
          <CardContent className="p-12 text-center">
            <div className="p-4 rounded-lg bg-primary/10 inline-block mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <p className="text-base font-semibold text-foreground">
              No scans yet
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Upload a document to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
