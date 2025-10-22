const fs = require('fs');
const path = require('path');

// Read the menu
const menuPath = path.join(__dirname, '../public/static/menu.json');
const menuData = JSON.parse(fs.readFileSync(menuPath, 'utf8'));

// Check images directory
const imagesDir = path.join(__dirname, '../public/images/menu');
const imageFiles = fs.readdirSync(imagesDir).filter(file => 
  file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg')
);

console.log(`Found ${imageFiles.length} images in public/images/menu/`);

// Check menu items with images
const itemsWithImages = menuData.items.filter(item => item.image);
console.log(`Menu items with images: ${itemsWithImages.length}`);

// Check for missing images
const missingImages = [];
const foundImages = [];

itemsWithImages.forEach(item => {
  if (item.image) {
    const imageName = path.basename(item.image);
    if (imageFiles.includes(imageName)) {
      foundImages.push({ item: item.name.en, image: imageName });
    } else {
      missingImages.push({ item: item.name.en, image: imageName });
    }
  }
});

console.log(`\nFound images: ${foundImages.length}`);
console.log(`Missing images: ${missingImages.length}`);

if (missingImages.length > 0) {
  console.log('\nMissing images:');
  missingImages.forEach(({ item, image }) => {
    console.log(`- ${item}: ${image}`);
  });
}

// Show sample of working images
console.log('\nSample working images:');
foundImages.slice(0, 5).forEach(({ item, image }) => {
  console.log(`- ${item}: ${image}`);
});

// Check image paths in menu
console.log('\nSample image paths in menu:');
itemsWithImages.slice(0, 3).forEach(item => {
  console.log(`- ${item.name.en}: ${item.image}`);
});
