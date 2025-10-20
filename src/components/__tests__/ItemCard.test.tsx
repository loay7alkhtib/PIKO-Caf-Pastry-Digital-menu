import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/utils/test-utils';
import ItemCard from '../ItemCard';

const mockItem = {
  id: '1',
  names: { en: 'Coffee', tr: 'Kahve', ar: 'قهوة' },
  descriptions: { en: 'Fresh coffee', tr: 'Taze kahve', ar: 'قهوة طازجة' },
  category_id: '1',
  price: 15.5,
  image_url: 'coffee.jpg',
  tags: ['hot', 'beverage'],
  variants: [
    { size: 'Small', price: 12.5 },
    { size: 'Large', price: 18.5 },
  ],
  is_active: true,
  order: 0,
};

const mockItemWithoutImage = {
  ...mockItem,
  image_url: null,
};

const mockItemWithVariants = {
  ...mockItem,
  variants: [
    { size: 'Small', price: 12.5 },
    { size: 'Medium', price: 15.5 },
    { size: 'Large', price: 18.5 },
  ],
};

describe('ItemCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render item with image', () => {
    renderWithProviders(<ItemCard item={mockItem} />);

    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Fresh coffee')).toBeInTheDocument();
    expect(screen.getByText('$15.50')).toBeInTheDocument();
    expect(screen.getByAltText('Coffee')).toBeInTheDocument();
  });

  it('should render item without image', () => {
    renderWithProviders(<ItemCard item={mockItemWithoutImage} />);

    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Fresh coffee')).toBeInTheDocument();
    expect(screen.getByText('$15.50')).toBeInTheDocument();
    // Should show placeholder or no image
    expect(screen.queryByAltText('Coffee')).not.toBeInTheDocument();
  });

  it('should display variants when available', () => {
    renderWithProviders(<ItemCard item={mockItemWithVariants} />);

    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Small - $12.50')).toBeInTheDocument();
    expect(screen.getByText('Medium - $15.50')).toBeInTheDocument();
    expect(screen.getByText('Large - $18.50')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const onItemClick = vi.fn();
    renderWithProviders(<ItemCard item={mockItem} onItemClick={onItemClick} />);

    fireEvent.click(screen.getByText('Coffee'));

    expect(onItemClick).toHaveBeenCalledWith(mockItem);
  });

  it('should handle add to cart', () => {
    const onAddToCart = vi.fn();
    renderWithProviders(<ItemCard item={mockItem} onAddToCart={onAddToCart} />);

    const addButton = screen.getByText('Add to Cart');
    fireEvent.click(addButton);

    expect(onAddToCart).toHaveBeenCalledWith(mockItem);
  });

  it('should handle variant selection', () => {
    renderWithProviders(<ItemCard item={mockItemWithVariants} />);

    // Click on a variant
    fireEvent.click(screen.getByText('Small - $12.50'));

    // Should update the displayed price
    expect(screen.getByText('$12.50')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    renderWithProviders(<ItemCard item={mockItem} loading={true} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show unavailable state', () => {
    const unavailableItem = { ...mockItem, is_active: false };
    renderWithProviders(<ItemCard item={unavailableItem} />);

    expect(screen.getByText('Unavailable')).toBeInTheDocument();
    expect(screen.getByText('Add to Cart')).toBeDisabled();
  });

  it('should handle image loading errors', async () => {
    renderWithProviders(<ItemCard item={mockItem} />);

    const image = screen.getByAltText('Coffee');
    fireEvent.error(image);

    // Should show fallback content
    await waitFor(() => {
      expect(screen.getByText('Coffee')).toBeInTheDocument();
    });
  });

  it('should display tags', () => {
    renderWithProviders(<ItemCard item={mockItem} />);

    expect(screen.getByText('hot')).toBeInTheDocument();
    expect(screen.getByText('beverage')).toBeInTheDocument();
  });

  it('should handle different languages', () => {
    // Test with Turkish language
    renderWithProviders(<ItemCard item={mockItem} />, { lang: 'tr' });

    expect(screen.getByText('Kahve')).toBeInTheDocument();
    expect(screen.getByText('Taze kahve')).toBeInTheDocument();
  });

  it('should handle Arabic language with RTL', () => {
    renderWithProviders(<ItemCard item={mockItem} />, { lang: 'ar' });

    expect(screen.getByText('قهوة')).toBeInTheDocument();
    expect(screen.getByText('قهوة طازجة')).toBeInTheDocument();
  });

  it('should handle keyboard navigation', () => {
    const onItemClick = vi.fn();
    renderWithProviders(<ItemCard item={mockItem} onItemClick={onItemClick} />);

    const itemCard = screen.getByText('Coffee');
    fireEvent.keyDown(itemCard, { key: 'Enter' });

    expect(onItemClick).toHaveBeenCalledWith(mockItem);
  });

  it('should handle touch events on mobile', () => {
    const onItemClick = vi.fn();
    renderWithProviders(<ItemCard item={mockItem} onItemClick={onItemClick} />);

    const itemCard = screen.getByText('Coffee');
    fireEvent.touchStart(itemCard);
    fireEvent.touchEnd(itemCard);

    expect(onItemClick).toHaveBeenCalledWith(mockItem);
  });

  it('should handle long item names', () => {
    const longNameItem = {
      ...mockItem,
      names: {
        en: 'Very Long Item Name That Should Be Truncated',
        tr: 'Çok Uzun Öğe Adı Kısaltılmalı',
        ar: 'اسم عنصر طويل جداً يجب تقصيره',
      },
    };

    renderWithProviders(<ItemCard item={longNameItem} />);

    expect(
      screen.getByText('Very Long Item Name That Should Be Truncated')
    ).toBeInTheDocument();
  });

  it('should handle zero price', () => {
    const freeItem = { ...mockItem, price: 0 };
    renderWithProviders(<ItemCard item={freeItem} />);

    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('should handle negative price gracefully', () => {
    const negativePriceItem = { ...mockItem, price: -5 };
    renderWithProviders(<ItemCard item={negativePriceItem} />);

    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });
});
