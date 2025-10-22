import { useEffect, useRef, useState } from 'react';
import {
  DndProvider,
  type DragSourceMonitor,
  type DropTargetMonitor,
  useDrag,
  useDrop,
} from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { Identifier, XYCoord } from 'dnd-core';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import ImageUpload from '../ImageUpload';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { useLang } from '../../lib/LangContext';
import { t } from '../../lib/i18n';
import { Category, Item, itemsAPI } from '../../lib/supabase';
import { toast } from 'sonner';
import { Edit, GripVertical, Plus, Trash2 } from 'lucide-react';
import { ConfirmDialogProvider, useConfirm } from '../ui/confirm-dialog';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Switch } from '../ui/switch';

interface AdminItemsSimpleProps {
  items: Item[];
  categories: Category[];
  onRefresh: () => void;
  staticMode: boolean;
}

interface DraggableTableRowProps {
  item: Item;
  index: number;
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onDropReorderComplete: () => void;
  isSelected: boolean;
  onToggleSelect: (id: string, checked: boolean) => void;
  isSearching: boolean;
  categoryLabel?: string;
  onToggleAvailability: (id: string, next: boolean) => void;
  onOrderChange: (id: string, order: number) => void;
}

const DraggableTableRow = ({
  item,
  index,
  onEdit,
  onDelete,
  onMove,
  onDropReorderComplete,
  isSelected,
  onToggleSelect,
  isSearching,
  categoryLabel,
  onToggleAvailability,
  onOrderChange,
}: DraggableTableRowProps) => {
  const ref = useRef<HTMLTableRowElement>(null);

  // useDrop from react-dnd

  const [{ handlerId }, drop] = useDrop<
    { index: number },
    void,
    { handlerId: Identifier | null }
  >({
    accept: 'item',
    collect(monitor: DropTargetMonitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(draggedItem: { index: number }, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = draggedItem.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset() as XYCoord | null;
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      onMove(dragIndex, hoverIndex);
      draggedItem.index = hoverIndex;
    },
    drop() {
      // Trigger a debounced save in the parent so order persists automatically
      onDropReorderComplete();
    },
  });

  const [{ isDragging }, drag] = useDrag<
    { id: string; index: number },
    void,
    { isDragging: boolean }
  >({
    type: 'item',
    item: () => ({ id: item.id, index }),
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.5 : 1;
  // Attach drop in effect to avoid accessing ref during render
  useEffect(() => {
    if (!ref.current) return;
    const node = ref.current;
    drop(node);
  }, [drop]);

  return (
    <TableRow
      ref={ref}
      style={{ opacity }}
      data-handler-id={handlerId}
      className='hover:bg-muted/50'
    >
      <TableCell className='w-8'>
        <Checkbox
          checked={isSelected}
          onCheckedChange={checked => onToggleSelect(item.id, !!checked)}
        />
      </TableCell>
      <TableCell>
        <div className='w-12 h-12 rounded-lg overflow-hidden bg-muted'>
          {item.image ? (
            <img
              src={item.image}
              alt={item.names.en}
              className='w-full h-full object-cover'
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center text-2xl'>
              🍽️
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className='font-medium'>
        <div className='flex flex-col'>
          <span>{item.names.en}</span>
          {isSearching && categoryLabel ? (
            <span className='text-xs text-muted-foreground'>
              {categoryLabel}
            </span>
          ) : null}
        </div>
      </TableCell>
      <TableCell className='hidden md:table-cell'>{item.names.ar}</TableCell>
      <TableCell>
        {Array.isArray((item as { variants?: unknown }).variants) &&
        (item as { variants: Array<{ size: string; price: number }> }).variants
          ?.length ? (
          <div className='flex flex-wrap gap-1'>
            {(
              item as { variants: Array<{ size: string; price: number }> }
            ).variants.map((v: { size: string; price: number }) => (
              <Badge
                key={`${item.id}_${v.size}`}
                variant='secondary'
                className='text-xs'
              >
                {v.size}: ₺{v.price}
              </Badge>
            ))}
          </div>
        ) : (
          <>₺{item.price}</>
        )}
      </TableCell>
      <TableCell>
        <div className='flex items-center gap-2'>
          <div className='cursor-grab active:cursor-grabbing' ref={drag}>
            <GripVertical className='w-4 h-4 text-muted-foreground' />
          </div>
          <Input
            type='number'
            value={item.order || 0}
            className='w-16 h-8 text-center'
            min='0'
            onChange={e => {
              const newOrder = parseInt(e.target.value) || 0;
              onOrderChange(item.id, newOrder);
            }}
          />
        </div>
      </TableCell>
      <TableCell className='hidden lg:table-cell'>
        <div className='flex items-center gap-2'>
          <Switch
            checked={!!item.is_available}
            onCheckedChange={checked =>
              onToggleAvailability(item.id, !!checked)
            }
            aria-label='Toggle availability'
          />
          <Badge variant={item.is_available ? 'default' : 'secondary'}>
            {item.is_available ? 'Yes' : 'No'}
          </Badge>
        </div>
      </TableCell>
      <TableCell className='text-right'>
        <div className='flex items-center gap-1'>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => onEdit(item)}
            className='h-8 w-8 p-0'
          >
            <Edit className='w-4 h-4' />
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => onDelete(item.id)}
            className='h-8 w-8 p-0 text-red-600 hover:text-red-700'
          >
            <Trash2 className='w-4 h-4' />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

function AdminItemsSimpleInner({
  items,
  categories,
  onRefresh,
}: AdminItemsSimpleProps) {
  const { lang } = useLang();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [localItems, setLocalItems] = useState<Item[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    new Set(),
  );
  const [bulkTargetCategory, setBulkTargetCategory] = useState<string>('');
  const autoSaveTimerRef = useRef<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 50; // Client-side pagination to improve rendering performance
  const [formData, setFormData] = useState({
    nameEn: '',
    nameTr: '',
    nameAr: '',
    categoryId: '',
    price: 0,
    image: '',
    tags: '',
    isAvailable: true,
    order: 0,
    variants: [] as Array<{ size: string; price: number }>,
  });

  // Update local items when props change (defer setState)
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalItems([...items]);
    }, 0);
    return () => clearTimeout(timer);
  }, [items]);

  // Build searchable list: either selected category or all categories if searching with no category
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const searchingAll = normalizedQuery.length > 0 && !selectedCategory;
  const baseCategoryItems = searchingAll
    ? [...localItems].sort((a, b) => (a.order || 0) - (b.order || 0))
    : selectedCategory
      ? localItems
          .filter(item => item.category_id === selectedCategory)
          .sort((a, b) => (a.order || 0) - (b.order || 0))
      : [];

  const categoryItems =
    normalizedQuery.length > 0
      ? baseCategoryItems.filter(it => {
          const nameEn = it.names.en?.toLowerCase() || '';
          const nameTr = it.names.tr?.toLowerCase() || '';
          const nameAr = it.names.ar?.toLowerCase() || '';
          const tags = (it.tags || []).join(' ').toLowerCase();
          const price = it.price?.toString() || '';
          const categoryName =
            categories
              .find(c => c.id === it.category_id)
              ?.names.en?.toLowerCase() || '';
          return (
            nameEn.includes(normalizedQuery) ||
            nameTr.includes(normalizedQuery) ||
            nameAr.includes(normalizedQuery) ||
            tags.includes(normalizedQuery) ||
            price.includes(normalizedQuery) ||
            categoryName.includes(normalizedQuery)
          );
        })
      : baseCategoryItems;

  // Apply pagination to visible list
  const totalPages = Math.max(1, Math.ceil(categoryItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = categoryItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const allSelected =
    categoryItems.length > 0 &&
    categoryItems.every(item => selectedItemIds.has(item.id));
  const someSelected =
    selectedItemIds.size > 0 && !allSelected && categoryItems.length > 0;

  const toggleSelectAll = (checked: boolean) => {
    const next = new Set(selectedItemIds);
    if (checked) {
      pagedItems.forEach(item => next.add(item.id));
    } else {
      pagedItems.forEach(item => next.delete(item.id));
    }
    setSelectedItemIds(next);
  };

  const toggleSelectOne = (id: string, checked: boolean) => {
    const next = new Set(selectedItemIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedItemIds(next);
  };

  // Restore last selected category from localStorage or default to first
  useEffect(() => {
    if (categories.length === 0) return;
    if (!selectedCategory) {
      const saved = localStorage.getItem('admin-selected-category');
      const first = categories[0]?.id || '';
      const next =
        saved && categories.some(c => c.id === saved) ? saved : first;
      // Defer set to avoid sync update inside effect
      const timer = setTimeout(() => setSelectedCategory(next), 0);
      return () => clearTimeout(timer);
    }
  }, [categories, selectedCategory]);

  // Clear selection when switching category
  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      setSelectedItemIds(new Set());
      setBulkTargetCategory('');
      setSearchQuery('');
      setPage(1);
    }, 0);
  }, [selectedCategory]);
  const handleToggleAvailability = async (id: string, next: boolean) => {
    try {
      const target = localItems.find(it => it.id === id);
      if (!target) return;
      // Optimistic update
      setLocalItems(prev =>
        prev.map(it => (it.id === id ? { ...it, is_available: next } : it)),
      );
      await itemsAPI.update(id, {
        names: target.names,
        category_id: target.category_id,
        price: target.price,
        image: target.image || null,
        tags: target.tags,
        is_available: next,
        order: target.order,
      });
      toast.success(next ? 'Item marked available' : 'Item marked unavailable');
      onRefresh();
    } catch (error) {
      console.error('Availability toggle error:', error);
      toast.error('Failed to update availability');
      // Revert on failure
      setLocalItems(prev =>
        prev.map(it => (it.id === id ? { ...it, is_available: !next } : it)),
      );
    }
  };

  const handleOrderChange = (id: string, order: number) => {
    setLocalItems(prev =>
      prev.map(item => (item.id === id ? { ...item, order } : item)),
    );
  };

  const openDialog = (item?: Item) => {
    if (item) {
      console.warn('Opening dialog for editing item:', item);
      setEditingId(item.id);
      const formDataToSet = {
        nameEn: item.names.en,
        nameTr: item.names.tr,
        nameAr: item.names.ar,
        categoryId: item.category_id || '',
        price: item.price,
        image: item.image || '',
        tags: item.tags.join(', '),
        isAvailable: item.is_available ?? true,
        order: item.order || 0,
        variants: Array.isArray((item as { variants?: unknown }).variants)
          ? (item as { variants: Array<{ size: string; price: number }> })
              .variants
          : [],
      };
      console.warn('Setting form data to:', formDataToSet);
      setFormData(formDataToSet);
    } else {
      console.warn('Opening dialog for creating new item');
      setEditingId(null);
      setFormData({
        nameEn: '',
        nameTr: '',
        nameAr: '',
        categoryId: selectedCategory,
        price: 0,
        image: '',
        tags: '',
        isAvailable: true,
        order: 0,
        variants: [] as Array<{ size: string; price: number }>,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      console.warn('Form data before validation:', formData);

      // Validation
      if (
        !formData.nameEn.trim() &&
        !formData.nameTr.trim() &&
        !formData.nameAr.trim()
      ) {
        toast.error('Please enter at least one item name');
        return;
      }

      if (!formData.categoryId) {
        toast.error('Please select a category');
        return;
      }

      if (formData.price < 0) {
        toast.error('Price cannot be negative');
        return;
      }

      if (isNaN(formData.price)) {
        toast.error('Please enter a valid price');
        return;
      }

      // Check for duplicate names within the same category (excluding current item if editing)
      const existingItems = items.filter(
        item =>
          item.category_id === formData.categoryId &&
          (editingId ? item.id !== editingId : true),
      );

      const duplicateEn = existingItems.some(
        item =>
          item.names.en.toLowerCase() === formData.nameEn.toLowerCase() &&
          formData.nameEn.trim(),
      );
      const duplicateTr = existingItems.some(
        item =>
          item.names.tr.toLowerCase() === formData.nameTr.toLowerCase() &&
          formData.nameTr.trim(),
      );
      const duplicateAr = existingItems.some(
        item =>
          item.names.ar.toLowerCase() === formData.nameAr.toLowerCase() &&
          formData.nameAr.trim(),
      );

      if (duplicateEn) {
        toast.error(
          'An item with this English name already exists in this category',
        );
        return;
      }
      if (duplicateTr) {
        toast.error(
          'An item with this Turkish name already exists in this category',
        );
        return;
      }
      if (duplicateAr) {
        toast.error(
          'An item with this Arabic name already exists in this category',
        );
        return;
      }

      const data = {
        names: {
          en: formData.nameEn.trim(),
          tr: formData.nameTr.trim(),
          ar: formData.nameAr.trim(),
        },
        category_id: formData.categoryId,
        price: Number(formData.price) || 0,
        image: formData.image || null,
        tags: formData.tags
          .split(',')
          .map(t => t.trim())
          .filter(t => t),
        is_available: Boolean(formData.isAvailable),
        order: Number(formData.order) || 0,
        // Include variants if provided
        ...(formData.variants && formData.variants.length
          ? {
              variants: formData.variants.map(v => ({
                size: v.size.trim(),
                price: Number(v.price) || 0,
              })),
            }
          : {}),
      };

      console.warn('Data to be sent to API:', data);
      console.warn('Editing ID:', editingId);

      if (editingId) {
        console.warn('Updating item with ID:', editingId);
        const result = await itemsAPI.update(editingId, data);
        console.warn('Update result:', result);
        toast.success('Item updated successfully');
      } else {
        console.warn('Creating new item');
        const result = await itemsAPI.create(data);
        console.warn('Create result:', result);
        toast.success('Item created successfully');
      }

      // Keep current category selection persistent
      const persistCat = data.category_id || selectedCategory || '';
      if (persistCat) {
        localStorage.setItem('admin-selected-category', persistCat);
        setSelectedCategory(persistCat);
      }

      setDialogOpen(false);
      // Force refresh to show the new image immediately
      await onRefresh();
    } catch (error) {
      console.error('Save error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to save item';
      toast.error(errorMessage);
    }
  };

  const confirm = useConfirm();

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete this item?',
      description: 'This action cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;

    try {
      await itemsAPI.delete(id);
      toast.success('Item deleted');
      onRefresh();
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete item';
      toast.error(errorMessage);
    }
  };

  // updateItemOrder is no longer used; use bulk saveItemOrder instead

  const moveItem = (dragIndex: number, hoverIndex: number) => {
    console.warn(`🔄 Moving item from index ${dragIndex} to ${hoverIndex}`);
    console.warn(
      '📋 Before move - categoryItems:',
      categoryItems.map(item => ({
        id: item.id,
        name: item.names.en,
        order: item.order,
      })),
    );

    const draggedItem = categoryItems[dragIndex];
    if (!draggedItem) return;
    const newCategoryItems = [...categoryItems];
    newCategoryItems.splice(dragIndex, 1);
    newCategoryItems.splice(hoverIndex, 0, draggedItem);

    // Update order values for the category items
    const updatedCategoryItems = newCategoryItems.map((item, index) => ({
      ...item,
      order: index,
    }));

    console.warn(
      '📋 After move - updatedCategoryItems:',
      updatedCategoryItems.map(item => ({
        id: item.id,
        name: item.names.en,
        order: item.order,
      })),
    );

    // Update only items in the selected category in local state
    const newLocalItems = localItems.map(li => {
      const updated = updatedCategoryItems.find(ui => ui.id === li.id);
      if (updated) {
        return { ...li, order: updated.order };
      }
      return li;
    });

    console.warn(
      '📋 Final newLocalItems order:',
      newLocalItems
        .filter(item => item.category_id === selectedCategory)
        .map(item => ({ id: item.id, name: item.names.en, order: item.order })),
    );

    setLocalItems(newLocalItems);

    // Show a toast to confirm the move happened
    toast.success(
      `Moved ${draggedItem.names.en} to position ${hoverIndex + 1}`,
    );
  };

  // Debounced auto-save trigger after drop completes
  const handleDropReorderComplete = () => {
    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = window.setTimeout(() => {
      void saveItemOrder();
    }, 500);
  };

  const saveItemOrder = async () => {
    try {
      console.warn('🔄 Saving item order for category:', selectedCategory);

      // Collect all current order input values from local state
      const currentCategoryItems = localItems
        .filter(item => item.category_id === selectedCategory)
        .map(item => ({
          id: item.id,
          order: item.order || 0,
          name: item.names.en,
        }));

      console.warn(
        '📋 Current order values from inputs:',
        currentCategoryItems.map(item => ({
          id: item.id,
          name: item.name,
          order: item.order,
        })),
      );

      // Build the payload with the current order values from inputs
      const orderUpdates = currentCategoryItems.map(item => ({
        id: item.id,
        order: item.order,
      }));

      console.warn('📝 Order updates to send:', orderUpdates);
      const result = await itemsAPI.updateOrder(orderUpdates);
      console.warn('✅ Bulk order update result:', result);

      // Also perform full updates for all items to ensure consistency
      const updatePromises = currentCategoryItems.map(item => {
        const localItem = localItems.find(li => li.id === item.id);
        if (!localItem) return Promise.resolve();

        return itemsAPI.update(item.id, {
          names: localItem.names,
          category_id: localItem.category_id || null,
          price: localItem.price,
          image: localItem.image || null,
          tags: localItem.tags,
          is_available: localItem.is_available ?? true,
          order: item.order,
        });
      });

      await Promise.all(updatePromises);
      console.warn('✅ Full item updates completed');

      // Pull fresh items for this category from the server and sync local state
      try {
        const freshDataRaw = await itemsAPI.getAll(selectedCategory);
        const freshData = Array.isArray(freshDataRaw)
          ? freshDataRaw.filter(
              item =>
                item &&
                typeof item === 'object' &&
                item.category_id !== undefined,
            )
          : [];

        const normalizedFresh = freshData
          .filter(it => it.category_id === selectedCategory)
          .map((it, idx) => ({ ...it, order: it.order ?? idx }));

        const merged = localItems.map(li => {
          const updated = normalizedFresh.find(ui => ui.id === li.id);
          return updated ? { ...li, order: updated.order } : li;
        });
        setLocalItems(merged);
      } catch (e) {
        console.warn('⚠️ Could not fetch fresh items after reordering:', e);
      }

      toast.success('Item order saved successfully!');
      onRefresh();
    } catch (error) {
      console.error('Order update error:', error);
      toast.error('Failed to update item order');
      onRefresh(); // Refresh to get the correct order from server
    }
  };

  const handleBulkMove = async () => {
    if (!selectedCategory) return;
    const idsToMove = Array.from(selectedItemIds).filter(id =>
      categoryItems.some(ci => ci.id === id),
    );
    if (idsToMove.length === 0) return;
    if (!bulkTargetCategory) {
      toast.error('Please select a target category');
      return;
    }
    if (bulkTargetCategory === selectedCategory) {
      toast.error('Please choose a different category');
      return;
    }

    try {
      // Determine next order positions in target category (append at end)
      const targetExisting = localItems
        .filter(
          it =>
            it.category_id === bulkTargetCategory && !idsToMove.includes(it.id),
        )
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      const startOrder = targetExisting.length;

      // Prepare updates and apply
      const movedItems = idsToMove
        .map((id, idx) => {
          const it = localItems.find(li => li.id === id);
          if (!it) return null;
          const nextOrder = startOrder + idx;
          return {
            id: it.id,
            payload: {
              names: it.names,
              category_id: bulkTargetCategory,
              price: it.price,
              image: it.image || null,
              tags: it.tags,
              is_available: it.is_available ?? true,
              order: nextOrder,
            },
          } as const;
        })
        .filter(Boolean) as Array<{
        id: string;
        payload: Omit<Item, 'id' | 'created_at'>;
      }>;

      await Promise.all(
        movedItems.map(mi => itemsAPI.update(mi.id, mi.payload)),
      );

      // Locally update items: remove from old cat (reindex) and append to target
      const remainingOld = localItems
        .filter(
          it =>
            it.category_id === selectedCategory && !idsToMove.includes(it.id),
        )
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((it, idx) => ({ ...it, order: idx }));

      const updatedMoved = movedItems
        .map(mi => {
          const originalItem = localItems.find(li => li.id === mi.id);
          if (!originalItem) return null;
          return {
            ...originalItem,
            category_id: bulkTargetCategory,
            order: (mi.payload as { order: number }).order,
          } as Item;
        })
        .filter((item): item is Item => item !== null);

      const untouched = localItems.filter(
        it =>
          it.category_id !== selectedCategory &&
          it.category_id !== bulkTargetCategory,
      );

      const targetExistingUpdated = localItems
        .filter(
          it =>
            it.category_id === bulkTargetCategory && !idsToMove.includes(it.id),
        )
        .map(it => ({ ...it }));

      const newLocal = [
        ...untouched,
        ...remainingOld,
        ...targetExistingUpdated,
        ...updatedMoved,
      ];

      setLocalItems(newLocal);
      setSelectedItemIds(new Set());
      setBulkTargetCategory('');
      toast.success(`Moved ${idsToMove.length} item(s)`);
      onRefresh();
    } catch (error) {
      console.error('Bulk move error:', error);
      toast.error('Failed to move items');
    }
  };

  const handleBulkAvailability = async (available: boolean) => {
    if (!selectedCategory) return;
    const idsToUpdate = Array.from(selectedItemIds).filter(id =>
      categoryItems.some(ci => ci.id === id),
    );
    if (idsToUpdate.length === 0) return;

    try {
      const updates = idsToUpdate
        .map(id => localItems.find(li => li.id === id))
        .filter(Boolean) as Item[];

      await Promise.all(
        updates.map(it =>
          itemsAPI.update(it.id, {
            names: it.names,
            category_id: it.category_id,
            price: it.price,
            image: it.image || null,
            tags: it.tags,
            is_available: available,
            order: it.order,
          }),
        ),
      );

      const nextLocal = localItems.map(it =>
        idsToUpdate.includes(it.id) ? { ...it, is_available: available } : it,
      );
      setLocalItems(nextLocal);
      setSelectedItemIds(new Set());
      toast.success(
        available
          ? `Marked ${idsToUpdate.length} item(s) as available`
          : `Marked ${idsToUpdate.length} item(s) as unavailable`,
      );
      onRefresh();
    } catch (error) {
      console.error('Bulk availability error:', error);
      toast.error('Failed to update availability');
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedCategory) return;
    const idsToDelete = Array.from(selectedItemIds).filter(id =>
      categoryItems.some(ci => ci.id === id),
    );
    if (idsToDelete.length === 0) return;

    const ok = await confirm({
      title: 'Delete selected items?',
      description: 'This action cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;

    try {
      await Promise.all(idsToDelete.map(id => itemsAPI.delete(id)));

      const remainingCurrent = localItems
        .filter(
          it =>
            it.category_id === selectedCategory && !idsToDelete.includes(it.id),
        )
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((it, idx) => ({ ...it, order: idx }));

      const untouched = localItems.filter(
        it => it.category_id !== selectedCategory,
      );

      const nextLocal = [...untouched, ...remainingCurrent];
      setLocalItems(nextLocal);
      setSelectedItemIds(new Set());
      toast.success(`Deleted ${idsToDelete.length} item(s)`);
      onRefresh();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete items');
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <h2 className='text-xl font-medium'>{t('items', lang)}</h2>
            <span className='text-sm text-gray-500'>({items.length})</span>
          </div>
          <div className='flex items-center gap-2'>
            {selectedCategory && normalizedQuery.length === 0 && (
              <Button
                type='button'
                onClick={saveItemOrder}
                variant='secondary'
                size='sm'
              >
                Save Order
              </Button>
            )}
            <Button
              type='button'
              onClick={() => openDialog()}
              className='gap-2'
            >
              <Plus className='w-4 h-4' />
              {t('addNew', lang)}
            </Button>
          </div>
        </div>

        {/* Category Selection and Search */}
        <div className='space-y-3'>
          <Label>Select Category to Manage Items</Label>
          <div className='flex items-center gap-2 flex-wrap'>
            {categories.map(cat => {
              const count = items.filter(
                item => item.category_id === cat.id,
              ).length;
              return (
                <Badge
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  className='cursor-pointer'
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    localStorage.setItem('admin-selected-category', cat.id);
                  }}
                >
                  {cat.icon} {cat.names.en} ({count})
                </Badge>
              );
            })}
          </div>
          {/* Search across current category or all items if no category selected */}
          <div className='flex items-center gap-2'>
            <Input
              placeholder={
                selectedCategory
                  ? 'Search in selected category'
                  : 'Search all items'
              }
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => setSearchQuery('')}
              >
                Clear
              </Button>
            )}
          </div>
          {selectedCategory && (
            <div className='flex items-center gap-2'>
              <span className='text-xs text-muted-foreground'>
                Showing {categoryItems.length} result(s)
              </span>
            </div>
          )}
        </div>

        {/* Bulk actions */}
        {selectedCategory && selectedItemIds.size > 0 && (
          <div className='flex items-center gap-3 p-3 rounded-lg border bg-muted/30'>
            <div className='text-sm'>{selectedItemIds.size} selected</div>
            <div className='flex items-center gap-2'>
              <Label>Move to</Label>
              <Select
                value={bulkTargetCategory}
                onValueChange={val => setBulkTargetCategory(val)}
              >
                <SelectTrigger className='w-56'>
                  <SelectValue placeholder='Choose category' />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter(c => c.id !== selectedCategory)
                    .map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.names.en}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type='button'
              size='sm'
              onClick={handleBulkMove}
              disabled={!bulkTargetCategory}
            >
              Move selected
            </Button>
            <div className='mx-1 w-px self-stretch bg-border' />
            <Button
              type='button'
              size='sm'
              variant='secondary'
              onClick={() => handleBulkAvailability(true)}
            >
              Mark available
            </Button>
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={() => handleBulkAvailability(false)}
            >
              Mark unavailable
            </Button>
            <Button
              type='button'
              size='sm'
              className='text-red-600 hover:text-red-700'
              onClick={handleBulkDelete}
            >
              Delete selected
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => setSelectedItemIds(new Set())}
            >
              Clear selection
            </Button>
          </div>
        )}

        {/* Items Table */}
        {(selectedCategory || searchingAll) && (
          <div className='bg-card rounded-xl border border-border overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-8'>
                    <Checkbox
                      checked={
                        allSelected
                          ? true
                          : someSelected
                            ? 'indeterminate'
                            : false
                      }
                      onCheckedChange={checked => toggleSelectAll(!!checked)}
                      aria-label='Select all'
                    />
                  </TableHead>
                  <TableHead className='w-20'>Image</TableHead>
                  <TableHead className='min-w-[150px]'>Name (EN)</TableHead>
                  <TableHead className='min-w-[120px] hidden md:table-cell'>
                    Name (AR)
                  </TableHead>
                  <TableHead className='w-24'>Price / Variants</TableHead>
                  <TableHead className='w-20'>Order</TableHead>
                  <TableHead className='w-20 hidden lg:table-cell'>
                    Available
                  </TableHead>
                  <TableHead className='text-right w-32'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedItems.map((item, index) => {
                  const categoryLabel = categories.find(
                    c => c.id === item.category_id,
                  )?.names.en;
                  return (
                    <DraggableTableRow
                      key={item.id}
                      item={item}
                      index={index}
                      onEdit={openDialog}
                      onDelete={handleDelete}
                      onMove={normalizedQuery ? () => {} : moveItem}
                      onDropReorderComplete={
                        normalizedQuery ? () => {} : handleDropReorderComplete
                      }
                      isSelected={selectedItemIds.has(item.id)}
                      onToggleSelect={toggleSelectOne}
                      isSearching={normalizedQuery.length > 0}
                      categoryLabel={categoryLabel}
                      onToggleAvailability={handleToggleAvailability}
                      onOrderChange={handleOrderChange}
                    />
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {(selectedCategory || searchingAll) && totalPages > 1 && (
          <div className='flex items-center justify-between gap-3 pt-3'>
            <div className='text-xs text-muted-foreground'>
              Page {currentPage} of {totalPages} • Showing {pagedItems.length}{' '}
              of {categoryItems.length}
            </div>
            <div className='flex items-center gap-2'>
              <Button
                type='button'
                size='sm'
                variant='outline'
                disabled={currentPage <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                type='button'
                size='sm'
                variant='outline'
                disabled={currentPage >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Dialog Form */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>
                {editingId ? t('edit', lang) : t('addNew', lang)}{' '}
                {t('items', lang)}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? 'Edit menu item details below'
                  : 'Add a new menu item with details below'}
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4'>
              <ImageUpload
                value={formData.image}
                onChange={imageUrl =>
                  setFormData({ ...formData, image: imageUrl || '' })
                }
                label={t('itemImage', lang)}
                useSupabaseStorage={true}
                itemName={formData.nameEn || formData.nameTr || formData.nameAr}
                fallbackIcon='🍽️'
              />

              <div>
                <Label>{t('category', lang)}</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={val =>
                    setFormData({ ...formData, categoryId: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.names.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <Label>{t('nameEnglish', lang)}</Label>
                  <Input
                    value={formData.nameEn}
                    onChange={e =>
                      setFormData({ ...formData, nameEn: e.target.value })
                    }
                    placeholder='Cappuccino'
                  />
                </div>
                <div>
                  <Label>{t('nameTurkish', lang)}</Label>
                  <Input
                    value={formData.nameTr}
                    onChange={e =>
                      setFormData({ ...formData, nameTr: e.target.value })
                    }
                    placeholder='Kapuçino'
                  />
                </div>
                <div>
                  <Label>{t('nameArabic', lang)}</Label>
                  <Input
                    value={formData.nameAr}
                    onChange={e =>
                      setFormData({ ...formData, nameAr: e.target.value })
                    }
                    placeholder='كابتشينو'
                    dir='rtl'
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label>{t('priceWithCurrency', lang)}</Label>
                  <Input
                    type='number'
                    step='0.01'
                    value={formData.price}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Display Order</Label>
                  <Input
                    type='number'
                    value={formData.order}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        order: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder='0'
                  />
                  <p className='text-xs text-muted-foreground mt-1'>
                    Lower numbers appear first
                  </p>
                </div>
              </div>

              {/* Variants Editor */}
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <Label>Variants (size + price)</Label>
                  <Button
                    type='button'
                    size='sm'
                    variant='secondary'
                    onClick={() =>
                      setFormData({
                        ...formData,
                        variants: [
                          ...(formData.variants || []),
                          { size: '', price: 0 },
                        ],
                      })
                    }
                  >
                    Add variant
                  </Button>
                </div>
                {(formData.variants || []).length === 0 ? (
                  <p className='text-xs text-muted-foreground'>
                    No variants. Add sizes like Small/Medium/Large with prices.
                  </p>
                ) : (
                  <div className='space-y-2'>
                    {(formData.variants || []).map((v, idx) => (
                      <div
                        key={idx}
                        className='grid grid-cols-12 gap-2 items-center'
                      >
                        <div className='col-span-5'>
                          <Input
                            placeholder='Size (e.g., Small)'
                            value={v.size}
                            onChange={e => {
                              const next = [...formData.variants];
                              next[idx] = {
                                size: e.target.value || '',
                                price: Number(next[idx]?.price ?? 0),
                              };
                              setFormData({ ...formData, variants: next });
                            }}
                          />
                        </div>
                        <div className='col-span-5'>
                          <Input
                            type='number'
                            step='0.01'
                            placeholder='Price'
                            value={String(v.price)}
                            onChange={e => {
                              const next = [...formData.variants];
                              next[idx] = {
                                size: String(next[idx]?.size ?? ''),
                                price: parseFloat(e.target.value) || 0,
                              };
                              setFormData({ ...formData, variants: next });
                            }}
                          />
                        </div>
                        <div className='col-span-2 flex justify-end'>
                          <Button
                            type='button'
                            size='sm'
                            variant='ghost'
                            className='text-red-600 hover:text-red-700'
                            onClick={() => {
                              const next = (formData.variants || []).filter(
                                (_, i) => i !== idx,
                              );
                              setFormData({ ...formData, variants: next });
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>{t('tags', lang)}</Label>
                <Input
                  value={formData.tags}
                  onChange={e =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder='Premium, Fresh, Hot'
                />
              </div>

              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  id='isAvailable'
                  checked={formData.isAvailable}
                  onChange={e =>
                    setFormData({ ...formData, isAvailable: e.target.checked })
                  }
                  className='rounded border-gray-300'
                />
                <Label htmlFor='isAvailable' className='text-sm font-normal'>
                  Available for ordering
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type='button' onClick={handleSave}>
                {editingId ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
}

export default function AdminItemsSimple(props: AdminItemsSimpleProps) {
  return (
    <ConfirmDialogProvider>
      <AdminItemsSimpleInner {...props} />
    </ConfirmDialogProvider>
  );
}
