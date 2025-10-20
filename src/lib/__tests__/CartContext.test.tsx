import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { CartProvider, useCart } from '../CartContext';
import type { CartItem } from '../types';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('CartContext', () => {
  beforeEach(() => {
    // Clear any localStorage before each test
    localStorage.clear();
  });

  it('should initialize with empty cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('should add item to cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    const item: Omit<CartItem, 'quantity'> = {
      id: 'test-item',
      name: 'Test Item',
      price: 10.99,
      image: 'test.jpg',
    };

    act(() => {
      result.current.addItem(item);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toEqual({
      ...item,
      quantity: 1,
    });
    expect(result.current.total).toBe(10.99);
  });

  it('should increment quantity when adding same item', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    const item: Omit<CartItem, 'quantity'> = {
      id: 'test-item',
      name: 'Test Item',
      price: 10.99,
    };

    act(() => {
      result.current.addItem(item);
      result.current.addItem(item);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.total).toBe(21.98);
  });

  it('should handle items with different sizes as separate items', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    const smallItem: Omit<CartItem, 'quantity'> = {
      id: 'test-item',
      name: 'Test Item',
      price: 10.99,
      size: 'Small',
    };

    const largeItem: Omit<CartItem, 'quantity'> = {
      id: 'test-item',
      name: 'Test Item',
      price: 15.99,
      size: 'Large',
    };

    act(() => {
      result.current.addItem(smallItem);
      result.current.addItem(largeItem);
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.total).toBe(26.98);
  });

  it('should update item quantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    const item: Omit<CartItem, 'quantity'> = {
      id: 'test-item',
      name: 'Test Item',
      price: 10.99,
    };

    act(() => {
      result.current.addItem(item);
      result.current.updateQuantity('test-item', 3);
    });

    expect(result.current.items[0].quantity).toBe(3);
    expect(result.current.total).toBe(32.97);
  });

  it('should remove item when quantity is set to 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    const item: Omit<CartItem, 'quantity'> = {
      id: 'test-item',
      name: 'Test Item',
      price: 10.99,
    };

    act(() => {
      result.current.addItem(item);
      result.current.updateQuantity('test-item', 0);
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });

  it('should remove item by id', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    const item: Omit<CartItem, 'quantity'> = {
      id: 'test-item',
      name: 'Test Item',
      price: 10.99,
    };

    act(() => {
      result.current.addItem(item);
      result.current.removeItem('test-item');
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });

  it('should clear all items', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    const item1: Omit<CartItem, 'quantity'> = {
      id: 'test-item-1',
      name: 'Test Item 1',
      price: 10.99,
    };

    const item2: Omit<CartItem, 'quantity'> = {
      id: 'test-item-2',
      name: 'Test Item 2',
      price: 15.5,
    };

    act(() => {
      result.current.addItem(item1);
      result.current.addItem(item2);
      result.current.clearCart();
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });

  it('should calculate total correctly with multiple items', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    const item1: Omit<CartItem, 'quantity'> = {
      id: 'test-item-1',
      name: 'Test Item 1',
      price: 10.99,
    };

    const item2: Omit<CartItem, 'quantity'> = {
      id: 'test-item-2',
      name: 'Test Item 2',
      price: 15.5,
    };

    act(() => {
      result.current.addItem(item1);
      result.current.addItem(item1); // Quantity 2
      result.current.addItem(item2);
    });

    expect(result.current.total).toBe(37.48); // (10.99 * 2) + 15.50
  });

  it('should handle items with size variants correctly', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    const smallItem: Omit<CartItem, 'quantity'> = {
      id: 'test-item',
      name: 'Test Item',
      price: 10.99,
      size: 'Small',
    };

    const largeItem: Omit<CartItem, 'quantity'> = {
      id: 'test-item',
      name: 'Test Item',
      price: 15.99,
      size: 'Large',
    };

    act(() => {
      result.current.addItem(smallItem);
      result.current.addItem(largeItem);
      result.current.updateQuantity('test-item-Small', 2);
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items.find(i => i.size === 'Small')?.quantity).toBe(
      2
    );
    expect(result.current.items.find(i => i.size === 'Large')?.quantity).toBe(
      1
    );
    expect(result.current.total).toBe(37.97); // (10.99 * 2) + 15.99
  });
});
