#!/usr/bin/env node

/**
 * Automated Image Matching Script
 * 
 * This script automatically matches uploaded images with menu items from CSV
 * and updates the database with the correct image URLs.
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// Supabase Configuration
const SUPABASE_URL = 'https://eoaissoqwlfvfizfomax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvYWlzc29xd2xmdmZpemZvbWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTY5OTIsImV4cCI6MjA3NTMzMjk5Mn0.SHkFV9EvSnWVmC0tApVU6A6C1rrDqsPMO922rMC1JpY';

class AutoImageMatcher {
  constructor(options = {}) {
    this.csvPath = options.csv || 'new Menu csv.csv';
    this.dryRun = options.dryRun || false;
    this.updateDb = options.updateDb || true;
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
   * Get all uploaded images from Supabase Storage
   */
  async getUploadedImages() {
    try {
      console.log('🔍 Fetching uploaded images from Supabase Storage...');
      
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
      console.log(`📸 Found ${images.length} uploaded images`);
      
      return images.map(img => ({
        name: img.name,
        path: `menu-items/${img.name}`,
        url: `${SUPABASE_URL}/storage/v1/object/public/menu-images/menu-items/${img.name}`
      }));
    } catch (error) {
      console.error('❌ Error fetching images:', error.message);
      return [];
    }
  }

  /**
   * Parse CSV file and extract menu items
   */
  async parseCSV() {
    try {
      console.log('📋 Parsing CSV file...');
      const csvContent = await fs.readFile(this.csvPath, 'utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      // Skip the first line (Table 1) and second line (headers)
      const dataLines = lines.slice(2);
      const headers = ['اسم المادة', 'السعر', 'الاسم التركي', 'الاسم اللاتيني', 'اسم المجموعة', 'اسم المجموعة اللاتيني', 'الصور'];
      
      const items = [];
      for (let i = 0; i < dataLines.length; i++) {
        const values = dataLines[i].split(',').map(v => v.trim());
        if (values.length >= 4) { // Ensure we have at least the basic fields
          const item = {
            arabicName: values[0] || '',
            price: parseFloat(values[1]) || 0,
            turkishName: values[2] || '',
            englishName: values[3] || '',
            categoryArabic: values[4] || '',
            categoryEnglish: values[5] || '',
            image: values[6] || ''
          };
          items.push(item);
        }
      }
      
      console.log(`📋 Parsed ${items.length} items from CSV`);
      return items;
    } catch (error) {
      console.error('❌ Error parsing CSV:', error.message);
      throw error;
    }
  }

  /**
   * Get current items from database
   */
  async getDatabaseItems() {
    try {
      console.log('🔍 Fetching items from database...');
      
      const result = await this.makeRequest('/rest/v1/items?select=*');
      
      if (!result.success) {
        console.error('❌ Failed to fetch database items:', result.error);
        return [];
      }

      const items = result.data || [];
      console.log(`📊 Found ${items.length} items in database`);
      
      return items;
    } catch (error) {
      console.error('❌ Error fetching database items:', error.message);
      return [];
    }
  }

  /**
   * Sanitize filename (same logic as upload script)
   */
  sanitizeFileName(name) {
    return name
      .replace(/[\u0600-\u06FF]/g, '') // Remove Arabic characters
      .replace(/[^a-zA-Z0-9.-]/g, '-') // Replace special chars with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .toLowerCase();
  }

  /**
   * Find matching image for a menu item
   */
  findMatchingImage(arabicName, uploadedImages) {
    // Try exact match first
    const exactMatch = uploadedImages.find(img => {
      const imageName = img.name.toLowerCase();
      const sanitizedArabic = this.sanitizeFileName(arabicName);
      return imageName.includes(sanitizedArabic) || sanitizedArabic.includes(imageName);
    });

    if (exactMatch) {
      return { image: exactMatch, matchType: 'exact' };
    }

    // Try partial match
    const partialMatch = uploadedImages.find(img => {
      const imageName = img.name.toLowerCase();
      const words = arabicName.split(' ');
      
      return words.some(word => {
        const sanitizedWord = this.sanitizeFileName(word);
        return sanitizedWord && imageName.includes(sanitizedWord);
      });
    });

    if (partialMatch) {
      return { image: partialMatch, matchType: 'partial' };
    }

    return null;
  }

  /**
   * Update item in database with image URL
   */
  async updateItemImage(itemId, imageUrl) {
    if (this.dryRun) {
      console.log(`🔍 [DRY RUN] Would update item ${itemId} with image: ${imageUrl}`);
      return { success: true };
    }

    try {
      const result = await this.makeRequest(`/rest/v1/items?id=eq.${itemId}`, {
        method: 'PATCH',
        headers: {
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ image_url: imageUrl })
      });

      if (result.success) {
        console.log(`✅ Updated item ${itemId} with image: ${imageUrl}`);
        return { success: true };
      } else {
        console.error(`❌ Failed to update item ${itemId}:`, result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error(`❌ Error updating item ${itemId}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run the automated matching process
   */
  async run() {
    console.log('🚀 Starting automated image matching...\n');

    try {
      // Get data from all sources
      const [csvItems, databaseItems, uploadedImages] = await Promise.all([
        this.parseCSV(),
        this.getDatabaseItems(),
        this.getUploadedImages()
      ]);

      if (csvItems.length === 0) {
        console.log('❌ No items found in CSV');
        return;
      }

      if (databaseItems.length === 0) {
        console.log('❌ No items found in database');
        return;
      }

      if (uploadedImages.length === 0) {
        console.log('❌ No uploaded images found');
        return;
      }

      console.log('\n🎯 Starting image matching...\n');

      const results = {
        matched: 0,
        updated: 0,
        failed: 0,
        skipped: 0,
        details: []
      };

      // Process each CSV item
      for (const csvItem of csvItems) {
        // Find corresponding database item
        const dbItem = databaseItems.find(dbItem => {
          const names = dbItem.names || {};
          return names.ar === csvItem.arabicName || 
                 names.tr === csvItem.turkishName || 
                 names.en === csvItem.englishName;
        });

        if (!dbItem) {
          console.log(`⚠️ No database item found for: ${csvItem.arabicName}`);
          results.skipped++;
          results.details.push({
            arabicName: csvItem.arabicName,
            success: false,
            error: 'Item not found in database',
            matchType: null
          });
          continue;
        }

        // Check if item already has an image
        if (dbItem.image_url && !this.dryRun) {
          console.log(`⏭️ Item already has image: ${csvItem.arabicName}`);
          results.skipped++;
          results.details.push({
            arabicName: csvItem.arabicName,
            success: false,
            error: 'Item already has an image',
            matchType: 'existing'
          });
          continue;
        }

        // Find matching image
        const match = this.findMatchingImage(csvItem.arabicName, uploadedImages);
        
        if (!match) {
          console.log(`⚠️ No matching image found for: ${csvItem.arabicName}`);
          results.skipped++;
          results.details.push({
            arabicName: csvItem.arabicName,
            success: false,
            error: 'No matching image found',
            matchType: null
          });
          continue;
        }

        results.matched++;
        console.log(`🎯 Matched: ${csvItem.arabicName} → ${match.image.name} (${match.matchType} match)`);

        // Update database
        if (this.updateDb) {
          const updateResult = await this.updateItemImage(dbItem.id, match.image.url);
          
          if (updateResult.success) {
            results.updated++;
            results.details.push({
              arabicName: csvItem.arabicName,
              imageUrl: match.image.url,
              success: true,
              matchType: match.matchType
            });
          } else {
            results.failed++;
            results.details.push({
              arabicName: csvItem.arabicName,
              success: false,
              error: updateResult.error,
              matchType: match.matchType
            });
          }
        } else {
          results.details.push({
            arabicName: csvItem.arabicName,
            imageUrl: match.image.url,
            success: true,
            matchType: match.matchType
          });
        }

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Print summary
      console.log('\n📊 Matching Summary:');
      console.log(`🎯 Items matched: ${results.matched}`);
      console.log(`✅ Database updates: ${results.updated}`);
      console.log(`❌ Failed updates: ${results.failed}`);
      console.log(`⏭️ Skipped: ${results.skipped}`);

      // Save results to file
      const resultsPath = path.join(process.cwd(), 'auto-match-results.json');
      await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
      console.log(`\n📄 Results saved to: ${resultsPath}`);

    } catch (error) {
      console.error('❌ Automated matching failed:', error.message);
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
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--no-update':
        options.updateDb = false;
        break;
      case '--help':
        console.log(`
Automated Image Matching Script

Usage:
  node scripts/auto-match-images.js [options]

Options:
  --csv <file>        Path to CSV file (default: "new Menu csv.csv")
  --dry-run          Preview matches without updating database
  --no-update        Find matches but don't update database
  --help             Show this help message

Example:
  node scripts/auto-match-images.js --dry-run
  node scripts/auto-match-images.js --csv "new Menu csv.csv"
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
  const matcher = new AutoImageMatcher(options);
  await matcher.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = AutoImageMatcher;
