import { createContext, ReactNode, useContext, useState } from 'react';
import type { CartItem } from './types';

interface CartContextType {
  items: CartItem[];
  addItem: (_item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (_id: string) => void;
  updateQuantity: (_id: string, _quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      // Create a unique key combining id and size
      const itemKey = item.size ? `${item.id}-${item.size}` : item.id;
      const existing = prev.find(i => {
        const existingKey = i.size ? `${i.id}-${i.size}` : i.id;
        return existingKey === itemKey;
      });

      if (existing) {
        return prev.map(i => {
          const existingKey = i.size ? `${i.id}-${i.size}` : i.id;
          return existingKey === itemKey
            ? { ...i, quantity: i.quantity + 1 }
            : i;
        });
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (id: string) => {
    setItems(prev =>
      prev.filter(i => {
        const itemKey = i.size ? `${i.id}-${i.size}` : i.id;
        return itemKey !== id;
      }),
    );
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(prev =>
      prev.map(i => {
        const itemKey = i.size ? `${i.id}-${i.size}` : i.id;
        return itemKey === id ? { ...i, quantity } : i;
      }),
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const total =
    Math.round(
      items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100,
    ) / 100;

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
