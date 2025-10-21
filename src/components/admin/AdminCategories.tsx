import { useEffect, useState } from 'react';
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
import { Plus } from 'lucide-react';

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
  useEffect(() => {
    setLocalCategories([...categories].sort((a, b) => a.order - b.order));
  }, [categories]);

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
        formData.image ? `Yes (length: ${formData.image.length})` : 'No',
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
    } catch (error) {
      console.error('Save error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to save category';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;

    try {
      await categoriesAPI.delete(id);
      toast.success('Category deleted');
      onRefresh();
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete category';
      toast.error(errorMessage);
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-medium'>{t('categories', lang)}</h2>
        <Button type='button' onClick={() => openDialog()} className='gap-2'>
          <Plus className='w-4 h-4' />
          {t('addNew', lang)}
        </Button>
      </div>

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
                type='button'
                variant='outline'
                size='sm'
                onClick={() => openDialog(category)}
              >
                Edit
              </Button>
              <Button
                type='button'
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
            <Button type='button' onClick={handleSave}>
              {t('save', lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
