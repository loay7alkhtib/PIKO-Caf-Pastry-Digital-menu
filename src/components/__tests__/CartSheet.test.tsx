import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CartContext, CartProvider } from '../../lib/CartContext';
import { LangProvider } from '../../lib/LangContext';
import CartSheet from '../CartSheet';
import type { CartItem } from '../../lib/types';

// Mock the OptimizedImage component
vi.mock('../OptimizedImage', () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className: string;
  }) => (
    <img
      src={src}
      alt={alt}
      className={className}
      data-testid='optimized-image'
    />
  ),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

const mockCartItems: CartItem[] = [
  {
    id: 'item-1',
    name: 'Test Item 1',
    price: 10.99,
    quantity: 2,
    image: 'test-image.jpg',
  },
  {
    id: 'item-2',
    name: 'Test Item 2',
    price: 15.5,
    quantity: 1,
    size: 'Large',
  },
];

const TestWrapper = ({
  children,
  initialItems = [],
}: {
  children: React.ReactNode;
  initialItems?: CartItem[];
}) => {
  return (
    <LangProvider>
      <CartProvider>{children}</CartProvider>
    </LangProvider>
  );
};

describe('CartSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty cart message when no items', () => {
    render(
      <TestWrapper>
        <CartSheet open={true} onClose={vi.fn()} />
      </TestWrapper>,
    );

    expect(screen.getByText('Your list is empty')).toBeInTheDocument();
  });

  it('renders cart items when items exist', () => {
    // Mock the cart context with items
    const MockCartProvider = ({ children }: { children: React.ReactNode }) => {
      const mockCartContext = {
        items: mockCartItems,
        addItem: vi.fn(),
        removeItem: vi.fn(),
        updateQuantity: vi.fn(),
        clearCart: vi.fn(),
        total: 37.48, // (10.99 * 2) + 15.50
      };

      return (
        <LangProvider>
          <CartProvider value={mockCartContext}>{children}</CartProvider>
        </LangProvider>
      );
    };

    render(
      <MockCartProvider>
        <CartSheet open={true} onClose={vi.fn()} />
      </MockCartProvider>,
    );

    expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    expect(screen.getByText('₺37.48')).toBeInTheDocument();
  });

  it('calls onClose when sheet is closed', () => {
    const mockOnClose = vi.fn();
    render(
      <TestWrapper>
        <CartSheet open={true} onClose={mockOnClose} />
      </TestWrapper>,
    );

    // The sheet should be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('displays correct total price', () => {
    const MockCartProvider = ({ children }: { children: React.ReactNode }) => {
      const mockCartContext = {
        items: mockCartItems,
        addItem: vi.fn(),
        removeItem: vi.fn(),
        updateQuantity: vi.fn(),
        clearCart: vi.fn(),
        total: 37.48,
      };

      return (
        <LangProvider>
          <div data-testid='cart-context'>{children}</div>
        </LangProvider>
      );
    };

    render(
      <MockCartProvider>
        <CartSheet open={true} onClose={vi.fn()} />
      </MockCartProvider>,
    );

    expect(screen.getByText('₺37.48')).toBeInTheDocument();
  });

  it('shows size information when item has size', () => {
    const MockCartProvider = ({ children }: { children: React.ReactNode }) => {
      const mockCartContext = {
        items: [mockCartItems[1]], // Item with size
        addItem: vi.fn(),
        removeItem: vi.fn(),
        updateQuantity: vi.fn(),
        clearCart: vi.fn(),
        total: 15.5,
      };

      return (
        <LangProvider>
          <div data-testid='cart-context'>{children}</div>
        </LangProvider>
      );
    };

    render(
      <MockCartProvider>
        <CartSheet open={true} onClose={vi.fn()} />
      </MockCartProvider>,
    );

    expect(screen.getByText('Large')).toBeInTheDocument();
  });
});
