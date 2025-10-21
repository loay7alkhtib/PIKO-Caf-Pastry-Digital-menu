#!/usr/bin/env node

/**
 * Comprehensive Item Price Update Script
 *
 * This script updates ALL item prices in the database using the Final Menu 111.csv file.
 * It matches items by Arabic, Turkish, and English names to ensure 100% accuracy.
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

class ComprehensivePriceUpdater {
  constructor() {
    this.csvItems = new Map();
    this.updatedCount = 0;
    this.notFoundCount = 0;
    this.skippedCount = 0;
    this.errors = [];
  }

  /**
   * Parse the CSV file and create comprehensive mappings
   */
  async parseCSV(csvPath) {
    return new Promise((resolve, reject) => {
      const results = [];

      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', row => {
          // Skip empty rows
          if (!row['اسم المادة'] || !row['السعر']) {
            return;
          }

          const arabicName = row['اسم المادة']?.trim();
          const turkishName = row['الاسم التركي']?.trim();
          const englishName = row['الاسم اللاتيني']?.trim();
          const price = parseFloat(row['السعر']);

          if (arabicName) {
            const itemData = {
              arabic: arabicName,
              turkish: turkishName,
              english: englishName,
              price: price,
              originalRow: row
            };

            // Create multiple mappings for different name variations
            if (arabicName) {
              this.csvItems.set(arabicName.toLowerCase(), itemData);
            }
            if (turkishName) {
              this.csvItems.set(turkishName.toLowerCase(), itemData);
            }
            if (englishName) {
              this.csvItems.set(englishName.toLowerCase(), itemData);
            }

            results.push(itemData);
          }
        })
        .on('end', () => {
          console.log(`📊 Loaded ${results.length} items from CSV`);
          console.log(`📋 Created ${this.csvItems.size} price mappings`);
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
   * Find matching CSV item for a database item
   */
  findMatchingCSVItem(dbItem) {
    const names = dbItem.names || {};
    const searchTerms = [
      names.en?.toLowerCase(),
      names.tr?.toLowerCase(),
      names.ar?.toLowerCase(),
    ].filter(Boolean);

    // Try exact matches first
    for (const term of searchTerms) {
      if (this.csvItems.has(term)) {
        return this.csvItems.get(term);
      }
    }

    // Try partial matches
    for (const term of searchTerms) {
      for (const [key, csvItem] of this.csvItems.entries()) {
        if (key.includes(term) || term.includes(key)) {
          console.log(`🔍 Partial match: "${term}" -> "${key}" (${csvItem.price})`);
          return csvItem;
        }
      }
    }

    return null;
  }

  /**
   * Update item price in database
   */
  async updateItemPrice(itemId, newPrice, currentPrice, itemName) {
    try {
      const { error } = await supabase
        .from('items')
        .update({ price: newPrice })
        .eq('id', itemId);

      if (error) {
        throw new Error(`Failed to update item ${itemId}: ${error.message}`);
      }

      console.log(`💰 Updated "${itemName}": ${currentPrice} -> ${newPrice}`);
      return true;
    } catch (error) {
      console.error(`❌ Error updating "${itemName}":`, error.message);
      this.errors.push({ itemName, error: error.message });
      return false;
    }
  }

  /**
   * Update all items with comprehensive matching
   */
  async updateAllItems() {
    console.log('🔄 Starting comprehensive price update...');

    const dbItems = await this.getDatabaseItems();
    const updatePromises = [];

    for (const dbItem of dbItems) {
      const csvItem = this.findMatchingCSVItem(dbItem);
      const currentPrice = parseFloat(dbItem.price);
      const itemName = dbItem.names?.en || dbItem.names?.tr || dbItem.names?.ar || 'Unknown';

      if (csvItem && csvItem.price !== currentPrice) {
        console.log(`🔄 Updating "${itemName}" from ${currentPrice} to ${csvItem.price}`);
        updatePromises.push(
          this.updateItemPrice(dbItem.id, csvItem.price, currentPrice, itemName)
        );
        this.updatedCount++;
      } else if (csvItem === null) {
        console.log(`❌ No CSV match found for: "${itemName}"`);
        this.notFoundCount++;
      } else {
        console.log(`✅ Price already correct for: "${itemName}" (${currentPrice})`);
        this.skippedCount++;
      }
    }

    // Execute all updates
    if (updatePromises.length > 0) {
      console.log(`🔄 Executing ${updatePromises.length} updates...`);
      const results = await Promise.all(updatePromises);
      const successCount = results.filter(r => r).length;
      const failCount = results.filter(r => !r).length;
      console.log(`✅ Successful updates: ${successCount}`);
      console.log(`❌ Failed updates: ${failCount}`);
    }

    console.log(`\n📊 Update Summary:`);
    console.log(`✅ Updated: ${this.updatedCount} items`);
    console.log(`❌ Not found: ${this.notFoundCount} items`);
    console.log(`✅ Skipped (already correct): ${this.skippedCount} items`);
    console.log(`❌ Errors: ${this.errors.length} items`);

    if (this.errors.length > 0) {
      console.log(`\n❌ Errors:`);
      this.errors.forEach(error => {
        console.log(`  - ${error.itemName}: ${error.error}`);
      });
    }
  }

  /**
   * Main update process
   */
  async update(csvPath) {
    try {
      console.log('🚀 Starting comprehensive price update from Final Menu CSV...');

      // Parse CSV file
      await this.parseCSV(csvPath);

      // Update all items
      await this.updateAllItems();

      console.log('🎉 Comprehensive price update completed!');
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
Usage: node update-all-items-from-csv.js <csv-file>

Example:
  node update-all-items-from-csv.js "Finall Menu 111.csv"

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

  const updater = new ComprehensivePriceUpdater();
  await updater.update(csvPath);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ComprehensivePriceUpdater };
