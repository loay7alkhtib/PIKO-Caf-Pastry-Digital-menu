import { supabaseClient as supabase } from './supabase';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
}

export interface BatchUploadResult {
  success: boolean;
  uploaded: number;
  failed: number;
  results: Array<{
    fileName: string;
    success: boolean;
    url?: string;
    error?: string;
    matchedItem?: string;
  }>;
}

class ImageUploadService {
  private bucketName = 'menu-images';

  /**
   * Upload a single image file to Supabase Storage
   */
  async uploadImage(
    file: File,
    fileName?: string,
    folder?: string,
  ): Promise<UploadResult> {
    try {
      // Generate unique filename if not provided
      const timestamp = Date.now();
      const finalFileName = fileName || `${timestamp}-${file.name}`;
      const filePath = folder ? `${folder}/${finalFileName}` : finalFileName;

      console.warn('🔄 Attempting to upload:', {
        fileName: finalFileName,
        filePath,
        fileSize: file.size,
        fileType: file.type,
        bucket: this.bucketName,
      });

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false, // Don't overwrite existing files
        });

      if (error) {
        console.error('❌ Upload error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          statusCode: error.statusCode,
          error: error.error,
        });
        return {
          success: false,
          error: error.message,
          fileName: finalFileName,
        };
      }

      console.warn('✅ Upload successful:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path);

      console.warn('🔗 Public URL:', urlData.publicUrl);

      return {
        success: true,
        url: urlData.publicUrl,
        fileName: finalFileName,
      };
    } catch (error) {
      console.error('💥 Upload service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName: fileName || file.name,
      };
    }
  }

  /**
   * Upload multiple images and auto-match with item names
   */
  async batchUploadWithMatching(
    files: File[],
    itemNames: string[],
    folder?: string,
  ): Promise<BatchUploadResult> {
    const results: BatchUploadResult['results'] = [];
    let uploaded = 0;
    let failed = 0;

    for (const file of files) {
      try {
        // Try to match filename with item name
        const matchedItem = this.findMatchingItem(file.name, itemNames);

        // Upload the file
        const uploadResult = await this.uploadImage(
          file,
          matchedItem ? this.sanitizeFileName(matchedItem) : undefined,
          folder,
        );

        results.push({
          fileName: file.name,
          success: uploadResult.success,
          url: uploadResult.url,
          error: uploadResult.error,
          matchedItem: matchedItem || undefined,
        });

        if (uploadResult.success) {
          uploaded++;
        } else {
          failed++;
        }
      } catch (error) {
        results.push({
          fileName: file.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        failed++;
      }
    }

    return {
      success: failed === 0,
      uploaded,
      failed,
      results,
    };
  }

  /**
   * Find matching item name based on filename
   */
  private findMatchingItem(
    fileName: string,
    itemNames: string[],
  ): string | null {
    // Remove file extension and normalize
    const baseName = fileName.replace(/\.[^/.]+$/, '').toLowerCase();

    // Try exact match first
    for (const itemName of itemNames) {
      const normalizedItemName = itemName.toLowerCase();
      if (baseName === normalizedItemName) {
        return itemName;
      }
    }

    // Try partial match (filename contains item name)
    for (const itemName of itemNames) {
      const normalizedItemName = itemName.toLowerCase();
      if (
        baseName.includes(normalizedItemName) ||
        normalizedItemName.includes(baseName)
      ) {
        return itemName;
      }
    }

    // Try fuzzy match (remove spaces, special characters)
    const cleanBaseName = baseName.replace(/[^a-z0-9]/g, '');
    for (const itemName of itemNames) {
      const cleanItemName = itemName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (
        cleanBaseName === cleanItemName ||
        cleanBaseName.includes(cleanItemName) ||
        cleanItemName.includes(cleanBaseName)
      ) {
        return itemName;
      }
    }

    return null;
  }

  /**
   * Sanitize filename for storage
   */
  private sanitizeFileName(fileName: string): string {
    return fileName
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Get all existing images in the bucket
   */
  async listImages(folder?: string): Promise<string[]> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list(folder);

      if (error) {
        console.error('List images error:', error);
        return [];
      }

      return data.map(file => file.name);
    } catch (error) {
      console.error('List images service error:', error);
      return [];
    }
  }

  /**
   * Delete an image from storage
   */
  async deleteImage(
    filePath: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update item image URL in database
   */
  async updateItemImage(
    itemId: string,
    imageUrl: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('items')
        .update({ image_url: imageUrl })
        .eq('id', itemId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get public URL for an image
   */
  getPublicUrl(filePath: string): string {
    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  /**
   * Generate optimized image URL with transformations
   */
  getOptimizedUrl(
    filePath: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'jpeg' | 'png';
    } = {},
  ): string {
    const baseUrl = this.getPublicUrl(filePath);

    if (!baseUrl) return '';

    const { width, height, quality = 80, format = 'webp' } = options;
    const params = new URLSearchParams();

    if (width) params.set('width', width.toString());
    if (height) params.set('height', height.toString());
    if (quality) params.set('quality', quality.toString());
    if (format) params.set('format', format);

    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}${params.toString()}`;
  }
}

export const imageUploadService = new ImageUploadService();
