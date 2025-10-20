import { memo } from 'react';
import type { Category, Lang } from '../lib/types';

interface CategoryNavigationProps {
  categories: Category[];
  currentCategoryId: string;
  lang: Lang;
  onNavigate: (_page: string, _categoryId?: string) => void;
}

const CategoryNavigation = memo(
  ({
    categories,
    currentCategoryId,
    lang,
    onNavigate,
  }: CategoryNavigationProps) => {
    if (categories.length === 0) return null;

    return (
      <div className='mb-6 sm:mb-8 -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 px-3 sm:px-4 md:px-6 lg:px-8'>
        <div className='overflow-x-auto scrollbar-hide'>
          <div className='flex gap-2 sm:gap-3 pb-2 min-w-min'>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => onNavigate('category', cat.id)}
                className={`
                flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl 
                transition-all duration-200 flex-shrink-0
                ${
                  cat.id === currentCategoryId
                    ? 'bg-primary text-primary-foreground shadow-md scale-105'
                    : 'bg-card border border-border hover:border-primary/50 hover:bg-accent'
                }
              `}
              >
                <span className='text-lg sm:text-xl'>{cat.icon}</span>
                <span className='text-xs sm:text-sm whitespace-nowrap'>
                  {cat.names[lang] || cat.names.en}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

export default CategoryNavigation;
