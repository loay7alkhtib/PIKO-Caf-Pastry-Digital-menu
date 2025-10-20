# Menu Data Rebuild Guide

This guide will help you rebuild your menu data from scratch using your new accurate CSV file with multilingual support and proper image handling.

## 🎯 Overview

The rebuild process includes:
- ✅ Complete cleanup of existing menu data
- ✅ Supabase Storage setup for images
- ✅ CSV import with multilingual support (Arabic, Turkish, English)
- ✅ Variable sizes and prices handling
- ✅ Automatic image upload and optimization

## 📋 Prerequisites

1. **Environment Variables**: Ensure you have these set:
   ```bash
   VITE_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Dependencies**: Install the CSV parser:
   ```bash
   npm install csv-parser
   ```

## 🗂️ File Structure

```
scripts/
├── import-menu-data.js      # Main import script
├── menu-template.csv        # CSV template with examples
└── images/                  # Your image files
    ├── turkish-coffee.jpg
    ├── cappuccino.jpg
    ├── croissant.jpg
    └── ...
```

## 📊 CSV Format

Your CSV file should follow this exact structure:

```csv
category_name_en,category_name_tr,category_name_ar,category_icon,category_color,category_order,item_name_en,item_name_tr,item_name_ar,item_description_en,item_description_tr,item_description_ar,base_price,image_filename,size_variants,tags,order
```

### Field Descriptions

| Field | Description | Example |
|-------|-------------|---------|
| `category_name_*` | Category names in 3 languages | "Beverages", "İçecekler", "المشروبات" |
| `category_icon` | Emoji or icon for category | "☕", "🥐", "🍽️" |
| `category_color` | Hex color code | "#8B4513", "#D2691E" |
| `category_order` | Display order for categories | "1", "2", "3" |
| `item_name_*` | Item names in 3 languages | "Turkish Coffee", "Türk Kahvesi", "القهوة التركية" |
| `item_description_*` | Item descriptions in 3 languages | Optional, can be empty |
| `base_price` | Base price (used if no variants) | "15.00" |
| `image_filename` | Exact filename of the image | "turkish-coffee.jpg" |
| `size_variants` | Size variants with prices | "Small:12.00,Medium:15.00,Large:18.00" |
| `tags` | Comma-separated tags | "coffee,traditional,hot" |
| `order` | Display order within category | "1", "2", "3" |

## 🖼️ Image Handling

### Recommended Approach: Supabase Storage

**Why Supabase Storage:**
- ✅ Integrated with your existing setup
- ✅ Automatic image optimization
- ✅ CDN delivery
- ✅ WebP conversion
- ✅ Responsive image generation
- ✅ Cost-effective

### Image Requirements

1. **File Naming**: Images must be named exactly as specified in `image_filename` column
2. **Supported Formats**: JPG, PNG, WebP
3. **File Size**: Maximum 5MB per image
4. **Recommended Size**: 800x600px for optimal performance

### Image Upload Process

The import script will:
1. Create a `menu-images` bucket in Supabase Storage
2. Upload each image to `items/{filename}`
3. Generate public URLs for each image
4. Link images to items automatically

## 🚀 Import Process

### Step 1: Prepare Your Data

1. **Create your CSV file** following the template structure
2. **Prepare your images** in a dedicated folder
3. **Ensure image filenames match** the `image_filename` column exactly

### Step 2: Run the Import

```bash
# Basic import
npm run import:menu your-menu-data.csv ./images

# Or directly with node
node scripts/import-menu-data.js your-menu-data.csv ./images
```

### Step 3: Verify Import

After import, check:
- Categories are created with proper multilingual names
- Items are linked to correct categories
- Images are uploaded and accessible
- Size variants are properly structured

## 🔧 Advanced Configuration

### Size Variants Format

For items with multiple sizes:

```csv
"Small:12.00,Medium:15.00,Large:18.00"
```

This creates:
```json
[
  { "size": "Small", "price": 12.00 },
  { "size": "Medium", "price": 15.00 },
  { "size": "Large", "price": 18.00 }
]
```

### Tags Format

```csv
"coffee,traditional,hot"
```

Creates: `["coffee", "traditional", "hot"]`

### Multilingual Support

All text fields support three languages:
- `en`: English
- `tr`: Turkish  
- `ar`: Arabic

Empty fields will be set to `null` in the database.

## 🛠️ Troubleshooting

### Common Issues

1. **Image Upload Fails**
   - Check file exists in images directory
   - Verify filename matches exactly (case-sensitive)
   - Ensure file size < 5MB
   - Check Supabase Storage permissions

2. **CSV Parse Errors**
   - Verify CSV format matches template
   - Check for special characters in data
   - Ensure proper escaping of quotes

3. **Database Errors**
   - Verify Supabase credentials
   - Check database permissions
   - Ensure tables exist

### Debug Mode

Add debug logging to the import script:

```javascript
// Add this to see detailed processing
console.log('Processing item:', item);
console.log('Image path:', imagePath);
console.log('Upload result:', imageUrl);
```

## 📈 Performance Optimization

### Image Optimization

The system automatically:
- Converts images to WebP format
- Generates multiple sizes for responsive loading
- Implements lazy loading
- Uses CDN delivery

### Database Optimization

- Only required fields are selected in queries
- Proper indexing on frequently queried fields
- Efficient multilingual data structure

## 🔄 Rollback Process

If you need to rollback:

```sql
-- Remove all menu data
DELETE FROM items;
DELETE FROM categories;

-- Remove uploaded images (via Supabase Dashboard)
-- Go to Storage > menu-images bucket > Delete all files
```

## 📞 Support

If you encounter issues:

1. Check the console output for specific error messages
2. Verify your CSV format against the template
3. Ensure all images exist and are properly named
4. Verify Supabase credentials and permissions

## 🎉 Success Checklist

After import, verify:
- [ ] All categories created with proper names in 3 languages
- [ ] All items linked to correct categories
- [ ] Images uploaded and accessible via URLs
- [ ] Size variants working for applicable items
- [ ] Tags properly assigned
- [ ] Display order correct
- [ ] No console errors during import

Your menu is now ready with clean, accurate data and optimized images!
