import React, { useState } from 'react';
import { Trash2, Star, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { DocumentMetadata } from '@/hooks/useDocumentMetadata';
import { formatDistanceToNow, isPast, isToday } from 'date-fns';

interface DocumentListProps {
  documents: DocumentMetadata[];
  isLoading: boolean;
  onStar?: (id: string, starred: boolean) => void;
  onDelete?: (id: string) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  isLoading,
  onStar,
  onDelete,
}) => {
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Recent Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Recent Documents</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <p className="text-lg text-muted-foreground font-medium">No documents scanned yet</p>
          <p className="text-sm text-muted-foreground mt-1">Start by uploading a document!</p>
        </CardContent>
      </Card>
    );
  }

  const visibleDocuments = showAll ? documents : documents.slice(0, 5);

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Recent Documents ({documents.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleDocuments.map((doc) => (
          <div
            key={doc.id}
            className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border hover:shadow-md hover:border-primary/30 transition-smooth group"
          >
            <div className="flex-1 min-w-0">
              {(() => {
                const topicName = doc.vendor_name || doc.notes || `Document #${doc.document_number || 'N/A'}`;
                const categoryLabel = (doc.tags && doc.tags[0]) || doc.notes || 'Uncategorized';
                const hasExpiry = !!doc.expiry_date;
                const expiryDate = hasExpiry ? new Date(doc.expiry_date as string) : null;
                const expired = expiryDate ? (isPast(expiryDate) && !isToday(expiryDate)) : false;

                return (
                  <>
                    <div className="flex items-center gap-2 mb-2.5">
                      <h4 className="font-bold text-base text-foreground truncate group-hover:text-primary transition-colors">
                        {topicName}
                      </h4>
                      {doc.is_starred && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0 animate-pulse" />
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="outline" className="text-xs font-semibold">
                        {categoryLabel}
                      </Badge>
                      {hasExpiry && (
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
                              Active
                            </>
                          )}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {hasExpiry && (
                        <Badge variant="outline" className="text-xs font-semibold">
                          <Calendar className="h-3 w-3 mr-1.5" />
                          Expires: {expiryDate?.toLocaleDateString()}
                        </Badge>
                      )}
                      {doc.renewal_date && doc.renewal_date !== doc.expiry_date && (
                        <Badge variant="outline" className="text-xs font-semibold">
                          <Calendar className="h-3 w-3 mr-1.5" />
                          Renewal: {new Date(doc.renewal_date).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                    </p>
                  </>
                );
              })()}
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => onStar?.(doc.id, !doc.is_starred)}
                title={doc.is_starred ? 'Unstar document' : 'Star document'}
              >
                <Star
                  className={`h-4.5 w-4.5 ${
                    doc.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground hover:text-foreground'
                  }`}
                />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => onDelete?.(doc.id)}
                title="Delete document"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </Button>
            </div>
          </div>
        ))}

        {documents.length > 5 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={() => setShowAll((prev) => !prev)}
          >
            {showAll ? 'Show less' : `Show all ${documents.length} documents`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
