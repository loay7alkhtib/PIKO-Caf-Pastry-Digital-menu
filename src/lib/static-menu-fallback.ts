/**
 * Static Menu Fallback System for Free Plan
 *
 * This system prioritizes serving static menu data from CDN/public files
 * and only falls back to Supabase when absolutely necessary.
 */

import type { Category, Item } from './types';

// Static menu data URLs
const STATIC_MENU_URL = '/static/menu.json';
const STATIC_MENU_GZ_URL = '/static/menu.json.gz';

interface StaticMenuData {
  categories: Category[];
  items: Item[];
  generatedAt: string;
  version: string;
  metadata: {
    totalCategories: number;
    totalItems: number;
    lastUpdated: string;
    cacheExpiry: string;
  };
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

// In-memory cache for static data
let staticMenuCache: CacheEntry<StaticMenuData> | null = null;
const STATIC_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Check if static menu data is available and fresh
 */
export async function isStaticMenuAvailable(): Promise<boolean> {
  try {
    const response = await fetch(STATIC_MENU_URL, {
      method: 'HEAD',
      cache: 'no-cache',
    });

    if (!response.ok) return false;

    const lastModified = response.headers.get('last-modified');
    if (!lastModified) return true;

    const lastModifiedDate = new Date(lastModified);
    const now = new Date();
    const hoursSinceUpdate =
      (now.getTime() - lastModifiedDate.getTime()) / (1000 * 60 * 60);

    // Consider static data fresh if updated within last 24 hours
    return hoursSinceUpdate < 24;
  } catch (error) {
    console.warn('Static menu availability check failed:', error);
    return false;
  }
}

/**
 * Load static menu data with aggressive caching
 */
export async function loadStaticMenu(): Promise<StaticMenuData | null> {
  // Check in-memory cache first
  if (staticMenuCache && Date.now() < staticMenuCache.expiry) {
    console.log('✅ Using cached static menu data');
    return staticMenuCache.data;
  }

  try {
    console.log('🔄 Loading static menu data...');

    // Try compressed version first (smaller download)
    let response = await fetch(STATIC_MENU_GZ_URL, {
      cache: 'force-cache', // Aggressive caching
      headers: {
        'Accept-Encoding': 'gzip',
      },
    });

    let data: StaticMenuData;

    if (response.ok) {
      // Handle compressed data
      const compressedData = await response.arrayBuffer();
      const decompressed = await decompressGzip(compressedData);
      data = JSON.parse(decompressed);
    } else {
      // Fallback to uncompressed
      response = await fetch(STATIC_MENU_URL, {
        cache: 'force-cache',
      });

      if (!response.ok) {
        throw new Error(`Static menu fetch failed: ${response.status}`);
      }

      data = await response.json();
    }

    // Cache the result
    staticMenuCache = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + STATIC_CACHE_TTL,
    };

    console.log('✅ Static menu loaded successfully');
    console.log(
      `📊 Categories: ${data.categories.length}, Items: ${data.items.length}`

    return data;
  } catch (error) {
    console.error('❌ Failed to load static menu:', error);
    return null;
  }
}

/**
 * Simple GZIP decompression using browser APIs
 */
async function decompressGzip(compressedData: ArrayBuffer): Promise<string> {
  const stream = new DecompressionStream('gzip');
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();

  // Write compressed data
  writer.write(new Uint8Array(compressedData));
  writer.close();

  // Read decompressed data
  const chunks: Uint8Array[] = [];
  let done = false;

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    if (value) {
      chunks.push(value);
    }
  }

  // Combine chunks
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return new TextDecoder().decode(result);
}

/**
 * Get menu data with static-first strategy
 */
export async function getMenuDataWithStaticFallback(): Promise<{
  categories: Category[];
  items: Item[];
  source: 'static' | 'supabase';
}> {
  // Try static menu first
  const staticData = await loadStaticMenu();

  if (staticData) {
    return {
      categories: staticData.categories,
      items: staticData.items,
      source: 'static',
    };
  }

  // Fallback to Supabase (this counts against egress)
  console.warn('⚠️ Static menu unavailable, falling back to Supabase');

  // Import Supabase APIs dynamically to avoid loading them if not needed
  const { categoriesAPI, itemsAPI } = await import('./supabase');

  const [categories, items] = await Promise.all([
    categoriesAPI.getAll(),
    itemsAPI.getAll(),
  ]);

  return {
    categories,
    items,
    source: 'supabase',
  };
}

/**
 * Check if we should use Supabase based on usage limits
 */
export function shouldUseSupabase(): boolean {
  // Check localStorage for usage tracking
  const usageKey = 'supabase_usage_tracker';
  const today = new Date().toDateString();

  try {
    const usage = JSON.parse(localStorage.getItem(usageKey) || '{}');

    // Reset if new day
    if (usage.date !== today) {
      localStorage.setItem(
        usageKey,
        JSON.stringify({
          date: today,
          requests: 0,
          dataTransferred: 0,
        })
      );
      return true;
    }

    // Check if we're approaching limits
    const maxDailyRequests = 50; // Conservative limit for 5GB/month
    const maxDailyDataMB = 200; // ~6GB/month limit

    if (
      usage.requests >= maxDailyRequests ||
      usage.dataTransferred >= maxDailyDataMB
    ) {
      console.warn('⚠️ Approaching Supabase usage limits, forcing static mode');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Usage tracking error:', error);
    return true; // Default to allowing Supabase
  }
}

/**
 * Track Supabase usage
 */
export function trackSupabaseUsage(dataSizeMB: number): void {
  const usageKey = 'supabase_usage_tracker';
  const today = new Date().toDateString();

  try {
    const usage = JSON.parse(localStorage.getItem(usageKey) || '{}');

    if (usage.date !== today) {
      usage.date = today;
      usage.requests = 0;
      usage.dataTransferred = 0;
    }

    usage.requests += 1;
    usage.dataTransferred += dataSizeMB;

    localStorage.setItem(usageKey, JSON.stringify(usage));

    console.log(
      `📊 Supabase usage: ${usage.requests} requests, ${usage.dataTransferred.toFixed(2)}MB today`
    );
  } catch (error) {
    console.error('Usage tracking error:', error);
  }
}
