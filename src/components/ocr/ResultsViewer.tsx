import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Store, 
  Package, 
  Calendar, 
  Bell,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { OCRResult } from '@/types/ocr';
import { toast } from '@/hooks/use-toast';

interface ResultsViewerProps {
  result: OCRResult;
  onExportJSON?: () => void;
}

export const ResultsViewer: React.FC<ResultsViewerProps> = ({ result, onExportJSON }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopied(true);
      toast({ title: 'Copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const confidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'text-success';
    if (conf >= 0.5) return 'text-warning';
    return 'text-destructive';
  };

  const fields = result.extractedFields;

  return (
    <Card className="border-border overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center justify-between text-left hover:bg-accent/30 transition-colors duration-200"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0 border border-primary/20">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="secondary" className="text-xs capitalize font-semibold">
                {result.documentType?.replace(/_/g, ' ') || 'Document'}
              </Badge>
              <span className={cn('text-xs font-bold', confidenceColor(result.confidence))}>
                {Math.round(result.confidence * 100)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {result.metadata.fileName}
            </p>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="h-5 w-5 flex-shrink-0 text-primary" /> : <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground" />}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <CardContent className="p-6 pt-0 space-y-6 border-t border-border/30">
          {/* Vendor */}
          {fields?.vendor && Object.values(fields.vendor).some(v => v) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wide">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Store className="h-4 w-4 text-primary" />
                </div>
                Vendor
              </div>
              <div className="space-y-2 ml-8 text-sm">
                {fields.vendor.name && (
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground font-medium">Name</span>
                    <span className="font-semibold text-right truncate max-w-[60%]">{fields.vendor.name}</span>
                  </div>
                )}
                {fields.vendor.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Phone</span>
                    <span className="font-mono text-xs">{fields.vendor.phone}</span>
                  </div>
                )}
                {fields.vendor.gstin && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">GSTIN</span>
                    <span className="font-mono text-xs">{fields.vendor.gstin}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Product */}
          {fields?.product && Object.values(fields.product).some(v => v) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wide">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Package className="h-4 w-4 text-accent" />
                </div>
                Product
              </div>
              <div className="space-y-2 ml-8 text-sm">
                {fields.product.name && (
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground font-medium">Name</span>
                    <span className="font-semibold text-right truncate max-w-[60%]">{fields.product.name}</span>
                  </div>
                )}
                {fields.product.model && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Model</span>
                    <span className="font-mono text-xs">{fields.product.model}</span>
                  </div>
                )}
                {fields.product.serialNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Serial</span>
                    <span className="font-mono text-xs">{fields.product.serialNumber}</span>
                  </div>
                )}
                {fields.product.totalPrice && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Price</span>
                    <span className="font-semibold">
                      {fields.amount?.currency || '₹'}{fields.product.totalPrice}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dates */}
          {fields?.dates && Object.values(fields.dates).some(v => v) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wide">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Calendar className="h-4 w-4 text-warning" />
                </div>
                Important Dates
              </div>
              <div className="space-y-2 ml-8 text-sm">
                {fields.dates.purchaseDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Purchase</span>
                    <span className="font-semibold">{fields.dates.purchaseDate}</span>
                  </div>
                )}
                {fields.dates.warrantyExpiry && (
                  <div className="flex justify-between p-2.5 rounded-lg bg-warning/10 border border-warning/20">
                    <span className="text-muted-foreground font-medium">Warranty</span>
                    <span className="font-bold text-warning">{fields.dates.warrantyExpiry}</span>
                  </div>
                )}
                {fields.dates.nextServiceDue && (
                  <div className="flex justify-between p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="text-muted-foreground font-medium">Service Due</span>
                    <span className="font-bold text-primary">{fields.dates.nextServiceDue}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reminders */}
          {result.reminderData?.suggestedReminders && result.reminderData.suggestedReminders.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wide">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Bell className="h-4 w-4 text-destructive" />
                </div>
                Reminders
              </div>
              <div className="space-y-2 ml-8">
                {result.reminderData.suggestedReminders.map((reminder, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm hover:bg-primary/15 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground capitalize truncate">
                        {reminder.type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{reminder.date}</p>
                    </div>
                    <Badge 
                      variant={reminder.priority === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs flex-shrink-0 ml-2 font-bold"
                    >
                      {reminder.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Text Preview */}
          {result.rawText && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-foreground uppercase tracking-wide">Raw Text</p>
              <ScrollArea className="h-[150px]">
                <div className="bg-muted/40 rounded-lg p-4 text-xs font-mono whitespace-pre-wrap border border-border/50">
                  {result.rawText}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-3 border-t border-border/30">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 font-semibold transition-smooth hover:bg-primary/10"
              onClick={copyToClipboard}
            >
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? 'Copied' : 'Copy JSON'}
            </Button>
            {onExportJSON && (
              <Button
                variant="outline"
                size="sm"
                className="font-semibold transition-smooth hover:bg-accent/10"
                onClick={onExportJSON}
              >
                Export
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
