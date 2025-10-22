const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://jppymhzgprvshurcqmdn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwcHltaHpncHJ2c2h1cmNxbWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODM0NzIsImV4cCI6MjA3NjY1OTQ3Mn0.SkAnsUjAgamEZxNBAXciJVSlAvWH4wji4lJrEYq-1uA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function importConsolidatedMenu() {
  try {
    console.log('🚀 Starting import of consolidated menu to Supabase...');
    
    // Read the consolidated menu
    const consolidatedPath = path.join(__dirname, 'consolidated_menu.json');
    const consolidatedData = JSON.parse(fs.readFileSync(consolidatedPath, 'utf8'));
    
    console.log(`📊 Found ${consolidatedData.length} consolidated items`);
    
    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await supabase.from('items').delete().neq('id', '0');
    await supabase.from('categories').delete().neq('id', '0');
    
    // Import categories first
    console.log('📁 Importing categories...');
    const categories = [
      {
        id: 'cat_hot_coffee',
        names: { ar: 'قهوة ساخنة', tr: 'Sıcak Kahve', en: 'Hot Coffee' },
        icon: '☕',
        color: '#8B4513',
        order: 0,
        created_at: new Date().toISOString()
      },
      {
        id: 'cat_ice_coffee',
        names: { ar: 'قهوة باردة', tr: 'Soğuk Kahve', en: 'Ice Coffee' },
        icon: '🧊',
        color: '#4169E1',
        order: 1,
        created_at: new Date().toISOString()
      },
      {
        id: 'cat_cold_drinks',
        names: { ar: 'مشروبات باردة', tr: 'Soğuk İçecekler', en: 'Cold drinks' },
        icon: '🥤',
        color: '#00CED1',
        order: 2,
        created_at: new Date().toISOString()
      },
      {
        id: 'cat_blended_coffee',
        names: { ar: 'قهوة مخفوقة', tr: 'Karışık Kahve', en: 'Blended Coffee' },
        icon: '🥤',
        color: '#D2691E',
        order: 3,
        created_at: new Date().toISOString()
      },
      {
        id: 'cat_matcha',
        names: { ar: 'ماتشا', tr: 'Matcha', en: 'Matcha' },
        icon: '🍵',
        color: '#228B22',
        order: 4,
        created_at: new Date().toISOString()
      },
      {
        id: 'cat_flavored_tea',
        names: { ar: 'شاي منكه', tr: 'Aromalı Çay', en: 'Flavored tea' },
        icon: '🍃',
        color: '#32CD32',
        order: 5,
        created_at: new Date().toISOString()
      },
      {
        id: 'cat_fresh_juices',
        names: { ar: 'عصائر طازجة', tr: 'Taze Meyve Suları', en: 'Fresh juices' },
        icon: '🍊',
        color: '#FF6347',
        order: 6,
        created_at: new Date().toISOString()
      },
      {
        id: 'cat_milkshakes',
        names: { ar: 'ميلك شيك', tr: 'Milkshake', en: 'Milkshakes' },
        icon: '🥛',
        color: '#FFB6C1',
        order: 7,
        created_at: new Date().toISOString()
      },
      {
        id: 'cat_mojitos',
        names: { ar: 'موهيتو', tr: 'Mojito', en: 'Mojitos' },
        icon: '🍹',
        color: '#00FF7F',
        order: 8,
        created_at: new Date().toISOString()
      },
      {
        id: 'cat_smoothies',
        names: { ar: 'سموزي', tr: 'Smoothie', en: 'Smoothies' },
        icon: '🥤',
        color: '#9370DB',
        order: 9,
        created_at: new Date().toISOString()
      },
      {
        id: 'cat_signature',
        names: { ar: 'مشروبات مميزة', tr: 'Özel İçecekler', en: 'Signature' },
        icon: '⭐',
        color: '#FFD700',
        order: 10,
        created_at: new Date().toISOString()
      },
      {
        id: 'cat_sweets',
        names: { ar: 'حلويات', tr: 'Tatlılar', en: 'Sweets' },
        icon: '🍰',
        color: '#FF69B4',
        order: 11,
        created_at: new Date().toISOString()
      },
      {
        id: 'cat_patisserie',
        names: { ar: 'معجنات', tr: 'Hamur İşleri', en: 'Patisserie' },
        icon: '🥐',
        color: '#DEB887',
        order: 12,
        created_at: new Date().toISOString()
      },
      {
        id: 'cat_ice_cream',
        names: { ar: 'آيس كريم', tr: 'Dondurma', en: 'Ice Cream' },
        icon: '🍦',
        color: '#F0F8FF',
        order: 13,
        created_at: new Date().toISOString()
      }
    ];
    
    const { error: categoriesError } = await supabase
      .from('categories')
      .insert(categories);
    
    if (categoriesError) {
      throw new Error(`Categories import failed: ${categoriesError.message}`);
    }
    
    console.log(`✅ Imported ${categories.length} categories`);
    
    // Import items with variants
    console.log('📦 Importing items with variants...');
    
    const itemsToImport = consolidatedData.map((item, index) => {
      const categoryId = `cat_${item.category.toLowerCase().replace(/\s+/g, '_')}`;
      
      return {
        id: item.id,
        names: {
          en: item.name_en,
          tr: item.name_tr,
          ar: item.name_ar
        },
        category_id: categoryId,
        price: item.base_price,
        image: item.image,
        tags: ['menu-item'],
        is_available: true,
        order: index,
        variants: item.size_options && item.size_options.length > 1 
          ? item.size_options.map(size => ({
              size: size.size,
              price: size.price
            }))
          : null,
        created_at: new Date().toISOString()
      };
    });
    
    // Import in batches to avoid timeout
    const batchSize = 50;
    for (let i = 0; i < itemsToImport.length; i += batchSize) {
      const batch = itemsToImport.slice(i, i + batchSize);
      console.log(`📦 Importing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(itemsToImport.length / batchSize)} (${batch.length} items)`);
      
      const { error: itemsError } = await supabase
        .from('items')
        .insert(batch);
      
      if (itemsError) {
        throw new Error(`Items import failed: ${itemsError.message}`);
      }
    }
    
    console.log(`✅ Imported ${itemsToImport.length} items with variants`);
    
    // Verify import
    const { data: importedCategories, error: catError } = await supabase
      .from('categories')
      .select('*');
    
    const { data: importedItems, error: itemError } = await supabase
      .from('items')
      .select('*');
    
    if (catError || itemError) {
      throw new Error(`Verification failed: ${catError?.message || itemError?.message}`);
    }
    
    console.log('\n🎉 Import completed successfully!');
    console.log(`📊 Final counts:`);
    console.log(`   - Categories: ${importedCategories.length}`);
    console.log(`   - Items: ${importedItems.length}`);
    console.log(`   - Items with variants: ${importedItems.filter(item => item.variants).length}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

// Run the import
importConsolidatedMenu();
