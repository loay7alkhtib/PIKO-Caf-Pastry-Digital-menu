const fs = require('fs');
const path = require('path');

// Read the current menu
const menuPath = path.join(__dirname, '../final_menu_fixed.json');
const menuData = JSON.parse(fs.readFileSync(menuPath, 'utf8'));

// Function to normalize item names for grouping
function normalizeItemName(name) {
  return name
    .replace(/\s+(وسط|كبير|medium|large|orta|büyük)$/i, '') // Remove size indicators
    .replace(/\s+(ريد بول|سفن|صودا|redbull|7up|soda)$/i, '') // Remove drink type indicators
    .replace(/\s+(ميكس|بابلز|mix|bubbles)$/i, '') // Remove preparation type indicators
    .trim();
}

// Function to extract size from name
function extractSize(name) {
  const sizeMap = {
    'وسط': 'medium',
    'كبير': 'large', 
    'medium': 'medium',
    'large': 'large',
    'orta': 'medium',
    'büyük': 'large'
  };
  
  for (const [key, value] of Object.entries(sizeMap)) {
    if (name.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  return 'regular';
}

// Function to extract drink type from name
function extractDrinkType(name) {
  if (name.toLowerCase().includes('ريد بول') || name.toLowerCase().includes('redbull')) {
    return 'redbull';
  }
  if (name.toLowerCase().includes('سفن') || name.toLowerCase().includes('7up')) {
    return '7up';
  }
  if (name.toLowerCase().includes('صودا') || name.toLowerCase().includes('soda')) {
    return 'soda';
  }
  return 'regular';
}

// Function to extract preparation type
function extractPreparationType(name) {
  if (name.toLowerCase().includes('ميكس') || name.toLowerCase().includes('mix')) {
    return 'mix';
  }
  if (name.toLowerCase().includes('بابلز') || name.toLowerCase().includes('bubbles')) {
    return 'bubbles';
  }
  return 'regular';
}

// Group items by normalized name
const groupedItems = {};

menuData.forEach(item => {
  const normalizedName = normalizeItemName(item.Name_En);
  
  if (!groupedItems[normalizedName]) {
    groupedItems[normalizedName] = {
      baseItem: item,
      variations: [],
      sizes: new Set(),
      drinkTypes: new Set(),
      preparationTypes: new Set()
    };
  }
  
  const size = extractSize(item.Name_En);
  const drinkType = extractDrinkType(item.Name_En);
  const prepType = extractPreparationType(item.Name_En);
  
  groupedItems[normalizedName].variations.push({
    ...item,
    size,
    drinkType,
    preparationType: prepType
  });
  
  groupedItems[normalizedName].sizes.add(size);
  groupedItems[normalizedName].drinkTypes.add(drinkType);
  groupedItems[normalizedName].preparationTypes.add(prepType);
});

// Create consolidated menu
const consolidatedMenu = [];

Object.values(groupedItems).forEach(group => {
  const baseItem = group.baseItem;
  
  // Create size options
  const sizeOptions = Array.from(group.sizes).map(size => {
    const variation = group.variations.find(v => v.size === size);
    return {
      size,
      price: variation ? variation.Price : baseItem.Price,
      name_ar: variation ? variation.Name_Ar : baseItem.Name_Ar,
      name_tr: variation ? variation.Name_tr : baseItem.Name_tr,
      name_en: variation ? variation.Name_En : baseItem.Name_En
    };
  });
  
  // Create drink type options (for mojitos and similar)
  const drinkTypeOptions = Array.from(group.drinkTypes).map(drinkType => {
    const variation = group.variations.find(v => v.drinkType === drinkType);
    return {
      type: drinkType,
      price: variation ? variation.Price : baseItem.Price,
      name_ar: variation ? variation.Name_Ar : baseItem.Name_Ar,
      name_tr: variation ? variation.Name_tr : baseItem.Name_tr,
      name_en: variation ? variation.Name_En : baseItem.Name_En
    };
  });
  
  // Create preparation type options
  const preparationTypeOptions = Array.from(group.preparationTypes).map(prepType => {
    const variation = group.variations.find(v => v.preparationType === prepType);
    return {
      type: prepType,
      price: variation ? variation.Price : baseItem.Price,
      name_ar: variation ? variation.Name_Ar : baseItem.Name_Ar,
      name_tr: variation ? variation.Name_tr : baseItem.Name_tr,
      name_en: variation ? variation.Name_En : baseItem.Name_En
    };
  });
  
  const consolidatedItem = {
    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name_ar: baseItem.Name_Ar,
    name_tr: baseItem.Name_tr,
    name_en: baseItem.Name_En,
    category: baseItem["Category Name"],
    base_price: baseItem.Price,
    image: null, // Will be filled by photo matching
    has_sizes: group.sizes.size > 1,
    has_drink_types: group.drinkTypes.size > 1,
    has_preparation_types: group.preparationTypes.size > 1,
    size_options: sizeOptions.length > 1 ? sizeOptions : null,
    drink_type_options: drinkTypeOptions.length > 1 ? drinkTypeOptions : null,
    preparation_type_options: preparationTypeOptions.length > 1 ? preparationTypeOptions : null,
    original_variations: group.variations.length
  };
  
  consolidatedMenu.push(consolidatedItem);
});

// Sort by category
const categoryOrder = [
  'Hot Coffee',
  'Ice Coffee', 
  'Cold drinks',
  'Blended Coffee',
  'Matcha',
  'Flavored tea',
  'Fresh juices',
  'Milkshakes',
  'Mojitos',
  'Smoothies',
  'Signature',
  'Sweets',
  'Patisserie',
  'Ice Cream'
];

consolidatedMenu.sort((a, b) => {
  const aIndex = categoryOrder.indexOf(a.category);
  const bIndex = categoryOrder.indexOf(b.category);
  return aIndex - bIndex;
});

// Save consolidated menu
const outputPath = path.join(__dirname, '../consolidated_menu.json');
fs.writeFileSync(outputPath, JSON.stringify(consolidatedMenu, null, 2));

console.log(`Consolidated menu created with ${consolidatedMenu.length} items`);
console.log(`Reduced from ${menuData.length} to ${consolidatedMenu.length} items`);

// Show statistics
const stats = {
  total_original: menuData.length,
  total_consolidated: consolidatedMenu.length,
  items_with_sizes: consolidatedMenu.filter(item => item.has_sizes).length,
  items_with_drink_types: consolidatedMenu.filter(item => item.has_drink_types).length,
  items_with_preparation_types: consolidatedMenu.filter(item => item.has_preparation_types).length
};

console.log('\nConsolidation Statistics:');
console.log(JSON.stringify(stats, null, 2));
