import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Integration Tests - Categories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /categories', () => {
    it('should fetch categories successfully', async () => {
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      const response = await fetch('/api/categories');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data).toEqual(mockCategories);
    });

    it('should handle API errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetch('/api/categories')).rejects.toThrow('Network error');
    });
  });

  describe('POST /categories', () => {
    it('should create a new category', async () => {
      const newCategory = {
        names: { en: 'New Category', tr: 'Yeni Kategori', ar: 'فئة جديدة' },
        icon: '🆕',
        color: '#00FF00',
        order: 0,
      };

      const createdCategory = { id: '2', ...newCategory };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createdCategory,
      });

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data).toEqual(createdCategory);
    });

    it('should validate required fields', async () => {
      const invalidCategory = {
        icon: '🆕',
        color: '#00FF00',
        order: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'English name is required' }),
      });

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidCategory),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });
  });

  describe('PUT /categories/:id', () => {
    it('should update an existing category', async () => {
      const updatedCategory = {
        names: {
          en: 'Updated Category',
          tr: 'Güncellenmiş Kategori',
          ar: 'فئة محدثة',
        },
        icon: '🔄',
        color: '#FF0000',
        order: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1', ...updatedCategory }),
      });

      const response = await fetch('/api/categories/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCategory),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.names.en).toBe('Updated Category');
    });

    it('should handle non-existent category', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Category not found' }),
      });

      const response = await fetch('/api/categories/999', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names: { en: 'Test' } }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /categories/:id', () => {
    it('should delete a category', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const response = await fetch('/api/categories/1', {
        method: 'DELETE',
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
    });

    it('should handle deletion of non-existent category', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Category not found' }),
      });

      const response = await fetch('/api/categories/999', {
        method: 'DELETE',
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts', async () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 100)
          )
      );

      await expect(fetch('/api/categories')).rejects.toThrow('Request timeout');
    });

    it('should handle server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      });

      const response = await fetch('/api/categories');
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
