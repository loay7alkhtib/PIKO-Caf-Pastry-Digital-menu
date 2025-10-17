import { supabaseConfig } from './supabase-credentials';

// Get project ID from URL (either from environment variable or config file)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || supabaseConfig.url;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || supabaseConfig.anonKey;

export const projectId =
  supabaseUrl?.match(/https:\/\/(.+?)\.supabase\.co/)?.[1] || '';
export const publicAnonKey = supabaseKey || '';
