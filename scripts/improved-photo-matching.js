#!/usr/bin/env node

/**
 * Improved Photo Matching Script
 * 
 * This script creates a better mapping between Arabic photo names and menu items,
 * then uploads them with proper unique filenames.
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// Supabase Configuration
const SUPABASE_URL = 'https://eoaissoqwlfvfizfomax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvYWlzc29xd2xmdmZpemZvbWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTY5OTIsImV4cCI6MjA3NTMzMjk5Mn0.SHkFV9EvSnWVmC0tApVU6A6C1rrDqsPMO922rMC1JpY';

class ImprovedPhotoMatcher {
  constructor() {
    this.photosFolder = path.join(__dirname, '..', 'Piko Web app Photos');
    this.photoMappings = new Map(); // Store photo mappings
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
   * Create safe filename for Supabase Storage
   */
  createSafeFilename(originalName, index) {
    // Remove .jpg extension
    const nameWithoutExt = originalName.replace('.jpg', '');
    
    // Create a safe filename with index to ensure uniqueness
    const safeName = `photo-${index}-${Date.now()}.jpg`;
    
    return safeName;
  }

  /**
   * Upload image to Supabase Storage
   */
  async uploadImageToSupabase(imageBuffer, filename) {
    try {
      const formData = new FormData();
      const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
      formData.append('file', blob, filename);
      const filePath = `menu-items/${filename}`;

      const response = await fetch(`${SUPABASE_URL}/storage/v1/object/menu-images/${filePath}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: formData
      });

      if (response.ok) {
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/menu-images/${filePath}`;
        return { success: true, url: publicUrl, filename };
      } else {
        const errorText = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
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
   * Update item image URL in database
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

      return result.success;
    } catch (error) {
      console.error(`❌ Error updating item ${itemId}:`, error.message);
      return false;
    }
  }

  /**
   * Normalize Arabic text for matching
   */
  normalizeArabicText(text) {
    return text
      .replace(/[\u064B-\u0652\u0670\u0640]/g, '') // Remove diacritics
      .replace(/[أإآ]/g, 'ا') // Normalize alef variants
      .replace(/[ة]/g, 'ه') // Normalize teh marbuta
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
      .toLowerCase();
  }

  /**
   * Create manual mappings for better matching
   */
  createManualMappings() {
    const mappings = {
      // Coffee items
      'اسبريسو': ['اسبريسو.jpg', 'دبل اسبريسو.jpg'],
      'دبل اسبريسو': ['دبل اسبريسو.jpg'],
      'اسبريسو مكياتو': ['كاراميل ماكياتو .jpg'],
      'اسبريسو افوكاتو': ['اسبريسو.jpg'],
      'اسبريسو ريستريتو': ['اسبريسو.jpg'],
      'كابتشينو': ['كلشي لاتيه سخن وكابتشينو .jpg'],
      'لاتيه': ['ايس بيكو لاتيه.jpg'],
      'فلات وايت': ['فلات وايت.jpg'],
      'كورتادو': ['كورتادو.jpg'],
      'امريكانو': ['امريكانو.jpg'],
      
      // Waffles
      'وافل اوريو': ['وافل اوريو.jpg'],
      'وافل بستاشيو': ['وافل بستاشيو.jpg'],
      'وافل شوكولا': ['وافل شوكولا .jpg'],
      'وافل فريز': ['وافل فريز.jpg'],
      'وافل فواكه': ['وافل فواكه.jpg'],
      'وافل مارشميلو': ['وافل مارشميلو.jpg'],
      'وافل لوتوس': ['وافل لوتوس.jpg'],
      
      // Crepes
      'كريب شوكولا': ['كريب شوكولا .jpg'],
      'كريب فواكه': ['كريب فواكه.jpg'],
      'كريب لوتوس': ['كريب لوتوس.jpg'],
      'كريب فوتوتشيني': ['كريب فوتوتشيني.jpg'],
      'كريب بيكو': ['كريب بيكو.jpg'],
      'كريب تشيز كيك': ['كريب تشيز كيك.jpg'],
      'كريب اوريو': ['كريب اوريو.jpg'],
      'كريب بستاشيو': ['كريب بستاشيو.jpg'],
      
      // Matcha and Pink drinks
      'ماتشا لاتيه': ['بينك ماتشا لاتيه+بينك بيري ماتشا لاتيه.jpg'],
      'بينك ماتشا لاتيه': ['بينك ماتشا لاتيه+بينك بيري ماتشا لاتيه.jpg'],
      'بينك بيري ماتشا لاتيه': ['بينك ماتشا لاتيه+بينك بيري ماتشا لاتيه.jpg'],
      'ستروبيري ماتشا لاتيه': ['ايس بينك ماتشا+ ايس بينك بيري ماتشا.jpg'],
      
      // Mojitos and Smoothies
      'موهيتو باشن برتقال': ['موهيتو باشن برتقال .jpg'],
      'موهيتو مانجو': ['موهيتو مانجو .jpg'],
      'موهيتو ميكس بيريز': ['موهيتو ميكس بيريز .jpg'],
      'موهيتو زنجبيل': ['موهيتو زنجبيل .jpg'],
      'موهيتو فريز': ['موهيتو فريز.jpg'],
      'موهيتو كيوي': ['موهيتو كيوي .jpg'],
      'موهيتو دراق': ['موهيتو دراق.jpg'],
      'موهيتو رمان': ['موهيتو رمان .jpg'],
      'موهيتو اناناس': ['موهيتو أناناس .jpg'],
      'موهيتو خيار': ['موهيتو خيار .jpg'],
      'كلاسيك موهيتو': ['كلاسيك موهيتو .jpg'],
      
      // Smoothies
      'سموزي رمان': ['سموزي ليمون مع رمان .jpg'],
      'سموزي مانجو': ['سموزي مانجو .jpg'],
      'سموزي فريز': ['سموزي فريز .jpg'],
      'سموزي ميكس بيريز': ['سموزي ميكس بيريز .jpg'],
      'سموزي برتقال': ['سموزي أناناس برتقال .jpg'],
      'سموزي دراق': ['سموزي دراق .jpg'],
      'سموزي أناناس': ['سموزي أناناس .jpg'],
      
      // Juices
      'عصير اناناس': ['عصير اناناس .jpg'],
      'عصير فريز': ['عصير فريز .jpg'],
      'عصير كيوي': ['عصير كيوي .jpg'],
      'عصير دراق': ['عصير دراق .jpg'],
      'عصير رمان': ['عصير رمان .jpg'],
      'عصير جزر': ['عصير جزر.jpg'],
      'عصير تفاح': ['عصير تفاح.jpg'],
      'عصير برتقال': ['عصير برتقال .jpg'],
      'عصير عنب': ['عصير عنب .jpg'],
      'عصير مانجو': ['عصير مانجو .jpg'],
      'عصير بطيخ': ['عصير بطيخ .jpg'],
      'عصير شمام': ['عصير شمام .jpg'],
      
      // Milkshakes
      'ميلك شيك بستاشيو': ['ميلك شيك بستاشيو .jpg'],
      'ميلك شيك شوكولا': ['ميلك شيك شوكولا.jpg'],
      'ميلك شيك فريز': ['ميلك شيك فريز.jpg'],
      'ميلك شيك فانيليا': ['فانيليا ميلك شيك .jpg'],
      'ميلك شيك اوريو': ['لوتس ميلك شيك .jpg'],
      
      // Teas and Herbal drinks
      'شاي': ['شاي .jpg'],
      'شاي تي لاتيه': ['شاي تي لاتيه.jpg'],
      'زهورات': ['زهورات .jpg'],
      'زيزفون': ['زيزفون .jpg'],
      'سحلب بالقرفة': ['سحلب مع قرفة.jpg'],
      
      // Hot chocolate and drinks
      'هوت شوكلت': ['هوت شوكلت.jpg'],
      'وايت هوت شوكلت': ['وايت هوت شوكلت.jpg'],
      
      // Filter coffee
      'فلتر قهوة': ['قهوة تركية+عربية.jpg'],
      'فلتر قهوة بالحليب': ['ايس فيلترة قهوة بالحليب.jpg'],
      'ايس فيلتر قهوة': ['ايس فيلترة قهوة بالحليب.jpg'],
      'ايس فيلتر قهوة بالحليب': ['ايس فيلترة قهوة بالحليب.jpg'],
      
      // Turkish and Arabic coffee
      'قهوة تركية': ['قهوة تركية+عربية.jpg'],
      'قهوة تركية دبل': ['قهوة تركية+عربية.jpg'],
      'قهوة عربية': ['قهوة تركية+عربية.jpg'],
      'قهوة عربية دبل': ['قهوة تركية+عربية.jpg'],
      
      // Pancakes
      'بان كيك': ['ميني بان كيك شوكولا.jpg'],
      'بان كيك بالعسل': ['ميني بان كيك شوكولا.jpg'],
      'بان كيك بالشوكولا': ['ميني بان كيك شوكولا.jpg'],
      'بان كيك بالفريز': ['ميني بان كيك فواكه .jpg'],
      
      // Cakes and desserts
      'تشيز كيك': ['تشيز كيك شوكولا.jpg'],
      'تشيز كيك شوكولا': ['تشيز كيك شوكولا.jpg'],
      'تشيز كيك فريز': ['تشيز كيك فريز .jpg'],
      'تشيز كيك بستاشيو': ['تشيز كيك بستاشيو.jpg'],
      'تشيز كيك بلو بيري': ['تشيز كيك بلو بيري.jpg'],
      'تيراميسو': ['تيراميسو.jpg'],
      'كيكة العسل': ['كيكة العسل.jpg'],
      'كيكة براونيز': ['كيكة براونيز.jpg'],
      'كيكة الجزر': ['كيكة الجزر.jpg'],
      'فوندون': ['فوندون .jpg'],
      'كيك اوريو': ['بان كيك اوريو.jpg'],
      
      // Cookies
      'كوكيز بندوق': ['كوكيز بندوق .jpg'],
      'كوكيز لوتوس': ['كوكيز لوتوس.jpg'],
      'كوكيز بستاشيو': ['كوكيز بستاشيو.jpg'],
      'كوكيز توت احمر': ['كوكيز توت احمر .jpg'],
      
      // Croissants
      'كروسان سادة': ['كروسان بستاشيو.jpg'],
      
      // Frappuccinos
      'فرابتشينو كراميل': ['كراميل فراي .jpg'],
      'فرابتشينو موكا': ['موكا فراب .jpg'],
      'فرابتشينو فريز': ['فرابتشينو فريز .jpg'],
      'فرابتشينو شوكولا': ['فرابتشينو شوكولا .jpg'],
      'فرابتشينو فانيليا': ['فرابتشينو فانيليا .jpg'],
      'فرابتشينو ماتشا': ['فرابتشينو ماتشا .jpg'],
      
      // Iced drinks
      'ايس لاتيه': ['ايس لاتيه.jpg'],
      'ايس امريكانو': ['ايس امريكانو .jpg'],
      'ايس موكا لاتيه': ['ايس موكا لاتيه .jpg'],
      'ايس كراميل مكياتو': ['ايس كراميل مكياتو .jpg'],
      'ايس فانيليا لاتيه': ['ايس فانيليا لاتيه .jpg'],
      'ايس كراميل لاتيه': ['ايس كراميل لاتيه .jpg'],
      
      // Special items
      'في 60': ['في 60 .jpg'],
      'اوبرا': ['اوبرا .jpg'],
      'زيبرا موكا': ['زيبرا موكا .jpg'],
      'كراميل مكياتو': ['كاراميل ماكياتو .jpg'],
      
      // Lemonade
      'ليموناضا': ['ليموناضا .jpg'],
    };

    return mappings;
  }

  /**
   * Find matching photo for an item using manual mappings
   */
  findMatchingPhoto(arabicName, photoFiles, manualMappings) {
    const normalizedItemName = this.normalizeArabicText(arabicName);
    
    // Check manual mappings first
    for (const [itemName, possiblePhotos] of Object.entries(manualMappings)) {
      const normalizedMappedName = this.normalizeArabicText(itemName);
      if (normalizedItemName === normalizedMappedName) {
        // Find the first available photo from the list
        for (const photo of possiblePhotos) {
          if (photoFiles.includes(photo)) {
            return photo;
          }
        }
      }
    }
    
    // Fallback to automatic matching
    for (const photo of photoFiles) {
      const photoName = path.basename(photo, '.jpg');
      const normalizedPhotoName = this.normalizeArabicText(photoName);
      
      if (normalizedItemName === normalizedPhotoName) {
        return photo;
      }
    }
    
    return null;
  }

  /**
   * Upload photos and match them with menu items
   */
  async uploadAndMatchPhotos() {
    console.log('📸 Starting improved photo upload and matching...\n');

    try {
      // Check if photos folder exists
      try {
        await fs.access(this.photosFolder);
      } catch (error) {
        console.error(`❌ Photos folder not found: ${this.photosFolder}`);
        return;
      }

      // Get all photo files
      const photoFiles = await fs.readdir(this.photosFolder);
      const jpgFiles = photoFiles.filter(file => file.toLowerCase().endsWith('.jpg'));
      
      console.log(`📁 Found ${jpgFiles.length} photos in folder`);
      
      if (jpgFiles.length === 0) {
        console.log('❌ No JPG files found in photos folder');
        return;
      }

      // Get all menu items
      const items = await this.getAllItems();
      
      if (items.length === 0) {
        console.log('❌ No items found in database');
        return;
      }

      // Create manual mappings
      const manualMappings = this.createManualMappings();

      let uploadedCount = 0;
      let matchedCount = 0;
      let failedUploads = 0;
      let unmatchedItems = 0;

      // Upload photos and create mappings
      console.log('\n🔄 Uploading photos to Supabase Storage...');
      for (let i = 0; i < jpgFiles.length; i++) {
        const photoFile = jpgFiles[i];
        try {
          const photoPath = path.join(this.photosFolder, photoFile);
          const imageBuffer = await fs.readFile(photoPath);
          
          // Create unique filename
          const safeFilename = this.createSafeFilename(photoFile, i);
          
          const uploadResult = await this.uploadImageToSupabase(imageBuffer, safeFilename);
          
          if (uploadResult.success) {
            this.photoMappings.set(photoFile, uploadResult.url);
            uploadedCount++;
            console.log(`✅ Uploaded: ${photoFile} → ${safeFilename}`);
          } else {
            failedUploads++;
            console.error(`❌ Failed: ${photoFile} - ${uploadResult.error}`);
          }
          
          // Small delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`❌ Error processing ${photoFile}:`, error.message);
          failedUploads++;
        }
      }

      console.log(`\n📊 Upload Summary: ${uploadedCount} uploaded, ${failedUploads} failed`);

      // Now match photos with menu items
      console.log('\n🎯 Matching photos with menu items...');
      for (const item of items) {
        const arabicName = item.names?.ar || '';
        const matchingPhoto = this.findMatchingPhoto(arabicName, jpgFiles, manualMappings);
        
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
      console.log(`✅ Photos uploaded: ${uploadedCount}`);
      console.log(`🎯 Items matched: ${matchedCount}`);
      console.log(`❌ Upload failures: ${failedUploads}`);
      console.log(`❌ Unmatched items: ${unmatchedItems}`);

      console.log('\n🎉 Improved photo upload and matching completed!');
      console.log('\n📝 Next steps:');
      console.log('1. Refresh your browser to see the actual photos');
      console.log('2. Each item should now display its real uploaded photo');
      console.log('3. Check the admin panel to verify the images are correct');

    } catch (error) {
      console.error('❌ Upload and matching process failed:', error.message);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const matcher = new ImprovedPhotoMatcher();
  await matcher.uploadAndMatchPhotos();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ImprovedPhotoMatcher;
