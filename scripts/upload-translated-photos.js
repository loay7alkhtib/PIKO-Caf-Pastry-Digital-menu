#!/usr/bin/env node

/**
 * Upload Translated Photos Script
 * 
 * This script uses the translation mapping to upload photos with English names
 * and auto-match them with menu items for perfect alignment.
 */

const fs = require('fs').promises;
const path = require('path');

// Supabase Configuration
const SUPABASE_URL = 'https://eoaissoqwlfvfizfomax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvYWlzc29xd2xmdmZpemZvbWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTY5OTIsImV4cCI6MjA3NTMzMjk5Mn0.SHkFV9EvSnWVmC0tApVU6A6C1rrDqsPMO922rMC1JpY';

class TranslatedPhotoUploader {
  constructor() {
    this.photosFolder = path.join(__dirname, '..', 'Piko Web app Photos');
    this.mappingFile = path.join(__dirname, '..', 'photo-translation-mapping.json');
    this.translationMappings = new Map();
    this.uploadedPhotos = new Map();
  }

  /**
   * Load translation mappings from file
   */
  async loadTranslationMappings() {
    try {
      const mappingData = await fs.readFile(this.mappingFile, 'utf8');
      const mappings = JSON.parse(mappingData);
      
      console.log(`📄 Loaded translation mappings for ${mappings.translations.length} photos`);
      
      for (const translation of mappings.translations) {
        this.translationMappings.set(translation.originalName, translation);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to load translation mappings:', error.message);
      return false;
    }
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
   * Find best matching photo for an item
   */
  findMatchingPhoto(arabicName, englishTranslation, itemCategory) {
    const normalizedItemName = this.normalizeText(arabicName);
    const normalizedEnglish = this.normalizeText(englishTranslation);
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [originalName, translation] of this.translationMappings.entries()) {
      if (!translation.englishTranslation || translation.englishTranslation.trim() === '') {
        continue; // Skip photos without proper translations
      }
      
      const normalizedPhotoName = this.normalizeText(translation.englishTranslation);
      let score = 0;
      
      // Exact match gets highest score
      if (normalizedItemName === normalizedPhotoName || normalizedEnglish === normalizedPhotoName) {
        score = 100;
      }
      // Check if item name contains photo name or vice versa
      else if (normalizedItemName.includes(normalizedPhotoName) || normalizedPhotoName.includes(normalizedItemName)) {
        score = 80;
      }
      // Check word-by-word matching
      else {
        const itemWords = normalizedItemName.split(/[\s-]+/);
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
        bestMatch = translation;
      }
    }
    
    // Only return matches with reasonable confidence
    return bestScore >= 30 ? bestMatch : null;
  }

  /**
   * Upload all translated photos and match them with menu items
   */
  async uploadAndMatchPhotos() {
    console.log('📸 Starting translated photo upload and matching...\n');

    try {
      // Load translation mappings
      const mappingsLoaded = await this.loadTranslationMappings();
      if (!mappingsLoaded) {
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
      console.log('\n🔄 Uploading photos with English names...');
      for (const [originalName, translation] of this.translationMappings.entries()) {
        try {
          const photoPath = path.join(this.photosFolder, originalName);
          const imageBuffer = await fs.readFile(photoPath);
          
          const uploadResult = await this.uploadImageToSupabase(imageBuffer, translation.safeFilename);
          
          if (uploadResult.success) {
            this.uploadedPhotos.set(translation.safeFilename, uploadResult.url);
            uploadedCount++;
            console.log(`✅ Uploaded: ${originalName} → ${translation.safeFilename}`);
          } else {
            failedUploads++;
            console.error(`❌ Failed: ${originalName} - ${uploadResult.error}`);
          }
          
          // Small delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`❌ Error processing ${originalName}:`, error.message);
          failedUploads++;
        }
      }

      console.log(`\n📊 Upload Summary: ${uploadedCount} uploaded, ${failedUploads} failed`);

      // Now match photos with menu items
      console.log('\n🎯 Matching photos with menu items...');
      for (const item of items) {
        const arabicName = item.names?.ar || '';
        const englishName = item.names?.en || '';
        const categoryName = item.category_id || '';
        
        // Try to find matching photo
        const matchingPhoto = this.findMatchingPhoto(arabicName, englishName, categoryName);
        
        if (matchingPhoto && this.uploadedPhotos.has(matchingPhoto.safeFilename)) {
          const imageUrl = this.uploadedPhotos.get(matchingPhoto.safeFilename);
          
          console.log(`🎯 ${arabicName} → ${matchingPhoto.safeFilename}`);
          
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

      console.log('\n🎉 Translated photo upload and matching completed!');
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
  const uploader = new TranslatedPhotoUploader();
  await uploader.uploadAndMatchPhotos();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = TranslatedPhotoUploader;
