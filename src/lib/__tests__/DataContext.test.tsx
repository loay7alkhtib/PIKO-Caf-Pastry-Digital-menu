import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { DataProvider, useData } from '../DataContext';
import { LangProvider } from '../LangContext';
import type { Category, Item } from '../types';

// Mock the supabase module
vi.mock('../supabase', () => ({
  itemsAPI: {
    getItems: vi.fn(),
    getAll: vi.fn(),
  },
  categoriesAPI: {
    getAll: vi.fn(),
  },
}));

// Mock the idb module
vi.mock('../idb', () => ({
  get: vi.fn(),
  set: vi.fn(),
}));

// Mock the config
vi.mock('../config/supabase', () => ({
  publicAnonKey: 'test-key',
}));

// Mock PikoLoader
vi.mock('../../components/PikoLoader', () => ({
  default: () => <div data-testid='piko-loader'>Loading...</div>,
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
  },
}));

const mockCategories: Category[] = [
  {
    id: 'cat-1',
    names: { en: 'Beverages', tr: 'İçecekler', ar: 'المشروبات' },
    icon: '☕',
    order: 0,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat-2',
    names: { en: 'Desserts', tr: 'Tatlılar', ar: 'الحلويات' },
    icon: '🍰',
    order: 1,
    created_at: '2024-01-01T00:00:00Z',
  },
];

const mockItems: Item[] = [
  {
    id: 'item-1',
    names: { en: 'Coffee', tr: 'Kahve', ar: 'قهوة' },
    category_id: 'cat-1',
    price: 15.99,
    image: 'coffee.jpg',
    tags: ['hot', 'beverage'],
    is_available: true,
    order: 0,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'item-2',
    names: { en: 'Cake', tr: 'Kek', ar: 'كيك' },
    category_id: 'cat-2',
    price: 25.5,
    image: 'cake.jpg',
    tags: ['sweet', 'dessert'],
    is_available: true,
    order: 0,
    created_at: '2024-01-01T00:00:00Z',
  },
];

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LangProvider>
    <DataProvider>{children}</DataProvider>
  </LangProvider>
);

describe('DataContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch for health check
    global.fetch = vi.fn();
  });

  it('should initialize with loading state', async () => {
    const { result } = renderHook(() => useData(), { wrapper });

    // Wait for the context to be available
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // Check that context is available
    expect(result.current).toBeDefined();
    expect(result.current.loading).toBe(true);
    expect(result.current.categories).toEqual([]);
    expect(result.current.items).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should handle successful data fetch', async () => {
    const { itemsAPI, categoriesAPI } = await import('../supabase');

    vi.mocked(categoriesAPI.getAll).mockResolvedValue(mockCategories);
    vi.mocked(itemsAPI.getAll).mockResolvedValue(mockItems);
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);

    const { result } = renderHook(() => useData(), { wrapper });

    // Wait for async operations to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.categories).toEqual(mockCategories);
    expect(result.current.items).toEqual(mockItems);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch error', async () => {
    const { itemsAPI, categoriesAPI } = await import('../supabase');

    const errorMessage = 'Network error';
    vi.mocked(categoriesAPI.getAll).mockRejectedValue(new Error(errorMessage));
    vi.mocked(itemsAPI.getAll).mockRejectedValue(new Error(errorMessage));
    vi.mocked(global.fetch).mockRejectedValue(new Error('Health check failed'));

    const { result } = renderHook(() => useData(), { wrapper });

    // Wait for async operations to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    // Check that context is available
    expect(result.current).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.categories).toEqual([]);
    expect(result.current.items).toEqual([]);
  });

  it('should filter out invalid items', async () => {
    const { itemsAPI, categoriesAPI } = await import('../supabase');

    const invalidItems = [
      null,
      undefined,
      {
        id: 'valid-item',
        names: { en: 'Valid' },
        category_id: 'cat-1',
        price: 10,
        order: 0,
        created_at: '2024-01-01',
      },
      { id: 'invalid-item' }, // Missing required fields
    ];

    vi.mocked(categoriesAPI.getAll).mockResolvedValue(mockCategories);
    vi.mocked(itemsAPI.getAll).mockResolvedValue(invalidItems);
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);

    const { result } = renderHook(() => useData(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe('valid-item');
  });

  it('should sort items by category and order', async () => {
    const { itemsAPI, categoriesAPI } = await import('../supabase');

    const unsortedItems: Item[] = [
      {
        id: 'item-3',
        names: { en: 'Item 3', tr: 'Öğe 3', ar: 'عنصر 3' },
        category_id: 'cat-1',
        price: 10,
        order: 2,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'item-1',
        names: { en: 'Item 1', tr: 'Öğe 1', ar: 'عنصر 1' },
        category_id: 'cat-1',
        price: 10,
        order: 0,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'item-2',
        names: { en: 'Item 2', tr: 'Öğe 2', ar: 'عنصر 2' },
        category_id: 'cat-2',
        price: 10,
        order: 0,
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    vi.mocked(categoriesAPI.getAll).mockResolvedValue(mockCategories);
    vi.mocked(itemsAPI.getAll).mockResolvedValue(unsortedItems);
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);

    const { result } = renderHook(() => useData(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const sortedItems = result.current.items;
    expect(sortedItems[0].id).toBe('item-1'); // cat-1, order 0
    expect(sortedItems[1].id).toBe('item-3'); // cat-1, order 2
    expect(sortedItems[2].id).toBe('item-2'); // cat-2, order 0
  });

  it('should provide refetch function', async () => {
    const { result } = renderHook(() => useData(), { wrapper });

    // Wait for the context to be available
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(typeof result.current.refetch).toBe('function');
  });

  it('should provide getCategoryItems function', async () => {
    const { result } = renderHook(() => useData(), { wrapper });

    // Wait for the context to be available
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(typeof result.current.getCategoryItems).toBe('function');
  });

  it('should provide prefetchCategory function', async () => {
    const { result } = renderHook(() => useData(), { wrapper });

    // Wait for the context to be available
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(typeof result.current.prefetchCategory).toBe('function');
  });
});
