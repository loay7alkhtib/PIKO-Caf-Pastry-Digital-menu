#!/usr/bin/env node

/**
 * Merge size variants into single items with size options
 */

const fs = require('fs');

// Define size variant patterns to merge
const sizeVariants = [
  {
    baseName: 'Americano',
    variants: [
      { size: 'Regular', price: 120, suffix: '' },
      { size: 'Medium', price: 140, suffix: ' Medium' },
      { size: 'Large', price: 170, suffix: ' Large' }
    ]
  },
  {
    baseName: 'Iced Americano',
    variants: [
      { size: 'Regular', price: 130, suffix: '' },
      { size: 'Medium', price: 150, suffix: ' medium' },
      { size: 'Large', price: 170, suffix: ' large' }
    ]
  },
  {
    baseName: 'Latte',
    variants: [
      { size: 'Regular', price: 140, suffix: '' },
      { size: 'Medium', price: 160, suffix: ' Medium' },
      { size: 'Large', price: 200, suffix: ' Large' }
    ]
  },
  {
    baseName: 'Iced Latte',
    variants: [
      { size: 'Regular', price: 160, suffix: '' },
      { size: 'Medium', price: 180, suffix: ' Medium' },
      { size: 'Large', price: 200, suffix: ' Large' }
    ]
  },
  {
    baseName: 'Cappuccino',
    variants: [
      { size: 'Regular', price: 140, suffix: '' },
      { size: 'Medium', price: 160, suffix: ' Medium' },
      { size: 'Large', price: 180, suffix: ' Large' }
    ]
  },
  {
    baseName: 'Mocha Latte',
    variants: [
      { size: 'Regular', price: 180, suffix: '' },
      { size: 'Medium', price: 200, suffix: ' Medium' },
      { size: 'Large', price: 240, suffix: ' Large' }
    ]
  },
  {
    baseName: 'Iced Mocha Latte',
    variants: [
      { size: 'Regular', price: 200, suffix: '' },
      { size: 'Medium', price: 220, suffix: ' Medium' },
      { size: 'Large', price: 240, suffix: ' Large' }
    ]
  },
  {
    baseName: 'Caramel Latte',
    variants: [
      { size: 'Regular', price: 180, suffix: '' },
      { size: 'Medium', price: 200, suffix: ' Medium' },
      { size: 'Large', price: 220, suffix: ' Large' }
    ]
  },
  {
    baseName: 'Iced Caramel Latte',
    variants: [
      { size: 'Regular', price: 180, suffix: '' },
      { size: 'Medium', price: 200, suffix: ' Medium' },
      { size: 'Large', price: 220, suffix: ' Large' }
    ]
  },
  {
    baseName: 'Vanilla Latte',
    variants: [
      { size: 'Regular', price: 160, suffix: '' },
      { size: 'Medium', price: 180, suffix: ' Medium' },
      { size: 'Large', price: 220, suffix: ' Large' }
    ]
  },
  {
    baseName: 'Iced Vanilla Latte',
    variants: [
      { size: 'Regular', price: 180, suffix: '' },
      { size: 'Medium', price: 200, suffix: ' Medium' },
      { size: 'Large', price: 220, suffix: ' Large' }
    ]
  },
  {
    baseName: 'Filter Coffee',
    variants: [
      { size: 'Regular', price: 140, suffix: '' },
      { size: 'Medium', price: 160, suffix: ' Medium' },
      { size: 'Large', price: 180, suffix: ' Large' }
    ]
  },
  {
    baseName: 'Iced Filter Coffee',
    variants: [
      { size: 'Regular', price: 125, suffix: '' },
      { size: 'Medium', price: 130, suffix: ' Medium' },
      { size: 'Large', price: 145, suffix: ' Large' }
    ]
  },
  {
    baseName: 'Filter Coffee with Milk',
    variants: [
      { size: 'Regular', price: 160, suffix: '' },
      { size: 'Medium', price: 180, suffix: ' Medium' },
      { size: 'Large', price: 220, suffix: ' Large' }
    ]
  },
  {
    baseName: 'Iced Filter Coffee with Milk',
    variants: [
      { size: 'Regular', price: 140, suffix: '' },
      { size: 'Medium', price: 160, suffix: ' Medium' },
      { size: 'Large', price: 180, suffix: ' Large' }
    ]
  }
];

function generateMergeSQL() {
  let sql = '';
  
  sizeVariants.forEach(variant => {
    const baseName = variant.baseName;
    const variants = variant.variants;
    
    // Create the base item with size variants
    sql += `-- Merge ${baseName} variants\n`;
    sql += `-- First, delete the existing variants\n`;
    
    variants.forEach(v => {
      const fullName = baseName + v.suffix;
      sql += `DELETE FROM items WHERE names->>'en' = '${fullName}';\n`;
    });
    
    // Insert the merged item with size variants
    sql += `INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (\n`;
    sql += `  (SELECT id FROM categories WHERE names->>'en' = '${baseName.includes('Iced') ? 'Cold drinks' : 'Hot drinks'}'),\n`;
    sql += `  '{"en":"${baseName}","tr":"${baseName}","ar":"${baseName}"}',\n`;
    sql += `  ${variants[0].price}, -- Base price (smallest size)\n`;
    sql += `  NULL,\n`;
    sql += `  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = '${baseName.includes('Iced') ? 'Cold drinks' : 'Hot drinks'}')),\n`;
    sql += `  true,\n`;
    sql += `  '${JSON.stringify(variants.map(v => ({ size: v.size, price: v.price })))}'::jsonb\n`;
    sql += `);\n\n`;
  });
  
  return sql;
}

// Generate the SQL
const mergeSQL = generateMergeSQL();

// Write to file
fs.writeFileSync('merge-size-variants.sql', mergeSQL);

console.log('📝 Generated merge-size-variants.sql');
console.log('📊 This will merge size variants into single items with size options');
console.log('🔧 Review the SQL file and apply it to merge the variants');
