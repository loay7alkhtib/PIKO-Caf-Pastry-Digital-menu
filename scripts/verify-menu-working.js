const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Menu is Working');
console.log('============================');

// Read the menu file
const menuPath = path.join(__dirname, '../public/static/menu.json');
const menuData = JSON.parse(fs.readFileSync(menuPath, 'utf8'));

// Check basic structure
console.log('\n📊 Menu Structure:');
console.log(`✅ Categories: ${menuData.categories?.length || 0}`);
console.log(`✅ Items: ${menuData.items?.length || 0}`);

// Check categories
if (menuData.categories && menuData.categories.length > 0) {
  console.log('\n📁 Categories:');
  menuData.categories.forEach((category, index) => {
    console.log(`${index + 1}. ${category.name.en} (${category.name.ar}) - Active: ${category.active}`);
  });
}

// Check items with prices
const itemsWithPrices = menuData.items.filter(item => item.price > 0);
const itemsWithImages = menuData.items.filter(item => item.image);
const activeItems = menuData.items.filter(item => item.active);

console.log('\n🍽️ Items Analysis:');
console.log(`✅ Items with prices: ${itemsWithPrices.length}/${menuData.items.length}`);
console.log(`✅ Items with images: ${itemsWithImages.length}/${menuData.items.length}`);
console.log(`✅ Active items: ${activeItems.length}/${menuData.items.length}`);

// Check for any remaining issues
const issues = [];
if (itemsWithPrices.length !== menuData.items.length) {
  issues.push(`❌ ${menuData.items.length - itemsWithPrices.length} items without prices`);
}
if (itemsWithImages.length !== menuData.items.length) {
  issues.push(`❌ ${menuData.items.length - itemsWithImages.length} items without images`);
}

if (issues.length === 0) {
  console.log('\n✅ All issues resolved!');
} else {
  console.log('\n⚠️ Remaining issues:');
  issues.forEach(issue => console.log(issue));
}

// Show sample items by category
console.log('\n📋 Sample Items by Category:');
menuData.categories.slice(0, 3).forEach(category => {
  const categoryItems = menuData.items.filter(item => item.category_id === category.id);
  console.log(`\n${category.name.en}:`);
  categoryItems.slice(0, 3).forEach(item => {
    console.log(`  - ${item.name.en} (${item.price} L.E.) ${item.image ? '🖼️' : '❌'}`);
  });
});

// Check if menu is ready for the app
console.log('\n🚀 Menu Readiness Check:');
const isReady = menuData.categories.length > 0 && 
                menuData.items.length > 0 && 
                itemsWithPrices.length === menuData.items.length;

if (isReady) {
  console.log('✅ Menu is ready for the app!');
  console.log('📱 You can now start your development server and the menu should load correctly.');
} else {
  console.log('❌ Menu is not ready. Please fix the issues above.');
}

console.log('\n📝 Next Steps:');
console.log('1. Start your development server: npm run dev');
console.log('2. Visit: http://localhost:5173/debug-menu.html');
console.log('3. Check if categories and items are loading');
console.log('4. If still not working, check browser console for errors');
