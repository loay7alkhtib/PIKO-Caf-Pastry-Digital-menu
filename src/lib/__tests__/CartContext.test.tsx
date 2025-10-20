import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from '../CartContext';
import { renderWithProviders } from '../../test/utils/test-utils';

const TestComponent = () => {
  const {
    items,
    totalItems,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCart();

  return (
    <div>
      <div data-testid='total-items'>{totalItems}</div>
      <div data-testid='total-price'>{totalPrice.toFixed(2)}</div>
      <div data-testid='cart-items'>{items.length}</div>
      <button
        onClick={() =>
          addItem({
            id: '1',
            names: { en: 'Coffee', tr: 'Kahve', ar: 'قهوة' },
            price: 15.5,
            category_id: '1',
            is_active: true,
            order: 0,
          })
        }
      >
        Add Coffee
      </button>
      <button onClick={() => removeItem('1')}>Remove Coffee</button>
      <button onClick={() => updateQuantity('1', 2)}>Update Quantity</button>
      <button onClick={clearCart}>Clear Cart</button>
    </div>
  );
};

describe('CartContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide initial empty cart state', () => {
    renderWithProviders(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    expect(screen.getByTestId('total-items')).toHaveTextContent('0');
    expect(screen.getByTestId('total-price')).toHaveTextContent('0.00');
    expect(screen.getByTestId('cart-items')).toHaveTextContent('0');
  });

  it('should add items to cart', async () => {
    renderWithProviders(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    fireEvent.click(screen.getByText('Add Coffee'));

    await waitFor(() => {
      expect(screen.getByTestId('total-items')).toHaveTextContent('1');
      expect(screen.getByTestId('total-price')).toHaveTextContent('15.50');
      expect(screen.getByTestId('cart-items')).toHaveTextContent('1');
    });
  });

  it('should update quantity when adding same item', async () => {
    renderWithProviders(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    // Add item twice
    fireEvent.click(screen.getByText('Add Coffee'));
    fireEvent.click(screen.getByText('Add Coffee'));

    await waitFor(() => {
      expect(screen.getByTestId('total-items')).toHaveTextContent('2');
      expect(screen.getByTestId('total-price')).toHaveTextContent('31.00');
      expect(screen.getByTestId('cart-items')).toHaveTextContent('1');
    });
  });

  it('should remove items from cart', async () => {
    renderWithProviders(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    // Add item first
    fireEvent.click(screen.getByText('Add Coffee'));

    await waitFor(() => {
      expect(screen.getByTestId('total-items')).toHaveTextContent('1');
    });

    // Remove item
    fireEvent.click(screen.getByText('Remove Coffee'));

    await waitFor(() => {
      expect(screen.getByTestId('total-items')).toHaveTextContent('0');
      expect(screen.getByTestId('total-price')).toHaveTextContent('0.00');
      expect(screen.getByTestId('cart-items')).toHaveTextContent('0');
    });
  });

  it('should update item quantity', async () => {
    renderWithProviders(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    // Add item first
    fireEvent.click(screen.getByText('Add Coffee'));

    await waitFor(() => {
      expect(screen.getByTestId('total-items')).toHaveTextContent('1');
    });

    // Update quantity
    fireEvent.click(screen.getByText('Update Quantity'));

    await waitFor(() => {
      expect(screen.getByTestId('total-items')).toHaveTextContent('2');
      expect(screen.getByTestId('total-price')).toHaveTextContent('31.00');
    });
  });

  it('should clear entire cart', async () => {
    renderWithProviders(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    // Add item first
    fireEvent.click(screen.getByText('Add Coffee'));

    await waitFor(() => {
      expect(screen.getByTestId('total-items')).toHaveTextContent('1');
    });

    // Clear cart
    fireEvent.click(screen.getByText('Clear Cart'));

    await waitFor(() => {
      expect(screen.getByTestId('total-items')).toHaveTextContent('0');
      expect(screen.getByTestId('total-price')).toHaveTextContent('0.00');
      expect(screen.getByTestId('cart-items')).toHaveTextContent('0');
    });
  });

  it('should handle multiple different items', async () => {
    const TestComponentMultiple = () => {
      const { items, totalItems, totalPrice, addItem, removeItem } = useCart();

      return (
        <div>
          <div data-testid='total-items'>{totalItems}</div>
          <div data-testid='total-price'>{totalPrice.toFixed(2)}</div>
          <div data-testid='cart-items'>{items.length}</div>
          <button
            onClick={() =>
              addItem({
                id: '1',
                names: { en: 'Coffee', tr: 'Kahve', ar: 'قهوة' },
                price: 15.5,
                category_id: '1',
                is_active: true,
                order: 0,
              })
            }
          >
            Add Coffee
          </button>
          <button
            onClick={() =>
              addItem({
                id: '2',
                names: { en: 'Tea', tr: 'Çay', ar: 'شاي' },
                price: 10.0,
                category_id: '1',
                is_active: true,
                order: 1,
              })
            }
          >
            Add Tea
          </button>
          <button onClick={() => removeItem('1')}>Remove Coffee</button>
        </div>
      );
    };

    renderWithProviders(
      <CartProvider>
        <TestComponentMultiple />
      </CartProvider>
    );

    // Add both items
    fireEvent.click(screen.getByText('Add Coffee'));
    fireEvent.click(screen.getByText('Add Tea'));

    await waitFor(() => {
      expect(screen.getByTestId('total-items')).toHaveTextContent('2');
      expect(screen.getByTestId('total-price')).toHaveTextContent('25.50');
      expect(screen.getByTestId('cart-items')).toHaveTextContent('2');
    });

    // Remove one item
    fireEvent.click(screen.getByText('Remove Coffee'));

    await waitFor(() => {
      expect(screen.getByTestId('total-items')).toHaveTextContent('1');
      expect(screen.getByTestId('total-price')).toHaveTextContent('10.00');
      expect(screen.getByTestId('cart-items')).toHaveTextContent('1');
    });
  });

  it('should handle item variants', async () => {
    const TestComponentVariants = () => {
      const { totalItems, totalPrice, addItem } = useCart();

      return (
        <div>
          <div data-testid='total-items'>{totalItems}</div>
          <div data-testid='total-price'>{totalPrice.toFixed(2)}</div>
          <button
            onClick={() =>
              addItem(
                {
                  id: '1',
                  names: { en: 'Coffee', tr: 'Kahve', ar: 'قهوة' },
                  price: 15.5,
                  category_id: '1',
                  is_active: true,
                  order: 0,
                  variants: [
                    { size: 'Small', price: 12.5 },
                    { size: 'Large', price: 18.5 },
                  ],
                },
                'Large'
              )
            }
          >
            Add Large Coffee
          </button>
        </div>
      );
    };

    renderWithProviders(
      <CartProvider>
        <TestComponentVariants />
      </CartProvider>
    );

    fireEvent.click(screen.getByText('Add Large Coffee'));

    await waitFor(() => {
      expect(screen.getByTestId('total-items')).toHaveTextContent('1');
      expect(screen.getByTestId('total-price')).toHaveTextContent('18.50');
    });
  });

  it('should persist cart state', async () => {
    // Test that cart state persists across re-renders
    const { rerender } = renderWithProviders(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    fireEvent.click(screen.getByText('Add Coffee'));

    await waitFor(() => {
      expect(screen.getByTestId('total-items')).toHaveTextContent('1');
    });

    // Re-render with same provider
    rerender(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    // State should persist
    expect(screen.getByTestId('total-items')).toHaveTextContent('1');
    expect(screen.getByTestId('total-price')).toHaveTextContent('15.50');
  });
});
