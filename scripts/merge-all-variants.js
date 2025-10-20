#!/usr/bin/env node

/**
 * Merge ALL size variants into single items with size options
 */

const fs = require('fs');

// Comprehensive list of all size variants to merge
const allVariants = [
  // Hot Drinks
  { base: 'Caramel Latte', category: 'Hot drinks', variants: [
    { size: 'Regular', price: 180 }, { size: 'Medium', price: 200 }
  ]},
  { base: 'Vanilla Latte', category: 'Hot drinks', variants: [
    { size: 'Regular', price: 160 }, { size: 'Medium', price: 180 }
  ]},
  { base: 'Filter Coffee', category: 'Hot drinks', variants: [
    { size: 'Regular', price: 140 }, { size: 'Medium', price: 160 }
  ]},
  { base: 'Filter Coffee with Milk', category: 'Hot drinks', variants: [
    { size: 'Regular', price: 160 }, { size: 'Medium', price: 180 }
  ]},
  { base: 'Flat White', category: 'Hot drinks', variants: [
    { size: 'Regular', price: 140 }, { size: 'Medium', price: 160 }
  ]},
  { base: 'Hot Chocolate', category: 'Hot drinks', variants: [
    { size: 'Regular', price: 200 }, { size: 'Medium', price: 220 }
  ]},
  { base: 'White Hot Chocolate', category: 'Hot drinks', variants: [
    { size: 'Regular', price: 200 }, { size: 'Medium', price: 220 }
  ]},
  { base: 'White Mocha Latte', category: 'Hot drinks', variants: [
    { size: 'Regular', price: 180 }, { size: 'Medium', price: 200 }
  ]},
  { base: 'Salted Caramel Latte', category: 'Hot drinks', variants: [
    { size: 'Regular', price: 180 }, { size: 'Medium', price: 200 }
  ]},
  { base: 'Spanish Latte', category: 'Hot drinks', variants: [
    { size: 'Regular', price: 180 }, { size: 'Medium', price: 200 }
  ]},
  { base: 'Toffee Nut Latte', category: 'Hot drinks', variants: [
    { size: 'Regular', price: 180 }, { size: 'Medium', price: 220 }
  ]},
  { base: 'Zebra Mocha', category: 'Hot drinks', variants: [
    { size: 'Regular', price: 200 }, { size: 'Medium', price: 220 }
  ]},
  { base: 'Piko Mocha', category: 'Hot drinks', variants: [
    { size: 'Regular', price: 200 }, { size: 'Medium', price: 220 }
  ]},
  { base: 'Cheese cake Latte', category: 'Hot drinks', variants: [
    { size: 'Regular', price: 200 }, { size: 'Medium', price: 220 }
  ]},
  { base: 'Butter scotch Latte', category: 'Hot drinks', variants: [
    { size: 'Regular', price: 180 }, { size: 'Medium', price: 200 }
  ]},
  { base: 'Chai Tea Latte', category: 'Hot drinks', variants: [
    { size: 'Regular', price: 180 }, { size: 'Medium', price: 200 }
  ]},
  { base: 'Strawberry mocha latte', category: 'Hot drinks', variants: [
    { size: 'Regular', price: 180 }, { size: 'Medium', price: 200 }
  ]},
  { base: 'V60', category: 'Hot drinks', variants: [
    { size: 'Regular', price: 195 }, { size: 'Medium', price: 220 }
  ]},

  // Cold Drinks
  { base: 'Iced Caramel Latte', category: 'Cold drinks', variants: [
    { size: 'Regular', price: 180 }, { size: 'Medium', price: 200 }, { size: 'Large', price: 220 }
  ]},
  { base: 'Iced Vanilla Latte', category: 'Cold drinks', variants: [
    { size: 'Regular', price: 180 }, { size: 'Medium', price: 200 }, { size: 'Large', price: 220 }
  ]},
  { base: 'Iced Filter Coffee', category: 'Cold drinks', variants: [
    { size: 'Regular', price: 125 }, { size: 'Medium', price: 130 }, { size: 'Large', price: 145 }
  ]},
  { base: 'Iced Filter Coffee with Milk', category: 'Cold drinks', variants: [
    { size: 'Regular', price: 140 }, { size: 'Medium', price: 160 }, { size: 'Large', price: 180 }
  ]},
  { base: 'Iced Caramel Latte', category: 'Cold drinks', variants: [
    { size: 'Regular', price: 180 }, { size: 'Medium', price: 200 }, { size: 'Large', price: 220 }
  ]},
  { base: 'Iced caramel macchiato', category: 'Cold drinks', variants: [
    { size: 'Regular', price: 180 }, { size: 'Medium', price: 200 }, { size: 'Large', price: 220 }
  ]},
  { base: 'Iced chai tea latte', category: 'Cold drinks', variants: [
    { size: 'Regular', price: 200 }, { size: 'Large', price: 240 }
  ]},
  { base: 'Iced Matcha latte', category: 'Cold drinks', variants: [
    { size: 'Regular', price: 190 }, { size: 'Medium', price: 220 }, { size: 'Large', price: 250 }
  ]},
  { base: 'Iced Pink matcha latte', category: 'Cold drinks', variants: [
    { size: 'Regular', price: 190 }, { size: 'Medium', price: 220 }, { size: 'Large', price: 250 }
  ]},
  { base: 'Iced Pink Perry matcha latta', category: 'Cold drinks', variants: [
    { size: 'Regular', price: 190 }, { size: 'Medium', price: 220 }, { size: 'Large', price: 250 }
  ]},
  { base: 'Iced Spanish Latte', category: 'Cold drinks', variants: [
    { size: 'Regular', price: 180 }, { size: 'Medium', price: 200 }, { size: 'Large', price: 220 }
  ]},
  { base: 'Iced Strawberry matcha latte', category: 'Cold drinks', variants: [
    { size: 'Regular', price: 190 }, { size: 'Medium', price: 220 }, { size: 'Large', price: 250 }
  ]},
  { base: 'Iced strawberry mocha', category: 'Cold drinks', variants: [
    { size: 'Regular', price: 200 }, { size: 'Medium', price: 220 }, { size: 'Large', price: 240 }
  ]},
  { base: 'Iced Salted Caramel Latte', category: 'Cold drinks', variants: [
    { size: 'Regular', price: 180 }, { size: 'Medium', price: 200 }, { size: 'Large', price: 220 }
  ]},
  { base: 'Iced Toffee Nut Latte', category: 'Cold drinks', variants: [
    { size: 'Regular', price: 180 }, { size: 'Medium', price: 220 }, { size: 'Large', price: 240 }
  ]},
  { base: 'Iced Zebra mocha latte', category: 'Cold drinks', variants: [
    { size: 'Regular', price: 200 }, { size: 'Medium', price: 220 }, { size: 'Large', price: 240 }
  ]},
  { base: 'Iced White Chocolate Mocha', category: 'Cold drinks', variants: [
    { size: 'Regular', price: 200 }, { size: 'Medium', price: 220 }, { size: 'Large', price: 240 }
  ]},
  { base: 'Cherry Blossom Iced Latte', category: 'Cold drinks', variants: [
    { size: 'Regular', price: 180 }, { size: 'Medium', price: 220 }, { size: 'Large', price: 240 }
  ]},
  { base: 'Caramel bubbles Iced Latte', category: 'Cold drinks', variants: [
    { size: 'Regular', price: 180 }, { size: 'Medium', price: 200 }, { size: 'Large', price: 220 }
  ]},
  { base: 'Coconut Iced Latte', category: 'Cold drinks', variants: [
    { size: 'Regular', price: 180 }, { size: 'Medium', price: 200 }, { size: 'Large', price: 220 }
  ]},
  { base: 'Iced butter scotch', category: 'Cold drinks', variants: [
    { size: 'Regular', price: 180 }, { size: 'Medium', price: 200 }, { size: 'Large', price: 220 }
  ]},
  { base: 'Iced piko latte', category: 'Cold drinks', variants: [
    { size: 'Regular', price: 200 }, { size: 'Medium', price: 220 }, { size: 'Large', price: 240 }
  ]},
  { base: 'Iced cheese cake latte', category: 'Cold drinks', variants: [
    { size: 'Regular', price: 200 }, { size: 'Medium', price: 220 }, { size: 'Large', price: 250 }
  ]},
  { base: 'Iced Pink Perry matcha latta', category: 'Cold drinks', variants: [
    { size: 'Regular', price: 190 }, { size: 'Medium', price: 220 }, { size: 'Large', price: 250 }
  ]},
  { base: 'Iced Pink matcha latte', category: 'Cold drinks', variants: [
    { size: 'Regular', price: 190 }, { size: 'Medium', price: 220 }, { size: 'Large', price: 250 }
  ]},
  { base: 'Iced Matcha latte', category: 'Cold drinks', variants: [
    { size: 'Regular', price: 190 }, { size: 'Medium', price: 220 }, { size: 'Large', price: 250 }
  ]},
  { base: 'Iced Mocha Latte', category: 'Cold drinks', variants: [
    { size: 'Regular', price: 200 }, { size: 'Medium', price: 220 }, { size: 'Large', price: 240 }
  ]},
  { base: 'Iced White Chocolate Mocha', category: 'Cold drinks', variants: [
    { size: 'Regular', price: 200 }, { size: 'Medium', price: 220 }, { size: 'Large', price: 240 }
  ]}
];

function generateAllMergeSQL() {
  let sql = '-- Merge ALL size variants into single items with size options\n\n';
  
  allVariants.forEach(variant => {
    const baseName = variant.base;
    const category = variant.category;
    const variants = variant.variants;
    
    sql += `-- Merge ${baseName} variants\n`;
    sql += `DELETE FROM items WHERE names->>'en' LIKE '${baseName}%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');\n`;
    sql += `DELETE FROM items WHERE names->>'en' = '${baseName}';\n\n`;
    
    sql += `INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (\n`;
    sql += `  (SELECT id FROM categories WHERE names->>'en' = '${category}'),\n`;
    sql += `  '{"en":"${baseName}","tr":"${baseName}","ar":"${baseName}"}',\n`;
    sql += `  ${variants[0].price}, -- Base price (smallest size)\n`;
    sql += `  NULL,\n`;
    sql += `  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = '${category}')),\n`;
    sql += `  true,\n`;
    sql += `  '${JSON.stringify(variants.map(v => ({ size: v.size, price: v.price })))}'::jsonb\n`;
    sql += `);\n\n`;
  });
  
  return sql;
}

// Generate the SQL
const mergeSQL = generateAllMergeSQL();

// Write to file
fs.writeFileSync('merge-all-variants.sql', mergeSQL);

console.log('📝 Generated merge-all-variants.sql');
console.log('📊 This will merge ALL size variants into single items with size options');
console.log('🔧 Review the SQL file and apply it to merge all variants');
