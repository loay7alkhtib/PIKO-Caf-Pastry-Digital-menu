import { useCallback, useEffect, useState } from 'react';
// @ts-ignore
import { DndProvider } from 'react-dnd';
// @ts-ignore
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
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Eye,
  EyeOff,
  Filter,
  GripVertical,
  Info,
  Plus,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface AdminMenuManagerProps {
  items: Item[];
  categories: Category[];
  onRefresh: () => void;
}

interface CategoryWithItems {
  category: Category;
  items: Item[];
  isExpanded: boolean;
}

export default function AdminMenuManager({
  items,
  categories,
  onRefresh,
}: AdminMenuManagerProps) {
  const { lang } = useLang();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [localItems, setLocalItems] = useState<Item[]>([]);
  const [categoryStates, setCategoryStates] = useState<Map<string, boolean>>(
    new Map()
  );
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
  const [showRefreshHint, setShowRefreshHint] = useState(false);
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
            setShowRefreshHint(true);
            setTimeout(() => setShowRefreshHint(false), 5000);
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
      console.log(
        '🔄 Cross-category move: Moving item from',
        sourceCategoryId,
        'to',
        newCategoryId
      );

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

      console.log('🔄 Moving item:', {
        sourceItem: sourceItem.names?.en,
        sourceCategory: sourceItem.category_id,
        targetItem: targetItem.names?.en,
        targetCategory: targetItem.category_id,
        isCrossCategory,
        targetCategoryId,
        targetPosition,
      });

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
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-2'>
          <h2 className='text-lg sm:text-xl' style={{ color: '#0C6071' }}>
            Menu Manager
          </h2>
          <span className='text-sm text-gray-500'>({items.length} items)</span>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            onClick={expandAllCategories}
            variant='outline'
            size='sm'
            className='gap-2'
          >
            <Eye className='w-4 h-4' />
            Expand All
          </Button>
          <Button
            onClick={collapseAllCategories}
            variant='outline'
            size='sm'
            className='gap-2'
          >
            <EyeOff className='w-4 h-4' />
            Collapse All
          </Button>
          <Button
            onClick={() => openDialog()}
            size='sm'
            className='gap-2 shrink-0'
            style={{ backgroundColor: '#0C6071' }}
          >
            <Plus className='w-4 h-4' />
            <span className='hidden sm:inline'>Add New Item</span>
          </Button>
        </div>
      </div>

      {/* Drag-and-Drop Info */}
      {localItems.length > 1 && (
        <Alert className='border-blue-200 bg-blue-50'>
          <Info className='h-4 w-4 text-blue-600' />
          <AlertTitle className='text-blue-800'>Drag to Reorder</AlertTitle>
          <AlertDescription className='text-blue-700'>
            Drag items to reorder within categories or move between categories.
            <span className='block mt-1 text-xs text-blue-600'>
              💡 Tip: You can drag items between different category sections
            </span>
            {isSaving && (
              <div className='mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-xs'>
                💾 Saving changes...
              </div>
            )}
            {showRefreshHint && !isSaving && (
              <div className='mt-2 p-2 bg-green-100 border border-green-300 rounded text-green-800 text-xs'>
                ✅ Changes saved and synced with database!
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <DndProvider backend={HTML5Backend}>
        <div className='space-y-4'>
          {categoriesWithItems.map(
            ({ category, items: categoryItems, isExpanded }) => (
              <Card key={category.id} className='overflow-hidden'>
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
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={e => {
                              e.stopPropagation();
                              openDialog();
                            }}
                            className='gap-1'
                          >
                            <Plus className='w-3 h-3' />
                            Add Item
                          </Button>
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
                          <Button
                            variant='outline'
                            size='sm'
                            className='mt-2'
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                categoryId: category.id,
                              }));
                              openDialog();
                            }}
                          >
                            <Plus className='w-4 h-4 mr-1' />
                            Add First Item
                          </Button>
                        </div>
                      ) : (
                        <div className='bg-card rounded-xl border border-border overflow-x-auto'>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead
                                  className='w-10'
                                  title='Drag to reorder'
                                >
                                  <div className='flex items-center gap-1'>
                                    <span className='text-xs'>Order</span>
                                    <GripVertical className='w-3 h-3 text-muted-foreground' />
                                  </div>
                                </TableHead>
                                <TableHead className='w-16'>Order #</TableHead>
                                <TableHead className='w-20'>Image</TableHead>
                                <TableHead className='min-w-[150px]'>
                                  Name (EN)
                                </TableHead>
                                <TableHead className='min-w-[120px] hidden md:table-cell'>
                                  Name (AR)
                                </TableHead>
                                <TableHead className='w-24'>Price</TableHead>
                                <TableHead className='min-w-[150px] hidden xl:table-cell'>
                                  Tags
                                </TableHead>
                                <TableHead className='w-20 hidden lg:table-cell'>
                                  Available
                                </TableHead>
                                <TableHead className='text-right w-32'>
                                  Actions
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {categoryItems.map((item, index) => (
                                <DraggableItem
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
                                  onEdit={openDialog}
                                  onDelete={handleDelete}
                                />
                              ))}
                            </TableBody>
                          </Table>
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

      {/* Add Item Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit' : 'Add New'} Menu Item
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
              onChange={base64 =>
                setFormData({ ...formData, image: base64 || '' })
              }
              label='Item Image'
              fallbackIcon='🍽️'
            />
            <div>
              <Label>Category</Label>
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
              <Label>Name (English)</Label>
              <Input
                value={formData.nameEn}
                onChange={e =>
                  setFormData({ ...formData, nameEn: e.target.value })
                }
                placeholder='Cappuccino'
              />
            </div>
            <div>
              <Label>Name (Turkish)</Label>
              <Input
                value={formData.nameTr}
                onChange={e =>
                  setFormData({ ...formData, nameTr: e.target.value })
                }
                placeholder='Kapuçino'
              />
            </div>
            <div>
              <Label>Name (Arabic)</Label>
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
              <Label>Price (TL)</Label>
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
              <Label>Tags</Label>
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
                <Label>Size Variants</Label>
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
                  Add Variant
                </Button>
              </div>
              <p className='text-xs text-muted-foreground'>
                Add different sizes with different prices (e.g., Small, Medium,
                Large)
              </p>
              {formData.variants?.map((variant, index) => (
                <div key={index} className='flex gap-2 items-end'>
                  <div className='flex-1'>
                    <Label className='text-xs'>Size Name</Label>
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
                    <Label className='text-xs'>Price (TL)</Label>
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
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
