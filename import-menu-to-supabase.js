#!/usr/bin/env node

/**
 * Import Menu Data to Supabase
 * This script imports your static menu data into your new Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function importMenuData() {
  try {
    console.log('🚀 Starting menu data import...');
    
    // Read the static menu data
    const menuPath = path.join(__dirname, 'public', 'static', 'menu.json');
    const menuData = JSON.parse(fs.readFileSync(menuPath, 'utf8'));
    
    console.log(`📊 Found ${menuData.categories?.length || 0} categories and ${menuData.items?.length || 0} items`);
    
    // Import categories
    if (menuData.categories && menuData.categories.length > 0) {
      console.log('📁 Importing categories...');
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .upsert(menuData.categories, { onConflict: 'id' });
      
      if (categoriesError) {
        console.error('❌ Error importing categories:', categoriesError);
        return;
      }
      console.log(`✅ Imported ${menuData.categories.length} categories`);
    }
    
    // Import items
    if (menuData.items && menuData.items.length > 0) {
      console.log('🍽️ Importing items...');
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .upsert(menuData.items, { onConflict: 'id' });
      
      if (itemsError) {
        console.error('❌ Error importing items:', itemsError);
        return;
      }
      console.log(`✅ Imported ${menuData.items.length} items`);
    }
    
    console.log('🎉 Menu data import completed successfully!');
    console.log('🔗 You can now access the admin panel with full editing capabilities');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the import
importMenuData();
