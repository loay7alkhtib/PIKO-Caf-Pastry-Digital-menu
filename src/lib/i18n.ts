import type { Lang } from './types';

export type { Lang };

export const translations = {
  // Brand
  brandName: {
    en: 'Piko Patisserie & Café',
    tr: 'Piko Pastane ve Kafe',
    ar: 'بيكو للحلويات والكافيه',
  },
  tagline: {
    en: 'Artisan Patisserie & Café',
    tr: 'Sanatsal Pastane ve Kafe',
    ar: 'حلويات ومشروبات يدوية الصنع',
  },
  since: {
    en: 'Since 2000 • Premium Experience',
    tr: "2000'den Beri • Premium Deneyim",
    ar: 'منذ عام ٢٠٠٠ • تجربة فاخرة',
  },

  // Navigation
  specialties: {
    en: 'Our Specialties',
    tr: 'Özel Lezzetlerimiz',
    ar: 'تخصصاتنا المميزة',
  },
  discover: {
    en: 'Discover Delights',
    tr: 'Lezzetleri Keşfet',
    ar: 'اكتشف أطيب المذاقات',
  },
  lucky: {
    en: '🍀 Lucky',
    tr: '🍀 Şanslı',
    ar: '🍀 محظوظ',
  },
  backToMenu: {
    en: 'Back to Menu',
    tr: 'Menüye Dön',
    ar: 'العودة إلى القائمة',
  },

  // Actions
  add: {
    en: 'Add to List',
    tr: 'Listeye Ekle',
    ar: 'أضف إلى القائمة',
  },
  myList: {
    en: 'My List',
    tr: 'Listem',
    ar: 'قائمتي',
  },
  showWaiter: {
    en: 'Show to Waiter',
    tr: 'Garsona Göster',
    ar: 'أرِه للنادل',
  },
  remove: {
    en: 'Remove',
    tr: 'Kaldır',
    ar: 'إزالة',
  },
  clear: {
    en: 'Clear All',
    tr: 'Hepsini Temizle',
    ar: 'مسح الكل',
  },
  total: {
    en: 'Total',
    tr: 'Toplam',
    ar: 'المجموع',
  },

  // Admin
  adminLogin: {
    en: 'Admin Login',
    tr: 'Yönetici Girişi',
    ar: 'تسجيل دخول المدير',
  },
  email: {
    en: 'Email',
    tr: 'E-posta',
    ar: 'البريد الإلكتروني',
  },
  password: {
    en: 'Password',
    tr: 'Şifre',
    ar: 'كلمة المرور',
  },
  signIn: {
    en: 'Sign In',
    tr: 'Giriş Yap',
    ar: 'تسجيل الدخول',
  },
  logout: {
    en: 'Logout',
    tr: 'Çıkış',
    ar: 'تسجيل الخروج',
  },
  adminPanel: {
    en: 'Admin Panel',
    tr: 'Yönetici Paneli',
    ar: 'لوحة الإدارة',
  },
  categories: {
    en: 'Categories',
    tr: 'Kategoriler',
    ar: 'الفئات',
  },
  items: {
    en: 'Items',
    tr: 'Ürünler',
    ar: 'العناصر',
  },
  addNew: {
    en: 'Add New',
    tr: 'Yeni Ekle',
    ar: 'إضافة جديد',
  },
  save: {
    en: 'Save',
    tr: 'Kaydet',
    ar: 'حفظ',
  },
  cancel: {
    en: 'Cancel',
    tr: 'İptal',
    ar: 'إلغاء',
  },
  delete: {
    en: 'Delete',
    tr: 'Sil',
    ar: 'حذف',
  },
  edit: {
    en: 'Edit',
    tr: 'Düzenle',
    ar: 'تحرير',
  },

  // Category names
  breakfast: { en: 'Breakfast', tr: 'Kahvaltı', ar: 'فطور' },
  hot: { en: 'Hot Drinks', tr: 'Sıcak İçecekler', ar: 'مشروبات ساخنة' },
  cold: { en: 'Cold Drinks', tr: 'Soğuk İçecekler', ar: 'مشروبات باردة' },
  desserts: { en: 'Desserts', tr: 'Tatlılar', ar: 'حلويات' },
  salads: { en: 'Salads', tr: 'Salatalar', ar: 'سلطات' },
  mains: { en: 'Main Courses', tr: 'Ana Yemekler', ar: 'أطباق رئيسية' },
  'pizza-pasta': {
    en: 'Pizza & Pasta',
    tr: 'Pizza ve Makarna',
    ar: 'بيتزا ومعكرونة',
  },
  sandwiches: { en: 'Sandwiches', tr: 'Sandviçler', ar: 'ساندويتشات' },
  icecream: { en: 'Ice Cream', tr: 'Dondurma', ar: 'آيس كريم' },

  // Size variants
  small: { en: 'Small', tr: 'Küçük', ar: 'صغير' },
  medium: { en: 'Medium', tr: 'Orta', ar: 'وسط' },
  large: { en: 'Large', tr: 'Büyük', ar: 'كبير' },
  single: { en: 'Single', tr: 'Tek', ar: 'فردي' },
  double: { en: 'Double', tr: 'İkili', ar: 'مزدوج' },
  regular: { en: 'Regular', tr: 'Normal', ar: 'عادي' },
  selectSize: { en: 'Select Size', tr: 'Boyut Seçin', ar: 'اختر الحجم' },

  // Loading screen
  preparingMenu: {
    en: 'Preparing your delightful menu...',
    tr: 'Enfes menünüz hazırlanıyor...',
    ar: 'جاري تحضير قائمتك الشهية...',
  },
  loadingMenu: {
    en: 'Loading menu...',
    tr: 'Menü yükleniyor...',
    ar: 'تحميل القائمة...',
  },
  fetchingCategories: {
    en: 'Fetching categories...',
    tr: 'Kategoriler getiriliyor...',
    ar: 'جلب الفئات...',
  },
  loadingItems: {
    en: 'Loading items...',
    tr: 'Ürünler yükleniyor...',
    ar: 'تحميل العناصر...',
  },
  almostReady: {
    en: 'Almost ready!',
    tr: 'Neredeyse hazır!',
    ar: 'جاهز تقريباً!',
  },

  // Admin Panel - Common
  dragToReorder: {
    en: 'Drag to Reorder',
    tr: 'Sıralamak için Sürükle',
    ar: 'اسحب لإعادة الترتيب',
  },
  dragInstruction: {
    en: 'Drag items or categories to change their display order in the menu.',
    tr: 'Menüdeki görüntüleme sırasını değiştirmek için öğeleri veya kategorileri sürükleyin.',
    ar: 'اسحب العناصر أو الفئات لتغيير ترتيب عرضها في القائمة.',
  },

  // Admin Panel - Form Labels
  categoryImage: {
    en: 'Category Image',
    tr: 'Kategori Görseli',
    ar: 'صورة الفئة',
  },
  itemImage: {
    en: 'Item Image',
    tr: 'Ürün Görseli',
    ar: 'صورة العنصر',
  },
  fallbackIcon: {
    en: 'Fallback Icon (Emoji)',
    tr: 'Yedek Simge (Emoji)',
    ar: 'أيقونة احتياطية (إيموجي)',
  },
  nameEnglish: {
    en: 'Name (English)',
    tr: 'İsim (İngilizce)',
    ar: 'الاسم (إنجليزي)',
  },
  nameTurkish: {
    en: 'Name (Turkish)',
    tr: 'İsim (Türkçe)',
    ar: 'الاسم (تركي)',
  },
  nameArabic: {
    en: 'Name (Arabic)',
    tr: 'İsim (Arapça)',
    ar: 'الاسم (عربي)',
  },
  category: {
    en: 'Category',
    tr: 'Kategori',
    ar: 'الفئة',
  },
  price: {
    en: 'Price',
    tr: 'Fiyat',
    ar: 'السعر',
  },
  priceWithCurrency: {
    en: 'Price (₺)',
    tr: 'Fiyat (₺)',
    ar: 'السعر (₺)',
  },
  tags: {
    en: 'Tags (comma-separated)',
    tr: 'Etiketler (virgülle ayrılmış)',
    ar: 'الوسوم (مفصولة بفاصلة)',
  },
  order: {
    en: 'Order',
    tr: 'Sıra',
    ar: 'الترتيب',
  },
  sizeVariants: {
    en: 'Size Variants (Optional)',
    tr: 'Boyut Varyantları (Opsiyonel)',
    ar: 'أحجام متنوعة (اختياري)',
  },
  sizeName: {
    en: 'Size Name',
    tr: 'Boyut Adı',
    ar: 'اسم الحجم',
  },
  addVariant: {
    en: 'Add Variant',
    tr: 'Varyant Ekle',
    ar: 'إضافة متغير',
  },

  // Search
  searchPlaceholder: {
    en: 'Search entire menu...',
    tr: 'Tüm menüyü ara...',
    ar: 'ابحث في القائمة كاملة...',
  },
  clearSearch: {
    en: 'Clear',
    tr: 'Temizle',
    ar: 'مسح',
  },

  // Generic Messages
  loading: {
    en: 'Loading...',
    tr: 'Yükleniyor...',
    ar: 'جاري التحميل...',
  },
  success: {
    en: 'Success',
    tr: 'Başarılı',
    ar: 'نجح',
  },
  error: {
    en: 'Error',
    tr: 'Hata',
    ar: 'خطأ',
  },
  confirm: {
    en: 'Confirm',
    tr: 'Onayla',
    ar: 'تأكيد',
  },
  close: {
    en: 'Close',
    tr: 'Kapat',
    ar: 'إغلاق',
  },
  variants: {
    en: 'variants',
    tr: 'varyant',
    ar: 'متغيرات',
  },
} as const;

export function t(key: keyof typeof translations, lang: Lang): string {
  return translations[key][lang] || translations[key].en;
}

export function dirFor(lang: Lang): 'ltr' | 'rtl' {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

// Helper to translate size names
export function translateSize(size: string, lang: Lang): string {
  const sizeKey = size.toLowerCase() as keyof typeof translations;
  if (sizeKey in translations) {
    return t(sizeKey, lang);
  }
  return size; // Return original if no translation
}
