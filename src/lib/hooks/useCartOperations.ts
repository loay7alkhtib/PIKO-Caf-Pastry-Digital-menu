import { useCallback } from 'react';
import { useCart } from '../CartContext';
import { useLang } from '../LangContext';
import { toast } from 'sonner';
import type { Item } from '../types';

export function useCartOperations() {
  const { addItem } = useCart();
  const { lang } = useLang();

  const addItemToCart = useCallback((item: Item, size?: string, customPrice?: number) => {
    const displayPrice = customPrice || item.price;
    
    addItem({
      id: item.id,
      name: item.names[lang] || item.names.en,
      price: displayPrice,
      image: item.image || undefined,
      size,
    });

    // Show success toast
    toast.success(
      lang === 'en' ? 'Added to list!' :
      lang === 'tr' ? 'Listeye eklendi!' :
      'أضيف إلى القائمة!'
    );
  }, [addItem, lang]);

  return {
    addItemToCart,
  };
}
