#!/usr/bin/env node

/**
 * Cleanup Old Images and Re-match Script
 * 
 * This script deletes old placeholder images and ensures proper matching
 * with the new translated images we uploaded.
 */

const https = require('https');

// Supabase Configuration
const SUPABASE_URL = 'https://eoaissoqwlfvfizfomax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvYWlzc29xd2xmdmZpemZvbWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTY5OTIsImV4cCI6MjA3NTMzMjk5Mn0.SHkFV9EvSnWVmC0tApVU6A6C1rrDqsPMO922rMC1JpY';

class ImageCleanupAndRematch {
  constructor() {
    this.oldImagePatterns = [
      /^menu-items\/image-\d+\.jpg$/,
      /^menu-items\/60-\d+\.jpg$/,
      /^menu-items\/\d+-\d+\.jpg$/
    ];
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
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          ...options.headers
        }
      };

      const req = https.request(requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              success: true,
              data: data ? JSON.parse(data) : null,
              statusCode: res.statusCode
            });
          } else {
            resolve({
              success: false,
              error: `HTTP ${res.statusCode}: ${data}`,
              statusCode: res.statusCode
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({
          success: false,
          error: error.message
        });
      });

      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }

  /**
   * Get all images from Supabase Storage
   */
  async getAllImages() {
    try {
      console.log('🔍 Fetching all images from Supabase Storage...');
      
      const result = await this.makeRequest('/storage/v1/object/list/menu-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prefix: 'menu-items/',
          limit: 1000
        })
      });

      if (!result.success) {
        console.error('❌ Failed to fetch images:', result.error);
        return [];
      }

      const images = result.data || [];
      console.log(`📸 Found ${images.length} total images`);
      
      return images;
    } catch (error) {
      console.error('❌ Error fetching images:', error.message);
      return [];
    }
  }

  /**
   * Check if an image is an old placeholder image
   */
  isOldImage(imageName) {
    return this.oldImagePatterns.some(pattern => pattern.test(imageName));
  }

  /**
   * Delete an image from Supabase Storage
   */
  async deleteImage(imageName) {
    try {
      const result = await this.makeRequest(`/storage/v1/object/menu-images/${imageName}`, {
        method: 'DELETE'
      });

      if (result.success) {
        console.log(`✅ Deleted: ${imageName}`);
        return true;
      } else {
        console.error(`❌ Failed to delete ${imageName}:`, result.error);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error deleting ${imageName}:`, error.message);
      return false;
    }
  }

  /**
   * Get items from database
   */
  async getDatabaseItems() {
    try {
      console.log('🔍 Fetching items from database...');
      
      const result = await this.makeRequest('/rest/v1/items?select=*', {
        method: 'GET'
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
   * Update item image URL in database
   */
  async updateItemImage(itemId, newImageUrl) {
    try {
      const result = await this.makeRequest(`/rest/v1/items?id=eq.${itemId}`, {
        method: 'PATCH',
        headers: {
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          image_url: newImageUrl
        })
      });

      if (result.success) {
        console.log(`✅ Updated item ${itemId} with new image`);
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
   * Clean up old images and ensure proper matching
   */
  async cleanupAndRematch() {
    console.log('🚀 Starting image cleanup and re-matching...\n');

    try {
      // Get all images and database items
      const [allImages, dbItems] = await Promise.all([
        this.getAllImages(),
        this.getDatabaseItems()
      ]);

      // Separate old and new images
      const oldImages = allImages.filter(img => this.isOldImage(img.name));
      const newImages = allImages.filter(img => !this.isOldImage(img.name));

      console.log(`📊 Image Analysis:`);
      console.log(`   Old placeholder images: ${oldImages.length}`);
      console.log(`   New translated images: ${newImages.length}`);

      // Delete old images
      if (oldImages.length > 0) {
        console.log('\n🗑️ Deleting old placeholder images...');
        let deletedCount = 0;
        
        for (const oldImage of oldImages) {
          const deleted = await this.deleteImage(oldImage.name);
          if (deleted) deletedCount++;
          
          // Small delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`✅ Deleted ${deletedCount}/${oldImages.length} old images`);
      }

      // Check if we have new translated images
      if (newImages.length === 0) {
        console.log('\n⚠️ No new translated images found. Uploading fresh set...');
        await this.uploadFreshImages();
      }

      // Verify database items have proper image URLs
      console.log('\n🔄 Verifying database image URLs...');
      let updatedCount = 0;
      
      for (const item of dbItems) {
        // Check if item has a proper translated image URL
        const hasTranslatedImage = item.image_url && 
          (item.image_url.includes('coffee-') || 
           item.image_url.includes('iced-coffee-') ||
           item.image_url.includes('waffles-') ||
           item.image_url.includes('crepes-') ||
           item.image_url.includes('cakes-') ||
           item.image_url.includes('drinks-') ||
           item.image_url.includes('smoothies-'));

        if (!hasTranslatedImage) {
          // Assign a default translated image based on item name
          const arabicName = item.names?.ar || '';
          const newImageUrl = this.generateDefaultImageUrl(arabicName);
          
          if (newImageUrl) {
            await this.updateItemImage(item.id, newImageUrl);
            updatedCount++;
          }
        }
      }

      console.log(`✅ Updated ${updatedCount} items with proper image URLs`);

      console.log('\n🎉 Cleanup and re-matching completed!');
      console.log('\n📝 Summary:');
      console.log(`   🗑️ Old images deleted: ${oldImages.length}`);
      console.log(`   📸 New images available: ${newImages.length}`);
      console.log(`   🔄 Database items updated: ${updatedCount}`);

    } catch (error) {
      console.error('❌ Cleanup process failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Generate default image URL based on Arabic name
   */
  generateDefaultImageUrl(arabicName) {
    const name = arabicName.toLowerCase();
    
    // Map to appropriate image categories
    if (name.includes('كريب') || name.includes('crepe')) {
      return `${SUPABASE_URL}/storage/v1/object/public/menu-images/menu-items/crepes-crepe-4.jpg`;
    } else if (name.includes('وافل') || name.includes('waffle')) {
      return `${SUPABASE_URL}/storage/v1/object/public/menu-images/menu-items/waffles-waffle-3.jpg`;
    } else if (name.includes('كيك') || name.includes('cake')) {
      return `${SUPABASE_URL}/storage/v1/object/public/menu-images/menu-items/cakes-cake-5.jpg`;
    } else if (name.includes('ايس') || name.includes('iced')) {
      return `${SUPABASE_URL}/storage/v1/object/public/menu-images/menu-items/iced-coffee-iced-latte-2.jpg`;
    } else if (name.includes('موهيتو') || name.includes('سموزي') || name.includes('smoothie')) {
      return `${SUPABASE_URL}/storage/v1/object/public/menu-images/menu-items/smoothies-smoothie-7.jpg`;
    } else if (name.includes('عصير') || name.includes('juice')) {
      return `${SUPABASE_URL}/storage/v1/object/public/menu-images/menu-items/iced-coffee-juice-orange-2.jpg`;
    } else {
      // Default to coffee image
      return `${SUPABASE_URL}/storage/v1/object/public/menu-images/menu-items/coffee-latte-1.jpg`;
    }
  }

  /**
   * Upload fresh set of translated images if needed
   */
  async uploadFreshImages() {
    console.log('📤 Uploading fresh set of translated images...');
    
    // Run the upload translated images script
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
      const child = spawn('node', ['scripts/upload-translated-images.js'], {
        cwd: process.cwd(),
        stdio: 'inherit'
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Fresh images uploaded successfully');
          resolve();
        } else {
          console.error('❌ Failed to upload fresh images');
          reject(new Error(`Upload process exited with code ${code}`));
        }
      });
    });
  }
}

// Main execution
async function main() {
  const cleanup = new ImageCleanupAndRematch();
  await cleanup.cleanupAndRematch();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ImageCleanupAndRematch;
