import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './config/supabase-credentials';

// Create a proper Supabase client for storage operations
export const supabase = createClient(
  supabaseConfig.url,
  supabaseConfig.anonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

// Export the client for use in other components
export default supabase;
