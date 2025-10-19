import { createClient } from '@supabase/supabase-js';
import { publicAnonKey } from './config/supabase';

// Optimized Supabase client configuration for read-only menu
export const supabaseOptimized = createClient(
  'https://eoaissoqwlfvfizfomax.supabase.co',
  publicAnonKey,
  {
    // Disable realtime to reduce data egress
    realtime: {
      enabled: false,
    },
    // Disable auth persistence for read-only operations
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    // Optimize global settings
    global: {
      headers: {
        'Cache-Control': 'max-age=3600',
      },
    },
    // Disable database logging to reduce egress
    db: {
      schema: 'public',
    },
  }
);

// Optimized query functions that only fetch needed fields
export const optimizedQueries = {
  // Get categories with minimal fields
  getCategories: () =>
    supabaseOptimized
      .from('categories')
      .select(
        `
        id,
        slug,
        names,
        icon,
        color,
        image_url,
        sort_order,
        is_active
      `
      )
      .eq('is_active', true)
      .order('sort_order'),

  // Get items with minimal fields
  getItems: (categoryId?: string) => {
    let query = supabaseOptimized
      .from('items')
      .select(
        `
        id,
        category_id,
        names,
        descriptions,
        price,
        image_url,
        tags,
        variants,
        sort_order,
        is_active
      `
      )
      .eq('is_active', true)
      .order('sort_order');

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    return query;
  },

  // Get single item with minimal fields
  getItem: (id: string) =>
    supabaseOptimized
      .from('items')
      .select(
        `
        id,
        category_id,
        names,
        descriptions,
        price,
        image_url,
        tags,
        variants,
        sort_order,
        is_active
      `
      )
      .eq('id', id)
      .eq('is_active', true)
      .single(),
};

// Cache configuration
export const cacheConfig = {
  // Browser cache settings
  browser: {
    categories: {
      ttl: 60 * 60 * 1000, // 1 hour
      key: 'piko-categories-optimized',
    },
    items: {
      ttl: 60 * 60 * 1000, // 1 hour
      key: 'piko-items-optimized',
    },
  },
  // CDN cache settings
  cdn: {
    ttl: 60 * 60, // 1 hour in seconds
    staleWhileRevalidate: 24 * 60 * 60, // 24 hours
  },
};

// Image optimization utilities
export const imageOptimization = {
  // Generate optimized image URL
  getOptimizedUrl: (
    src: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'jpeg' | 'png';
    } = {}
  ) => {
    if (!src) return '';

    const { width, height, quality = 80, format = 'webp' } = options;

    // If using Supabase Storage, add transformation parameters
    if (src.includes('supabase')) {
      const params = new URLSearchParams();
      if (width) params.set('width', width.toString());
      if (height) params.set('height', height.toString());
      if (quality) params.set('quality', quality.toString());
      if (format) params.set('format', format);

      const separator = src.includes('?') ? '&' : '?';
      return `${src}${separator}${params.toString()}`;
    }

    return src;
  },

  // Generate responsive image srcset
  getResponsiveSrcSet: (src: string, sizes: number[] = [400, 800, 1200]) => {
    return sizes
      .map(size => {
        const optimizedUrl = imageOptimization.getOptimizedUrl(src, {
          width: size,
        });
        return `${optimizedUrl} ${size}w`;
      })
      .join(', ');
  },
};

// Performance monitoring
export const performanceMonitor = {
  // Track API response times
  trackApiCall: async <T>(
    name: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const start = performance.now();
    try {
      const result = await apiCall();
      const duration = performance.now() - start;
      console.log(`✅ ${name} completed in ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`❌ ${name} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  },

  // Track cache hit rates
  trackCacheHit: (cacheType: string, hit: boolean) => {
    console.log(`📊 Cache ${hit ? 'HIT' : 'MISS'} for ${cacheType}`);
  },
};

// Export optimized API functions
export const optimizedAPI = {
  // Get all menu data in one optimized call
  getMenuData: async () => {
    return performanceMonitor.trackApiCall('getMenuData', async () => {
      const [categoriesResult, itemsResult] = await Promise.all([
        optimizedQueries.getCategories(),
        optimizedQueries.getItems(),
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (itemsResult.error) throw itemsResult.error;

      return {
        categories: categoriesResult.data,
        items: itemsResult.data,
        lastUpdated: new Date().toISOString(),
      };
    });
  },

  // Get items for specific category
  getCategoryItems: async (categoryId: string) => {
    return performanceMonitor.trackApiCall(
      `getCategoryItems-${categoryId}`,
      () => optimizedQueries.getItems(categoryId)
    );
  },
};
