#!/usr/bin/env node

/**
 * Update Category Images Script
 *
 * This script updates the database with the new category images
 * by matching items to their appropriate categories.
 */

const https = require('https');

// Supabase Configuration
const SUPABASE_URL = 'https://eoaissoqwlfvfizfomax.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvYWlzc29xd2xmdmZpemZvbWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTY5OTIsImV4cCI6MjA3NTMzMjk5Mn0.SHkFV9EvSnWVmC0tApVU6A6C1rrDqsPMO922rMC1JpY';

class CategoryImageUpdater {
  constructor() {
    this.categoryImages = {
      coffee:
        'https://eoaissoqwlfvfizfomax.supabase.co/storage/v1/object/public/menu-images/menu-items/coffee-category-image.svg',
      'iced-coffee':
        'https://eoaissoqwlfvfizfomax.supabase.co/storage/v1/object/public/menu-images/menu-items/iced-coffee-category-image.svg',
      waffles:
        'https://eoaissoqwlfvfizfomax.supabase.co/storage/v1/object/public/menu-images/menu-items/waffles-category-image.svg',
      crepes:
        'https://eoaissoqwlfvfizfomax.supabase.co/storage/v1/object/public/menu-images/menu-items/crepes-category-image.svg',
      cakes:
        'https://eoaissoqwlfvfizfomax.supabase.co/storage/v1/object/public/menu-images/menu-items/cakes-category-image.svg',
      drinks:
        'https://eoaissoqwlfvfizfomax.supabase.co/storage/v1/object/public/menu-images/menu-items/drinks-category-image.svg',
      smoothies:
        'https://eoaissoqwlfvfizfomax.supabase.co/storage/v1/object/public/menu-images/menu-items/smoothies-category-image.svg',
    };

    this.categoryPatterns = {
      coffee: [
        'اسبريسو',
        'امريكانو',
        'بترسكوتش',
        'بيكو',
        'بينك',
        'تشيز',
        'توفي',
        'دبل',
        'زيبرا',
        'سبانش',
        'ستروبيري',
        'سلتد',
        'شاي',
        'فانيليا',
        'فلات',
        'فلتر',
        'قهوة',
        'كابتشينو',
        'كراميل',
        'كورتادو',
        'لاتيه',
        'ماتشا',
        'موكا',
        'هوت',
        'وايت',
      ],
      'iced-coffee': ['ايس'],
      waffles: ['وافل'],
      crepes: ['كريب'],
      cakes: [
        'تشمني',
        'تشيز كيك',
        'تيراميسو',
        'فوندون',
        'كيكة',
        'بان كيك',
        'ميني',
      ],
      drinks: [
        'زنجبيل',
        'زهورات',
        'زيزفون',
        'سحلب',
        'شاي',
        'كول',
        'هيبسكوس',
        'ميلك شيك',
        'اوبرا',
        'كروسان',
        'كوكيز',
        'بينا',
      ],
      smoothies: ['موهيتو', 'سموزي'],
      juices: ['عصير'],
    };
  }

  /**
   * Make HTTP request to Supabase
   */
  makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, SUPABASE_URL);

      const requestOptions = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      };

      const req = https.request(requestOptions, res => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              success: true,
              data: data ? JSON.parse(data) : null,
              statusCode: res.statusCode,
            });
          } else {
            resolve({
              success: false,
              error: `HTTP ${res.statusCode}: ${data}`,
              statusCode: res.statusCode,
            });
          }
        });
      });

      req.on('error', error => {
        resolve({
          success: false,
          error: error.message,
        });
      });

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }

  /**
   * Get all items from database
   */
  async getAllItems() {
    try {
      console.log('🔍 Fetching all items from database...');

      const result = await this.makeRequest('/rest/v1/items?select=*', {
        method: 'GET',
      });

      if (!result.success) {
        console.error('❌ Failed to fetch items:', result.error);
        return [];
      }

      const items = result.data || [];
      console.log(`📋 Found ${items.length} items in database`);

      return items;
    } catch (error) {
      console.error('❌ Error fetching items:', error.message);
      return [];
    }
  }

  /**
   * Determine category for an item based on its Arabic name
   */
  determineCategory(arabicName) {
    const name = arabicName.toLowerCase();

    for (const [category, patterns] of Object.entries(this.categoryPatterns)) {
      for (const pattern of patterns) {
        if (name.includes(pattern.toLowerCase())) {
          return category;
        }
      }
    }

    return 'coffee'; // Default category
  }

  /**
   * Update item image URL
   */
  async updateItemImage(itemId, imageUrl) {
    try {
      const result = await this.makeRequest(`/rest/v1/items?id=eq.${itemId}`, {
        method: 'PATCH',
        headers: {
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          image_url: imageUrl,
        }),
      });

      if (result.success) {
        return true;
      } else {
        console.error(`❌ Failed to update item ${itemId}:`, result.error);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error updating item ${itemId}:`, error.message);
      return false;
    }
  }

  /**
   * Update all items with appropriate category images
   */
  async updateAllItems() {
    console.log('🎨 Updating all items with category-specific images...\n');

    try {
      const items = await this.getAllItems();

      if (items.length === 0) {
        console.log('❌ No items found in database');
        return;
      }

      const categoryCounts = {};
      let updatedCount = 0;
      let failedCount = 0;

      for (const item of items) {
        const arabicName = item.names?.ar || '';
        const category = this.determineCategory(arabicName);
        const imageUrl =
          this.categoryImages[category] || this.categoryImages['coffee'];

        console.log(`🔄 ${arabicName} → ${category} category`);

        const updated = await this.updateItemImage(item.id, imageUrl);

        if (updated) {
          updatedCount++;
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        } else {
          failedCount++;
        }

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      console.log(`\n📊 Update Summary:`);
      console.log(`✅ Updated: ${updatedCount} items`);
      console.log(`❌ Failed: ${failedCount} items`);

      console.log(`\n📊 Category Distribution:`);
      for (const [category, count] of Object.entries(categoryCounts)) {
        console.log(`   ${category}: ${count} items`);
      }

      console.log('\n🎉 Category images updated successfully!');
      console.log('\n📝 Next steps:');
      console.log('1. Refresh your browser to see the new category images');
      console.log('2. Each category now has a distinct colored background');
      console.log('3. You can replace these with actual product photos later');
    } catch (error) {
      console.error('❌ Update process failed:', error.message);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const updater = new CategoryImageUpdater();
  await updater.updateAllItems();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CategoryImageUpdater;
