const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://jppymhzgprvshurcqmdn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwcHltaHpncHJ2c2h1cmNxbWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODM0NzIsImV4cCI6MjA3NjY1OTQ3Mn0.SkAnsUjAgamEZxNBAXciJVSlAvWH4wji4lJrEYq-1uA';

const supabase = createClient(supabaseUrl, supabaseKey);

// Function to normalize text for comparison
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
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

// Function to normalize item name (remove size indicators)
function normalizeItemName(name) {
  return name
    .replace(/\s+(وسط|كبير|medium|large|orta|büyük)$/i, '')
    .replace(/\s+(ريد بول|سفن|صودا|redbull|7up|soda)$/i, '')
    .replace(/\s+(ميكس|بابلز|mix|bubbles)$/i, '')
    .trim();
}

async function verifyAndFixCSVData() {
  try {
    console.log('🔍 Starting CSV data verification and fixes...');
    
    // Read CSV file
    const csvPath = path.join(__dirname, '../Piko Web app Photos 6/Finall Menu with right categores .csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n').slice(1); // Skip header
    
    console.log(`📊 Found ${lines.length} items in CSV`);
    
    // Parse CSV data
    const csvItems = [];
    lines.forEach((line, index) => {
      if (line.trim()) {
        const [nameAr, price, nameTr, nameEn, categoryName, image] = line.split(',');
        if (nameEn && nameEn.trim()) {
          csvItems.push({
            nameAr: nameAr?.trim() || '',
            price: parseFloat(price) || 0,
            nameTr: nameTr?.trim() || '',
            nameEn: nameEn.trim(),
            categoryName: categoryName?.trim() || '',
            image: image?.trim() || ''
          });
        }
      }
    });
    
    console.log(`📦 Parsed ${csvItems.length} valid items from CSV`);
    
    // Get current database items
    const { data: dbItems, error: dbError } = await supabase
      .from('items')
      .select('*');
    
    if (dbError) {
      throw new Error(`Failed to fetch database items: ${dbError.message}`);
    }
    
    console.log(`🗄️ Found ${dbItems.length} items in database`);
    
    // Group CSV items by normalized name
    const csvGrouped = {};
    csvItems.forEach(item => {
      const normalizedName = normalizeItemName(item.nameEn);
      if (!csvGrouped[normalizedName]) {
        csvGrouped[normalizedName] = {
          baseItem: item,
          variations: []
        };
      }
      
      const size = extractSize(item.nameEn);
      csvGrouped[normalizedName].variations.push({
        ...item,
        size
      });
    });
    
    console.log(`📋 Grouped into ${Object.keys(csvGrouped).length} unique items`);
    
    // Compare with database
    const missingItems = [];
    const incorrectItems = [];
    const extraItems = [];
    
    // Check for missing items
    Object.values(csvGrouped).forEach(group => {
      const baseItem = group.baseItem;
      const normalizedName = normalizeItemName(baseItem.nameEn);
      
      // Find matching item in database
      const dbItem = dbItems.find(item => 
        normalizeText(item.names.en) === normalizeText(normalizedName)
      );
      
      if (!dbItem) {
        missingItems.push(group);
      } else {
        // Check if data is correct
        const hasVariants = group.variations.length > 1;
        const dbHasVariants = dbItem.variants && dbItem.variants.length > 0;
        
        if (hasVariants !== dbHasVariants) {
          incorrectItems.push({
            csv: group,
            db: dbItem,
            issue: 'variants_mismatch'
          });
        }
        
        // Check price
        const expectedPrice = Math.min(...group.variations.map(v => v.price));
        if (Math.abs(dbItem.price - expectedPrice) > 0.01) {
          incorrectItems.push({
            csv: group,
            db: dbItem,
            issue: 'price_mismatch'
          });
        }
      }
    });
    
    // Check for extra items in database
    dbItems.forEach(dbItem => {
      const normalizedName = normalizeItemName(dbItem.names.en);
      const csvItem = Object.values(csvGrouped).find(group => 
        normalizeText(normalizeItemName(group.baseItem.nameEn)) === normalizeText(normalizedName)
      );
      
      if (!csvItem) {
        extraItems.push(dbItem);
      }
    });
    
    console.log('\n📊 Analysis Results:');
    console.log(`❌ Missing items: ${missingItems.length}`);
    console.log(`⚠️ Incorrect items: ${incorrectItems.length}`);
    console.log(`➕ Extra items: ${extraItems.length}`);
    
    if (missingItems.length > 0) {
      console.log('\n❌ Missing items:');
      missingItems.slice(0, 10).forEach(item => {
        console.log(`  - ${item.baseItem.nameEn} (${item.variations.length} variations)`);
      });
    }
    
    if (incorrectItems.length > 0) {
      console.log('\n⚠️ Incorrect items:');
      incorrectItems.slice(0, 10).forEach(item => {
        console.log(`  - ${item.csv.baseItem.nameEn}: ${item.issue}`);
      });
    }
    
    if (extraItems.length > 0) {
      console.log('\n➕ Extra items in database:');
      extraItems.slice(0, 10).forEach(item => {
        console.log(`  - ${item.names.en}`);
      });
    }
    
    // Fix missing items
    if (missingItems.length > 0) {
      console.log('\n🔧 Adding missing items...');
      
      for (const group of missingItems) {
        const baseItem = group.baseItem;
        const categoryId = `cat_${baseItem.categoryName.toLowerCase().replace(/\s+/g, '_')}`;
        
        const variants = group.variations.length > 1 
          ? group.variations.map(v => ({ size: v.size, price: v.price }))
          : null;
        
        const itemData = {
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          names: {
            en: baseItem.nameEn,
            tr: baseItem.nameTr,
            ar: baseItem.nameAr
          },
          category_id: categoryId,
          price: Math.min(...group.variations.map(v => v.price)),
          image: null,
          tags: ['menu-item'],
          is_available: true,
          order: 0,
          variants: variants,
          created_at: new Date().toISOString()
        };
        
        const { error: insertError } = await supabase
          .from('items')
          .insert(itemData);
        
        if (insertError) {
          console.error(`❌ Failed to insert ${baseItem.nameEn}:`, insertError.message);
        } else {
          console.log(`✅ Added ${baseItem.nameEn}`);
        }
      }
    }
    
    // Fix incorrect items
    if (incorrectItems.length > 0) {
      console.log('\n🔧 Fixing incorrect items...');
      
      for (const item of incorrectItems) {
        const group = item.csv;
        const dbItem = item.db;
        
        const variants = group.variations.length > 1 
          ? group.variations.map(v => ({ size: v.size, price: v.price }))
          : null;
        
        const updateData = {
          price: Math.min(...group.variations.map(v => v.price)),
          variants: variants
        };
        
        const { error: updateError } = await supabase
          .from('items')
          .update(updateData)
          .eq('id', dbItem.id);
        
        if (updateError) {
          console.error(`❌ Failed to update ${dbItem.names.en}:`, updateError.message);
        } else {
          console.log(`✅ Fixed ${dbItem.names.en}`);
        }
      }
    }
    
    // Remove extra items (optional - be careful!)
    if (extraItems.length > 0) {
      console.log('\n🗑️ Extra items found (not removing automatically for safety)');
      console.log('Review these items manually if they should be removed');
    }
    
    // Final verification
    console.log('\n🔍 Final verification...');
    const { data: finalItems, error: finalError } = await supabase
      .from('items')
      .select('*');
    
    if (!finalError) {
      console.log(`📊 Final database count: ${finalItems.length} items`);
      
      const withVariants = finalItems.filter(item => item.variants && item.variants.length > 0).length;
      console.log(`📊 Items with variants: ${withVariants}`);
      
      const withImages = finalItems.filter(item => item.image).length;
      console.log(`📊 Items with images: ${withImages} (${Math.round(withImages/finalItems.length*100)}%)`);
    }
    
    console.log('\n🎉 CSV data verification and fixes completed!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

// Run the verification
verifyAndFixCSVData();
