import { useState, memo, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import Masonry from 'react-responsive-masonry';
import NavBar from '../components/NavBar';
import ItemCard from '../components/ItemCard';
import ItemPreview from '../components/ItemPreview';
import CategoryCard from '../components/CategoryCard';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { useLang } from '../lib/LangContext';
import { useCart } from '../lib/CartContext';
import { useData } from '../lib/DataContext';
import { t, dirFor } from '../lib/i18n';
import { Item } from '../lib/supabase';
import { ArrowLeft, Grid3x3 } from 'lucide-react';
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
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Scroll to top when category changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [categoryId]);

  // Track window width for responsive columns
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate responsive column count
  const columnCount = useMemo(() => {
    if (windowWidth >= 1536) return 6; // 2xl
    if (windowWidth >= 1280) return 5; // xl
    if (windowWidth >= 1024) return 4; // lg
    if (windowWidth >= 768) return 3;  // md
    return 2; // mobile & small tablet - 2 columns for better bento grid
  }, [windowWidth]);

  // Responsive gutter size
  const gutterSize = useMemo(() => {
    if (windowWidth < 768) return '0.75rem'; // 12px on mobile
    if (windowWidth < 1024) return '1rem';   // 16px on tablet
    return '1.25rem'; // 20px on desktop
  }, [windowWidth]);

  // Get category from cache - INSTANT!
  const category = useMemo(() => 
    categories.find(c => c.id === categoryId),
    [categories, categoryId]
  );

  // Get items for this category from cache - INSTANT!
  const items = useMemo(() => 
    allItems.filter(item => item.category_id === categoryId).sort((a, b) => a.order - b.order),
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

        {/* Quick Category Navigation Bar */}
        {categories.length > 0 && (
          <div className="mb-6 sm:mb-8 -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 sm:gap-3 pb-2 min-w-min">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => onNavigate('category', cat.id)}
                    className={`
                      flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl 
                      transition-all duration-200 flex-shrink-0
                      ${cat.id === categoryId
                        ? 'bg-primary text-primary-foreground shadow-md scale-105'
                        : 'bg-card border border-border hover:border-primary/50 hover:bg-accent'
                      }
                    `}
                  >
                    <span className="text-lg sm:text-xl">{cat.icon}</span>
                    <span className="text-xs sm:text-sm whitespace-nowrap">
                      {cat.names[lang] || cat.names.en}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {category && (
          <div className="mb-6 sm:mb-8 text-center">
            <div className="text-4xl sm:text-5xl mb-2 sm:mb-3">{category.icon}</div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-medium px-4">
              {category.names[lang] || category.names.en}
            </h2>
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-start py-12 text-muted-foreground">
            <p className="text-sm sm:text-base">
              {lang === 'en' ? 'No items in this category yet' :
               lang === 'tr' ? 'Bu kategoride henüz ürün yok' :
               'لا توجد عناصر في هذه الفئة بعد'}
            </p>
          </div>
        ) : (
          <Masonry
            columnsCount={columnCount}
            gutter={gutterSize}
          >
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.2) }}
              >
                <ItemCard
                  name={item.names[lang] || item.names.en}
                  price={item.price}
                  image={item.image}
                  tags={item.tags}
                  variants={item.variants}
                  onAdd={() => {
                    // If has variants, open preview to let user choose size
                    if (item.variants && item.variants.length > 0) {
                      setPreviewItem(item);
                    } else {
                      handleAddItem(item);
                    }
                  }}
                  onClick={() => setPreviewItem(item)}
                />
              </motion.div>
            ))}
          </Masonry>
        )}
      </div>

      {/* Browse More Categories Section - Always show for easy navigation */}
      {categories.length > 1 && (
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-12">
          <Separator className="mb-8 sm:mb-12" />
          
          <div className="text-start mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20 mb-3">
              <Grid3x3 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {lang === 'en' ? 'Browse More' :
                 lang === 'tr' ? 'Daha Fazla Göz At' :
                 'تصفح المزيد'}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-medium">
              {lang === 'en' ? 'Explore Other Categories' :
               lang === 'tr' ? 'Diğer Kategorileri Keşfedin' :
               'استكشف الفئات الأخرى'}
            </h3>
          </div>

          <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {categories.map((cat, index) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
              >
                <CategoryCard
                  name={cat.names[lang] || cat.names.en}
                  icon={cat.icon}
                  image={cat.image}
                  onClick={() => onNavigate('category', cat.id)}
                />
              </motion.div>
            ))}
          </div>

          {/* Back to Top Helper */}
          <div className="text-start mt-8 sm:mt-12">
            <Button
              onClick={() => onNavigate('home')}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('backToMenu', lang)}
            </Button>
          </div>
        </div>
      )}

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
