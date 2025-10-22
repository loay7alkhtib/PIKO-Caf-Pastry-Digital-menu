#!/usr/bin/env node

/**
 * Script to update the static menu JSON with images from the database
 * This ensures images work even in static mode
 */

const fs = require('fs');
const path = require('path');

// Database connection (using the same credentials as in supabase-credentials.ts)
const SUPABASE_URL = 'https://jppymhzgprvshurcqmdn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwcHltaHpncHJ2c2h1cmNxbWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODM0NzIsImV4cCI6MjA3NjY1OTQ3Mn0.SkAnsUjAgamEZxNBAXciJVSlAvWH4wji4lJrEYq-1uA';

const STATIC_MENU_PATH = path.join(__dirname, '../public/static/menu.json');

async function fetchFromSupabase(endpoint, params = {}) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${endpoint}`);
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function updateStaticMenuWithImages() {
  try {
    console.log('🔄 Fetching data from Supabase...');
    
    // Fetch categories with images
    const categories = await fetchFromSupabase('categories', {
      select: 'id,names,icon,color,image_url,image,order,created_at'
    });
    
    // Fetch items with images
    const items = await fetchFromSupabase('items', {
      select: 'id,names,category_id,price,image,tags,is_available,order,created_at,variants'
    });

    console.log(`📊 Found ${categories.length} categories and ${items.length} items`);
    console.log(`🖼️ Categories with images: ${categories.filter(c => c.image_url).length}`);
    console.log(`🖼️ Items with images: ${items.filter(i => i.image).length}`);

    // Read current static menu
    const staticMenuPath = STATIC_MENU_PATH;
    if (!fs.existsSync(staticMenuPath)) {
      throw new Error(`Static menu file not found at ${staticMenuPath}`);
    }

    const staticMenu = JSON.parse(fs.readFileSync(staticMenuPath, 'utf8'));
    console.log('📖 Loaded static menu');

    // Create mapping functions for ID conversion
    const mapStaticToDbCategoryId = (staticId) => `cat_${staticId.replace(/-/g, '_')}`;
    const mapDbToStaticCategoryId = (dbId) => dbId.replace('cat_', '').replace(/_/g, '-');
    
    // Update categories with images
    const updatedCategories = staticMenu.categories.map(staticCat => {
      const dbId = mapStaticToDbCategoryId(staticCat.id);
      const dbCat = categories.find(c => c.id === dbId);
      if (dbCat && dbCat.image_url) {
        console.log(`🖼️ Updating category ${staticCat.id} with image: ${dbCat.image_url}`);
        return {
          ...staticCat,
          image: dbCat.image_url
        };
      }
      return staticCat;
    });

    // Update items with images (match by name with fuzzy matching)
    const updatedItems = staticMenu.items.map(staticItem => {
      const staticName = staticItem.names?.en?.toLowerCase().trim();
      
      // Try exact match first
      let dbItem = items.find(i => {
        const dbName = i.names?.en?.toLowerCase().trim();
        return dbName === staticName;
      });
      
      // If no exact match, try fuzzy matching
      if (!dbItem) {
        dbItem = items.find(i => {
          const dbName = i.names?.en?.toLowerCase().trim();
          // Remove common words and try to match
          const cleanStatic = staticName.replace(/\b(medium|large|small|hot|iced|cold)\b/g, '').trim();
          const cleanDb = dbName.replace(/\b(medium|large|small|hot|iced|cold)\b/g, '').trim();
          return cleanDb === cleanStatic || 
                 cleanDb.includes(cleanStatic) || 
                 cleanStatic.includes(cleanDb);
        });
      }
      
      if (dbItem && dbItem.image) {
        console.log(`🖼️ Updating item "${staticItem.names?.en}" with image: ${dbItem.image}`);
        return {
          ...staticItem,
          image: dbItem.image
        };
      }
      return staticItem;
    });

    // Create updated menu
    const updatedMenu = {
      ...staticMenu,
      categories: updatedCategories,
      items: updatedItems,
      metadata: {
        ...staticMenu.metadata,
        lastUpdated: new Date().toISOString(),
        imagesUpdated: true,
        categoriesWithImages: updatedCategories.filter(c => c.image).length,
        itemsWithImages: updatedItems.filter(i => i.image).length
      }
    };

    // Write updated menu
    fs.writeFileSync(staticMenuPath, JSON.stringify(updatedMenu, null, 2));
    
    console.log('✅ Static menu updated successfully!');
    console.log(`📊 Categories with images: ${updatedCategories.filter(c => c.image).length}/${updatedCategories.length}`);
    console.log(`📊 Items with images: ${updatedItems.filter(i => i.image).length}/${updatedItems.length}`);
    
    // Create backup
    const backupPath = staticMenuPath.replace('.json', `-backup-${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(staticMenu, null, 2));
    console.log(`💾 Backup created at: ${backupPath}`);

  } catch (error) {
    console.error('❌ Error updating static menu:', error);
    process.exit(1);
  }
}

// Run the script
updateStaticMenuWithImages();
