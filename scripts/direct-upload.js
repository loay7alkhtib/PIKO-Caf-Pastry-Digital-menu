#!/usr/bin/env node

/**
 * Direct Image Upload Script for Supabase Storage
 * 
 * This script uploads images directly to Supabase Storage using the REST API
 * and updates the database with the image URLs.
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const FormData = require('form-data');

// Supabase Configuration
const SUPABASE_URL = 'https://eoaissoqwlfvfizfomax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvYWlzc29xd2xmdmZpemZvbWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTY5OTIsImV4cCI6MjA3NTMzMjk5Mn0.SHkFV9EvSnWVmC0tApVU6A6C1rrDqsPMO922rMC1JpY';
const BUCKET_NAME = 'menu-images';

class DirectUploader {
  constructor(options = {}) {
    this.csvPath = options.csv;
    this.imagesPath = options.images;
    this.dryRun = options.dryRun || false;
    this.updateDb = options.updateDb || false;
  }

  /**
   * Upload file directly to Supabase Storage using REST API
   */
  async uploadFile(filePath, fileName, folder = 'menu-items') {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const fileExtension = path.extname(fileName);
      const baseName = path.parse(fileName).name;
      
      // Sanitize filename for Supabase Storage (no Arabic, spaces, or special chars)
      const sanitizeFileName = (name) => {
        return name
          .replace(/[\u0600-\u06FF]/g, '') // Remove Arabic characters
          .replace(/[^a-zA-Z0-9.-]/g, '-') // Replace special chars with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single
          .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
          .toLowerCase();
      };
      
      // Create unique filename
      const timestamp = Date.now();
      const safeBaseName = sanitizeFileName(baseName);
      const uniqueFileName = `${safeBaseName || 'image'}-${timestamp}${fileExtension}`;
      const storagePath = `${folder}/${uniqueFileName}`;

      console.log(`🔄 Uploading: ${fileName} → ${storagePath}`);

      if (this.dryRun) {
        console.log(`🔍 [DRY RUN] Would upload: ${fileName} → ${storagePath}`);
        return {
          success: true,
          url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${storagePath}`,
          path: storagePath
        };
      }

      // Create form data
      const form = new FormData();
      form.append('file', fileBuffer, {
        filename: uniqueFileName,
        contentType: this.getMimeType(fileExtension)
      });

      // Upload to Supabase Storage
      const uploadResult = await this.makeRequest(
        `/storage/v1/object/${BUCKET_NAME}/${storagePath}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            ...form.getHeaders()
          },
          body: form
        }
      );

      if (uploadResult.success) {
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${storagePath}`;
        console.log(`✅ Uploaded: ${fileName} → ${publicUrl}`);
        return {
          success: true,
          url: publicUrl,
          path: storagePath
        };
      } else {
        console.error(`❌ Upload failed for ${fileName}:`, uploadResult.error);
        return {
          success: false,
          error: uploadResult.error
        };
      }
    } catch (error) {
      console.error(`❌ Upload error for ${fileName}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Make HTTP request using Node.js https module
   */
  makeRequest(path, options) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, SUPABASE_URL);
      
      const requestOptions = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: options.headers || {}
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
   * Get MIME type from file extension
   */
  getMimeType(extension) {
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    return mimeTypes[extension.toLowerCase()] || 'image/jpeg';
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

    return null;
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
      const searchResult = await this.makeRequest('/rest/v1/items', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (!searchResult.success) {
        return { success: false, error: 'Failed to search items' };
      }

      const items = searchResult.data || [];
      const matchingItem = items.find(item => {
        const names = item.names || {};
        return names.en === itemName || names.ar === itemName || names.tr === itemName;
      });

      if (!matchingItem) {
        console.warn(`⚠️ No database item found for: ${itemName}`);
        return { success: false, error: 'Item not found in database' };
      }

      // Update the item with image URL
      const updateResult = await this.makeRequest(`/rest/v1/items?id=eq.${matchingItem.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ image_url: imageUrl })
      });

      if (updateResult.success) {
        console.log(`✅ Updated database: ${itemName} → ${imageUrl}`);
        return { success: true };
      } else {
        return { success: false, error: updateResult.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Run the direct upload process
   */
  async run() {
    console.log('🚀 Starting direct image upload to Supabase...\n');

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
        const itemName = item['اسم المادة'] || item['الاسم اللاتيني'] || item['الاسم التركي'];
        
        console.log(`🎯 Matched: ${imageFile} → ${itemName} (${matchType} match)`);

        // Upload image
        const uploadResult = await this.uploadFile(imagePath, imageFile);
        
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
            fileName: uploadResult.path
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
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Print summary
      console.log('\n📊 Upload Summary:');
      console.log(`✅ Successfully uploaded: ${results.uploaded}`);
      console.log(`❌ Failed uploads: ${results.failed}`);
      console.log(`🎯 Matched images: ${results.matched}`);
      console.log(`⚠️ Unmatched images: ${results.unmatched}`);

      // Save results to file
      const resultsPath = path.join(process.cwd(), 'direct-upload-results.json');
      await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
      console.log(`\n📄 Results saved to: ${resultsPath}`);

    } catch (error) {
      console.error('❌ Direct upload failed:', error.message);
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
Direct Image Upload Script for Supabase Storage

Usage:
  node scripts/direct-upload.js --csv <csv-file> --images <images-folder> [options]

Options:
  --csv <file>        Path to CSV file containing menu items
  --images <folder>   Path to folder containing images
  --dry-run          Preview what would be uploaded without actually uploading
  --update-db        Update database with image URLs after upload
  --help             Show this help message

Example:
  node scripts/direct-upload.js --csv "new Menu csv.csv" --images "./images" --update-db
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

  const uploader = new DirectUploader(options);
  await uploader.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DirectUploader;
