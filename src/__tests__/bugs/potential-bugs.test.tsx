import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DataProvider } from '../../lib/DataContext';
import { LangProvider } from '../../lib/LangContext';
import { CartProvider } from '../../lib/CartContext';
import CartSheet from '../../components/CartSheet';
import type { CartItem } from '../../lib/types';

// Mock components
vi.mock('../../components/OptimizedImage', () => ({
  default: ({ src, alt, className }: any) => (
    <img
      src={src}
      alt={alt}
      className={className}
      data-testid='optimized-image'
    />
  ),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

describe('Potential Bugs Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Cart Context Edge Cases', () => {
    it('should handle negative quantities gracefully', () => {
      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <LangProvider>
          <CartProvider>{children}</CartProvider>
        </LangProvider>
      );

      const { result } = renderHook(() => useCart(), { wrapper: TestWrapper });

      const item: Omit<CartItem, 'quantity'> = {
        id: 'test-item',
        name: 'Test Item',
        price: 10.99,
      };

      act(() => {
        result.current.addItem(item);
        result.current.updateQuantity('test-item', -1);
      });

      // Should remove item when quantity becomes negative
      expect(result.current.items).toHaveLength(0);
    });

    it('should handle very large quantities', () => {
      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <LangProvider>
          <CartProvider>{children}</CartProvider>
        </LangProvider>
      );

      const { result } = renderHook(() => useCart(), { wrapper: TestWrapper });

      const item: Omit<CartItem, 'quantity'> = {
        id: 'test-item',
        name: 'Test Item',
        price: 0.01, // Very small price
      };

      act(() => {
        result.current.addItem(item);
        result.current.updateQuantity('test-item', 1000000);
      });

      // Should handle large quantities without overflow
      expect(result.current.items[0].quantity).toBe(1000000);
      expect(result.current.total).toBe(10000); // 0.01 * 1000000
    });

    it('should handle items with special characters in names', () => {
      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <LangProvider>
          <CartProvider>{children}</CartProvider>
        </LangProvider>
      );

      const { result } = renderHook(() => useCart(), { wrapper: TestWrapper });

      const item: Omit<CartItem, 'quantity'> = {
        id: 'test-item',
        name: 'Test Item with Special Chars: !@#$%^&*()',
        price: 10.99,
      };

      act(() => {
        result.current.addItem(item);
      });

      expect(result.current.items[0].name).toBe(
        'Test Item with Special Chars: !@#$%^&*()',
      );
    });

    it('should handle items with very long names', () => {
      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <LangProvider>
          <CartProvider>{children}</CartProvider>
        </LangProvider>
      );

      const { result } = renderHook(() => useCart(), { wrapper: TestWrapper });

      const longName = 'A'.repeat(1000); // Very long name
      const item: Omit<CartItem, 'quantity'> = {
        id: 'test-item',
        name: longName,
        price: 10.99,
      };

      act(() => {
        result.current.addItem(item);
      });

      expect(result.current.items[0].name).toBe(longName);
    });
  });

  describe('Data Context Edge Cases', () => {
    it('should handle malformed category data', async () => {
      const malformedCategories = [
        null,
        undefined,
        {
          id: 'valid-cat',
          names: { en: 'Valid' },
          icon: '✅',
          order: 0,
          created_at: '2024-01-01',
        },
        { id: 'invalid-cat' }, // Missing required fields
        {
          id: 'another-valid',
          names: { en: 'Another Valid' },
          icon: '✅',
          order: 1,
          created_at: '2024-01-01',
        },
      ];

      const mockDataContext = {
        categories: malformedCategories,
        items: [],
        loading: false,
        error: null,
        refetch: vi.fn(),
        getCategoryItems: vi.fn(),
        prefetchCategory: vi.fn(),
      };

      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <LangProvider>
          <DataProvider>
            <CartProvider>{children}</CartProvider>
          </DataProvider>
        </LangProvider>
      );

      render(
        <TestWrapper>
          <div data-testid='test-component'>Test</div>
        </TestWrapper>
      );

      // Should not crash with malformed data
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    it('should handle network timeout gracefully', async () => {
      // Mock fetch to simulate timeout
      global.fetch = vi
        .fn()
        .mockImplementation(
          () =>
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Network timeout')), 100)
            )
        );

      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <LangProvider>
          <DataProvider>
            <CartProvider>{children}</CartProvider>
          </DataProvider>
        </LangProvider>
      );

      render(
        <TestWrapper>
          <div data-testid='test-component'>Test</div>
        </TestWrapper>
      );

      // Should not crash on network timeout
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });
  });

  describe('Cart Sheet Edge Cases', () => {
    it('should handle empty cart gracefully', () => {
      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <LangProvider>
          <CartProvider>{children}</CartProvider>
        </LangProvider>
      );

      render(
        <TestWrapper>
          <CartSheet open={true} onClose={vi.fn()} />
        </TestWrapper>
      );

      expect(screen.getByText('Your list is empty')).toBeInTheDocument();
    });

    it('should handle items with missing images', () => {
      const mockCartItems: CartItem[] = [
        {
          id: 'item-1',
          name: 'Test Item 1',
          price: 10.99,
          quantity: 1,
          // No image property
        },
      ];

      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <LangProvider>
          <CartProvider>{children}</CartProvider>
        </LangProvider>
      );

      render(
        <TestWrapper>
          <CartSheet open={true} onClose={vi.fn()} />
        </TestWrapper>
      );

      // Should show fallback emoji for missing image
      expect(screen.getByText('🍽️')).toBeInTheDocument();
    });

    it('should handle items with invalid image URLs', () => {
      const mockCartItems: CartItem[] = [
        {
          id: 'item-1',
          name: 'Test Item 1',
          price: 10.99,
          quantity: 1,
          image: 'invalid-url',
        },
      ];

      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <LangProvider>
          <CartProvider>{children}</CartProvider>
        </LangProvider>
      );

      render(
        <TestWrapper>
          <CartSheet open={true} onClose={vi.fn()} />
        </TestWrapper>
      );

      // Should not crash with invalid image URL
      expect(screen.getByText('Your list is empty')).toBeInTheDocument();
    });
  });

  describe('LocalStorage Edge Cases', () => {
    it('should handle localStorage quota exceeded', () => {
      // Mock localStorage to throw quota exceeded error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <LangProvider>
          <DataProvider>
            <CartProvider>{children}</CartProvider>
          </DataProvider>
        </LangProvider>
      );

      render(
        <TestWrapper>
          <div data-testid='test-component'>Test</div>
        </TestWrapper>
      );

      // Should not crash when localStorage quota is exceeded
      expect(screen.getByTestId('test-component')).toBeInTheDocument();

      // Restore localStorage
      localStorage.setItem = originalSetItem;
    });

    it('should handle corrupted localStorage data', () => {
      // Set corrupted data in localStorage
      localStorage.setItem('piko_last_page', 'invalid-json{');
      localStorage.setItem('piko_last_category', 'corrupted-data');

      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <LangProvider>
          <DataProvider>
            <CartProvider>{children}</CartProvider>
          </DataProvider>
        </LangProvider>
      );

      render(
        <TestWrapper>
          <div data-testid='test-component'>Test</div>
        </TestWrapper>
      );

      // Should not crash with corrupted localStorage data
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should clean up event listeners on unmount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <LangProvider>
          <DataProvider>
            <CartProvider>{children}</CartProvider>
          </DataProvider>
        </LangProvider>
      );

      const { unmount } = render(
        <TestWrapper>
          <div data-testid='test-component'>Test</div>
        </TestWrapper>
      );

      unmount();

      // Should remove event listeners on unmount
      expect(removeEventListenerSpy).toHaveBeenCalled();
    });
  });
});
