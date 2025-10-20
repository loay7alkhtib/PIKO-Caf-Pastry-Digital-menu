#!/usr/bin/env node

/**
 * Upload Translated Images Script
 * 
 * This script uploads images with translated English names
 * based on the mapping created by translate-and-rename-images.js
 */

const fs = require('fs').promises;
const https = require('https');

// Supabase Configuration
const SUPABASE_URL = 'https://eoaissoqwlfvfizfomax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvYWlzc29xd2xmdmZpemZvbWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTY5OTIsImV4cCI6MjA3NTMzMjk5Mn0.SHkFV9EvSnWVmC0tApVU6A6C1rrDqsPMO922rMC1JpY';

class TranslatedImageUploader {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.limit = options.limit || null; // Limit number of uploads for testing
  }

  /**
   * Download the source image
   */
  async downloadSourceImage() {
    try {
      const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/menu-images/menu-items/60-1760989347404.jpg`;
      
      console.log('📥 Downloading source image...');
      
      return new Promise((resolve, reject) => {
        https.get(imageUrl, (response) => {
          if (response.statusCode === 200) {
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => {
              console.log('✅ Source image downloaded successfully');
              resolve(Buffer.concat(chunks));
            });
          } else {
            reject(new Error(`Failed to download source image: ${response.statusCode}`));
          }
        }).on('error', reject);
      });
    } catch (error) {
      console.error('❌ Error downloading source image:', error.message);
      throw error;
    }
  }

  /**
   * Upload image with new name to Supabase Storage
   */
  async uploadImageWithNewName(imageBuffer, newFilename) {
    if (this.dryRun) {
      console.log(`🔍 [DRY RUN] Would upload: ${newFilename}`);
      return { success: true, url: `https://example.com/${newFilename}` };
    }

    try {
      const formData = new FormData();
      const blob = new Blob([imageBuffer]);
      formData.append('file', blob, newFilename);
      const filePath = `menu-items/${newFilename}`;

      const response = await fetch(`${SUPABASE_URL}/storage/v1/object/menu-images/${filePath}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: formData
      });

      if (response.ok) {
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/menu-images/${filePath}`;
        return { success: true, url: publicUrl };
      } else {
        const errorText = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Load the translation mapping
   */
  async loadMapping() {
    try {
      const mappingContent = await fs.readFile('image-translation-mapping.json', 'utf-8');
      const mapping = JSON.parse(mappingContent);
      
      console.log(`📋 Loaded mapping for ${mapping.length} items`);
      return mapping;
    } catch (error) {
      console.error('❌ Error loading mapping:', error.message);
      throw error;
    }
  }

  /**
   * Create unique groups from the mapping
   */
  createUniqueGroups(mapping) {
    const uniqueGroups = new Map();
    
    for (const item of mapping) {
      const groupKey = `${item.group}-${item.newFilename}`;
      if (!uniqueGroups.has(groupKey)) {
        uniqueGroups.set(groupKey, {
          group: item.group,
          filename: item.newFilename,
          items: []
        });
      }
      uniqueGroups.get(groupKey).items.push(item);
    }
    
    return Array.from(uniqueGroups.values());
  }

  /**
   * Update database with new image URLs
   */
  async updateDatabaseWithNewImages(uniqueGroups) {
    if (this.dryRun) {
      console.log('\n🔍 [DRY RUN] Would update database with new image URLs');
      return;
    }

    console.log('\n🔄 Updating database with new image URLs...');
    
    let updatedCount = 0;
    let failedCount = 0;

    for (const group of uniqueGroups) {
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/menu-images/menu-items/${group.filename}`;
      
      // Update all items in this group with the new image URL
      for (const item of group.items) {
        try {
          // Update items where the Arabic name matches
          const response = await fetch(`${SUPABASE_URL}/rest/v1/items?names->>ar=eq.${encodeURIComponent(item.arabicName)}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'apikey': SUPABASE_ANON_KEY,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              image_url: publicUrl
            })
          });

          if (response.ok) {
            updatedCount++;
            console.log(`✅ Updated: ${item.arabicName} → ${group.filename}`);
          } else {
            failedCount++;
            const errorText = await response.text();
            console.error(`❌ Failed to update ${item.arabicName}: ${response.status} ${errorText}`);
          }
        } catch (error) {
          failedCount++;
          console.error(`❌ Error updating ${item.arabicName}:`, error.message);
        }

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    console.log(`\n📊 Database Update Summary:`);
    console.log(`✅ Updated: ${updatedCount} items`);
    console.log(`❌ Failed: ${failedCount} items`);
  }

  /**
   * Run the upload process
   */
  async run() {
    console.log('🚀 Starting translated image upload process...\n');

    try {
      // Load mapping
      const mapping = await this.loadMapping();
      
      // Create unique groups (to avoid uploading the same image multiple times)
      const uniqueGroups = this.createUniqueGroups(mapping);
      console.log(`📊 Created ${uniqueGroups.length} unique image groups`);

      // Download source image
      const sourceImageBuffer = await this.downloadSourceImage();

      // Upload images for each unique group
      console.log('\n📤 Uploading translated images...');
      let uploadedCount = 0;
      let failedCount = 0;
      const uploadedGroups = [];

      for (let i = 0; i < uniqueGroups.length; i++) {
        const group = uniqueGroups[i];
        
        if (this.limit && uploadedCount >= this.limit) {
          console.log(`\n⏹️ Reached upload limit of ${this.limit}, stopping...`);
          break;
        }

        console.log(`📤 Uploading ${i + 1}/${uniqueGroups.length}: ${group.filename}`);
        
        const result = await this.uploadImageWithNewName(sourceImageBuffer, group.filename);
        
        if (result.success) {
          uploadedCount++;
          uploadedGroups.push({
            ...group,
            url: result.url
          });
          console.log(`✅ Uploaded: ${group.filename}`);
        } else {
          failedCount++;
          console.error(`❌ Failed to upload ${group.filename}: ${result.error}`);
        }

        // Small delay between uploads
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`\n📊 Upload Summary:`);
      console.log(`✅ Uploaded: ${uploadedCount} images`);
      console.log(`❌ Failed: ${failedCount} images`);

      if (uploadedCount > 0) {
        // Update database with new image URLs
        await this.updateDatabaseWithNewImages(uploadedGroups);
      }

      console.log('\n🎉 Translation and upload process completed!');
      console.log('\n📝 Next steps:');
      console.log('1. Check your digital menu to see the new images');
      console.log('2. Replace the placeholder images with actual product photos');
      console.log('3. Use the admin panel to upload specific images for each item');

    } catch (error) {
      console.error('❌ Upload process failed:', error.message);
      process.exit(1);
    }
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--limit':
        options.limit = parseInt(args[++i]);
        break;
      case '--help':
        console.log(`
Upload Translated Images Script

Usage:
  node scripts/upload-translated-images.js [options]

Options:
  --dry-run          Preview uploads without actually uploading
  --limit <number>   Limit number of images to upload (for testing)
  --help             Show this help message

Example:
  node scripts/upload-translated-images.js --dry-run
  node scripts/upload-translated-images.js --limit 10
        `);
        process.exit(0);
        break;
    }
  }

  return options;
}

// Main execution
async function main() {
  const options = parseArgs();
  const uploader = new TranslatedImageUploader(options);
  await uploader.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = TranslatedImageUploader;
