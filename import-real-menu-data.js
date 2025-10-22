const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
// Simple UUID generator
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Image mapping function
function findMatchingImage(itemName, categoryName) {
  const photosDir = path.join(__dirname, 'Piko Web app Photos 6');
  
  // Clean the item name for matching
  const cleanName = itemName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Try to find matching image files
  const possibleMatches = [];
  
  try {
    const files = fs.readdirSync(photosDir);
    
    for (const file of files) {
      if (file.toLowerCase().includes(cleanName.split(' ')[0])) {
        possibleMatches.push(file);
      }
    }
    
    // If no direct match, try category-based matching
    if (possibleMatches.length === 0) {
      const categoryKeywords = {
        'Blended Coffee': ['frappucino', 'frapp'],
        'Cold drinks': ['iced', 'buzlu'],
        'Flavored tea': ['tea', 'çay'],
        'Fresh juices': ['juice', 'suyu'],
        'Hot Coffee': ['coffee', 'kahve', 'latte', 'espresso'],
        'Ice Coffee': ['iced', 'buzlu'],
        'Matcha': ['matcha'],
        'Milkshakes': ['milkshake', 'shake'],
        'Mojitos': ['mojito'],
        'Patisserie': ['cake', 'kek', 'cheesecake', 'cookies', 'kurabiye'],
        'Signature': ['hibiscus', 'cool lime'],
        'Smoothies': ['smoothie'],
        'Sweets': ['waffle', 'pancake', 'crepe', 'krep']
      };
      
      const keywords = categoryKeywords[categoryName] || [];
      for (const file of files) {
        for (const keyword of keywords) {
          if (file.toLowerCase().includes(keyword)) {
            possibleMatches.push(file);
            break;
          }
        }
      }
    }
    
    return possibleMatches[0] || null;
  } catch (error) {
    console.warn(`Could not read photos directory: ${error.message}`);
    return null;
  }
}

// Category mapping
const categoryMapping = {
  'Blended Coffee': 'blended-coffee',
  'Cold drinks': 'cold-drinks', 
  'Flavored tea': 'flavored-tea',
  'Fresh juices': 'fresh-juices',
  'Hot Coffee': 'hot-coffee',
  'Ice Coffee': 'ice-coffee',
  'Matcha': 'matcha',
  'Milkshakes': 'milkshakes',
  'Mojitos': 'mojitos',
  'Patisserie': 'patisserie',
  'Signature': 'signature',
  'Smoothies': 'smoothies',
  'Sweets': 'sweets'
};

async function importRealMenuData() {
  try {
    console.log('🚀 Starting real menu data import...');
    
    // Read CSV data
    const csvPath = path.join(__dirname, 'Piko Web app Photos 6', 'Finall Menu with right categores .csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n');
    
    // Parse CSV
    const menuItems = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const [nameAr, price, nameTr, nameEn, categoryName, image] = line.split(',');
      if (!nameEn || !categoryName) continue;
      
      menuItems.push({
        nameAr: nameAr || '',
        price: parseFloat(price) || 0,
        nameTr: nameTr || '',
        nameEn: nameEn || '',
        categoryName: categoryName || '',
        image: image || ''
      });
    }
    
    console.log(`📊 Found ${menuItems.length} menu items`);
    
    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await supabase.from('items').delete().neq('id', '0');
    await supabase.from('categories').delete().neq('id', '0');
    
    // Create categories
    console.log('📁 Creating categories...');
    const categories = {};
    const categoryOrder = {};
    let order = 0;
    
    for (const item of menuItems) {
      const categoryName = item.categoryName;
      if (!categories[categoryName]) {
        const categoryId = categoryMapping[categoryName] || uuidv4();
        categories[categoryName] = categoryId;
        categoryOrder[categoryName] = order++;
        
        const { error } = await supabase.from('categories').insert({
          id: categoryId,
          names: {
            en: categoryName,
            tr: categoryName,
            ar: categoryName
          },
          icon: '🍽️',
          color: '#0C6071',
          image: null,
          order: categoryOrder[categoryName]
        });
        
        if (error) {
          console.error(`❌ Error creating category ${categoryName}:`, error);
        } else {
          console.log(`✅ Created category: ${categoryName}`);
        }
      }
    }
    
    // Create items with image matching
    console.log('🍽️ Creating items with image matching...');
    const itemsToInsert = [];
    
    for (const item of menuItems) {
      const categoryId = categories[item.categoryName];
      if (!categoryId) continue;
      
      // Find matching image
      const matchingImage = findMatchingImage(item.nameEn, item.categoryName);
      const imageUrl = matchingImage ? `/Piko Web app Photos 6/${matchingImage}` : null;
      
      if (matchingImage) {
        console.log(`🖼️ Found image for ${item.nameEn}: ${matchingImage}`);
      }
      
      itemsToInsert.push({
        id: uuidv4(),
        names: {
          en: item.nameEn,
          tr: item.nameTr,
          ar: item.nameAr
        },
        category_id: categoryId,
        price: item.price,
        image: imageUrl,
        tags: ['menu-item'],
        is_available: true,
        order: 0
      });
    }
    
    // Insert items in batches
    const batchSize = 50;
    for (let i = 0; i < itemsToInsert.length; i += batchSize) {
      const batch = itemsToInsert.slice(i, i + batchSize);
      console.log(`📦 Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(itemsToInsert.length / batchSize)}...`);
      
      const { error } = await supabase.from('items').insert(batch);
      if (error) {
        console.error(`❌ Error inserting items batch:`, error);
      } else {
        console.log(`✅ Successfully inserted ${batch.length} items`);
      }
    }
    
    console.log('🎉 Real menu data import complete!');
    console.log(`📊 Imported ${Object.keys(categories).length} categories and ${itemsToInsert.length} items`);
    
  } catch (error) {
    console.error('❌ Fatal error during import:', error);
  }
}

importRealMenuData();
