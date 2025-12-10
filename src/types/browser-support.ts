/**
 * Browser Support Types
 * Defines TypeScript interfaces for browser compatibility data stored in Supabase
 */

export type FeatureCategory = 'html' | 'css' | 'javascript' | 'api' | 'svg';
export type SupportStatus = 'supported' | 'partial' | 'not_supported' | 'deprecated';
export type Platform = 'windows' | 'mac' | 'linux' | 'ios' | 'android' | 'all';

/**
 * Browser information
 */
export interface BrowserSupport {
  id: string;
  browser_name: string;
  browser_version: string;
  platform: Platform;
  release_date: string | null;
  eol_date: string | null;
  market_share: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Web feature definition
 */
export interface WebFeature {
  id: string;
  feature_name: string;
  feature_category: FeatureCategory;
  description: string | null;
  specification_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Browser support for a specific feature
 */
export interface FeatureSupport {
  id: string;
  browser_id: string;
  feature_id: string;
  support_status: SupportStatus;
  prefix_required: string | null;
  min_version: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Browser statistics
 */
export interface BrowserStats {
  id: string;
  date: string;
  browser_name: string;
  total_visitors: number | null;
  supported_features_count: number | null;
  average_support_percentage: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Combined browser with features
 */
export interface BrowserWithFeatures extends BrowserSupport {
  features?: FeatureSupport[];
}

/**
 * Feature with browser support details
 */
export interface FeatureWithSupport extends WebFeature {
  support_details?: FeatureSupport[];
}

/**
 * Query filter options
 */
export interface BrowserFilterOptions {
  browser_name?: string;
  platform?: Platform;
  min_market_share?: number;
}

export interface FeatureFilterOptions {
  category?: FeatureCategory;
  search?: string;
}

/**
 * Batch insert types
 */
export interface BrowserInsert {
  browser_name: string;
  browser_version: string;
  platform?: Platform;
  release_date?: string | null;
  eol_date?: string | null;
  market_share?: number | null;
}

export interface WebFeatureInsert {
  feature_name: string;
  feature_category: FeatureCategory;
  description?: string | null;
  specification_url?: string | null;
}

export interface FeatureSupportInsert {
  browser_id: string;
  feature_id: string;
  support_status?: SupportStatus;
  prefix_required?: string | null;
  min_version?: string | null;
  notes?: string | null;
}

/**
 * Support matrix types
 */
export interface SupportMatrix {
  features: WebFeature[];
  browsers: BrowserSupport[];
  support: FeatureSupport[];
}

/**
 * Feature compatibility for a browser
 */
export interface BrowserCompatibility {
  browser: BrowserSupport;
  supported_count: number;
  partial_count: number;
  unsupported_count: number;
  total_count: number;
  support_percentage: number;
}
