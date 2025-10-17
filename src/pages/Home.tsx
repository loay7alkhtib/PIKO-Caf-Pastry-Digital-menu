import { memo, useCallback } from 'react';
import { motion } from 'motion/react';
import NavBar from '../components/NavBar';
import CategoryCard from '../components/CategoryCard';
import PikoLogoBadge from '../components/PikoLogoBadge';
import PikoLoader from '../components/PikoLoader';
import { useLang } from '../lib/LangContext';
import { useData } from '../lib/DataContext';
import { t, dirFor } from '../lib/i18n';

interface HomeProps {
  onNavigate: (page: string, categoryId?: string) => void;
}

const Home = memo(function Home({ onNavigate }: HomeProps) {
  const { lang } = useLang();
  const { categories, loading, prefetchCategory } = useData(); // Use cached data!

  const handleCategoryClick = useCallback((categoryId: string) => {
    onNavigate('category', categoryId);
  }, [onNavigate]);
  
  const handleCategoryHover = useCallback((categoryId: string) => {
    prefetchCategory(categoryId);
  }, [prefetchCategory]);

  const handleLogoTripleTap = () => {
    onNavigate('admin-login');
  };

  // Show full PikoLoader on initial load
  if (loading && categories.length === 0) {
    return <PikoLoader />;
  }

  return (
    <div className="min-h-screen" dir={dirFor(lang)}>
      <NavBar onLogoTripleTap={handleLogoTripleTap} onNavigate={onNavigate} showAccountIcon={false} />

      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-[#FFEEBC] via-[#E6F3F8] to-[hsl(190,82%,25%)]/20">
        <div className="max-w-[1400px] mx-auto py-10 sm:py-12 md:py-16 lg:py-20 px-3 sm:px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center justify-center text-center"
          >
            <PikoLogoBadge 
              className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 mb-6 sm:mb-8 drop-shadow-lg" 
              onTripleTap={handleLogoTripleTap}
            />
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium px-4">
              {t('tagline', lang)}
            </h2>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10 lg:py-12">
        <div className="mb-6 sm:mb-8 text-start">
          <h3 className="text-lg sm:text-xl md:text-2xl font-medium mb-1">
            {t('specialties', lang)}
          </h3>
          <p className="text-muted-foreground text-sm sm:text-base">
            {t('discover', lang)}
          </p>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
            >
              <CategoryCard
                name={category.names[lang] || category.names.en}
                icon={category.icon}
                image={category.image}
                onClick={() => handleCategoryClick(category.id)}
                onHover={() => handleCategoryHover(category.id)}
              />
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
});

export default Home;
