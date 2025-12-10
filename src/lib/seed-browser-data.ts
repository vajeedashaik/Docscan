/**
 * Browser Support Data Seeding Utility
 * Use this to populate browser and feature data into Supabase
 * 
 * Usage: Import and call seedBrowserData() in your setup flow
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  BrowserInsert,
  WebFeatureInsert,
  FeatureSupportInsert,
} from '@/types/browser-support';

/**
 * Sample browser data based on current market share
 * Data approximate as of 2025
 */
const BROWSERS_DATA: BrowserInsert[] = [
  // Chrome
  { browser_name: 'Chrome', browser_version: '131', platform: 'windows', market_share: 28.5, release_date: '2025-01-07' },
  { browser_name: 'Chrome', browser_version: '131', platform: 'mac', market_share: 18.2, release_date: '2025-01-07' },
  { browser_name: 'Chrome', browser_version: '131', platform: 'linux', market_share: 4.8, release_date: '2025-01-07' },
  { browser_name: 'Chrome', browser_version: '131', platform: 'ios', market_share: 22.3, release_date: '2025-01-07' },
  { browser_name: 'Chrome', browser_version: '131', platform: 'android', market_share: 45.6, release_date: '2025-01-07' },
  
  // Safari
  { browser_name: 'Safari', browser_version: '18', platform: 'mac', market_share: 14.5, release_date: '2024-09-16' },
  { browser_name: 'Safari', browser_version: '18', platform: 'ios', market_share: 25.8, release_date: '2024-09-16' },
  
  // Firefox
  { browser_name: 'Firefox', browser_version: '133', platform: 'windows', market_share: 2.9, release_date: '2024-12-17' },
  { browser_name: 'Firefox', browser_version: '133', platform: 'mac', market_share: 2.1, release_date: '2024-12-17' },
  { browser_name: 'Firefox', browser_version: '133', platform: 'linux', market_share: 2.5, release_date: '2024-12-17' },
  
  // Edge
  { browser_name: 'Edge', browser_version: '131', platform: 'windows', market_share: 4.2, release_date: '2025-01-07' },
  { browser_name: 'Edge', browser_version: '131', platform: 'mac', market_share: 0.8, release_date: '2025-01-07' },
  
  // Samsung Internet
  { browser_name: 'Samsung Internet', browser_version: '25', platform: 'android', market_share: 5.3, release_date: '2024-12-04' },
];

/**
 * Sample web features data
 */
const FEATURES_DATA: WebFeatureInsert[] = [
  // HTML5 features
  { feature_name: 'HTML5 Canvas', feature_category: 'html', description: '2D drawing API', specification_url: 'https://html.spec.whatwg.org/multipage/canvas.html' },
  { feature_name: 'HTML5 Video', feature_category: 'html', description: 'Native video player', specification_url: 'https://html.spec.whatwg.org/multipage/media.html' },
  { feature_name: 'HTML5 Audio', feature_category: 'html', description: 'Native audio player', specification_url: 'https://html.spec.whatwg.org/multipage/media.html' },
  { feature_name: 'Local Storage', feature_category: 'api', description: 'Client-side key-value storage', specification_url: 'https://html.spec.whatwg.org/multipage/webstorage.html' },
  { feature_name: 'Web Workers', feature_category: 'api', description: 'Background threading', specification_url: 'https://html.spec.whatwg.org/multipage/workers.html' },
  
  // CSS features
  { feature_name: 'CSS Flexbox', feature_category: 'css', description: 'Flexible layout module', specification_url: 'https://www.w3.org/TR/css-flexbox-1/' },
  { feature_name: 'CSS Grid', feature_category: 'css', description: 'CSS Grid layout', specification_url: 'https://www.w3.org/TR/css-grid-1/' },
  { feature_name: 'CSS Transforms', feature_category: 'css', description: 'Transform and rotate elements', specification_url: 'https://www.w3.org/TR/css-transforms-1/' },
  { feature_name: 'CSS Animations', feature_category: 'css', description: 'CSS animations and transitions', specification_url: 'https://www.w3.org/TR/css-animations-1/' },
  { feature_name: 'CSS Custom Properties', feature_category: 'css', description: 'CSS Variables', specification_url: 'https://www.w3.org/TR/css-variables-1/' },
  
  // JavaScript features
  { feature_name: 'ES6 Arrow Functions', feature_category: 'javascript', description: 'Arrow function syntax', specification_url: 'https://tc39.es/ecma262/' },
  { feature_name: 'Promise', feature_category: 'javascript', description: 'Promise object for async operations', specification_url: 'https://tc39.es/ecma262/' },
  { feature_name: 'Async/Await', feature_category: 'javascript', description: 'Async function syntax', specification_url: 'https://tc39.es/ecma262/' },
  { feature_name: 'Destructuring', feature_category: 'javascript', description: 'Destructuring assignment', specification_url: 'https://tc39.es/ecma262/' },
  { feature_name: 'Spread Operator', feature_category: 'javascript', description: 'Spread syntax', specification_url: 'https://tc39.es/ecma262/' },
  
  // Modern APIs
  { feature_name: 'Fetch API', feature_category: 'api', description: 'Modern HTTP requests', specification_url: 'https://fetch.spec.whatwg.org/' },
  { feature_name: 'IndexedDB', feature_category: 'api', description: 'Large-scale client-side storage', specification_url: 'https://www.w3.org/TR/IndexedDB/' },
  { feature_name: 'Service Workers', feature_category: 'api', description: 'Background service workers', specification_url: 'https://www.w3.org/TR/service-workers-1/' },
  { feature_name: 'Geolocation API', feature_category: 'api', description: 'User location access', specification_url: 'https://www.w3.org/TR/geolocation-API/' },
  { feature_name: 'Web Notifications', feature_category: 'api', description: 'Desktop notifications', specification_url: 'https://notifications.spec.whatwg.org/' },
  
  // SVG features
  { feature_name: 'SVG Basic Shapes', feature_category: 'svg', description: 'Basic SVG elements', specification_url: 'https://www.w3.org/TR/SVG2/' },
  { feature_name: 'SVG Filters', feature_category: 'svg', description: 'SVG filter effects', specification_url: 'https://www.w3.org/TR/SVG2/' },
  { feature_name: 'SVG Animation', feature_category: 'svg', description: 'SVG SMIL animation', specification_url: 'https://www.w3.org/TR/SVG2/' },
];

/**
 * Support matrix data - maps browsers to features
 * Structure: [browserIndex, featureIndex, supportStatus, prefix, minVersion]
 */
type SupportEntry = [number, number, 'supported' | 'partial' | 'not_supported' | 'deprecated', string | null, string | null];

const SUPPORT_MATRIX: SupportEntry[] = [
  // Chrome support (indices 0-4)
  [0, 0, 'supported', null, '4'],      // Chrome on Windows: Canvas
  [0, 1, 'supported', null, '3'],      // Chrome on Windows: Video
  [0, 2, 'supported', null, '3'],      // Chrome on Windows: Audio
  [0, 3, 'supported', null, '4'],      // Chrome on Windows: Local Storage
  [0, 4, 'supported', null, '4'],      // Chrome on Windows: Web Workers
  [0, 5, 'supported', null, '21'],     // Chrome on Windows: Flexbox
  [0, 6, 'supported', null, '57'],     // Chrome on Windows: Grid
  [0, 7, 'supported', 'webkit', '12'], // Chrome on Windows: Transforms
  [0, 8, 'supported', 'webkit', '26'], // Chrome on Windows: Animations
  [0, 9, 'supported', null, '49'],     // Chrome on Windows: CSS Variables
  [0, 10, 'supported', null, '45'],    // Chrome on Windows: Arrow Functions
  [0, 11, 'supported', null, '32'],    // Chrome on Windows: Promise
  [0, 12, 'supported', null, '55'],    // Chrome on Windows: Async/Await
  [0, 13, 'supported', null, '49'],    // Chrome on Windows: Destructuring
  [0, 14, 'supported', null, '46'],    // Chrome on Windows: Spread Operator
  [0, 15, 'supported', null, '40'],    // Chrome on Windows: Fetch API
  [0, 16, 'supported', null, '24'],    // Chrome on Windows: IndexedDB
  [0, 17, 'supported', null, '40'],    // Chrome on Windows: Service Workers
  [0, 18, 'supported', null, '5'],     // Chrome on Windows: Geolocation
  [0, 19, 'supported', null, '22'],    // Chrome on Windows: Notifications
  [0, 20, 'supported', null, '6'],     // Chrome on Windows: SVG Basic Shapes
  [0, 21, 'supported', null, '13'],    // Chrome on Windows: SVG Filters
  [0, 22, 'supported', null, '6'],     // Chrome on Windows: SVG Animation
  
  // Safari support (indices 5-6)
  [5, 0, 'supported', null, '4'],      // Safari on Mac: Canvas
  [5, 1, 'supported', null, '3'],      // Safari on Mac: Video
  [5, 2, 'supported', null, '3'],      // Safari on Mac: Audio
  [5, 3, 'supported', null, '4'],      // Safari on Mac: Local Storage
  [5, 4, 'partial', null, '10'],       // Safari on Mac: Web Workers
  [5, 5, 'supported', null, '9'],      // Safari on Mac: Flexbox
  [5, 6, 'supported', null, '10.1'],   // Safari on Mac: Grid
  [5, 7, 'supported', 'webkit', '3.2'], // Safari on Mac: Transforms
  [5, 8, 'supported', 'webkit', '4'], // Safari on Mac: Animations
  [5, 9, 'supported', null, '9.1'],    // Safari on Mac: CSS Variables
  [5, 10, 'supported', null, '10'],    // Safari on Mac: Arrow Functions
  [5, 11, 'supported', null, '6'],     // Safari on Mac: Promise
  [5, 12, 'supported', null, '10.1'],  // Safari on Mac: Async/Await
  [5, 13, 'supported', null, '9.1'],   // Safari on Mac: Destructuring
  [5, 14, 'supported', null, '9'],     // Safari on Mac: Spread Operator
  [5, 15, 'supported', null, '10.1'],  // Safari on Mac: Fetch API
  [5, 16, 'supported', null, '10'],    // Safari on Mac: IndexedDB
  [5, 17, 'partial', null, '11.1'],    // Safari on Mac: Service Workers
  [5, 18, 'supported', null, '5'],     // Safari on Mac: Geolocation
  [5, 19, 'partial', null, '6'],       // Safari on Mac: Notifications
  
  // Firefox support (indices 7-9)
  [7, 0, 'supported', null, '2'],      // Firefox on Windows: Canvas
  [7, 1, 'supported', null, '3.5'],    // Firefox on Windows: Video
  [7, 2, 'supported', null, '3.5'],    // Firefox on Windows: Audio
  [7, 3, 'supported', null, '3.5'],    // Firefox on Windows: Local Storage
  [7, 4, 'supported', null, '3.5'],    // Firefox on Windows: Web Workers
  [7, 5, 'supported', null, '20'],     // Firefox on Windows: Flexbox
  [7, 6, 'supported', null, '52'],     // Firefox on Windows: Grid
  [7, 7, 'supported', null, '3.5'],    // Firefox on Windows: Transforms
  [7, 8, 'supported', null, '5'],      // Firefox on Windows: Animations
  [7, 9, 'supported', null, '31'],     // Firefox on Windows: CSS Variables
  [7, 10, 'supported', null, '22'],    // Firefox on Windows: Arrow Functions
  [7, 11, 'supported', null, '24'],    // Firefox on Windows: Promise
  [7, 12, 'supported', null, '52'],    // Firefox on Windows: Async/Await
  [7, 13, 'supported', null, '2'],     // Firefox on Windows: Destructuring
  [7, 14, 'supported', null, '16'],    // Firefox on Windows: Spread Operator
  [7, 15, 'supported', null, '40'],    // Firefox on Windows: Fetch API
  [7, 16, 'supported', null, '13'],    // Firefox on Windows: IndexedDB
  [7, 17, 'supported', null, '44'],    // Firefox on Windows: Service Workers
  [7, 18, 'supported', null, '3.5'],   // Firefox on Windows: Geolocation
  [7, 19, 'supported', null, '22'],    // Firefox on Windows: Notifications
];

/**
 * Insert browsers into database
 */
async function seedBrowsers(browsers: BrowserInsert[]) {
  console.log('Seeding browsers...');
  
  for (const browser of browsers) {
    const { error } = await supabase
      .from('browser_support')
      .upsert(
        {
          browser_name: browser.browser_name,
          browser_version: browser.browser_version,
          platform: browser.platform || 'all',
          market_share: browser.market_share || null,
          release_date: browser.release_date || null,
        },
        {
          onConflict: 'browser_name,browser_version,platform',
        }
      );

    if (error) {
      console.error(`Error seeding browser ${browser.browser_name} ${browser.browser_version}:`, error);
    }
  }
  
  console.log('✓ Browsers seeded');
}

/**
 * Insert features into database
 */
async function seedFeatures(features: WebFeatureInsert[]) {
  console.log('Seeding web features...');
  
  for (const feature of features) {
    const { error } = await supabase
      .from('web_features')
      .upsert(
        {
          feature_name: feature.feature_name,
          feature_category: feature.feature_category,
          description: feature.description || null,
          specification_url: feature.specification_url || null,
        },
        {
          onConflict: 'feature_name',
        }
      );

    if (error) {
      console.error(`Error seeding feature ${feature.feature_name}:`, error);
    }
  }
  
  console.log('✓ Web features seeded');
}

/**
 * Insert feature support matrix
 */
async function seedFeatureSupport() {
  console.log('Seeding feature support matrix...');
  
  // Fetch all browsers and features to get their IDs
  const { data: browsers } = await supabase
    .from('browser_support')
    .select('id, browser_name, browser_version, platform');

  const { data: features } = await supabase
    .from('web_features')
    .select('id, feature_name');

  if (!browsers || !features) {
    console.error('Failed to fetch browsers or features');
    return;
  }

  // Map feature names to IDs
  const featureMap = new Map(features.map(f => [f.feature_name, f.id]));

  // Map browser positions (as used in SUPPORT_MATRIX) to IDs
  const browserMap = new Map(
    BROWSERS_DATA.map((b, idx) => [
      idx,
      browsers.find(br => 
        br.browser_name === b.browser_name && 
        br.browser_version === b.browser_version && 
        br.platform === (b.platform || 'all')
      )?.id,
    ])
  );

  // Insert support records
  for (const [browserIdx, featureIdx, status, prefix, minVersion] of SUPPORT_MATRIX) {
    const browserId = browserMap.get(browserIdx);
    const featureId = featureMap.get(FEATURES_DATA[featureIdx].feature_name);

    if (!browserId || !featureId) continue;

    const { error } = await supabase
      .from('feature_support')
      .upsert(
        {
          browser_id: browserId,
          feature_id: featureId,
          support_status: status,
          prefix_required: prefix,
          min_version: minVersion,
        },
        {
          onConflict: 'browser_id,feature_id',
        }
      );

    if (error) {
      console.error(`Error seeding feature support:`, error);
    }
  }
  
  console.log('✓ Feature support matrix seeded');
}

/**
 * Main seeding function - call this to populate all data
 */
export async function seedBrowserData() {
  try {
    console.log('Starting browser data seeding...');
    
    await seedBrowsers(BROWSERS_DATA);
    await seedFeatures(FEATURES_DATA);
    await seedFeatureSupport();
    
    console.log('✅ Browser data seeding complete!');
    return { success: true, message: 'Browser data seeded successfully' };
  } catch (error) {
    console.error('Error during seeding:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Clear all browser data (use with caution!)
 */
export async function clearBrowserData() {
  try {
    console.log('Clearing browser data...');
    
    await supabase.from('feature_support').delete().neq('id', '');
    await supabase.from('web_features').delete().neq('id', '');
    await supabase.from('browser_support').delete().neq('id', '');
    
    console.log('✅ Browser data cleared!');
    return { success: true, message: 'Browser data cleared' };
  } catch (error) {
    console.error('Error clearing data:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
