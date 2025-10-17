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

interface SignUpProps {
  onNavigate: (page: string) => void;
}

export default function SignUp({ onNavigate }: SignUpProps) {
  const { lang } = useLang();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(
        lang === 'en'
          ? 'Please enter a valid email address'
          : lang === 'tr'
            ? 'Lütfen geçerli bir e-posta adresi girin'
            : 'يرجى إدخال عنوان بريد إلكتروني صحيح'
      );
      return;
    }

    // Validate name
    if (name.trim().length < 2) {
      toast.error(
        lang === 'en'
          ? 'Name must be at least 2 characters'
          : lang === 'tr'
            ? 'Ad en az 2 karakter olmalıdır'
            : 'يجب أن يكون الاسم حرفين على الأقل'
      );
      return;
    }

    if (password !== confirmPassword) {
      toast.error(
        lang === 'en'
          ? 'Passwords do not match'
          : lang === 'tr'
            ? 'Şifreler eşleşmiyor'
            : 'كلمات المرور غير متطابقة'
      );
      return;
    }

    if (password.length < 6) {
      toast.error(
        lang === 'en'
          ? 'Password must be at least 6 characters'
          : lang === 'tr'
            ? 'Şifre en az 6 karakter olmalıdır'
            : 'يجب أن تكون كلمة المرور 6 أحرف على الأقل'
      );
      return;
    }

    setLoading(true);

    try {
      console.log('Starting signup with:', { email, name });
      await authAPI.signUp({
        email,
        password,
        name,
      });

      console.log('Signup successful!');

      toast.success(
        lang === 'en'
          ? 'Account created successfully!'
          : lang === 'tr'
            ? 'Hesap başarıyla oluşturuldu!'
            : 'تم إنشاء الحساب بنجاح!'
      );

      // Small delay to ensure session is saved before navigation
      setTimeout(() => {
        onNavigate('home');
      }, 100);
    } catch (error: any) {
      console.error('Signup error:', error);
      console.error('Error details:', error.message, error);

      // Provide more helpful error messages
      let errorMessage = error.message || 'Signup failed. Please try again.';

      // Handle specific error cases
      if (
        errorMessage.includes('User with this email already exists') ||
        errorMessage.includes('already exists')
      ) {
        errorMessage =
          lang === 'en'
            ? 'An account with this email already exists. Please login instead.'
            : lang === 'tr'
              ? 'Bu e-posta ile zaten bir hesap var. Lütfen giriş yapın.'
              : 'يوجد حساب بهذا البريد الإلكتروني بالفعل. يرجى تسجيل الدخول بدلاً من ذلك.';
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
      } else if (
        errorMessage.includes('Email, password, and name are required')
      ) {
        errorMessage =
          lang === 'en'
            ? 'Please fill in all required fields.'
            : lang === 'tr'
              ? 'Lütfen tüm gerekli alanları doldurun.'
              : 'يرجى ملء جميع الحقول المطلوبة.';
      } else if (
        errorMessage.includes('Password must be at least 6 characters')
      ) {
        errorMessage =
          lang === 'en'
            ? 'Password must be at least 6 characters long.'
            : lang === 'tr'
              ? 'Şifre en az 6 karakter olmalıdır.'
              : 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.';
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
                ? 'Create Account'
                : lang === 'tr'
                  ? 'Hesap Oluştur'
                  : 'إنشاء حساب'}
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
              <Label htmlFor='name'>
                {lang === 'en' ? 'Name' : lang === 'tr' ? 'Ad' : 'الاسم'}
              </Label>
              <Input
                id='name'
                type='text'
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={
                  lang === 'en'
                    ? 'Your name'
                    : lang === 'tr'
                      ? 'Adınız'
                      : 'اسمك'
                }
                required
                className='rounded-xl'
              />
            </div>

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
                minLength={6}
                className='rounded-xl'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>
                {lang === 'en'
                  ? 'Confirm Password'
                  : lang === 'tr'
                    ? 'Şifreyi Onayla'
                    : 'تأكيد كلمة المرور'}
              </Label>
              <Input
                id='confirmPassword'
                type='password'
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder='••••••••'
                required
                minLength={6}
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
                    ? 'Creating account...'
                    : lang === 'tr'
                      ? 'Hesap oluşturuluyor...'
                      : 'جاري إنشاء الحساب...'}
                </span>
              ) : (
                <span>
                  {lang === 'en'
                    ? 'Sign Up'
                    : lang === 'tr'
                      ? 'Kaydol'
                      : 'التسجيل'}
                </span>
              )}
            </Button>
          </form>

          <div className='text-start space-y-2'>
            <p className='text-sm text-muted-foreground'>
              {lang === 'en'
                ? 'Already have an account?'
                : lang === 'tr'
                  ? 'Zaten hesabınız var mı?'
                  : 'هل لديك حساب بالفعل؟'}
            </p>
            <Button
              type='button'
              variant='link'
              onClick={() => onNavigate('login')}
              className='text-primary'
            >
              {t('signIn', lang)}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
