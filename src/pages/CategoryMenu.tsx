import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import NavBar from '../components/NavBar';
import ItemPreview from '../components/ItemPreview';
import CategoryNavigation from '../components/CategoryNavigation';
import CategoryHeader from '../components/CategoryHeader';
import ItemsGrid from '../components/ItemsGrid';
import BrowseMoreSection from '../components/BrowseMoreSection';
import SearchBar from '../components/SearchBar';
import { Button } from '../components/ui/button';
import { useLang } from '../lib/LangContext';
import { useData } from '../lib/DataContext';
import { useResponsiveColumns } from '../lib/hooks/useResponsiveColumns';
import { useNavigation } from '../lib/hooks/useNavigation';
import { useCartOperations } from '../lib/hooks/useCartOperations';
import { useScrollToTop } from '../lib/hooks/useScrollToTop';
import { t } from '../lib/i18n';
import type { Item } from '../lib/types';
import { ArrowLeft } from 'lucide-react';

interface CategoryMenuProps {
  categoryId: string;
  onNavigate: (_page: string, _categoryId?: string) => void;
}

const CategoryMenu = memo(({ categoryId, onNavigate }: CategoryMenuProps) => {
  const { lang } = useLang();
  const { categories, items: allItems } = useData();
  const [previewItem, setPreviewItem] = useState<Item | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { columnCount, gutterSize } = useResponsiveColumns();
  const { navigateToHome, navigateToAdminLogin } = useNavigation({
    onNavigate,
  });
  const { addItemToCart } = useCartOperations();

  // Scroll to top when category changes
  useScrollToTop(categoryId);

  // Get category from cache - INSTANT!
  const category = useMemo(
    () => categories.find(c => c.id === categoryId),
    [categories, categoryId],
  );

  // Get items for this category and sort by explicit display order
  const categoryItems = useMemo(() => {
    return allItems
      .filter(item => item.category_id === categoryId)
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [allItems, categoryId]);

  // Filter items based on search query - search across ALL items when searching
  const items = useMemo(() => {
    if (!searchQuery.trim()) {
      return categoryItems;
    }

    const query = searchQuery.toLowerCase().trim();

    // When searching, search across ALL items in the menu, not just current category
    const allFilteredItems = allItems.filter(item => {
      // Search in item names (multilingual) with safer typing
      const nameMatch = Object.values(item.names || {}).some(
        name => typeof name === 'string' && name.toLowerCase().includes(query),
      );

      // Search in descriptions (multilingual)
      const descriptionMatch =
        item.descriptions &&
        Object.values(item.descriptions).some(desc =>
          desc?.toLowerCase().includes(query),
        );

      // Search in tags
      const tagMatch = item.tags.some(tag => tag.toLowerCase().includes(query));

      // Search in category names
      const category = categories.find(c => c.id === item.category_id);
      const categoryMatch =
        category &&
        Object.values(category.names || category.name || {}).some(catName =>
          catName.toLowerCase().includes(query),
        );

      return nameMatch || descriptionMatch || tagMatch || categoryMatch;
    });

    // Keep search results deterministic: sort by the same order as admin
    return allFilteredItems
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [allItems, categories, searchQuery, categoryItems]);

  const handleAddItem = useCallback(
    (item: Item, size?: string, customPrice?: number) => {
      addItemToCart(item, size, customPrice);
    },
    [addItemToCart],
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Clear search when category changes
  useEffect(() => {
    const clearSearch = () => {
      if (searchQuery) {
        setSearchQuery('');
      }
    };
    clearSearch();
  }, [categoryId, searchQuery]);

  const handleLogoTripleTap = () => {
    navigateToAdminLogin();
  };

  return (
    <div className='min-h-screen'>
      <NavBar
        onLogoTripleTap={handleLogoTripleTap}
        onNavigate={onNavigate}
        showAccountIcon={false}
      />

      <div className='max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6'>
        <Button
          onClick={navigateToHome}
          variant='outline'
          className='mb-4'
          size='sm'
        >
          <ArrowLeft className='w-4 h-4 mr-2' />
          <span className='text-sm sm:text-base'>{t('backToMenu', lang)}</span>
        </Button>

        <CategoryNavigation
          categories={categories}
          currentCategoryId={categoryId}
          lang={lang}
          onNavigate={onNavigate}
        />

        <CategoryHeader category={category} lang={lang} />

        {/* Search Bar */}
        <div className='mb-6'>
          <SearchBar onSearch={handleSearch} onClear={handleClearSearch} />
        </div>

        <ItemsGrid
          items={items}
          lang={lang}
          columnCount={columnCount}
          gutterSize={gutterSize}
          onItemAdd={item => {
            // If has variants, open preview to let user choose size
            if (item.variants && item.variants.length > 0) {
              setPreviewItem(item);
            } else {
              handleAddItem(item);
            }
          }}
          onItemClick={setPreviewItem}
          showCategories={!!searchQuery.trim()}
          categories={categories}
        />
      </div>

      <BrowseMoreSection
        categories={categories}
        lang={lang}
        onNavigate={onNavigate}
      />

      {/* Item Preview Dialog */}
      <ItemPreview
        isOpen={!!previewItem}
        onClose={() => setPreviewItem(null)}
        item={previewItem}
        onAdd={(size, price) =>
          previewItem && handleAddItem(previewItem, size, price)
        }
        categoryName={
          category
            ? category.names?.[lang] ||
              category.names?.en ||
              category.name?.[lang] ||
              category.name?.en
            : undefined
        }
      />
    </div>
  );
});

export default CategoryMenu;
