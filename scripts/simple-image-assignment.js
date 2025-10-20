#!/usr/bin/env node

/**
 * Simple Image Assignment Script
 * 
 * This script assigns the existing uploaded images to all menu items
 * by cycling through available images.
 */

// Supabase Configuration
const SUPABASE_URL = 'https://eoaissoqwlfvfizfomax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvYWlzc29xd2xmdmZpemZvbWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTY5OTIsImV4cCI6MjA3NTMzMjk5Mn0.SHkFV9EvSnWVmC0tApVU6A6C1rrDqsPMO922rMC1JpY';

class SimpleImageAssigner {
  constructor() {
    this.availableImages = [];
    this.imageIndex = 0;
  }

  /**
   * Get all items from database
   */
  async getAllItems() {
    try {
      console.log('🔍 Fetching all items from database...');
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/items?select=*`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const items = await response.json();
        console.log(`📋 Found ${items.length} items in database`);
        return items;
      } else {
        console.error('❌ Failed to fetch items:', response.status, await response.text());
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching items:', error.message);
      return [];
    }
  }

  /**
   * Get all available images from storage
   */
  async getAvailableImages() {
    try {
      console.log('🔍 Fetching available images from storage...');
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/storage/objects/bucket/menu-images`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        }
      });

      if (response.ok) {
        const images = await response.json();
        console.log(`📸 Found ${images.length} available images`);
        
        // Filter to only include items folder images
        const itemImages = images.filter(img => img.name.startsWith('items/'));
        console.log(`📸 Found ${itemImages.length} item images`);
        
        this.availableImages = itemImages;
        return itemImages;
      } else {
        console.error('❌ Failed to fetch images:', response.status, await response.text());
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching images:', error.message);
      return [];
    }
  }

  /**
   * Update item image URL in database
   */
  async updateItemImage(itemId, imageUrl) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/items?id=eq.${itemId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          image_url: imageUrl
        })
      });

      return response.ok;
    } catch (error) {
      console.error(`❌ Error updating item ${itemId}:`, error.message);
      return false;
    }
  }

  /**
   * Get next image URL (cycling through available images)
   */
  getNextImageUrl() {
    if (this.availableImages.length === 0) {
      return null;
    }
    
    const image = this.availableImages[this.imageIndex % this.availableImages.length];
    this.imageIndex++;
    
    return `${SUPABASE_URL}/storage/v1/object/public/menu-images/${image.name}`;
  }

  /**
   * Perform simple image assignment
   */
  async performSimpleAssignment() {
    console.log('🎯 Starting simple image assignment...\n');

    try {
      // Get all items and available images
      const [items, images] = await Promise.all([
        this.getAllItems(),
        this.getAvailableImages()
      ]);

      if (items.length === 0) {
        console.log('❌ No items found');
        return;
      }

      if (images.length === 0) {
        console.log('❌ No images found');
        return;
      }

      let assignedCount = 0;
      let failedCount = 0;

      // Assign images to menu items
      console.log('\n🎯 Assigning images to menu items...');
      for (const item of items) {
        const arabicName = item.names?.ar || '';
        const imageUrl = this.getNextImageUrl();
        
        if (imageUrl) {
          console.log(`🎯 ${arabicName} → ${imageUrl.split('/').pop()}`);
          
          const updated = await this.updateItemImage(item.id, imageUrl);
          
          if (updated) {
            assignedCount++;
          } else {
            failedCount++;
          }
          
          // Small delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      console.log(`\n📊 Final Results:`);
      console.log(`🎯 Items assigned: ${assignedCount}`);
      console.log(`❌ Failed assignments: ${failedCount}`);
      console.log(`📸 Images used: ${this.availableImages.length}`);

      console.log('\n🎉 Simple image assignment completed!');
      console.log('\n📝 Next steps:');
      console.log('1. Refresh your browser to see the assigned photos');
      console.log('2. Each item should now display an image');
      console.log('3. Images are cycled through available photos');

    } catch (error) {
      console.error('❌ Simple assignment process failed:', error.message);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const assigner = new SimpleImageAssigner();
  await assigner.performSimpleAssignment();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SimpleImageAssigner;
