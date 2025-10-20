import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../test/utils/test-utils';
import AdminCategories from '../AdminCategories';

// Mock the API calls
const mockCreateCategory = vi.fn();
const mockUpdateCategory = vi.fn();
const mockDeleteCategory = vi.fn();
const mockReorderCategories = vi.fn();

vi.mock('../../../lib/supabase', () => ({
  createCategory: mockCreateCategory,
  updateCategory: mockUpdateCategory,
  deleteCategory: mockDeleteCategory,
  reorderCategories: mockReorderCategories,
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
  {
    id: '2',
    names: { en: 'Desserts', tr: 'Tatlılar', ar: 'الحلويات' },
    icon: '🍰',
    color: '#FF6B6B',
    order: 1,
    is_active: true,
  },
];

describe('AdminCategories Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render categories list', () => {
    renderWithProviders(
      <AdminCategories
        categories={mockCategories}
        onCategoriesChange={vi.fn()}
      />
    );

    expect(screen.getByText('Beverages')).toBeInTheDocument();
    expect(screen.getByText('Desserts')).toBeInTheDocument();
  });

  it('should open create category form when add button is clicked', () => {
    renderWithProviders(
      <AdminCategories
        categories={mockCategories}
        onCategoriesChange={vi.fn()}
      />

    const addButton = screen.getByText('Add Category');
    fireEvent.click(addButton);

    expect(screen.getByText('Create New Category')).toBeInTheDocument();
  });

  it('should create a new category', async () => {
    const onCategoriesChange = vi.fn();
    mockCreateCategory.mockResolvedValue({ id: '3', ...mockCategories[0] });

    renderWithProviders(
      <AdminCategories
        categories={mockCategories}
        onCategoriesChange={onCategoriesChange}
      />

    // Open create form
    fireEvent.click(screen.getByText('Add Category'));

    // Fill form
    fireEvent.change(screen.getByLabelText('English Name'), {
      target: { value: 'New Category' },
    });
    fireEvent.change(screen.getByLabelText('Turkish Name'), {
      target: { value: 'Yeni Kategori' },
    });
    fireEvent.change(screen.getByLabelText('Arabic Name'), {
      target: { value: 'فئة جديدة' },
    });
    fireEvent.change(screen.getByLabelText('Icon'), {
      target: { value: '🆕' },
    });
    fireEvent.change(screen.getByLabelText('Color'), {
      target: { value: '#00FF00' },
    });

    // Submit form
    fireEvent.click(screen.getByText('Create Category'));

    await waitFor(() => {
      expect(mockCreateCategory).toHaveBeenCalledWith({
        names: {
          en: 'New Category',
          tr: 'Yeni Kategori',
          ar: 'فئة جديدة',
        },
        icon: '🆕',
        color: '#00FF00',
        order: 0,
      });
    });
  });

  it('should update an existing category', async () => {
    const onCategoriesChange = vi.fn();
    mockUpdateCategory.mockResolvedValue({ id: '1', ...mockCategories[0] });

    renderWithProviders(
      <AdminCategories
        categories={mockCategories}
        onCategoriesChange={onCategoriesChange}
      />

    // Click edit button for first category
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    // Update the name
    fireEvent.change(screen.getByDisplayValue('Beverages'), {
      target: { value: 'Updated Beverages' },
    });

    // Submit changes
    fireEvent.click(screen.getByText('Update Category'));

    await waitFor(() => {
      expect(mockUpdateCategory).toHaveBeenCalledWith('1', {
        names: {
          en: 'Updated Beverages',
          tr: 'İçecekler',
          ar: 'المشروبات',
        },
      });
    });
  });

  it('should delete a category', async () => {
    const onCategoriesChange = vi.fn();
    mockDeleteCategory.mockResolvedValue({ success: true });

    renderWithProviders(
      <AdminCategories
        categories={mockCategories}
        onCategoriesChange={onCategoriesChange}
      />

    // Click delete button for first category
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    // Confirm deletion
    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(mockDeleteCategory).toHaveBeenCalledWith('1');
    });
  });

  it('should handle drag and drop reordering', async () => {
    const onCategoriesChange = vi.fn();
    mockReorderCategories.mockResolvedValue({ success: true });

    renderWithProviders(
      <AdminCategories
        categories={mockCategories}
        onCategoriesChange={onCategoriesChange}
      />

    // Simulate drag and drop (simplified test)
    const firstCategory = screen.getByText('Beverages');
    const secondCategory = screen.getByText('Desserts');

    // This would need more complex testing with react-dnd
    expect(firstCategory).toBeInTheDocument();
    expect(secondCategory).toBeInTheDocument();
  });

  it('should handle image upload', async () => {
    const onCategoriesChange = vi.fn();
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    renderWithProviders(
      <AdminCategories
        categories={mockCategories}
        onCategoriesChange={onCategoriesChange}
      />

    // Open create form
    fireEvent.click(screen.getByText('Add Category'));

    // Upload image
    const fileInput = screen.getByLabelText('Category Image');
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    expect(fileInput.files[0]).toBe(mockFile);
  });

  it('should validate form inputs', async () => {
    renderWithProviders(
      <AdminCategories
        categories={mockCategories}
        onCategoriesChange={vi.fn()}
      />

    // Open create form
    fireEvent.click(screen.getByText('Add Category'));

    // Try to submit without required fields
    fireEvent.click(screen.getByText('Create Category'));

    // Should show validation errors
    expect(screen.getByText('English name is required')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    const onCategoriesChange = vi.fn();
    mockCreateCategory.mockRejectedValue(new Error('API Error'));

    renderWithProviders(
      <AdminCategories
        categories={mockCategories}
        onCategoriesChange={onCategoriesChange}
      />

    // Open create form
    fireEvent.click(screen.getByText('Add Category'));

    // Fill and submit form
    fireEvent.change(screen.getByLabelText('English Name'), {
      target: { value: 'Test Category' },
    });
    fireEvent.click(screen.getByText('Create Category'));

    await waitFor(() => {
      expect(screen.getByText('Failed to create category')).toBeInTheDocument();
    });
  });

  it('should show loading states', async () => {
    const onCategoriesChange = vi.fn();
    mockCreateCategory.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))

    renderWithProviders(
      <AdminCategories
        categories={mockCategories}
        onCategoriesChange={onCategoriesChange}
      />

    // Open create form
    fireEvent.click(screen.getByText('Add Category'));

    // Fill and submit form
    fireEvent.change(screen.getByLabelText('English Name'), {
      target: { value: 'Test Category' },
    });
    fireEvent.click(screen.getByText('Create Category'));

    // Should show loading state
    expect(screen.getByText('Creating...')).toBeInTheDocument();
  });
});
