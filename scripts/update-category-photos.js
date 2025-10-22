const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://jppymhzgprvshurcqmdn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwcHltaHpncHJ2c2h1cmNxbWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODM0NzIsImV4cCI6MjA3NjY1OTQ3Mn0.SkAnsUjAgamEZxNBAXciJVSlAvWH4wji4lJrEYq-1uA';

const supabase = createClient(supabaseUrl, supabaseKey);

// Category to photo mapping
const categoryPhotoMap = {
  'Hot Coffee': [
    'Turkish Coffee.jpg',
    'V60.jpg',
    'Espresso',
    'Americano',
    'Latte',
    'Cappuccino',
    'Mocha',
    'Filter Coffee'
  ],
  'Ice Coffee': [
    'Iced',
    'Iced Latte',
    'Iced Americano',
    'Iced Mocha',
    'Iced Matcha',
    'Iced Caramel',
    'Iced Filter Coffee'
  ],
  'Cold drinks': [
    'Lemonade',
    'Orange Juice',
    'Apple juice',
    'Carrot juice',
    'Tea',
    'Chai Tea',
    'Ginger'
  ],
  'Blended Coffee': [
    'Frappucino',
    'Frappe',
    'Blended',
    'Mocha Frappucino',
    'Pistachio Frappucino',
    'Vanilla Frappucino',
    'Caramel Frappucino'
  ],
  'Matcha': [
    'Matcha',
    'Pink Matcha',
    'Iced Matcha',
    'Matcha Latte',
    'Pink Perry Matcha'
  ],
  'Flavored tea': [
    'Tea',
    'Chai',
    'Ginger',
    'Lime blossom',
    'Flavoured tea'
  ],
  'Fresh juices': [
    'Orange juice',
    'Apple juice',
    'Carrot juice',
    'Orange',
    'Apple',
    'Carrot',
    'Lemonade'
  ],
  'Milkshakes': [
    'Milkshake',
    'Oreo milkshake',
    'Chocolate milkshake',
    'Vanilla milkshake',
    'Strawberry milkshake',
    'Caramel milkshake',
    'Lotus milkshake'
  ],
  'Mojitos': [
    'Mojito',
    'Strawberry Mojito',
    'Pineapple Mojito',
    'Mango Mojito',
    'Peach Mojito',
    'Ginger Mojito',
    'Kiwi Mojito',
    'Pomegranate Mojito'
  ],
  'Smoothies': [
    'Smoothie',
    'Strawberry Smoothie',
    'Mango Smoothie',
    'Pineapple Smoothie',
    'Peach Smoothie',
    'Mix Berries Smoothie',
    'Caribbean Smoothie'
  ],
  'Signature': [
    'Piko',
    'Piko Latte',
    'Piko Mocha',
    'Piko Crepe',
    'Spanish Latte',
    'Zebra Mocha',
    'Sahlab'
  ],
  'Sweets': [
    'Tiramisu',
    'Cheesecake',
    'Opera Cake',
    'Honey Cake',
    'Brownie',
    'Carrot Cake',
    'San Sebastian',
    'Fondant'
  ],
  'Patisserie': [
    'Waffle',
    'Pancake',
    'Crepe',
    'Croissants',
    'Cookies',
    'Chimney Cake',
    'Profiterol'
  ],
  'Ice Cream': [
    'Ice cream',
    'Gelato',
    'Sorbet'
  ]
};

// Function to normalize text for matching
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Function to find best photo for a category
function findBestCategoryPhoto(categoryName, photos) {
  const keywords = categoryPhotoMap[categoryName] || [];
  let bestMatch = null;
  let bestScore = 0;
  
  for (const photo of photos) {
    const photoName = path.parse(photo).name;
    const normalizedPhoto = normalizeText(photoName);
    
    // Check against category keywords
    for (const keyword of keywords) {
      const normalizedKeyword = normalizeText(keyword);
      
      // Exact match gets highest score
      if (normalizedPhoto === normalizedKeyword) {
        return { photo, score: 1.0 };
      }
      
      // Partial match
      if (normalizedPhoto.includes(normalizedKeyword) || normalizedKeyword.includes(normalizedPhoto)) {
        const score = 0.8;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = photo;
        }
      }
    }
  }
  
  return bestMatch ? { photo: bestMatch, score: bestScore } : null;
}

// Function to upload photo to Supabase Storage
async function uploadCategoryPhoto(photoPath, categoryName) {
  try {
    const fileBuffer = fs.readFileSync(photoPath);
    const fileName = `${normalizeText(categoryName).replace(/\s+/g, '-')}.jpg`;
    const storagePath = `categories/${fileName}`;
    
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

async function updateCategoryPhotos() {
  try {
    console.log('🖼️ Starting category photo updates...');
    
    // Get all photos
    const photosDir = path.join(__dirname, '../Piko Web app Photos 6');
    const photos = fs.readdirSync(photosDir)
      .filter(file => file.toLowerCase().endsWith('.jpg'))
      .map(file => path.join(photosDir, file));
    
    console.log(`📸 Found ${photos.length} photos`);
    
    // Get all categories from database
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, names, image');
    
    if (categoriesError) {
      throw new Error(`Failed to fetch categories: ${categoriesError.message}`);
    }
    
    console.log(`📁 Found ${categories.length} categories`);
    
    const matches = [];
    const unmatched = [];
    
    // Match each category with photos
    for (const category of categories) {
      const categoryName = category.names.en;
      const match = findBestCategoryPhoto(categoryName, photos);
      
      if (match) {
        matches.push({
          category,
          photo: match.photo,
          score: match.score
        });
      } else {
        unmatched.push(category);
      }
    }
    
    console.log(`🎯 Found ${matches.length} potential matches`);
    console.log(`❓ ${unmatched.length} categories without matches`);
    
    // Show matches
    console.log('\n📋 Category matches:');
    matches.forEach(match => {
      const photoName = path.parse(match.photo).name;
      console.log(`  ${match.category.names.en} → ${photoName} (${(match.score * 100).toFixed(1)}%)`);
    });
    
    if (unmatched.length > 0) {
      console.log('\n❓ Unmatched categories:');
      unmatched.forEach(category => {
        console.log(`  - ${category.names.en}`);
      });
    }
    
    // Upload matched photos and update database
    console.log('\n📤 Uploading category photos and updating database...');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const match of matches) {
      try {
        const imageUrl = await uploadCategoryPhoto(match.photo, match.category.names.en);
        
        if (imageUrl) {
          // Update category with image URL
          const { error: updateError } = await supabase
            .from('categories')
            .update({ image_url: imageUrl })
            .eq('id', match.category.id);
          
          if (updateError) {
            console.error(`❌ Failed to update ${match.category.names.en}:`, updateError.message);
            errorCount++;
          } else {
            console.log(`✅ Updated ${match.category.names.en} with image`);
            successCount++;
          }
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing ${match.category.names.en}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n🎉 Category photo updates completed!');
    console.log(`✅ Successfully updated: ${successCount} categories`);
    console.log(`❌ Errors: ${errorCount} categories`);
    console.log(`❓ Unmatched: ${unmatched.length} categories`);
    
    // Show final statistics
    const { data: finalCategories, error: finalError } = await supabase
      .from('categories')
      .select('id, names, image_url');
    
    if (!finalError) {
      const withImages = finalCategories.filter(cat => cat.image_url).length;
      console.log(`📊 Final stats: ${withImages}/${finalCategories.length} categories have images (${Math.round(withImages/finalCategories.length*100)}%)`);
    }
    
  } catch (error) {
    console.error('❌ Category photo updates failed:', error.message);
    process.exit(1);
  }
}

// Run the category photo updates
updateCategoryPhotos();
