const fs = require('fs');
const path = require('path');

// Read the menu file
const menuPath = path.join(__dirname, '../public/static/menu.json');
const menuData = JSON.parse(fs.readFileSync(menuPath, 'utf8'));

console.log('🔍 Menu Structure Analysis');
console.log('========================');

// Check if menu has the expected structure
console.log('\n📊 Basic Structure:');
console.log(`- Has categories: ${Array.isArray(menuData.categories)}`);
console.log(`- Has items: ${Array.isArray(menuData.items)}`);
console.log(`- Categories count: ${menuData.categories?.length || 0}`);
console.log(`- Items count: ${menuData.items?.length || 0}`);

// Check categories structure
if (menuData.categories && menuData.categories.length > 0) {
  console.log('\n📁 Categories Structure:');
  const sampleCategory = menuData.categories[0];
  console.log(`- Sample category keys: ${Object.keys(sampleCategory).join(', ')}`);
  console.log(`- Has id: ${!!sampleCategory.id}`);
  console.log(`- Has name: ${!!sampleCategory.name}`);
  console.log(`- Has order: ${!!sampleCategory.order}`);
  console.log(`- Has active: ${!!sampleCategory.active}`);
  
  if (sampleCategory.name) {
    console.log(`- Name structure: ${typeof sampleCategory.name}`);
    if (typeof sampleCategory.name === 'object') {
      console.log(`- Name keys: ${Object.keys(sampleCategory.name).join(', ')}`);
    }
  }
}

// Check items structure
if (menuData.items && menuData.items.length > 0) {
  console.log('\n🍽️ Items Structure:');
  const sampleItem = menuData.items[0];
  console.log(`- Sample item keys: ${Object.keys(sampleItem).join(', ')}`);
  console.log(`- Has id: ${!!sampleItem.id}`);
  console.log(`- Has name: ${!!sampleItem.name}`);
  console.log(`- Has category_id: ${!!sampleItem.category_id}`);
  console.log(`- Has price: ${!!sampleItem.price}`);
  console.log(`- Has image: ${!!sampleItem.image}`);
  console.log(`- Has active: ${!!sampleItem.active}`);
  
  if (sampleItem.name) {
    console.log(`- Name structure: ${typeof sampleItem.name}`);
    if (typeof sampleItem.name === 'object') {
      console.log(`- Name keys: ${Object.keys(sampleItem.name).join(', ')}`);
    }
  }
}

// Check for any issues
console.log('\n🔍 Potential Issues:');
const issues = [];

if (!menuData.categories || menuData.categories.length === 0) {
  issues.push('❌ No categories found');
}

if (!menuData.items || menuData.items.length === 0) {
  issues.push('❌ No items found');
}

if (menuData.categories) {
  const inactiveCategories = menuData.categories.filter(cat => !cat.active);
  if (inactiveCategories.length > 0) {
    issues.push(`⚠️ ${inactiveCategories.length} inactive categories`);
  }
}

if (menuData.items) {
  const itemsWithoutImages = menuData.items.filter(item => !item.image);
  if (itemsWithoutImages.length > 0) {
    issues.push(`⚠️ ${itemsWithoutImages.length} items without images`);
  }
  
  const itemsWithoutPrices = menuData.items.filter(item => !item.price || item.price === 0);
  if (itemsWithoutPrices.length > 0) {
    issues.push(`⚠️ ${itemsWithoutPrices.length} items without prices`);
  }
}

if (issues.length === 0) {
  console.log('✅ No issues found!');
} else {
  issues.forEach(issue => console.log(issue));
}

// Show sample data
console.log('\n📋 Sample Data:');
if (menuData.categories && menuData.categories.length > 0) {
  console.log('\nSample Category:');
  console.log(JSON.stringify(menuData.categories[0], null, 2));
}

if (menuData.items && menuData.items.length > 0) {
  console.log('\nSample Item:');
  console.log(JSON.stringify(menuData.items[0], null, 2));
}

console.log('\n✅ Menu structure analysis complete!');
