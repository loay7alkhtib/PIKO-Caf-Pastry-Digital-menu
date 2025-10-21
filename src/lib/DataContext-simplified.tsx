import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { categoriesAPI, itemsAPI } from './supabase';
import type { Category, Item } from './types';

interface DataContextType {
  categories: Category[];
  items: Item[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [categoriesData, itemsData] = await Promise.all([
        categoriesAPI.getAll(),
        itemsAPI.getAll(),
      ]);

      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setItems(Array.isArray(itemsData) ? itemsData : []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DataContext.Provider
      value={{
        categories,
        items,
        loading,
        error,
        refetch,
      }}
    >
      {children}
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
