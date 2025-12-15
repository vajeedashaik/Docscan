import React from 'react';
import { format, differenceInDays, isPast, isToday } from 'date-fns';
import { Bell, Calendar, X, AlertTriangle, Clock, CheckCircle, Wrench, CreditCard, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useReminders, Reminder } from '@/hooks/useReminders';
import { Skeleton } from '@/components/ui/skeleton';

const getReminderIcon = (type: string) => {
  switch (type) {
    case 'warranty_expiry':
      return <CheckCircle className="h-4 w-4" />;
    case 'service_due':
      return <Wrench className="h-4 w-4" />;
    case 'payment_due':
      return <CreditCard className="h-4 w-4" />;
    case 'subscription_renewal':
      return <RefreshCw className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getReminderTypeLabel = (type: string) => {
  switch (type) {
    case 'warranty_expiry':
      return 'Warranty';
    case 'service_due':
      return 'Service';
    case 'payment_due':
      return 'Payment';
    case 'subscription_renewal':
      return 'Renewal';
    default:
      return 'Reminder';
  }
};

const getUrgencyBadge = (date: string) => {
  const reminderDate = new Date(date);
  const daysUntil = differenceInDays(reminderDate, new Date());

  if (isPast(reminderDate) && !isToday(reminderDate)) {
    return <Badge variant="destructive" className="text-xs font-bold">Overdue</Badge>;
  }
  if (isToday(reminderDate)) {
    return <Badge variant="destructive" className="text-xs font-bold animate-pulse">Today!</Badge>;
  }
  if (daysUntil <= 3) {
    return <Badge variant="destructive" className="text-xs font-bold">{daysUntil}d left</Badge>;
  }
  if (daysUntil <= 7) {
    return <Badge variant="warning" className="text-xs font-bold">{daysUntil}d left</Badge>;
  }
  if (daysUntil <= 30) {
    return <Badge variant="secondary" className="text-xs font-bold">{daysUntil}d left</Badge>;
  }
  return null;
};

interface RemindersListProps {
  showAll?: boolean;
}

export const RemindersList: React.FC<RemindersListProps> = ({ showAll = false }) => {
  const { reminders, upcomingReminders, isLoading, dismissReminder, deleteReminder } = useReminders();
  
  const displayReminders = showAll ? reminders : upcomingReminders;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (displayReminders.length === 0) {
    return (
      <Card className="border-dashed border-border/40">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="p-3 rounded-lg bg-primary/10 mb-4">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            No upcoming reminders
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
            Scan documents to auto-create reminders for expiry dates
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {displayReminders.map((reminder) => {
        const reminderDate = new Date(reminder.reminder_date);
        const daysUntil = differenceInDays(reminderDate, new Date());
        const isOverdue = isPast(reminderDate) && !isToday(reminderDate);
        
        return (
          <Card 
            key={reminder.id} 
            className={`overflow-hidden transition-all hover:shadow-md ${
              isOverdue 
                ? 'border-destructive/50 bg-destructive/5 hover:border-destructive/80' 
                : daysUntil <= 3 
                  ? 'border-warning/50 bg-warning/5 hover:border-warning/80' 
                  : 'hover:border-primary/30'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-lg flex-shrink-0 ${
                  isOverdue 
                    ? 'bg-destructive/15 text-destructive' 
                    : daysUntil <= 3
                      ? 'bg-warning/15 text-warning'
                      : 'bg-primary/15 text-primary'
                }`}>
                  {getReminderIcon(reminder.reminder_type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-sm text-foreground truncate">
                      {reminder.title}
                    </h4>
                    {getUrgencyBadge(reminder.reminder_date)}
                  </div>
                  
                  {reminder.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                      {reminder.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(reminderDate, 'MMM dd, yyyy')}
                    </span>
                    <Badge variant="outline" className="text-xs py-0 font-semibold">
                      {getReminderTypeLabel(reminder.reminder_type)}
                    </Badge>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 transition-smooth hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => dismissReminder(reminder.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
