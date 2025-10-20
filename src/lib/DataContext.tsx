import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { categoriesAPI, itemsAPI } from './supabase';
import type { Category, Item } from './types';
import * as idb from './idb';
import { toast } from 'sonner';
import PikoLoader from '../components/PikoLoader';

interface ItemsCache {
  data: Item[];
  timestamp: number;
}

interface DataContextType {
  categories: Category[];
  items: Item[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getCategoryItems: (
    _categoryId: string,
    _options?: { preferCache?: boolean }
  ) => Promise<Item[]>;
  prefetchCategory: (_categoryId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);
const ITEMS_CACHE_TTL = 300_000; // 5 minutes

export function DataProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // In-memory cache for items by category
  const [itemsCache, setItemsCache] = useState<Record<string, ItemsCache>>({});

  // Fetch all data once on mount with static-first strategy
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we're in admin mode - if so, force database mode
      const isAdmin =
        window.location.pathname.includes('/admin') ||
        window.location.hash.includes('admin') ||
        window.location.pathname.includes('admin');

      if (isAdmin) {
        console.log('🔄 Admin mode detected - FORCING DATABASE FETCH');
        // Force database mode for admin
        const { categoriesAPI, itemsAPI } = await import('./supabase');
        const [categoriesData, itemsDataRaw] = await Promise.all([
          categoriesAPI.getAll(),
          itemsAPI.getAll(),
        ]);

        // Process the data
        const itemsData = Array.isArray(itemsDataRaw)
          ? itemsDataRaw.filter(
              item =>
                item &&
                typeof item === 'object' &&
                item.category_id !== undefined
          )
          : [];

        const itemsWithOrder = itemsData.map((item, index) => ({
          ...item,
          order: item.order ?? index,
        }));

        const sortedItems = itemsWithOrder.sort((a, b) => {
          if (a.category_id !== b.category_id) {
            return (a.category_id || '').localeCompare(b.category_id || '');
          }
          return (a.order || 0) - (b.order || 0);
        });

        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setItems(sortedItems);
        console.log('✅ Admin data loaded from DATABASE');
        return;
      }

      // Load data from API for visitors
      const [categoriesData, itemsDataRaw] = await Promise.all([
        categoriesAPI.getAll(),
        itemsAPI.getAll(),
      ]);

      // Filter out only invalid items (keep all items, even with empty names)
      const itemsData = Array.isArray(itemsDataRaw)
        ? itemsDataRaw.filter(
            item =>
              item && typeof item === 'object' && item.category_id !== undefined
        )
        : [];

      // Ensure all items have an order field, defaulting to 0
      const itemsWithOrder = itemsData.map((item, index) => ({
        ...item,
        order: item.order ?? index,
      }));

      // Sort items by order within each category
      const sortedItems = itemsWithOrder.sort((a, b) => {
        // First sort by category_id, then by order
        if (a.category_id !== b.category_id) {
          return (a.category_id || '').localeCompare(b.category_id || '');
        }
        return (a.order || 0) - (b.order || 0);
      });

      // If both are empty, there might be an initialization issue
      if (!categoriesData || categoriesData.length === 0) {
        console.warn(
          '⚠️ No categories found. Database might need initialization.'
        );
      }

      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setItems(sortedItems);
    } catch (err) {
      console.error('❌ Data fetch error:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load data';
      console.error('Full error details:', {
        error: err,
        message: errorMessage,
        type: typeof err,
      });
      setError(errorMessage);
      // Set empty arrays on error so app doesn't crash
      setCategories([]);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    // Check server health first, then fetch data
    const initData = async () => {
      try {
        const healthCheck = await fetch(
          'https://eoaissoqwlfvfizfomax.supabase.co/functions/v1/make-server-4050140e/health',
          {
            headers: {
              Authorization: `Bearer ${await import('./config/supabase').then(m => m.publicAnonKey)}`,
            },
          }
        ).catch(() => null);

        if (healthCheck && healthCheck.ok) {
          console.log('✅ Server health check passed');
        } else {
          console.warn('⚠️ Server health check failed');
        }
      } catch (err) {
        console.warn('⚠️ Could not check server health:', err);
      }

      // Fetch data regardless of health check
      await fetchAllData();
    };

    const timer = setTimeout(initData, 100);
    return () => clearTimeout(timer);
  }, [fetchAllData]);

  // Auto-refresh for visitors to see admin changes
  useEffect(() => {
    // Only run auto-refresh for visitors (not in admin mode)
    const isAdmin =
      window.location.pathname.includes('/admin') ||
      window.location.hash.includes('admin') ||
      window.location.pathname.includes('admin');

    if (isAdmin) {
      console.log('🚫 Skipping auto-refresh in admin mode');
      return; // Skip auto-refresh in admin mode
    }

    // Periodic refresh every 30 seconds
    const interval = setInterval(async () => {
      try {
        console.log('🔄 Auto-refreshing menu data for visitors...');
        await fetchAllData();
      } catch (err) {
        console.warn('⚠️ Auto-refresh failed:', err);
      }
    }, 30000); // 30 seconds

    // Refresh on tab focus (when user comes back to tab)
    const handleFocus = async () => {
      try {
        console.log('🔄 Tab focused, refreshing menu data...');
        await fetchAllData();
      } catch (err) {
        console.warn('⚠️ Focus refresh failed:', err);
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchAllData]);

  // Helper to get items for a specific category with caching and SWR
  const getCategoryItems = useCallback(
    async (
      categoryId: string,
      options: { preferCache?: boolean } = { preferCache: true }
    ): Promise<Item[]> => {
      const cacheKey = `items:${categoryId}`;
      const now = Date.now();

      // Check in-memory cache first
      const cached = itemsCache[categoryId];
      if (cached && options.preferCache) {
        const isFresh = now - cached.timestamp < ITEMS_CACHE_TTL;

        if (isFresh) {
          // Cache is fresh, return immediately
          return cached.data;
        } else {
          // Cache is stale, return it but revalidate in background

          // Return stale data immediately for instant UI
          const staleData = cached.data;

          // Revalidate in background
          (async () => {
            try {
              const freshDataRaw = await itemsAPI.getAll(categoryId);
              // Filter out any invalid items
              const freshData = Array.isArray(freshDataRaw)
                ? freshDataRaw.filter(
                    item =>
                      item &&
                      typeof item === 'object' &&
                      item.category_id !== undefined
                )
                : [];

              // Check if data actually changed
              if (JSON.stringify(freshData) !== JSON.stringify(staleData)) {
                // Update cache
                const newCache = { data: freshData, timestamp: now };
                setItemsCache(prev => ({ ...prev, [categoryId]: newCache }));

                // Save to IndexedDB
                await idb.set(cacheKey, newCache);

                // Show toast notification
                toast.info('Menu updated', {
                  description: 'New items available',
                  duration: 2000,
                });
              } else {
                // Data unchanged, just update timestamp
                const newCache = { data: freshData, timestamp: now };
                setItemsCache(prev => ({ ...prev, [categoryId]: newCache }));
                await idb.set(cacheKey, newCache);
              }
            } catch (err) {
              console.warn(
                `⚠️  Background revalidation failed for ${categoryId}:`,
                err
              );
            }
          })();

          return staleData;
        }
      }

      // Cache miss - try IndexedDB
      const idbCache = await idb.get<ItemsCache>(cacheKey);

      if (idbCache && now - idbCache.timestamp < ITEMS_CACHE_TTL) {
        // Restore to in-memory cache
        setItemsCache(prev => ({ ...prev, [categoryId]: idbCache }));
        return idbCache.data;
      }

      // No cache - fetch from network
      try {
        const freshDataRaw = await itemsAPI.getAll(categoryId);
        // Filter out any invalid items
        const freshData = Array.isArray(freshDataRaw)
          ? freshDataRaw.filter(
              item =>
                item &&
                typeof item === 'object' &&
                item.category_id !== undefined
          )
          : [];

        const newCache = { data: freshData, timestamp: now };

        // Update in-memory cache
        setItemsCache(prev => ({ ...prev, [categoryId]: newCache }));

        // Save to IndexedDB
        await idb.set(cacheKey, newCache);

        return freshData;
      } catch (err) {
        console.error(
          `❌ Failed to fetch items for category ${categoryId}:`,
          err
        );
        // If we have stale IndexedDB data, use it as fallback
        if (idbCache) {
          return idbCache.data;
        }
        // Return empty array instead of throwing to prevent app crash
        console.warn(`⚠️ Returning empty array for category ${categoryId}`);
        return [];
      }
    },
    [itemsCache]
  );

  // Prefetch items for a category
  const prefetchCategory = useCallback(
    async (categoryId: string) => {
      try {
        // Only prefetch if not in cache or stale
        const cached = itemsCache[categoryId];
        const now = Date.now();

        if (cached && now - cached.timestamp < ITEMS_CACHE_TTL) {
          // Already fresh in cache, skip
          return;
        }

        await getCategoryItems(categoryId, { preferCache: false });
      } catch (err) {
        // Silent fail for prefetch
        console.warn(`Prefetch failed for ${categoryId}:`, err);
      }
    },
    [itemsCache, getCategoryItems]
  );

  // Refetch function for admin updates - FORCE DATABASE MODE
  const refetch = useCallback(async () => {
    console.log('🔄 Manual refetch triggered - FORCING DATABASE MODE');

    // Clear in-memory category-items cache used by category views
    setItemsCache({});

    // Clear API-level caches
    const { categoriesAPI, itemsAPI } = await import('./supabase');
    categoriesAPI.clearCache();

    // Clear any cached data

    if (typeof window !== 'undefined') {
      // Clear any localStorage caches used by free plan/static
      localStorage.removeItem('piko-categories');
      localStorage.removeItem('piko-items');
      localStorage.removeItem('piko-cache');
      localStorage.removeItem('menu_cache');
    }

    // FORCE DATABASE MODE: Always fetch from Supabase, ignore static files
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 FORCING DATABASE FETCH (ignoring static files)');
      const [freshCategories, freshItemsRaw] = await Promise.all([
        categoriesAPI.getAll(),
        itemsAPI.getAll(),
      ]);

      const freshItems = Array.isArray(freshItemsRaw)
        ? freshItemsRaw.filter(
            item =>
              item && typeof item === 'object' && item.category_id !== undefined
        )
        : [];

      const itemsWithOrder = freshItems.map((item, index) => ({
        ...item,
        order: item.order ?? index,
      }));

      const sortedItems = itemsWithOrder.sort((a, b) => {
        if (a.category_id !== b.category_id) {
          return (a.category_id || '').localeCompare(b.category_id || '');
        }
        return (a.order || 0) - (b.order || 0);
      });

      setCategories(Array.isArray(freshCategories) ? freshCategories : []);
      setItems(sortedItems);
      console.log('✅ Manual refetch completed - DATABASE MODE');
    } catch (err) {
      console.error(
        '❌ Admin refetch failed, falling back to static-first:',
        err
      );
      await fetchAllData();
    } finally {
      setLoading(false);
    }
  }, [fetchAllData]);

  return (
    <DataContext.Provider
      value={{
        categories,
        items,
        loading,
        error,
        refetch,
        getCategoryItems,
        prefetchCategory,
      }}
    >
      {loading ? (
        <PikoLoader />
      ) : error ? (
        <div className='min-h-screen flex items-center justify-center bg-background p-4'>
          <div className='text-start space-y-4 max-w-md'>
            <div className='text-5xl'>😔</div>
            <h2 className='text-xl font-medium'>Cannot Connect to Server</h2>
            <div className='space-y-2'>
              <p className='text-sm text-muted-foreground'>
                The menu data couldn't be loaded. This might be because:
              </p>
              <ul className='text-xs text-muted-foreground text-start space-y-1 bg-muted/30 p-3 rounded-lg'>
                <li>• The server is starting up (wait a moment)</li>
                <li>• Network connection issue</li>
                <li>• Database needs initialization</li>
              </ul>
              <p className='text-xs text-red-500/80 font-mono bg-red-50 dark:bg-red-950/20 p-2 rounded'>
                {error}
              </p>
            </div>
            <div className='flex flex-col gap-2'>
              <div className='flex gap-2 justify-center'>
                <button
                  onClick={refetch}
                  className='px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:brightness-110 transition-all'
                >
                  Retry Connection
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className='px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-all'
                >
                  Refresh Page
                </button>
              </div>
              <button
                onClick={async () => {
                  console.log('🔍 Connection diagnostics not available');
                }}
                className='px-3 py-1 text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-500/20 transition-all'
              >
                Run Diagnostics (check console)
              </button>
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}
