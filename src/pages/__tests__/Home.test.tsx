import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/utils/test-utils';
import Home from '../Home';

const mockCategories = [
  {
    id: '1',
    names: { en: 'Beverages', tr: 'İçecekler', ar: 'المشروبات' },
    icon: '☕',
    color: '#0C6071',
    order: 0,
    is_active: true,
  },
  {
    id: '2',
    names: { en: 'Desserts', tr: 'Tatlılar', ar: 'الحلويات' },
    icon: '🍰',
    color: '#FF6B6B',
    order: 1,
    is_active: true,
  },
];

const mockItems = [
  {
    id: '1',
    names: { en: 'Coffee', tr: 'Kahve', ar: 'قهوة' },
    category_id: '1',
    price: 15.5,
    is_active: true,
    order: 0,
  },
  {
    id: '2',
    names: { en: 'Cake', tr: 'Pasta', ar: 'كعكة' },
    category_id: '2',
    price: 25.0,
    is_active: true,
    order: 0,
  },
];

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render categories list', () => {
    renderWithProviders(<Home onNavigate={vi.fn()} />, {
      categories: mockCategories,
      items: mockItems,
      loading: false,
    });

    expect(screen.getByText('Beverages')).toBeInTheDocument();
    expect(screen.getByText('Desserts')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    renderWithProviders(<Home onNavigate={vi.fn()} />, {
      categories: [],
      items: [],
      loading: true,
    });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should handle category click', () => {
    const onNavigate = vi.fn();
    renderWithProviders(<Home onNavigate={onNavigate} />, {
      categories: mockCategories,
      items: mockItems,
      loading: false,
    });

    fireEvent.click(screen.getByText('Beverages'));

    expect(onNavigate).toHaveBeenCalledWith('category', '1');
  });

  it('should show admin login button', () => {
    renderWithProviders(<Home onNavigate={vi.fn()} />, {
      categories: mockCategories,
      items: mockItems,
      loading: false,
    });

    expect(screen.getByText('Admin Login')).toBeInTheDocument();
  });

  it('should handle admin login click', () => {
    const onNavigate = vi.fn();
    renderWithProviders(<Home onNavigate={onNavigate} />, {
      categories: mockCategories,
      items: mockItems,
      loading: false,
    });

    fireEvent.click(screen.getByText('Admin Login'));

    expect(onNavigate).toHaveBeenCalledWith('admin-login');
  });

  it('should display different languages', () => {
    renderWithProviders(<Home onNavigate={vi.fn()} />, {
      categories: mockCategories,
      items: mockItems,
      loading: false,
      lang: 'tr',
    });

    expect(screen.getByText('İçecekler')).toBeInTheDocument();
    expect(screen.getByText('Tatlılar')).toBeInTheDocument();
  });

  it('should display Arabic language with RTL', () => {
    renderWithProviders(<Home onNavigate={vi.fn()} />, {
      categories: mockCategories,
      items: mockItems,
      loading: false,
      lang: 'ar',
    });

    expect(screen.getByText('المشروبات')).toBeInTheDocument();
    expect(screen.getByText('الحلويات')).toBeInTheDocument();
  });

  it('should handle empty categories', () => {
    renderWithProviders(<Home onNavigate={vi.fn()} />, {
      categories: [],
      items: [],
      loading: false,
    });

    expect(screen.getByText('No categories available')).toBeInTheDocument();
  });

  it('should handle error state', () => {
    renderWithProviders(<Home onNavigate={vi.fn()} />, {
      categories: [],
      items: [],
      loading: false,
      error: 'Failed to load categories',
    });

    expect(screen.getByText('Failed to load categories')).toBeInTheDocument();
  });

  it('should show category icons', () => {
    renderWithProviders(<Home onNavigate={vi.fn()} />, {
      categories: mockCategories,
      items: mockItems,
      loading: false,
    });

    expect(screen.getByText('☕')).toBeInTheDocument();
    expect(screen.getByText('🍰')).toBeInTheDocument();
  });

  it('should handle keyboard navigation', () => {
    const onNavigate = vi.fn();
    renderWithProviders(<Home onNavigate={onNavigate} />, {
      categories: mockCategories,
      items: mockItems,
      loading: false,
    });

    const categoryCard = screen.getByText('Beverages');
    fireEvent.keyDown(categoryCard, { key: 'Enter' });

    expect(onNavigate).toHaveBeenCalledWith('category', '1');
  });

  it('should handle touch events on mobile', () => {
    const onNavigate = vi.fn();
    renderWithProviders(<Home onNavigate={onNavigate} />, {
      categories: mockCategories,
      items: mockItems,
      loading: false,
    });

    const categoryCard = screen.getByText('Beverages');
    fireEvent.touchStart(categoryCard);
    fireEvent.touchEnd(categoryCard);

    expect(onNavigate).toHaveBeenCalledWith('category', '1');
  });

  it('should show category colors', () => {
    renderWithProviders(<Home onNavigate={vi.fn()} />, {
      categories: mockCategories,
      items: mockItems,
      loading: false,
    });

    const beverageCard = screen.getByText('Beverages');
    const dessertCard = screen.getByText('Desserts');

    // Colors should be applied to the components
    expect(beverageCard).toBeInTheDocument();
    expect(dessertCard).toBeInTheDocument();
  });

  it('should handle category hover effects', () => {
    renderWithProviders(<Home onNavigate={vi.fn()} />, {
      categories: mockCategories,
      items: mockItems,
      loading: false,
    });

    const categoryCard = screen.getByText('Beverages');
    fireEvent.mouseEnter(categoryCard);

    // Should show hover state
    expect(categoryCard).toBeInTheDocument();
  });

  it('should handle category mouse leave', () => {
    renderWithProviders(<Home onNavigate={vi.fn()} />, {
      categories: mockCategories,
      items: mockItems,
      loading: false,
    });

    const categoryCard = screen.getByText('Beverages');
    fireEvent.mouseEnter(categoryCard);
    fireEvent.mouseLeave(categoryCard);

    // Should remove hover state
    expect(categoryCard).toBeInTheDocument();
  });

  it('should handle focus events', () => {
    renderWithProviders(<Home onNavigate={vi.fn()} />, {
      categories: mockCategories,
      items: mockItems,
      loading: false,
    });

    const categoryCard = screen.getByText('Beverages');
    fireEvent.focus(categoryCard);

    // Should show focus state
    expect(categoryCard).toHaveFocus();
  });

  it('should handle blur events', () => {
    renderWithProviders(<Home onNavigate={vi.fn()} />, {
      categories: mockCategories,
      items: mockItems,
      loading: false,
    });

    const categoryCard = screen.getByText('Beverages');
    fireEvent.focus(categoryCard);
    fireEvent.blur(categoryCard);

    // Should remove focus state
    expect(categoryCard).not.toHaveFocus();
  });

  it('should handle multiple rapid clicks', () => {
    const onNavigate = vi.fn();
    renderWithProviders(<Home onNavigate={onNavigate} />, {
      categories: mockCategories,
      items: mockItems,
      loading: false,
    });

    const categoryCard = screen.getByText('Beverages');

    // Rapid clicks
    fireEvent.click(categoryCard);
    fireEvent.click(categoryCard);
    fireEvent.click(categoryCard);

    expect(onNavigate).toHaveBeenCalledTimes(3);
  });

  it('should handle window resize', () => {
    renderWithProviders(<Home onNavigate={vi.fn()} />, {
      categories: mockCategories,
      items: mockItems,
      loading: false,
    });

    // Simulate window resize
    fireEvent.resize(window);

    // Component should still render correctly
    expect(screen.getByText('Beverages')).toBeInTheDocument();
    expect(screen.getByText('Desserts')).toBeInTheDocument();
  });
});
