import { memo } from 'react';
import { motion } from 'motion/react';
import Masonry from 'react-responsive-masonry';
import ItemCard from './ItemCard';
import type { Item, Lang } from '../lib/types';

interface ItemsGridProps {
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

const ItemsGrid = memo(
  ({
    items,
    lang,
    columnCount,
    gutterSize,
    onItemAdd,
    onItemClick,
    showCategories = false,
    categories = [],
  }: ItemsGridProps) => {
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

    return (
      <Masonry columnsCount={columnCount} gutter={gutterSize}>
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.2) }}
          >
            <div className='relative'>
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
      </Masonry>
    );
  },
);

export default ItemsGrid;
