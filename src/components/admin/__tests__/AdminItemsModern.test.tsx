import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import AdminItemsModern from '../AdminItemsModern';
import { Category, Item } from '../../../lib/supabase';

// Mock the dependencies
vi.mock('../../../lib/LangContext', () => ({
  useLang: () => ({ lang: 'en' }),
}));

vi.mock('../../../lib/i18n', () => ({
  t: (key: string) => key,
}));

vi.mock('../../../lib/supabase', () => ({
  itemsAPI: {
    update: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    batchUpdateOrder: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock data
const mockCategories: Category[] = [
  {
    id: 'cat1',
    names: { en: 'Drinks', tr: 'İçecekler', ar: 'مشروبات' },
    icon: '☕',
    color: '#blue',
    slug: 'drinks',
    sort_order: 0,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
];

const mockItems: Item[] = [
  {
    id: 'item1',
    names: { en: 'Coffee', tr: 'Kahve', ar: 'قهوة' },
    category_id: 'cat1',
    price: 10,
    image: null,
    tags: ['hot', 'beverage'],
    order: 0,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'item2',
    names: { en: 'Tea', tr: 'Çay', ar: 'شاي' },
    category_id: 'cat1',
    price: 8,
    image: null,
    tags: ['hot', 'beverage'],
    order: 1,
    created_at: '2024-01-01T00:00:00Z',
  },
];

// Wrapper component for DndContext
const DndWrapper = ({ children }: { children: React.ReactNode }) => (
  <DndContext onDragEnd={() => {}}>{children}</DndContext>
);

describe('AdminItemsModern', () => {
  it('renders items list correctly', () => {
    const mockRefresh = vi.fn();

    render(
      <DndWrapper>
        <AdminItemsModern
          items={mockItems}
          categories={mockCategories}
          onRefresh={mockRefresh}
        />
      </DndWrapper>
    );

    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Tea')).toBeInTheDocument();
    expect(screen.getByText('items')).toBeInTheDocument();
  });

  it('shows category filter badges', () => {
    const mockRefresh = vi.fn();

    render(
      <DndWrapper>
        <AdminItemsModern
          items={mockItems}
          categories={mockCategories}
          onRefresh={mockRefresh}
        />
      </DndWrapper>
    );

    expect(screen.getByText('All (2)')).toBeInTheDocument();
    expect(screen.getByText('☕ Drinks (2)')).toBeInTheDocument();
  });

  it('shows add new item button', () => {
    const mockRefresh = vi.fn();

    render(
      <DndWrapper>
        <AdminItemsModern
          items={mockItems}
          categories={mockCategories}
          onRefresh={mockRefresh}
        />
      </DndWrapper>
    );

    expect(screen.getByText('addNew')).toBeInTheDocument();
  });

  it('displays correct item count', () => {
    const mockRefresh = vi.fn();

    render(
      <DndWrapper>
        <AdminItemsModern
          items={mockItems}
          categories={mockCategories}
          onRefresh={mockRefresh}
        />
      </DndWrapper>
    );

    expect(screen.getByText('(2)')).toBeInTheDocument();
  });
});
