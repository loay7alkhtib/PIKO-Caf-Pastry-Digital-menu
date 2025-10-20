import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCartOperations } from '../useCartOperations';

// Mock item for testing
const mockItem = {
  id: 'test-item',
  names: { en: 'Test Item', tr: 'Test Öğe', ar: 'عنصر اختبار' },
  price: 10.99,
  category_id: 'test-category',
  is_available: true,
  order: 0,
  tags: [],
  variants: [],
};

// Mock the cart context
const mockCartContext = {
  items: [],
  addItem: vi.fn(),
  removeItem: vi.fn(),
  updateQuantity: vi.fn(),
  clearCart: vi.fn(),
  getTotalPrice: vi.fn(() => 0),
  getTotalItems: vi.fn(() => 0),
};

vi.mock('../../CartContext', () => ({
  useCart: () => mockCartContext,
}));

// Mock language context to satisfy hooks used inside useCartOperations
vi.mock('../../LangContext', () => ({
  useLang: () => ({ lang: 'en', setLang: vi.fn() }),
}));

describe('useCartOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add item to cart', () => {
    const { result } = renderHook(() => useCartOperations());

    act(() => {
      result.current.addItemToCart(mockItem);
    });

    expect(mockCartContext.addItem).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-item',
        name: 'Test Item',
        price: 10.99,
      })
    );
  });

  it('should add item with size variant', () => {
    const { result } = renderHook(() => useCartOperations());
    const size = 'Large';
    const customPrice = 15.99;

    act(() => {
      result.current.addItemToCart(mockItem, size, customPrice);
    });

    expect(mockCartContext.addItem).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-item',
        name: 'Test Item',
        price: 15.99,
        size: 'Large',
      })
    );
  });
});
