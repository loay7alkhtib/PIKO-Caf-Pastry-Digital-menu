#!/usr/bin/env node

/**
 * Match Real Images Script
 * 
 * This script matches the actual uploaded images with menu items
 * based on their Arabic names and proper translation matching.
 */

const https = require('https');

// Supabase Configuration
const SUPABASE_URL = 'https://eoaissoqwlfvfizfomax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvYWlzc29xd2xmdmZpemZvbWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTY5OTIsImV4cCI6MjA3NTMzMjk5Mn0.SHkFV9EvSnWVmC0tApVU6A6C1rrDqsPMO922rMC1JpY';

class RealImageMatcher {
  constructor() {
    this.translationMap = {
      // Coffee Types
      'امريكانو': 'americano',
      'اسبريسو': 'espresso',
      'لاتيه': 'latte',
      'كابتشينو': 'cappuccino',
      'موكا': 'mocha',
      'ماتشا': 'matcha',
      'كراميل': 'caramel',
      'فانيليا': 'vanilla',
      'شوكولا': 'chocolate',
      'شوكليت': 'chocolate',
      'بستاشيو': 'pistachio',
      'بندق': 'hazelnut',
      'بندوق': 'hazelnut',
      
      // Drink Types
      'ايس': 'iced',
      'هوت': 'hot',
      'وايت': 'white',
      'دبل': 'double',
      'فيلتر': 'filter',
      'تركية': 'turkish',
      'عربية': 'arabic',
      'مكياتو': 'macchiato',
      'كورتادو': 'cortado',
      'فلات': 'flat',
      'فلات وايت': 'flat-white',
      
      // Fruits & Flavors
      'فريز': 'strawberry',
      'ستروبيري': 'strawberry',
      'ستروبري': 'strawberry',
      'برتقال': 'orange',
      'ليمون': 'lemon',
      'اناناس': 'pineapple',
      'مانجو': 'mango',
      'كيوي': 'kiwi',
      'رمان': 'pomegranate',
      'دراق': 'peach',
      'باشن': 'passion',
      'بينك': 'pink',
      'بلو بيري': 'blueberry',
      'ميكس بيري': 'mixed-berry',
      'ميكس بيريز': 'mixed-berry',
      
      // Desserts & Pastries
      'كريب': 'crepe',
      'وافل': 'waffle',
      'بان كيك': 'pancake',
      'تشيز كيك': 'cheesecake',
      'تيراميسو': 'tiramisu',
      'اوبرا': 'opera',
      'فوندون': 'fondant',
      'كروسان': 'croissant',
      'كوكيز': 'cookies',
      'كيكة': 'cake',
      'كيك': 'cake',
      'براونيز': 'brownies',
      'تشمني': 'chocolate',
      'لوتوس': 'lotus',
      'اوريو': 'oreo',
      'مارشميلو': 'marshmallow',
      
      // Size variants
      'كبير': 'large',
      'وسط': 'medium',
      'صغير': 'small',
      
      // Beverage types
      'موهيتو': 'mojito',
      'سموزي': 'smoothie',
      'عصير': 'juice',
      'شاي': 'tea',
      'زهورات': 'herbal-tea',
      'زيزفون': 'linden-tea',
      'سحلب': 'salep',
      'ميلك شيك': 'milkshake',
      'فراب': 'frappuccino',
      'كول': 'cool',
      'هيبسكوس': 'hibiscus',
      'بينا كولادا': 'pina-colada',
      
      // Other ingredients
      'جزر': 'carrot',
      'تفاح': 'apple',
      'قرفة': 'cinnamon',
      'زنجبيل': 'ginger',
      'ليموناضة': 'lemonade',
      'نعناع': 'mint',
      'بابلز': 'bubbles',
      'ميكس': 'mix',
      'صودا': 'soda',
      'ريد بول': 'red-bull',
      'سفن': '7up',
      'كلاسيك': 'classic',
      'بيكو': 'piko'
    };
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
  async getAllUploadedImages() {
    try {
      console.log('🔍 Fetching all uploaded images from Supabase Storage...');
      
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
      // Filter out category images
      const realImages = images.filter(img => !img.name.includes('category-image'));
      console.log(`📸 Found ${realImages.length} real uploaded images`);
      
      return realImages;
    } catch (error) {
      console.error('❌ Error fetching images:', error.message);
      return [];
    }
  }

  /**
   * Get all items from database
   */
  async getAllItems() {
    try {
      console.log('🔍 Fetching all items from database...');
      
      const result = await this.makeRequest('/rest/v1/items?select=*', {
        method: 'GET'
      });

      if (!result.success) {
        console.error('❌ Failed to fetch items:', result.error);
        return [];
      }

      const items = result.data || [];
      console.log(`📋 Found ${items.length} items in database`);
      
      return items;
    } catch (error) {
      console.error('❌ Error fetching items:', error.message);
      return [];
    }
  }

  /**
   * Translate Arabic text to English using the translation map
   */
  translateToEnglish(arabicText) {
    let englishText = arabicText.toLowerCase();
    
    // Apply translations
    for (const [arabic, english] of Object.entries(this.translationMap)) {
      const regex = new RegExp(arabic, 'gi');
      englishText = englishText.replace(regex, english);
    }
    
    // Clean up any remaining Arabic characters
    englishText = englishText
      .replace(/[\u0600-\u06FF]/g, '') // Remove any remaining Arabic characters
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Keep only letters, numbers, spaces, and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .toLowerCase();
    
    return englishText || 'item';
  }

  /**
   * Find best matching image for an item
   */
  findBestMatchingImage(arabicName, availableImages) {
    const translatedName = this.translateToEnglish(arabicName);
    
    // Try exact match first
    for (const image of availableImages) {
      const imageName = image.name.replace('menu-items/', '').replace('.jpg', '');
      if (imageName.toLowerCase().includes(translatedName.toLowerCase()) || 
          translatedName.toLowerCase().includes(imageName.toLowerCase())) {
        return image;
      }
    }
    
    // Try partial matches
    const words = translatedName.split('-');
    for (const word of words) {
      if (word.length > 2) { // Only match words longer than 2 characters
        for (const image of availableImages) {
          const imageName = image.name.replace('menu-items/', '').replace('.jpg', '');
          if (imageName.toLowerCase().includes(word.toLowerCase())) {
            return image;
          }
        }
      }
    }
    
    // Try category-based matching
    if (arabicName.includes('كريب') || arabicName.includes('crepe')) {
      return availableImages.find(img => img.name.includes('crepe'));
    } else if (arabicName.includes('وافل') || arabicName.includes('waffle')) {
      return availableImages.find(img => img.name.includes('waffle'));
    } else if (arabicName.includes('ايس') || arabicName.includes('iced')) {
      return availableImages.find(img => img.name.includes('iced'));
    } else if (arabicName.includes('موهيتو') || arabicName.includes('سموزي')) {
      return availableImages.find(img => img.name.includes('smoothie') || img.name.includes('mojito'));
    } else if (arabicName.includes('عصير') || arabicName.includes('juice')) {
      return availableImages.find(img => img.name.includes('juice'));
    }
    
    // Default fallback - find any coffee-related image
    return availableImages.find(img => img.name.includes('coffee') || img.name.includes('latte') || img.name.includes('espresso'));
  }

  /**
   * Update item image URL
   */
  async updateItemImage(itemId, imageUrl) {
    try {
      const result = await this.makeRequest(`/rest/v1/items?id=eq.${itemId}`, {
        method: 'PATCH',
        headers: {
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          image_url: imageUrl
        })
      });

      if (result.success) {
        return true;
      } else {
        console.error(`❌ Failed to update item ${itemId}:`, result.error);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error updating item ${itemId}:`, error.message);
      return false;
    }
  }

  /**
   * Match real uploaded images with menu items
   */
  async matchRealImages() {
    console.log('🎯 Matching real uploaded images with menu items...\n');

    try {
      const [uploadedImages, dbItems] = await Promise.all([
        this.getAllUploadedImages(),
        this.getAllItems()
      ]);

      if (uploadedImages.length === 0) {
        console.log('❌ No uploaded images found');
        return;
      }

      let matchedCount = 0;
      let unmatchedCount = 0;

      for (const item of dbItems) {
        const arabicName = item.names?.ar || '';
        const matchingImage = this.findBestMatchingImage(arabicName, uploadedImages);
        
        if (matchingImage) {
          const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/menu-images/${matchingImage.name}`;
          
          console.log(`🎯 ${arabicName} → ${matchingImage.name}`);
          
          const updated = await this.updateItemImage(item.id, imageUrl);
          
          if (updated) {
            matchedCount++;
          } else {
            unmatchedCount++;
          }
        } else {
          console.log(`❌ No match found for: ${arabicName}`);
          unmatchedCount++;
        }

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      console.log(`\n📊 Matching Summary:`);
      console.log(`✅ Matched: ${matchedCount} items`);
      console.log(`❌ Unmatched: ${unmatchedCount} items`);

      console.log('\n🎉 Real image matching completed!');
      console.log('\n📝 Next steps:');
      console.log('1. Refresh your browser to see the actual uploaded images');
      console.log('2. Each item should now display its proper uploaded image');
      console.log('3. If some items still show placeholders, upload more specific images for those items');

    } catch (error) {
      console.error('❌ Matching process failed:', error.message);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const matcher = new RealImageMatcher();
  await matcher.matchRealImages();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = RealImageMatcher;
