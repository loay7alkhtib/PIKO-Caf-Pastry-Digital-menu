# Drag & Drop Implementation - Fixed

## Overview

This document describes the implementation of a robust drag & drop system for menu items that properly persists order changes within categories. The implementation addresses the bug where dragging in a category tab doesn't persist order.

## Key Features

### 1. Single Source of Truth

- **Items Structure**: Each item has `{id, name, categoryId, sortIndex}` with stable keys
- **Stable Keys**: All draggable components use `item.id` as both `key` and `draggableId`
- **Consistent Ordering**: Items are ordered by `sort_order` field in the database

### 2. Category-Specific Reordering

- **Per-Category Ordering**: Each category maintains its own sequential order (0, 1, 2, ...)
- **Immutable Updates**: All reordering operations return new arrays without mutating originals
- **Transaction Support**: Database updates use transactions for consistency

### 3. Database Constraints

- **Unique Constraint**: Added `unique(category_id, sort_order)` to prevent duplicate orders
- **Data Integrity**: Fixed existing duplicate order values before adding constraints
- **Batch Updates**: Transaction-based batch update function for reliable persistence

## Implementation Details

### Core Components

#### 1. `drag-drop-utils.ts`

```typescript
// Main reordering function
export function reorderWithinCategory(
  items: Item[],
  categoryId: string,
  startIndex: number,
  endIndex: number
): Item[];

// Helper functions
export function getFilteredItems(items: Item[], categoryId: string): Item[];
export function isValidDragEnd(result: any): boolean;
export function createBatchUpdatePayload(items: Item[], categoryId: string);
```

#### 2. `AdminItemsDnD.tsx`

- Uses `react-beautiful-dnd` for smooth drag & drop experience
- Implements optimistic updates with error rollback
- Handles category filtering and "All" tab display
- Provides visual feedback for disabled drag operations

#### 3. Database Functions

```sql
-- Transaction-based batch update
CREATE FUNCTION batch_update_item_order(
  order_updates jsonb,
  category_id uuid
) RETURNS jsonb
```

### API Endpoints

#### Batch Update Endpoint

```
PUT /items/batch/update-order
{
  "orderUpdates": [{"id": "uuid", "order": 0}],
  "categoryId": "uuid",
  "useTransaction": true
}
```

## User Experience

### Category-Specific Reordering

1. **Select Category**: Choose a specific category from the filter tabs
2. **Drag Items**: Drag items within the category to reorder them
3. **Persistent Order**: Order changes are saved to the database immediately
4. **Visual Feedback**: Clear indicators show when reordering is available

### "All" Tab Behavior

- **Read-Only**: Drag & drop is disabled in the "All" tab
- **Visual Indicator**: Alert message explains why reordering is disabled
- **Consistent Display**: Items are sorted by category and then by order within each category

## Error Handling

### Optimistic Updates

1. **Immediate UI Update**: Local state updates immediately for responsive UX
2. **Database Sync**: Changes are persisted to database in background
3. **Error Rollback**: If database update fails, UI reverts to previous state
4. **User Feedback**: Toast notifications inform users of success/failure

### Validation

- **Early Returns**: Invalid drag operations are caught and ignored
- **Console Guards**: Extensive logging for debugging drag operations
- **Type Safety**: Full TypeScript support with proper type definitions

## Testing

### Test Coverage

- **Unit Tests**: Comprehensive tests for all utility functions
- **Integration Tests**: Tests verify reordering survives data refetch
- **Edge Cases**: Tests cover invalid drag operations and error scenarios

### Test File: `src/lib/__tests__/drag-drop-utils.test.ts`

- 11 test cases covering all functionality
- Simulates real-world drag & drop scenarios
- Verifies persistence after simulated refetch

## Migration & Deployment

### Database Changes

1. **Fixed Duplicate Orders**: Resolved existing duplicate `sort_order` values
2. **Added Constraint**: `unique(category_id, sort_order)` prevents future duplicates
3. **Created Function**: `batch_update_item_order` for transaction-based updates

### Component Updates

1. **Switched to AdminItemsDnD**: Updated Admin.tsx to use the new component
2. **Improved UX**: Added visual indicators and better error handling
3. **Stable Keys**: Ensured all draggable components use consistent keys

## Performance Considerations

### Optimizations

- **Memoization**: Filtered items are memoized to prevent unnecessary re-renders
- **Batch Updates**: Multiple order changes are batched into single database calls
- **Transaction Support**: Database operations use transactions for consistency
- **Optimistic Updates**: UI responds immediately without waiting for server

### Caching

- **Local State**: Items are cached locally for immediate access
- **Background Sync**: Database updates happen in background
- **Error Recovery**: Failed updates are handled gracefully

## Usage Examples

### Basic Reordering

```typescript
// Drag item from position 1 to position 0 in category "cat1"
const updatedItems = reorderWithinCategory(items, 'cat1', 1, 0);

// Update database
const batchPayload = createBatchUpdatePayload(updatedItems, 'cat1');
await itemsAPI.batchUpdateOrder(batchPayload, 'cat1');
```

### Error Handling

```typescript
try {
  // Optimistic update
  setLocalItems(updatedItems);

  // Database sync
  await itemsAPI.batchUpdateOrder(batchPayload, categoryId);

  toast.success('Items reordered successfully');
} catch (error) {
  // Rollback on error
  setLocalItems(originalItems);
  toast.error('Failed to reorder items');
}
```

## Future Enhancements

### Potential Improvements

1. **Cross-Category Moving**: Allow moving items between categories
2. **Bulk Operations**: Support for selecting and moving multiple items
3. **Undo/Redo**: Add undo functionality for reordering operations
4. **Keyboard Navigation**: Support for keyboard-based reordering
5. **Touch Support**: Enhanced mobile drag & drop experience

### Monitoring

- **Analytics**: Track reordering patterns for UX insights
- **Performance**: Monitor database performance with batch updates
- **Error Rates**: Track and alert on failed reordering operations

## Conclusion

The drag & drop implementation now provides a robust, user-friendly experience for reordering menu items within categories. The system ensures data consistency, provides immediate feedback, and handles errors gracefully. All requirements have been met:

✅ Single source of truth with stable keys  
✅ Category-specific reordering with persistence  
✅ Database constraints and transaction support  
✅ Proper error handling and user feedback  
✅ Comprehensive testing and validation  
✅ Clean separation of concerns and maintainable code

The implementation is production-ready and provides a solid foundation for future enhancements.
