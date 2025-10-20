import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from '@dnd-kit/modifiers';
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
import DraggableItemModern from './DraggableItemModern';
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
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { useLang } from '../../lib/LangContext';
import { t } from '../../lib/i18n';
import { Category, Item, itemsAPI } from '../../lib/supabase';
import { toast } from 'sonner';
import { Filter, Info, Plus, X } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import {
  createBatchUpdatePayload,
  getFilteredItems,
  reorderWithinCategory,
} from '../../lib/drag-drop-utils';

interface AdminItemsProps {
  items: Item[];
  categories: Category[];
  onRefresh: () => void;
}

export default function AdminItemsModern({
  items,
  categories,
  onRefresh,
}: AdminItemsProps) {
  const { lang } = useLang();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [localItems, setLocalItems] = useState<Item[]>([]);
  const [isReordering, setIsReordering] = useState(false);
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

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before starting drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Update local items when props change
  useEffect(() => {
    console.log('📦 Items updated:', items.length, 'items');
    setLocalItems(items);
  }, [items]);

  // Reset local items when category changes to ensure fresh state
  useEffect(() => {
    setLocalItems(items);
  }, [selectedCategory, items]);

  // Get filtered items based on selected category
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') {
      return localItems.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    return getFilteredItems(localItems, selectedCategory);
  }, [localItems, selectedCategory]);

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      console.log('🎯 Drag ended:', { activeId: active.id, overId: over?.id });

      // Early return guards
      if (!over || active.id === over.id) {
        console.log(
          '⚠️ No valid drop target or same position, returning early',
        );
        return;
      }

      // For "All" tab, disable reordering
      if (selectedCategory === 'all') {
        toast.info(
          'Reordering is only available within categories. Please select a category first.',
        );
        return;
      }

      try {
        setIsReordering(true);

        // Find the indices of the dragged and dropped items
        const oldIndex = filteredItems.findIndex(item => item.id === active.id);
        const newIndex = filteredItems.findIndex(item => item.id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
          console.log('⚠️ Could not find item indices');
          setIsReordering(false);
          return;
        }

        console.log('🔄 Starting reorder process...');
        console.log('📊 Old index:', oldIndex);
        console.log('📊 New index:', newIndex);
        console.log('📊 Category:', selectedCategory);
        console.log('📊 Filtered items count:', filteredItems.length);
        console.log('📊 Local items count:', localItems.length);

        // Reorder within category
        const updatedItems = reorderWithinCategory(
          localItems,
          selectedCategory,
          oldIndex,
          newIndex,
        );

        console.log('🔄 Updated items:', updatedItems.length);

        // Update local state optimistically
        setLocalItems(updatedItems);

        // Create batch update payload
        const batchPayload = createBatchUpdatePayload(
          updatedItems,
          selectedCategory,
        );
        console.log('🔄 Batch payload:', batchPayload);

        // Update database with transaction
        await itemsAPI.batchUpdateOrder(batchPayload, selectedCategory);

        console.log('✅ Reorder completed successfully');
        toast.success('Items reordered successfully');

        // Force a refresh to ensure the changes are persisted and visible
        setTimeout(() => {
          onRefresh();
          setIsReordering(false);
        }, 100);
      } catch (error) {
        console.error('❌ Reorder error:', error);
        toast.error('Failed to reorder items');
        setIsReordering(false);

        // Revert optimistic update
        setLocalItems(items);
      }
    },
    [filteredItems, localItems, selectedCategory, items, onRefresh],
  );

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
      // Set default order to be the next available order in the selected category
      const selectedCategoryId =
        selectedCategory === 'all' ? categories[0]?.id : selectedCategory;
      const categoryItems = items.filter(
        item => item.category_id === selectedCategoryId,
      );
      const maxOrder =
        categoryItems.length > 0
          ? Math.max(...categoryItems.map(item => item.order || 0))
          : -1;

      setFormData({
        nameEn: '',
        nameTr: '',
        nameAr: '',
        descriptionEn: '',
        descriptionTr: '',
        descriptionAr: '',
        categoryId: selectedCategoryId || '',
        price: 0,
        image: '',
        tags: '',
        isAvailable: true,
        variants: [],
        order: maxOrder + 1,
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
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message);
    }
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
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <h2 className='text-xl font-medium'>{t('items', lang)}</h2>
          <span className='text-sm text-gray-500'>({items.length})</span>
          {isReordering && (
            <Badge variant='secondary' className='animate-pulse'>
              Reordering...
            </Badge>
          )}
        </div>
        <div className='flex items-center gap-2'>
          <Button onClick={() => openDialog()} className='gap-2'>
            <Plus className='w-4 h-4' />
            {t('addNew', lang)}
          </Button>
        </div>
      </div>

      {/* Category Filter */}
      <div className='flex items-center gap-3 flex-wrap'>
        <div className='flex items-center gap-2'>
          <Filter className='w-4 h-4 text-muted-foreground' />
          <span className='text-sm text-muted-foreground'>
            Filter by category:
          </span>
        </div>
        <div className='flex items-center gap-2 flex-wrap'>
          <Badge
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            className='cursor-pointer'
            onClick={() => setSelectedCategory('all')}
          >
            All ({items.length})
          </Badge>
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
          {selectedCategory !== 'all' && (
            <Button
              variant='ghost'
              size='sm'
              className='h-7 px-2'
              onClick={() => setSelectedCategory('all')}
            >
              <X className='w-3 h-3' />
            </Button>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
      >
        <div className='bg-card rounded-xl border border-border overflow-x-auto'>
          {/* Drag & Drop Info */}
          {selectedCategory === 'all' && (
            <div className='p-3 bg-muted/50 border-b border-border'>
              <Alert>
                <Info className='h-4 w-4' />
                <AlertTitle>Drag & Drop Disabled</AlertTitle>
                <AlertDescription>
                  Reordering is only available within individual categories.
                  Select a specific category to reorder items.
                </AlertDescription>
              </Alert>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-10'></TableHead>
                <TableHead className='w-20'>Image</TableHead>
                <TableHead className='min-w-[150px]'>Name (EN)</TableHead>
                <TableHead className='min-w-[120px] hidden md:table-cell'>
                  Name (AR)
                </TableHead>
                <TableHead className='w-24'>Price</TableHead>
                <TableHead className='min-w-[120px] hidden lg:table-cell'>
                  Category
                </TableHead>
                <TableHead className='min-w-[150px] hidden xl:table-cell'>
                  Tags
                </TableHead>
                <TableHead className='w-20 hidden lg:table-cell'>
                  Available
                </TableHead>
                <TableHead className='text-right w-32'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <SortableContext
              items={filteredItems.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <TableBody>
                {filteredItems.map(item => (
                  <DraggableItemModern
                    key={item.id}
                    item={item}
                    categories={categories}
                    onEdit={openDialog}
                    onDelete={handleDelete}
                    isDisabled={selectedCategory === 'all'}
                  />
                ))}
              </TableBody>
            </SortableContext>
          </Table>
        </div>
      </DndContext>

      {/* Dialog form */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {editingId ? t('edit', lang) : t('addNew', lang)}{' '}
              {t('items', lang)}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? lang === 'en'
                  ? 'Edit menu item details below'
                  : lang === 'tr'
                    ? 'Aşağıda menü öğesi detaylarını düzenleyin'
                    : 'قم بتحرير تفاصيل عنصر القائمة أدناه'
                : lang === 'en'
                  ? 'Add a new menu item with details below'
                  : lang === 'tr'
                    ? 'Aşağıda yeni bir menü öğesi ekleyin'
                    : 'أضف عنصر قائمة جديد مع التفاصيل أدناه'}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <ImageUpload
              value={formData.image}
              onChange={base64 =>
                setFormData({ ...formData, image: base64 || '' })
              }
              label={t('itemImage', lang)}
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
                Lower numbers appear first. Leave as 0 for automatic ordering.
              </p>
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
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
