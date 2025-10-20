import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DataProvider } from '../../lib/DataContext';
import { LangProvider } from '../../lib/LangContext';
import { CartProvider } from '../../lib/CartContext';
import App from '../../App';
import type { Category, Item } from '../../lib/types';

// Mock all the components and hooks
vi.mock('../../components/NavBar', () => ({
  default: ({ onNavigate, onLogoTripleTap }: any) => (
    <nav data-testid='navbar'>
      <button
        onClick={() => onNavigate('admin-login')}
        data-testid='admin-login-btn'
      >
        Admin Login
      </button>
      <button onClick={onLogoTripleTap} data-testid='logo-triple-tap'>
        Logo
      </button>
    </nav>
  ),
}));

vi.mock('../../components/PikoLoader', () => ({
  default: () => <div data-testid='piko-loader'>Loading...</div>,
}));

vi.mock('../../components/LanguageWrapper', () => ({
  default: ({ children }: any) => (
    <div data-testid='language-wrapper'>{children}</div>
  ),
}));

vi.mock('../../pages/Home', () => ({
  default: ({ onNavigate }: any) => (
    <div data-testid='home-page'>
      <h1>Home Page</h1>
      <button
        onClick={() => onNavigate('category', 'cat-1')}
        data-testid='category-btn'
      >
        Go to Category
      </button>
    </div>
  ),
}));

vi.mock('../../pages/CategoryMenu', () => ({
  default: ({ categoryId, onNavigate }: any) => (
    <div data-testid='category-menu-page'>
      <h1>Category Menu - {categoryId}</h1>
      <button onClick={() => onNavigate('home')} data-testid='back-to-home-btn'>
        Back to Home
      </button>
    </div>
  ),
}));

vi.mock('../../pages/Login', () => ({
  default: ({ onNavigate }: any) => (
    <div data-testid='login-page'>
      <h1>Login Page</h1>
      <button
        onClick={() => onNavigate('home')}
        data-testid='back-to-home-from-login-btn'
      >
        Back to Home
      </button>
    </div>
  ),
}));

vi.mock('../../pages/SignUp', () => ({
  default: ({ onNavigate }: any) => (
    <div data-testid='signup-page'>
      <h1>Sign Up Page</h1>
      <button
        onClick={() => onNavigate('home')}
        data-testid='back-to-home-from-signup-btn'
      >
        Back to Home
      </button>
    </div>
  ),
}));

vi.mock('../../pages/AdminLogin', () => ({
  default: ({ onNavigate }: any) => (
    <div data-testid='admin-login-page'>
      <h1>Admin Login Page</h1>
      <button onClick={() => onNavigate('admin')} data-testid='go-to-admin-btn'>
        Go to Admin
      </button>
    </div>
  ),
}));

vi.mock('../../pages/Admin', () => ({
  default: ({ onNavigate }: any) => (
    <div data-testid='admin-page'>
      <h1>Admin Page</h1>
      <button
        onClick={() => onNavigate('home')}
        data-testid='back-to-home-from-admin-btn'
      >
        Back to Home
      </button>
    </div>
  ),
}));

// Mock the data context
const mockCategories: Category[] = [
  {
    id: 'cat-1',
    names: { en: 'Beverages', tr: 'İçecekler', ar: 'المشروبات' },
    icon: '☕',
    order: 0,
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
];

const mockDataContext = {
  categories: mockCategories,
  items: mockItems,
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

describe('User Workflows Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should navigate from home to category menu', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>,
    );

    // Should start on home page
    expect(screen.getByTestId('home-page')).toBeInTheDocument();

    // Click category button to navigate to category menu
    const categoryBtn = screen.getByTestId('category-btn');
    fireEvent.click(categoryBtn);

    // Should now be on category menu page
    await waitFor(() => {
      expect(screen.getByTestId('category-menu-page')).toBeInTheDocument();
      expect(screen.getByText('Category Menu - cat-1')).toBeInTheDocument();
    });
  });

  it('should navigate back from category menu to home', async () => {
    // Start with category page by setting localStorage
    localStorage.setItem('piko_last_page', 'category');
    localStorage.setItem('piko_last_category', 'cat-1');

    render(
      <TestWrapper>
        <App />
      </TestWrapper>,
    );

    // Should start on category menu page
    expect(screen.getByTestId('category-menu-page')).toBeInTheDocument();

    // Click back button to navigate to home
    const backBtn = screen.getByTestId('back-to-home-btn');
    fireEvent.click(backBtn);

    // Should now be on home page
    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });
  });

  it('should navigate to admin login from home', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>,
    );

    // Should start on home page
    expect(screen.getByTestId('home-page')).toBeInTheDocument();

    // Click admin login button
    const adminLoginBtn = screen.getByTestId('admin-login-btn');
    fireEvent.click(adminLoginBtn);

    // Should now be on admin login page
    await waitFor(() => {
      expect(screen.getByTestId('admin-login-page')).toBeInTheDocument();
    });
  });

  it('should navigate from admin login to admin', async () => {
    // Start with admin-login page
    localStorage.setItem('piko_last_page', 'admin-login');

    render(
      <TestWrapper>
        <App />
      </TestWrapper>,
    );

    // Should start on admin login page
    expect(screen.getByTestId('admin-login-page')).toBeInTheDocument();

    // Click go to admin button
    const goToAdminBtn = screen.getByTestId('go-to-admin-btn');
    fireEvent.click(goToAdminBtn);

    // Should now be on admin page
    await waitFor(() => {
      expect(screen.getByTestId('admin-page')).toBeInTheDocument();
    });
  });

  it('should navigate back from admin to home', async () => {
    // Start with admin page
    localStorage.setItem('piko_last_page', 'admin');

    render(
      <TestWrapper>
        <App />
      </TestWrapper>,
    );

    // Should start on admin page
    expect(screen.getByTestId('admin-page')).toBeInTheDocument();

    // Click back button to navigate to home
    const backBtn = screen.getByTestId('back-to-home-from-admin-btn');
    fireEvent.click(backBtn);

    // Should now be on home page
    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });
  });

  it('should persist navigation state in localStorage', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>,
    );

    // Navigate to category
    const categoryBtn = screen.getByTestId('category-btn');
    fireEvent.click(categoryBtn);

    await waitFor(() => {
      expect(screen.getByTestId('category-menu-page')).toBeInTheDocument();
    });

    // Check that localStorage was updated
    expect(localStorage.getItem('piko_last_page')).toBe('category');
    expect(localStorage.getItem('piko_last_category')).toBe('cat-1');
  });

  it('should handle invalid page state gracefully', async () => {
    // Set invalid page in localStorage
    localStorage.setItem('piko_last_page', 'invalid-page');

    render(
      <TestWrapper>
        <App />
      </TestWrapper>,
    );

    // Should fallback to home page
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('should handle missing category ID for category page', async () => {
    // Set category page without category ID
    localStorage.setItem('piko_last_page', 'category');
    localStorage.removeItem('piko_last_category');

    render(
      <TestWrapper>
        <App />
      </TestWrapper>,
    );

    // Should fallback to home page
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('should handle localStorage errors gracefully', async () => {
    // Mock localStorage to throw error
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = vi.fn().mockImplementation(() => {
      throw new Error('localStorage error');
    });

    render(
      <TestWrapper>
        <App />
      </TestWrapper>,
    );

    // Should still render home page despite localStorage error
    expect(screen.getByTestId('home-page')).toBeInTheDocument();

    // Restore localStorage
    localStorage.getItem = originalGetItem;
  });
});
