#!/usr/bin/env node

/**
 * Import remaining items in batches
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Category mapping
const categoryMap = {
  'crepe': 'cd3ee9c1-d2d0-4b11-beac-1dc30fff909d',
  'cold-drinks': 'edd6fa8d-d0e0-4de2-997b-adac9f3c1b94',
  'hot-drinks': '2ecdb791-7517-4e02-b5bd-39c13c7fd62f',
  'mojitos': '13bb664e-7891-4bb9-ab37-f8ab42a9260c',
  'waffle': '9742839e-53d8-4254-a341-dc5246594c15',
  'cakes': 'edc42cf2-d4d6-41d7-8e63-a8a4751b3799',
  'smoothies': 'a13b4eae-e2f2-4303-abb6-1d3a91deb790',
  'fresh-juices': 'd5e426e0-5797-4fbe-9455-3a4cab4b19c4',
  'frappuccino': 'bf82bcf6-4554-4f9c-b587-308885c5d9d8',
  'bubble-drinks': 'b76c6f1a-0f68-4c4c-966a-15ac3fb69efd',
  'milkshakes': '650ccbf3-985a-4d60-82b4-0744ea0b5dff'
};

class RemainingItemsImporter {
  constructor() {
    this.items = [];
    this.currentSortOrder = 8; // Start after crepe items
  }

  normalizeCategoryName(name) {
    return name.trim().toLowerCase().replace(/\s+/g, '-');
  }

  async processCSV(csvPath) {
    return new Promise((resolve, reject) => {
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

          // Skip crepe items (already imported)
          const categoryKey = this.normalizeCategoryName(englishCategory || arabicCategory);
          if (categoryKey === 'crepe') {
            return;
          }

          const categoryId = categoryMap[categoryKey];
          
          if (!categoryId) {
            console.warn(`Category not found for: ${categoryKey}`);
            return;
          }

          // Prepare item data
          const item = {
            category_id: categoryId,
            names: {
              en: englishName || arabicName,
              tr: turkishName || arabicName,
              ar: arabicName
            },
            price: price,
            image_url: images || null,
            sort_order: this.currentSortOrder++,
            is_active: true
          };

          this.items.push(item);
        })
        .on('end', () => {
          console.log(`📊 Processed ${this.items.length} remaining items`);
          resolve();
        })
        .on('error', reject);
    });
  }

  generateSQL() {
    const values = this.items.map(item => {
      const names = JSON.stringify(item.names).replace(/'/g, "''");
      const imageUrl = item.image_url ? `'${item.image_url}'` : 'NULL';
      
      return `('${item.category_id}', '${names}', ${item.price}, ${imageUrl}, ${item.sort_order}, ${item.is_active})`;
    }).join(',\n  ');

    return `INSERT INTO items (category_id, names, price, image_url, sort_order, is_active) VALUES \n  ${values};`;
  }

  async generate(csvPath) {
    await this.processCSV(csvPath);
    const sql = this.generateSQL();
    
    // Write to file
    fs.writeFileSync('remaining-items-import.sql', sql);
    console.log('✅ SQL file generated: remaining-items-import.sql');
    console.log(`📊 Generated SQL for ${this.items.length} remaining items`);
  }
}

// CLI usage
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log(`
Usage: node import-remaining-items.js <csv-file>

Example:
  node import-remaining-items.js "new Menu csv.csv"
    `);
    process.exit(1);
  }

  const csvPath = args[0];
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  const importer = new RemainingItemsImporter();
  await importer.generate(csvPath);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { RemainingItemsImporter };
