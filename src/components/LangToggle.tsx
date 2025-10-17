import { useLang } from '../lib/LangContext';
import type { Lang } from '../lib/i18n';

export default function LangToggle() {
  const { lang, setLang } = useLang();

  const handleToggle = () => {
    const order: Lang[] = ['en', 'tr', 'ar'];
    const currentIndex = order.indexOf(lang);
    const nextLang = order[(currentIndex + 1) % order.length];
    if (nextLang) {
      setLang(nextLang);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className='inline-flex items-center justify-center px-3 py-2 sm:px-4 rounded-xl bg-secondary text-secondary-foreground hover:brightness-105 transition-all duration-300 transition-gentle active:scale-95 focus:ring-2 focus:ring-ring text-sm sm:text-base'
      aria-label='Toggle language'
    >
      <span className='font-medium'>{lang.toUpperCase()}</span>
    </button>
  );
}
