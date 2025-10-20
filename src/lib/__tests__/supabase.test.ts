import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authAPI, categoriesAPI, itemsAPI } from '../supabase';

// Mock fetch globally
global.fetch = vi.fn();

describe('Supabase API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear categories cache
    categoriesAPI.clearCache();
  });

  describe('categoriesAPI', () => {
    it('should fetch categories successfully', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          names: { en: 'Beverages', tr: 'İçecekler', ar: 'المشروبات' },
          icon: '☕',
          order: 0,
          created_at: '2024-01-01',
        },
      ];

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCategories),
      } as Response);

      const result = await categoriesAPI.getAll();

      expect(result).toEqual(mockCategories);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/categories'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Bearer'),
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should handle fetch error', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

      await expect(categoriesAPI.getAll()).rejects.toThrow('Network error');
    });

    it('should handle non-ok response', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      } as Response);

      await expect(categoriesAPI.getAll()).rejects.toThrow('Server error');
    });

    it('should create category', async () => {
      const newCategory = {
        names: { en: 'New Category', tr: 'Yeni Kategori', ar: 'فئة جديدة' },
        icon: '🆕',
        order: 0,
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'new-cat', ...newCategory }),
      } as Response);

      const result = await categoriesAPI.create(newCategory);

      expect(result).toEqual({ id: 'new-cat', ...newCategory });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/categories'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newCategory),
        }),
      );
    });

    it('should update category', async () => {
      const updateData = {
        names: {
          en: 'Updated Category',
          tr: 'Güncellenmiş Kategori',
          ar: 'فئة محدثة',
        },
        icon: '🔄',
        order: 1,
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'cat-1', ...updateData }),
      } as Response);

      const result = await categoriesAPI.update('cat-1', updateData);

      expect(result).toEqual({ id: 'cat-1', ...updateData });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/categories/cat-1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        }),
      );
    });

    it('should delete category', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      const result = await categoriesAPI.delete('cat-1');

      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/categories/cat-1'),
        expect.objectContaining({
          method: 'DELETE',
        }),
      );
    });
  });

  describe('itemsAPI', () => {
    it('should fetch all items', async () => {
      const mockItems = [
        {
          id: 'item-1',
          names: { en: 'Coffee', tr: 'Kahve', ar: 'قهوة' },
          category_id: 'cat-1',
          price: 15.99,
          order: 0,
          created_at: '2024-01-01',
        },
      ];

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockItems),
      } as Response);

      const result = await itemsAPI.getAll();

      expect(result).toEqual(mockItems);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/items'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Bearer'),
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should fetch items by category', async () => {
      const mockItems = [
        {
          id: 'item-1',
          names: { en: 'Coffee', tr: 'Kahve', ar: 'قهوة' },
          category_id: 'cat-1',
          price: 15.99,
          order: 0,
          created_at: '2024-01-01',
        },
      ];

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockItems),
      } as Response);

      const result = await itemsAPI.getAll('cat-1');

      expect(result).toEqual(mockItems);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/items?category_id=cat-1'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Bearer'),
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should create item', async () => {
      const newItem = {
        names: { en: 'New Item', tr: 'Yeni Öğe', ar: 'عنصر جديد' },
        category_id: 'cat-1',
        price: 20.99,
        order: 0,
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'new-item', ...newItem }),
      } as Response);

      const result = await itemsAPI.create(newItem);

      expect(result).toEqual({ id: 'new-item', ...newItem });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/items'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newItem),
        }),
      );
    });

    it('should update item', async () => {
      const updateData = {
        names: { en: 'Updated Item', tr: 'Güncellenmiş Öğe', ar: 'عنصر محدث' },
        category_id: 'cat-1',
        price: 25.99,
        order: 1,
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'item-1', ...updateData }),
      } as Response);

      const result = await itemsAPI.update('item-1', updateData);

      expect(result).toEqual({ id: 'item-1', ...updateData });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/items/item-1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        }),
      );
    });

    it('should delete item', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      const result = await itemsAPI.delete('item-1');

      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/items/item-1'),
        expect.objectContaining({
          method: 'DELETE',
        }),
      );
    });

    it('should update item order', async () => {
      const orderUpdates = [
        { id: 'item-1', order: 0 },
        { id: 'item-2', order: 1 },
      ];

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      const result = await itemsAPI.updateOrder(orderUpdates);

      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/items/bulk/update-order'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ orderUpdates }),
        }),
      );
    });
  });

  describe('authAPI', () => {
    it('should sign up successfully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const mockSession = {
        access_token: 'mock-token',
        user: {
          email: 'test@example.com',
          name: 'Test User',
          id: 'user-1',
        },
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { session: mockSession } }),
        text: () =>
          Promise.resolve(JSON.stringify({ data: { session: mockSession } })),
      } as Response);

      const result = await authAPI.signUp(credentials);

      expect(result.data).toEqual({ data: { session: mockSession } });
      expect(result.error).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/signup'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(credentials),
        }),
      );
    });

    it('should handle signup error', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Email already exists' }),
        text: () =>
          Promise.resolve(JSON.stringify({ error: 'Email already exists' })),
      } as Response);

      await expect(authAPI.signUp(credentials)).rejects.toThrow(
        'Email already exists'
      );
    });

    it('should sign in successfully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockSession = {
        access_token: 'mock-token',
        user: {
          email: 'test@example.com',
          name: 'Test User',
          id: 'user-1',
        },
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { session: mockSession } }),
        text: () =>
          Promise.resolve(JSON.stringify({ data: { session: mockSession } })),
      } as Response);

      const result = await authAPI.signInWithPassword(credentials);

      expect(result.data).toEqual({ data: { session: mockSession } });
      expect(result.error).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(credentials),
        }),
      );
    });

    it('should handle signin error', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      } as Response);

      await expect(authAPI.signInWithPassword(credentials)).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should get session', async () => {
      const mockSession = {
        access_token: 'mock-token',
        user: {
          email: 'test@example.com',
          name: 'Test User',
          id: 'user-1',
        },
      };

      // Mock localStorage
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue(JSON.stringify(mockSession)),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });

      const result = await authAPI.getSession();

      expect(result.data).toEqual({ session: mockSession });
      expect(result.error).toBeNull();
    });

    it('should sign out', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      const result = await authAPI.signOut();

      expect(result.error).toBeNull();
    });
  });
});
