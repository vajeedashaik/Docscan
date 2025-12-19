import React, { useEffect, useState } from 'react';
import { FileText, Calendar, Mail, ExternalLink, CheckCircle, Loader, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEmailImport } from '@/hooks/useEmailImport';
import { useOCRBillIntegration } from '@/hooks/useOCRBillIntegration';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export const ImportedBillsList: React.FC = () => {
  const { importedBills, fetchImportedBills } = useEmailImport();
  const { userId } = useAuth();
  const { processBill, processing } = useOCRBillIntegration(userId || '');
  const [processingBillId, setProcessingBillId] = useState<string | null>(null);
  const [billOCRStatus, setBillOCRStatus] = useState<Record<string, boolean>>({});
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);

  useEffect(() => {
    fetchImportedBills();
  }, [fetchImportedBills]);

  const handleProcessBill = async (billId: string) => {
    if (!userId) return;
    setProcessingBillId(billId);
    try {
      // Process bill via backend Edge Function (no access token needed)
      await processBill(billId, '');
      setBillOCRStatus((prev) => ({ ...prev, [billId]: true }));
    } finally {
      setProcessingBillId(null);
    }
  };

  const getDueStatus = (dueDate?: string | null) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Expired', variant: 'destructive' as const };
    if (diffDays === 0) return { label: 'Due today', variant: 'warning' as const };
    if (diffDays <= 7) return { label: `Due in ${diffDays} days`, variant: 'secondary' as const };
    return { label: `Due on ${format(due, 'MMM dd, yyyy')}`, variant: 'outline' as const };
  };

  if (importedBills.length === 0) {
    return (
      <Card className="border-border/50 shadow-md">
        <CardContent className="p-6 text-center space-y-3">
          <div className="h-12 w-12 rounded-lg bg-muted/50 flex items-center justify-center mx-auto">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">No imported bills yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Bills imported from your email will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          Imported Bills
        </CardTitle>
        <CardDescription>
          {importedBills.length} bill{importedBills.length !== 1 ? 's' : ''} imported from your email
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {importedBills.map((bill) => {
            const dueStatus = getDueStatus(bill.extracted_due_date);
            const isExpanded = expandedBillId === bill.id;

            return (
            <div
              key={bill.id}
              className="p-4 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => setExpandedBillId(isExpanded ? null : bill.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-foreground truncate">
                        {bill.subject || 'Untitled Bill'}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        From: {bill.from_email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3 items-center">
                    <Badge variant="outline" className="text-xs">
                      {bill.file_type === 'attachment' ? 'Attachment' : 'Link'}
                    </Badge>
                    {dueStatus && (
                      <Badge variant={dueStatus.variant} className="text-xs flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {dueStatus.label}
                      </Badge>
                    )}
                    {billOCRStatus[bill.id] && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3" />
                        OCR Processed
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    Received: {format(new Date(bill.received_at), 'MMM dd, yyyy HH:mm')}
                  </p>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border/30 space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2 text-foreground">
                        <Info className="h-3 w-3" />
                        <span className="font-semibold text-xs">Bill details</span>
                      </div>
                      <p>
                        <span className="font-medium">From:</span> {bill.from_email}
                      </p>
                      {bill.extracted_due_date && (
                        <p>
                          <span className="font-medium">Extracted due date:</span>{' '}
                          {format(new Date(bill.extracted_due_date), 'MMM dd, yyyy')}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Gmail message ID:</span> {bill.gmail_message_id}
                      </p>
                      <p>
                        <span className="font-medium">Imported at:</span>{' '}
                        {format(new Date(bill.created_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  )}
                </div>

                {bill.file_url && (
                  <div className="flex gap-2 flex-shrink-0">
                    {!billOCRStatus[bill.id] && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleProcessBill(bill.id)}
                        disabled={processing || processingBillId === bill.id}
                      >
                        {processingBillId === bill.id ? (
                          <>
                            <Loader className="h-4 w-4 mr-1 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Process'
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="flex-shrink-0"
                    >
                      <a href={bill.file_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );})}
        </div>
      </CardContent>
    </Card>
  );
};
