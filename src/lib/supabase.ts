import { projectId, publicAnonKey } from './config/supabase';
import { saveSession, loadSession, clearSession } from './sessionManager';
import type { Category, Item, ItemVariant, Order, Session } from './types';

// Simple auth state management
let currentSession: Session | null = null;

// API base URL
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4050140e`;

// Simple cache for categories (5 minutes TTL)
let categoriesCache: { data: Category[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper function for API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    // Check cache first
    if (categoriesCache && Date.now() - categoriesCache.timestamp < CACHE_TTL) {
      return categoriesCache.data;
    }
    
    // Fetch from API
    const data = await apiCall('/categories');
    
    // Update cache
    categoriesCache = {
      data,
      timestamp: Date.now()
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
  getAll: (categoryId?: string) => {
    const query = categoryId ? `?category_id=${categoryId}` : '';
    return apiCall(`/items${query}`);
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
};

// Orders API
export const ordersAPI = {
  getAll: () => apiCall('/orders'),
  
  create: (data: { items: any[], total: number }) =>
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
  signUp: async (credentials: { email: string; password: string; name: string }) => {
    try {
      console.log('🚀 Calling signup API with:', { email: credentials.email, name: credentials.name });
      console.log('📡 API endpoint:', `${API_BASE}/auth/signup`);
      
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(credentials),
      });

      console.log('📥 Signup response status:', response.status, response.statusText);
      
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
      currentSession = data.session;
      
      // Store session using session manager
      saveSession(data.session);
      
      console.log('✅ Signup complete!');
      return { data, error: null };
    } catch (error: any) {
      console.error('💥 Signup exception:', error);
      console.error('💥 Error message:', error.message);
      throw error;
    }
  },

  signInWithPassword: async (credentials: { email: string; password: string }) => {
    console.log('🔐 Attempting login for:', credentials.email);
    
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(credentials),
    });

    console.log('📥 Login response status:', response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Login failed' }));
      console.error('❌ Login failed:', error);
      throw new Error(error.error || 'Invalid credentials');
    }

    const data = await response.json();
    console.log('✅ Login successful!');
    currentSession = data.session;
    
    // Store session using session manager
    saveSession(data.session);
    
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
      
      // Try to verify session is still valid (but don't fail if it can't verify)
      try {
        const response = await fetch(`${API_BASE}/auth/session`, {
          headers: {
            'Authorization': `Bearer ${storedSession.access_token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.session) {
            console.log('✅ Session verified on server');
            currentSession = data.session;
            // Update storage with verified session
            saveSession(data.session);
            return { data: { session: data.session }, error: null };
          } else {
            // Server says session is invalid - clear it
            console.log('❌ Session invalid on server');
            currentSession = null;
            clearSession();
            return { data: { session: null }, error: null };
          }
        } else {
          // Server error - but keep the local session
          console.log('⚠️ Server error during verification, using local session');
          return { data: { session: storedSession }, error: null };
        }
      } catch (verifyError) {
        // If verification request fails, keep using stored session
        console.log('⚠️ Session verification failed (network error), using local session');
        return { data: { session: storedSession }, error: null };
      }
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
            'Authorization': `Bearer ${currentSession.access_token}`,
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
