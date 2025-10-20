#!/usr/bin/env node

/**
 * Arabic to English Image Name Translation Script
 * 
 * This script translates Arabic image names to English equivalents
 * and renames uploaded images with meaningful English names.
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// Supabase Configuration
const SUPABASE_URL = 'https://eoaissoqwlfvfizfomax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvYWlzc29xd2xmdmZpemZvbWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTY5OTIsImV4cCI6MjA3NTMzMjk5Mn0.SHkFV9EvSnWVmC0tApVU6A6C1rrDqsPMO922rMC1JpY';

class ImageNameTranslator {
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
   * Get all uploaded images from Supabase Storage
   */
  async getUploadedImages() {
    try {
      console.log('🔍 Fetching uploaded images from Supabase Storage...');
      
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
      console.log(`📸 Found ${images.length} uploaded images`);
      
      return images;
    } catch (error) {
      console.error('❌ Error fetching images:', error.message);
      return [];
    }
  }

  /**
   * Parse CSV file and extract menu items
   */
  async parseCSV() {
    try {
      console.log('📋 Parsing CSV file...');
      const csvContent = await fs.readFile('new Menu csv.csv', 'utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      // Skip the first line (Table 1) and second line (headers)
      const dataLines = lines.slice(2);
      
      const items = [];
      for (let i = 0; i < dataLines.length; i++) {
        const values = dataLines[i].split(',').map(v => v.trim());
        if (values.length >= 4) {
          const item = {
            arabicName: values[0] || '',
            price: parseFloat(values[1]) || 0,
            turkishName: values[2] || '',
            englishName: values[3] || '',
            categoryArabic: values[4] || '',
            categoryEnglish: values[5] || '',
            image: values[6] || ''
          };
          items.push(item);
        }
      }
      
      console.log(`📋 Parsed ${items.length} items from CSV`);
      return items;
    } catch (error) {
      console.error('❌ Error parsing CSV:', error.message);
      throw error;
    }
  }

  /**
   * Generate new filename based on translated Arabic name
   */
  generateNewFilename(arabicName, fileExtension = 'jpg') {
    const translatedName = this.translateToEnglish(arabicName);
    const timestamp = Date.now();
    return `${translatedName}-${timestamp}.${fileExtension}`;
  }

  /**
   * Download image from Supabase Storage
   */
  async downloadImage(imagePath) {
    try {
      const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/menu-images/${imagePath}`;
      
      return new Promise((resolve, reject) => {
        https.get(imageUrl, (response) => {
          if (response.statusCode === 200) {
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => resolve(Buffer.concat(chunks)));
          } else {
            reject(new Error(`Failed to download image: ${response.statusCode}`));
          }
        }).on('error', reject);
      });
    } catch (error) {
      console.error(`❌ Error downloading image ${imagePath}:`, error.message);
      return null;
    }
  }

  /**
   * Upload image with new name to Supabase Storage
   */
  async uploadImageWithNewName(imageBuffer, newPath) {
    try {
      const formData = new FormData();
      const blob = new Blob([imageBuffer]);
      formData.append('file', blob, newPath.split('/').pop());

      const response = await fetch(`${SUPABASE_URL}/storage/v1/object/menu-images/${newPath}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: formData
      });

      if (response.ok) {
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/menu-images/${newPath}`;
        return { success: true, url: publicUrl };
      } else {
        const errorText = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a mapping of old image paths to new translated names
   */
  async createImageMapping() {
    try {
      const [csvItems, uploadedImages] = await Promise.all([
        this.parseCSV(),
        this.getUploadedImages()
      ]);

      console.log('\n🎯 Creating image name mapping...\n');

      const mapping = [];
      const usedNames = new Set();

      for (const csvItem of csvItems) {
        // Find the most likely image for this item
        const likelyImage = uploadedImages.find(img => {
          // For now, we'll assign images based on order since they're all the same
          // In a real scenario, you'd have different images with different names
          return true; // We'll handle this differently
        });

        if (likelyImage) {
          const newFilename = this.generateNewFilename(csvItem.arabicName, 'jpg');
          
          // Ensure unique filename
          let uniqueFilename = newFilename;
          let counter = 1;
          while (usedNames.has(uniqueFilename)) {
            const nameWithoutExt = newFilename.replace('.jpg', '');
            uniqueFilename = `${nameWithoutExt}-${counter}.jpg`;
            counter++;
          }
          usedNames.add(uniqueFilename);

          mapping.push({
            arabicName: csvItem.arabicName,
            oldPath: likelyImage.name,
            newFilename: uniqueFilename,
            translatedName: this.translateToEnglish(csvItem.arabicName)
          });

          console.log(`📝 ${csvItem.arabicName} → ${uniqueFilename}`);
        }
      }

      // Since all images are the same, let's create a more intelligent mapping
      // by grouping similar items and assigning the same base image
      const groupedMapping = this.createGroupedMapping(csvItems, uploadedImages);
      
      return groupedMapping;
    } catch (error) {
      console.error('❌ Error creating image mapping:', error.message);
      return [];
    }
  }

  /**
   * Create a grouped mapping where similar items share the same base image
   */
  createGroupedMapping(csvItems, uploadedImages) {
    const mapping = [];
    const imageGroups = {
      'coffee': [],
      'iced-coffee': [],
      'desserts': [],
      'waffles': [],
      'crepes': [],
      'cakes': [],
      'drinks': [],
      'smoothies': [],
      'juices': []
    };

    // Group items by category
    for (const item of csvItems) {
      const translatedName = this.translateToEnglish(item.arabicName);
      
      if (translatedName.includes('iced') || translatedName.includes('ice')) {
        imageGroups['iced-coffee'].push(item);
      } else if (translatedName.includes('waffle')) {
        imageGroups['waffles'].push(item);
      } else if (translatedName.includes('crepe')) {
        imageGroups['crepes'].push(item);
      } else if (translatedName.includes('cake') || translatedName.includes('cheesecake') || translatedName.includes('tiramisu')) {
        imageGroups['cakes'].push(item);
      } else if (translatedName.includes('smoothie') || translatedName.includes('mojito')) {
        imageGroups['smoothies'].push(item);
      } else if (translatedName.includes('juice')) {
        imageGroups['juices'].push(item);
      } else if (translatedName.includes('coffee') || translatedName.includes('espresso') || translatedName.includes('latte') || translatedName.includes('mocha')) {
        imageGroups['coffee'].push(item);
      } else {
        imageGroups['drinks'].push(item);
      }
    }

    // Create mapping with group-based filenames
    let imageCounter = 1;
    for (const [groupName, items] of Object.entries(imageGroups)) {
      if (items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const translatedName = this.translateToEnglish(item.arabicName);
          const newFilename = `${groupName}-${translatedName}-${imageCounter}.jpg`;
          
          mapping.push({
            arabicName: item.arabicName,
            oldPath: '60-1760989347404.jpg', // The current image name
            newFilename: newFilename,
            translatedName: translatedName,
            group: groupName
          });
          
          console.log(`📝 ${item.arabicName} → ${newFilename}`);
        }
        imageCounter++;
      }
    }

    return mapping;
  }

  /**
   * Run the translation and renaming process
   */
  async run() {
    console.log('🚀 Starting Arabic to English image name translation...\n');

    try {
      const mapping = await this.createImageMapping();
      
      if (mapping.length === 0) {
        console.log('❌ No images to process');
        return;
      }

      console.log(`\n📊 Created mapping for ${mapping.length} items`);
      
      // Save mapping to file for reference
      await fs.writeFile(
        'image-translation-mapping.json', 
        JSON.stringify(mapping, null, 2)
      );
      
      console.log('\n📄 Mapping saved to: image-translation-mapping.json');
      console.log('\n🎯 Next steps:');
      console.log('1. Review the mapping file');
      console.log('2. Upload new images with proper names');
      console.log('3. Update your menu items with the new image URLs');
      
      // Show sample translations
      console.log('\n📝 Sample translations:');
      mapping.slice(0, 10).forEach(item => {
        console.log(`   ${item.arabicName} → ${item.newFilename}`);
      });

    } catch (error) {
      console.error('❌ Translation process failed:', error.message);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const translator = new ImageNameTranslator();
  await translator.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ImageNameTranslator;
