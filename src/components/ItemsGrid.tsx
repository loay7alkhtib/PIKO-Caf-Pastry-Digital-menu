import { memo } from 'react';
import { motion } from 'motion/react';
import Masonry from 'react-responsive-masonry';
import ItemCard from './ItemCard';
import type { Item } from '../lib/types';
import type { Lang } from '../lib/types';

interface ItemsGridProps {
  items: Item[];
  lang: Lang;
  columnCount: number;
  gutterSize: string;
  onItemAdd: (item: Item) => void;
  onItemClick: (item: Item) => void;
}

const ItemsGrid = memo(function ItemsGrid({
  items,
  lang,
  columnCount,
  gutterSize,
  onItemAdd,
  onItemClick
}: ItemsGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-start py-12 text-muted-foreground">
        <p className="text-sm sm:text-base">
          {lang === 'en' ? 'No items in this category yet' :
           lang === 'tr' ? 'Bu kategoride henüz ürün yok' :
           'لا توجد عناصر في هذه الفئة بعد'}
        </p>
      </div>
    );
  }

  return (
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
            onAdd={() => onItemAdd(item)}
            onClick={() => onItemClick(item)}
          />
        </motion.div>
      ))}
    </Masonry>
  );
});

export default ItemsGrid;
