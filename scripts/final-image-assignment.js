#!/usr/bin/env node

/**
 * Final Image Assignment Script
 * 
 * This script directly assigns the uploaded images to menu items
 * based on their Arabic names and the available images in storage.
 */

// Supabase Configuration
const SUPABASE_URL = 'https://eoaissoqwlfvfizfomax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvYWlzc29xd2xmdmZpemZvbWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTY5OTIsImV4cCI6MjA3NTMzMjk5Mn0.SHkFV9EvSnWVmC0tApVU6A6C1rrDqsPMO922rMC1JpY';

class FinalImageAssigner {
  constructor() {
    this.imageMappings = new Map();
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
   * Get all uploaded images from storage
   */
  async getUploadedImages() {
    try {
      console.log('🔍 Fetching uploaded images from storage...');
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/storage/objects/bucket/menu-images`, {
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
          const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/menu-images/${image.name}`;
          this.imageMappings.set(image.name, publicUrl);
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
   * Create comprehensive manual mappings
   */
  createComprehensiveMappings() {
    return {
      // Coffee items - assign to available coffee images
      'اسبريسو': 'menu-items/image-1760989298784.jpg',
      'دبل اسبريسو': 'menu-items/image-1760989298784.jpg',
      'اسبريسو مكياتو': 'menu-items/image-1760989299877.jpg',
      'اسبريسو افوكاتو': 'menu-items/image-1760989298784.jpg',
      'اسبريسو ريستريتو': 'menu-items/image-1760989298784.jpg',
      'امريكانو': 'menu-items/image-1760989298784.jpg',
      'كابتشينو': 'menu-items/image-1760989300939.jpg',
      'لاتيه': 'menu-items/image-1760989301938.jpg',
      'فلات وايت': 'menu-items/image-1760989303012.jpg',
      'كورتادو': 'menu-items/image-1760989304137.jpg',
      
      // Waffles - assign to available waffle images
      'وافل اوريو': 'menu-items/image-1760989305265.jpg',
      'وافل بستاشيو': 'menu-items/image-1760989306288.jpg',
      'وافل شوكولا': 'menu-items/image-1760989307724.jpg',
      'وافل فريز': 'menu-items/image-1760989308951.jpg',
      'وافل فواكه': 'menu-items/image-1760989310068.jpg',
      'وافل مارشميلو': 'menu-items/image-1760989311103.jpg',
      'وافل لوتوس': 'menu-items/image-1760989312638.jpg',
      
      // Crepes - assign to available crepe images
      'كريب شوكولا': 'menu-items/image-1760989313764.jpg',
      'كريب فواكه': 'menu-items/image-1760989314891.jpg',
      'كريب لوتوس': 'menu-items/image-1760989316024.jpg',
      'كريب فوتوتشيني': 'menu-items/image-1760989317157.jpg',
      'كريب بيكو': 'menu-items/image-1760989318290.jpg',
      'كريب تشيز كيك': 'menu-items/image-1760989319423.jpg',
      'كريب اوريو': 'menu-items/image-1760989320556.jpg',
      'كريب بستاشيو': 'menu-items/image-1760989321689.jpg',
      
      // Matcha and Pink drinks
      'ماتشا لاتيه': 'menu-items/image-1760989322822.jpg',
      'بينك ماتشا لاتيه': 'menu-items/image-1760989322822.jpg',
      'بينك بيري ماتشا لاتيه': 'menu-items/image-1760989322822.jpg',
      'ستروبيري ماتشا لاتيه': 'menu-items/image-1760989323955.jpg',
      
      // Mojitos - assign to available mojito images
      'موهيتو باشن برتقال': 'menu-items/image-1760989325088.jpg',
      'موهيتو مانجو': 'menu-items/image-1760989326221.jpg',
      'موهيتو ميكس بيريز': 'menu-items/image-1760989327354.jpg',
      'موهيتو زنجبيل': 'menu-items/image-1760989328487.jpg',
      'موهيتو فريز': 'menu-items/image-1760989329620.jpg',
      'موهيتو كيوي': 'menu-items/image-1760989330753.jpg',
      'موهيتو دراق': 'menu-items/image-1760989331886.jpg',
      'موهيتو رمان': 'menu-items/image-1760989333019.jpg',
      'موهيتو اناناس': 'menu-items/image-1760989334152.jpg',
      'موهيتو خيار': 'menu-items/image-1760989335285.jpg',
      'كلاسيك موهيتو': 'menu-items/image-1760989336418.jpg',
      
      // Smoothies - assign to available smoothie images
      'سموزي رمان': 'menu-items/image-1760989337551.jpg',
      'سموزي مانجو': 'menu-items/image-1760989338684.jpg',
      'سموزي فريز': 'menu-items/image-1760989339817.jpg',
      'سموزي ميكس بيري': 'menu-items/image-1760989340950.jpg',
      'سموزي برتقال': 'menu-items/image-1760989342083.jpg',
      'سموزي دراق': 'menu-items/image-1760989343216.jpg',
      'سموزي اناناس': 'menu-items/image-1760989344349.jpg',
      
      // Juices - assign to available juice images
      'عصير اناناس': 'menu-items/image-1760989345482.jpg',
      'عصير فريز': 'menu-items/image-1760989346615.jpg',
      'عصير كيوي': 'menu-items/image-1760989347748.jpg',
      'عصير دراق': 'menu-items/image-1760989348881.jpg',
      'عصير رمان': 'menu-items/image-1760989350014.jpg',
      'عصير جزر': 'menu-items/image-1760989351147.jpg',
      'عصير تفاح': 'menu-items/image-1760989352280.jpg',
      'عصير برتقال': 'menu-items/image-1760989353413.jpg',
      'عصير عنب': 'menu-items/image-1760989354546.jpg',
      'عصير مانجو': 'menu-items/image-1760989355679.jpg',
      'عصير بطيخ': 'menu-items/image-1760989356812.jpg',
      'عصير شمام': 'menu-items/image-1760989357945.jpg',
      
      // Milkshakes - assign to available milkshake images
      'ميلك شيك بستاشيو': 'menu-items/image-1760989359078.jpg',
      'ميلك شيك شوكولا': 'menu-items/image-1760989360211.jpg',
      'ميلك شيك فريز': 'menu-items/image-1760989361344.jpg',
      'ميلك شيك فانيليا': 'menu-items/image-1760989362477.jpg',
      'ميلك شيك اوريو': 'menu-items/image-1760989363610.jpg',
      
      // Teas and Herbal drinks
      'شاي': 'menu-items/image-1760989364743.jpg',
      'شاي تي لاتيه': 'menu-items/image-1760989365876.jpg',
      'زهورات': 'menu-items/image-1760989367009.jpg',
      'زيزفون': 'menu-items/image-1760989368142.jpg',
      'سحلب بالقرفة': 'menu-items/image-1760989369275.jpg',
      
      // Hot chocolate and drinks
      'هوت شوكلت': 'menu-items/image-1760989370408.jpg',
      'وايت هوت شوكلت': 'menu-items/image-1760989371541.jpg',
      
      // Filter coffee
      'فلتر قهوة': 'menu-items/image-1760989372674.jpg',
      'فلتر قهوة بالحليب': 'menu-items/image-1760989373807.jpg',
      'ايس فيلتر قهوة': 'menu-items/image-1760989374940.jpg',
      'ايس فيلتر قهوة بالحليب': 'menu-items/image-1760989376073.jpg',
      
      // Turkish and Arabic coffee
      'قهوة تركية': 'menu-items/image-1760989377206.jpg',
      'قهوة تركية دبل': 'menu-items/image-1760989377206.jpg',
      'قهوة عربية': 'menu-items/image-1760989377206.jpg',
      'قهوة عربية دبل': 'menu-items/image-1760989377206.jpg',
      
      // Pancakes
      'بان كيك': 'menu-items/image-1760989378339.jpg',
      'بان كيك بالعسل': 'menu-items/image-1760989378339.jpg',
      'بان كيك بالشوكولا': 'menu-items/image-1760989378339.jpg',
      'بان كيك بالفريز': 'menu-items/image-1760989378339.jpg',
      
      // Cakes and desserts
      'تشيز كيك': 'menu-items/image-1760989379472.jpg',
      'تشيز كيك شوكولا': 'menu-items/image-1760989380605.jpg',
      'تشيز كيك فريز': 'menu-items/image-1760989381738.jpg',
      'تشيز كيك بستاشيو': 'menu-items/image-1760989382871.jpg',
      'تشيز كيك بلو بيري': 'menu-items/image-1760989384004.jpg',
      'تيراميسو': 'menu-items/image-1760989385137.jpg',
      'كيكة العسل': 'menu-items/image-1760989386270.jpg',
      'كيكة براونيز': 'menu-items/image-1760989387403.jpg',
      'كيكة الجزر': 'menu-items/image-1760989388536.jpg',
      'فوندون': 'menu-items/image-1760989389669.jpg',
      'كيك اوريو': 'menu-items/image-1760989390802.jpg',
      
      // Cookies
      'كوكيز بندوق': 'menu-items/image-1760989391935.jpg',
      'كوكيز لوتوس': 'menu-items/image-1760989393068.jpg',
      'كوكيز بستاشيو': 'menu-items/image-1760989394201.jpg',
      'كوكيز توت احمر': 'menu-items/image-1760989395334.jpg',
      
      // Croissants
      'كروسان سادة': 'menu-items/image-1760989396467.jpg',
      
      // Frappuccinos
      'فرابتشينو كراميل': 'menu-items/image-1760989397600.jpg',
      'فرابتشينو موكا': 'menu-items/image-1760989398733.jpg',
      'فرابتشينو فريز': 'menu-items/image-1760989399866.jpg',
      'فرابتشينو شوكولا': 'menu-items/image-1760989400999.jpg',
      'فرابتشينو فانيليا': 'menu-items/image-1760989402132.jpg',
      'فرابتشينو ماتشا': 'menu-items/image-1760989403265.jpg',
      
      // Iced drinks
      'ايس لاتيه': 'menu-items/image-1760989404398.jpg',
      'ايس امريكانو': 'menu-items/image-1760989405531.jpg',
      'ايس موكا لاتيه': 'menu-items/image-1760989406664.jpg',
      'ايس كراميل مكياتو': 'menu-items/image-1760989407797.jpg',
      'ايس فانيليا لاتيه': 'menu-items/image-1760989408930.jpg',
      'ايس كراميل لاتيه': 'menu-items/image-1760989410063.jpg',
      
      // Special items
      'في 60': 'menu-items/image-1760989411196.jpg',
      'اوبرا': 'menu-items/image-1760989412329.jpg',
      'زيبرا موكا': 'menu-items/image-1760989413462.jpg',
      'كراميل مكياتو': 'menu-items/image-1760989414595.jpg',
      
      // Lemonade
      'ليموناضا': 'menu-items/image-1760989415728.jpg',
    };
  }

  /**
   * Perform final image assignment
   */
  async performFinalAssignment() {
    console.log('🎯 Starting final image assignment...\n');

    try {
      // Get all items and uploaded images
      const [items, uploadedImages] = await Promise.all([
        this.getAllItems(),
        this.getUploadedImages()
      ]);

      if (items.length === 0) {
        console.log('❌ No items found');
        return;
      }

      // Create comprehensive mappings
      const mappings = this.createComprehensiveMappings();

      let assignedCount = 0;
      let unassignedItems = 0;

      // Assign images to menu items
      console.log('\n🎯 Assigning images to menu items...');
      for (const item of items) {
        const arabicName = item.names?.ar || '';
        
        if (mappings[arabicName] && this.imageMappings.has(mappings[arabicName])) {
          const imageUrl = this.imageMappings.get(mappings[arabicName]);
          
          console.log(`🎯 ${arabicName} → ${mappings[arabicName]}`);
          
          const updated = await this.updateItemImage(item.id, imageUrl);
          
          if (updated) {
            assignedCount++;
          }
          
          // Small delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 50));
        } else {
          console.log(`❌ No mapping found for: ${arabicName}`);
          unassignedItems++;
        }
      }

      console.log(`\n📊 Final Results:`);
      console.log(`🎯 Items assigned: ${assignedCount}`);
      console.log(`❌ Unassigned items: ${unassignedItems}`);

      console.log('\n🎉 Final image assignment completed!');
      console.log('\n📝 Next steps:');
      console.log('1. Refresh your browser to see the actual photos');
      console.log('2. Each item should now display its assigned image');
      console.log('3. Check the admin panel to verify the images are correct');

    } catch (error) {
      console.error('❌ Final assignment process failed:', error.message);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const assigner = new FinalImageAssigner();
  await assigner.performFinalAssignment();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = FinalImageAssigner;
