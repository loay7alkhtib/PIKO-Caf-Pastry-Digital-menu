import { useCallback, useState } from 'react';
// @ts-ignore
import { DndProvider } from 'react-dnd';
// @ts-ignore
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import ImageUpload from '../ImageUpload';
// DraggableCategory removed - using simple category display
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
import { Info, Plus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface AdminCategoriesProps {
  categories: Category[];
  onRefresh: () => void;
}

export default function AdminCategories({
  categories,
  onRefresh,
}: AdminCategoriesProps) {
  const { lang } = useLang();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    nameEn: '',
    nameTr: '',
    nameAr: '',
    icon: '🍽️',
    image: '',
    color: '#0C6071', // Default color
    order: 0,
  });

  // Update local categories when props change
  useState(() => {
    setLocalCategories([...categories].sort((a, b) => a.order - b.order));
  });

  const moveCategory = useCallback(
    async (dragIndex: number, hoverIndex: number) => {
      const dragCategory = localCategories[dragIndex];
      if (!dragCategory) return;

      const newCategories = [...localCategories];
      newCategories.splice(dragIndex, 1);
      newCategories.splice(hoverIndex, 0, dragCategory);

      // Update local state immediately for smooth UX
      setLocalCategories(newCategories);

      // Update order values and save to backend
      try {
        const updates = newCategories.map((cat, index) => ({
          ...cat,
          order: index,
        }));

        // Save all updates
        await Promise.all(
          updates.map(cat =>
            categoriesAPI.update(cat.id, { ...cat, order: cat.order })
          ),
        );

        toast.success('Order updated');
        onRefresh();
      } catch (error: any) {
        console.error('Reorder error:', error);
        toast.error('Failed to update order');
        setLocalCategories(categories); // Revert on error
      }
    },
    [localCategories, categories, onRefresh]
  );

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
    try {
      const data = {
        names: {
          en: formData.nameEn,
          tr: formData.nameTr,
          ar: formData.nameAr,
        },
        icon: formData.icon,
        image: formData.image || undefined,
        color: formData.color,
        order: formData.order,
      };

      console.log(
        'Saving category with image:',
        formData.image ? `Yes (length: ${formData.image.length})` : 'No'
      );

      if (editingId) {
        await categoriesAPI.update(editingId, data);
        toast.success('Category updated');
      } else {
        await categoriesAPI.create(data);
        toast.success('Category created');
      }

      setDialogOpen(false);
      onRefresh();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;

    try {
      await categoriesAPI.delete(id);
      toast.success('Category deleted');
      onRefresh();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-medium'>{t('categories', lang)}</h2>
          <Button onClick={() => openDialog()} className='gap-2'>
            <Plus className='w-4 h-4' />
            {t('addNew', lang)}
          </Button>
        </div>

        <Alert>
          <Info className='h-4 w-4' />
          <AlertTitle>{t('dragToReorder', lang)}</AlertTitle>
          <AlertDescription>{t('dragInstruction', lang)}</AlertDescription>
        </Alert>

        <div className='space-y-2'>
          {localCategories.map((category, index) => (
            <div
              key={category.id}
              className='flex items-center justify-between p-4 bg-card rounded-lg border border-border'
            >
              <div className='flex items-center gap-3'>
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
                  variant='outline'
                  size='sm'
                  onClick={() => openDialog(category)}
                >
                  Edit
                </Button>
                <Button
                  variant='destructive'
                  size='sm'
                  onClick={() => handleDelete(category.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
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
                  console.log(
                    'ImageUpload onChange called with:',
                    imageUrl ? `Supabase Storage URL: ${imageUrl}` : 'null'
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
              <Button variant='outline' onClick={() => setDialogOpen(false)}>
                {t('cancel', lang)}
              </Button>
              <Button onClick={handleSave}>{t('save', lang)}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
}
