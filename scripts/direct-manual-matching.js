#!/usr/bin/env node

/**
 * Direct Manual Matching Script
 * 
 * This script creates direct manual mappings between Arabic menu item names
 * and the uploaded photos, then updates the database.
 */

const fs = require('fs').promises;
const path = require('path');

// Supabase Configuration
const SUPABASE_URL = 'https://eoaissoqwlfvfizfomax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvYWlzc29xd2xmdmZpemZvbWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTY5OTIsImV4cCI6MjA3NTMzMjk5Mn0.SHkFV9EvSnWVmC0tApVU6A6C1rrDqsPMO922rMC1JpY';

class DirectManualMatcher {
  constructor() {
    this.photoMappings = new Map();
  }

  /**
   * Get all items from database
   */
  async getAllItems() {
    try {
      console.log('🔍 Fetching all items from database...');
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/items?select=*`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const items = await response.json();
        console.log(`📋 Found ${items.length} items in database`);
        return items;
      } else {
        console.error('❌ Failed to fetch items:', response.status, await response.text());
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching items:', error.message);
      return [];
    }
  }

  /**
   * Update item image URL in database
   */
  async updateItemImage(itemId, imageUrl) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/items?id=eq.${itemId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          image_url: imageUrl
        })
      });

      return response.ok;
    } catch (error) {
      console.error(`❌ Error updating item ${itemId}:`, error.message);
      return false;
    }
  }

  /**
   * Get all uploaded images from Supabase Storage
   */
  async getUploadedImages() {
    try {
      console.log('🔍 Fetching uploaded images from Supabase Storage...');
      
      const response = await fetch(`${SUPABASE_URL}/storage/v1/object/list/menu-images/menu-items`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        }
      });

      if (response.ok) {
        const images = await response.json();
        console.log(`📸 Found ${images.length} uploaded images`);
        
        // Create mapping of image names to URLs
        for (const image of images) {
          const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/menu-images/menu-items/${image.name}`;
          this.photoMappings.set(image.name, publicUrl);
        }
        
        return images;
      } else {
        console.error('❌ Failed to fetch images:', response.status, await response.text());
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching images:', error.message);
      return [];
    }
  }

  /**
   * Create manual mappings for Arabic names to image filenames
   */
  createManualMappings() {
    return {
      // Coffee items
      'اسبريسو': 'espressojpg.jpg',
      'دبل اسبريسو': 'espressojpg.jpg',
      'اسبريسو مكياتو': 'macchiatojpg.jpg',
      'اسبريسو افوكاتو': 'espressojpg.jpg',
      'اسبريسو ريستريتو': 'espressojpg.jpg',
      'امريكانو': 'americanojpg.jpg',
      'كابتشينو': 'hotjpg.jpg',
      'لاتيه': 'lattejpg.jpg',
      'فلات وايت': 'whitejpg.jpg',
      'كورتادو': 'cortadojpg.jpg',
      
      // Waffles
      'وافل اوريو': 'oreojpg.jpg',
      'وافل بستاشيو': 'pistachiojpg.jpg',
      'وافل شوكولا': 'chocolatejpg.jpg',
      'وافل فريز': 'strawberryjpg.jpg',
      'وافل فواكه': '_jpg.jpg',
      'وافل مارشميلو': 'marshmallowjpg.jpg',
      'وافل لوتوس': 'lotusjpg.jpg',
      
      // Crepes
      'كريب شوكولا': 'chocolatejpg.jpg',
      'كريب فواكه': '_jpg.jpg',
      'كريب لوتوس': 'lotusjpg.jpg',
      'كريب فوتوتشيني': 'fettuccinejpg.jpg',
      'كريب بيكو': 'pikojpg.jpg',
      'كريب تشيز كيك': 'cakejpg.jpg',
      'كريب اوريو': 'oreojpg.jpg',
      'كريب بستاشيو': 'pistachiojpg.jpg',
      
      // Matcha and Pink drinks
      'ماتشا لاتيه': 'lattejpg.jpg',
      'بينك ماتشا لاتيه': 'lattejpg.jpg',
      'بينك بيري ماتشا لاتيه': 'lattejpg.jpg',
      'ستروبيري ماتشا لاتيه': 'matchajpg.jpg',
      
      // Mojitos
      'موهيتو باشن برتقال': 'orangejpg.jpg',
      'موهيتو مانجو': 'mangojpg.jpg',
      'موهيتو ميكس بيريز': '_jpg.jpg',
      'موهيتو زنجبيل': 'gingerjpg.jpg',
      'موهيتو فريز': 'strawberryjpg.jpg',
      'موهيتو كيوي': 'kiwijpg.jpg',
      'موهيتو دراق': 'peachjpg.jpg',
      'موهيتو رمان': 'pomegranatejpg.jpg',
      'موهيتو اناناس': 'pineapplejpg.jpg',
      'موهيتو خيار': 'cucumberjpg.jpg',
      'كلاسيك موهيتو': 'mojitojpg.jpg',
      
      // Smoothies
      'سموزي رمان': 'pomegranatejpg.jpg',
      'سموزي مانجو': 'mangojpg.jpg',
      'سموزي فريز': 'strawberryjpg.jpg',
      'سموزي ميكس بيري': '_jpg.jpg',
      'سموزي برتقال': 'orangejpg.jpg',
      'سموزي دراق': 'peachjpg.jpg',
      'سموزي اناناس': 'pineapplejpg.jpg',
      
      // Juices
      'عصير اناناس': 'pineapplejpg.jpg',
      'عصير فريز': 'strawberryjpg.jpg',
      'عصير كيوي': 'kiwijpg.jpg',
      'عصير دراق': 'peachjpg.jpg',
      'عصير رمان': 'pomegranatejpg.jpg',
      'عصير جزر': 'carrotjpg.jpg',
      'عصير تفاح': 'applejpg.jpg',
      'عصير برتقال': 'orangejpg.jpg',
      'عصير عنب': '_jpg.jpg',
      'عصير مانجو': 'mangojpg.jpg',
      'عصير بطيخ': '_jpg.jpg',
      'عصير شمام': '_jpg.jpg',
      
      // Milkshakes
      'ميلك شيك بستاشيو': 'pistachiojpg.jpg',
      'ميلك شيك شوكولا': 'chocolatejpg.jpg',
      'ميلك شيك فريز': 'strawberryjpg.jpg',
      'ميلك شيك فانيليا': '_jpg.jpg',
      'ميلك شيك اوريو': '_jpg.jpg',
      
      // Teas and Herbal drinks
      'شاي': 'teajpg.jpg',
      'شاي تي لاتيه': 'lattejpg.jpg',
      'زهورات': 'herbal-teajpg.jpg',
      'زيزفون': '_jpg.jpg',
      'سحلب بالقرفة': '_jpg.jpg',
      
      // Hot chocolate and drinks
      'هوت شوكلت': '_jpg.jpg',
      'وايت هوت شوكلت': '_jpg.jpg',
      
      // Filter coffee
      'فلتر قهوة': '_jpg.jpg',
      'فلتر قهوة بالحليب': 'milkjpg.jpg',
      'ايس فيلتر قهوة': '_jpg.jpg',
      'ايس فيلتر قهوة بالحليب': 'milkjpg.jpg',
      
      // Turkish and Arabic coffee
      'قهوة تركية': '_jpg.jpg',
      'قهوة تركية دبل': '_jpg.jpg',
      'قهوة عربية': '_jpg.jpg',
      'قهوة عربية دبل': '_jpg.jpg',
      
      // Pancakes
      'بان كيك': 'cakejpg.jpg',
      'بان كيك بالعسل': 'cakejpg.jpg',
      'بان كيك بالشوكولا': 'chocolatejpg.jpg',
      'بان كيك بالفريز': 'strawberryjpg.jpg',
      
      // Cakes and desserts
      'تشيز كيك': 'cakejpg.jpg',
      'تشيز كيك شوكولا': 'chocolatejpg.jpg',
      'تشيز كيك فريز': 'strawberryjpg.jpg',
      'تشيز كيك بستاشيو': 'pistachiojpg.jpg',
      'تشيز كيك بلو بيري': '_jpg.jpg',
      'تيراميسو': 'tiramisujpg.jpg',
      'كيكة العسل': 'honeyjpg.jpg',
      'كيكة براونيز': 'browniesjpg.jpg',
      'كيكة الجزر': 'carrotjpg.jpg',
      'فوندون': 'fondantjpg.jpg',
      'كيك اوريو': 'oreojpg.jpg',
      
      // Cookies
      'كوكيز بندوق': 'hazelnutjpg.jpg',
      'كوكيز لوتوس': 'lotusjpg.jpg',
      'كوكيز بستاشيو': 'pistachiojpg.jpg',
      'كوكيز توت احمر': '_jpg.jpg',
      
      // Croissants
      'كروسان سادة': 'pistachiojpg.jpg',
      
      // Frappuccinos
      'فرابتشينو كراميل': 'carameljpg.jpg',
      'فرابتشينو موكا': 'mochajpg.jpg',
      'فرابتشينو فريز': 'strawberryjpg.jpg',
      'فرابتشينو شوكولا': 'chocolatejpg.jpg',
      'فرابتشينو فانيليا': '_jpg.jpg',
      'فرابتشينو ماتشا': 'matchajpg.jpg',
      
      // Iced drinks
      'ايس لاتيه': 'lattejpg.jpg',
      'ايس امريكانو': 'americanojpg.jpg',
      'ايس موكا لاتيه': 'lattejpg.jpg',
      'ايس كراميل مكياتو': 'macchiatojpg.jpg',
      'ايس فانيليا لاتيه': 'lattejpg.jpg',
      'ايس كراميل لاتيه': 'lattejpg.jpg',
      
      // Special items
      'في 60': '_jpg.jpg',
      'اوبرا': 'operajpg.jpg',
      'زيبرا موكا': '.mochajpg.jpg',
      'كراميل مكياتو': 'macchiatojpg.jpg',
      
      // Lemonade
      'ليموناضا': 'lemonadejpg.jpg',
    };
  }

  /**
   * Find matching photo for an item
   */
  findMatchingPhoto(arabicName, manualMappings, uploadedImages) {
    // Try manual mapping first
    if (manualMappings[arabicName]) {
      const mappedFilename = manualMappings[arabicName];
      const matchingImage = uploadedImages.find(img => img.name.includes(mappedFilename.replace('.jpg', '')));
      if (matchingImage) {
        return matchingImage.name;
      }
    }
    
    // Fallback: try to find by partial name matching
    const normalizedItemName = arabicName.toLowerCase().replace(/[^a-z\u0600-\u06FF]/g, '');
    
    for (const image of uploadedImages) {
      const normalizedImageName = image.name.toLowerCase().replace(/[^a-z\u0600-\u06FF]/g, '');
      
      // Check if item name appears in image name or vice versa
      if (normalizedImageName.includes(normalizedItemName) || normalizedItemName.includes(normalizedImageName)) {
        return image.name;
      }
    }
    
    return null;
  }

  /**
   * Perform direct manual matching
   */
  async performDirectMatching() {
    console.log('🎯 Starting direct manual matching...\n');

    try {
      // Get all items and uploaded images
      const [items, uploadedImages] = await Promise.all([
        this.getAllItems(),
        this.getUploadedImages()
      ]);

      if (items.length === 0 || uploadedImages.length === 0) {
        console.log('❌ No items or images found');
        return;
      }

      // Create manual mappings
      const manualMappings = this.createManualMappings();

      let matchedCount = 0;
      let unmatchedItems = 0;

      // Match photos with menu items
      console.log('\n🎯 Matching photos with menu items...');
      for (const item of items) {
        const arabicName = item.names?.ar || '';
        const matchingPhoto = this.findMatchingPhoto(arabicName, manualMappings, uploadedImages);
        
        if (matchingPhoto && this.photoMappings.has(matchingPhoto)) {
          const imageUrl = this.photoMappings.get(matchingPhoto);
          
          console.log(`🎯 ${arabicName} → ${matchingPhoto}`);
          
          const updated = await this.updateItemImage(item.id, imageUrl);
          
          if (updated) {
            matchedCount++;
          }
          
          // Small delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 50));
        } else {
          console.log(`❌ No match found for: ${arabicName}`);
          unmatchedItems++;
        }
      }

      console.log(`\n📊 Final Results:`);
      console.log(`🎯 Items matched: ${matchedCount}`);
      console.log(`❌ Unmatched items: ${unmatchedItems}`);

      console.log('\n🎉 Direct manual matching completed!');
      console.log('\n📝 Next steps:');
      console.log('1. Refresh your browser to see the actual photos');
      console.log('2. Each item should now display its real uploaded photo');
      console.log('3. Check the admin panel to verify the images are correct');

    } catch (error) {
      console.error('❌ Direct matching process failed:', error.message);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const matcher = new DirectManualMatcher();
  await matcher.performDirectMatching();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DirectManualMatcher;
