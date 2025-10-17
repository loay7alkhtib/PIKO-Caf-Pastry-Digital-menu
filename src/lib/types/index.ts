// Database types
export interface Category {
  id: string;
  names: { en: string; tr: string; ar: string };
  icon: string;
  image?: string;
  color?: string; // Category color for theming
  order: number;
  created_at: string;
}

export interface ItemVariant {
  size: string; // e.g., "Small", "Medium", "Large"
  price: number;
}

export interface Item {
  id: string;
  names: { en: string; tr: string; ar: string };
  descriptions?: { en?: string; tr?: string; ar?: string }; // Optional descriptions
  category_id: string | null;
  price: number; // Base price (used if no variants)
  image: string | null;
  tags: string[];
  variants?: ItemVariant[]; // Optional size variants
  is_available?: boolean; // Availability status
  created_at: string;
}

export interface Order {
  id: string;
  items: {
    id: string;
    quantity: number;
    name: string;
    price: number;
    size?: string; // Optional size variant
  }[];
  total: number;
  status: 'pending' | 'completed';
  created_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading?: boolean;
}

// Session types
export interface Session {
  access_token: string;
  user: {
    email: string;
    name?: string;
    isAdmin?: boolean;
    id?: string;
  };
}

// Cart types
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  size?: string; // Size variant (e.g., "Small", "Medium", "Large")
}

// Language types
export type Lang = 'en' | 'tr' | 'ar';

// Navigation types
export type Page =
  | 'home'
  | 'category'
  | 'login'
  | 'signup'
  | 'admin-login'
  | 'admin';
