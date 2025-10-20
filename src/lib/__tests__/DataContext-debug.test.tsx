import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { DataProvider, useData } from '../DataContext';

// Mock the supabase module
vi.mock('../supabase', () => ({
  itemsAPI: {
    getAll: vi.fn().mockResolvedValue([]),
  },
  categoriesAPI: {
    getAll: vi.fn().mockResolvedValue([]),
  },
}));

// Mock the idb module
vi.mock('../idb', () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
}));

// Mock fetch
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({}),
} as Response);

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <DataProvider>{children}</DataProvider>
);

describe('DataContext Debug', () => {
  it('should provide context', () => {
    const { result } = renderHook(() => useData(), { wrapper });

    console.log('Result:', result.current);
    expect(result.current).toBeDefined();
  });
});
