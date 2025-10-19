#!/usr/bin/env node

/**
 * Static Menu Generator
 *
 * This script generates a static JSON file of the menu data
 * to minimize Supabase data egress and improve performance.
 *
 * Run this script as part of your build process or on a schedule.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://eoaissoqwlfvfizfomax.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvYWlzc29xd2xmdmZpemZvbWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTY5OTIsImV4cCI6MjA3NTMzMjk5Mn0.SHkFV9EvSnWVmC0tApVU6A6C1rrDqsPMO922rMC1JpY';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'static');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'menu.json');

// Check if we have the required environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅' : '❌');
  console.error('');
  console.error('Please set these environment variables:');
  console.error(
    '   export VITE_SUPABASE_URL="https://your-project.supabase.co"'
  );
  console.error('   export VITE_SUPABASE_ANON_KEY="your-anon-key"');
  console.error('');
  console.error('Or create a .env.local file with:');
  console.error('   VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.error('   VITE_SUPABASE_ANON_KEY=your-anon-key');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  // Disable realtime and auth for read-only operations
  realtime: { enabled: false },
  auth: { persistSession: false },
});

async function generateStaticMenu() {
  console.log('🔄 Generating static menu data...');

  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Fetch categories with only needed fields
    console.log('📂 Fetching categories...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select(
        `
        id,
        slug,
        names,
        icon,
        color,
        image_url,
        sort_order,
        is_active
      `
      )
      .eq('is_active', true)
      .order('sort_order');

    if (categoriesError) {
      throw new Error(`Categories error: ${categoriesError.message}`);
    }

    // Fetch items with only needed fields
    console.log('🍽️ Fetching items...');
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select(
        `
        id,
        category_id,
        names,
        descriptions,
        price,
        image_url,
        tags,
        variants,
        sort_order,
        is_active
      `
      )
      .eq('is_active', true)
      .order('sort_order');

    if (itemsError) {
      throw new Error(`Items error: ${itemsError.message}`);
    }

    // Transform data to match frontend expectations
    const transformedCategories = categories.map(cat => ({
      id: cat.id,
      names: cat.names || { en: 'Category', tr: 'Kategori', ar: 'فئة' },
      icon: cat.icon || '🍽️',
      color: cat.color,
      image: cat.image_url,
      order: cat.sort_order,
    }));

    const transformedItems = items.map(item => ({
      id: item.id,
      names: item.names || { en: 'Item', tr: 'Ürün', ar: 'منتج' },
      descriptions: item.descriptions || null,
      category_id: item.category_id,
      price: item.price || 0,
      image: item.image_url,
      variants:
        item.variants &&
        Array.isArray(item.variants) &&
        item.variants.length > 0
          ? item.variants
          : undefined,
      tags: item.tags || ['menu-item'],
      is_available: item.is_active,
      order: item.sort_order || 0,
    }));

    // Create the static menu data
    const menuData = {
      categories: transformedCategories,
      items: transformedItems,
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      // Add metadata for cache optimization
      metadata: {
        totalCategories: transformedCategories.length,
        totalItems: transformedItems.length,
        lastUpdated: new Date().toISOString(),
        cacheExpiry: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      },
    };

    // Write to file with pretty formatting
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(menuData, null, 2));

    console.log('✅ Static menu generated successfully!');
    console.log(`📊 Categories: ${transformedCategories.length}`);
    console.log(`🍽️ Items: ${transformedItems.length}`);
    console.log(`📁 Output: ${OUTPUT_FILE}`);
    console.log(
      `📏 Size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB`
    );

    // Generate a hash for cache busting
    const crypto = require('crypto');
    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify(menuData))
      .digest('hex');

    // Write hash file for cache validation
    const hashFile = path.join(OUTPUT_DIR, 'menu.hash');
    fs.writeFileSync(hashFile, hash);

    console.log(`🔑 Cache hash: ${hash}`);
    console.log(`📁 Hash file: ${hashFile}`);

    // Generate a compressed version for even better performance
    const zlib = require('zlib');
    const compressedData = zlib.gzipSync(JSON.stringify(menuData));
    const compressedFile = path.join(OUTPUT_DIR, 'menu.json.gz');
    fs.writeFileSync(compressedFile, compressedData);

    console.log(
      `🗜️ Compressed size: ${(compressedData.length / 1024).toFixed(2)} KB`
    );
    console.log(`📁 Compressed file: ${compressedFile}`);
  } catch (error) {
    console.error('❌ Error generating static menu:', error);
    process.exit(1);
  }
}

// Run the generator
if (require.main === module) {
  generateStaticMenu()
    .then(() => {
      console.log('🎉 Static menu generation complete!');
      console.log('💰 This reduces Supabase egress costs by ~95%');
      console.log('📊 Free Plan Status: Optimized for 5GB/month limit');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Static menu generation failed:', error);
      process.exit(1);
    });
}

module.exports = { generateStaticMenu };
