#!/usr/bin/env node

/**
 * Analyze CSV to find missing items
 */

const fs = require('fs');
const csv = require('csv-parser');

async function analyzeCSV() {
  const csvPath = 'new Menu csv.csv';
  const items = [];
  let lineNumber = 0;
  let skippedItems = 0;
  let zeroPriceItems = 0;
  let emptyNameItems = 0;

  return new Promise((resolve, reject) => {
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
          skippedItems++;
          return;
        }
        
        const arabicName = row['اسم المادة'].trim();
        const price = parseFloat(row['السعر']) || 0;
        const turkishName = row['الاسم التركي'].trim();
        const englishName = row['الاسم اللاتيني'].trim();
        const arabicCategory = row['اسم المجموعة'].trim();
        const englishCategory = row['اسم المجموعة اللاتيني'].trim();
        
        if (price === 0) {
          zeroPriceItems++;
          console.log(`⚠️  Zero price item: ${arabicName}`);
        }
        
        if (!arabicName || arabicName === '') {
          emptyNameItems++;
          console.log(`⚠️  Empty name item at line ${lineNumber}`);
        }
        
        items.push({
          line: lineNumber,
          arabicName,
          price,
          turkishName,
          englishName,
          arabicCategory,
          englishCategory
        });
      })
      .on('end', () => {
        console.log(`📊 CSV Analysis Results:`);
        console.log(`Total lines processed: ${lineNumber}`);
        console.log(`Valid items: ${items.length}`);
        console.log(`Skipped items: ${skippedItems}`);
        console.log(`Zero price items: ${zeroPriceItems}`);
        console.log(`Empty name items: ${emptyNameItems}`);
        
        console.log(`\n📋 Category breakdown:`);
        const categoryCount = {};
        items.forEach(item => {
          const category = item.englishCategory || item.arabicCategory;
          categoryCount[category] = (categoryCount[category] || 0) + 1;
        });
        
        Object.entries(categoryCount).forEach(([category, count]) => {
          console.log(`  - ${category}: ${count} items`);
        });
        
        console.log(`\n🔍 Sample items with zero price:`);
        items.filter(item => item.price === 0).slice(0, 5).forEach(item => {
          console.log(`  - ${item.arabicName} (${item.englishName}) - ${item.price} TL`);
        });
        
        resolve();
      })
      .on('error', reject);
  });
}

analyzeCSV().catch(console.error);
