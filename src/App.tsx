import { lazy, Suspense, useState } from 'react';
import { LangProvider } from './lib/LangContext';
import { CartProvider } from './lib/CartContext';
import { DataProvider } from './lib/DataContext';
import { Toaster } from './components/ui/sonner';
import Home from './pages/Home';
import PikoLoader from './components/PikoLoader';
import LanguageWrapper from './components/LanguageWrapper';

// Lazy load pages that aren't immediately needed
const CategoryMenu = lazy(() => import('./pages/CategoryMenu'));
const Login = lazy(() => import('./pages/Login'));
const SignUp = lazy(() => import('./pages/SignUp'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const Admin = lazy(() => import('./pages/Admin'));

import type { Page } from './lib/types';

export default function App() {
  const [page, setPage] = useState<Page>(() => {
    try {
      // Always start with home page to prevent auto-navigation to admin
      // Clear any saved admin page to force proper authentication flow
      const saved = localStorage.getItem('piko_last_page');
      if (saved === 'admin') {
        localStorage.removeItem('piko_last_page');
        return 'home';
      }
      return (saved as Page) || 'home';
    } catch {
      return 'home';
    }
  });
  const [categoryId, setCategoryId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('piko_last_category');
    } catch {
      return null;
    }
  });

  const navigate = (newPage: Page, newCategoryId?: string) => {
    setPage(newPage);
    localStorage.setItem('piko_last_page', newPage);
    if (newCategoryId) {
      setCategoryId(newCategoryId);
      localStorage.setItem('piko_last_category', newCategoryId);
    }
  };

  return (
    <LangProvider>
      <DataProvider>
        <CartProvider>
          <LanguageWrapper>
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
            <Toaster position='bottom-center' />
          </LanguageWrapper>
        </CartProvider>
      </DataProvider>
    </LangProvider>
  );
}
