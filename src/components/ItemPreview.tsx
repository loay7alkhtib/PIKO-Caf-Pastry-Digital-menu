import { memo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useLang } from '../lib/LangContext';
import { t, translateSize } from '../lib/i18n';
import OptimizedImage from './OptimizedImage';
import { Button } from './ui/button';
import { ItemVariant } from '../lib/supabase';

interface ItemPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    names: { en: string; tr: string; ar: string };
    price: number;
    image?: string | null;
    tags?: string[];
    variants?: ItemVariant[];
  } | null;
  onAdd: (size?: string, price?: number) => void;
  categoryName?: string;
}

const ItemPreview = memo(
  ({ isOpen, onClose, item, onAdd, categoryName }: ItemPreviewProps) => {
    const { lang } = useLang();
    const [selectedSize, setSelectedSize] = useState<string | null>(null);

    if (!item) return null;

    const itemName =
      item.names?.[lang] ||
      item.names?.en ||
      item.name?.[lang] ||
      item.name?.en ||
      'Unknown Item';
    const hasVariants = item.variants && item.variants.length > 0;

    // Get price based on selected size
    const getDisplayPrice = () => {
      if (hasVariants && selectedSize) {
        const variant = item.variants?.find(v => v.size === selectedSize);
        return variant?.price || item.price;
      }
      return item.price;
    };

    const handleAddToCart = () => {
      if (hasVariants && !selectedSize) {
        // Auto-select first size if none selected
        const firstSize = item.variants?.[0]?.size;
        const firstPrice = item.variants?.[0]?.price;
        onAdd(firstSize, firstPrice);
      } else if (hasVariants && selectedSize) {
        const variant = item.variants?.find(v => v.size === selectedSize);
        onAdd(selectedSize, variant?.price || 0);
      } else {
        onAdd();
      }
      onClose();
    };

    // Auto-select first size on open
    if (
      hasVariants &&
      !selectedSize &&
      item.variants &&
      item.variants.length > 0
    ) {
      const firstSize = item.variants[0]?.size;
      if (firstSize) {
        setSelectedSize(firstSize);
      }
    }

    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50'
            />

            {/* Dialog */}
            <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
              <motion.div
                role='dialog'
                aria-modal='true'
                aria-labelledby='item-preview-title'
                aria-describedby='item-preview-price'
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className='bg-card rounded-3xl shadow-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto'
                onClick={e => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className='absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-background transition-colors'
                >
                  <X className='w-5 h-5' />
                </button>

                {/* Image */}
                <div className='relative h-64 sm:h-80 md:h-96 bg-muted/30 overflow-hidden'>
                  {item.image ? (
                    <OptimizedImage
                      src={item.image}
                      alt={itemName}
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center'>
                      <span className='text-8xl sm:text-9xl'>🍽️</span>
                    </div>
                  )}
                </div>

                {/* Content - Compact */}
                <div className='p-5 sm:p-6 space-y-4'>
                  {/* Title and Price */}
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex-1 text-start'>
                      <h2
                        id='item-preview-title'
                        className='text-xl sm:text-2xl font-medium'
                      >
                        {itemName}
                      </h2>
                      {categoryName && (
                        <p className='text-muted-foreground text-sm mt-1'>
                          {categoryName}
                        </p>
                      )}
                    </div>
                    <div
                      id='item-preview-price'
                      className='text-xl font-medium text-primary whitespace-nowrap'
                    >
                      ₺{getDisplayPrice().toFixed(2)}
                    </div>
                  </div>

                  {/* Size Selection - Only show if item has variants */}
                  {hasVariants && (
                    <div className='space-y-2 text-start'>
                      <p className='text-sm font-medium'>
                        {t('selectSize', lang)}
                      </p>
                      <div className='grid grid-cols-3 gap-2'>
                        {(item.variants ?? []).map(variant => (
                          <button
                            key={variant.size}
                            onClick={() => setSelectedSize(variant.size)}
                            className={`
                            p-2.5 rounded-xl border-2 transition-all
                            ${
                              selectedSize === variant.size
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border hover:border-primary/50'
                            }
                          `}
                          >
                            <div className='text-sm font-medium'>
                              {translateSize(variant.size, lang)}
                            </div>
                            <div className='text-xs text-primary font-medium mt-0.5'>
                              ₺{variant.price.toFixed(2)}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className='flex gap-1.5 flex-wrap pt-2'>
                      {item.tags.map((tag, i) => (
                        <span
                          key={i}
                          className='text-xs px-2.5 py-1 rounded-full bg-secondary/70 text-secondary-foreground'
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Add to Cart Button */}
                  <Button
                    onClick={handleAddToCart}
                    className='w-full h-11 text-base gap-2 rounded-xl mt-3'
                    size='lg'
                  >
                    <Plus className='w-5 h-5' />
                    <span>{t('add', lang)}</span>
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    );
  },
);

export default ItemPreview;
