#!/usr/bin/env node

/**
 * Create Different Images Script
 * 
 * This script creates different placeholder images for each category
 * by generating simple colored backgrounds with category names.
 */

const https = require('https');
const fs = require('fs').promises;

// Supabase Configuration
const SUPABASE_URL = 'https://eoaissoqwlfvfizfomax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvYWlzc29xd2xmdmZpemZvbWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTY5OTIsImV4cCI6MjA3NTMzMjk5Mn0.SHkFV9EvSnWVmC0tApVU6A6C1rrDqsPMO922rMC1JpY';

class DifferentImageCreator {
  constructor() {
    this.categoryColors = {
      'coffee': '#8B4513',      // Brown for coffee
      'iced-coffee': '#4169E1', // Blue for iced drinks
      'waffles': '#DAA520',     // Gold for waffles
      'crepes': '#FF69B4',      // Pink for crepes
      'cakes': '#DC143C',       // Red for cakes
      'drinks': '#32CD32',      // Green for drinks
      'smoothies': '#FF8C00'    // Orange for smoothies
    };
  }

  /**
   * Create a simple SVG image with category name and color
   */
  createSVGImage(categoryName, color) {
    const svg = `
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="300" fill="${color}" opacity="0.8"/>
  <rect width="400" height="300" fill="url(#gradient)"/>
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color};stop-opacity:0.6" />
    </linearGradient>
  </defs>
  <text x="200" y="150" font-family="Arial, sans-serif" font-size="32" font-weight="bold" 
        text-anchor="middle" fill="white" stroke="black" stroke-width="2">
    ${categoryName.toUpperCase()}
  </text>
  <text x="200" y="180" font-family="Arial, sans-serif" font-size="16" 
        text-anchor="middle" fill="white" stroke="black" stroke-width="1">
    ${categoryName.replace('-', ' ')}
  </text>
</svg>`.trim();
    
    return Buffer.from(svg);
  }

  /**
   * Upload image to Supabase Storage
   */
  async uploadImage(imageBuffer, filename) {
    try {
      const formData = new FormData();
      const blob = new Blob([imageBuffer], { type: 'image/svg+xml' });
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
   * Update database items with new image URLs
   */
  async updateDatabaseItems(categoryUpdates) {
    console.log('\n🔄 Updating database with new category images...');
    
    let updatedCount = 0;
    
    for (const [category, imageUrl] of Object.entries(categoryUpdates)) {
      try {
        // Update items that match this category
        const result = await this.makeRequest(`/rest/v1/items`, {
          method: 'PATCH',
          headers: {
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            image_url: imageUrl
          })
        });

        if (result.success) {
          console.log(`✅ Updated ${category} items with new image`);
          updatedCount++;
        } else {
          console.error(`❌ Failed to update ${category}:`, result.error);
        }
      } catch (error) {
        console.error(`❌ Error updating ${category}:`, error.message);
      }
    }

    console.log(`✅ Updated ${updatedCount} categories`);
  }

  /**
   * Create and upload different images for each category
   */
  async createDifferentImages() {
    console.log('🎨 Creating different images for each category...\n');

    try {
      const categoryUpdates = {};
      let uploadedCount = 0;
      let failedCount = 0;

      // Create images for each category
      for (const [category, color] of Object.entries(this.categoryColors)) {
        console.log(`🎨 Creating image for ${category}...`);
        
        // Create SVG image
        const imageBuffer = this.createSVGImage(category, color);
        const filename = `${category}-category-image.svg`;
        
        // Upload image
        const result = await this.uploadImage(imageBuffer, filename);
        
        if (result.success) {
          categoryUpdates[category] = result.url;
          uploadedCount++;
        } else {
          failedCount++;
        }

        // Small delay between uploads
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log(`\n📊 Upload Summary:`);
      console.log(`✅ Uploaded: ${uploadedCount} category images`);
      console.log(`❌ Failed: ${failedCount} category images`);

      if (uploadedCount > 0) {
        // Update database with new category images
        await this.updateDatabaseItems(categoryUpdates);
      }

      console.log('\n🎉 Different category images created successfully!');
      console.log('\n📝 Next steps:');
      console.log('1. Refresh your browser to see the new category images');
      console.log('2. Each category now has a distinct colored background');
      console.log('3. You can replace these with actual product photos later');

    } catch (error) {
      console.error('❌ Image creation process failed:', error.message);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const creator = new DifferentImageCreator();
  await creator.createDifferentImages();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DifferentImageCreator;
