import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { LangProvider } from '../../lib/LangContext';
import { CartProvider } from '../../lib/CartContext';
import { DataProvider } from '../../lib/DataContext';

// Mock providers for testing
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <LangProvider>
      <DataProvider>
        <CartProvider>{children}</CartProvider>
      </DataProvider>
    </LangProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock data for testing
export const mockCategory = {
  id: 'test-category',
  names: { en: 'Test Category', tr: 'Test Kategori', ar: 'فئة الاختبار' },
  icon: 'test-icon',
  order: 1,
  created_at: '2024-01-01T00:00:00Z',
};

export const mockItem = {
  id: 'test-item',
  names: { en: 'Test Item', tr: 'Test Ürün', ar: 'عنصر الاختبار' },
  category_id: 'test-category',
  price: 10.99,
  image: 'test-image.jpg',
  tags: ['test', 'example'],
  order: 1,
  created_at: '2024-01-01T00:00:00Z',
};

export const mockCartItem = {
  id: 'test-item',
  name: 'Test Item',
  price: 10.99,
  quantity: 1,
  image: 'test-image.jpg',
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render, customRender as renderWithProviders };
