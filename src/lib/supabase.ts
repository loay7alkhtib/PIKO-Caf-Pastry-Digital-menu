import { clearSession, loadSession, saveSession } from './sessionManager';
import type { Category, Item, Session } from './types';
import { isStaticDataSourceEnabled } from './staticMenu';
import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './config/supabase-credentials';

type RequestInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

const STATIC_MODE = isStaticDataSourceEnabled();

let currentSession: Session | null = null;

// Create Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || supabaseConfig.url;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || supabaseConfig.anonKey;

// Create mock client for static mode
const createMockClient = () => {
  const mockError = () => ({
    data: null,
    error: new Error(
      'Supabase DB is not configured or is disabled in static mode.',
    ),
  });

  const authError = () => ({
    data: null,
    error: new Error(
      'Supabase Auth is not configured or is disabled in static mode.',
    ),
  });

  const storageError = () => ({
    data: null,
    error: new Error(
      'Supabase Storage is not configured or is disabled in static mode.',
    ),
  });

  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => mockError(),
        }),
        order: () => mockError(),
      }),
      insert: () => ({
        select: () => mockError(),
      }),
      update: () => ({
        eq: () => ({
          select: () => mockError(),
        }),
      }),
      delete: () => ({
        eq: () => mockError(),
        neq: () => mockError(),
      }),
      remove: () => ({
        eq: () => mockError(),
      }),
    }),
    auth: {
      signUp: async () => authError(),
      signInWithPassword: async () => authError(),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      admin: {
        createUser: async () => authError(),
        deleteUser: async () => ({
          data: null,
          error: new Error('Supabase Auth disabled'),
        }),
      },
    },
    storage: {
      from: () => ({
        upload: async () => storageError(),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        remove: async () => ({ error: null }),
      }),
    },
  } as unknown;
};

const supabaseClient = STATIC_MODE
  ? createMockClient()
  : createClient(supabaseUrl, supabaseAnonKey);

// Export supabaseClient for direct access
export { supabaseClient };

let categoriesCache: { data: Category[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

// Legacy API call function - now using Supabase client directly
async function apiCall(_endpoint: string, _options: RequestInit = {}) {
  if (STATIC_MODE) {
    throw new Error('Supabase API is disabled in static data mode');
  }
  throw new Error('apiCall is deprecated - use Supabase client directly');
}

export const categoriesAPI = {
  getAll: async () => {
    if (STATIC_MODE) throw new Error('Categories API disabled in static mode');
    if (categoriesCache && Date.now() - categoriesCache.timestamp < CACHE_TTL) {
      return categoriesCache.data;
    }

    const { data, error } = await supabaseClient
      .from('categories')
      .select('*')
      .order('order');
    if (error) throw error;

    // Map database fields to client format
    const mappedData = data.map((category: Record<string, unknown>) => ({
      ...category,
      image: category.image_url || category.image, // Use image_url if available, fallback to image
    }));

    categoriesCache = { data: mappedData, timestamp: Date.now() };
    return mappedData;
  },
  create: async (data: Omit<Category, 'id' | 'created_at'>) => {
    if (STATIC_MODE) throw new Error('Categories API disabled in static mode');
    categoriesCache = null;

    // Map image field to image_url for database compatibility
    const insertData: Record<string, unknown> = { ...data };
    if (data.image !== undefined) {
      insertData.image_url = data.image;
      delete insertData.image;
    }

    const { data: result, error } = await supabaseClient
      .from('categories')
      .insert(insertData)
      .select();
    if (error) throw error;
    return result;
  },
  update: async (id: string, data: Omit<Category, 'id' | 'created_at'>) => {
    if (STATIC_MODE) throw new Error('Categories API disabled in static mode');
    categoriesCache = null;

    // Map image field to image_url for database compatibility
    const updateData: Record<string, unknown> = { ...data };
    if (data.image !== undefined) {
      updateData.image_url = data.image;
      delete updateData.image;
    }

    const { data: result, error } = await supabaseClient
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select();
    if (error) throw error;
    return result;
  },
  delete: async (id: string) => {
    if (STATIC_MODE) throw new Error('Categories API disabled in static mode');
    categoriesCache = null;

    const { error } = await supabaseClient
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return null;
  },
  clearCache: () => {
    categoriesCache = null;
  },
  updateOrder: async (orderUpdates: { id: string; order: number }[]) => {
    if (STATIC_MODE) throw new Error('Categories API disabled in static mode');
    categoriesCache = null;

    console.log('🔄 Updating category orders:', orderUpdates);

    // Use a transaction-like approach with Promise.all for better performance
    const updatePromises = orderUpdates.map(({ id, order }) =>
      supabaseClient.from('categories').update({ order }).eq('id', id),
    );

    const results = await Promise.all(updatePromises);

    // Check for any errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('❌ Some category order updates failed:', errors);
      throw new Error(`Failed to update ${errors.length} categories`);
    }

    console.log('✅ All category orders updated successfully');
    return results;
  },
};

export const itemsAPI = {
  getAll: async (categoryId?: string) => {
    if (STATIC_MODE) throw new Error('Items API disabled in static mode');

    let query = supabaseClient.from('items').select('*').order('order');
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;
    // Normalize fields: ensure image is properly handled and default order
    const mapped = (data || []).map(
      (item: Record<string, unknown>, index: number) => ({
        ...item,
        image: item.image ?? null,
        order: item.order ?? index,
      }),
    );
    return mapped;
  },
  create: async (data: Omit<Item, 'id' | 'created_at'>) => {
    if (STATIC_MODE) throw new Error('Items API disabled in static mode');

    // Items table uses 'image' field directly (not image_url)
    const insertData: Record<string, unknown> = { ...data };

    const { data: result, error } = await supabaseClient
      .from('items')
      .insert(insertData)
      .select();
    if (error) throw error;
    return result;
  },
  update: async (id: string, data: Omit<Item, 'id' | 'created_at'>) => {
    if (STATIC_MODE) throw new Error('Items API disabled in static mode');

    // Items table uses 'image' field directly (not image_url)
    const updateData: Record<string, unknown> = { ...data };

    const { data: result, error } = await supabaseClient
      .from('items')
      .update(updateData)
      .eq('id', id)
      .select();
    if (error) throw error;
    return result;
  },
  delete: async (id: string) => {
    if (STATIC_MODE) throw new Error('Items API disabled in static mode');

    const { error } = await supabaseClient.from('items').delete().eq('id', id);
    if (error) throw error;
    return null;
  },
  deleteAll: async () => {
    if (STATIC_MODE) throw new Error('Items API disabled in static mode');

    const { error } = await supabaseClient
      .from('items')
      .delete()
      .neq('id', '0');
    if (error) throw error;
    return [];
  },
  bulkCreate: async (items: Omit<Item, 'id' | 'created_at'>[]) => {
    if (STATIC_MODE) throw new Error('Items API disabled in static mode');

    const { data: result, error } = await supabaseClient
      .from('items')
      .insert(items)
      .select();
    if (error) throw error;
    return result;
  },
  updateOrder: async (orderUpdates: { id: string; order: number }[]) => {
    if (STATIC_MODE) throw new Error('Items API disabled in static mode');

    const promises = orderUpdates.map(update =>
      supabaseClient
        .from('items')
        .update({ order: update.order })
        .eq('id', update.id),
    );

    const results = await Promise.all(promises);
    const errors = results.filter(r => r.error);
    if (errors.length > 0) throw errors[0]?.error || new Error('Unknown error');
    return results;
  },
};

export const ordersAPI = {
  getAll: () => {
    if (STATIC_MODE) throw new Error('Orders API disabled in static mode');
    return apiCall('/orders');
  },
  create: (data: {
    items: Array<{ id: string; quantity: number; price: number }>;
    total: number;
  }) => {
    if (STATIC_MODE) throw new Error('Orders API disabled in static mode');
    return apiCall('/orders', { method: 'POST', body: JSON.stringify(data) });
  },
  update: (id: string, status: 'pending' | 'completed') => {
    if (STATIC_MODE) throw new Error('Orders API disabled in static mode');
    return apiCall(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};

// Initialize auth state change listener
let authStateListenerInitialized = false;

const initializeAuthStateListener = () => {
  if (STATIC_MODE || authStateListenerInitialized) return;

  authStateListenerInitialized = true;

  supabaseClient.auth.onAuthStateChange((event: string, session: unknown) => {
    console.warn(
      '🔄 Auth state changed:',
      event,
      session ? 'session exists' : 'no session',
    );

    if (
      event === 'SIGNED_IN' &&
      session &&
      typeof session === 'object' &&
      'access_token' in session
    ) {
      const sessionData: Session = {
        access_token: (session as { access_token: string }).access_token,
        user: {
          id: (session as { user: { id: string } }).user.id,
          email: (session as { user: { email?: string } }).user.email || '',
          name:
            (session as { user: { user_metadata?: { name?: string } } }).user
              .user_metadata?.name || '',
          isAdmin:
            (session as { user: { user_metadata?: { isAdmin?: boolean } } })
              .user.user_metadata?.isAdmin || false,
        },
      };
      saveSession(sessionData);
      currentSession = sessionData;
      console.warn('✅ Session saved on sign in');
    } else if (event === 'SIGNED_OUT') {
      currentSession = null;
      clearSession();
      console.warn('✅ Session cleared on sign out');
    } else if (
      event === 'TOKEN_REFRESHED' &&
      session &&
      typeof session === 'object' &&
      'access_token' in session
    ) {
      const sessionData: Session = {
        access_token: (session as { access_token: string }).access_token,
        user: {
          id: (session as { user: { id: string } }).user.id,
          email: (session as { user: { email?: string } }).user.email || '',
          name:
            (session as { user: { user_metadata?: { name?: string } } }).user
              .user_metadata?.name || '',
          isAdmin:
            (session as { user: { user_metadata?: { isAdmin?: boolean } } })
              .user.user_metadata?.isAdmin || false,
        },
      };
      saveSession(sessionData);
      currentSession = sessionData;
      console.warn('✅ Session refreshed');
    }
  });
};

export const authAPI = {
  signUp: async (credentials: {
    email: string;
    password: string;
    name: string;
  }) => {
    if (STATIC_MODE) throw new Error('Auth API disabled in static mode');

    initializeAuthStateListener();
    const { data, error } = await supabaseClient.auth.signUp(credentials);
    if (error) throw error;

    if (data.session) {
      const session: Session = {
        access_token: data.session.access_token,
        user: {
          id: data.session.user.id,
          email: data.session.user.email || '',
          name: data.session.user.user_metadata?.name || '',
          isAdmin: data.session.user.user_metadata?.isAdmin || false,
        },
      };
      saveSession(session);
      currentSession = session;
    }
    return data;
  },
  signInWithPassword: async (credentials: {
    email: string;
    password: string;
  }) => {
    if (STATIC_MODE) throw new Error('Auth API disabled in static mode');

    initializeAuthStateListener();
    const { data, error } =
      await supabaseClient.auth.signInWithPassword(credentials);
    if (error) throw error;

    if (data.session) {
      const session: Session = {
        access_token: data.session.access_token,
        user: {
          id: data.session.user.id,
          email: data.session.user.email || '',
          name: data.session.user.user_metadata?.name || '',
          isAdmin: data.session.user.user_metadata?.isAdmin || false,
        },
      };
      saveSession(session);
      currentSession = session;
    }
    return data;
  },
  getSession: async (): Promise<
    | { data: { session: Session | null }; error: null }
    | { data: { session: null }; error: null }
  > => {
    if (STATIC_MODE) {
      console.warn('Auth API disabled in static mode, returning null session');
      return { data: { session: null }, error: null };
    }

    initializeAuthStateListener();

    if (currentSession) {
      return { data: { session: currentSession }, error: null };
    }
    const session = loadSession();
    if (session) {
      currentSession = session;
      return { data: { session }, error: null };
    }
    return { data: { session: null }, error: null };
  },
  signOut: async (): Promise<{ error: null }> => {
    if (STATIC_MODE) {
      console.warn(
        'Auth API disabled in static mode, performing local sign out',
      );
      currentSession = null;
      clearSession();
      return { error: null };
    }

    initializeAuthStateListener();
    await supabaseClient.auth.signOut();
    currentSession = null;
    clearSession();
    return { error: null };
  },
};

export const storageAPI = {
  upload: async (file: File, path: string) => {
    if (STATIC_MODE) throw new Error('Storage API disabled in static mode');

    const { data, error } = await supabaseClient.storage
      .from('menu-images')
      .upload(path, file);

    if (error) throw error;
    return data;
  },
  getPublicUrl: (path: string) => {
    if (STATIC_MODE) return '';

    const { data } = supabaseClient.storage
      .from('menu-images')
      .getPublicUrl(path);

    return data.publicUrl;
  },
  delete: async (path: string) => {
    if (STATIC_MODE) throw new Error('Storage API disabled in static mode');

    const { error } = await supabaseClient.storage
      .from('menu-images')
      .remove([path]);

    if (error) throw error;
    return null;
  },
};

export const supabase = {
  categories: categoriesAPI,
  items: itemsAPI,
  orders: ordersAPI,
  auth: authAPI,
  storage: storageAPI,
};

// Re-export types for convenience
export type { Category, Item, ItemVariant, Order, Session } from './types';

export const publicAnonKey = supabaseAnonKey || '';
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const STATIC_MODE_ENABLED = STATIC_MODE; // Export for external checks

// Mock client removed - using null for static mode

// Supabase client is already created above
