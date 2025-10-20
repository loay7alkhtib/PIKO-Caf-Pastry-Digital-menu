import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DataProvider } from '../../lib/DataContext';
import { LangProvider } from '../../lib/LangContext';
import { CartProvider } from '../../lib/CartContext';
import Home from '../Home';
import type { Category } from '../../lib/types';

// Mock the navigation hook
vi.mock('../../lib/hooks/useNavigation', () => ({
  useNavigation: () => ({
    navigateToCategory: vi.fn(),
    navigateToAdminLogin: vi.fn(),
  }),
}));

// Mock motion
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
  },
}));

// Mock components
vi.mock('../NavBar', () => ({
  default: ({ onLogoTripleTap, onNavigate, showAccountIcon }: any) => (
    <nav data-testid='navbar'>
      <button onClick={onLogoTripleTap} data-testid='logo-triple-tap'>
        Logo
      </button>
    </nav>
  ),
}));

vi.mock('../CategoryCard', () => ({
  default: ({ name, icon, onClick, onHover }: any) => (
    <div data-testid='category-card' onClick={onClick} onMouseEnter={onHover}>
      {icon} {name}
    </div>
  ),
}));

vi.mock('../PikoLogoBadge', () => ({
  default: ({ onTripleTap, className }: any) => (
    <div
      data-testid='piko-logo-badge'
      onClick={onTripleTap}
      className={className}
    >
      Logo Badge
    </div>
  ),
}));

vi.mock('../PikoLoader', () => ({
  default: () => <div data-testid='piko-loader'>Loading...</div>,
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

const mockDataContext = {
  categories: mockCategories,
  items: [],
  loading: false,
  error: null,
  refetch: vi.fn(),
  getCategoryItems: vi.fn(),
  prefetchCategory: vi.fn(),
};

const TestWrapper = ({
  children,
  dataContext = mockDataContext,
}: {
  children: React.ReactNode;
  dataContext?: any;
}) => (
  <LangProvider>
    <DataProvider>
      <CartProvider>{children}</CartProvider>
    </DataProvider>
  </LangProvider>
);

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state when loading and no categories', () => {
    const loadingContext = {
      ...mockDataContext,
      loading: true,
      categories: [],
    };

    render(
      <TestWrapper dataContext={loadingContext}>
        <Home onNavigate={vi.fn()} />
      </TestWrapper>,
    );

    expect(screen.getByTestId('piko-loader')).toBeInTheDocument();
  });

  it('renders home content when not loading', () => {
    render(
      <TestWrapper>
        <Home onNavigate={vi.fn()} />
      </TestWrapper>,
    );

    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('piko-logo-badge')).toBeInTheDocument();
    expect(screen.getByText('Specialties')).toBeInTheDocument();
  });

  it('renders categories when available', () => {
    render(
      <TestWrapper>
        <Home onNavigate={vi.fn()} />
      </TestWrapper>,
    );

    const categoryCards = screen.getAllByTestId('category-card');
    expect(categoryCards).toHaveLength(2);
    expect(screen.getByText('☕ Beverages')).toBeInTheDocument();
    expect(screen.getByText('🍰 Desserts')).toBeInTheDocument();
  });

  it('handles category click', () => {
    const mockOnNavigate = vi.fn();
    const { useNavigation } = require('../../lib/hooks/useNavigation');
    const mockNavigateToCategory = vi.fn();

    vi.mocked(useNavigation).mockReturnValue({
      navigateToCategory: mockNavigateToCategory,
      navigateToAdminLogin: vi.fn(),
    });

    render(
      <TestWrapper>
        <Home onNavigate={mockOnNavigate} />
      </TestWrapper>,
    );

    const categoryCards = screen.getAllByTestId('category-card');
    fireEvent.click(categoryCards[0]);

    expect(mockNavigateToCategory).toHaveBeenCalledWith('cat-1');
  });

  it('handles category hover for prefetching', () => {
    const { useNavigation } = require('../../lib/hooks/useNavigation');
    const mockPrefetchCategory = vi.fn();

    vi.mocked(useNavigation).mockReturnValue({
      navigateToCategory: vi.fn(),
      navigateToAdminLogin: vi.fn(),
    });

    // Mock the data context with prefetch function
    const dataContextWithPrefetch = {
      ...mockDataContext,
      prefetchCategory: mockPrefetchCategory,
    };

    render(
      <TestWrapper dataContext={dataContextWithPrefetch}>
        <Home onNavigate={vi.fn()} />
      </TestWrapper>,
    );

    const categoryCards = screen.getAllByTestId('category-card');
    fireEvent.mouseEnter(categoryCards[0]);

    expect(mockPrefetchCategory).toHaveBeenCalledWith('cat-1');
  });

  it('handles logo triple tap for admin login', () => {
    const { useNavigation } = require('../../lib/hooks/useNavigation');
    const mockNavigateToAdminLogin = vi.fn();

    vi.mocked(useNavigation).mockReturnValue({
      navigateToCategory: vi.fn(),
      navigateToAdminLogin: mockNavigateToAdminLogin,
    });

    render(
      <TestWrapper>
        <Home onNavigate={vi.fn()} />
      </TestWrapper>,
    );

    const logoBadge = screen.getByTestId('piko-logo-badge');
    fireEvent.click(logoBadge);

    expect(mockNavigateToAdminLogin).toHaveBeenCalled();
  });

  it('displays correct language content', () => {
    render(
      <TestWrapper>
        <Home onNavigate={vi.fn()} />
      </TestWrapper>,
    );

    // Check for English content (default language)
    expect(screen.getByText('Specialties')).toBeInTheDocument();
    expect(screen.getByText('Discover our specialties')).toBeInTheDocument();
  });

  it('renders lucky button', () => {
    render(
      <TestWrapper>
        <Home onNavigate={vi.fn()} />
      </TestWrapper>,
    );

    expect(screen.getByText('Lucky')).toBeInTheDocument();
  });

  it('shows correct number of category cards', () => {
    render(
      <TestWrapper>
        <Home onNavigate={vi.fn()} />
      </TestWrapper>,
    );

    const categoryCards = screen.getAllByTestId('category-card');
    expect(categoryCards).toHaveLength(mockCategories.length);
  });
});
