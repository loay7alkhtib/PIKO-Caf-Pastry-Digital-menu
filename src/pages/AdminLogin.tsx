import { FormEvent, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useLang } from '../lib/LangContext';
import { t } from '../lib/i18n';
import { authAPI } from '../lib/supabase';
import { saveSession } from '../lib/sessionManager';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

interface AdminLoginProps {
  onNavigate: (page: string) => void;
}

export default function AdminLogin({ onNavigate }: AdminLoginProps) {
  const { lang } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Ensure admin credentials exist when component mounts
  useEffect(() => {
    ensureAdminExists();
  }, []);

  async function ensureAdminExists() {
    try {
      // Pre-fill the form with default admin credentials
      setEmail('admin@piko.com');
      setPassword('admin123');
      console.warn('✅ Default admin credentials loaded');
      console.warn('Email: admin@piko.com');
      console.warn('Password: admin123');
    } catch (error) {
      console.error('Error ensuring admin credentials:', error);
    } finally {
      setInitializing(false);
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.warn('🔐 Admin login attempt for:', email);

      // Check for default admin credentials and bypass authentication
      if (email === 'admin@piko.com' && password === 'admin123') {
        console.warn(
          '✅ Default admin credentials detected - bypassing authentication',
        );

        // Create a mock session for development
        const mockSession = {
          access_token: 'dev-admin-token',
          user: {
            email: 'admin@piko.com',
            name: 'Admin User',
            id: 'dev-admin-id',
            isAdmin: true,
          },
        };

        // Store session using session manager for consistency
        saveSession(mockSession);

        toast.success(
          lang === 'en'
            ? 'Admin login successful! (Development Mode)'
            : lang === 'tr'
              ? 'Admin girişi başarılı! (Geliştirme Modu)'
              : 'تسجيل دخول المسؤول ناجح! (وضع التطوير)',
        );

        // Navigate to admin panel
        onNavigate('admin');
        return;
      }

      // Use the same authAPI but with admin-specific handling
      const { error } = await authAPI.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.warn('✅ Admin login successful, navigating to admin panel');
      toast.success(
        lang === 'en'
          ? 'Admin login successful!'
          : lang === 'tr'
            ? 'Admin girişi başarılı!'
            : 'تسجيل دخول المسؤول ناجح!',
      );

      // Navigate to admin panel
      onNavigate('admin');
    } catch (error: unknown) {
      console.error('❌ Admin login error:', error);

      // Provide more helpful error messages for admin login
      let errorMessage = (error as Error).message || 'Admin login failed';

      if (
        errorMessage.includes('Invalid credentials') ||
        errorMessage.includes('Invalid email or password')
      ) {
        errorMessage =
          lang === 'en'
            ? 'Invalid admin credentials. Please check your email and password.'
            : lang === 'tr'
              ? 'Geçersiz admin bilgileri. Lütfen e-posta ve şifrenizi kontrol edin.'
              : 'بيانات اعتماد المسؤول غير صالحة. يرجى التحقق من البريد الإلكتروني وكلمة المرور.';
      } else if (
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('NetworkError')
      ) {
        errorMessage =
          lang === 'en'
            ? 'Network error. Please check your connection and try again.'
            : lang === 'tr'
              ? 'Ağ hatası. Lütfen bağlantınızı kontrol edin ve tekrar deneyin.'
              : 'خطأ في الشبكة. يرجى التحقق من الاتصال والمحاولة مرة أخرى.';
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className='min-h-screen bg-card flex items-center justify-center p-3 sm:p-4'>
        <div className='text-center space-y-4'>
          <div className='text-5xl'>🔐</div>
          <p className='text-muted-foreground'>Preparing admin login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-card flex items-center justify-center p-3 sm:p-4'>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className='w-full max-w-md'
      >
        <div className='bg-background rounded-2xl shadow-soft p-5 sm:p-6 md:p-8 space-y-5 sm:space-y-6'>
          <div className='flex items-center justify-between'>
            <h1 className='text-xl sm:text-2xl font-medium'>
              {t('adminLogin', lang)}
            </h1>
            <button
              onClick={() => onNavigate('home')}
              className='p-2 hover:bg-muted rounded-lg transition-colors'
              aria-label='Back'
            >
              <ArrowLeft className='w-4 h-4 sm:w-5 sm:h-5' />
            </button>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>{t('email', lang)}</Label>
              <Input
                id='email'
                type='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('email', lang)}
                required
                className='rounded-xl'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password'>{t('password', lang)}</Label>
              <Input
                id='password'
                type='password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder='••••••••'
                required
                className='rounded-xl'
              />
            </div>

            <Button
              type='submit'
              disabled={loading}
              className='w-full bg-primary text-primary-foreground hover:brightness-110 rounded-xl'
              size='lg'
            >
              {loading ? (
                <span>
                  {lang === 'en'
                    ? 'Signing in...'
                    : lang === 'tr'
                      ? 'Giriş yapılıyor...'
                      : 'جاري تسجيل الدخول...'}
                </span>
              ) : (
                t('signIn', lang)
              )}
            </Button>
          </form>

          <div className='border-t border-border pt-5 sm:pt-6 space-y-3'>
            <div className='text-start space-y-2'>
              <p className='text-sm text-muted-foreground'>
                {lang === 'en'
                  ? "Don't have an account?"
                  : lang === 'tr'
                    ? 'Hesabınız yok mu?'
                    : 'ليس لديك حساب؟'}
              </p>
              <Button
                type='button'
                variant='link'
                onClick={() => onNavigate('signup')}
                className='text-primary'
              >
                {lang === 'en'
                  ? 'Sign Up'
                  : lang === 'tr'
                    ? 'Kaydol'
                    : 'التسجيل'}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
