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

interface AdminItemsSimpleProps {
  items: Item[];
  categories: Category[];
  onRefresh: () => void;
}

interface DraggableTableRowProps {
  item: Item;
  index: number;
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
}

const DraggableTableRow = ({
  item,
  index,
  onEdit,
  onDelete,
  onMove,
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
      <TableCell className='font-medium'>{item.names.en}</TableCell>
      <TableCell className='hidden md:table-cell'>{item.names.ar}</TableCell>
      <TableCell>
        {item.variants && item.variants.length > 0 ? (
          <div className='text-xs'>
            <div className='font-medium text-primary'>
              {item.variants.length} variants
            </div>
            <div className='text-muted-foreground'>
              ₺{Math.min(...item.variants.map(v => v.price))} - ₺
              {Math.max(...item.variants.map(v => v.price))}
            </div>
          </div>
        ) : (
          `₺${item.price}`
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
            readOnly
            aria-readonly
          />
        </div>
      </TableCell>
      <TableCell className='hidden lg:table-cell'>
        <Badge variant={item.is_available ? 'default' : 'secondary'}>
          {item.is_available ? 'Yes' : 'No'}
        </Badge>
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
  const [formData, setFormData] = useState({
    nameEn: '',
    nameTr: '',
    nameAr: '',
    descriptionEn: '',
    descriptionTr: '',
    descriptionAr: '',
    categoryId: '',
    price: 0,
    image: '',
    tags: '',
    isAvailable: true,
    variants: [] as { size: string; price: number }[],
    order: 0,
  });

  // Update local items when props change (defer setState)
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalItems([...items]);
    }, 0);
    return () => clearTimeout(timer);
  }, [items]);

  // Get items for selected category
  const categoryItems = selectedCategory
    ? localItems
        .filter(item => item.category_id === selectedCategory)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];

  // Set first category as default (only once on mount or when categories change)
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      // Use setTimeout to avoid synchronous state updates
      const timer = setTimeout(() => {
        setSelectedCategory(categories[0]?.id || '');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [categories, selectedCategory]);

  const openDialog = (item?: Item) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        nameEn: item.names.en,
        nameTr: item.names.tr,
        nameAr: item.names.ar,
        descriptionEn: item.descriptions?.en || '',
        descriptionTr: item.descriptions?.tr || '',
        descriptionAr: item.descriptions?.ar || '',
        categoryId: item.category_id || '',
        price: item.price,
        image: item.image || '',
        tags: item.tags.join(', '),
        isAvailable: item.is_available ?? true,
        variants: item.variants || [],
        order: item.order || 0,
      });
    } else {
      setEditingId(null);
      setFormData({
        nameEn: '',
        nameTr: '',
        nameAr: '',
        descriptionEn: '',
        descriptionTr: '',
        descriptionAr: '',
        categoryId: selectedCategory,
        price: 0,
        image: '',
        tags: '',
        isAvailable: true,
        variants: [],
        order: 0,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const data = {
        names: {
          en: formData.nameEn,
          tr: formData.nameTr,
          ar: formData.nameAr,
        },
        descriptions: {
          en: formData.descriptionEn || undefined,
          tr: formData.descriptionTr || undefined,
          ar: formData.descriptionAr || undefined,
        },
        category_id: formData.categoryId || null,
        price: formData.price,
        image: formData.image || null,
        tags: formData.tags
          .split(',')
          .map(t => t.trim())
          .filter(t => t),
        is_available: formData.isAvailable,
        variants: formData.variants.length > 0 ? formData.variants : undefined,
        order: formData.order,
      };

      if (editingId) {
        await itemsAPI.update(editingId, data);
        toast.success('Item updated');
      } else {
        await itemsAPI.create(data);
        toast.success('Item created');
      }

      setDialogOpen(false);
      onRefresh();
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

  const saveItemOrder = async () => {
    try {
      console.warn('🔄 Saving item order for category:', selectedCategory);

      // Recompute the current items for the selected category from the latest state
      const latestCategoryItems = [...localItems]
        .filter(item => item.category_id === selectedCategory)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      console.warn(
        '📋 Current latestCategoryItems:',
        latestCategoryItems.map(item => ({
          id: item.id,
          name: item.names.en,
          order: item.order,
        })),
      );

      // Build the payload from the latest items to avoid stale closure issues
      const orderUpdates = latestCategoryItems.map((item, index) => ({
        id: item.id,
        order: index,
      }));

      console.warn('📝 Order updates to send:', orderUpdates);
      const result = await itemsAPI.updateOrder(orderUpdates);
      console.warn('✅ Bulk order update result:', result);

      // Extra safety: if server lacked bulk endpoint and fallback was used,
      // perform full updates to ensure legacy endpoints persist the order.
      const usedFallback =
        typeof result === 'object' &&
        result !== null &&
        'fallback' in (result as Record<string, unknown>) &&
        Boolean((result as { fallback?: boolean }).fallback);

      if (usedFallback) {
        console.warn('🛟 Performing full item updates as a safeguard...');
        await Promise.all(
          latestCategoryItems.map((item, index) =>
            itemsAPI.update(item.id, {
              names: item.names,
              descriptions: item.descriptions || undefined,
              category_id: item.category_id || null,
              price: item.price,
              image: item.image || null,
              tags: item.tags,
              variants:
                item.variants && item.variants.length > 0
                  ? item.variants
                  : undefined,
              is_available: item.is_available ?? true,
              order: index,
            }),
          ),
        );
        console.warn('✅ Full item updates completed');
      }

      toast.success('Item order updated');
      onRefresh();
    } catch (error) {
      console.error('Order update error:', error);
      toast.error('Failed to update item order');
      onRefresh(); // Refresh to get the correct order from server
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
            {selectedCategory && (
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

        {/* Category Selection */}
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
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.icon} {cat.names.en} ({count})
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Items Table */}
        {selectedCategory && (
          <div className='bg-card rounded-xl border border-border overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
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
                {categoryItems.map((item, index) => (
                  <DraggableTableRow
                    key={item.id}
                    item={item}
                    index={index}
                    onEdit={openDialog}
                    onDelete={handleDelete}
                    onMove={moveItem}
                  />
                ))}
              </TableBody>
            </Table>
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
                        price: parseFloat(e.target.value),
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

              {/* Size Variants Section */}
              <div>
                <Label>{t('sizeVariants', lang)}</Label>
                <div className='space-y-2'>
                  {formData.variants.map((variant, index) => (
                    <div
                      key={index}
                      className='flex items-center gap-2 p-3 border rounded-lg bg-muted/30'
                    >
                      <div className='flex-1'>
                        <Input
                          placeholder={t('sizeName', lang)}
                          value={variant.size}
                          onChange={e => {
                            const newVariants = [...formData.variants];
                            newVariants[index] = {
                              ...variant,
                              size: e.target.value,
                            };
                            setFormData({ ...formData, variants: newVariants });
                          }}
                          className='mb-2'
                        />
                      </div>
                      <div className='flex-1'>
                        <Input
                          type='number'
                          step='0.01'
                          placeholder={t('priceWithCurrency', lang)}
                          value={variant.price}
                          onChange={e => {
                            const newVariants = [...formData.variants];
                            newVariants[index] = {
                              ...variant,
                              price: parseFloat(e.target.value) || 0,
                            };
                            setFormData({ ...formData, variants: newVariants });
                          }}
                          className='mb-2'
                        />
                      </div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          const newVariants = formData.variants.filter(
                            (_, i) => i !== index,
                          );
                          setFormData({ ...formData, variants: newVariants });
                        }}
                        className='h-8 w-8 p-0 text-red-600 hover:text-red-700'
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      const newVariants = [
                        ...formData.variants,
                        { size: '', price: 0 },
                      ];
                      setFormData({ ...formData, variants: newVariants });
                    }}
                    className='gap-2'
                  >
                    <Plus className='w-4 h-4' />
                    {t('addVariant', lang)}
                  </Button>
                  <p className='text-xs text-muted-foreground'>
                    Add size variants (e.g., Small, Medium, Large) with
                    different prices. Leave empty if item has only one price.
                  </p>
                </div>
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
