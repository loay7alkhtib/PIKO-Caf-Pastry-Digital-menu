#!/usr/bin/env node

/**
 * Menu Import Script using MCP Supabase Tools
 * 
 * This script processes the CSV and provides the data structure
 * for manual import via MCP tools
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

class MenuProcessor {
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
      let lineNumber = 0;

      fs.createReadStream(csvPath)
        .pipe(csv({
          headers: ['اسم المادة', 'السعر', 'الاسم التركي', 'الاسم اللاتيني', 'اسم المجموعة', 'اسم المجموعة اللاتيني', 'الصور'],
          skipEmptyLines: true
        }))
        .on('data', (row) => {
          lineNumber++;
          
          // Skip first line (Table 1)
          if (lineNumber === 1) {
            return;
          }
          
          // Skip empty rows
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
   * Generate SQL for categories
   */
  generateCategorySQL() {
    const categories = Array.from(this.categories.values());
    const sql = categories.map(cat => 
      `INSERT INTO categories (slug, names, icon, color, sort_order, is_active) VALUES ('${cat.slug}', '${JSON.stringify(cat.names)}', '${cat.icon}', '${cat.color}', ${cat.order}, true);`
    ).join('\n');
    
    return sql;
  }

  /**
   * Generate SQL for items (requires category IDs)
   */
  generateItemSQL() {
    const items = this.items.map(item => {
      return {
        category_key: item.category_key,
        names: item.names,
        price: item.price,
        image: item.image,
        order: item.order
      };
    });
    
    return items;
  }

  /**
   * Print summary
   */
  printSummary() {
    console.log('\n📊 MENU IMPORT SUMMARY');
    console.log('====================');
    console.log(`Categories: ${this.categories.size}`);
    console.log(`Items: ${this.items.length}`);
    
    console.log('\n📂 CATEGORIES:');
    Array.from(this.categories.values()).forEach(cat => {
      console.log(`  - ${cat.names.en} (${cat.names.ar}) - ${cat.icon} ${cat.color}`);
    });
    
    console.log('\n🍽️ SAMPLE ITEMS:');
    this.items.slice(0, 10).forEach(item => {
      console.log(`  - ${item.names.en} (${item.names.ar}) - ${item.price} TL`);
    });
    
    if (this.items.length > 10) {
      console.log(`  ... and ${this.items.length - 10} more items`);
    }
  }
}

// CLI usage
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log(`
Usage: node import-menu-mcp.js <csv-file>

Example:
  node import-menu-mcp.js "new Menu csv.csv"
    `);
    process.exit(1);
  }

  const csvPath = args[0];
  
  // Validate path
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  const processor = new MenuProcessor();
  await processor.processCSV(csvPath);
  processor.printSummary();
  
  console.log('\n✅ CSV processing completed!');
  console.log('📝 Next step: Use the MCP Supabase tools to import the data');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { MenuProcessor };
