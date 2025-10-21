import { useState } from 'react';
import { LangProvider } from './lib/LangContext';
import { CartProvider } from './lib/CartContext';
import { DataProvider } from './lib/DataContext';
import { Toaster } from './components/ui/sonner';
import Home from './pages/Home';
import CategoryMenu from './pages/CategoryMenu';
import Admin from './pages/Admin';

export type Page = 'home' | 'category' | 'admin';

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const navigate = (newPage: Page, newCategoryId?: string) => {
    setPage(newPage);
    if (newCategoryId) {
      setCategoryId(newCategoryId);
    }
  };

  return (
    <LangProvider>
      <DataProvider>
        <CartProvider>
          {page === 'home' && (
            <Home onNavigate={(p, catId) => navigate(p as Page, catId)} />
          )}
          {page === 'category' && categoryId && (
            <CategoryMenu
              categoryId={categoryId}
              onNavigate={(p, catId) => navigate(p as Page, catId)}
            />
          )}
          {page === 'admin' && <Admin onNavigate={p => navigate(p as Page)} />}
          <Toaster position='bottom-center' />
        </CartProvider>
      </DataProvider>
    </LangProvider>
  );
}
