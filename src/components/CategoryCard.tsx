import { motion } from 'motion/react';
import { memo } from 'react';
import OptimizedImage from './OptimizedImage';

interface CategoryCardProps {
  name: string;
  icon: string;
  image?: string;
  onClick: () => void;
  onHover?: () => void;
}

const CategoryCard = memo(
  ({ name, icon, image, onClick, onHover }: CategoryCardProps) => {
    return (
      <motion.button
        onClick={onClick}
        onMouseEnter={onHover}
        onFocus={onHover}
        whileHover={{
          y: -6,
          scale: 1.02,
          transition: { type: 'spring', stiffness: 400, damping: 25 },
        }}
        whileTap={{ scale: 0.98 }}
        className='group relative w-full focus:outline-none'
      >
        {/* Liquid Glass Card Container */}
        <div className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/80 via-white/60 to-white/40 dark:from-white/10 dark:via-white/5 dark:to-white/[0.02] backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-500 group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] dark:group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)] group-hover:border-white/30 dark:group-hover:border-white/20 focus:ring-2 focus:ring-primary/20'>
          {/* Shimmer Effect on Hover */}
          <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-20'>
            <div className='absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent dark:via-white/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000' />
          </div>

          {/* Image/Icon Section */}
          <div className='relative aspect-[4/3] w-full overflow-hidden'>
            {/* Gradient Overlay */}
            <div className='absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 dark:to-black/30 z-10 pointer-events-none' />

            {image ? (
              <OptimizedImage
                src={image}
                alt={name}
                className='w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out'
                loading='lazy'
              />
            ) : (
              <div className='w-full h-full flex items-center justify-center text-5xl sm:text-6xl md:text-7xl bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 group-hover:from-primary/10 group-hover:to-primary/15 dark:group-hover:from-primary/15 dark:group-hover:to-primary/25 transition-colors duration-500'>
                <motion.span
                  animate={{
                    rotateZ: [0, -5, 5, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'easeInOut',
                  }}
                >
                  {icon}
                </motion.span>
              </div>
            )}
          </div>

          {/* Name Section */}
          <div className='relative p-4 sm:p-5'>
            {/* Glass separator line */}
            <div className='absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/40 dark:via-white/20 to-transparent' />

            <div className='font-medium text-sm sm:text-base text-foreground/90 dark:text-foreground/95 truncate text-start'>
              {name}
            </div>
          </div>
        </div>

        {/* Glow effect on hover */}
        <div className='absolute -inset-1 rounded-3xl bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 opacity-0 group-hover:from-primary/5 group-hover:via-primary/10 group-hover:to-primary/5 group-hover:opacity-100 blur-xl transition-all duration-700 -z-10' />
      </motion.button>
    );
  }
);

export default CategoryCard;
