import { lazy, memo, Suspense, useEffect, useState } from 'react';
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
import { authAPI } from '../lib/supabase';
import { toast } from 'sonner';
import { LogOut, RefreshCw, Settings, Upload } from 'lucide-react';

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
  onNavigate: (page: string) => void;
}

const Admin = memo(({ onNavigate }: AdminProps) => {
  const { lang } = useLang();
  const { categories, items, refetch } = useData(); // Use cached data!
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);

  useEffect(() => {
    checkAuth();

    // Re-check auth periodically to handle session expiry
    const authCheckInterval = setInterval(() => {
      checkAuth();
    }, 60000); // Check every minute

    return () => clearInterval(authCheckInterval);
  }, []);

  async function checkAuth() {
    try {
      console.log('🔍 Checking admin session...');
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
        console.log('❌ No session found, redirecting to login');
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
        console.log('❌ User is not admin, redirecting to login');
        console.log('📊 Session user data:', session.user);
        toast.error(
          'Admin access required. Please login with admin credentials.',
        );
        setAuthorized(false);
        onNavigate('admin-login');
        return;
      }

      console.log('✅ Admin session valid:', session.user?.email);
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
  }

  const handleRefresh = async () => {
    try {
      await refetch(); // Refetch categories and items
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
    await authAPI.signOut();
    toast.success(t('logout', lang));
    onNavigate('home');
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
              onClick={() => onNavigate('batch-upload')}
              variant='outline'
              size='sm'
              className='gap-2'
            >
              <Upload className='w-4 h-4' />
              <span className='hidden md:inline'>Batch Upload</span>
            </Button>
            <Button
              onClick={() => setShowAdvancedTools(!showAdvancedTools)}
              variant='ghost'
              size='sm'
              className='gap-2'
            >
              <Settings className='w-4 h-4' />
              <span className='hidden md:inline'>
                {lang === 'en' ? 'Tools' : lang === 'tr' ? 'Araçlar' : 'أدوات'}
              </span>
            </Button>
            <Button
              onClick={handleLogout}
              variant='outline'
              className='gap-2 flex-shrink-0'
              size='sm'
            >
              <LogOut className='w-4 h-4' />
              <span className='hidden sm:inline'>{t('logout', lang)}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className='max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8'>
        {/* Advanced Tools - Collapsible */}
        {showAdvancedTools && (
          <div className='mb-6 max-w-4xl mx-auto'>
            <Suspense
              fallback={<div className='text-center py-4'>Loading...</div>}
            ></Suspense>
          </div>
        )}

        <Tabs defaultValue='categories' className='w-full'>
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
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
});

export default Admin;
