import { lazy, Suspense, useEffect, useState } from 'react';
import { LangProvider } from './lib/LangContext';
import { CartProvider } from './lib/CartContext';
import { DataProvider } from './lib/DataContext';
import { Toaster } from './components/ui/sonner';
import Home from './pages/Home';
import PikoLoader from './components/PikoLoader';
import { projectId, publicAnonKey } from './lib/config/supabase';

// Lazy load pages that aren't immediately needed
const CategoryMenu = lazy(() => import('./pages/CategoryMenu'));
const Login = lazy(() => import('./pages/Login'));
const SignUp = lazy(() => import('./pages/SignUp'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const Admin = lazy(() => import('./pages/Admin'));

import type { Page } from './lib/types';

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [categoryId, setCategoryId] = useState<string | null>(null);

  // Initialize database in background (non-blocking) - only if needed
  useEffect(() => {
    // Only initialize if we detect the database is empty
    // This will be handled by the DataContext instead
    console.log('App mounted, data loading will be handled by DataContext');
  }, []);

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
          <div className='min-h-screen bg-background text-foreground'>
            <Suspense fallback={<PikoLoader />}>
              {page === 'home' && (
                <Home onNavigate={(p, catId) => navigate(p as Page, catId)} />
              )}
              {page === 'category' && categoryId && (
                <CategoryMenu
                  categoryId={categoryId}
                  onNavigate={(p, catId) => navigate(p as Page, catId)}
                />
              )}
              {page === 'login' && (
                <Login onNavigate={p => navigate(p as Page)} />
              )}
              {page === 'signup' && (
                <SignUp onNavigate={p => navigate(p as Page)} />
              )}
              {page === 'admin-login' && (
                <AdminLogin onNavigate={p => navigate(p as Page)} />
              )}
              {page === 'admin' && (
                <Admin onNavigate={p => navigate(p as Page)} />
              )}
            </Suspense>
          </div>
          <Toaster position='bottom-center' />
        </CartProvider>
      </DataProvider>
    </LangProvider>
  );
}
