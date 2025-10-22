const fs = require('fs');
const path = require('path');

// Read the menu file
const menuPath = path.join(__dirname, '../public/static/menu.json');
const menuData = JSON.parse(fs.readFileSync(menuPath, 'utf8'));

console.log('🔧 Fixing Menu Issues');
console.log('===================');

let fixedCount = 0;

// Fix items without prices (set a default price for Patisserie items)
menuData.items.forEach(item => {
  if (!item.price || item.price === 0) {
    // Set default prices based on category
    if (item.category_id.includes('patisserie') || item.category_id.includes('sweets')) {
      item.price = 50; // Default price for pastries
      console.log(`💰 Fixed price for ${item.name.en}: ${item.price} L.E.`);
      fixedCount++;
    }
  }
});

// Fix items without images (set a default placeholder)
menuData.items.forEach(item => {
  if (!item.image) {
    item.image = '/images/menu/placeholder.jpg';
    console.log(`🖼️ Added placeholder image for ${item.name.en}`);
    fixedCount++;
  }
});

// Ensure all categories have proper order
menuData.categories.forEach((category, index) => {
  if (category.order === undefined || category.order === null) {
    category.order = index;
    console.log(`📋 Fixed order for category ${category.name.en}: ${index}`);
    fixedCount++;
  }
});

// Ensure all items have proper order
menuData.items.forEach((item, index) => {
  if (item.order === undefined || item.order === null) {
    item.order = index;
    fixedCount++;
  }
});

// Save the fixed menu
fs.writeFileSync(menuPath, JSON.stringify(menuData, null, 2));

// Also update compressed version
const zlib = require('zlib');
const gzip = zlib.createGzip();
const input = fs.createReadStream(menuPath);
const output = fs.createWriteStream(path.join(__dirname, '../public/static/menu.json.gz'));

input.pipe(gzip).pipe(output);

console.log(`\n✅ Fixed ${fixedCount} issues`);
console.log('📁 Menu updated successfully!');

// Show final statistics
const itemsWithPrices = menuData.items.filter(item => item.price > 0).length;
const itemsWithImages = menuData.items.filter(item => item.image).length;

console.log('\n📊 Final Statistics:');
console.log(`- Categories: ${menuData.categories.length}`);
console.log(`- Items: ${menuData.items.length}`);
console.log(`- Items with prices: ${itemsWithPrices}`);
console.log(`- Items with images: ${itemsWithImages}`);
console.log(`- Price coverage: ${Math.round((itemsWithPrices / menuData.items.length) * 100)}%`);
console.log(`- Image coverage: ${Math.round((itemsWithImages / menuData.items.length) * 100)}%`);
