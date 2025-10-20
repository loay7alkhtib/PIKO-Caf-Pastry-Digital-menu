import { Item } from './supabase';

export interface DragDropItem {
  id: string;
  name: string;
  categoryId: string;
  sortIndex: number;
}

/**
 * Reorders items within a specific category
 * @param items - Master array of all items
 * @param categoryId - Category to reorder within
 * @param startIndex - Source index in the filtered view
 * @param endIndex - Destination index in the filtered view
 * @returns New master array with updated sortIndex values
 */
export function reorderWithinCategory(
  items: Item[],
  categoryId: string,
  startIndex: number,
  endIndex: number
): Item[] {
  // Early return if no change
  if (startIndex === endIndex) {
    return items;
  }

  // Get items for this category, ordered by current sort_order
  const categoryItems = items
    .filter(item => item.category_id === categoryId)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Create a copy of the category items array
  const reorderedItems = [...categoryItems];

  // Remove the item from startIndex
  const [movedItem] = reorderedItems.splice(startIndex, 1);

  // Insert it at endIndex
  reorderedItems.splice(endIndex, 0, movedItem);

  // Reassign contiguous sortIndex values (0, 1, 2, ...)
  const updatedCategoryItems = reorderedItems.map((item, index) => ({
    ...item,
    order: index,
  }));

  // Create a map of updated items for quick lookup
  const updatedItemsMap = new Map(
    updatedCategoryItems.map(item => [item.id, item])
  );

  // Return new master array with updated items
  return items.map(item => {
    if (item.category_id === categoryId) {
      return updatedItemsMap.get(item.id) || item;
    }
    return item;
  });
}

/**
 * Maps filtered view indices to master list indices
 * @param items - Master array of all items
 * @param categoryId - Category being filtered
 * @param filteredIndex - Index in the filtered view
 * @returns Index in the master list
 */
export function mapFilteredIndexToMaster(
  items: Item[],
  categoryId: string,
  filteredIndex: number
): number {
  const categoryItems = items
    .filter(item => item.category_id === categoryId)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (filteredIndex >= categoryItems.length) {
    return -1;
  }

  const targetItem = categoryItems[filteredIndex];
  return items.findIndex(item => item.id === targetItem.id);
}

/**
 * Gets the filtered items for a category, sorted by sortIndex
 * @param items - Master array of all items
 * @param categoryId - Category to filter by
 * @returns Filtered and sorted items
 */
export function getFilteredItems(items: Item[], categoryId: string): Item[] {
  return items
    .filter(item => item.category_id === categoryId)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Validates drag end result
 * @param result - Drag end result
 * @returns True if valid, false otherwise
 */
export function isValidDragEnd(result: any): boolean {
  return !!(
    result &&
    result.destination &&
    result.destination.index !== result.source.index
  );
}

/**
 * Creates batch update payload for Supabase
 * @param items - Items with updated order values
 * @param categoryId - Category being updated
 * @returns Array of {id, order} for batch update
 */
export function createBatchUpdatePayload(
  items: Item[],
  categoryId: string
): Array<{ id: string; order: number }> {
  return items
    .filter(item => item.category_id === categoryId)
    .map(item => ({
      id: item.id,
      order: item.order || 0,
    }));
}
