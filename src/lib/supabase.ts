import { publicAnonKey } from './config/supabase';
import { clearSession, loadSession, saveSession } from './sessionManager';
import type { Category, Item, Session } from './types';
// import { createClient } from '@supabase/supabase-js';

// Simple auth state management
let currentSession: Session | null = null;

// API base URL
const API_BASE =
  'https://eoaissoqwlfvfizfomax.supabase.co/functions/v1/make-server-4050140e';

// Direct Supabase client for KV store access (unused but kept for future use)
// const _supabaseClient = createClient(
//   'https://eoaissoqwlfvfizfomax.supabase.co',
//   publicAnonKey,
// );

// Simple cache for categories (5 minutes TTL)
let categoriesCache: { data: Category[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper function for API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${publicAnonKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Removed KV store access functions - using direct table access now

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    // Check cache first
    if (categoriesCache && Date.now() - categoriesCache.timestamp < CACHE_TTL) {
      console.log('✅ Using cached categories');
      return categoriesCache.data;
    }

    // Use Edge Function with simplified JSONB structure
    console.log('🔄 Fetching categories from Edge Function...');
    const data = await apiCall('/categories');

    // Update cache
    categoriesCache = {
      data,
      timestamp: Date.now(),
    };

    return data;
  },

  create: async (data: Omit<Category, 'id' | 'created_at'>) => {
    const result = await apiCall('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    categoriesCache = null; // Invalidate cache
    return result;
  },

  update: async (id: string, data: Omit<Category, 'id' | 'created_at'>) => {
    const result = await apiCall(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    categoriesCache = null; // Invalidate cache
    return result;
  },

  delete: async (id: string) => {
    const result = await apiCall(`/categories/${id}`, {
      method: 'DELETE',
    });
    categoriesCache = null; // Invalidate cache
    return result;
  },

  clearCache: () => {
    categoriesCache = null; // Clear cache
  },
};

// Items API
export const itemsAPI = {
  getAll: async (categoryId?: string) => {
    // Use Edge Function with simplified JSONB structure
    console.log('🔄 Fetching items from Edge Function...');
    const query = categoryId ? `?category_id=${categoryId}` : '';
    const result = await apiCall(`/items${query}`);
    console.log('📊 Edge Function items result:', result?.length || 0, 'items');
    return result;
  },

  create: (data: Omit<Item, 'id' | 'created_at'>) =>
    apiCall('/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Omit<Item, 'id' | 'created_at'>) =>
    apiCall(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiCall(`/items/${id}`, {
      method: 'DELETE',
    }),

  deleteAll: () =>
    apiCall('/items/bulk/delete-all', {
      method: 'DELETE',
    }),

  bulkCreate: (items: Omit<Item, 'id' | 'created_at'>[]) =>
    apiCall('/items/bulk/create', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),

  updateOrder: async (orderUpdates: { id: string; order: number }[]) => {
    console.log('🔄 Calling updateOrder API endpoint...');
    console.log('📊 Order updates payload:', orderUpdates);
    try {
      const result = await apiCall('/items/bulk/update-order', {
        method: 'PUT',
        body: JSON.stringify({ orderUpdates }),
      });
      console.log('✅ updateOrder API success:', result);
      return result;
    } catch (error) {
      console.error('❌ updateOrder API error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  },

  // Individual item updates for drag & drop reordering (since bulk endpoint doesn't exist)
  batchUpdateOrder: async (
    orderUpdates: { id: string; order: number }[],
    categoryId: string
  ) => {
    console.log('🔄 Calling batchUpdateOrder with individual updates...');
    console.log('📊 Batch update payload:', { orderUpdates, categoryId });
    try {
      // Since bulk endpoint doesn't exist, update each item individually
      // First, get all current item data to preserve existing fields
      const currentItems = await itemsAPI.getAll();
      const itemsMap = new Map(currentItems.map(item => [item.id, item]));

      const updatePromises = orderUpdates.map(async update => {
        console.log(`🔄 Updating item ${update.id} to order ${update.order}`);

        const currentItem = itemsMap.get(update.id);
        if (!currentItem) {
          throw new Error(`Item ${update.id} not found`);
        }

        // Update only the sort_order field, preserve all other fields
        return await apiCall(`/items/${update.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            names: currentItem.names,
            descriptions: currentItem.descriptions,
            category_id: currentItem.category_id,
            price: currentItem.price,
            image: currentItem.image,
            tags: currentItem.tags,
            variants: currentItem.variants,
            order: update.order, // Use 'order' field name as expected by the API
          }),
        });
      });

      const results = await Promise.all(updatePromises);
      const errors = results.filter(result => result.error);

      if (errors.length > 0) {
        console.error('❌ Some item updates failed:', errors);
        throw new Error(`Failed to update ${errors.length} items`);
      }

      console.log('✅ batchUpdateOrder completed successfully');
      return { success: true, count: orderUpdates.length };
    } catch (error) {
      console.error('❌ batchUpdateOrder API error:', error);
      throw error;
    }
  },
};

// Orders API
export const ordersAPI = {
  getAll: () => apiCall('/orders'),

  create: (data: { items: any[]; total: number }) =>
    apiCall('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, status: 'pending' | 'completed') =>
    apiCall(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

// Auth API (custom implementation)
export const authAPI = {
  signUp: async (credentials: {
    email: string;
    password: string;
    name: string;
  }) => {
    try {
      console.log('🚀 Calling signup API with:', {
        email: credentials.email,
        name: credentials.name,
      });
      console.log('📡 API endpoint:', `${API_BASE}/auth/signup`);

      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(credentials),
      });

      console.log(
        '📥 Signup response status:',
        response.status,
        response.statusText
      );

      const responseText = await response.text();
      console.log('📄 Signup response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('✅ Parsed response:', data);
      } catch (e) {
        console.error('❌ Failed to parse response:', e);
        console.error('Raw response was:', responseText);
        throw new Error('Invalid server response');
      }

      if (!response.ok) {
        console.error('❌ Signup failed with status:', response.status);
        console.error('❌ Error from server:', data.error);
        console.error('❌ Full error response:', data);
        throw new Error(data.error || `Signup failed (${response.status})`);
      }

      console.log('🎉 Signup successful! Setting session...');
      console.log('📊 Full response data:', data);
      console.log('📊 Session data received:', data.data?.session);

      // Validate session structure before setting
      if (data.data?.session && data.data.session.user) {
        currentSession = data.data.session;
        // Store session using session manager
        saveSession(data.data.session);
      } else {
        console.error(
          '❌ Invalid session structure received:',
          data.data?.session
        );
        throw new Error('Invalid session received from server');
      }

      console.log('✅ Signup complete!');
      return { data, error: null };
    } catch (error: any) {
      console.error('💥 Signup exception:', error);
      console.error('💥 Error message:', error.message);
      throw error;
    }
  },

  signInWithPassword: async (credentials: {
    email: string;
    password: string;
  }) => {
    console.log('🔐 Attempting login for:', credentials.email);

    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(credentials),
    });

    console.log('📥 Login response status:', response.status);

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: 'Login failed' }));
      console.error('❌ Login failed:', error);
      throw new Error(error.error || 'Invalid credentials');
    }

    const data = await response.json();
    console.log('✅ Login successful!');
    console.log('📊 Full response data:', data);
    console.log('📊 Session data received:', data.data?.session);

    // Validate session structure before setting
    if (data.data?.session && data.data.session.user) {
      currentSession = data.data.session;
      // Store session using session manager
      saveSession(data.data.session);
    } else {
      console.error(
        '❌ Invalid session structure received:',
        data.data?.session
      );
      throw new Error('Invalid session received from server');
    }

    return { data, error: null };
  },

  getSession: async () => {
    // Try to get from memory first
    if (currentSession) {
      console.log('✅ Session found in memory');
      return { data: { session: currentSession }, error: null };
    }

    // Try to load from storage using session manager
    const storedSession = loadSession();

    if (storedSession) {
      currentSession = storedSession;

      // For now, use local session without server verification
      // TODO: Fix server session verification endpoint
      console.log('✅ Using local session (server verification disabled)');
      return { data: { session: storedSession }, error: null };
    }

    console.log('❌ No session found');
    return { data: { session: null }, error: null };
  },

  signOut: async () => {
    if (currentSession) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${currentSession.access_token}`,
          },
        });
      } catch (e) {
        console.error('Logout error:', e);
      }
    }

    currentSession = null;
    clearSession();

    return { error: null };
  },
};

// Export a compatible auth object for backward compatibility
export const supabase = {
  auth: authAPI,
};

// Re-export types for convenience
export type { Category, Item, ItemVariant, Order, Session } from './types';
