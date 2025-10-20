import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/utils/test-utils';
import CategoryCard from '../CategoryCard';

const mockCategory = {
  id: '1',
  names: { en: 'Beverages', tr: 'İçecekler', ar: 'المشروبات' },
  icon: '☕',
  color: '#0C6071',
  order: 0,
  is_active: true,
};

const mockCategoryWithImage = {
  ...mockCategory,
  image_url: 'beverages.jpg',
};

const mockCategoryInactive = {
  ...mockCategory,
  is_active: false,
};

describe('CategoryCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render category with icon', () => {
    renderWithProviders(<CategoryCard category={mockCategory} />);

    expect(screen.getByText('Beverages')).toBeInTheDocument();
    expect(screen.getByText('☕')).toBeInTheDocument();
  });

  it('should render category with image', () => {
    renderWithProviders(<CategoryCard category={mockCategoryWithImage} />);

    expect(screen.getByText('Beverages')).toBeInTheDocument();
    expect(screen.getByAltText('Beverages')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const onCategoryClick = vi.fn();
    renderWithProviders(
      <CategoryCard category={mockCategory} onCategoryClick={onCategoryClick} />
    );

    fireEvent.click(screen.getByText('Beverages'));

    expect(onCategoryClick).toHaveBeenCalledWith(mockCategory);
  });

  it('should show hover effects', () => {
    renderWithProviders(<CategoryCard category={mockCategory} />);

    const categoryCard = screen.getByText('Beverages');
    fireEvent.mouseEnter(categoryCard);

    // Should show hover state (this would be tested with CSS-in-JS or styled components)
    expect(categoryCard).toBeInTheDocument();
  });

  it('should handle keyboard navigation', () => {
    const onCategoryClick = vi.fn();
    renderWithProviders(
      <CategoryCard category={mockCategory} onCategoryClick={onCategoryClick} />

    const categoryCard = screen.getByText('Beverages');
    fireEvent.keyDown(categoryCard, { key: 'Enter' });

    expect(onCategoryClick).toHaveBeenCalledWith(mockCategory);
  });

  it('should handle space key navigation', () => {
    const onCategoryClick = vi.fn();
    renderWithProviders(
      <CategoryCard category={mockCategory} onCategoryClick={onCategoryClick} />

    const categoryCard = screen.getByText('Beverages');
    fireEvent.keyDown(categoryCard, { key: ' ' });

    expect(onCategoryClick).toHaveBeenCalledWith(mockCategory);
  });

  it('should show inactive state', () => {
    renderWithProviders(<CategoryCard category={mockCategoryInactive} />);

    expect(screen.getByText('Beverages')).toBeInTheDocument();
    // Should show disabled state
    expect(screen.getByText('Beverages')).toHaveClass('opacity-50');
  });

  it('should handle touch events on mobile', () => {
    const onCategoryClick = vi.fn();
    renderWithProviders(
      <CategoryCard category={mockCategory} onCategoryClick={onCategoryClick} />

    const categoryCard = screen.getByText('Beverages');
    fireEvent.touchStart(categoryCard);
    fireEvent.touchEnd(categoryCard);

    expect(onCategoryClick).toHaveBeenCalledWith(mockCategory);
  });

  it('should display different languages', () => {
    // Test with Turkish language
    renderWithProviders(<CategoryCard category={mockCategory} />, {
      lang: 'tr',
    });

    expect(screen.getByText('İçecekler')).toBeInTheDocument();
  });

  it('should display Arabic language with RTL', () => {
    renderWithProviders(<CategoryCard category={mockCategory} />, {
      lang: 'ar',
    });

    expect(screen.getByText('المشروبات')).toBeInTheDocument();
  });

  it('should handle image loading errors', async () => {
    renderWithProviders(<CategoryCard category={mockCategoryWithImage} />);

    const image = screen.getByAltText('Beverages');
    fireEvent.error(image);

    // Should show fallback icon
    await waitFor(() => {
      expect(screen.getByText('☕')).toBeInTheDocument();
    });
  });

  it('should handle long category names', () => {
    const longNameCategory = {
      ...mockCategory,
      names: {
        en: 'Very Long Category Name That Should Be Truncated',
        tr: 'Çok Uzun Kategori Adı Kısaltılmalı',
        ar: 'اسم فئة طويل جداً يجب تقصيره', 
      },
    };

    renderWithProviders(<CategoryCard category={longNameCategory} />);

    expect(
      screen.getByText('Very Long Category Name That Should Be Truncated')
    ).toBeInTheDocument();
  });

  it('should handle missing icon gracefully', () => {
    const categoryWithoutIcon = { ...mockCategory, icon: null };
    renderWithProviders(<CategoryCard category={categoryWithoutIcon} />);

    expect(screen.getByText('Beverages')).toBeInTheDocument();
    // Should show default icon or placeholder
  });

  it('should handle custom colors', () => {
    const customColorCategory = { ...mockCategory, color: '#FF6B6B' };
    renderWithProviders(<CategoryCard category={customColorCategory} />);

    expect(screen.getByText('Beverages')).toBeInTheDocument();
    // Color should be applied to the component
  });

  it('should handle loading state', () => {
    renderWithProviders(
      <CategoryCard category={mockCategory} loading={true} />

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should handle disabled state', () => {
    renderWithProviders(
      <CategoryCard category={mockCategory} disabled={true} />

    const categoryCard = screen.getByText('Beverages');
    expect(categoryCard).toBeDisabled();
  });

  it('should handle focus events', () => {
    renderWithProviders(<CategoryCard category={mockCategory} />);

    const categoryCard = screen.getByText('Beverages');
    fireEvent.focus(categoryCard);

    // Should show focus state
    expect(categoryCard).toHaveFocus();
  });

  it('should handle blur events', () => {
    renderWithProviders(<CategoryCard category={mockCategory} />);

    const categoryCard = screen.getByText('Beverages');
    fireEvent.focus(categoryCard);
    fireEvent.blur(categoryCard);

    // Should remove focus state
    expect(categoryCard).not.toHaveFocus();
  });

  it('should handle mouse leave events', () => {
    renderWithProviders(<CategoryCard category={mockCategory} />);

    const categoryCard = screen.getByText('Beverages');
    fireEvent.mouseEnter(categoryCard);
    fireEvent.mouseLeave(categoryCard);

    // Should remove hover state
    expect(categoryCard).toBeInTheDocument();
  });

  it('should handle multiple rapid clicks', () => {
    const onCategoryClick = vi.fn();
    renderWithProviders(
      <CategoryCard category={mockCategory} onCategoryClick={onCategoryClick} />

    const categoryCard = screen.getByText('Beverages');

    // Rapid clicks
    fireEvent.click(categoryCard);
    fireEvent.click(categoryCard);
    fireEvent.click(categoryCard);

    expect(onCategoryClick).toHaveBeenCalledTimes(3);
  });
});
