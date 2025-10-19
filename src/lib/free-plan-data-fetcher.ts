/**
 * Free Plan Data Fetcher
 *
 * Optimized data fetching system that prioritizes static files
 * and minimizes Supabase egress usage for the Free Plan
 */

import { FREE_PLAN_CONFIG, UsageTracker } from './free-plan-config';
import type { Category, Item } from './types';

interface MenuData {
  categories: Category[];
  items: Item[];
  source: 'static' | 'supabase' | 'cache';
  timestamp: number;
}

class FreePlanDataFetcher {
  private static instance: FreePlanDataFetcher;
  private cache: Map<string, MenuData> = new Map();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  static getInstance(): FreePlanDataFetcher {
    if (!FreePlanDataFetcher.instance) {
      FreePlanDataFetcher.instance = new FreePlanDataFetcher();
    }
    return FreePlanDataFetcher.instance;
  }

  /**
   * Get menu data with static-first strategy
   */
  async getMenuData(): Promise<MenuData> {
    const cacheKey = 'full_menu';

    // Check memory cache first
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      console.log('✅ Using memory cached menu data');
      return cached;
    }

    // Try static files first (no Supabase cost)
    try {
      const staticData = await this.fetchStaticMenu();
      if (staticData) {
        const menuData: MenuData = {
          ...staticData,
          source: 'static',
          timestamp: Date.now(),
        };

        this.cache.set(cacheKey, menuData);
        console.log('✅ Menu data loaded from static files');
        return menuData;
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

      // Track usage
      UsageTracker.updateUsage(1, dataSizeMB);

      const menuData: MenuData = {
        ...supabaseData,
        source: 'supabase',
        timestamp: Date.now(),
      };

      // Cache the data
      this.cache.set(cacheKey, menuData);
      this.cacheData(menuData);

      console.log(
        `✅ Menu data loaded from Supabase (${dataSizeMB.toFixed(2)}MB)`
      );
      return menuData;
    } catch (error) {
      console.error('Supabase fetch failed:', error);
      return this.getCachedData();
    }
  }

  /**
   * Get items for a specific category
   */
  async getCategoryItems(categoryId: string): Promise<Item[]> {
    const cacheKey = `category_${categoryId}`;

    // Check memory cache first
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      console.log(`✅ Using cached items for category: ${categoryId}`);
      return cached.items;
    }

    // Get full menu data (this handles static/supabase logic)
    const menuData = await this.getMenuData();
    const categoryItems = menuData.items.filter(
      item => item.category_id === categoryId
    );

    // Cache category-specific data
    const categoryData: MenuData = {
      categories: [],
      items: categoryItems,
      source: menuData.source,
      timestamp: Date.now(),
    };
    this.cache.set(cacheKey, categoryData);

    return categoryItems;
  }

  /**
   * Refresh static menu data
   */
  async refreshStaticMenu(): Promise<boolean> {
    try {
      console.log('🔄 Refreshing static menu data...');

      // Clear cache
      this.cache.clear();

      // Try to fetch fresh static data
      const staticData = await this.fetchStaticMenu(true); // Force refresh
      if (staticData) {
        const menuData: MenuData = {
          ...staticData,
          source: 'static',
          timestamp: Date.now(),
        };

        this.cache.set('full_menu', menuData);
        this.cacheData(menuData);

        console.log('✅ Static menu data refreshed successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to refresh static menu:', error);
      return false;
    }
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    return {
      usage: UsageTracker.getUsage(),
      limits: {
        dailyRequests: FREE_PLAN_CONFIG.DAILY_REQUEST_LIMIT,
        dailyDataMB: FREE_PLAN_CONFIG.DAILY_EGRESS_LIMIT_MB,
        monthlyDataGB: FREE_PLAN_CONFIG.MONTHLY_EGRESS_LIMIT_GB,
      },
      percentages: UsageTracker.getUsagePercentage(),
      canUseSupabase: UsageTracker.canUseSupabase(),
    };
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
    try {
      localStorage.removeItem('menu_cache');
      console.log('✅ All caches cleared');
    } catch (error) {
      console.error('Error clearing localStorage cache:', error);
    }
  }

  private async fetchStaticMenu(
    forceRefresh: boolean = false
  ): Promise<{ categories: Category[]; items: Item[] } | null> {
    const url = FREE_PLAN_CONFIG.STATIC_MENU_URL;
    const options: RequestInit = {
      cache: forceRefresh ? 'no-cache' : 'force-cache',
    };

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        console.warn(`Static menu fetch failed: ${response.status}`);
        return null;
      }

      const data = await response.json();

      return {
        categories: data.categories || [],
        items: data.items || [],
      };
    } catch (error) {
      console.error('Static menu fetch error:', error);
      return null;
    }
  }

  private async fetchFromSupabase(): Promise<{
    categories: Category[];
    items: Item[];
  }> {
    // Dynamic import to avoid loading Supabase client if not needed
    const { categoriesAPI, itemsAPI } = await import('./supabase');

    const [categories, items] = await Promise.all([
      categoriesAPI.getAll(),
      itemsAPI.getAll(),
    ]);

    return { categories, items };
  }

  private getCachedData(): MenuData {
    try {
      const cached = localStorage.getItem('menu_cache');
      if (cached) {
        const data = JSON.parse(cached);
        const cacheTime = data.timestamp;
        const now = Date.now();
        const hoursSinceCache = (now - cacheTime) / (1000 * 60 * 60);

        // Use cache if less than 24 hours old
        if (hoursSinceCache < FREE_PLAN_CONFIG.STATIC_CACHE_TTL_HOURS) {
          console.log('📦 Using localStorage cached menu data');
          return {
            categories: data.categories || [],
            items: data.items || [],
            source: 'cache',
            timestamp: cacheTime,
          };
        }
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }

    // Return empty data as last resort
    console.warn('⚠️ No cached data available, returning empty menu');
    return {
      categories: [],
      items: [],
      source: 'cache',
      timestamp: Date.now(),
    };
  }

  private cacheData(data: MenuData): void {
    try {
      localStorage.setItem('menu_cache', JSON.stringify(data));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  private isCacheValid(data: MenuData): boolean {
    const now = Date.now();
    const age = now - data.timestamp;
    return age < this.CACHE_TTL;
  }

  private calculateDataSize(data: {
    categories: Category[];
    items: Item[];
  }): number {
    const jsonString = JSON.stringify(data);
    return jsonString.length / (1024 * 1024); // Convert to MB
  }
}

// Export singleton instance
export const freePlanDataFetcher = FreePlanDataFetcher.getInstance();

// Export types
export type { MenuData };
