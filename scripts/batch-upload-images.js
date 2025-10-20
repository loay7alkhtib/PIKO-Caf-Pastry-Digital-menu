#!/usr/bin/env node

/**
 * Batch Image Upload Script for PIKO Digital Menu
 * 
 * This script uploads images to Supabase Storage and auto-matches them with menu items
 * based on CSV data and image filenames.
 * 
 * Usage:
 * node scripts/batch-upload-images.js --csv path/to/menu.csv --images path/to/images/folder
 * 
 * Options:
 * --csv: Path to CSV file containing menu items
 * --images: Path to folder containing images
 * --dry-run: Preview what would be uploaded without actually uploading
 * --update-db: Update database with image URLs after upload
 */

const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://eoaissoqwlfvfizfomax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvYWlzc29xd2xmdmZpemZvbWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTY5OTIsImV4cCI6MjA3NTMzMjk5Mn0.SHkFV9EvSnWVmC0tApVU6A6C1rrDqsPMO922rMC1JpY';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class BatchImageUploader {
  constructor(options = {}) {
    this.csvPath = options.csv;
    this.imagesPath = options.images;
    this.dryRun = options.dryRun || false;
    this.updateDb = options.updateDb || false;
    this.bucketName = 'menu-images';
  }

  /**
   * Parse CSV file and extract menu items
   */
  async parseCSV() {
    try {
      const csvContent = await fs.readFile(this.csvPath, 'utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      const items = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const item = {};
        
        headers.forEach((header, index) => {
          item[header] = values[index] || '';
        });
        
        items.push(item);
      }
      
      console.log(`📋 Parsed ${items.length} items from CSV`);
      return items;
    } catch (error) {
      console.error('❌ Error parsing CSV:', error.message);
      throw error;
    }
  }

  /**
   * Get all image files from the images directory
   */
  async getImageFiles() {
    try {
      const files = await fs.readdir(this.imagesPath);
      const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
      });
      
      console.log(`📸 Found ${imageFiles.length} image files`);
      return imageFiles;
    } catch (error) {
      console.error('❌ Error reading images directory:', error.message);
      throw error;
    }
  }

  /**
   * Find matching item for an image filename
   */
  findMatchingItem(imageName, items) {
    const baseName = path.parse(imageName).name.toLowerCase();
    
    // Try exact match first
    for (const item of items) {
      const arabicName = item['اسم المادة']?.toLowerCase() || '';
      const englishName = item['الاسم اللاتيني']?.toLowerCase() || '';
      const turkishName = item['الاسم التركي']?.toLowerCase() || '';
      
      if (baseName === arabicName || baseName === englishName || baseName === turkishName) {
        return { item, matchType: 'exact' };
      }
    }

    // Try partial match
    for (const item of items) {
      const arabicName = item['اسم المادة']?.toLowerCase() || '';
      const englishName = item['الاسم اللاتيني']?.toLowerCase() || '';
      const turkishName = item['الاسم التركي']?.toLowerCase() || '';
      
      if (baseName.includes(arabicName) || arabicName.includes(baseName) ||
          baseName.includes(englishName) || englishName.includes(baseName) ||
          baseName.includes(turkishName) || turkishName.includes(baseName)) {
        return { item, matchType: 'partial' };
      }
    }

    // Try fuzzy match (remove spaces, special characters)
    const cleanBaseName = baseName.replace(/[^a-z0-9]/g, '');
    for (const item of items) {
      const arabicName = item['اسم المادة']?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
      const englishName = item['الاسم اللاتيني']?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
      const turkishName = item['الاسم التركي']?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
      
      if (cleanBaseName === arabicName || cleanBaseName === englishName || cleanBaseName === turkishName ||
          cleanBaseName.includes(arabicName) || cleanBaseName.includes(englishName) || cleanBaseName.includes(turkishName)) {
        return { item, matchType: 'fuzzy' };
      }
    }

    return null;
  }

  /**
   * Sanitize filename for storage
   */
  sanitizeFileName(fileName) {
    return fileName
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Upload image to Supabase Storage
   */
  async uploadImage(imagePath, fileName, folder = 'menu-items') {
    try {
      const fileBuffer = await fs.readFile(imagePath);
      const filePath = `${folder}/${fileName}`;

      if (this.dryRun) {
        console.log(`🔍 [DRY RUN] Would upload: ${imagePath} → ${filePath}`);
        return { success: true, url: `https://example.com/${filePath}` };
      }

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, fileBuffer, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error(`❌ Upload error for ${fileName}:`, error.message);
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path);

      console.log(`✅ Uploaded: ${fileName} → ${urlData.publicUrl}`);
      return { success: true, url: urlData.publicUrl, path: data.path };
    } catch (error) {
      console.error(`❌ Upload error for ${fileName}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update item in database with image URL
   */
  async updateItemInDatabase(itemName, imageUrl) {
    if (this.dryRun) {
      console.log(`🔍 [DRY RUN] Would update database: ${itemName} → ${imageUrl}`);
      return { success: true };
    }

    try {
      // Find the item in the database by name
      const { data: items, error: searchError } = await supabase
        .from('items')
        .select('id, names')
        .ilike('names->en', `%${itemName}%`);

      if (searchError) {
        console.error(`❌ Database search error for ${itemName}:`, searchError.message);
        return { success: false, error: searchError.message };
      }

      if (!items || items.length === 0) {
        console.warn(`⚠️ No database item found for: ${itemName}`);
        return { success: false, error: 'Item not found in database' };
      }

      // Update the first matching item
      const { error: updateError } = await supabase
        .from('items')
        .update({ image_url: imageUrl })
        .eq('id', items[0].id);

      if (updateError) {
        console.error(`❌ Database update error for ${itemName}:`, updateError.message);
        return { success: false, error: updateError.message };
      }

      console.log(`✅ Updated database: ${itemName} → ${imageUrl}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Database update error for ${itemName}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run the batch upload process
   */
  async run() {
    console.log('🚀 Starting batch image upload...\n');

    try {
      // Parse CSV and get image files
      const items = await this.parseCSV();
      const imageFiles = await this.getImageFiles();

      if (items.length === 0) {
        console.log('❌ No items found in CSV');
        return;
      }

      if (imageFiles.length === 0) {
        console.log('❌ No image files found');
        return;
      }

      const results = {
        uploaded: 0,
        failed: 0,
        matched: 0,
        unmatched: 0,
        details: []
      };

      console.log('\n📤 Processing images...\n');

      for (const imageFile of imageFiles) {
        const imagePath = path.join(this.imagesPath, imageFile);
        
        // Find matching item
        const match = this.findMatchingItem(imageFile, items);
        
        if (!match) {
          console.log(`⚠️ No match found for: ${imageFile}`);
          results.unmatched++;
          results.details.push({
            imageFile,
            success: false,
            error: 'No matching item found',
            matchType: null
          });
          continue;
        }

        results.matched++;
        const { item, matchType } = match;
        
        // Generate filename
        const itemName = item['اسم المادة'] || item['الاسم اللاتيني'] || item['الاسم التركي'];
        const sanitizedName = this.sanitizeFileName(itemName);
        const fileName = `${sanitizedName}-${Date.now()}.${path.extname(imageFile).slice(1)}`;

        console.log(`🎯 Matched: ${imageFile} → ${itemName} (${matchType} match)`);

        // Upload image
        const uploadResult = await this.uploadImage(imagePath, fileName);
        
        if (uploadResult.success) {
          results.uploaded++;
          
          // Update database if requested
          if (this.updateDb && uploadResult.url) {
            const dbResult = await this.updateItemInDatabase(itemName, uploadResult.url);
            if (!dbResult.success) {
              console.warn(`⚠️ Database update failed for ${itemName}: ${dbResult.error}`);
            }
          }
          
          results.details.push({
            imageFile,
            itemName,
            success: true,
            url: uploadResult.url,
            matchType,
            fileName
          });
        } else {
          results.failed++;
          results.details.push({
            imageFile,
            itemName,
            success: false,
            error: uploadResult.error,
            matchType
          });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Print summary
      console.log('\n📊 Upload Summary:');
      console.log(`✅ Successfully uploaded: ${results.uploaded}`);
      console.log(`❌ Failed uploads: ${results.failed}`);
      console.log(`🎯 Matched images: ${results.matched}`);
      console.log(`⚠️ Unmatched images: ${results.unmatched}`);

      if (results.unmatched > 0) {
        console.log('\n⚠️ Unmatched images:');
        results.details
          .filter(d => !d.success && d.error === 'No matching item found')
          .forEach(d => console.log(`  - ${d.imageFile}`));
      }

      // Save results to file
      const resultsPath = path.join(process.cwd(), 'upload-results.json');
      await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
      console.log(`\n📄 Results saved to: ${resultsPath}`);

    } catch (error) {
      console.error('❌ Batch upload failed:', error.message);
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
      case '--csv':
        options.csv = args[++i];
        break;
      case '--images':
        options.images = args[++i];
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--update-db':
        options.updateDb = true;
        break;
      case '--help':
        console.log(`
Batch Image Upload Script for PIKO Digital Menu

Usage:
  node scripts/batch-upload-images.js --csv <csv-file> --images <images-folder> [options]

Options:
  --csv <file>        Path to CSV file containing menu items
  --images <folder>   Path to folder containing images
  --dry-run          Preview what would be uploaded without actually uploading
  --update-db        Update database with image URLs after upload
  --help             Show this help message

Example:
  node scripts/batch-upload-images.js --csv "new Menu csv.csv" --images "./images" --update-db
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

  if (!options.csv || !options.images) {
    console.error('❌ Missing required arguments. Use --help for usage information.');
    process.exit(1);
  }

  const uploader = new BatchImageUploader(options);
  await uploader.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = BatchImageUploader;
