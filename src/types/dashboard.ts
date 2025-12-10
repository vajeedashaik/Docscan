// TypeScript Type Definitions for Dashboard Tables
// Add these to your src/integrations/supabase/types.ts or create new file
// File: src/types/dashboard.ts

export interface Reminder {
  id: string; // UUID
  user_id: string;
  ocr_result_id: string | null; // UUID
  title: string;
  description: string | null;
  reminder_type: 'warranty_expiry' | 'service_due' | 'subscription_renewal' | 'payment_due' | 'custom';
  reminder_date: string; // DATE
  notify_before_days: number;
  is_notified: boolean;
  is_dismissed: boolean;
  created_at: string; // TIMESTAMP
  updated_at: string; // TIMESTAMP
}

export interface ReminderInsert {
  user_id: string;
  ocr_result_id?: string | null;
  title: string;
  description?: string | null;
  reminder_type: 'warranty_expiry' | 'service_due' | 'subscription_renewal' | 'payment_due' | 'custom';
  reminder_date: string;
  notify_before_days?: number;
  is_notified?: boolean;
  is_dismissed?: boolean;
}

export interface ReminderUpdate {
  user_id?: string;
  ocr_result_id?: string | null;
  title?: string;
  description?: string | null;
  reminder_type?: 'warranty_expiry' | 'service_due' | 'subscription_renewal' | 'payment_due' | 'custom';
  reminder_date?: string;
  notify_before_days?: number;
  is_notified?: boolean;
  is_dismissed?: boolean;
}

export interface UserProfile {
  id: string; // UUID
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  theme_preference: string; // 'light' | 'dark'
  notifications_enabled: boolean;
  email_reminders_enabled: boolean;
  language: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfileInsert {
  user_id: string;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  theme_preference?: string;
  notifications_enabled?: boolean;
  email_reminders_enabled?: boolean;
  language?: string;
  timezone?: string;
}

export interface UserProfileUpdate {
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  theme_preference?: string;
  notifications_enabled?: boolean;
  email_reminders_enabled?: boolean;
  language?: string;
  timezone?: string;
}

export interface DocumentCategory {
  id: string; // UUID
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  display_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentCategoryInsert {
  user_id: string;
  name: string;
  description?: string | null;
  color?: string;
  icon?: string;
  display_order?: number | null;
}

export interface DocumentTag {
  id: string; // UUID
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentTagInsert {
  user_id: string;
  name: string;
  color?: string;
}

export interface DocumentMetadata {
  id: string; // UUID
  ocr_result_id: string; // UUID
  user_id: string;
  category_id: string | null; // UUID
  tags: string[] | null;
  vendor_name: string | null;
  vendor_phone: string | null;
  vendor_email: string | null;
  document_number: string | null;
  document_date: string | null; // DATE
  expiry_date: string | null; // DATE
  renewal_date: string | null; // DATE
  amount: number | null; // NUMERIC
  currency: string;
  is_starred: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentMetadataInsert {
  ocr_result_id: string;
  user_id: string;
  category_id?: string | null;
  tags?: string[] | null;
  vendor_name?: string | null;
  vendor_phone?: string | null;
  vendor_email?: string | null;
  document_number?: string | null;
  document_date?: string | null;
  expiry_date?: string | null;
  renewal_date?: string | null;
  amount?: number | null;
  currency?: string;
  is_starred?: boolean;
  notes?: string | null;
}

export interface DocumentMetadataUpdate {
  category_id?: string | null;
  tags?: string[] | null;
  vendor_name?: string | null;
  vendor_phone?: string | null;
  vendor_email?: string | null;
  document_number?: string | null;
  document_date?: string | null;
  expiry_date?: string | null;
  renewal_date?: string | null;
  amount?: number | null;
  currency?: string;
  is_starred?: boolean;
  notes?: string | null;
}

export interface UserActivityLog {
  id: string; // UUID
  user_id: string;
  activity_type: string;
  action_description: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface UserActivityLogInsert {
  user_id: string;
  activity_type: string;
  action_description?: string | null;
  metadata?: Record<string, any> | null;
}

export interface DocumentExport {
  id: string; // UUID
  user_id: string;
  export_type: string; // 'pdf' | 'csv' | 'json' | 'excel'
  document_ids: string[]; // UUID[]
  file_name: string | null;
  file_size: number | null;
  file_url: string | null;
  status: string; // 'pending' | 'processing' | 'completed' | 'failed'
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface DocumentExportInsert {
  user_id: string;
  export_type: string;
  document_ids: string[];
  file_name?: string | null;
  file_size?: number | null;
  file_url?: string | null;
  status?: string;
  error_message?: string | null;
}

export interface DocumentExportUpdate {
  status?: string;
  error_message?: string | null;
  file_url?: string | null;
  file_size?: number | null;
  completed_at?: string | null;
}

export interface NotificationPreferences {
  id: string; // UUID
  user_id: string;
  warranty_reminders: boolean;
  service_reminders: boolean;
  subscription_reminders: boolean;
  payment_reminders: boolean;
  new_features: boolean;
  tips_and_tricks: boolean;
  weekly_digest: boolean;
  digest_day: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferencesInsert {
  user_id: string;
  warranty_reminders?: boolean;
  service_reminders?: boolean;
  subscription_reminders?: boolean;
  payment_reminders?: boolean;
  new_features?: boolean;
  tips_and_tricks?: boolean;
  weekly_digest?: boolean;
  digest_day?: string;
}

export interface NotificationPreferencesUpdate {
  warranty_reminders?: boolean;
  service_reminders?: boolean;
  subscription_reminders?: boolean;
  payment_reminders?: boolean;
  new_features?: boolean;
  tips_and_tricks?: boolean;
  weekly_digest?: boolean;
  digest_day?: string;
}

export interface UserStatistics {
  id: string; // UUID
  user_id: string;
  total_documents_scanned: number;
  total_storage_used_bytes: number;
  successful_scans: number;
  failed_scans: number;
  total_reminders_created: number;
  total_reminders_completed: number;
  average_confidence_score: number | null;
  most_common_document_type: string | null;
  last_scan_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserStatisticsInsert {
  user_id: string;
  total_documents_scanned?: number;
  total_storage_used_bytes?: number;
  successful_scans?: number;
  failed_scans?: number;
  total_reminders_created?: number;
  total_reminders_completed?: number;
  average_confidence_score?: number | null;
  most_common_document_type?: string | null;
  last_scan_date?: string | null;
}

export interface UserStatisticsUpdate {
  total_documents_scanned?: number;
  total_storage_used_bytes?: number;
  successful_scans?: number;
  failed_scans?: number;
  total_reminders_created?: number;
  total_reminders_completed?: number;
  average_confidence_score?: number | null;
  most_common_document_type?: string | null;
  last_scan_date?: string | null;
}

export interface SubscriptionPlan {
  id: string; // UUID
  plan_name: string;
  plan_slug: string;
  description: string | null;
  price: number | null;
  documents_per_month: number | null;
  max_file_size_mb: number | null;
  api_calls_per_day: number | null;
  priority_support: boolean;
  custom_templates: boolean;
  batch_processing: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlanInsert {
  plan_name: string;
  plan_slug: string;
  description?: string | null;
  price?: number | null;
  documents_per_month?: number | null;
  max_file_size_mb?: number | null;
  api_calls_per_day?: number | null;
  priority_support?: boolean;
  custom_templates?: boolean;
  batch_processing?: boolean;
}

export interface UserSubscription {
  id: string; // UUID
  user_id: string;
  plan_id: string; // UUID
  status: string; // 'active' | 'inactive' | 'cancelled' | 'expired'
  stripe_subscription_id: string | null;
  started_at: string;
  ended_at: string | null;
  renewal_date: string | null;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSubscriptionInsert {
  user_id: string;
  plan_id: string;
  status?: string;
  stripe_subscription_id?: string | null;
  started_at?: string;
  ended_at?: string | null;
  renewal_date?: string | null;
  auto_renew?: boolean;
}

export interface UserSubscriptionUpdate {
  plan_id?: string;
  status?: string;
  stripe_subscription_id?: string | null;
  ended_at?: string | null;
  renewal_date?: string | null;
  auto_renew?: boolean;
}

export interface MonthlyUsage {
  id: string; // UUID
  user_id: string;
  year: number;
  month: number;
  documents_scanned: number;
  storage_used_bytes: number;
  api_calls_made: number;
  successful_extractions: number;
  failed_extractions: number;
  average_confidence: number | null;
  created_at: string;
  updated_at: string;
}

export interface MonthlyUsageInsert {
  user_id: string;
  year: number;
  month: number;
  documents_scanned?: number;
  storage_used_bytes?: number;
  api_calls_made?: number;
  successful_extractions?: number;
  failed_extractions?: number;
  average_confidence?: number | null;
}

export interface MonthlyUsageUpdate {
  documents_scanned?: number;
  storage_used_bytes?: number;
  api_calls_made?: number;
  successful_extractions?: number;
  failed_extractions?: number;
  average_confidence?: number | null;
}

// Aggregated Dashboard Statistics Type
export interface DashboardStats {
  totalDocuments: number;
  totalStorageUsedGB: number;
  successfulScans: number;
  failedScans: number;
  averageConfidence: number;
  upcomingReminders: Reminder[];
  recentScans: any[];
  subscription: UserSubscription | null;
  userProfile: UserProfile | null;
}
