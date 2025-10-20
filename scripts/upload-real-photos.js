#!/usr/bin/env node

/**
 * Upload Real Photos Script
 * 
 * This script uploads the actual photos from the "Piko Web app Photos" folder
 * and matches them with menu items based on their Arabic names.
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// Supabase Configuration
const SUPABASE_URL = 'https://eoaissoqwlfvfizfomax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvYWlzc29xd2xmdmZpemZvbWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTY5OTIsImV4cCI6MjA3NTMzMjk5Mn0.SHkFV9EvSnWVmC0tApVU6A6C1rrDqsPMO922rMC1JpY';

class RealPhotosUploader {
  constructor() {
    this.photosFolder = path.join(__dirname, '..', 'Piko Web app Photos');
    this.uploadedImages = new Map(); // Store uploaded images with their URLs
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
   * Upload image to Supabase Storage
   */
  async uploadImageToSupabase(imageBuffer, filename) {
    try {
      const formData = new FormData();
      const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
      formData.append('file', blob, filename);
      const filePath = `menu-items/${filename}`;

      const response = await fetch(`${SUPABASE_URL}/storage/v1/object/menu-images/${filePath}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: formData
      });

      if (response.ok) {
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/menu-images/${filePath}`;
        console.log(`✅ Uploaded: ${filename}`);
        return { success: true, url: publicUrl };
      } else {
        const errorText = await response.text();
        console.error(`❌ Failed to upload ${filename}: ${response.status} ${errorText}`);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }
    } catch (error) {
      console.error(`❌ Error uploading ${filename}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all items from database
   */
  async getAllItems() {
    try {
      console.log('🔍 Fetching all items from database...');
      
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
  async updateItemImage(itemId, imageUrl) {
    try {
      const result = await this.makeRequest(`/rest/v1/items?id=eq.${itemId}`, {
        method: 'PATCH',
        headers: {
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          image_url: imageUrl
        })
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
   * Normalize Arabic text for matching
   */
  normalizeArabicText(text) {
    return text
      .replace(/[\u064B-\u0652\u0670\u0640]/g, '') // Remove diacritics
      .replace(/[أإآ]/g, 'ا') // Normalize alef variants
      .replace(/[ة]/g, 'ه') // Normalize teh marbuta
      .replace(/[ي]/g, 'ي') // Normalize yeh
      .trim()
      .toLowerCase();
  }

  /**
   * Find best matching photo for an item
   */
  findMatchingPhoto(arabicName, availablePhotos) {
    const normalizedItemName = this.normalizeArabicText(arabicName);
    
    // Try exact match first
    for (const photo of availablePhotos) {
      const photoName = path.basename(photo, '.jpg');
      const normalizedPhotoName = this.normalizeArabicText(photoName);
      
      if (normalizedItemName === normalizedPhotoName) {
        return photo;
      }
    }
    
    // Try partial matches
    for (const photo of availablePhotos) {
      const photoName = path.basename(photo, '.jpg');
      const normalizedPhotoName = this.normalizeArabicText(photoName);
      
      // Check if item name contains photo name or vice versa
      if (normalizedItemName.includes(normalizedPhotoName) || 
          normalizedPhotoName.includes(normalizedItemName)) {
        return photo;
      }
    }
    
    // Try word-by-word matching
    const itemWords = normalizedItemName.split(/\s+/);
    for (const photo of availablePhotos) {
      const photoName = path.basename(photo, '.jpg');
      const normalizedPhotoName = this.normalizeArabicText(photoName);
      const photoWords = normalizedPhotoName.split(/\s+/);
      
      // Check if most words match
      let matchingWords = 0;
      for (const itemWord of itemWords) {
        if (photoWords.some(photoWord => 
          itemWord.includes(photoWord) || photoWord.includes(itemWord)
        )) {
          matchingWords++;
        }
      }
      
      if (matchingWords >= Math.min(itemWords.length, photoWords.length) * 0.6) {
        return photo;
      }
    }
    
    return null;
  }

  /**
   * Upload all photos and match them with menu items
   */
  async uploadAndMatchPhotos() {
    console.log('📸 Starting real photos upload and matching...\n');

    try {
      // Check if photos folder exists
      try {
        await fs.access(this.photosFolder);
      } catch (error) {
        console.error(`❌ Photos folder not found: ${this.photosFolder}`);
        return;
      }

      // Get all photo files
      const photoFiles = await fs.readdir(this.photosFolder);
      const jpgFiles = photoFiles.filter(file => file.toLowerCase().endsWith('.jpg'));
      
      console.log(`📁 Found ${jpgFiles.length} photos in folder`);
      
      if (jpgFiles.length === 0) {
        console.log('❌ No JPG files found in photos folder');
        return;
      }

      // Get all menu items
      const items = await this.getAllItems();
      
      if (items.length === 0) {
        console.log('❌ No items found in database');
        return;
      }

      let uploadedCount = 0;
      let matchedCount = 0;
      let failedUploads = 0;
      let unmatchedItems = 0;

      // Upload all photos first
      console.log('\n🔄 Uploading photos to Supabase Storage...');
      for (const photoFile of jpgFiles) {
        try {
          const photoPath = path.join(this.photosFolder, photoFile);
          const imageBuffer = await fs.readFile(photoPath);
          
          // Create safe filename
          const safeFilename = photoFile.replace(/[^a-zA-Z0-9.-]/g, '_');
          
          const uploadResult = await this.uploadImageToSupabase(imageBuffer, safeFilename);
          
          if (uploadResult.success) {
            this.uploadedImages.set(photoFile, uploadResult.url);
            uploadedCount++;
          } else {
            failedUploads++;
          }
          
          // Small delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`❌ Error processing ${photoFile}:`, error.message);
          failedUploads++;
        }
      }

      console.log(`\n📊 Upload Summary: ${uploadedCount} uploaded, ${failedUploads} failed`);

      // Now match photos with menu items
      console.log('\n🎯 Matching photos with menu items...');
      for (const item of items) {
        const arabicName = item.names?.ar || '';
        const matchingPhoto = this.findMatchingPhoto(arabicName, jpgFiles);
        
        if (matchingPhoto && this.uploadedImages.has(matchingPhoto)) {
          const imageUrl = this.uploadedImages.get(matchingPhoto);
          
          console.log(`🎯 ${arabicName} → ${matchingPhoto}`);
          
          const updated = await this.updateItemImage(item.id, imageUrl);
          
          if (updated) {
            matchedCount++;
          }
          
          // Small delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 50));
        } else {
          console.log(`❌ No match found for: ${arabicName}`);
          unmatchedItems++;
        }
      }

      console.log(`\n📊 Final Results:`);
      console.log(`✅ Photos uploaded: ${uploadedCount}`);
      console.log(`🎯 Items matched: ${matchedCount}`);
      console.log(`❌ Upload failures: ${failedUploads}`);
      console.log(`❌ Unmatched items: ${unmatchedItems}`);

      console.log('\n🎉 Real photos upload and matching completed!');
      console.log('\n📝 Next steps:');
      console.log('1. Refresh your browser to see the actual photos');
      console.log('2. Each item should now display its real uploaded photo');
      console.log('3. Check the admin panel to verify the images are correct');

    } catch (error) {
      console.error('❌ Upload and matching process failed:', error.message);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const uploader = new RealPhotosUploader();
  await uploader.uploadAndMatchPhotos();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = RealPhotosUploader;
