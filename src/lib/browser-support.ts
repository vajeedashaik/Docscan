/**
 * Browser Support Service
 * Provides utilities to query and manage browser compatibility data from Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  BrowserSupport,
  WebFeature,
  FeatureSupport,
  BrowserStats,
  BrowserFilterOptions,
  FeatureFilterOptions,
  BrowserWithFeatures,
  FeatureWithSupport,
  BrowserCompatibility,
  BrowserInsert,
  WebFeatureInsert,
  FeatureSupportInsert,
} from '@/types/browser-support';

/**
 * Get all browsers with optional filtering
 */
export const getBrowsers = async (
  options?: BrowserFilterOptions
): Promise<BrowserSupport[]> => {
  let query = supabase.from('browser_support').select('*');

  if (options?.browser_name) {
    query = query.ilike('browser_name', `%${options.browser_name}%`);
  }

  if (options?.platform && options.platform !== 'all') {
    query = query.eq('platform', options.platform);
  }

  if (options?.min_market_share !== undefined) {
    query = query.gte('market_share', options.min_market_share);
  }

  const { data, error } = await query.order('market_share', { ascending: false });

  if (error) {
    console.error('Error fetching browsers:', error);
    throw new Error(`Failed to fetch browsers: ${error.message}`);
  }

  return data || [];
};

/**
 * Get a single browser by ID with its features
 */
export const getBrowserWithFeatures = async (
  browserId: string
): Promise<BrowserWithFeatures | null> => {
  const { data: browser, error: browserError } = await supabase
    .from('browser_support')
    .select('*')
    .eq('id', browserId)
    .single();

  if (browserError && browserError.code !== 'PGRST116') {
    console.error('Error fetching browser:', browserError);
    throw new Error(`Failed to fetch browser: ${browserError.message}`);
  }

  if (!browser) return null;

  const { data: features, error: featuresError } = await supabase
    .from('feature_support')
    .select('*')
    .eq('browser_id', browserId);

  if (featuresError) {
    console.error('Error fetching browser features:', featuresError);
    throw new Error(`Failed to fetch features: ${featuresError.message}`);
  }

  return {
    ...browser,
    features: features || [],
  };
};

/**
 * Get all web features with optional filtering
 */
export const getWebFeatures = async (
  options?: FeatureFilterOptions
): Promise<WebFeature[]> => {
  let query = supabase.from('web_features').select('*');

  if (options?.category) {
    query = query.eq('feature_category', options.category);
  }

  if (options?.search) {
    query = query.ilike('feature_name', `%${options.search}%`);
  }

  const { data, error } = await query.order('feature_name');

  if (error) {
    console.error('Error fetching features:', error);
    throw new Error(`Failed to fetch features: ${error.message}`);
  }

  return data || [];
};

/**
 * Get feature with browser support details
 */
export const getFeatureWithSupport = async (
  featureId: string
): Promise<FeatureWithSupport | null> => {
  const { data: feature, error: featureError } = await supabase
    .from('web_features')
    .select('*')
    .eq('id', featureId)
    .single();

  if (featureError && featureError.code !== 'PGRST116') {
    console.error('Error fetching feature:', featureError);
    throw new Error(`Failed to fetch feature: ${featureError.message}`);
  }

  if (!feature) return null;

  const { data: support, error: supportError } = await supabase
    .from('feature_support')
    .select('*')
    .eq('feature_id', featureId);

  if (supportError) {
    console.error('Error fetching feature support:', supportError);
    throw new Error(`Failed to fetch support: ${supportError.message}`);
  }

  return {
    ...feature,
    support_details: support || [],
  };
};

/**
 * Get browser compatibility matrix
 * Returns a matrix of browsers and their feature support
 */
export const getSupportMatrix = async () => {
  const { data: features, error: featuresError } = await supabase
    .from('web_features')
    .select('*')
    .order('feature_name');

  const { data: browsers, error: browsersError } = await supabase
    .from('browser_support')
    .select('*')
    .order('market_share', { ascending: false });

  const { data: support, error: supportError } = await supabase
    .from('feature_support')
    .select('*');

  if (featuresError || browsersError || supportError) {
    throw new Error('Failed to fetch support matrix');
  }

  return {
    features: features || [],
    browsers: browsers || [],
    support: support || [],
  };
};

/**
 * Check if a specific browser supports a feature
 */
export const checkFeatureSupport = async (
  browserId: string,
  featureId: string
): Promise<FeatureSupport | null> => {
  const { data, error } = await supabase
    .from('feature_support')
    .select('*')
    .eq('browser_id', browserId)
    .eq('feature_id', featureId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking feature support:', error);
    throw new Error(`Failed to check support: ${error.message}`);
  }

  return data || null;
};

/**
 * Get browser compatibility stats
 */
export const getBrowserCompatibility = async (
  browserId: string
): Promise<BrowserCompatibility | null> => {
  const { data: browser } = await supabase
    .from('browser_support')
    .select('*')
    .eq('id', browserId)
    .single();

  if (!browser) return null;

  const { data: support } = await supabase
    .from('feature_support')
    .select('support_status')
    .eq('browser_id', browserId);

  if (!support) {
    return {
      browser,
      supported_count: 0,
      partial_count: 0,
      unsupported_count: 0,
      total_count: 0,
      support_percentage: 0,
    };
  }

  const supported_count = support.filter(s => s.support_status === 'supported').length;
  const partial_count = support.filter(s => s.support_status === 'partial').length;
  const unsupported_count = support.filter(s => s.support_status === 'not_supported').length;
  const total_count = support.length;
  const support_percentage = total_count > 0 ? (supported_count / total_count) * 100 : 0;

  return {
    browser,
    supported_count,
    partial_count,
    unsupported_count,
    total_count,
    support_percentage,
  };
};

/**
 * Get browser statistics
 */
export const getBrowserStats = async (
  days: number = 30
): Promise<BrowserStats[]> => {
  const { data, error } = await supabase
    .from('browser_stats')
    .select('*')
    .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching browser stats:', error);
    throw new Error(`Failed to fetch stats: ${error.message}`);
  }

  return data || [];
};

/**
 * Search browsers by name
 */
export const searchBrowsers = async (searchTerm: string): Promise<BrowserSupport[]> => {
  const { data, error } = await supabase
    .from('browser_support')
    .select('*')
    .ilike('browser_name', `%${searchTerm}%`)
    .order('market_share', { ascending: false });

  if (error) {
    console.error('Error searching browsers:', error);
    throw new Error(`Failed to search browsers: ${error.message}`);
  }

  return data || [];
};

/**
 * Search web features
 */
export const searchFeatures = async (searchTerm: string): Promise<WebFeature[]> => {
  const { data, error } = await supabase
    .from('web_features')
    .select('*')
    .ilike('feature_name', `%${searchTerm}%`)
    .order('feature_name');

  if (error) {
    console.error('Error searching features:', error);
    throw new Error(`Failed to search features: ${error.message}`);
  }

  return data || [];
};

/**
 * Get popular browsers by market share
 */
export const getPopularBrowsers = async (
  limit: number = 10
): Promise<BrowserSupport[]> => {
  const { data, error } = await supabase
    .from('browser_support')
    .select('*')
    .gt('market_share', 0)
    .order('market_share', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching popular browsers:', error);
    throw new Error(`Failed to fetch popular browsers: ${error.message}`);
  }

  return data || [];
};

/**
 * Get features by category with support counts
 */
export const getFeaturesByCategory = async (
  category: 'html' | 'css' | 'javascript' | 'api' | 'svg'
) => {
  const { data: features, error: featuresError } = await supabase
    .from('web_features')
    .select('*')
    .eq('feature_category', category)
    .order('feature_name');

  if (featuresError) {
    console.error('Error fetching features by category:', featuresError);
    throw new Error(`Failed to fetch features: ${featuresError.message}`);
  }

  if (!features) return [];

  // Get support counts for each feature
  const featuresWithCounts = await Promise.all(
    features.map(async (feature) => {
      const { data: support } = await supabase
        .from('feature_support')
        .select('support_status')
        .eq('feature_id', feature.id);

      if (!support) {
        return { ...feature, supported_browsers: 0, total_browsers: 0 };
      }

      const supported = support.filter(
        s => s.support_status === 'supported' || s.support_status === 'partial'
      ).length;

      return {
        ...feature,
        supported_browsers: supported,
        total_browsers: support.length,
      };
    })
  );

  return featuresWithCounts;
};
