# 📸 Image Upload Guide for PIKO Digital Menu

This guide explains how to upload photos to Supabase Storage and auto-match them with menu items in your digital menu application.

## 🎯 Overview

The image upload system supports:

- **Single image uploads** through the admin interface
- **Batch image uploads** with automatic name matching
- **Supabase Storage** for optimized image delivery
- **Auto-matching** based on item names in CSV data
- **Multiple upload methods** (UI, CLI script, API)

## 🚀 Quick Start

### Method 1: Admin Interface (Recommended)

1. **Access Admin Panel**
   - Go to your admin login page
   - Log in with admin credentials
   - Navigate to "Manage Items" or "Add New Item"

2. **Upload Single Image**
   - Click on the image upload area
   - Select an image file (JPG, PNG, WebP, GIF - max 5MB)
   - The image will be automatically uploaded to Supabase Storage
   - The image URL will be saved to the database

3. **Batch Upload Interface**
   - Use the `BatchImageUpload` component in the admin panel
   - Drag and drop multiple images or click to browse
   - Images will be automatically matched with menu items based on filename
   - Download results report after upload

### Method 2: Command Line Script

1. **Prepare Your Images**

   ```bash
   # Create a folder for your images
   mkdir images
   # Copy your menu item images to this folder
   # Name them to match your menu items (e.g., "كريب اوريو.jpg")
   ```

2. **Run the Batch Upload Script**

   ```bash
   # Basic upload (dry run to see what would be uploaded)
   node scripts/batch-upload-images.js --csv "new Menu csv.csv" --images "./images" --dry-run

   # Actual upload
   node scripts/batch-upload-images.js --csv "new Menu csv.csv" --images "./images" --update-db
   ```

3. **Script Options**
   - `--csv`: Path to your CSV file containing menu items
   - `--images`: Path to folder containing images
   - `--dry-run`: Preview uploads without actually uploading
   - `--update-db`: Update database with image URLs after upload

## 🔧 Technical Details

### Image Matching Algorithm

The system uses a sophisticated matching algorithm to connect images with menu items:

1. **Exact Match**: Filename exactly matches item name
2. **Partial Match**: Filename contains item name or vice versa
3. **Fuzzy Match**: Removes special characters and spaces for comparison
4. **Multi-language Support**: Matches Arabic, English, and Turkish names

### File Naming Best Practices

For best results, name your image files to match your menu items:

```
✅ Good Examples:
- "كريب اوريو.jpg" → matches "كريب اوريو"
- "oreo-crepe.jpg" → matches "Oreo Crepe"
- "pistachio-krep.png" → matches "Antep fıstığı krep"

❌ Avoid:
- "IMG_001.jpg" → no meaningful match
- "photo.jpg" → generic name
- "screenshot.png" → not descriptive
```

### Storage Structure

Images are organized in Supabase Storage as follows:

```
menu-images/
├── menu-items/
│   ├── كريب-اوريو-1640995200000.jpg
│   ├── oreo-crepe-1640995200001.jpg
│   └── pistachio-krep-1640995200002.png
└── categories/
    ├── الكريب-1640995200000.jpg
    └── crepe-1640995200001.jpg
```

## 📊 Upload Results

### Success Indicators

- ✅ **Uploaded**: Image successfully uploaded to Supabase Storage
- ✅ **Matched**: Image filename matched with a menu item
- ✅ **Database Updated**: Image URL saved to database

### Error Handling

- ❌ **Upload Failed**: Network error or file size exceeded
- ⚠️ **No Match**: Image filename couldn't be matched with any menu item
- ⚠️ **Database Error**: Image uploaded but database update failed

### Results Report

After batch upload, you'll receive a detailed report including:

- Total files processed
- Success/failure counts
- Matched vs unmatched items
- Detailed error messages
- Downloadable JSON report

## 🛠️ Advanced Configuration

### Custom Image Upload Service

```typescript
import { imageUploadService } from '@/lib/imageUploadService';

// Upload single image
const result = await imageUploadService.uploadImage(
  file,
  'custom-filename.jpg',
  'custom-folder',
);

// Batch upload with custom matching
const batchResult = await imageUploadService.batchUploadWithMatching(
  files,
  ['Item 1', 'Item 2', 'Item 3'],
  'custom-folder',
);
```

### Image Optimization

The system automatically optimizes images for web delivery:

```typescript
// Get optimized image URL
const optimizedUrl = imageUploadService.getOptimizedUrl('image.jpg', {
  width: 800,
  height: 600,
  quality: 80,
  format: 'webp',
});
```

### Custom Matching Logic

You can extend the matching algorithm for specific needs:

```typescript
// Custom matching function
const customMatch = (fileName: string, itemNames: string[]) => {
  // Your custom matching logic here
  return matchedItem;
};
```

## 🔒 Security & Permissions

### Supabase Storage Policies

The system includes proper security policies:

- **Public Read Access**: Images are publicly readable for menu display
- **Admin Upload Access**: Only admin users can upload images
- **File Type Restrictions**: Only image files (JPG, PNG, WebP, GIF) allowed
- **Size Limits**: Maximum 5MB per image file

### File Validation

All uploaded files are validated for:

- File type (must be image)
- File size (max 5MB)
- File name sanitization
- Malware scanning (if configured)

## 📈 Performance Optimization

### Image Optimization Features

- **WebP Format**: Automatic conversion for better compression
- **Responsive Images**: Multiple sizes for different screen resolutions
- **Lazy Loading**: Images load only when needed
- **CDN Delivery**: Fast global delivery through Supabase CDN

### Caching Strategy

- **Browser Cache**: 1 hour cache for uploaded images
- **CDN Cache**: 24 hour cache with stale-while-revalidate
- **Database Cache**: Cached image URLs for faster loading

## 🐛 Troubleshooting

### Common Issues

1. **Upload Failed - File Too Large**
   - Solution: Compress image to under 5MB
   - Use tools like TinyPNG or ImageOptim

2. **No Match Found**
   - Solution: Rename image file to match menu item name
   - Check CSV file for exact item names

3. **Database Update Failed**
   - Solution: Check database connection
   - Verify admin permissions

4. **Images Not Displaying**
   - Solution: Check image URLs in database
   - Verify Supabase Storage bucket permissions

### Debug Mode

Enable debug logging to troubleshoot issues:

```bash
# Enable debug mode
DEBUG=true node scripts/batch-upload-images.js --csv "menu.csv" --images "./images"
```

### Manual Database Update

If automatic database updates fail, you can manually update image URLs:

```sql
-- Update item image URL
UPDATE items
SET image_url = 'https://your-supabase-url/menu-images/menu-items/image.jpg'
WHERE id = 'item-uuid';
```

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the upload results report
3. Check Supabase Storage logs
4. Verify file permissions and network connectivity

## 🔄 Migration from Base64

If you're migrating from base64 image storage:

1. **Export existing images**: Download base64 images from database
2. **Convert to files**: Save base64 data as image files
3. **Batch upload**: Use the batch upload script
4. **Update database**: Run database migration to update image URLs
5. **Clean up**: Remove old base64 data

The system supports both base64 and Supabase Storage URLs for backward compatibility during migration.

---

**Happy Uploading! 🚀**

For more technical details, see the source code in:

- `src/lib/imageUploadService.ts` - Core upload functionality
- `src/components/ImageUpload.tsx` - Single image upload component
- `src/components/BatchImageUpload.tsx` - Batch upload interface
- `scripts/batch-upload-images.js` - Command line upload script
