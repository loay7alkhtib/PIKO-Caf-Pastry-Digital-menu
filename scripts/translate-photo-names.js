#!/usr/bin/env node

/**
 * Translate Photo Names Script
 * 
 * This script translates Arabic photo names to English and creates
 * a mapping file for easy auto-matching with menu items.
 */

const fs = require('fs').promises;
const path = require('path');

class PhotoNameTranslator {
  constructor() {
    this.photosFolder = path.join(__dirname, '..', 'Piko Web app Photos');
    this.translationMappings = new Map();
    this.englishNames = [];
  }

  /**
   * Arabic to English translation dictionary
   */
  getTranslationDictionary() {
    return {
      // Coffee and drinks
      'اسبريسو': 'espresso',
      'دبل اسبريسو': 'double-espresso',
      'امريكانو': 'americano',
      'كابتشينو': 'cappuccino',
      'لاتيه': 'latte',
      'موكا': 'mocha',
      'ماتشا': 'matcha',
      'كورتادو': 'cortado',
      'فلات وايت': 'flat-white',
      'فلتر قهوة': 'filter-coffee',
      'قهوة تركية': 'turkish-coffee',
      'قهوة عربية': 'arabic-coffee',
      'ايس': 'iced',
      'هوت': 'hot',
      'وايت': 'white',
      
      // Flavors and ingredients
      'كراميل': 'caramel',
      'فانيليا': 'vanilla',
      'شوكولا': 'chocolate',
      'شوكليت': 'chocolate',
      'بستاشيو': 'pistachio',
      'بندق': 'hazelnut',
      'بندوق': 'hazelnut',
      'لوز': 'almond',
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
      'تفاح': 'apple',
      'جزر': 'carrot',
      'بطيخ': 'watermelon',
      'شمام': 'cantaloupe',
      'عنب': 'grape',
      'موز': 'banana',
      'افوكادو': 'avocado',
      
      // Desserts and pastries
      'كريب': 'crepe',
      'وافل': 'waffle',
      'بان كيك': 'pancake',
      'ميني بان كيك': 'mini-pancake',
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
      'ميني': 'mini',
      
      // Beverages
      'موهيتو': 'mojito',
      'سموزي': 'smoothie',
      'عصير': 'juice',
      'شاي': 'tea',
      'زهورات': 'herbal-tea',
      'زيزفون': 'linden-tea',
      'سحلب': 'salep',
      'ميلك شيك': 'milkshake',
      'فراب': 'frappuccino',
      'فرابتشينو': 'frappuccino',
      'كول': 'cool',
      'هيبسكوس': 'hibiscus',
      'هبيسكوس': 'hibiscus',
      'بابلز': 'bubbles',
      'ميكس': 'mix',
      'صودا': 'soda',
      'ريد بول': 'red-bull',
      'سفن': '7up',
      'كلاسيك': 'classic',
      'بيكو': 'piko',
      'زنجبيل': 'ginger',
      'ليموناضا': 'lemonade',
      'نعناع': 'mint',
      'خيار': 'cucumber',
      'قرفة': 'cinnamon',
      
      // Size variants
      'كبير': 'large',
      'وسط': 'medium',
      'صغير': 'small',
      
      // Other terms
      'بالقرفة': 'with-cinnamon',
      'بالحليب': 'with-milk',
      'بالعسل': 'with-honey',
      'بالشوكولا': 'with-chocolate',
      'بالفريز': 'with-strawberry',
      'بالفواكه': 'with-fruits',
      'سادة': 'plain',
      'سخن': 'hot',
      'بارد': 'cold',
      'مختلطة': 'mixed',
      'مع': 'with',
      'و': 'and',
      '+': 'and',
      
      // Special items
      'في 60': 'in-60',
      'تصوير': 'photo',
      'تصويرو': 'photo',
      'مسح': 'scan',
      'مصور': 'photographed',
      'مصور مرتين': 'photographed-twice',
      'معاد تصويره': 're-photographed',
      'معاد تصويرو': 're-photographed',
      'لوتس برفيترول': 'lotus-prefiterol',
      'تشري بلوسم': 'cherry-blossom',
      'كاريبيان': 'caribbean',
      'بالليمون': 'with-lemon',
      'بالمع': 'with-mint',
      'بريد': 'with-red',
      'بأبيض': 'with-white',
      'بأسود': 'with-black',
      'بأخضر': 'with-green',
      'بأولونج': 'with-oolong',
      'بجوز الهند': 'with-coconut',
      'ببستاشيو': 'with-pistachio',
      'ببندق': 'with-hazelnut',
      'ببندوق': 'with-hazelnut',
      'بكراميل': 'with-caramel',
      'بفانيليا': 'with-vanilla',
      'بشوكولا': 'with-chocolate',
      'بشوكليت': 'with-chocolate',
      'بفريز': 'with-strawberry',
      'بستروبيري': 'with-strawberry',
      'ببرتقال': 'with-orange',
      'بليمون': 'with-lemon',
      'باناناس': 'with-pineapple',
      'بمانجو': 'with-mango',
      'بكيوي': 'with-kiwi',
      'برمان': 'with-pomegranate',
      'بدراق': 'with-peach',
      'بباشن': 'with-passion',
      'ببينك': 'with-pink',
      'ببلو بيري': 'with-blueberry',
      'بميكس بيري': 'with-mixed-berry',
      'بتفاح': 'with-apple',
      'بجزر': 'with-carrot',
      'ببطيخ': 'with-watermelon',
      'بشمام': 'with-cantaloupe',
      'بعنب': 'with-grape',
      'بموز': 'with-banana',
      'بافوكادو': 'with-avocado',
      'بزنجبيل': 'with-ginger',
      'بنعناع': 'with-mint',
      'بخيار': 'with-cucumber',
      'بقرفة': 'with-cinnamon',
      'بسحلب': 'with-salep',
      'بشاي': 'with-tea',
      'بزهورات': 'with-herbal-tea',
      'بزيزفون': 'with-linden-tea',
      'بهيبسكوس': 'with-hibiscus',
      'ببابلز': 'with-bubbles',
      'بميكس': 'with-mix',
      'بصودا': 'with-soda',
      'بريد بول': 'with-red-bull',
      'بسفن': 'with-7up',
      'بكلاسيك': 'with-classic',
      'ببيكو': 'with-piko',
      'بليموناضا': 'with-lemonade'
    };
  }

  /**
   * Normalize Arabic text
   */
  normalizeArabicText(text) {
    return text
      .replace(/[\u064B-\u0652\u0670\u0640]/g, '') // Remove diacritics
      .replace(/[أإآ]/g, 'ا') // Normalize alef variants
      .replace(/[ة]/g, 'ه') // Normalize teh marbuta
      .replace(/[ي]/g, 'ي') // Normalize yeh
      .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/[^\u0600-\u06FF\s]/g, '') // Keep only Arabic and spaces
      .trim();
  }

  /**
   * Translate Arabic text to English
   */
  translateToEnglish(arabicText) {
    const normalizedText = this.normalizeArabicText(arabicText);
    const words = normalizedText.split(/\s+/);
    const translatedWords = [];
    
    for (const word of words) {
      if (word.trim()) {
        const translation = this.getTranslationDictionary()[word] || word;
        translatedWords.push(translation);
      }
    }
    
    return translatedWords.join('-');
  }

  /**
   * Create safe filename for Supabase Storage
   */
  createSafeFilename(originalName, translation) {
    // Use translation if available, otherwise use original with index
    const baseName = translation || originalName.replace('.jpg', '');
    
    // Remove any remaining non-ASCII characters and create safe filename
    const safeName = baseName
      .replace(/[^a-zA-Z0-9.-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
    
    return `${safeName}.jpg`;
  }

  /**
   * Process all photos and create translation mappings
   */
  async processPhotos() {
    console.log('🔄 Processing photos and creating English translations...\n');

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
      
      console.log(`📁 Found ${jpgFiles.length} photos to process`);
      
      if (jpgFiles.length === 0) {
        console.log('❌ No JPG files found in photos folder');
        return;
      }

      const translations = [];
      let processedCount = 0;

      // Process each photo
      for (const photoFile of jpgFiles) {
        const originalName = photoFile.replace('.jpg', '');
        const normalizedName = this.normalizeArabicText(originalName);
        const englishTranslation = this.translateToEnglish(normalizedName);
        const safeFilename = this.createSafeFilename(originalName, englishTranslation);
        
        const translation = {
          originalName: photoFile,
          normalizedArabic: normalizedName,
          englishTranslation: englishTranslation,
          safeFilename: safeFilename,
          index: processedCount
        };
        
        translations.push(translation);
        processedCount++;
        
        console.log(`📝 ${photoFile}`);
        console.log(`   Arabic: ${normalizedName}`);
        console.log(`   English: ${englishTranslation}`);
        console.log(`   Safe filename: ${safeFilename}`);
        console.log('');
      }

      // Create mapping file
      const mappingData = {
        metadata: {
          totalPhotos: translations.length,
          processedAt: new Date().toISOString(),
          description: 'Arabic to English photo name translations for auto-matching'
        },
        translations: translations
      };

      const mappingFilePath = path.join(__dirname, '..', 'photo-translation-mapping.json');
      await fs.writeFile(mappingFilePath, JSON.stringify(mappingData, null, 2));
      
      console.log(`✅ Created translation mapping file: ${mappingFilePath}`);
      console.log(`📊 Processed ${processedCount} photos`);
      
      // Create summary
      console.log('\n📋 Translation Summary:');
      console.log(`✅ Total photos processed: ${processedCount}`);
      console.log(`📄 Mapping file created: photo-translation-mapping.json`);
      console.log(`🔄 Ready for auto-matching with menu items`);
      
      console.log('\n📝 Next steps:');
      console.log('1. Use the mapping file to upload photos with English names');
      console.log('2. Auto-match the translated names with menu items');
      console.log('3. Update the database with correct image URLs');

    } catch (error) {
      console.error('❌ Photo processing failed:', error.message);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const translator = new PhotoNameTranslator();
  await translator.processPhotos();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = PhotoNameTranslator;
