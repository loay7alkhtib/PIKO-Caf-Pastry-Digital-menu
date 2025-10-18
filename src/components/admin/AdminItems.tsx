import { useCallback, useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
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
import DraggableItem from './DraggableItem';
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

interface AdminItemsProps {
  items: Item[];
  categories: Category[];
  onRefresh: () => void;
}

export default function AdminItems({
  items,
  categories,
  onRefresh,
}: AdminItemsProps) {
  const { lang } = useLang();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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
  });

  // Update local items when props change
  useEffect(() => {
    console.log('📦 Items updated:', items.length, 'items');
    console.log('📊 Sample item:', items[0]);
    setLocalItems([...items]);
  }, [items]);

  // Filter items by selected category
  const filteredItems =
    selectedCategory === 'all'
      ? localItems
      : localItems.filter(item => item.category_id === selectedCategory);

  console.log('🔍 Filtered items:', {
    selectedCategory,
    totalItems: localItems.length,
    filteredCount: filteredItems.length,
    sampleFiltered: filteredItems.slice(0, 2).map(item => ({
      id: item.id,
      name: item.names?.en,
      order: item.order,
      category: item.category_id,
    })),
  });

  const moveItem = useCallback(
    async (dragIndex: number, hoverIndex: number) => {
      console.log('🔄 moveItem called:', { dragIndex, hoverIndex });
      console.log('📊 filteredItems length:', filteredItems.length);
      console.log(
        '📊 filteredItems:',
        filteredItems.map(item => ({
          id: item.id,
          name: item.names?.en,
          order: item.order,
        }))
      );

      const dragItem = filteredItems[dragIndex];
      const hoverItem = filteredItems[hoverIndex];

      console.log('📊 Items:', {
        dragItem: dragItem?.names?.en,
        hoverItem: hoverItem?.names?.en,
      });

      // Check if items exist
      if (!dragItem || !hoverItem) {
        console.log('❌ Missing items:', {
          dragItem: !!dragItem,
          hoverItem: !!hoverItem,
        });
        return;
      }

      // Only allow reordering within same category
      if (dragItem.category_id !== hoverItem.category_id) {
        console.log('❌ Different categories:', {
          dragCategory: dragItem.category_id,
          hoverCategory: hoverItem.category_id,
        });
        return;
      }

      console.log('🔄 Reordering items:', {
        from: dragIndex,
        to: hoverIndex,
        dragItem: dragItem.names?.en,
        hoverItem: hoverItem.names?.en,
      });

      const newItems = [...filteredItems];
      newItems.splice(dragIndex, 1);
      newItems.splice(hoverIndex, 0, dragItem);

      // Update order values for all items in the category
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        order: index,
      }));

      console.log(
        '📊 Updated items order:',
        updatedItems.map(item => ({
          id: item.id,
          name: item.names?.en,
          order: item.order,
        })),
      );

      // Update local state immediately
      const updatedAllItems = localItems.map(item => {
        const foundItem = updatedItems.find(ni => ni.id === item.id);
        return foundItem || item;
      });
      setLocalItems(updatedAllItems);

      // Update order in backend
      try {
        // Create array of items with their new order values
        const orderUpdates = updatedItems.map(item => ({
          id: item.id,
          order: item.order,
        }));

        console.log('🔄 Calling updateOrder API with:', orderUpdates);

        // Call bulk update endpoint
        await itemsAPI.updateOrder(orderUpdates);
        toast.success('Order updated');
      } catch (error: any) {
        console.error('Reorder error:', error);
        console.log('⚠️ API failed, but keeping local changes for now');
        toast.warning('Order updated locally (API sync failed)');
        // Don't revert on error for now - keep the local changes
        // setLocalItems(items); // Revert on error
      }
    },
    [filteredItems, localItems, items]
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
        categoryId: categories[0]?.id || '',
        price: 0,
        image: '',
        tags: '',
        isAvailable: true,
        variants: [],
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
        order: 0, // New items get order 0 by default
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
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-2'>
          <h2 className='text-lg sm:text-xl' style={{ color: '#0C6071' }}>
            {t('items', lang)}
          </h2>
          <span className='text-sm text-gray-500'>({items.length})</span>
        </div>
        <Button
          onClick={() => openDialog()}
          size='sm'
          className='gap-2 shrink-0'
          style={{ backgroundColor: '#0C6071' }}
        >
          <Plus className='w-4 h-4' />
          <span className='hidden sm:inline'>{t('addNew', lang)}</span>
        </Button>
      </div>

      {/* Drag-and-Drop Info */}
      {filteredItems.length > 1 && selectedCategory !== 'all' && (
        <Alert>
          <Info className='h-4 w-4' />
          <AlertTitle>{t('dragToReorder', lang)}</AlertTitle>
          <AlertDescription>{t('dragInstruction', lang)}</AlertDescription>
        </Alert>
      )}

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
              item => item.category_id === cat.id
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

      <DndProvider backend={HTML5Backend}>
        <div className='bg-card rounded-xl border border-border overflow-x-auto'>
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
            <TableBody>
              {filteredItems.map((item, index) => (
                <DraggableItem
                  key={item.id}
                  item={item}
                  index={index}
                  categories={categories}
                  onMove={moveItem}
                  onEdit={openDialog}
                  onDelete={handleDelete}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </DndProvider>

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

            {/* Description Fields */}
            <div className='space-y-4 pt-4 border-t'>
              <h4 className='text-sm font-medium text-muted-foreground'>
                Descriptions (Optional)
              </h4>
              <div>
                <Label>Description (English)</Label>
                <Input
                  value={formData.descriptionEn}
                  onChange={e =>
                    setFormData({ ...formData, descriptionEn: e.target.value })
                  }
                  placeholder='Rich and creamy coffee with steamed milk'
                />
              </div>
              <div>
                <Label>Description (Turkish)</Label>
                <Input
                  value={formData.descriptionTr}
                  onChange={e =>
                    setFormData({ ...formData, descriptionTr: e.target.value })
                  }
                  placeholder='Buharlı sütle zengin ve kremsi kahve'
                />
              </div>
              <div>
                <Label>Description (Arabic)</Label>
                <Input
                  value={formData.descriptionAr}
                  onChange={e =>
                    setFormData({ ...formData, descriptionAr: e.target.value })
                  }
                  placeholder='قهوة غنية وكريمية مع الحليب المبخر'
                  dir='rtl'
                />
              </div>
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
              <Label>{t('tags', lang)}</Label>
              <Input
                value={formData.tags}
                onChange={e =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                placeholder='Premium, Fresh, Hot'
              />
            </div>

            {/* Availability */}
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

            {/* Size Variants */}
            <div className='space-y-3 pt-4 border-t'>
              <div className='flex items-center justify-between'>
                <Label>{t('sizeVariants', lang)}</Label>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    setFormData({
                      ...formData,
                      variants: [...formData.variants, { size: '', price: 0 }],
                    });
                  }}
                >
                  <Plus className='w-4 h-4 mr-1' />
                  {t('addVariant', lang)}
                </Button>
              </div>
              <p className='text-xs text-muted-foreground'>
                {lang === 'en'
                  ? 'Add different sizes with different prices (e.g., Small, Medium, Large)'
                  : lang === 'tr'
                    ? 'Farklı fiyatlarla farklı boyutlar ekleyin (örn. Küçük, Orta, Büyük)'
                    : 'أضف أحجامًا مختلفة بأسعار مختلفة (مثل صغير، متوسط، كبير)'}
              </p>
              {formData.variants?.map((variant, index) => (
                <div key={index} className='flex gap-2 items-end'>
                  <div className='flex-1'>
                    <Label className='text-xs'>{t('sizeName', lang)}</Label>
                    <Input
                      value={variant.size}
                      onChange={e => {
                        const newVariants = [...(formData.variants || [])];
                        if (newVariants[index]) {
                          newVariants[index].size = e.target.value;
                        }
                        setFormData({ ...formData, variants: newVariants });
                      }}
                      placeholder='Small, Medium, Large'
                    />
                  </div>
                  <div className='flex-1'>
                    <Label className='text-xs'>
                      {t('priceWithCurrency', lang)}
                    </Label>
                    <Input
                      type='number'
                      step='0.01'
                      value={variant.price}
                      onChange={e => {
                        const newVariants = [...(formData.variants || [])];
                        if (newVariants[index]) {
                          newVariants[index].price =
                            parseFloat(e.target.value) || 0;
                        }
                        setFormData({ ...formData, variants: newVariants });
                      }}
                    />
                  </div>
                  <Button
                    type='button'
                    variant='destructive'
                    size='sm'
                    onClick={() => {
                      const newVariants = formData.variants.filter(
                        (_, i) => i !== index
                      );
                      setFormData({ ...formData, variants: newVariants });
                    }}
                  >
                    <X className='w-4 h-4' />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              {t('cancel', lang)}
            </Button>
            <Button onClick={handleSave}>{t('save', lang)}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
