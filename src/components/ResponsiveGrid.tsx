import { memo } from 'react';
import { motion } from 'motion/react';
import ItemCard from './ItemCard';
import type { Item } from '../lib/types';
import type { Lang } from '../lib/types';

interface ResponsiveGridProps {
  items: Item[];
  lang: Lang;
  columnCount: number;
  gutterSize: string;
  onItemAdd: (item: Item) => void;
  onItemClick: (item: Item) => void;
  showCategories?: boolean;
  categories?: Array<{
    id: string;
    names: { en: string; tr: string; ar: string };
  }>;
}

const ResponsiveGrid = memo(
  ({
    items,
    lang,
    columnCount,
    gutterSize,
    onItemAdd,
    onItemClick,
    showCategories = false,
    categories = [],
  }: ResponsiveGridProps) => {
    if (items.length === 0) {
      return (
        <div className='text-start py-12 text-muted-foreground'>
          <p className='text-sm sm:text-base'>
            {lang === 'en'
              ? 'No items in this category yet'
              : lang === 'tr'
                ? 'Bu kategoride henüz ürün yok'
                : 'لا توجد عناصر في هذه الفئة بعد'}
          </p>
        </div>
      );
    }

    const getCategoryName = (categoryId: string) => {
      const category = categories.find(c => c.id === categoryId);
      return category ? category.names[lang] || category.names.en : '';
    };

    // Convert gutterSize to CSS value
    const getGapClass = () => {
      const gap = gutterSize.replace('rem', '');
      const gapNum = parseFloat(gap);
      if (gapNum <= 0.75) return 'gap-3';
      if (gapNum <= 1) return 'gap-4';
      return 'gap-5';
    };

    // Get grid columns class
    const getGridColsClass = () => {
      switch (columnCount) {
        case 1:
          return 'grid-cols-1';
        case 2:
          return 'grid-cols-1 sm:grid-cols-2';
        case 3:
          return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
        case 4:
          return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
        case 5:
          return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
        case 6:
          return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6';
        default:
          return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
      }
    };

    return (
      <div className={`grid ${getGridColsClass()} ${getGapClass()} w-full`}>
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.2) }}
            className='w-full'
          >
            <div className='relative w-full'>
              <ItemCard
                name={
                  item.names[lang] ||
                  item.names.en ||
                  item.names.tr ||
                  item.names.ar ||
                  `Item ${item.id.slice(0, 8)}`
                }
                price={item.price}
                image={item.image}
                tags={item.tags}
                variants={item.variants}
                onAdd={() => onItemAdd(item)}
                onClick={() => onItemClick(item)}
              />
              {showCategories && item.category_id && (
                <div className='absolute top-2 left-2 bg-primary/90 text-primary-foreground px-2 py-1 rounded-full text-xs font-medium'>
                  {getCategoryName(item.category_id)}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    );
  }
);

export default ResponsiveGrid;
