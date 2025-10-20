import { useEffect, useState } from 'react';
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
import { Edit, Plus, Trash2 } from 'lucide-react';
import { Badge } from '../ui/badge';

interface AdminItemsSimpleProps {
  items: Item[];
  categories: Category[];
  onRefresh: () => void;
}

export default function AdminItemsSimple({
  items,
  categories,
  onRefresh,
}: AdminItemsSimpleProps) {
  const { lang } = useLang();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
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

  // Get items for selected category
  const categoryItems = selectedCategory
    ? items
        .filter(item => item.category_id === selectedCategory)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];

  // Set first category as default
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
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
        categoryId: selectedCategory,
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

  const updateItemOrder = async (itemId: string, newOrder: number) => {
    try {
      await itemsAPI.update(itemId, { order: newOrder });
      toast.success('Order updated');
      onRefresh();
    } catch (error: any) {
      console.error('Order update error:', error);
      toast.error('Failed to update order');
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <h2 className='text-xl font-medium'>{t('items', lang)}</h2>
          <span className='text-sm text-gray-500'>({items.length})</span>
        </div>
        <Button onClick={() => openDialog()} className='gap-2'>
          <Plus className='w-4 h-4' />
          {t('addNew', lang)}
        </Button>
      </div>

      {/* Category Selection */}
      <div className='space-y-3'>
        <Label>Select Category to Manage Items</Label>
        <div className='flex items-center gap-2 flex-wrap'>
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
                <TableHead className='w-24'>Price</TableHead>
                <TableHead className='w-20'>Order</TableHead>
                <TableHead className='w-20 hidden lg:table-cell'>
                  Available
                </TableHead>
                <TableHead className='text-right w-32'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryItems.map(item => (
                <TableRow key={item.id}>
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
                  <TableCell className='hidden md:table-cell'>
                    {item.names.ar}
                  </TableCell>
                  <TableCell>${item.price}</TableCell>
                  <TableCell>
                    <Input
                      type='number'
                      value={item.order || 0}
                      onChange={e => {
                        const newOrder = parseInt(e.target.value) || 0;
                        updateItemOrder(item.id, newOrder);
                      }}
                      className='w-16 h-8 text-center'
                      min='0'
                    />
                  </TableCell>
                  <TableCell className='hidden lg:table-cell'>
                    <Badge
                      variant={item.is_available ? 'default' : 'secondary'}
                    >
                      {item.is_available ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex items-center gap-1'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => openDialog(item)}
                        className='h-8 w-8 p-0'
                      >
                        <Edit className='w-4 h-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleDelete(item.id)}
                        className='h-8 w-8 p-0 text-red-600 hover:text-red-700'
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
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
