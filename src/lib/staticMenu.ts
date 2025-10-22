import type { Category, Item } from './types';

const DEFAULT_STATIC_MENU_URL = '/static/menu.json';
const MENU_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface StaticMenuFile {
  categories?: Category[];
  items?: Item[];
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

let cachedMenu: { data: StaticMenuFile; timestamp: number } | null = null;

export function isStaticDataSourceEnabled(): boolean {
  const dataSource = import.meta.env.VITE_DATA_SOURCE;
  const isAdminMode = import.meta.env.VITE_ADMIN_MODE === 'true';
  const hasSupabaseConfig = Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
  );

  console.warn('🔍 Static mode detection:', {
    dataSource,
    isAdminMode,
    hasSupabaseConfig,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'present' : 'missing',
    timestamp: new Date().toISOString(),
  });

  // Check for admin mode override FIRST - this should take precedence
  if (isAdminMode) {
    console.warn('🔧 Admin mode override: disabling static mode');
    return false; // Disable static mode for admin operations
  }

  if (typeof dataSource === 'string') {
    const isStatic = dataSource.trim().toLowerCase() === 'static';
    console.warn('📊 Data source check:', { dataSource, isStatic });
    return isStatic;
  }

  const result = !hasSupabaseConfig;
  console.warn('🔗 Supabase config check:', { hasSupabaseConfig, result });
  return result;
}

function getStaticMenuUrl(): string {
  const override = import.meta.env.VITE_STATIC_MENU_URL;
  if (override && typeof override === 'string') {
    return override;
  }
  return DEFAULT_STATIC_MENU_URL;
}

export async function loadStaticMenu(force = false): Promise<{
  categories: Category[];
  items: Item[];
  metadata: StaticMenuFile['metadata'];
}> {
  if (!force && cachedMenu) {
    const isFresh = Date.now() - cachedMenu.timestamp < MENU_CACHE_TTL;
    if (isFresh) {
      return normalizeMenu(cachedMenu.data);
    }
  }

  const response = await fetch(getStaticMenuUrl(), {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to load static menu (HTTP ${response.status})`);
  }

  const data = (await response.json()) as StaticMenuFile;

  cachedMenu = {
    data,
    timestamp: Date.now(),
  };

  return normalizeMenu(data);
}

export function clearStaticMenuCache() {
  cachedMenu = null;
}

function normalizeMenu(menu: StaticMenuFile) {
  const categories = Array.isArray(menu.categories) ? menu.categories : [];
  const items = Array.isArray(menu.items) ? menu.items : [];

  return {
    categories,
    items,
    metadata: menu.metadata,
  };
}
