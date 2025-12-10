# 📋 Browser Support Database - Quick Reference

## Connection Status

✅ **Supabase Credentials:** Already configured in `.env.local`

```env
VITE_SUPABASE_URL=https://vdusyjayoekgfbrxquwa.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_j4VStggUhIlDiIpqHJeEyw_hfvMic52
VITE_SUPABASE_PROJECT_ID=vdusyjayoekgfbrxquwa
```

## Setup Checklist

- [ ] **Step 1** (2 min): Execute SQL migration in Supabase SQL Editor
  - File: `supabase/migrations/20251210_browser_support.sql`
  - Action: Copy → Paste → Run
  
- [ ] **Step 2** (1 min): Seed data with `seedBrowserData()`
  - Location: Can call from any React component
  - Result: 13 browsers + 23 features loaded

- [ ] **Step 3** (Done): Use `useBrowserSupport()` hook in components

## Quick API Reference

### React Hook
```typescript
import { useBrowserSupport } from '@/hooks/useBrowserSupport';

const {
  browsers,              // BrowserSupport[]
  features,              // WebFeature[]
  isLoading,             // boolean
  error,                 // Error | null
  topBrowsers,           // Top 5 by market share
  fetchBrowsers,         // (options?) => Promise<void>
  fetchFeatures,         // (options?) => Promise<void>
  getCompatibility,      // (id) => Promise<BrowserCompatibility>
  getPopular,            // (limit?) => Promise<void>
  searchBrowser,         // (term) => Promise<void>
  searchFeature,         // (term) => Promise<void>
  checkSupport,          // (browserId, featureId) => Promise<FeatureSupport>
  fetchMatrix,           // () => Promise<{ features, browsers, support }>
} = useBrowserSupport();
```

### Service Functions
```typescript
import * as BrowserService from '@/lib/browser-support';

// Queries
BrowserService.getBrowsers(options?)
BrowserService.getWebFeatures(options?)
BrowserService.getBrowserWithFeatures(browserId)
BrowserService.getFeatureWithSupport(featureId)
BrowserService.getBrowserCompatibility(browserId)
BrowserService.getBrowserStats(days?)
BrowserService.getSupportMatrix()

// Search
BrowserService.searchBrowsers(term)
BrowserService.searchFeatures(term)
BrowserService.getPopularBrowsers(limit?)
BrowserService.getFeaturesByCategory(category)

// Check
BrowserService.checkFeatureSupport(browserId, featureId)
```

### Data Management
```typescript
import { seedBrowserData, clearBrowserData } from '@/lib/seed-browser-data';

await seedBrowserData();   // Load sample data
await clearBrowserData();  // Delete all data (caution!)
```

## Data Types

### BrowserSupport
```typescript
interface BrowserSupport {
  id: string;
  browser_name: string;              // 'Chrome', 'Firefox', etc.
  browser_version: string;           // '131', '133', etc.
  platform: Platform;                // 'windows'|'mac'|'linux'|'ios'|'android'|'all'
  release_date: string | null;       // '2025-01-07'
  eol_date: string | null;           // End of life date
  market_share: number | null;       // 28.5 (percent)
  created_at: string;                // Timestamp
  updated_at: string;                // Timestamp
}
```

### WebFeature
```typescript
interface WebFeature {
  id: string;
  feature_name: string;              // 'CSS Grid', 'Web Workers', etc.
  feature_category: FeatureCategory; // 'html'|'css'|'javascript'|'api'|'svg'
  description: string | null;        // Feature description
  specification_url: string | null;  // Link to spec
  created_at: string;
  updated_at: string;
}
```

### FeatureSupport
```typescript
interface FeatureSupport {
  id: string;
  browser_id: string;                // Links to BrowserSupport
  feature_id: string;                // Links to WebFeature
  support_status: SupportStatus;     // 'supported'|'partial'|'not_supported'|'deprecated'
  prefix_required: string | null;    // 'webkit'|'moz'|'ms'|null
  min_version: string | null;        // Minimum version needed
  notes: string | null;              // Additional info
  created_at: string;
  updated_at: string;
}
```

### BrowserCompatibility
```typescript
interface BrowserCompatibility {
  browser: BrowserSupport;
  supported_count: number;
  partial_count: number;
  unsupported_count: number;
  total_count: number;
  support_percentage: number;        // 0-100
}
```

## Component Usage Examples

### Example 1: Display Top Browsers
```typescript
import { useBrowserSupport } from '@/hooks/useBrowserSupport';
import { BarChart } from 'recharts';

export function BrowserChart() {
  const { topBrowsers } = useBrowserSupport();
  
  const data = topBrowsers.map(b => ({
    name: `${b.browser_name} ${b.browser_version}`,
    share: b.market_share || 0,
  }));

  return <BarChart data={data} />;
}
```

### Example 2: Feature Compatibility Matrix
```typescript
import { useBrowserSupport } from '@/hooks/useBrowserSupport';

export function CompatibilityMatrix() {
  const { browsers, features } = useBrowserSupport();
  
  return (
    <table>
      <thead>
        <tr>
          <th>Feature</th>
          {browsers.map(b => (
            <th key={b.id}>{b.browser_name}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {features.map(feature => (
          <tr key={feature.id}>
            <td>{feature.feature_name}</td>
            {browsers.map(browser => (
              <td key={browser.id}>
                {/* Show support status */}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Example 3: Search Browser
```typescript
import { useState } from 'react';
import { useBrowserSupport } from '@/hooks/useBrowserSupport';
import { Input } from '@/components/ui/input';

export function BrowserSearch() {
  const [term, setTerm] = useState('');
  const { browsers, searchBrowser } = useBrowserSupport();

  const handleSearch = async (value: string) => {
    setTerm(value);
    if (value.trim()) {
      await searchBrowser(value);
    }
  };

  return (
    <div>
      <Input 
        placeholder="Search browsers..."
        onChange={(e) => handleSearch(e.target.value)}
      />
      {browsers.map(b => (
        <div key={b.id}>
          {b.browser_name} {b.browser_version} ({b.platform})
        </div>
      ))}
    </div>
  );
}
```

### Example 4: Check Feature Support
```typescript
import { useEffect, useState } from 'react';
import { useBrowserSupport } from '@/hooks/useBrowserSupport';
import { Badge } from '@/components/ui/badge';

export function FeatureSupportBadge({ browserId, featureId }: Props) {
  const { checkSupport } = useBrowserSupport();
  const [support, setSupport] = useState(null);

  useEffect(() => {
    const check = async () => {
      const result = await checkSupport(browserId, featureId);
      setSupport(result);
    };
    check();
  }, [browserId, featureId, checkSupport]);

  const statusColors = {
    'supported': 'bg-green-100 text-green-800',
    'partial': 'bg-yellow-100 text-yellow-800',
    'not_supported': 'bg-red-100 text-red-800',
    'deprecated': 'bg-gray-100 text-gray-800',
  };

  return (
    <Badge className={statusColors[support?.support_status || 'not_supported']}>
      {support?.support_status || 'Unknown'}
    </Badge>
  );
}
```

## Tables Schema

### browser_support
```sql
CREATE TABLE browser_support (
  id UUID PRIMARY KEY,
  browser_name TEXT NOT NULL,
  browser_version TEXT NOT NULL,
  platform TEXT DEFAULT 'all',
  release_date DATE,
  eol_date DATE,
  market_share NUMERIC(5,2),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(browser_name, browser_version, platform)
);
```

### web_features
```sql
CREATE TABLE web_features (
  id UUID PRIMARY KEY,
  feature_name TEXT NOT NULL UNIQUE,
  feature_category TEXT NOT NULL,
  description TEXT,
  specification_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### feature_support
```sql
CREATE TABLE feature_support (
  id UUID PRIMARY KEY,
  browser_id UUID REFERENCES browser_support(id),
  feature_id UUID REFERENCES web_features(id),
  support_status TEXT DEFAULT 'not_supported',
  prefix_required TEXT,
  min_version TEXT,
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(browser_id, feature_id)
);
```

### browser_stats
```sql
CREATE TABLE browser_stats (
  id UUID PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  browser_name TEXT NOT NULL,
  total_visitors INTEGER DEFAULT 0,
  supported_features_count INTEGER DEFAULT 0,
  average_support_percentage NUMERIC(5,2),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(date, browser_name)
);
```

## Useful SQL Queries

### Top Browsers by Market Share
```sql
SELECT browser_name, browser_version, platform, market_share
FROM browser_support
WHERE market_share > 0
ORDER BY market_share DESC
LIMIT 10;
```

### Features by Category
```sql
SELECT feature_name, feature_category
FROM web_features
WHERE feature_category = 'css'
ORDER BY feature_name;
```

### Support Status by Feature
```sql
SELECT 
  f.feature_name,
  b.browser_name,
  b.browser_version,
  fs.support_status,
  fs.min_version
FROM feature_support fs
JOIN web_features f ON fs.feature_id = f.id
JOIN browser_support b ON fs.browser_id = b.id
WHERE f.feature_name = 'CSS Grid'
ORDER BY b.market_share DESC;
```

### Browsers with Most Supported Features
```sql
SELECT 
  b.browser_name,
  b.browser_version,
  COUNT(CASE WHEN fs.support_status = 'supported' THEN 1 END) as supported_count,
  COUNT(*) as total_count,
  ROUND(100.0 * COUNT(CASE WHEN fs.support_status = 'supported' THEN 1 END) / COUNT(*), 2) as support_percentage
FROM browser_support b
LEFT JOIN feature_support fs ON b.id = fs.browser_id
GROUP BY b.id, b.browser_name, b.browser_version
ORDER BY support_percentage DESC;
```

## Performance Indexes

All tables have optimized indexes:
- `browser_support.browser_name`
- `browser_support.platform`
- `web_features.feature_category`
- `feature_support.browser_id`
- `feature_support.feature_id`
- `browser_stats.date`
- `browser_stats.browser_name`

## Environment

File: `.env.local`

```
VITE_SUPABASE_URL=https://vdusyjayoekgfbrxquwa.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_j4VStggUhIlDiIpqHJeEyw_hfvMic52
VITE_SUPABASE_PROJECT_ID=vdusyjayoekgfbrxquwa
```

✅ **Status:** Already configured!

## Helpful Links

- Supabase Dashboard: https://app.supabase.com
- Browser Market Share: https://gs.statcounter.com/browser-market-share
- HTML/CSS Specs: https://www.w3.org/TR/
- JavaScript: https://tc39.es/ecma262/
- Web APIs: https://developer.mozilla.org/en-US/docs/Web/API

## Support Status Legend

| Status | Meaning |
|--------|---------|
| `supported` | Feature fully supported |
| `partial` | Partial support or requires flags |
| `not_supported` | Feature not supported |
| `deprecated` | Feature deprecated |

---

**Last Updated:** December 10, 2025  
**Version:** 1.0  
**Status:** ✅ Production Ready
