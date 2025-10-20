import { describe, expect, it } from 'vitest';
import {
  createBatchUpdatePayload,
  getFilteredItems,
  isValidDragEnd,
  reorderWithinCategory,
} from '../drag-drop-utils';
import { Item } from '../supabase';

// Mock data for testing
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
  {
    id: 'item3',
    names: { en: 'Cake', tr: 'Pasta', ar: 'كيك' },
    category_id: 'cat2',
    price: 15,
    image: null,
    tags: ['sweet', 'dessert'],
    order: 0,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'item4',
    names: { en: 'Sandwich', tr: 'Sandviç', ar: 'ساندويتش' },
    category_id: 'cat1',
    price: 12,
    image: null,
    tags: ['food', 'lunch'],
    order: 2,
    created_at: '2024-01-01T00:00:00Z',
  },
];

describe('drag-drop-utils', () => {
  describe('reorderWithinCategory', () => {
    it('should reorder items within a category correctly', () => {
      // Move item from index 1 to index 0 in cat1
      const result = reorderWithinCategory(mockItems, 'cat1', 1, 0);

      // Find cat1 items in result
      const cat1Items = result.filter(item => item.category_id === 'cat1');

      // Should have 3 items
      expect(cat1Items).toHaveLength(3);

      // Check order values are contiguous (0, 1, 2)
      const orders = cat1Items.map(item => item.order).sort();
      expect(orders).toEqual([0, 1, 2]);

      // Check that Tea (item2) is now first (order: 0)
      const teaItem = result.find(item => item.id === 'item2');
      expect(teaItem?.order).toBe(0);

      // Check that Coffee (item1) is now second (order: 1)
      const coffeeItem = result.find(item => item.id === 'item1');
      expect(coffeeItem?.order).toBe(1);

      // Check that Sandwich (item4) is now third (order: 2)
      const sandwichItem = result.find(item => item.id === 'item4');
      expect(sandwichItem?.order).toBe(2);
    });

    it('should not affect items in other categories', () => {
      const result = reorderWithinCategory(mockItems, 'cat1', 1, 0);

      // Check that cat2 item is unchanged
      const cakeItem = result.find(item => item.id === 'item3');
      expect(cakeItem?.order).toBe(0);
      expect(cakeItem?.category_id).toBe('cat2');
    });

    it('should return same array when startIndex equals endIndex', () => {
      const result = reorderWithinCategory(mockItems, 'cat1', 1, 1);
      expect(result).toEqual(mockItems);
    });
  });

  describe('getFilteredItems', () => {
    it('should filter and sort items by category', () => {
      const result = getFilteredItems(mockItems, 'cat1');

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('item1'); // Coffee (order: 0)
      expect(result[1].id).toBe('item2'); // Tea (order: 1)
      expect(result[2].id).toBe('item4'); // Sandwich (order: 2)
    });

    it('should return empty array for non-existent category', () => {
      const result = getFilteredItems(mockItems, 'nonexistent');
      expect(result).toHaveLength(0);
    });
  });

  describe('isValidDragEnd', () => {
    it('should return true for valid drag end', () => {
      const result = {
        destination: { index: 1 },
        source: { index: 0 },
      };
      expect(isValidDragEnd(result)).toBe(true);
    });

    it('should return false for null destination', () => {
      const result = {
        destination: null,
        source: { index: 0 },
      };
      expect(isValidDragEnd(result)).toBe(false);
    });

    it('should return false for same index', () => {
      const result = {
        destination: { index: 0 },
        source: { index: 0 },
      };
      expect(isValidDragEnd(result)).toBe(false);
    });
  });

  describe('createBatchUpdatePayload', () => {
    it('should create correct batch update payload', () => {
      const result = createBatchUpdatePayload(mockItems, 'cat1');

      expect(result).toHaveLength(3);
      expect(result).toEqual([
        { id: 'item1', order: 0 },
        { id: 'item2', order: 1 },
        { id: 'item4', order: 2 },
      ]);
    });

    it('should return empty array for non-existent category', () => {
      const result = createBatchUpdatePayload(mockItems, 'nonexistent');
      expect(result).toHaveLength(0);
    });
  });

  describe('reordering persistence test', () => {
    it('should maintain order after simulated reorder and refetch', () => {
      // Simulate initial state
      let items = [...mockItems];

      // Simulate drag & drop: move Tea (index 1) to position 0
      items = reorderWithinCategory(items, 'cat1', 1, 0);

      // Verify reorder worked
      const cat1Items = items.filter(item => item.category_id === 'cat1');
      expect(cat1Items.find(item => item.id === 'item2')?.order).toBe(0); // Tea first
      expect(cat1Items.find(item => item.id === 'item1')?.order).toBe(1); // Coffee second
      expect(cat1Items.find(item => item.id === 'item4')?.order).toBe(2); // Sandwich third

      // Simulate "refetch" - create new items array with updated order values
      const refetchedItems: Item[] = [
        {
          id: 'item1',
          names: { en: 'Coffee', tr: 'Kahve', ar: 'قهوة' },
          category_id: 'cat1',
          price: 10,
          image: null,
          tags: ['hot', 'beverage'],
          order: 1, // Updated order from database
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'item2',
          names: { en: 'Tea', tr: 'Çay', ar: 'شاي' },
          category_id: 'cat1',
          price: 8,
          image: null,
          tags: ['hot', 'beverage'],
          order: 0, // Updated order from database
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'item3',
          names: { en: 'Cake', tr: 'Pasta', ar: 'كيك' },
          category_id: 'cat2',
          price: 15,
          image: null,
          tags: ['sweet', 'dessert'],
          order: 0,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'item4',
          names: { en: 'Sandwich', tr: 'Sandviç', ar: 'ساندويتش' },
          category_id: 'cat1',
          price: 12,
          image: null,
          tags: ['food', 'lunch'],
          order: 2, // Updated order from database
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      // Verify that the refetched items maintain the correct order
      const refetchedCat1Items = getFilteredItems(refetchedItems, 'cat1');
      expect(refetchedCat1Items).toHaveLength(3);
      expect(refetchedCat1Items[0].id).toBe('item2'); // Tea first
      expect(refetchedCat1Items[1].id).toBe('item1'); // Coffee second
      expect(refetchedCat1Items[2].id).toBe('item4'); // Sandwich third

      // Verify order values are still contiguous
      const orders = refetchedCat1Items.map(item => item.order).sort();
      expect(orders).toEqual([0, 1, 2]);
    });
  });
});
