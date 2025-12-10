/**
 * Hook for accessing browser support data
 * Provides easy component-level access to browser compatibility information
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  BrowserSupport,
  WebFeature,
  BrowserCompatibility,
  BrowserFilterOptions,
  FeatureFilterOptions,
} from '@/types/browser-support';
import {
  getBrowsers,
  getWebFeatures,
  getBrowserCompatibility,
  getPopularBrowsers,
  searchBrowsers,
  searchFeatures,
  checkFeatureSupport,
  getSupportMatrix,
} from '@/lib/browser-support';

interface UseBrowserSupportReturn {
  browsers: BrowserSupport[];
  features: WebFeature[];
  isLoading: boolean;
  error: Error | null;
  
  // Methods
  fetchBrowsers: (options?: BrowserFilterOptions) => Promise<void>;
  fetchFeatures: (options?: FeatureFilterOptions) => Promise<void>;
  getCompatibility: (browserId: string) => Promise<BrowserCompatibility | null>;
  getPopular: (limit?: number) => Promise<void>;
  searchBrowser: (term: string) => Promise<void>;
  searchFeature: (term: string) => Promise<void>;
  checkSupport: (browserId: string, featureId: string) => Promise<any>;
  fetchMatrix: () => Promise<any>;
  
  // Computed
  topBrowsers: BrowserSupport[];
}

export function useBrowserSupport(): UseBrowserSupportReturn {
  const [browsers, setBrowsers] = useState<BrowserSupport[]>([]);
  const [features, setFeatures] = useState<WebFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBrowsers = useCallback(async (options?: BrowserFilterOptions) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getBrowsers(options);
      setBrowsers(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch browsers'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchFeatures = useCallback(async (options?: FeatureFilterOptions) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getWebFeatures(options);
      setFeatures(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch features'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCompatibility = useCallback(async (browserId: string) => {
    try {
      return await getBrowserCompatibility(browserId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get compatibility'));
      return null;
    }
  }, []);

  const getPopular = useCallback(async (limit = 10) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPopularBrowsers(limit);
      setBrowsers(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch popular browsers'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchBrowser = useCallback(async (term: string) => {
    if (!term.trim()) {
      await fetchBrowsers();
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await searchBrowsers(term);
      setBrowsers(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to search browsers'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchBrowsers]);

  const searchFeature = useCallback(async (term: string) => {
    if (!term.trim()) {
      await fetchFeatures();
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await searchFeatures(term);
      setFeatures(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to search features'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchFeatures]);

  const checkSupport = useCallback(async (browserId: string, featureId: string) => {
    try {
      return await checkFeatureSupport(browserId, featureId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to check support'));
      return null;
    }
  }, []);

  const fetchMatrix = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const matrix = await getSupportMatrix();
      setBrowsers(matrix.browsers);
      setFeatures(matrix.features);
      return matrix;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch support matrix'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get top browsers by market share
  const topBrowsers = browsers.filter(b => (b.market_share || 0) > 2).slice(0, 5);

  // Initial load
  useEffect(() => {
    fetchBrowsers();
    fetchFeatures();
  }, []);

  return {
    browsers,
    features,
    isLoading,
    error,
    fetchBrowsers,
    fetchFeatures,
    getCompatibility,
    getPopular,
    searchBrowser,
    searchFeature,
    checkSupport,
    fetchMatrix,
    topBrowsers,
  };
}
