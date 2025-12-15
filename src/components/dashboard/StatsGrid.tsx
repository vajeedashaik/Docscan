import React from 'react';
import { FileText, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserStatistics } from '@/hooks/useUserStatistics';

interface StatsGridProps {
  statistics: UserStatistics | null;
  isLoading: boolean;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ statistics, isLoading }) => {
  const stats = [
    {
      label: 'Documents Scanned',
      value: statistics?.total_documents_scanned || 0,
      icon: FileText,
      color: 'text-blue-500',
      bgColor: 'bg-primary/15',
    },
    {
      label: 'Successful Scans',
      value: statistics?.successful_scans || 0,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/15',
    },
    {
      label: 'Failed Scans',
      value: statistics?.failed_scans || 0,
      icon: AlertCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/15',
    },
    {
      label: 'Reminders Created',
      value: statistics?.total_reminders_created || 0,
      icon: BarChart3,
      color: 'text-accent',
      bgColor: 'bg-accent/15',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card key={idx} className="border-border hover:shadow-lg transition-smooth">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs sm:text-sm font-semibold text-muted-foreground flex items-center gap-3">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mb-2" />
              ) : (
                <div className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</div>
              )}
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-1">{stat.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
