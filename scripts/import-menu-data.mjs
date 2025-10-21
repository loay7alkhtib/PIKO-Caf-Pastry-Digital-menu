#!/usr/bin/env node

/**
 * Menu Data Import Script
 *
 * This script imports menu data from a CSV file with the following structure:
 * - Categories and items with multilingual support (Arabic, Turkish, English)
 * - Image handling with Supabase Storage
 * - Variable sizes and prices support
 *
 * Expected CSV format:
 * category_name_en,category_name_tr,category_name_ar,category_icon,category_color,
 * item_name_en,item_name_tr,item_name_ar,item_description_en,item_description_tr,item_description_ar,
 * base_price,image_filename,size_variants,tags,order
 *
 * Example:
 * "Beverages","İçecekler","المشروبات","☕","#8B4513",
 * "Turkish Coffee","Türk Kahvesi","القهوة التركية","Traditional Turkish coffee","Geleneksel Türk kahvesi","قهوة تركية تقليدية",
 * "15.00","turkish-coffee.jpg","Small:12.00,Medium:15.00,Large:18.00","coffee,traditional","1"
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    '❌ Missing Supabase configuration. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.',
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Storage bucket name for images
const IMAGE_BUCKET = 'menu-images';

class MenuImporter {
  constructor() {
    this.categories = new Map();
    this.items = [];
    this.uploadedImages = new Map();
  }

  /**
   * Parse size variants from string format: "Small:12.00,Medium:15.00,Large:18.00"
   */
  parseSizeVariants(variantsString) {
    if (!variantsString || variantsString.trim() === '') {
      return null;
    }

    try {
      const variants = variantsString.split(',').map(variant => {
        const [size, price] = variant.trim().split(':');
        return {
          size: size.trim(),
          price: parseFloat(price.trim()),
        };
      });

      return variants.length > 0 ? variants : null;
    } catch (error) {
      console.warn(`⚠️  Could not parse size variants: ${variantsString}`);
      return null;
    }
  }

  /**
   * Parse tags from string format: "coffee,traditional,hot"
   */
  parseTags(tagsString) {
    if (!tagsString || tagsString.trim() === '') {
      return [];
    }

    return tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  /**
   * Upload image to Supabase Storage
   */
  async uploadImage(imagePath, itemName) {
    try {
      // Check if image already uploaded
      if (this.uploadedImages.has(itemName)) {
        return this.uploadedImages.get(itemName);
      }

      // Check if file exists
      if (!fs.existsSync(imagePath)) {
        console.warn(`⚠️  Image not found: ${imagePath}`);
        return null;
      }

      // Read file
      const fileBuffer = fs.readFileSync(imagePath);
      const fileName = path.basename(imagePath);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(`items/${fileName}`, fileBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.error(`❌ Failed to upload image ${fileName}:`, error.message);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(IMAGE_BUCKET)
        .getPublicUrl(`items/${fileName}`);

      const imageUrl = urlData.publicUrl;
      this.uploadedImages.set(itemName, imageUrl);

      console.log(`✅ Uploaded image: ${fileName}`);
      return imageUrl;
    } catch (error) {
      console.error(`❌ Error uploading image ${imagePath}:`, error.message);
      return null;
    }
  }

  /**
   * Create storage bucket if it doesn't exist
   */
  async ensureStorageBucket() {
    try {
      const { data, error } = await supabase.storage.getBucket(IMAGE_BUCKET);

      if (error && error.message.includes('not found')) {
        console.log('📦 Creating storage bucket...');
        const { error: createError } = await supabase.storage.createBucket(
          IMAGE_BUCKET,
          {
            public: true,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
            fileSizeLimit: 5242880, // 5MB
          },
        );

        if (createError) {
          throw createError;
        }
        console.log('✅ Storage bucket created');
      } else if (error) {
        throw error;
      } else {
        console.log('✅ Storage bucket exists');
      }
    } catch (error) {
      console.error('❌ Failed to setup storage bucket:', error.message);
      throw error;
    }
  }

  /**
   * Process CSV file and prepare data
   */
  async processCSV(csvPath, imagesDir) {
    return new Promise((resolve, reject) => {
      const results = [];

      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', row => {
          // Skip empty rows
          if (!row.category_name_en || !row.item_name_en) {
            return;
          }

          const categoryKey = row.category_name_en
            .toLowerCase()
            .replace(/\s+/g, '-');

          // Store category data
          if (!this.categories.has(categoryKey)) {
            this.categories.set(categoryKey, {
              slug: categoryKey,
              names: {
                en: row.category_name_en,
                tr: row.category_name_tr,
                ar: row.category_name_ar,
              },
              icon: row.category_icon || '🍽️',
              color: row.category_color || '#8B4513',
              order: parseInt(row.category_order) || 0,
            });
          }

          // Prepare item data
          const item = {
            category_key: categoryKey,
            names: {
              en: row.item_name_en,
              tr: row.item_name_tr,
              ar: row.item_name_ar,
            },
            descriptions: {
              en: row.item_description_en || null,
              tr: row.item_description_tr || null,
              ar: row.item_description_ar || null,
            },
            base_price: parseFloat(row.base_price) || 0,
            image_filename: row.image_filename,
            size_variants: this.parseSizeVariants(row.size_variants),
            tags: this.parseTags(row.tags),
            order: parseInt(row.order) || 0,
          };

          this.items.push(item);
        })
        .on('end', () => {
          console.log(
            `📊 Processed ${this.categories.size} categories and ${this.items.length} items`,
          );
          resolve();
        })
        .on('error', reject);
    });
  }

  /**
   * Import categories to database
   */
  async importCategories() {
    console.log('📂 Importing categories...');

    const categoryData = Array.from(this.categories.values()).map(cat => ({
      slug: cat.slug,
      names: cat.names,
      icon: cat.icon,
      color: cat.color,
      sort_order: cat.order,
      is_active: true,
    }));

    const { data, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select('id, slug');

    if (error) {
      throw new Error(`Failed to import categories: ${error.message}`);
    }

    // Create mapping for items
    const categoryMap = new Map();
    data.forEach(cat => {
      categoryMap.set(cat.slug, cat.id);
    });

    console.log(`✅ Imported ${data.length} categories`);
    return categoryMap;
  }

  /**
   * Import items to database
   */
  async importItems(categoryMap, imagesDir) {
    console.log('🍽️ Importing items...');

    const itemData = [];

    for (const item of this.items) {
      const categoryId = categoryMap.get(item.category_key);
      if (!categoryId) {
        console.warn(`⚠️  Category not found for item: ${item.names.en}`);
        continue;
      }

      // Handle image upload
      let imageUrl = null;
      if (item.image_filename) {
        const imagePath = path.join(imagesDir, item.image_filename);
        imageUrl = await this.uploadImage(imagePath, item.names.en);
      }

      // Prepare variants
      let variants = null;
      if (item.size_variants && item.size_variants.length > 0) {
        variants = item.size_variants;
      }

      itemData.push({
        category_id: categoryId,
        names: item.names,
        descriptions: item.descriptions,
        price: item.base_price,
        image_url: imageUrl,
        tags: item.tags,
        variants: variants,
        sort_order: item.order,
        is_active: true,
      });
    }

    const { data, error } = await supabase.from('items').insert(itemData);

    if (error) {
      throw new Error(`Failed to import items: ${error.message}`);
    }

    console.log(`✅ Imported ${itemData.length} items`);
  }

  /**
   * Main import process
   */
  async import(csvPath, imagesDir) {
    try {
      console.log('🚀 Starting menu data import...');

      // Ensure storage bucket exists
      await this.ensureStorageBucket();

      // Process CSV file
      await this.processCSV(csvPath, imagesDir);

      // Import categories
      const categoryMap = await this.importCategories();

      // Import items
      await this.importItems(categoryMap, imagesDir);

      console.log('🎉 Menu data import completed successfully!');
    } catch (error) {
      console.error('❌ Import failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI usage
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
Usage: node import-menu-data.mjs <csv-file> <images-directory>

Example:
  node import-menu-data.mjs menu-data.csv ./images

Environment variables required:
  VITE_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
    `);
    process.exit(1);
  }

  const [csvPath, imagesDir] = args;

  // Validate paths
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(imagesDir)) {
    console.error(`❌ Images directory not found: ${imagesDir}`);
    process.exit(1);
  }

  const importer = new MenuImporter();
  await importer.import(csvPath, imagesDir);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MenuImporter };


