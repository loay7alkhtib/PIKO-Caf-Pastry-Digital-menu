const fs = require('fs');
const path = require('path');

// Read the optimized menu
const menuPath = path.join(__dirname, '../public/static/optimized_menu.json');
const menuData = JSON.parse(fs.readFileSync(menuPath, 'utf8'));

// Function to update image paths
function updateImagePaths(menuData) {
  return menuData.map(category => ({
    ...category,
    items: category.items.map(item => ({
      ...item,
      image: item.image ? item.image.replace('/Piko Web app Photos 6/', '/images/menu/') : null
    }))
  }));
}

// Update the menu with correct image paths
const updatedMenu = updateImagePaths(menuData);

// Save the updated menu
fs.writeFileSync(menuPath, JSON.stringify(updatedMenu, null, 2));

// Also update the compressed version
const zlib = require('zlib');
const gzip = zlib.createGzip();
const input = fs.createReadStream(menuPath);
const output = fs.createWriteStream(path.join(__dirname, '../public/static/optimized_menu.json.gz'));

input.pipe(gzip).pipe(output);

console.log('Image paths updated successfully!');
console.log('All images now point to /images/menu/ directory');

// Show sample of updated paths
const sampleItems = updatedMenu[0].items.slice(0, 3);
console.log('\nSample updated image paths:');
sampleItems.forEach(item => {
  if (item.image) {
    console.log(`- ${item.name.en}: ${item.image}`);
  }
});
