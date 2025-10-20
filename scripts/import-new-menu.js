#!/usr/bin/env node

/**
 * New Menu Import Script
 * 
 * This script imports the new menu data from the CSV file with the following structure:
 * - Arabic name, Price, Turkish name, English name, Arabic category, English category, Images
 * 
 * CSV Format:
 * اسم المادة,السعر,الاسم التركي,الاسم اللاتيني,اسم المجموعة,اسم المجموعة اللاتيني,الصور
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase configuration. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

class NewMenuImporter {
  constructor() {
    this.categories = new Map();
    this.items = [];
    this.categoryOrder = 0;
  }

  /**
   * Clean and normalize category names
   */
  normalizeCategoryName(name) {
    return name.trim().toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Get category icon based on category name
   */
  getCategoryIcon(categoryName) {
    const iconMap = {
      'الكريب': '🥞',
      'crepe': '🥞',
      'المشروبات الباردة': '🧊',
      'cold drinks': '🧊',
      'المشروبات الساخنة': '☕',
      'hot drinks': '☕',
      'الموهيتو': '🍹',
      'mojitos': '🍹',
      'الوافل': '🧇',
      'waffle': '🧇',
      'باتيسري': '🧁',
      'patisserie': '🧁',
      'بان كيك': '🥞',
      'cakes': '🥞',
      'سموزيات': '🥤',
      'smoothies': '🥤',
      'عصائر فريش': '🍹',
      'fresh juices': '🍹',
      'فرابتشينو': '☕',
      'frappuccino': '☕',
      'مشروبات بابلز شيك': '🧋',
      'bubble drinks': '🧋',
      'ميلك شيك': '🥤',
      'milkshakes': '🥤'
    };

    const normalizedName = categoryName.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (normalizedName.includes(key.toLowerCase())) {
        return icon;
      }
    }
    return '🍽️'; // Default icon
  }

  /**
   * Get category color based on category name
   */
  getCategoryColor(categoryName) {
    const colorMap = {
      'الكريب': '#8B4513',
      'crepe': '#8B4513',
      'المشروبات الباردة': '#87CEEB',
      'cold drinks': '#87CEEB',
      'المشروبات الساخنة': '#8B4513',
      'hot drinks': '#8B4513',
      'الموهيتو': '#FF6B6B',
      'mojitos': '#FF6B6B',
      'الوافل': '#DDA0DD',
      'waffle': '#DDA0DD',
      'باتيسري': '#FFB6C1',
      'patisserie': '#FFB6C1',
      'بان كيك': '#F0E68C',
      'cakes': '#F0E68C',
      'سموزيات': '#98FB98',
      'smoothies': '#98FB98',
      'عصائر فريش': '#FFA500',
      'fresh juices': '#FFA500',
      'فرابتشينو': '#D2691E',
      'frappuccino': '#D2691E',
      'مشروبات بابلز شيك': '#FF69B4',
      'bubble drinks': '#FF69B4',
      'ميلك شيك': '#FFC0CB',
      'milkshakes': '#FFC0CB'
    };

    const normalizedName = categoryName.toLowerCase();
    for (const [key, color] of Object.entries(colorMap)) {
      if (normalizedName.includes(key.toLowerCase())) {
        return color;
      }
    }
    return '#8B4513'; // Default color
  }

  /**
   * Process CSV file and prepare data
   */
  async processCSV(csvPath) {
    return new Promise((resolve, reject) => {
      const results = [];

      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          // Skip header row and empty rows
          if (!row['اسم المادة'] || row['اسم المادة'].trim() === '' || row['اسم المادة'] === 'اسم المادة') {
            return;
          }

          const arabicName = row['اسم المادة'].trim();
          const price = parseFloat(row['السعر']) || 0;
          const turkishName = row['الاسم التركي'].trim();
          const englishName = row['الاسم اللاتيني'].trim();
          const arabicCategory = row['اسم المجموعة'].trim();
          const englishCategory = row['اسم المجموعة اللاتيني'].trim();
          const images = row['الصور'].trim();

          // Skip items with zero price (placeholder items)
          if (price === 0) {
            return;
          }

          // Create category key
          const categoryKey = this.normalizeCategoryName(englishCategory || arabicCategory);
          
          // Store category data
          if (!this.categories.has(categoryKey)) {
            this.categories.set(categoryKey, {
              slug: categoryKey,
              names: {
                en: englishCategory || arabicCategory,
                tr: englishCategory || arabicCategory, // Use English as fallback for Turkish
                ar: arabicCategory
              },
              icon: this.getCategoryIcon(arabicCategory),
              color: this.getCategoryColor(arabicCategory),
              order: this.categoryOrder++
            });
          }

          // Prepare item data
          const item = {
            category_key: categoryKey,
            names: {
              en: englishName || arabicName,
              tr: turkishName || arabicName,
              ar: arabicName
            },
            price: price,
            image: images || null,
            order: this.items.length
          };

          this.items.push(item);
        })
        .on('end', () => {
          console.log(`📊 Processed ${this.categories.size} categories and ${this.items.length} items`);
          resolve();
        })
        .on('error', reject);
    });
  }

  /**
   * Clear existing menu data
   */
  async clearExistingData() {
    console.log('🗑️  Clearing existing menu data...');
    
    // Delete items first (due to foreign key constraint)
    const { error: itemsError } = await supabase
      .from('items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all items

    if (itemsError) {
      console.warn(`⚠️  Warning clearing items: ${itemsError.message}`);
    }

    // Delete categories
    const { error: categoriesError } = await supabase
      .from('categories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all categories

    if (categoriesError) {
      console.warn(`⚠️  Warning clearing categories: ${categoriesError.message}`);
    }

    console.log('✅ Existing data cleared');
  }

  /**
   * Import categories to database
   */
  async importCategories() {
    console.log('📂 Importing categories...');
    
    const categoryData = Array.from(this.categories.values()).map(cat => ({
      slug: cat.slug,
      names: cat.names,
      icon: cat.icon,
      color: cat.color,
      sort_order: cat.order,
      is_active: true
    }));

    const { data, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select('id, slug');

    if (error) {
      throw new Error(`Failed to import categories: ${error.message}`);
    }

    // Create mapping for items
    const categoryMap = new Map();
    data.forEach(cat => {
      categoryMap.set(cat.slug, cat.id);
    });

    console.log(`✅ Imported ${data.length} categories`);
    return categoryMap;
  }

  /**
   * Import items to database
   */
  async importItems(categoryMap) {
    console.log('🍽️ Importing items...');

    const itemData = [];
    
    for (const item of this.items) {
      const categoryId = categoryMap.get(item.category_key);
      if (!categoryId) {
        console.warn(`⚠️  Category not found for item: ${item.names.en}`);
        continue;
      }

      itemData.push({
        category_id: categoryId,
        names: item.names,
        price: item.price,
        image_url: item.image,
        tags: [],
        sort_order: item.order,
        is_active: true
      });
    }

    const { data, error } = await supabase
      .from('items')
      .insert(itemData);

    if (error) {
      throw new Error(`Failed to import items: ${error.message}`);
    }

    console.log(`✅ Imported ${itemData.length} items`);
  }

  /**
   * Main import process
   */
  async import(csvPath) {
    try {
      console.log('🚀 Starting new menu data import...');
      
      // Process CSV file
      await this.processCSV(csvPath);
      
      // Clear existing data
      await this.clearExistingData();
      
      // Import categories
      const categoryMap = await this.importCategories();
      
      // Import items
      await this.importItems(categoryMap);
      
      console.log('🎉 New menu data import completed successfully!');
      console.log(`📊 Summary:`);
      console.log(`   - Categories: ${this.categories.size}`);
      console.log(`   - Items: ${this.items.length}`);
      
    } catch (error) {
      console.error('❌ Import failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI usage
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log(`
Usage: node import-new-menu.js <csv-file>

Example:
  node import-new-menu.js "new Menu csv.csv"

Environment variables required:
  VITE_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
    `);
    process.exit(1);
  }

  const csvPath = args[0];
  
  // Validate path
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  const importer = new NewMenuImporter();
  await importer.import(csvPath);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { NewMenuImporter };
