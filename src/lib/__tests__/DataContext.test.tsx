import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DataProvider, useData } from '../DataContext';
import { renderWithProviders } from '../../test/utils/test-utils';

// Mock the API calls
const mockFetchCategories = vi.fn();
const mockFetchItems = vi.fn();
const mockPrefetchCategory = vi.fn();

vi.mock('../supabase', () => ({
  categoriesAPI: {
    fetchCategories: mockFetchCategories,
  },
  itemsAPI: {
    fetchItems: mockFetchItems,
    prefetchCategory: mockPrefetchCategory,
  },
}));

const TestComponent = () => {
  const { categories, items, loading, error, refetch } = useData();

  return (
    <div>
      <div data-testid='loading'>{loading ? 'Loading...' : 'Not Loading'}</div>
      <div data-testid='error'>{error || 'No Error'}</div>
      <div data-testid='categories-count'>{categories.length}</div>
      <div data-testid='items-count'>{items.length}</div>
      <button onClick={refetch}>Refetch</button>
    </div>
  );
};

describe('DataContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide initial loading state', () => {
    renderWithProviders(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading...');
    expect(screen.getByTestId('error')).toHaveTextContent('No Error');
  });

  it('should fetch and provide categories data', async () => {
    const mockCategories = [
      {
        id: '1',
        names: { en: 'Beverages', tr: 'İçecekler', ar: 'المشروبات' },
        icon: '☕',
        color: '#0C6071',
        order: 0,
        is_active: true,
      },
    ];

    mockFetchCategories.mockResolvedValue(mockCategories);
    mockFetchItems.mockResolvedValue([]);

    renderWithProviders(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('categories-count')).toHaveTextContent('1');
    });

    expect(mockFetchCategories).toHaveBeenCalled();
  });

  it('should fetch and provide items data', async () => {
    const mockItems = [
      {
        id: '1',
        names: { en: 'Coffee', tr: 'Kahve', ar: 'قهوة' },
        category_id: '1',
        price: 15.5,
        is_active: true,
        order: 0,
      },
    ];

    mockFetchCategories.mockResolvedValue([]);
    mockFetchItems.mockResolvedValue(mockItems);

    renderWithProviders(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('items-count')).toHaveTextContent('1');
    });

    expect(mockFetchItems).toHaveBeenCalled();
  });

  it('should handle fetch errors', async () => {
    const errorMessage = 'Failed to fetch data';
    mockFetchCategories.mockRejectedValue(new Error(errorMessage));
    mockFetchItems.mockResolvedValue([]);

    renderWithProviders(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
    });
  });

  it('should handle refetch functionality', async () => {
    const mockCategories = [
      {
        id: '1',
        names: { en: 'Beverages', tr: 'İçecekler', ar: 'المشروبات' },
        icon: '☕',
        color: '#0C6071',
        order: 0,
        is_active: true,
      },
    ];

    mockFetchCategories.mockResolvedValue(mockCategories);
    mockFetchItems.mockResolvedValue([]);

    renderWithProviders(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    // Click refetch button
    fireEvent.click(screen.getByText('Refetch'));

    await waitFor(() => {
      expect(mockFetchCategories).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle prefetch functionality', async () => {
    const mockCategories = [
      {
        id: '1',
        names: { en: 'Beverages', tr: 'İçecekler', ar: 'المشروبات' },
        icon: '☕',
        color: '#0C6071',
        order: 0,
        is_active: true,
      },
    ];

    mockFetchCategories.mockResolvedValue(mockCategories);
    mockFetchItems.mockResolvedValue([]);
    mockPrefetchCategory.mockResolvedValue(undefined);

    renderWithProviders(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    // Test prefetch functionality
    const { prefetchCategory } = useData();
    await prefetchCategory('1');

    expect(mockPrefetchCategory).toHaveBeenCalledWith('1');
  });

  it('should handle caching', async () => {
    const mockCategories = [
      {
        id: '1',
        names: { en: 'Beverages', tr: 'İçecekler', ar: 'المشروبات' },
        icon: '☕',
        color: '#0C6071',
        order: 0,
        is_active: true,
      },
    ];

    mockFetchCategories.mockResolvedValue(mockCategories);
    mockFetchItems.mockResolvedValue([]);

    renderWithProviders(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    // Second render should use cached data
    renderWithProviders(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    // Should not call fetch again due to caching
    expect(mockFetchCategories).toHaveBeenCalledTimes(1);
  });

  it('should handle empty data states', async () => {
    mockFetchCategories.mockResolvedValue([]);
    mockFetchItems.mockResolvedValue([]);

    renderWithProviders(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('categories-count')).toHaveTextContent('0');
      expect(screen.getByTestId('items-count')).toHaveTextContent('0');
    });
  });
});
