const fs = require('fs');
const path = require('path');

// Read the optimized menu
const menuPath = path.join(__dirname, '../public/static/optimized_menu.json');
const optimizedMenu = JSON.parse(fs.readFileSync(menuPath, 'utf8'));

// Convert to the format expected by the app
function convertToAppFormat(optimizedMenu) {
  const categories = [];
  const items = [];
  
  optimizedMenu.forEach(category => {
    // Create category
    const categoryId = `cat_${category.name.toLowerCase().replace(/\s+/g, '_')}`;
    categories.push({
      id: categoryId,
      name: {
        ar: getArabicCategoryName(category.name),
        tr: getTurkishCategoryName(category.name),
        en: category.name
      },
      order: categories.length,
      active: true
    });
    
    // Create items for this category
    category.items.forEach(item => {
      // Create unified item with variants array
      const baseItem = {
        id: item.id,
        name: item.name,
        category_id: categoryId,
        price: item.basePrice,
        image: item.image,
        active: true,
        order: items.length,
        description: null,
        allergens: null,
        nutritional_info: null,
        variants: Array.isArray(item.sizes)
          ? item.sizes
              .filter(s => !!s && typeof s.price === 'number')
              .map(s => ({ size: s.size, price: s.price }))
          : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      items.push(baseItem);
      
      // Stop generating separate size items; sizes now live in variants
      
      // Add drink type variations if they exist
      if (item.drinkTypes && item.drinkTypes.length > 1) {
        item.drinkTypes.forEach((drink, index) => {
          if (drink.type !== 'regular') {
            const drinkItem = {
              id: `${item.id}_drink_${drink.type}`,
              name: {
                ar: drink.name.ar,
                tr: drink.name.tr,
                en: `${drink.name.en} (${drink.type})`
              },
              category_id: categoryId,
              price: drink.price,
              image: item.image,
              active: true,
              order: items.length,
              description: null,
              allergens: null,
              nutritional_info: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            items.push(drinkItem);
          }
        });
      }
    });
  });
  
  return { categories, items };
}

// Helper functions for category names
function getArabicCategoryName(englishName) {
  const categoryMap = {
    'Hot Coffee': 'قهوة ساخنة',
    'Ice Coffee': 'قهوة باردة',
    'Cold drinks': 'مشروبات باردة',
    'Blended Coffee': 'قهوة مخفوقة',
    'Matcha': 'ماتشا',
    'Flavored tea': 'شاي منكه',
    'Fresh juices': 'عصائر طازجة',
    'Milkshakes': 'ميلك شيك',
    'Mojitos': 'موهيتو',
    'Smoothies': 'سموزي',
    'Signature': 'مشروبات مميزة',
    'Sweets': 'حلويات',
    'Patisserie': 'معجنات',
    'Ice Cream': 'آيس كريم'
  };
  return categoryMap[englishName] || englishName;
}

function getTurkishCategoryName(englishName) {
  const categoryMap = {
    'Hot Coffee': 'Sıcak Kahve',
    'Ice Coffee': 'Soğuk Kahve',
    'Cold drinks': 'Soğuk İçecekler',
    'Blended Coffee': 'Karışık Kahve',
    'Matcha': 'Matcha',
    'Flavored tea': 'Aromalı Çay',
    'Fresh juices': 'Taze Meyve Suları',
    'Milkshakes': 'Milkshake',
    'Mojitos': 'Mojito',
    'Smoothies': 'Smoothie',
    'Signature': 'Özel İçecekler',
    'Sweets': 'Tatlılar',
    'Patisserie': 'Hamur İşleri',
    'Ice Cream': 'Dondurma'
  };
  return categoryMap[englishName] || englishName;
}

// Convert the menu
const appFormat = convertToAppFormat(optimizedMenu);

// Save the converted menu
const outputPath = path.join(__dirname, '../public/static/menu.json');
fs.writeFileSync(outputPath, JSON.stringify(appFormat, null, 2));

// Also create compressed version
const zlib = require('zlib');
const gzip = zlib.createGzip();
const input = fs.createReadStream(outputPath);
const output = fs.createWriteStream(path.join(__dirname, '../public/static/menu.json.gz'));

input.pipe(gzip).pipe(output);

console.log('Menu converted to app format successfully!');
console.log(`Categories: ${appFormat.categories.length}`);
console.log(`Items: ${appFormat.items.length}`);

// Show sample
console.log('\nSample category:');
console.log(JSON.stringify(appFormat.categories[0], null, 2));

console.log('\nSample items:');
appFormat.items.slice(0, 3).forEach(item => {
  console.log(`- ${item.name.en} (${item.price} L.E.)`);
});
