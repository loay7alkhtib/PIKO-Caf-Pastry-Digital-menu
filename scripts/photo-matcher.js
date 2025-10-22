const fs = require('fs');
const path = require('path');

// Read the consolidated menu
const menuPath = path.join(__dirname, '../consolidated_menu.json');
const menuData = JSON.parse(fs.readFileSync(menuPath, 'utf8'));

// Photo directory
const photoDir = path.join(__dirname, '../Piko Web app Photos 6');

// Get all photo files
const photoFiles = fs.readdirSync(photoDir).filter(file => 
  file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg')
);

console.log(`Found ${photoFiles.length} photos`);

// Photo matching algorithm
function findBestPhotoMatch(menuItem, availablePhotos) {
  const itemName = menuItem.name_en.toLowerCase();
  const itemNameAr = menuItem.name_ar.toLowerCase();
  
  // Create search terms
  const searchTerms = [
    itemName,
    itemNameAr,
    // Extract key words
    ...itemName.split(' ').filter(word => word.length > 3),
    ...itemNameAr.split(' ').filter(word => word.length > 3)
  ];
  
  // Remove common words
  const commonWords = ['the', 'and', 'with', 'of', 'in', 'on', 'at', 'to', 'for', 'by', 'from'];
  const filteredTerms = searchTerms.filter(term => 
    term.length > 2 && !commonWords.includes(term)
  );
  
  // Score each photo
  const photoScores = availablePhotos.map(photo => {
    const photoName = photo.toLowerCase().replace(/\.(jpg|jpeg)$/, '');
    let score = 0;
    
    // Exact match gets highest score
    if (photoName === itemName || photoName === itemNameAr) {
      score += 100;
    }
    
    // Partial matches
    filteredTerms.forEach(term => {
      if (photoName.includes(term)) {
        score += 10;
      }
      if (term.includes(photoName)) {
        score += 5;
      }
    });
    
    // Category-based matching
    const category = menuItem.category.toLowerCase();
    if (category.includes('coffee') && photoName.includes('coffee')) {
      score += 5;
    }
    if (category.includes('smoothie') && photoName.includes('smoothie')) {
      score += 5;
    }
    if (category.includes('mojito') && photoName.includes('mojito')) {
      score += 5;
    }
    if (category.includes('waffle') && photoName.includes('waffle')) {
      score += 5;
    }
    if (category.includes('pancake') && photoName.includes('pancake')) {
      score += 5;
    }
    if (category.includes('crepe') && photoName.includes('crepe')) {
      score += 5;
    }
    if (category.includes('milkshake') && photoName.includes('milkshake')) {
      score += 5;
    }
    
    // Specific item matching
    const specificMatches = {
      'latte': ['latte'],
      'mocha': ['mocha'],
      'cappuccino': ['cappuccino'],
      'espresso': ['espresso'],
      'americano': ['americano'],
      'frappucino': ['frappucino', 'frapp'],
      'matcha': ['matcha'],
      'chai': ['chai'],
      'vanilla': ['vanilla'],
      'caramel': ['caramel'],
      'chocolate': ['chocolate', 'choco'],
      'strawberry': ['strawberry', 'straw'],
      'pistachio': ['pistachio', 'pist'],
      'oreo': ['oreo'],
      'lotus': ['lotus'],
      'tiramisu': ['tiramisu'],
      'cheesecake': ['cheesecake', 'cheese'],
      'waffle': ['waffle'],
      'pancake': ['pancake'],
      'crepe': ['crepe'],
      'cookies': ['cookies', 'cookie'],
      'cake': ['cake'],
      'smoothie': ['smoothie'],
      'milkshake': ['milkshake', 'milk'],
      'mojito': ['mojito'],
      'lemonade': ['lemonade', 'lemon'],
      'juice': ['juice'],
      'tea': ['tea'],
      'coffee': ['coffee'],
      'hot chocolate': ['hot chocolate', 'hotchoc'],
      'white chocolate': ['white chocolate', 'whitechoc'],
      'pina colada': ['pina colada', 'pinacolada'],
      'caribbean': ['caribbean', 'carib'],
      'mango': ['mango'],
      'peach': ['peach'],
      'pineapple': ['pineapple', 'pine'],
      'orange': ['orange'],
      'apple': ['apple'],
      'banana': ['banana'],
      'kiwi': ['kiwi'],
      'passion': ['passion'],
      'hibiscus': ['hibiscus'],
      'cool lime': ['cool lime', 'coollime'],
      'ginger': ['ginger'],
      'mint': ['mint', 'minted'],
      'pink': ['pink'],
      'blueberry': ['blueberry', 'blue'],
      'raspberry': ['raspberry', 'rasp'],
      'mix berries': ['mix berries', 'mixberr'],
      'marshmallow': ['marshmallow', 'marsh'],
      'fruit': ['fruit'],
      'mini': ['mini']
    };
    
    Object.entries(specificMatches).forEach(([key, variations]) => {
      if (itemName.includes(key)) {
        variations.forEach(variation => {
          if (photoName.includes(variation)) {
            score += 15;
          }
        });
      }
    });
    
    return { photo, score };
  });
  
  // Sort by score and return best match
  photoScores.sort((a, b) => b.score - a.score);
  
  return photoScores[0]?.score > 0 ? photoScores[0].photo : null;
}

// Match photos to menu items
const matchedMenu = menuData.map(item => {
  const bestPhoto = findBestPhotoMatch(item, photoFiles);
  
  return {
    ...item,
    image: bestPhoto ? `/Piko Web app Photos 6/${bestPhoto}` : null,
    image_filename: bestPhoto || null
  };
});

// Save matched menu
const outputPath = path.join(__dirname, '../menu_with_photos.json');
fs.writeFileSync(outputPath, JSON.stringify(matchedMenu, null, 2));

// Generate statistics
const stats = {
  total_items: matchedMenu.length,
  items_with_photos: matchedMenu.filter(item => item.image).length,
  items_without_photos: matchedMenu.filter(item => !item.image).length,
  match_rate: `${Math.round((matchedMenu.filter(item => item.image).length / matchedMenu.length) * 100)}%`
};

console.log('\nPhoto Matching Results:');
console.log(JSON.stringify(stats, null, 2));

// Show unmatched items
const unmatchedItems = matchedMenu.filter(item => !item.image);
if (unmatchedItems.length > 0) {
  console.log('\nUnmatched items:');
  unmatchedItems.forEach(item => {
    console.log(`- ${item.name_en} (${item.category})`);
  });
}

// Show available photos that weren't used
const usedPhotos = matchedMenu.filter(item => item.image).map(item => item.image_filename);
const unusedPhotos = photoFiles.filter(photo => !usedPhotos.includes(photo));
if (unusedPhotos.length > 0) {
  console.log('\nUnused photos:');
  unusedPhotos.forEach(photo => {
    console.log(`- ${photo}`);
  });
}
