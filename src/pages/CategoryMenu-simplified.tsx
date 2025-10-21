import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLang } from '../lib/LangContext';
import { useData } from '../lib/DataContext';
import { useCart } from '../lib/CartContext';
import { t } from '../lib/i18n';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

interface CategoryMenuProps {
  categoryId: string;
  onNavigate: (page: string, categoryId?: string) => void;
}

export default function CategoryMenu({
  categoryId,
  onNavigate,
}: CategoryMenuProps) {
  const { lang } = useLang();
  const { categories, items } = useData();
  const { addItem, items: cartItems } = useCart();
  const [searchQuery, setSearchQuery] = useState('');

  // Get current category
  const category = categories.find(c => c.id === categoryId);

  // Get items for this category
  const categoryItems = useMemo(() => {
    return items
      .filter(item => item.category_id === categoryId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [items, categoryId]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return categoryItems;

    const query = searchQuery.toLowerCase();
    return categoryItems.filter(item =>
      Object.values(item.names).some(name =>
        name.toLowerCase().includes(query),
      ),
    );
  }, [categoryItems, searchQuery]);

  const handleAddItem = (item: {
    id: string;
    names: Record<string, string>;
    price: number;
    image?: string;
  }) => {
    addItem({
      id: item.id,
      name: item.names[lang] || item.names.en,
      price: item.price,
      image: item.image,
    });
  };

  const getCartItemCount = (itemId: string) => {
    return cartItems.filter(item => item.id === itemId).length;
  };

  return (
    <div className='min-h-screen'>
      {/* Header */}
      <header className='w-full bg-card/50 backdrop-blur-sm border-b border-border sticky top-0 z-40'>
        <div className='max-w-[1400px] mx-auto px-4 py-4 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Button
              onClick={() => onNavigate('home')}
              variant='ghost'
              size='sm'
              className='gap-2'
            >
              <ArrowLeft className='w-4 h-4' />
              {t('backToMenu', lang)}
            </Button>
          </div>

          <div className='flex items-center gap-2'>
            <div className='relative'>
              <Button
                onClick={() => {
                  /* Open cart */
                }}
                className='gap-2'
              >
                <ShoppingBag className='w-4 h-4' />
                {cartItems.length > 0 && (
                  <Badge className='absolute -top-1 -right-1 min-w-[18px] h-5 px-1'>
                    {cartItems.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className='max-w-[1400px] mx-auto px-4 py-6'>
        {/* Category Header */}
        <div className='mb-6'>
          <h1 className='text-3xl font-medium mb-2'>
            {category?.names[lang] || category?.names.en}
          </h1>
          <p className='text-muted-foreground'>
            {categoryItems.length} {t('items', lang)}
          </p>
        </div>

        {/* Search */}
        <div className='mb-6'>
          <input
            type='text'
            placeholder={t('search', lang)}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='w-full max-w-md px-4 py-2 border border-border rounded-lg bg-background'
          />
        </div>

        {/* Items Grid */}
        <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Card className='p-4 hover:shadow-lg transition-all'>
                <div className='aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center text-4xl'>
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.names[lang] || item.names.en}
                      className='w-full h-full object-cover rounded-lg'
                    />
                  ) : (
                    '🍽️'
                  )}
                </div>

                <div className='space-y-2'>
                  <h3 className='font-medium'>
                    {item.names[lang] || item.names.en}
                  </h3>

                  {item.descriptions?.[lang] && (
                    <p className='text-sm text-muted-foreground'>
                      {item.descriptions[lang]}
                    </p>
                  )}

                  <div className='flex items-center justify-between'>
                    <span className='text-lg font-medium text-primary'>
                      ₺{item.price.toFixed(2)}
                    </span>

                    <Button
                      onClick={() => handleAddItem(item)}
                      size='sm'
                      className='gap-2'
                    >
                      <ShoppingBag className='w-4 h-4' />
                      {getCartItemCount(item.id) > 0 && (
                        <Badge variant='secondary' className='ml-1'>
                          {getCartItemCount(item.id)}
                        </Badge>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className='text-center py-12'>
            <p className='text-muted-foreground'>
              {searchQuery ? t('noResults', lang) : t('noItems', lang)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
