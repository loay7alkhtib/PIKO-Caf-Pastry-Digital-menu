import { useCallback, useEffect, useState } from 'react';
// @ts-ignore
import { DndProvider } from 'react-dnd';
// @ts-ignore
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useLang } from '../../lib/LangContext';
import { Category, Item, itemsAPI } from '../../lib/supabase';
import { toast } from 'sonner';
import { UsageMonitor } from './UsageMonitor';
import { FreePlanStatus } from './FreePlanStatus';
import { StaticMenuGenerator } from './StaticMenuGenerator';
import {
  ChevronDown,
  ChevronRight,
  Edit3,
  GripVertical,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';
import NotionStyleItem from './NotionStyleItem';

interface NotionStyleAdminProps {
  items: Item[];
  categories: Category[];
  onRefresh: () => void;
}

interface CategoryWithItems {
  category: Category;
  items: Item[];
  isExpanded: boolean;
}

export default function NotionStyleAdmin({
  items,
  categories,
  onRefresh,
}: NotionStyleAdminProps) {
  const { lang } = useLang();
  const [localItems, setLocalItems] = useState<Item[]>([]);
  const [categoryStates, setCategoryStates] = useState<Map<string, boolean>>(
    new Map()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, any>>(
    new Map()
  );

  // Update local items when props change
  useEffect(() => {
    setLocalItems([...items]);

    // Initialize category states - expand first category by default
    const newCategoryStates = new Map<string, boolean>();
    categories.forEach((cat, index) => {
      newCategoryStates.set(cat.id, index === 0); // Expand first category
    });
    setCategoryStates(newCategoryStates);
  }, [items, categories]);

  // Group items by category
  const categoriesWithItems: CategoryWithItems[] = categories
    .sort((a, b) => a.order - b.order)
    .map(category => ({
      category,
      items: localItems
        .filter(item => item.category_id === category.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0)),
      isExpanded: categoryStates.get(category.id) || false,
    }));

  // Debounced save function to batch updates
  const debouncedSave = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (updates: Map<string, any>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (updates.size === 0) return;

          setIsSaving(true);
          try {
            const updatePromises = Array.from(updates.entries()).map(
              ([id, data]) => itemsAPI.update(id, data)
            );

            await Promise.all(updatePromises);
            console.log('✅ Batch update completed:', updates.size, 'items');
            setPendingUpdates(new Map());
            toast.success('Changes saved successfully!');
          } catch (error: any) {
            console.error('❌ Batch update failed:', error);
            toast.error('Failed to save changes');
            // Revert optimistic updates
            setLocalItems([...items]);
          } finally {
            setIsSaving(false);
          }
        }, 500); // 500ms debounce
      };
    })(),
    [items]
  );

  // Helper function to recalculate order values when moving items
  const recalculateOrders = (
    allItems: Item[],
    movedItemId: string,
    newCategoryId: string,
    newPosition: number
  ) => {
    const movedItem = allItems.find(item => item.id === movedItemId);
    if (!movedItem) return allItems;

    const sourceCategoryId = movedItem.category_id;
    const isCrossCategory = sourceCategoryId !== newCategoryId;

    let updatedItems = [...allItems];

    if (isCrossCategory) {
      // Remove item from source category and close gaps
      const sourceItems = updatedItems.filter(
        item => item.category_id === sourceCategoryId
      );
      const reorderedSourceItems = sourceItems
        .filter(item => item.id !== movedItemId)
        .map((item, index) => ({ ...item, order: index }));

      // Update moved item with new category and position
      const targetItems = updatedItems.filter(
        item => item.category_id === newCategoryId
      );
      const reorderedTargetItems = [...targetItems];
      reorderedTargetItems.splice(newPosition, 0, {
        ...movedItem,
        category_id: newCategoryId,
        order: newPosition,
      });

      // Recalculate order for all target items
      const finalTargetItems = reorderedTargetItems.map((item, index) => ({
        ...item,
        order: index,
      }));

      // Update the main items array
      updatedItems = updatedItems.map(item => {
        // Update source category items (with gaps closed)
        const sourceItem = reorderedSourceItems.find(si => si.id === item.id);
        if (sourceItem) return sourceItem;

        // Update target category items (with new item inserted)
        const targetItem = finalTargetItems.find(ti => ti.id === item.id);
        if (targetItem) return targetItem;

        // Keep other items unchanged
        return item;
      });
    } else {
      // Same category reordering
      const categoryItems = updatedItems.filter(
        item => item.category_id === newCategoryId
      );
      const reorderedItems = [...categoryItems];
      const dragItem = reorderedItems.find(item => item.id === movedItemId);

      if (dragItem) {
        reorderedItems.splice(reorderedItems.indexOf(dragItem), 1);
        reorderedItems.splice(newPosition, 0, dragItem);

        // Update order values
        const finalItems = reorderedItems.map((item, index) => ({
          ...item,
          order: index,
        }));

        updatedItems = updatedItems.map(item => {
          const foundItem = finalItems.find(fi => fi.id === item.id);
          return foundItem || item;
        });
      }
    }

    return updatedItems;
  };

  const moveItem = useCallback(
    async (
      dragIndex: number,
      hoverIndex: number,
      dragItem?: Item,
      hoverItem?: Item
    ) => {
      const sourceItem = dragItem;
      const targetItem = hoverItem;

      if (!sourceItem || !targetItem) {
        console.warn('Missing source or target item for drag operation');
        return;
      }

      const isCrossCategory = sourceItem.category_id !== targetItem.category_id;
      const targetCategoryId = targetItem.category_id;
      const targetPosition = hoverIndex;

      // Calculate new order values
      const updatedItems = recalculateOrders(
        localItems,
        sourceItem.id,
        targetCategoryId,
        targetPosition
      );

      // Update local state immediately for smooth UX
      setLocalItems(updatedItems);

      // Get all items that need updating (both source and target categories)
      const itemsToUpdate = updatedItems.filter(
        item =>
          item.category_id === sourceItem.category_id ||
          item.category_id === targetCategoryId
      );

      // Add updates to pending queue
      const newPendingUpdates = new Map(pendingUpdates);
      itemsToUpdate.forEach(item => {
        newPendingUpdates.set(item.id, {
          order: item.order,
          ...(isCrossCategory && item.id === sourceItem.id
            ? { category_id: targetCategoryId }
            : {}),
        });
      });
      setPendingUpdates(newPendingUpdates);

      // Trigger debounced save
      debouncedSave(newPendingUpdates);

      // Show immediate feedback
      const successMessage = isCrossCategory
        ? `Moving to ${categories.find(c => c.id === targetCategoryId)?.names?.en || 'category'}...`
        : 'Reordering...';
      toast.success(successMessage);
    },
    [localItems, categories, debouncedSave, pendingUpdates]
  );

  const updateItem = useCallback(
    async (itemId: string, updates: Partial<Item>) => {
      // Update local state immediately
      setLocalItems(prev =>
        prev.map(item => (item.id === itemId ? { ...item, ...updates } : item))
      );

      // Add to pending updates
      const newPendingUpdates = new Map(pendingUpdates);
      const existingUpdates = newPendingUpdates.get(itemId) || {};
      newPendingUpdates.set(itemId, { ...existingUpdates, ...updates });
      setPendingUpdates(newPendingUpdates);

      // Trigger debounced save
      debouncedSave(newPendingUpdates);
    },
    [pendingUpdates, debouncedSave]
  );

  const toggleCategory = (categoryId: string) => {
    setCategoryStates(prev => {
      const newStates = new Map(prev);
      newStates.set(categoryId, !newStates.get(categoryId));
      return newStates;
    });
  };

  const expandAllCategories = () => {
    const newStates = new Map<string, boolean>();
    categories.forEach(cat => newStates.set(cat.id, true));
    setCategoryStates(newStates);
  };

  const collapseAllCategories = () => {
    const newStates = new Map<string, boolean>();
    categories.forEach(cat => newStates.set(cat.id, false));
    setCategoryStates(newStates);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;

    try {
      await itemsAPI.delete(id);
      toast.success('Item deleted');
      onRefresh();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-2'>
          <h2 className='text-2xl font-semibold' style={{ color: '#0C6071' }}>
            Menu Manager
          </h2>
          <span className='text-sm text-muted-foreground'>
            ({items.length} items)
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            onClick={expandAllCategories}
            variant='outline'
            size='sm'
            className='gap-2'
          >
            <ChevronDown className='w-4 h-4' />
            Expand All
          </Button>
          <Button
            onClick={collapseAllCategories}
            variant='outline'
            size='sm'
            className='gap-2'
          >
            <ChevronRight className='w-4 h-4' />
            Collapse All
          </Button>
          <Button
            onClick={() => {
              /* TODO: Add new item dialog */
            }}
            size='sm'
            className='gap-2 shrink-0'
            style={{ backgroundColor: '#0C6071' }}
          >
            <Plus className='w-4 h-4' />
            <span className='hidden sm:inline'>Add Item</span>
          </Button>
        </div>
      </div>

      {/* Saving indicator */}
      {isSaving && (
        <div className='flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg'>
          <div className='w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
          Saving changes...
        </div>
      )}

      <DndProvider backend={HTML5Backend}>
        <div className='space-y-4'>
          {categoriesWithItems.map(
            ({ category, items: categoryItems, isExpanded }) => (
              <Card
                key={category.id}
                className='overflow-hidden border-l-4'
                style={{ borderLeftColor: category.color }}
              >
                <Collapsible
                  open={isExpanded}
                  onOpenChange={() => toggleCategory(category.id)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className='cursor-pointer hover:bg-muted/50 transition-colors'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          <div className='flex items-center gap-2'>
                            {isExpanded ? (
                              <ChevronDown className='w-4 h-4' />
                            ) : (
                              <ChevronRight className='w-4 h-4' />
                            )}
                            <span className='text-2xl'>{category.icon}</span>
                            <div>
                              <CardTitle className='text-lg'>
                                {category.names.en}
                              </CardTitle>
                              <p className='text-sm text-muted-foreground'>
                                {categoryItems.length} items
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Badge
                            variant='secondary'
                            style={{
                              backgroundColor: `${category.color}20`,
                              color: category.color,
                            }}
                          >
                            {categoryItems.length} items
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className='p-0'>
                      {categoryItems.length === 0 ? (
                        <div className='p-8 text-center text-muted-foreground'>
                          <div className='text-4xl mb-2'>📝</div>
                          <p>No items in this category</p>
                        </div>
                      ) : (
                        <div className='divide-y'>
                          {categoryItems.map((item, index) => (
                            <NotionStyleItem
                              key={item.id}
                              item={item}
                              index={index}
                              categories={categories}
                              onMove={(
                                dragIndex,
                                hoverIndex,
                                dragItem,
                                hoverItem
                              ) =>
                                moveItem(
                                  dragIndex,
                                  hoverIndex,
                                  dragItem,
                                  hoverItem
                                )
                              }
                              onUpdate={updateItem}
                              onDelete={handleDelete}
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )
          )}
        </div>
      </DndProvider>

      {/* Free Plan Optimization Section */}
      <div className='mt-8 space-y-8'>
        <FreePlanStatus
          onRefresh={() => window.location.reload()}
          onGenerateStatic={() => {
            // Trigger static menu generation
            window.open('/api/generate-static', '_blank');
          }}
        />

        <StaticMenuGenerator />

        <UsageMonitor />
      </div>
    </div>
  );
}
