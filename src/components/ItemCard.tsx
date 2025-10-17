import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { memo, useState, useEffect } from 'react';
import { useLang } from '../lib/LangContext';
import { t, translateSize } from '../lib/i18n';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ItemVariant } from '../lib/supabase';

interface ItemCardProps {
  name: string;
  price: number;
  image?: string | null;
  tags?: string[];
  variants?: ItemVariant[];
  onAdd: () => void;
  onClick?: () => void;
}

const ItemCard = memo(function ItemCard({ name, price, image, tags = [], variants, onAdd, onClick }: ItemCardProps) {
  const { lang } = useLang();
  const hasVariants = variants && variants.length > 0;
  const [aspectRatio, setAspectRatio] = useState<number>(4 / 3); // Default 4:3

  // Detect image aspect ratio when loaded
  useEffect(() => {
    if (!image) {
      setAspectRatio(4 / 3); // Default for emoji fallback
      return;
    }

    const img = new Image();
    img.onload = () => {
      const ratio = img.width / img.height;
      setAspectRatio(ratio);
    };
    img.onerror = () => {
      setAspectRatio(4 / 3); // Fallback on error
    };
    img.src = image;
  }, [image]);

  return (
    <motion.div
      whileHover={{ 
        y: -6,
        transition: { type: 'spring', stiffness: 400, damping: 25 }
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative h-full flex flex-col cursor-pointer"
    >
      {/* Liquid Glass Card Container */}
      <div className="relative h-full flex flex-col rounded-3xl overflow-hidden bg-gradient-to-br from-white/80 via-white/60 to-white/40 dark:from-white/10 dark:via-white/5 dark:to-white/[0.02] backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-500 group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] dark:group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)] group-hover:border-white/30 dark:group-hover:border-white/20">
        
        {/* Shimmer Effect on Hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent dark:via-white/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </div>

        {/* Image Section - Dynamic Aspect Ratio */}
        <div 
          className="relative overflow-hidden flex-shrink-0"
          style={{ aspectRatio: aspectRatio.toString() }}
        >
          {/* Gradient Overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 dark:to-black/30 z-10 pointer-events-none" />
          
          {image ? (
            <ImageWithFallback
              src={image}
              alt={name}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl sm:text-6xl bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20">
              🍽️
            </div>
          )}

          {/* Circular Add Button - Floating */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 flex items-center justify-center z-20 group/btn"
            aria-label={t('add', lang)}
          >
            {/* Button shine effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
            <Plus className="w-5 h-5 relative z-10" strokeWidth={2.5} />
          </motion.button>
        </div>

        {/* Content Section - Compact */}
        <div className="p-3 sm:p-4 space-y-2 flex-1 flex flex-col relative">
          {/* Glass separator line */}
          <div className="absolute top-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-white/40 dark:via-white/20 to-transparent" />
          
          {/* Name and Price on Same Line */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm sm:text-base line-clamp-1 text-foreground/90 dark:text-foreground/95 flex-1 text-start">
              {name}
            </h3>
            {!hasVariants && (
              <span className="text-primary font-medium text-sm whitespace-nowrap">₺{price.toFixed(2)}</span>
            )}
          </div>
          
          {/* Size Variants Display - More Compact */}
          {hasVariants && (
            <div className="space-y-1">
              {variants.map((variant, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between text-xs sm:text-sm px-2 py-1 rounded-lg bg-white/40 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10"
                >
                  <span className="text-muted-foreground font-medium">{translateSize(variant.size, lang)}</span>
                  <span className="text-primary font-medium">₺{variant.price.toFixed(2)}</span>
                </motion.div>
              ))}
            </div>
          )}

          {/* Tags - Compact Inline */}
          {tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {tags.map((tag, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-foreground/70 dark:text-foreground/80 font-medium"
                >
                  {tag}
                </motion.span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Glow effect on hover */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 opacity-0 group-hover:from-primary/5 group-hover:via-primary/10 group-hover:to-primary/5 group-hover:opacity-100 blur-xl transition-all duration-700 -z-10" />
    </motion.div>
  );
});

export default ItemCard;
