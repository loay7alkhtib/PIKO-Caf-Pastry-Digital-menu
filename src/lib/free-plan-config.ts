/**
 * Free Plan Configuration for Supabase
 *
 * This configuration optimizes the app to work within Supabase Free Plan limits:
 * - 5GB egress per month
 * - 500MB database
 * - 500,000 Edge Function requests per month
 */

export const FREE_PLAN_CONFIG = {
  // Egress limits
  MONTHLY_EGRESS_LIMIT_GB: 5,
  DAILY_EGRESS_LIMIT_MB: 200, // Conservative daily limit

  // Request limits
  DAILY_REQUEST_LIMIT: 50, // Conservative daily request limit
  MONTHLY_REQUEST_LIMIT: 1500, // Conservative monthly limit

  // Cache settings
  STATIC_CACHE_TTL_HOURS: 24, // 24 hours for static data
  DYNAMIC_CACHE_TTL_MINUTES: 60, // 1 hour for dynamic data

  // Data optimization
  MAX_ITEM_SIZE_KB: 100, // Max size per item in KB
  MAX_CATEGORY_SIZE_KB: 50, // Max size per category in KB

  // Fallback settings
  FORCE_STATIC_MODE: true, // Force static mode for free plan
  STATIC_MENU_URL: '/static/menu.json',
  STATIC_MENU_GZ_URL: '/static/menu.json.gz',
};

/**
 * Usage tracker for monitoring Supabase usage
 */
export class UsageTracker {
  private static readonly STORAGE_KEY = 'supabase_usage_tracker';

  static getUsage() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return this.getDefaultUsage();

      const usage = JSON.parse(stored);
      const today = new Date().toDateString();

      // Reset if new day
      if (usage.date !== today) {
        return this.getDefaultUsage();
      }

      return usage;
    } catch (error) {
      console.error('Error reading usage tracker:', error);
      return this.getDefaultUsage();
    }
  }

  static updateUsage(requests: number = 1, dataMB: number = 0) {
    try {
      const usage = this.getUsage();
      usage.requests += requests;
      usage.dataTransferredMB += dataMB;
      usage.dataTransferredGB = usage.dataTransferredMB / 1024;

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(usage));

      // Log usage
      console.log(
        `📊 Supabase Usage: ${usage.requests} requests, ${usage.dataTransferredMB.toFixed(2)}MB today`
      );

      // Warn if approaching limits
      if (usage.requests >= FREE_PLAN_CONFIG.DAILY_REQUEST_LIMIT * 0.8) {
        console.warn('⚠️ Approaching daily request limit');
      }

      if (
        usage.dataTransferredMB >=
        FREE_PLAN_CONFIG.DAILY_EGRESS_LIMIT_MB * 0.8
      ) {
        console.warn('⚠️ Approaching daily egress limit');
      }

      return usage;
    } catch (error) {
      console.error('Error updating usage tracker:', error);
      return this.getDefaultUsage();
    }
  }

  static canUseSupabase(): boolean {
    const usage = this.getUsage();

    return (
      usage.requests < FREE_PLAN_CONFIG.DAILY_REQUEST_LIMIT &&
      usage.dataTransferredMB < FREE_PLAN_CONFIG.DAILY_EGRESS_LIMIT_MB
    );
  }

  static getUsagePercentage() {
    const usage = this.getUsage();
    const requestPercentage =
      (usage.requests / FREE_PLAN_CONFIG.DAILY_REQUEST_LIMIT) * 100;
    const dataPercentage =
      (usage.dataTransferredMB / FREE_PLAN_CONFIG.DAILY_EGRESS_LIMIT_MB) * 100;

    return {
      requests: Math.min(requestPercentage, 100),
      data: Math.min(dataPercentage, 100),
      monthly:
        (usage.dataTransferredGB / FREE_PLAN_CONFIG.MONTHLY_EGRESS_LIMIT_GB) *
        100,
    };
  }

  private static getDefaultUsage() {
    return {
      date: new Date().toDateString(),
      requests: 0,
      dataTransferredMB: 0,
      dataTransferredGB: 0,
    };
  }
}

/**
 * Optimized data fetcher for free plan
 */
export class FreePlanDataFetcher {
  static async getMenuData(): Promise<{
    categories: any[];
    items: any[];
    source: 'static' | 'supabase' | 'cache';
  }> {
    // Always try static first for free plan
    try {
      const staticData = await this.fetchStaticMenu();
      if (staticData) {
        return {
          ...staticData,
          source: 'static',
        };
      }
    } catch (error) {
      console.warn('Static menu fetch failed:', error);
    }

    // Check if we can use Supabase
    if (!UsageTracker.canUseSupabase()) {
      console.warn('⚠️ Supabase usage limit reached, using cached data');
      return this.getCachedData();
    }

    // Fallback to Supabase with usage tracking
    try {
      const supabaseData = await this.fetchFromSupabase();
      const dataSizeMB = this.calculateDataSize(supabaseData);
      UsageTracker.updateUsage(1, dataSizeMB);

      // Cache the data
      this.cacheData(supabaseData);

      return {
        ...supabaseData,
        source: 'supabase',
      };
    } catch (error) {
      console.error('Supabase fetch failed:', error);
      return this.getCachedData();
    }
  }

  private static async fetchStaticMenu(): Promise<{
    categories: any[];
    items: any[];
  } | null> {
    const response = await fetch(FREE_PLAN_CONFIG.STATIC_MENU_URL, {
      cache: 'force-cache',
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      categories: data.categories || [],
      items: data.items || [],
    };
  }

  private static async fetchFromSupabase(): Promise<{
    categories: any[];
    items: any[];
  }> {
    const { categoriesAPI, itemsAPI } = await import('./supabase');

    const [categories, items] = await Promise.all([
      categoriesAPI.getAll(),
      itemsAPI.getAll(),
    ]);

    return { categories, items };
  }

  private static getCachedData(): {
    categories: any[];
    items: any[];
    source: 'cache';
  } {
    // Try to get cached data from localStorage
    try {
      const cached = localStorage.getItem('menu_cache');
      if (cached) {
        const data = JSON.parse(cached);
        const cacheTime = data.timestamp;
        const now = Date.now();
        const hoursSinceCache = (now - cacheTime) / (1000 * 60 * 60);

        // Use cache if less than 24 hours old
        if (hoursSinceCache < FREE_PLAN_CONFIG.STATIC_CACHE_TTL_HOURS) {
          console.log('📦 Using cached menu data');
          return {
            categories: data.categories || [],
            items: data.items || [],
            source: 'cache',
          };
        }
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }

    // Return empty data as last resort
    return {
      categories: [],
      items: [],
      source: 'cache',
    };
  }

  private static cacheData(data: { categories: any[]; items: any[] }) {
    try {
      localStorage.setItem(
        'menu_cache',
        JSON.stringify({
          ...data,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  private static calculateDataSize(data: {
    categories: any[];
    items: any[];
  }): number {
    const jsonString = JSON.stringify(data);
    return jsonString.length / (1024 * 1024); // Convert to MB
  }
}
