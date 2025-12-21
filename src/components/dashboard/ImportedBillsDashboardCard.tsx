import React, { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Calendar, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import { useEmailImport } from '@/hooks/useEmailImport';
import { format, isPast, isToday } from 'date-fns';

const getDueStatus = (dueDate?: string | null) => {
  if (!dueDate) return null;
  const today = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.floor(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) return { label: 'Expired', variant: 'destructive' as const };
  if (diffDays === 0) return { label: 'Due today', variant: 'warning' as const };
  if (diffDays <= 7)
    return { label: `Due in ${diffDays} days`, variant: 'secondary' as const };
  return {
    label: `Due on ${format(due, 'MMM dd, yyyy')}`,
    variant: 'outline' as const,
  };
};

export const ImportedBillsDashboardCard: React.FC = () => {
  const { importedBills, fetchImportedBills, loading } = useEmailImport();

  useEffect(() => {
    fetchImportedBills();
  }, [fetchImportedBills]);

  const visibleBills = importedBills.slice(0, 5);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mail className="h-4 w-4 text-blue-600" />
          Imported Bills
        </CardTitle>
        <CardDescription>
          {loading
            ? 'Loading imported bills...'
            : importedBills.length === 0
            ? 'No email bills imported yet'
            : `${importedBills.length} bill${
                importedBills.length !== 1 ? 's' : ''
              } imported from your email`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && importedBills.length === 0 && (
          <p className="text-xs text-muted-foreground">Fetching imported bills...</p>
        )}

        {!loading && importedBills.length === 0 && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>
              Once you connect Gmail and import bills, they will appear here with
              their due dates.
            </span>
          </div>
        )}

        {visibleBills.map((bill) => {
          const dueStatus = getDueStatus(bill.extracted_due_date);
          const hasDueDate = !!bill.extracted_due_date;
          const due = hasDueDate ? new Date(bill.extracted_due_date as string) : null;
          const expired = due ? isPast(due) && !isToday(due) : false;

          return (
            <div
              key={bill.id}
              className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border/60 hover:border-primary/40 hover:shadow-sm transition-smooth"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {bill.subject || 'Untitled Bill'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mb-2 items-center">
                  <Badge variant="outline" className="text-xs">
                    {bill.file_type === 'attachment' ? 'Email attachment' : 'Link'}
                  </Badge>
                  {hasDueDate && (
                    <Badge
                      variant={expired ? 'destructive' : 'outline'}
                      className="text-xs font-semibold flex items-center gap-1"
                    >
                      {expired ? (
                        <>
                          <AlertTriangle className="h-3 w-3" />
                          Expired
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          Upcoming
                        </>
                      )}
                    </Badge>
                  )}
                  {dueStatus && (
                    <Badge
                      variant={dueStatus.variant}
                      className="text-xs font-semibold flex items-center gap-1"
                    >
                      <Calendar className="h-3 w-3" />
                      {dueStatus.label}
                    </Badge>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Imported {format(new Date(bill.created_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>

              {bill.extracted_due_date && (
                <div className="flex flex-col items-end gap-1 flex-shrink-0 text-right">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Due date
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {format(new Date(bill.extracted_due_date), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {importedBills.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs justify-center text-muted-foreground hover:text-foreground"
          >
            View all imported bills in Settings
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
