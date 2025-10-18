import { memo } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import CategoryCard from './CategoryCard';
import { ArrowLeft, Grid3x3 } from 'lucide-react';
import { t } from '../lib/i18n';
import type { Category, Lang } from '../lib/types';

interface BrowseMoreSectionProps {
  categories: Category[];
  lang: Lang;
  onNavigate: (page: string, categoryId?: string) => void;
}

const BrowseMoreSection = memo(
  ({ categories, lang, onNavigate }: BrowseMoreSectionProps) => {
    if (categories.length <= 1) return null;

    return (
      <div className='max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-12'>
        <Separator className='mb-8 sm:mb-12' />

        <div className='text-start mb-6 sm:mb-8'>
          <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20 mb-3'>
            <Grid3x3 className='w-4 h-4 text-primary' />
            <span className='text-sm font-medium text-primary'>
              {lang === 'en'
                ? 'Browse More'
                : lang === 'tr'
                  ? 'Daha Fazla Göz At'
                  : 'تصفح المزيد'}
            </span>
          </div>
          <h3 className='text-xl sm:text-2xl font-medium'>
            {lang === 'en'
              ? 'Explore Other Categories'
              : lang === 'tr'
                ? 'Diğer Kategorileri Keşfedin'
                : 'استكشف الفئات الأخرى'}
          </h3>
        </div>

        <div className='grid gap-4 sm:gap-5 md:gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
          {categories.map((cat, index) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
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
        <div className='text-start mt-8 sm:mt-12'>
          <Button
            onClick={() => onNavigate('home')}
            variant='outline'
            size='lg'
            className='gap-2'
          >
            <ArrowLeft className='w-4 h-4' />
            {t('backToMenu', lang)}
          </Button>
        </div>
      </div>
    );
  }
);

export default BrowseMoreSection;
