#!/usr/bin/env node

/**
 * Upload Renamed Photos Script
 * 
 * This script uploads the renamed photos (with English translations)
 * and matches them with menu items based on their improved filenames.
 */

const fs = require('fs').promises;
const path = require('path');

// Supabase Configuration
const SUPABASE_URL = 'https://eoaissoqwlfvfizfomax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvYWlzc29xd2xmdmZpemZvbWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTY5OTIsImV4cCI6MjA3NTMzMjk5Mn0.SHkFV9EvSnWVmC0tApVU6A6C1rrDqsPMO922rMC1JpY';

class RenamedPhotoUploader {
  constructor() {
    this.photosFolder = path.join(__dirname, '..', 'Piko Web app Photos');
    this.uploadedPhotos = new Map();
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
        return { success: true, url: publicUrl, filename };
      } else {
        const errorText = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
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
   * Normalize text for matching
   */
  normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Keep only alphanumeric, spaces, and hyphens
      .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/-+/g, '-') // Normalize hyphens
      .trim();
  }

  /**
   * Extract English translation from filename
   */
  extractEnglishFromFilename(filename) {
    // Remove .jpg extension
    const nameWithoutExt = filename.replace('.jpg', '');
    
    // Split by hyphens and find English words (containing only a-z)
    const parts = nameWithoutExt.split('-');
    const englishParts = parts.filter(part => /^[a-z]+$/i.test(part));
    
    return englishParts.join('-');
  }

  /**
   * Find best matching photo for an item
   */
  findMatchingPhoto(arabicName, englishName, availablePhotos) {
    const normalizedItemName = this.normalizeText(arabicName);
    const normalizedEnglish = this.normalizeText(englishName);
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const photo of availablePhotos) {
      const englishFromPhoto = this.extractEnglishFromFilename(photo);
      const normalizedPhotoName = this.normalizeText(englishFromPhoto);
      
      let score = 0;
      
      // Exact match gets highest score
      if (normalizedEnglish === normalizedPhotoName) {
        score = 100;
      }
      // Check if item name contains photo name or vice versa
      else if (normalizedEnglish.includes(normalizedPhotoName) || normalizedPhotoName.includes(normalizedEnglish)) {
        score = 80;
      }
      // Check word-by-word matching
      else if (normalizedPhotoName) {
        const itemWords = normalizedEnglish.split(/[\s-]+/);
        const photoWords = normalizedPhotoName.split(/[\s-]+/);
        
        let matchingWords = 0;
        for (const itemWord of itemWords) {
          if (photoWords.some(photoWord => 
            itemWord.includes(photoWord) || photoWord.includes(itemWord)
          )) {
            matchingWords++;
          }
        }
        
        if (matchingWords > 0) {
          score = (matchingWords / Math.max(itemWords.length, photoWords.length)) * 60;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = photo;
      }
    }
    
    // Only return matches with reasonable confidence
    return bestScore >= 40 ? bestMatch : null;
  }

  /**
   * Upload renamed photos and match them with menu items
   */
  async uploadAndMatchPhotos() {
    console.log('📸 Starting renamed photo upload and matching...\n');

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
      
      console.log(`📁 Found ${jpgFiles.length} renamed photos`);
      
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

      // Upload photos first
      console.log('\n🔄 Uploading renamed photos to Supabase Storage...');
      for (const photoFile of jpgFiles) {
        try {
          const photoPath = path.join(this.photosFolder, photoFile);
          const imageBuffer = await fs.readFile(photoPath);
          
          // Create safe filename for storage
          const safeFilename = photoFile
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
          
          const uploadResult = await this.uploadImageToSupabase(imageBuffer, safeFilename);
          
          if (uploadResult.success) {
            this.uploadedPhotos.set(photoFile, uploadResult.url);
            uploadedCount++;
            console.log(`✅ Uploaded: ${photoFile} → ${safeFilename}`);
          } else {
            failedUploads++;
            console.error(`❌ Failed: ${photoFile} - ${uploadResult.error}`);
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
        const englishName = item.names?.en || '';
        
        // Try to find matching photo
        const matchingPhoto = this.findMatchingPhoto(arabicName, englishName, jpgFiles);
        
        if (matchingPhoto && this.uploadedPhotos.has(matchingPhoto)) {
          const imageUrl = this.uploadedPhotos.get(matchingPhoto);
          
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

      console.log('\n🎉 Renamed photo upload and matching completed!');
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
  const uploader = new RenamedPhotoUploader();
  await uploader.uploadAndMatchPhotos();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = RenamedPhotoUploader;
