#!/usr/bin/env node

/**
 * Import all remaining items at once
 */

const fs = require('fs');

async function importAllRemaining() {
  try {
    // Read the SQL file
    const sql = fs.readFileSync('remaining-items-import.sql', 'utf8');
    
    // Split into smaller batches to avoid timeout
    const lines = sql.split('\n');
    const batchSize = 50; // Import 50 items at a time
    
    console.log(`📊 Total lines: ${lines.length}`);
    console.log(`📊 Will create ${Math.ceil((lines.length - 1) / batchSize)} batches`);
    
    // Create batch files
    for (let i = 1; i < lines.length; i += batchSize) {
      const batchLines = lines.slice(0, 1).concat(lines.slice(i, i + batchSize));
      const batchSQL = batchLines.join('\n');
      
      const batchNumber = Math.ceil(i / batchSize);
      const fileName = `batch-${batchNumber}.sql`;
      
      fs.writeFileSync(fileName, batchSQL);
      console.log(`✅ Created ${fileName} with ${batchLines.length - 1} items`);
    }
    
    console.log('🎉 All batch files created!');
    console.log('📝 Next step: Import each batch using the MCP Supabase tools');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

importAllRemaining();
