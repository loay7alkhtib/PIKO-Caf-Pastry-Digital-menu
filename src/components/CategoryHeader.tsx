import { memo } from 'react';
import type { Category } from '../lib/types';
import type { Lang } from '../lib/types';

interface CategoryHeaderProps {
  category: Category | undefined;
  lang: Lang;
}

const CategoryHeader = memo(function CategoryHeader({ category, lang }: CategoryHeaderProps) {
  if (!category) return null;

  return (
    <div className="mb-6 sm:mb-8 text-center">
      <div className="text-4xl sm:text-5xl mb-2 sm:mb-3">{category.icon}</div>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-medium px-4">
        {category.names[lang] || category.names.en}
      </h2>
    </div>
  );
});

export default CategoryHeader;
