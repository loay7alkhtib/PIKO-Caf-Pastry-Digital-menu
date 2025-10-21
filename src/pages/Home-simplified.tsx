import { motion } from 'framer-motion';
import { useLang } from '../lib/LangContext';
import { useData } from '../lib/DataContext';
import { t } from '../lib/i18n';

interface HomeProps {
  onNavigate: (page: string, categoryId?: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const { lang } = useLang();
  const { categories, loading } = useData();

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center space-y-4'>
          <div className='text-5xl animate-spin'>🥐</div>
          <p className='text-muted-foreground'>Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen'>
      {/* Header */}
      <header className='w-full bg-card/50 backdrop-blur-sm border-b border-border sticky top-0 z-40'>
        <div className='max-w-[1400px] mx-auto px-4 py-4 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold'>
              P
            </div>
            <h1 className='text-xl font-medium'>{t('brandName', lang)}</h1>
          </div>

          <div className='flex items-center gap-2'>
            <button
              onClick={() => onNavigate('admin')}
              className='p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors'
              title='Admin Access'
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className='w-full bg-gradient-to-br from-[#FFEEBC] via-[#E6F3F8] to-[hsl(190,82%,25%)]/20'>
        <div className='max-w-[1400px] mx-auto py-12 px-4'>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className='flex flex-col items-center justify-center text-center'
          >
            <div className='w-32 h-32 bg-primary rounded-full flex items-center justify-center text-6xl mb-6 drop-shadow-lg'>
              🥐
            </div>
            <h2 className='text-3xl font-medium px-4'>{t('tagline', lang)}</h2>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className='max-w-[1400px] mx-auto px-4 py-8'>
        <div className='mb-8'>
          <h3 className='text-2xl font-medium mb-2'>
            {t('specialties', lang)}
          </h3>
          <p className='text-muted-foreground'>{t('discover', lang)}</p>
        </div>

        <div className='grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
              onClick={() => onNavigate('category', category.id)}
              className='bg-card rounded-xl p-4 border border-border hover:shadow-lg transition-all cursor-pointer group'
            >
              <div className='text-4xl mb-3 text-center'>{category.icon}</div>
              <h4 className='font-medium text-center text-sm group-hover:text-primary transition-colors'>
                {category.names[lang] || category.names.en}
              </h4>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
