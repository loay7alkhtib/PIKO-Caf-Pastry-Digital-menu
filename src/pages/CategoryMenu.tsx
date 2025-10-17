import { useState, memo, useCallback, useMemo, useEffect } from 'react';
import NavBar from '../components/NavBar';
import ItemPreview from '../components/ItemPreview';
import CategoryNavigation from '../components/CategoryNavigation';
import CategoryHeader from '../components/CategoryHeader';
import ItemsGrid from '../components/ItemsGrid';
import BrowseMoreSection from '../components/BrowseMoreSection';
import { Button } from '../components/ui/button';
import { useLang } from '../lib/LangContext';
import { useCart } from '../lib/CartContext';
import { useData } from '../lib/DataContext';
import { useResponsiveColumns } from '../lib/hooks/useResponsiveColumns';
import { t, dirFor } from '../lib/i18n';
import type { Item } from '../lib/types';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface CategoryMenuProps {
  categoryId: string;
  onNavigate: (page: string, categoryId?: string) => void;
}

const CategoryMenu = memo(function CategoryMenu({ categoryId, onNavigate }: CategoryMenuProps) {
  const { lang } = useLang();
  const { addItem } = useCart();
  const { categories, items: allItems } = useData();
  const [previewItem, setPreviewItem] = useState<Item | null>(null);
  const { columnCount, gutterSize } = useResponsiveColumns();

  // Scroll to top when category changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [categoryId]);

  // Get category from cache - INSTANT!
  const category = useMemo(() => 
    categories.find(c => c.id === categoryId),
    [categories, categoryId]
  );

  // Get items for this category from cache - INSTANT!
  const items = useMemo(() => 
    allItems.filter(item => item.category_id === categoryId),
    [allItems, categoryId]
  );

  const handleAddItem = useCallback((item: Item, size?: string, customPrice?: number) => {
    const displayPrice = customPrice || item.price;
    
    addItem({
      id: item.id,
      name: item.names[lang] || item.names.en,
      price: displayPrice,
      image: item.image || undefined,
      size,
    });
    toast.success(
      lang === 'en' ? 'Added to list!' :
      lang === 'tr' ? 'Listeye eklendi!' :
      'أضيف إلى القائمة!'
    );
  }, [addItem, lang]);

  const handleLogoTripleTap = () => {
    onNavigate('admin-login');
  };

  return (
    <div className="min-h-screen" dir={dirFor(lang)}>
      <NavBar onLogoTripleTap={handleLogoTripleTap} onNavigate={onNavigate} />

      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        <Button
          onClick={() => onNavigate('home')}
          variant="outline"
          className="mb-4"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="text-sm sm:text-base">{t('backToMenu', lang)}</span>
        </Button>

        <CategoryNavigation
          categories={categories}
          currentCategoryId={categoryId}
          lang={lang}
          onNavigate={onNavigate}
        />

        <CategoryHeader category={category} lang={lang} />

        <ItemsGrid
          items={items}
          lang={lang}
          columnCount={columnCount}
          gutterSize={gutterSize}
          onItemAdd={(item) => {
            // If has variants, open preview to let user choose size
            if (item.variants && item.variants.length > 0) {
              setPreviewItem(item);
            } else {
              handleAddItem(item);
            }
          }}
          onItemClick={setPreviewItem}
        />
      </div>

      <BrowseMoreSection
        categories={categories}
        lang={lang}
        onNavigate={onNavigate}
      />

      {/* Item Preview Dialog */}
      <ItemPreview
        isOpen={!!previewItem}
        onClose={() => setPreviewItem(null)}
        item={previewItem}
        onAdd={(size, price) => previewItem && handleAddItem(previewItem, size, price)}
        categoryName={category ? (category.names[lang] || category.names.en) : undefined}
      />
    </div>
  );
});

export default CategoryMenu;
