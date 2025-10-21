#!/usr/bin/env node

/**
 * Price Update Script from CSV Template
 *
 * This script updates item prices in the database using the correct prices
 * from the CSV template file.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

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

class PriceUpdater {
  constructor() {
    this.priceMap = new Map();
    this.updatedCount = 0;
    this.notFoundCount = 0;
  }

  /**
   * Parse the CSV template file and create a price mapping
   */
  async parseCSV(csvPath) {
    return new Promise((resolve, reject) => {
      const results = [];

      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', row => {
          // Skip empty rows or rows without price
          if (!row.item_name_en || !row.base_price || row.base_price === '0.00') {
            return;
          }

          const englishName = row.item_name_en?.trim();
          const turkishName = row.item_name_tr?.trim();
          const arabicName = row.item_name_ar?.trim();
          const price = parseFloat(row.base_price);

          if (price > 0) {
            // Create multiple mappings for different name variations
            if (englishName) {
              this.priceMap.set(englishName.toLowerCase(), price);
            }
            if (turkishName) {
              this.priceMap.set(turkishName.toLowerCase(), price);
            }
            if (arabicName) {
              this.priceMap.set(arabicName.toLowerCase(), price);
            }

            // Also store the original data for reference
            results.push({
              english: englishName,
              turkish: turkishName,
              arabic: arabicName,
              price: price,
            });
          }
        })
        .on('end', () => {
          console.log(`📊 Loaded ${results.length} items with prices from CSV template`);
          console.log(`📋 Created ${this.priceMap.size} price mappings`);
          resolve(results);
        })
        .on('error', reject);
    });
  }

  /**
   * Get all items from database
   */
  async getDatabaseItems() {
    console.log('📥 Fetching all items from database...');

    const { data: items, error } = await supabase
      .from('items')
      .select('id, names, price')
      .order('names->en');

    if (error) {
      throw new Error(`Failed to fetch items: ${error.message}`);
    }

    console.log(`📥 Found ${items.length} items in database`);
    return items;
  }

  /**
   * Find matching price for an item
   */
  findMatchingPrice(item) {
    const names = item.names || {};
    const searchTerms = [
      names.en?.toLowerCase(),
      names.tr?.toLowerCase(),
      names.ar?.toLowerCase(),
    ].filter(Boolean);

    for (const term of searchTerms) {
      if (this.priceMap.has(term)) {
        return this.priceMap.get(term);
      }
    }

    // Try partial matches
    for (const term of searchTerms) {
      for (const [key, price] of this.priceMap.entries()) {
        if (key.includes(term) || term.includes(key)) {
          console.log(
            `🔍 Partial match found: "${term}" -> "${key}" (${price})`,
          );
          return price;
        }
      }
    }

    return null;
  }

  /**
   * Update item price in database
   */
  async updateItemPrice(itemId, newPrice) {
    const { error } = await supabase
      .from('items')
      .update({ price: newPrice })
      .eq('id', itemId);

    if (error) {
      throw new Error(`Failed to update item ${itemId}: ${error.message}`);
    }
  }

  /**
   * Update prices for all items
   */
  async updatePrices() {
    console.log('🔄 Starting price update...');

    const items = await this.getDatabaseItems();
    const updatePromises = [];

    for (const item of items) {
      const matchingPrice = this.findMatchingPrice(item);

      if (matchingPrice && matchingPrice !== parseFloat(item.price)) {
        console.log(
          `💰 Updating "${item.names?.en}" from ${item.price} to ${matchingPrice}`,
        );
        updatePromises.push(this.updateItemPrice(item.id, matchingPrice));
        this.updatedCount++;
      } else if (matchingPrice === null) {
        console.log(
          `❌ No price found for: "${item.names?.en}" (Turkish: "${item.names?.tr}", Arabic: "${item.names?.ar}")`,
        );
        this.notFoundCount++;
      } else {
        console.log(
          `✅ Price already correct for: "${item.names?.en}" (${item.price})`,
        );
      }
    }

    // Execute all updates
    if (updatePromises.length > 0) {
      console.log(`🔄 Updating ${updatePromises.length} items...`);
      await Promise.all(updatePromises);
    }

    console.log(`✅ Price update completed!`);
    console.log(`📊 Updated: ${this.updatedCount} items`);
    console.log(`❌ Not found: ${this.notFoundCount} items`);
  }

  /**
   * Main update process
   */
  async update(csvPath) {
    try {
      console.log('🚀 Starting price update from CSV template...');

      // Parse CSV file
      await this.parseCSV(csvPath);

      // Update prices
      await this.updatePrices();

      console.log('🎉 Price update completed successfully!');
    } catch (error) {
      console.error('❌ Update failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI usage
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(`
Usage: node update-prices-from-template.js <csv-file>

Example:
  node update-prices-from-template.js menu-template.csv

Environment variables required:
  VITE_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
    `);
    process.exit(1);
  }

  const [csvPath] = args;

  // Validate path
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  const updater = new PriceUpdater();
  await updater.update(csvPath);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { PriceUpdater };
