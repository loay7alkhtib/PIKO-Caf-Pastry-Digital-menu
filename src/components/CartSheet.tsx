import { memo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';
import { Button } from './ui/button';
import { useLang } from '../lib/LangContext';
import { useCart } from '../lib/CartContext';
import { t, translateSize } from '../lib/i18n';
import { Minus, Plus, Trash2 } from 'lucide-react';
import OptimizedImage from './OptimizedImage';
import { toast } from 'sonner';

interface CartSheetProps {
  open: boolean;
  onClose: () => void;
}

const CartSheet = memo(({ open, onClose }: CartSheetProps) => {
  const { lang } = useLang();
  const { items, updateQuantity, removeItem, clearCart, total } = useCart();

  const handleShowWaiter = () => {
    toast.success(
      lang === 'en'
        ? 'Order ready to show to waiter!'
        : lang === 'tr'
          ? 'Sipariş garsona gösterilmeye hazır!'
          : 'الطلب جاهز لعرضه على النادل!'
    );
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side='right' className='w-full sm:max-w-md flex flex-col'>
        <SheetHeader>
          <SheetTitle>{t('myList', lang)}</SheetTitle>
          <SheetDescription>
            {lang === 'en'
              ? 'Review and manage your order items'
              : lang === 'tr'
                ? 'Sipariş öğelerinizi gözden geçirin ve yönetin'
                : 'راجع وإدارة عناصر طلبك'}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className='flex-1 flex items-center justify-center text-muted-foreground'>
            <p className='text-start'>
              {lang === 'en'
                ? 'Your list is empty'
                : lang === 'tr'
                  ? 'Listeniz boş'
                  : 'قائمتك فارغة'}
            </p>
          </div>
        ) : (
          <>
            <div className='flex-1 overflow-y-auto space-y-4 py-4'>
              {items.map(item => (
                <div
                  key={item.id}
                  className='flex gap-3 p-3 bg-card rounded-xl border border-border'
                >
                  <div className='w-16 h-16 rounded-lg bg-muted/30 flex-shrink-0 overflow-hidden'>
                    {item.image ? (
                      <OptimizedImage
                        src={item.image}
                        alt={item.name}
                        className='w-full h-full object-cover'
                      />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center text-2xl'>
                        🍽️
                      </div>
                    )}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h4 className='font-medium truncate text-start'>
                      {item.name}
                    </h4>
                    {item.size && (
                      <p className='text-xs text-muted-foreground text-start'>
                        {translateSize(item.size, lang)}
                      </p>
                    )}
                    <p className='text-primary font-medium text-sm text-start'>
                      ₺{item.price.toFixed(2)}
                    </p>
                    <div className='flex items-center gap-2 mt-2'>
                      <button
                        onClick={() => {
                          const itemKey = item.size
                            ? `${item.id}-${item.size}`
                            : item.id;
                          updateQuantity(itemKey, item.quantity - 1);
                        }}
                        className='w-7 h-7 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors'
                        aria-label='Decrease quantity'
                      >
                        <Minus className='w-3 h-3' />
                      </button>
                      <span className='w-8 text-center font-medium'>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => {
                          const itemKey = item.size
                            ? `${item.id}-${item.size}`
                            : item.id;
                          updateQuantity(itemKey, item.quantity + 1);
                        }}
                        className='w-7 h-7 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors'
                        aria-label='Increase quantity'
                      >
                        <Plus className='w-3 h-3' />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const itemKey = item.size
                        ? `${item.id}-${item.size}`
                        : item.id;
                      removeItem(itemKey);
                    }}
                    className='self-start p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors'
                    aria-label={t('remove', lang)}
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                </div>
              ))}
            </div>

            <div className='border-t border-border pt-4 space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='font-medium'>{t('total', lang)}</span>
                <span className='text-lg font-medium text-primary'>
                  ₺{total.toFixed(2)}
                </span>
              </div>
              <Button
                onClick={handleShowWaiter}
                className='w-full bg-primary text-primary-foreground hover:brightness-110'
                size='lg'
              >
                {t('showWaiter', lang)}
              </Button>
              <Button onClick={clearCart} variant='outline' className='w-full'>
                {t('clear', lang)}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
});

export default CartSheet;
