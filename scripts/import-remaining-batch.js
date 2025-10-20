#!/usr/bin/env node

/**
 * Import remaining items in one large batch
 */

const fs = require('fs');

async function importRemainingItems() {
  try {
    // Read the complete SQL file
    const sql = fs.readFileSync('items-import.sql', 'utf8');
    
    // Split into lines and skip the first line (INSERT statement)
    const lines = sql.split('\n');
    const insertLine = lines[0];
    const valueLines = lines.slice(1);
    
    // Remove the last line if it's empty
    const cleanValueLines = valueLines.filter(line => line.trim() !== '');
    
    console.log(`📊 Total value lines: ${cleanValueLines.length}`);
    
    // Create batches of 100 items each
    const batchSize = 100;
    const batches = [];
    
    for (let i = 0; i < cleanValueLines.length; i += batchSize) {
      const batchLines = cleanValueLines.slice(i, i + batchSize);
      const batchSQL = insertLine + '\n' + batchLines.join(',\n') + ';';
      batches.push(batchSQL);
    }
    
    console.log(`📊 Created ${batches.length} batches`);
    
    // Write each batch to a file
    batches.forEach((batch, index) => {
      const fileName = `batch-${index + 1}-complete.sql`;
      fs.writeFileSync(fileName, batch);
      console.log(`✅ Created ${fileName} with ${batch.split('\n').length - 1} items`);
    });
    
    console.log('🎉 All batch files created!');
    console.log('📝 Next step: Import each batch using the MCP Supabase tools');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

importRemainingItems();
