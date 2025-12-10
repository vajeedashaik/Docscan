import React from 'react';
import { Trash2, Star, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { DocumentMetadata } from '@/hooks/useDocumentMetadata';
import { formatDistanceToNow } from 'date-fns';

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
  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Recent Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Recent Documents</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No documents scanned yet. Start by uploading a document!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Recent Documents ({documents.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {documents.slice(0, 5).map((doc) => (
          <div
            key={doc.id}
            className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-sm truncate">
                  {doc.vendor_name || `Document #${doc.document_number || 'N/A'}`}
                </h4>
                {doc.is_starred && (
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-2">
                {doc.expiry_date && (
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                  </Badge>
                )}
                {doc.amount && (
                  <Badge variant="outline" className="text-xs">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {doc.amount} {doc.currency}
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
              </p>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onStar?.(doc.id, !doc.is_starred)}
                className="h-8 w-8 p-0"
              >
                <Star
                  className={`h-4 w-4 ${
                    doc.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                  }`}
                />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete?.(doc.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
