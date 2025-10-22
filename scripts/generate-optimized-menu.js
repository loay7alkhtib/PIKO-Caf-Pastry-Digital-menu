const fs = require('fs');
const path = require('path');

// Read the consolidated menu (merged same-name items with size/type variations)
const menuPath = path.join(__dirname, '../consolidated_menu.json');
const menuData = JSON.parse(fs.readFileSync(menuPath, 'utf8'));

// Function to create optimized menu structure
function createOptimizedMenu(menuData) {
  const categories = {};
  
  menuData.forEach(item => {
    const categoryName = item.category;
    
    if (!categories[categoryName]) {
      categories[categoryName] = {
        name: categoryName,
        items: []
      };
    }
    
    // Create optimized item structure
    const optimizedItem = {
      id: item.id,
      name: {
        ar: item.name_ar,
        tr: item.name_tr,
        en: item.name_en
      },
      category: item.category,
      basePrice: item.base_price,
      image: item.image,
      imageFilename: item.image_filename,
      
      // Size options
      sizes: item.has_sizes ? item.size_options.map(size => ({
        size: size.size,
        price: size.price,
        name: {
          ar: size.name_ar,
          tr: size.name_tr,
          en: size.name_en
        }
      })) : null,
      
      // Drink type options (for mojitos, etc.)
      drinkTypes: item.has_drink_types ? item.drink_type_options.map(drink => ({
        type: drink.type,
        price: drink.price,
        name: {
          ar: drink.name_ar,
          tr: drink.name_tr,
          en: drink.name_en
        }
      })) : null,
      
      // Preparation type options
      preparationTypes: item.has_preparation_types ? item.preparation_type_options.map(prep => ({
        type: prep.type,
        price: prep.price,
        name: {
          ar: prep.name_ar,
          tr: prep.name_tr,
          en: prep.name_en
        }
      })) : null,
      
      // Metadata
      hasVariations: item.has_sizes || item.has_drink_types || item.has_preparation_types,
      originalVariations: item.original_variations,
      priceRange: item.has_sizes ? {
        min: Math.min(...item.size_options.map(s => s.price)),
        max: Math.max(...item.size_options.map(s => s.price))
      } : null
    };
    
    categories[categoryName].items.push(optimizedItem);
  });
  
  return Object.values(categories);
}

// Generate optimized menu
const optimizedMenu = createOptimizedMenu(menuData);

// Save optimized menu
const outputPath = path.join(__dirname, '../public/static/optimized_menu.json');
fs.writeFileSync(outputPath, JSON.stringify(optimizedMenu, null, 2));

// Also create a compressed version
const compressedPath = path.join(__dirname, '../public/static/optimized_menu.json.gz');
const zlib = require('zlib');
const gzip = zlib.createGzip();
const input = fs.createReadStream(outputPath);
const output = fs.createWriteStream(compressedPath);

input.pipe(gzip).pipe(output);

// Generate statistics
const stats = {
  total_categories: optimizedMenu.length,
  total_items: menuData.length,
  items_with_photos: menuData.filter(item => item.image).length,
  items_with_sizes: menuData.filter(item => item.has_sizes).length,
  items_with_drink_types: menuData.filter(item => item.has_drink_types).length,
  items_with_preparation_types: menuData.filter(item => item.has_preparation_types).length,
  average_variations_per_item: (menuData.reduce((sum, item) => sum + item.original_variations, 0) / menuData.length).toFixed(2)
};

console.log('Optimized Menu Generated!');
console.log('\nMenu Statistics:');
console.log(JSON.stringify(stats, null, 2));

// Show category breakdown
console.log('\nCategory Breakdown:');
optimizedMenu.forEach(category => {
  const itemsWithPhotos = category.items.filter(item => item.image).length;
  const itemsWithVariations = category.items.filter(item => item.hasVariations).length;
  
  console.log(`${category.name}: ${category.items.length} items (${itemsWithPhotos} with photos, ${itemsWithVariations} with variations)`);
});

// Show sample items
console.log('\nSample Items:');
const sampleItems = optimizedMenu[0].items.slice(0, 3);
sampleItems.forEach(item => {
  console.log(`- ${item.name.en} (${item.basePrice} L.E.)`);
  if (item.sizes) {
    console.log(`  Sizes: ${item.sizes.map(s => `${s.size} (${s.price})`).join(', ')}`);
  }
  if (item.drinkTypes) {
    console.log(`  Drink Types: ${item.drinkTypes.map(d => `${d.type} (${d.price})`).join(', ')}`);
  }
  console.log(`  Image: ${item.image ? 'Yes' : 'No'}`);
});

console.log(`\nFiles created:`);
console.log(`- ${outputPath}`);
console.log(`- ${compressedPath}`);
