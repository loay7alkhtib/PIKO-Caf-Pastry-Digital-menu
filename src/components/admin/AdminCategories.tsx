import { useEffect, useRef, useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import ImageUpload from '../ImageUpload';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { useLang } from '../../lib/LangContext';
import { t } from '../../lib/i18n';
import { categoriesAPI, Category } from '../../lib/supabase';
import { toast } from 'sonner';
import { GripVertical, Plus } from 'lucide-react';
import { ConfirmDialogProvider, useConfirm } from '../ui/confirm-dialog';

interface AdminCategoriesProps {
  categories: Category[];
  onRefresh: () => void;
  staticMode: boolean;
}

interface DraggableCategoryItemProps {
  category: Category;
  index: number;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
}

const DraggableCategoryItem = ({
  category,
  index,
  onEdit,
  onDelete,
  onMove,
}: DraggableCategoryItemProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop({
    accept: 'category',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: { id: string; index: number }, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'category',
    item: () => {
      return { id: category.id, index };
    },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.5 : 1;
  // Compose drag and drop refs in effect to avoid accessing ref during render
  useEffect(() => {
    if (!ref.current) return;
    const node = ref.current;
    drop(node);
    drag(node);
  }, [drag, drop]);

  return (
    <div
      ref={ref}
      style={{ opacity }}
      data-handler-id={handlerId}
      className='flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:shadow-md transition-shadow'
    >
      <div className='flex items-center gap-3'>
        <div className='cursor-grab active:cursor-grabbing'>
          <GripVertical className='w-4 h-4 text-muted-foreground' />
        </div>
        <span className='text-2xl'>{category.icon}</span>
        <div>
          <h3 className='font-medium'>{category.names.en}</h3>
          <p className='text-sm text-muted-foreground'>
            {category.names.tr} • {category.names.ar}
          </p>
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => onEdit(category)}
        >
          Edit
        </Button>
        <Button
          type='button'
          variant='destructive'
          size='sm'
          onClick={() => onDelete(category.id)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

function AdminCategoriesInner({ categories, onRefresh }: AdminCategoriesProps) {
  const { lang } = useLang();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formData, setFormData] = useState({
    nameEn: '',
    nameTr: '',
    nameAr: '',
    icon: '🍽️',
    image: '',
    color: '#0C6071', // Default color
    order: 0,
  });

  // Update local categories when props change (defer setState to avoid sync update inside effect)
  useEffect(() => {
    const timer = setTimeout(() => {
      const sortedCategories = [...categories].sort(
        (a, b) => a.order - b.order,
      );
      setLocalCategories(sortedCategories);
      setHasUnsavedChanges(false); // Reset unsaved changes when categories are refreshed
    }, 0);
    return () => clearTimeout(timer);
  }, [categories]);

  // Filter categories based on search query
  const filteredCategories = localCategories.filter(category => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      category.names.en.toLowerCase().includes(query) ||
      category.names.tr.toLowerCase().includes(query) ||
      category.names.ar.toLowerCase().includes(query) ||
      category.icon.includes(query)
    );
  });

  const openDialog = (category?: Category) => {
    if (category) {
      setEditingId(category.id);
      setFormData({
        nameEn: category.names.en,
        nameTr: category.names.tr,
        nameAr: category.names.ar,
        icon: category.icon,
        image: category.image || '',
        color: category.color || '#0C6071',
        order: category.order,
      });
    } else {
      setEditingId(null);
      setFormData({
        nameEn: '',
        nameTr: '',
        nameAr: '',
        icon: '🍽️',
        image: '',
        color: '#0C6071',
        order: categories.length,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (isSaving) return; // Prevent double submission

    try {
      setIsSaving(true);

      // Validation
      if (
        !formData.nameEn.trim() &&
        !formData.nameTr.trim() &&
        !formData.nameAr.trim()
      ) {
        toast.error('Please enter at least one category name');
        return;
      }

      // Check for duplicate names (excluding current category if editing)
      const existingCategories = categories.filter(cat =>
        editingId ? cat.id !== editingId : true,
      );

      const duplicateEn = existingCategories.some(
        cat =>
          cat.names.en.toLowerCase() === formData.nameEn.toLowerCase() &&
          formData.nameEn.trim(),
      );
      const duplicateTr = existingCategories.some(
        cat =>
          cat.names.tr.toLowerCase() === formData.nameTr.toLowerCase() &&
          formData.nameTr.trim(),
      );
      const duplicateAr = existingCategories.some(
        cat =>
          cat.names.ar.toLowerCase() === formData.nameAr.toLowerCase() &&
          formData.nameAr.trim(),
      );

      if (duplicateEn) {
        toast.error('A category with this English name already exists');
        return;
      }
      if (duplicateTr) {
        toast.error('A category with this Turkish name already exists');
        return;
      }
      if (duplicateAr) {
        toast.error('A category with this Arabic name already exists');
        return;
      }

      const data = {
        names: {
          en: formData.nameEn.trim(),
          tr: formData.nameTr.trim(),
          ar: formData.nameAr.trim(),
        },
        icon: formData.icon,
        image: formData.image || undefined,
        color: formData.color,
        order: formData.order,
      };

      // Log image status for debugging
      if (formData.image) {
        console.warn(
          'Saving category with image, length:',
          formData.image.length,
        );
      }

      if (editingId) {
        await categoriesAPI.update(editingId, data);
        toast.success('Category updated successfully');
      } else {
        await categoriesAPI.create(data);
        toast.success('Category created successfully');
      }

      setDialogOpen(false);
      // Force refresh to show the new image immediately
      await onRefresh();
    } catch (error) {
      console.error('Save error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to save category';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const confirm = useConfirm();
  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete this category?',
      description: 'This action cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;

    try {
      await categoriesAPI.delete(id);
      toast.success('Category deleted successfully');
      await onRefresh();
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete category';
      toast.error(errorMessage);
    }
  };

  const moveCategory = (dragIndex: number, hoverIndex: number) => {
    const draggedCategory = localCategories[dragIndex];
    if (!draggedCategory) {
      console.warn('No dragged category found at index:', dragIndex);
      return;
    }

    console.warn(
      `🔄 Moving category from index ${dragIndex} to ${hoverIndex}:`,
      {
        dragged: draggedCategory.names.en,
        from: dragIndex,
        to: hoverIndex,
      },
    );

    const newCategories = [...localCategories];
    newCategories.splice(dragIndex, 1);
    newCategories.splice(hoverIndex, 0, draggedCategory);

    // Update order values to match the new positions
    const updatedCategories = newCategories.map((category, index) => ({
      ...category,
      order: index,
    }));

    console.warn(
      '📋 Updated category order:',
      updatedCategories.map(c => ({
        id: c.id,
        name: c.names.en,
        order: c.order,
      })),
    );

    setLocalCategories(updatedCategories);
    setHasUnsavedChanges(true); // Mark that there are unsaved changes

    // Show immediate feedback
    toast.success(
      `Moved ${draggedCategory.names.en} to position ${hoverIndex + 1}`,
    );
  };

  const saveCategoryOrder = async () => {
    if (isSavingOrder) return; // Prevent double submission
    if (!hasUnsavedChanges) {
      toast.info('No changes to save');
      return;
    }

    try {
      setIsSavingOrder(true);
      console.warn(
        '🔄 Saving category order...',
        localCategories.map(c => ({
          id: c.id,
          name: c.names.en,
          order: c.order,
        })),
      );

      // Validate that we have categories to update
      if (localCategories.length === 0) {
        throw new Error('No categories to update');
      }

      // Prepare order updates with proper validation
      const orderUpdates = localCategories
        .filter(category => category.id && category.id.trim() !== '')
        .map((category, index) => ({
          id: category.id,
          order: index,
        }));

      if (orderUpdates.length === 0) {
        throw new Error('No valid categories found to update');
      }

      console.warn('📝 Order updates to send:', orderUpdates);

      // Use the efficient bulk update method
      await categoriesAPI.updateOrder(orderUpdates);

      setHasUnsavedChanges(false); // Clear unsaved changes flag
      toast.success(
        `Category order updated successfully! ${orderUpdates.length} categories saved.`,
      );
      await onRefresh();
    } catch (error) {
      console.error('❌ Order update error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to update category order: ${errorMessage}`);

      // Refresh to get the correct order from server
      try {
        await onRefresh();
      } catch (refreshError) {
        console.error('❌ Failed to refresh after error:', refreshError);
        // Check if we're in static mode
        if (
          refreshError instanceof Error &&
          refreshError.message.includes('static mode')
        ) {
          toast.error(
            'Admin operations are disabled in static mode. Please set VITE_ADMIN_MODE=true in environment variables.',
          );
        }
      }
    } finally {
      setIsSavingOrder(false);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-medium'>{t('categories', lang)}</h2>
          <div className='flex items-center gap-2'>
            <Button
              type='button'
              onClick={saveCategoryOrder}
              variant={hasUnsavedChanges ? 'default' : 'secondary'}
              size='sm'
              disabled={isSavingOrder || !hasUnsavedChanges}
            >
              {isSavingOrder
                ? 'Saving...'
                : hasUnsavedChanges
                  ? 'Save Order*'
                  : 'Save Order'}
            </Button>
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

        {/* Search Bar */}
        <div className='flex items-center gap-2'>
          <Input
            placeholder='Search categories...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='max-w-sm'
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

        <div className='space-y-2'>
          {filteredCategories.map((category, index) => (
            <DraggableCategoryItem
              key={category.id}
              category={category}
              index={index}
              onEdit={openDialog}
              onDelete={handleDelete}
              onMove={moveCategory}
            />
          ))}
          {filteredCategories.length === 0 && searchQuery && (
            <div className='text-center py-8 text-muted-foreground'>
              No categories found matching "{searchQuery}"
            </div>
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? t('edit', lang) : t('addNew', lang)}{' '}
                {t('categories', lang)}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? lang === 'en'
                    ? 'Edit category details below'
                    : lang === 'tr'
                      ? 'Aşağıda kategori detaylarını düzenleyin'
                      : 'قم بتحرير تفاصيل الفئة أدناه'
                  : lang === 'en'
                    ? 'Add a new category with details below'
                    : lang === 'tr'
                      ? 'Aşağıda yeni bir kategori ekleyin'
                      : 'أضف فئة جديدة مع التفاصيل أدناه'}
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4'>
              <ImageUpload
                value={formData.image}
                onChange={imageUrl => {
                  console.warn(
                    'ImageUpload onChange called with:',
                    imageUrl ? `Supabase Storage URL: ${imageUrl}` : 'null',
                  );
                  setFormData({ ...formData, image: imageUrl || '' });
                }}
                label={t('categoryImage', lang)}
                fallbackIcon={formData.icon}
                useSupabaseStorage={true}
                itemName={formData.nameEn || formData.nameTr || formData.nameAr}
              />
              <div>
                <Label>{t('fallbackIcon', lang)}</Label>
                <Input
                  value={formData.icon}
                  onChange={e =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                  placeholder='🍽️'
                />
                <p className='text-xs text-muted-foreground mt-1'>
                  {lang === 'en'
                    ? 'Used when no image is uploaded'
                    : lang === 'tr'
                      ? 'Görsel yüklenmediğinde kullanılır'
                      : 'يُستخدم عند عدم تحميل صورة'}
                </p>
              </div>
              <div>
                <Label>{t('nameEnglish', lang)}</Label>
                <Input
                  value={formData.nameEn}
                  onChange={e =>
                    setFormData({ ...formData, nameEn: e.target.value })
                  }
                  placeholder='Hot Drinks'
                />
              </div>
              <div>
                <Label>{t('nameTurkish', lang)}</Label>
                <Input
                  value={formData.nameTr}
                  onChange={e =>
                    setFormData({ ...formData, nameTr: e.target.value })
                  }
                  placeholder='Sıcak İçecekler'
                />
              </div>
              <div>
                <Label>{t('nameArabic', lang)}</Label>
                <Input
                  value={formData.nameAr}
                  onChange={e =>
                    setFormData({ ...formData, nameAr: e.target.value })
                  }
                  placeholder='مشروبات ساخنة'
                  dir='rtl'
                />
              </div>
              <div>
                <Label>Category Color</Label>
                <div className='flex items-center gap-2'>
                  <input
                    type='color'
                    value={formData.color}
                    onChange={e =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className='w-12 h-10 rounded border border-gray-300 cursor-pointer'
                  />
                  <Input
                    value={formData.color}
                    onChange={e =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    placeholder='#0C6071'
                    className='flex-1'
                  />
                </div>
                <p className='text-xs text-muted-foreground mt-1'>
                  Color used for category theming and badges
                </p>
              </div>
              <div>
                <Label>{t('order', lang)}</Label>
                <Input
                  type='number'
                  value={formData.order}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      order: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setDialogOpen(false)}
              >
                {t('cancel', lang)}
              </Button>
              <Button type='button' onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : t('save', lang)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
}

export default function AdminCategories(props: AdminCategoriesProps) {
  return (
    <ConfirmDialogProvider>
      <AdminCategoriesInner {...props} />
    </ConfirmDialogProvider>
  );
}
