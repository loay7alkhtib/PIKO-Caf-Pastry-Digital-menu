#!/usr/bin/env node

/**
 * Rename Photos with English Translation Script
 * 
 * This script renames all photos in the "Piko Web app Photos" folder
 * by adding English translations to their filenames for easier matching.
 */

const fs = require('fs').promises;
const path = require('path');

class PhotoRenamer {
  constructor() {
    this.photosFolder = path.join(__dirname, '..', 'Piko Web app Photos');
    this.backupFolder = path.join(__dirname, '..', 'Piko Web app Photos - Original');
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
      'امريكانا': 'americano',
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
      'it': 'hot',
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
      'وفل': 'waffle',
      'بان كيك': 'pancake',
      'ميني بان كيك': 'mini-pancake',
      'تشيز كيك': 'cheesecake',
      'تيراميسو': 'tiramisu',
      'اوبرا': 'opera',
      'اوبيرا': 'opera',
      'فوندون': 'fondant',
      'كروسان': 'croissant',
      'كوكيز': 'cookies',
      'كيكة': 'cake',
      'كيك': 'cake',
      'براونيز': 'brownies',
      'تشمني': 'chocolate',
      'لوتوس': 'lotus',
      'لوتس': 'lotus',
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
      'بليموناضا': 'with-lemonade',
      'ماكياتو': 'macchiato',
      'بروفيترول': 'profiterole',
      'بترسكوتش': 'butterscotch',
      'فوتوتشيني': 'fettuccine',
      'كولادا': 'colada',
      'فراي': 'fry',
      'يابلد': 'yapld',
      'العسل': 'honey',
      'الجزر': 'carrot',
      'توت احمر': 'red-berries',
      'نت': 'net',
      'لايم': 'lime',
      'يابلد': 'yapld'
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
   * Create new filename with English translation
   */
  createNewFilename(originalName) {
    const nameWithoutExt = originalName.replace('.jpg', '');
    
    // Check if it contains Arabic characters
    const hasArabic = /[\u0600-\u06FF]/.test(nameWithoutExt);
    
    if (hasArabic) {
      const englishTranslation = this.translateToEnglish(nameWithoutExt);
      
      // Create new filename: original-english.jpg
      const newFilename = `${nameWithoutExt}-${englishTranslation}.jpg`;
      
      // Clean up the filename for file system compatibility
      const cleanFilename = newFilename
        .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, '') // Keep Arabic, English, numbers, spaces, hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
      
      return cleanFilename;
    } else {
      // If no Arabic, just clean up the filename
      return originalName
        .replace(/[^a-zA-Z0-9.-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }
  }

  /**
   * Create backup folder
   */
  async createBackupFolder() {
    try {
      await fs.access(this.backupFolder);
    } catch (error) {
      // Folder doesn't exist, create it
      await fs.mkdir(this.backupFolder, { recursive: true });
      console.log(`📁 Created backup folder: ${this.backupFolder}`);
    }
  }

  /**
   * Copy file to backup folder
   */
  async backupFile(originalPath, newPath) {
    try {
      await fs.copyFile(originalPath, newPath);
    } catch (error) {
      console.error(`❌ Failed to backup ${originalPath}:`, error.message);
    }
  }

  /**
   * Rename all photos with English translations
   */
  async renamePhotos() {
    console.log('🔄 Starting photo renaming with English translations...\n');

    try {
      // Check if photos folder exists
      try {
        await fs.access(this.photosFolder);
      } catch (error) {
        console.error(`❌ Photos folder not found: ${this.photosFolder}`);
        return;
      }

      // Create backup folder
      await this.createBackupFolder();

      // Get all photo files
      const photoFiles = await fs.readdir(this.photosFolder);
      const jpgFiles = photoFiles.filter(file => file.toLowerCase().endsWith('.jpg'));
      
      console.log(`📁 Found ${jpgFiles.length} photos to rename`);
      
      if (jpgFiles.length === 0) {
        console.log('❌ No JPG files found in photos folder');
        return;
      }

      let renamedCount = 0;
      let skippedCount = 0;
      const renamedFiles = [];

      // Process each photo
      for (const photoFile of jpgFiles) {
        try {
          const originalPath = path.join(this.photosFolder, photoFile);
          const newFilename = this.createNewFilename(photoFile);
          const newPath = path.join(this.photosFolder, newFilename);
          
          // Skip if filename didn't change
          if (photoFile === newFilename) {
            console.log(`⏭️  Skipped: ${photoFile} (no changes needed)`);
            skippedCount++;
            continue;
          }
          
          // Check if new filename already exists
          try {
            await fs.access(newPath);
            console.log(`⚠️  Skipped: ${photoFile} → ${newFilename} (target already exists)`);
            skippedCount++;
            continue;
          } catch (error) {
            // File doesn't exist, proceed with rename
          }
          
          // Create backup
          const backupPath = path.join(this.backupFolder, photoFile);
          await this.backupFile(originalPath, backupPath);
          
          // Rename the file
          await fs.rename(originalPath, newPath);
          
          renamedFiles.push({
            original: photoFile,
            new: newFilename,
            backup: backupPath
          });
          
          renamedCount++;
          console.log(`✅ Renamed: ${photoFile} → ${newFilename}`);
          
        } catch (error) {
          console.error(`❌ Error renaming ${photoFile}:`, error.message);
        }
      }

      // Create summary report
      const summaryReport = {
        metadata: {
          totalPhotos: jpgFiles.length,
          renamed: renamedCount,
          skipped: skippedCount,
          processedAt: new Date().toISOString(),
          backupFolder: this.backupFolder
        },
        renamedFiles: renamedFiles
      };

      const reportPath = path.join(__dirname, '..', 'photo-rename-report.json');
      await fs.writeFile(reportPath, JSON.stringify(summaryReport, null, 2));
      
      console.log(`\n📊 Renaming Summary:`);
      console.log(`✅ Photos renamed: ${renamedCount}`);
      console.log(`⏭️  Photos skipped: ${skippedCount}`);
      console.log(`📄 Summary report: ${reportPath}`);
      console.log(`💾 Backup folder: ${this.backupFolder}`);
      
      console.log('\n🎉 Photo renaming completed!');
      console.log('\n📝 Next steps:');
      console.log('1. Check the renamed photos in the folder');
      console.log('2. Use the new filenames for easier matching with menu items');
      console.log('3. The original files are safely backed up');

    } catch (error) {
      console.error('❌ Photo renaming failed:', error.message);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const renamer = new PhotoRenamer();
  await renamer.renamePhotos();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = PhotoRenamer;
