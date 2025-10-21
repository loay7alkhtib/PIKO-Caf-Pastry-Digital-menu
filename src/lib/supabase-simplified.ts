import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://eoaissoqwlfvfizfomax.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvYWlzc29xd2xmdmZpemZvbWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTY5OTIsImV4cCI6MjA3NTMzMjk5Mn0.SHkFV9EvSnWVmC0tApVU6A6C1rrDqsPMO922rMC1JpY';

const supabase = createClient(supabaseUrl, supabaseKey);

// Simple API functions
export const categoriesAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;
    return data || [];
  },

  create: async (data: Record<string, unknown>) => {
    const { data: result, error } = await supabase
      .from('categories')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  update: async (id: string, data: Record<string, unknown>) => {
    const { data: result, error } = await supabase
      .from('categories')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    return true;
  },
};

export const itemsAPI = {
  getAll: async (categoryId?: string) => {
    let query = supabase
      .from('items')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  create: async (data: Record<string, unknown>) => {
    const { data: result, error } = await supabase
      .from('items')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  update: async (id: string, data: Record<string, unknown>) => {
    const { data: result, error } = await supabase
      .from('items')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('items')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    return true;
  },
};
