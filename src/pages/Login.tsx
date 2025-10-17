import { FormEvent, useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useLang } from '../lib/LangContext';
import { t } from '../lib/i18n';
import { authAPI } from '../lib/supabase';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

interface LoginProps {
  onNavigate: (page: string) => void;
}

export default function Login({ onNavigate }: LoginProps) {
  const { lang } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await authAPI.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success(
        lang === 'en'
          ? 'Login successful!'
          : lang === 'tr'
            ? 'Giriş başarılı!'
            : 'تسجيل الدخول ناجح!',
      );
      onNavigate('home');
    } catch (error: any) {
      console.error('Login error:', error);

      // Provide more helpful error messages
      let errorMessage = error.message || 'Login failed';

      if (errorMessage.includes('Invalid credentials')) {
        errorMessage =
          lang === 'en'
            ? 'Invalid email or password. Please check your credentials or sign up.'
            : lang === 'tr'
              ? 'Geçersiz e-posta veya şifre. Lütfen bilgilerinizi kontrol edin veya kaydolun.'
              : 'بريد إلكتروني أو كلمة مرور غير صالحة. يرجى التحقق من بيانات الاعتماد أو التسجيل.';
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
              {lang === 'en'
                ? 'Sign In'
                : lang === 'tr'
                  ? 'Giriş Yap'
                  : 'تسجيل الدخول'}
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
                placeholder='you@example.com'
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

          <div className='border-t border-border pt-4 space-y-3'>
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
                className='text-primary p-0 h-auto'
              >
                {lang === 'en'
                  ? 'Sign Up'
                  : lang === 'tr'
                    ? 'Kaydol'
                    : 'التسجيل'}
              </Button>
            </div>

            <div className='text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg'>
              💡{' '}
              {lang === 'en'
                ? 'Note: This is for customer accounts. Admin login is accessed by triple-tapping the logo.'
                : lang === 'tr'
                  ? 'Not: Bu müşteri hesapları içindir. Admin girişi logoya üç kez dokunarak erişilir.'
                  : 'ملاحظة: هذا لحسابات العملاء. يتم الوصول إلى تسجيل دخول المسؤول من خلال النقر ثلاث مرات على الشعار.'}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
