const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://jppymhzgprvshurcqmdn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwcHltaHpncHJ2c2h1cmNxbWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODM0NzIsImV4cCI6MjA3NjY1OTQ3Mn0.SkAnsUjAgamEZxNBAXciJVSlAvWH4wji4lJrEYq-1uA';

const supabase = createClient(supabaseUrl, supabaseKey);

// Photo directory
const photosDir = path.join(__dirname, '../Piko Web app Photos 6');

// Function to normalize text for matching
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

// Function to calculate similarity between two strings
function calculateSimilarity(str1, str2) {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);
  
  if (s1 === s2) return 1.0;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Split into words and check word overlap
  const words1 = s1.split(' ');
  const words2 = s2.split(' ');
  
  let matches = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1.length > 2 && word2.length > 2 && 
          (word1.includes(word2) || word2.includes(word1))) {
        matches++;
        break;
      }
    }
  }
  
  return matches / Math.max(words1.length, words2.length);
}

// Function to find best match for an item
function findBestPhotoMatch(itemName, photos) {
  let bestMatch = null;
  let bestScore = 0;
  
  for (const photo of photos) {
    const photoName = path.parse(photo).name;
    const similarity = calculateSimilarity(itemName, photoName);
    
    if (similarity > bestScore) {
      bestScore = similarity;
      bestMatch = photo;
    }
  }
  
  // Only return if similarity is above threshold
  return bestScore > 0.3 ? { photo: bestMatch, score: bestScore } : null;
}

// Function to upload photo to Supabase Storage
async function uploadPhotoToStorage(photoPath, itemName) {
  try {
    const fileBuffer = fs.readFileSync(photoPath);
    const fileName = `${normalizeText(itemName).replace(/\s+/g, '-')}.jpg`;
    const storagePath = `menu-items/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('menu-images')
      .upload(storagePath, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (error) {
      console.error(`❌ Failed to upload ${fileName}:`, error.message);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('menu-images')
      .getPublicUrl(storagePath);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error(`❌ Error uploading ${photoPath}:`, error.message);
    return null;
  }
}

async function autoMatchPhotos() {
  try {
    console.log('🖼️ Starting automatic photo matching...');
    
    // Get all photos
    const photos = fs.readdirSync(photosDir)
      .filter(file => file.toLowerCase().endsWith('.jpg'))
      .map(file => path.join(photosDir, file));
    
    console.log(`📸 Found ${photos.length} photos`);
    
    // Get all items from database
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('id, names, image');
    
    if (itemsError) {
      throw new Error(`Failed to fetch items: ${itemsError.message}`);
    }
    
    console.log(`📦 Found ${items.length} items in database`);
    
    const matches = [];
    const unmatched = [];
    
    // Match each item with photos
    for (const item of items) {
      const itemName = item.names.en;
      const match = findBestPhotoMatch(itemName, photos);
      
      if (match) {
        matches.push({
          item,
          photo: match.photo,
          score: match.score
        });
      } else {
        unmatched.push(item);
      }
    }
    
    console.log(`🎯 Found ${matches.length} potential matches`);
    console.log(`❓ ${unmatched.length} items without matches`);
    
    // Show some examples of matches
    console.log('\n📋 Sample matches:');
    matches.slice(0, 10).forEach(match => {
      const photoName = path.parse(match.photo).name;
      console.log(`  ${match.item.names.en} → ${photoName} (${(match.score * 100).toFixed(1)}%)`);
    });
    
    if (unmatched.length > 0) {
      console.log('\n❓ Unmatched items:');
      unmatched.slice(0, 10).forEach(item => {
        console.log(`  - ${item.names.en}`);
      });
    }
    
    // Upload matched photos and update database
    console.log('\n📤 Uploading photos and updating database...');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const match of matches) {
      try {
        const imageUrl = await uploadPhotoToStorage(match.photo, match.item.names.en);
        
        if (imageUrl) {
          // Update item with image URL
          const { error: updateError } = await supabase
            .from('items')
            .update({ image: imageUrl })
            .eq('id', match.item.id);
          
          if (updateError) {
            console.error(`❌ Failed to update ${match.item.names.en}:`, updateError.message);
            errorCount++;
          } else {
            console.log(`✅ Updated ${match.item.names.en} with image`);
            successCount++;
          }
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing ${match.item.names.en}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n🎉 Photo matching completed!');
    console.log(`✅ Successfully matched: ${successCount} items`);
    console.log(`❌ Errors: ${errorCount} items`);
    console.log(`❓ Unmatched: ${unmatched.length} items`);
    
    // Show final statistics
    const { data: finalItems, error: finalError } = await supabase
      .from('items')
      .select('id, names, image');
    
    if (!finalError) {
      const withImages = finalItems.filter(item => item.image).length;
      console.log(`📊 Final stats: ${withImages}/${finalItems.length} items have images (${Math.round(withImages/finalItems.length*100)}%)`);
    }
    
  } catch (error) {
    console.error('❌ Auto-matching failed:', error.message);
    process.exit(1);
  }
}

// Run the auto-matching
autoMatchPhotos();
