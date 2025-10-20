import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../test/utils/test-utils';
import AdminItems from '../AdminItems';

// Mock the API calls
const mockCreateItem = vi.fn();
const mockUpdateItem = vi.fn();
const mockDeleteItem = vi.fn();
const mockReorderItems = vi.fn();

vi.mock('../../../lib/supabase', () => ({
  createItem: mockCreateItem,
  updateItem: mockUpdateItem,
  deleteItem: mockDeleteItem,
  reorderItems: mockReorderItems,
}));

const mockCategories = [
  {
    id: '1',
    names: { en: 'Beverages', tr: 'İçecekler', ar: 'المشروبات' },
    icon: '☕',
    color: '#0C6071',
    order: 0,
    is_active: true,
  },
];

const mockItems = [
  {
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
  },
  {
    id: '2',
    names: { en: 'Tea', tr: 'Çay', ar: 'شاي' },
    descriptions: { en: 'Herbal tea', tr: 'Bitki çayı', ar: 'شاي عشبي' },
    category_id: '1',
    price: 10.0,
    image_url: 'tea.jpg',
    tags: ['hot', 'beverage'],
    variants: [],
    is_active: true,
    order: 1,
  },
];

describe('AdminItems Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render items list', () => {
    renderWithProviders(
      <AdminItems
        items={mockItems}
        categories={mockCategories}
        onItemsChange={vi.fn()}
      />
    );

    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Tea')).toBeInTheDocument();
  });

  it('should filter items by category', () => {
    renderWithProviders(
      <AdminItems
        items={mockItems}
        categories={mockCategories}
        onItemsChange={vi.fn()}
      />
    );

    // Select category filter
    const categorySelect = screen.getByLabelText('Filter by Category');
    fireEvent.change(categorySelect, { target: { value: '1' } });

    // Should show only items from selected category
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Tea')).toBeInTheDocument();
  });

  it('should open create item form when add button is clicked', () => {
    renderWithProviders(
      <AdminItems
        items={mockItems}
        categories={mockCategories}
        onItemsChange={vi.fn()}
      />
    );

    const addButton = screen.getByText('Add Item');
    fireEvent.click(addButton);

    expect(screen.getByText('Create New Item')).toBeInTheDocument();
  });

  it('should create a new item', async () => {
    const onItemsChange = vi.fn();
    mockCreateItem.mockResolvedValue({ id: '3', ...mockItems[0] });

    renderWithProviders(
      <AdminItems
        items={mockItems}
        categories={mockCategories}
        onItemsChange={onItemsChange}
      />
    );

    // Open create form
    fireEvent.click(screen.getByText('Add Item'));

    // Fill form
    fireEvent.change(screen.getByLabelText('English Name'), {
      target: { value: 'New Item' },
    });
    fireEvent.change(screen.getByLabelText('Turkish Name'), {
      target: { value: 'Yeni Öğe' },
    });
    fireEvent.change(screen.getByLabelText('Arabic Name'), {
      target: { value: 'عنصر جديد' },
    });
    fireEvent.change(screen.getByLabelText('Price'), {
      target: { value: '20.00' },
    });
    fireEvent.change(screen.getByLabelText('Category'), {
      target: { value: '1' },
    });

    // Submit form
    fireEvent.click(screen.getByText('Create Item'));

    await waitFor(() => {
      expect(mockCreateItem).toHaveBeenCalledWith({
        names: {
          en: 'New Item',
          tr: 'Yeni Öğe',
          ar: 'عنصر جديد',
        },
        category_id: '1',
        price: 20.0,
        descriptions: undefined,
        image_url: undefined,
        tags: ['menu-item'],
        variants: [],
        order: 0,
      });
    });
  });

  it('should update an existing item', async () => {
    const onItemsChange = vi.fn();
    mockUpdateItem.mockResolvedValue({ id: '1', ...mockItems[0] });

    renderWithProviders(
      <AdminItems
        items={mockItems}
        categories={mockCategories}
        onItemsChange={onItemsChange}
      />
    );

    // Click edit button for first item
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    // Update the name
    fireEvent.change(screen.getByDisplayValue('Coffee'), {
      target: { value: 'Updated Coffee' },
    });

    // Submit changes
    fireEvent.click(screen.getByText('Update Item'));

    await waitFor(() => {
      expect(mockUpdateItem).toHaveBeenCalledWith('1', {
        names: {
          en: 'Updated Coffee',
          tr: 'Kahve',
          ar: 'قهوة',
        },
      });
    });
  });

  it('should delete an item', async () => {
    const onItemsChange = vi.fn();
    mockDeleteItem.mockResolvedValue({ success: true });

    renderWithProviders(
      <AdminItems
        items={mockItems}
        categories={mockCategories}
        onItemsChange={onItemsChange}
      />
    );

    // Click delete button for first item
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    // Confirm deletion
    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(mockDeleteItem).toHaveBeenCalledWith('1');
    });
  });

  it('should handle variant management', async () => {
    const onItemsChange = vi.fn();

    renderWithProviders(
      <AdminItems
        items={mockItems}
        categories={mockCategories}
        onItemsChange={onItemsChange}
      />
    );

    // Click edit button for first item
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    // Add variant
    fireEvent.click(screen.getByText('Add Variant'));
    fireEvent.change(screen.getByLabelText('Variant Size'), {
      target: { value: 'Medium' },
    });
    fireEvent.change(screen.getByLabelText('Variant Price'), {
      target: { value: '16.00' },
    });

    // Submit changes
    fireEvent.click(screen.getByText('Update Item'));

    await waitFor(() => {
      expect(mockUpdateItem).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          variants: expect.arrayContaining([
            expect.objectContaining({
              size: 'Medium',
              price: 16.0,
            }),
          ]),
        })
      );
    });
  });

  it('should handle image upload', async () => {
    const onItemsChange = vi.fn();
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    renderWithProviders(
      <AdminItems
        items={mockItems}
        categories={mockCategories}
        onItemsChange={onItemsChange}
      />
    );

    // Open create form
    fireEvent.click(screen.getByText('Add Item'));

    // Upload image
    const fileInput = screen.getByLabelText('Item Image');
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    expect(fileInput.files[0]).toBe(mockFile);
  });

  it('should validate form inputs', async () => {
    renderWithProviders(
      <AdminItems
        items={mockItems}
        categories={mockCategories}
        onItemsChange={vi.fn()}
      />
    );

    // Open create form
    fireEvent.click(screen.getByText('Add Item'));

    // Try to submit without required fields
    fireEvent.click(screen.getByText('Create Item'));

    // Should show validation errors
    expect(screen.getByText('English name is required')).toBeInTheDocument();
    expect(screen.getByText('Category is required')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    const onItemsChange = vi.fn();
    mockCreateItem.mockRejectedValue(new Error('API Error'));

    renderWithProviders(
      <AdminItems
        items={mockItems}
        categories={mockCategories}
        onItemsChange={onItemsChange}
      />
    );

    // Open create form
    fireEvent.click(screen.getByText('Add Item'));

    // Fill and submit form
    fireEvent.change(screen.getByLabelText('English Name'), {
      target: { value: 'Test Item' },
    });
    fireEvent.change(screen.getByLabelText('Category'), {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByText('Create Item'));

    await waitFor(() => {
      expect(screen.getByText('Failed to create item')).toBeInTheDocument();
    });
  });

  it('should show loading states', async () => {
    const onItemsChange = vi.fn();
    mockCreateItem.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    renderWithProviders(
      <AdminItems
        items={mockItems}
        categories={mockCategories}
        onItemsChange={onItemsChange}
      />
    );

    // Open create form
    fireEvent.click(screen.getByText('Add Item'));

    // Fill and submit form
    fireEvent.change(screen.getByLabelText('English Name'), {
      target: { value: 'Test Item' },
    });
    fireEvent.change(screen.getByLabelText('Category'), {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByText('Create Item'));

    // Should show loading state
    expect(screen.getByText('Creating...')).toBeInTheDocument();
  });
});
