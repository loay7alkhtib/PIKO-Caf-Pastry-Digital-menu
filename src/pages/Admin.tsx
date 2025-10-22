import { lazy, memo, Suspense, useCallback, useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { useLang } from '../lib/LangContext';
import { useData } from '../lib/DataContext';
import { t } from '../lib/i18n';
import { authAPI, STATIC_MODE_ENABLED } from '../lib/supabase';
import { clearSession } from '../lib/sessionManager';
import { toast } from 'sonner';
import { LogOut, RefreshCw } from 'lucide-react';
import StorageStatus from '../components/StorageStatus';

// Lazy load admin components
const AdminCategories = lazy(
  () => import('../components/admin/AdminCategories'),
);
const AdminItems = lazy(() => import('../components/admin/AdminItemsSimple'));
// const SessionDebugger = lazy(() =>
//   import('../components/admin/SessionDebugger').then(m => ({
//     default: m.SessionDebugger,
//   }))
// );

interface AdminProps {
  onNavigate: (_page: string) => void;
}

const Admin = memo(({ onNavigate }: AdminProps) => {
  const { lang } = useLang();
  const { categories, items, refetch } = useData(); // Use cached data!
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    // Try to restore tab state from localStorage
    const savedTab = localStorage.getItem('admin-active-tab');
    return savedTab || 'categories';
  });

  // Debug tab changes and persist tab state
  useEffect(() => {
    localStorage.setItem('admin-active-tab', activeTab);
  }, [activeTab]);

  const checkAuth = useCallback(async () => {
    // Skip auth check if user is logging out
    if (isLoggingOut) {
      console.warn('🚪 Skipping auth check - user is logging out');
      return;
    }

    if (STATIC_MODE_ENABLED) {
      console.warn('ℹ️ Admin authentication bypassed in static mode.');
      setAuthorized(true); // Always authorize in static mode for admin view
      setLoading(false);
      return;
    }

    try {
      const {
        data: { session },
        error,
      } = await authAPI.getSession();

      if (error) {
        console.error('❌ Session check error:', error);
        toast.error('Authentication error. Please login again.');
        setAuthorized(false);
        onNavigate('admin-login');
        return;
      }

      if (!session) {
        if (authorized) {
          // Only show toast if user was previously authorized
          toast.error('Session expired. Please login again.');
        }
        setAuthorized(false);
        onNavigate('admin-login');
        return;
      }

      // Check if user is admin
      if (!session.user?.isAdmin) {
        toast.error(
          'Admin access required. Please login with admin credentials.',
        );
        setAuthorized(false);
        onNavigate('admin-login');
        return;
      }

      if (!authorized) {
        setAuthorized(true);
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
      toast.error('Authentication error. Please login again.');
      setAuthorized(false);
      onNavigate('admin-login');
    } finally {
      setLoading(false);
    }
  }, [authorized, onNavigate, isLoggingOut]);

  useEffect(() => {
    checkAuth();

    // Re-check auth periodically to handle session expiry (less frequent)
    const authCheckInterval = setInterval(() => {
      checkAuth();
    }, 300000); // Check every 5 minutes instead of every minute

    return () => clearInterval(authCheckInterval);
  }, [checkAuth]);

  const handleRefresh = async () => {
    if (STATIC_MODE_ENABLED) {
      toast.info(
        lang === 'en'
          ? 'Cannot refresh data in static mode.'
          : lang === 'tr'
            ? 'Statik modda veri yenilenemez.'
            : 'لا يمكن تحديث البيانات في الوضع الثابت.',
      );
      return;
    }

    try {
      await refetch(true); // Force refetch categories and items
      toast.success(
        lang === 'en'
          ? 'Data refreshed successfully!'
          : lang === 'tr'
            ? 'Veriler başarıyla yenilendi!'
            : 'تم تحديث البيانات بنجاح!',
      );
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error(
        lang === 'en'
          ? 'Failed to refresh data'
          : lang === 'tr'
            ? 'Veriler yenilenemedi'
            : 'فشل في تحديث البيانات',
      );
    }
  };

  const handleLogout = async () => {
    try {
      console.warn('🚪 Starting logout process...');
      setIsLoggingOut(true);

      // Clear session regardless of mode
      if (STATIC_MODE_ENABLED) {
        console.warn('📱 Static mode: clearing local session');
        clearSession();
      } else {
        console.warn('🌐 Dynamic mode: calling authAPI.signOut');
        await authAPI.signOut();
      }

      console.warn('✅ Logout process completed');

      // Show success message
      toast.success(
        lang === 'en'
          ? 'Logged out successfully'
          : lang === 'tr'
            ? 'Başarıyla çıkış yapıldı'
            : 'تم تسجيل الخروج بنجاح',
      );

      // Reset authorization state
      setAuthorized(false);

      // Clear saved page to prevent auto-navigation back to admin
      localStorage.removeItem('piko_last_page');

      console.warn('🏠 Navigating to home...');
      onNavigate('home');
    } catch (error) {
      console.error('❌ Logout error:', error);
      toast.error(
        lang === 'en'
          ? 'Logout failed. Please try again.'
          : lang === 'tr'
            ? 'Çıkış başarısız. Lütfen tekrar deneyin.'
            : 'فشل في تسجيل الخروج. يرجى المحاولة مرة أخرى.',
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center space-y-4'>
          <div className='text-5xl animate-spin'>🥐</div>
          <p className='text-muted-foreground text-sm'>Loading admin...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className='min-h-screen bg-background'>
      <header className='border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40'>
        <div className='max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-2'>
          <h1 className='text-lg sm:text-xl md:text-2xl font-medium truncate'>
            {t('adminPanel', lang)}
          </h1>
          <div className='flex items-center gap-2'>
            <Button
              onClick={handleRefresh}
              variant='ghost'
              size='sm'
              className='gap-2'
              title={
                lang === 'en'
                  ? 'Refresh Data'
                  : lang === 'tr'
                    ? 'Verileri Yenile'
                    : 'تحديث البيانات'
              }
            >
              <RefreshCw className='w-4 h-4' />
              <span className='hidden md:inline'>
                {lang === 'en' ? 'Refresh' : lang === 'tr' ? 'Yenile' : 'تحديث'}
              </span>
            </Button>
            <Button
              onClick={handleLogout}
              variant='outline'
              className='gap-2 flex-shrink-0'
              size='sm'
              type='button'
            >
              <LogOut className='w-4 h-4' />
              <span className='hidden sm:inline'>{t('logout', lang)}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className='max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8'>
        {!STATIC_MODE_ENABLED && <StorageStatus />}
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full max-w-2xl mx-auto grid-cols-2 mb-6 sm:mb-8'>
            <TabsTrigger
              value='categories'
              className='text-xs sm:text-sm gap-1'
            >
              <span>{t('categories', lang)}</span>
            </TabsTrigger>
            <TabsTrigger value='items' className='text-xs sm:text-sm gap-1'>
              <span>{t('items', lang)}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value='categories'>
            <Suspense
              fallback={
                <div className='text-center py-8'>Loading categories...</div>
              }
            >
              <AdminCategories
                categories={categories}
                onRefresh={handleRefresh}
                staticMode={STATIC_MODE_ENABLED}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value='items'>
            <Suspense
              fallback={
                <div className='text-center py-8'>Loading items...</div>
              }
            >
              <AdminItems
                items={items}
                categories={categories}
                onRefresh={handleRefresh}
                staticMode={STATIC_MODE_ENABLED}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
});

export default Admin;
