#!/usr/bin/env node

/**
 * Example usage of the image upload system
 * 
 * This script demonstrates how to use the batch upload functionality
 * with your menu CSV file.
 */

const BatchImageUploader = require('./batch-upload-images');

async function example() {
  console.log('🚀 PIKO Digital Menu - Image Upload Example\n');

  // Example 1: Dry run to see what would be uploaded
  console.log('📋 Example 1: Dry Run (Preview Mode)');
  console.log('=====================================');
  
  const dryRunUploader = new BatchImageUploader({
    csv: 'new Menu csv.csv',
    images: './images',
    dryRun: true
  });

  await dryRunUploader.run();

  console.log('\n\n');

  // Example 2: Actual upload with database update
  console.log('📤 Example 2: Actual Upload with Database Update');
  console.log('================================================');
  
  const realUploader = new BatchImageUploader({
    csv: 'new Menu csv.csv',
    images: './images',
    dryRun: false,
    updateDb: true
  });

  await realUploader.run();

  console.log('\n✅ Example completed!');
  console.log('\nNext steps:');
  console.log('1. Check the upload-results.json file for detailed results');
  console.log('2. Verify images are displaying correctly in your app');
  console.log('3. Update any unmatched images manually if needed');
}

// Run the example
example().catch(console.error);
