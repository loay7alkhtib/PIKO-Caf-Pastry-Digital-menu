import React, { memo, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Image as ImageIcon, Loader2, Upload, X } from 'lucide-react';
import OptimizedImage from './OptimizedImage';
import { supabaseClient as supabase } from '../lib/supabase';
import { toast } from 'sonner';
// import { imageUploadService } from '@/lib/imageUploadService';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  label?: string;
  fallbackIcon?: string;
  aspectRatio?: string;
  useSupabaseStorage?: boolean; // New prop to enable Supabase Storage upload
  itemName?: string; // For auto-matching with item names
}

const ImageUpload = memo(
  ({
    value,
    onChange,
    label = 'Image',
    fallbackIcon = '🍽️',
    aspectRatio = '4/3',
    useSupabaseStorage = false,
    itemName,
  }: ImageUploadProps) => {
    const [preview, setPreview] = useState<string | null>(value || null);

    // Keep preview state in sync with incoming value
    React.useEffect(() => {
      setPreview(value || null);
    }, [value]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (file: File) => {
      console.warn('🔄 ImageUpload: Starting file selection process');

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Check file size (max 5MB for Supabase Storage, 2MB for base64)
      const maxSize = useSupabaseStorage ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(
          `Image size must be less than ${useSupabaseStorage ? '5MB' : '2MB'}`,
        );
        return;
      }

      console.warn('🔄 ImageUpload: File validation passed, starting upload');
      setIsUploading(true);

      try {
        if (useSupabaseStorage) {
          // Use Supabase client for proper authentication and error handling
          try {
            const timestamp = Date.now();
            const fileExtension = file.name.split('.').pop();
            const baseName = file.name.replace(/\.[^/.]+$/, '');

            // Sanitize filename for Supabase Storage (no Arabic, spaces, or special chars)
            const sanitizeFileName = (name: string) => {
              return name
                .replace(/[\u0600-\u06FF]/g, '') // Remove Arabic characters
                .replace(/[^a-zA-Z0-9.-]/g, '-') // Replace special chars with hyphens
                .replace(/-+/g, '-') // Replace multiple hyphens with single
                .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
                .toLowerCase();
            };

            const safeBaseName = sanitizeFileName(baseName);
            const uniqueFileName = itemName
              ? `${sanitizeFileName(itemName)}-${timestamp}.${fileExtension}`
              : `${safeBaseName || 'image'}-${timestamp}.${fileExtension}`;
            const filePath = `menu-items/${uniqueFileName}`;

            console.warn('🔄 Uploading to Supabase Storage:', filePath);

            // Use Supabase client for better error handling and authentication
            console.warn('🔄 Using Supabase client upload...');

            const { data, error } = await supabase.storage
              .from('menu-images')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
              });

            if (error) {
              console.error('❌ Supabase upload error:', error);
              let errorMessage = 'Upload failed: ';

              if (error.message.includes('JWT')) {
                errorMessage +=
                  'Authentication failed. Please check your API key.';
              } else if (error.message.includes('permission')) {
                errorMessage +=
                  'Access denied. You may not have permission to upload to this bucket.';
              } else if (error.message.includes('size')) {
                errorMessage +=
                  'File too large. Please choose a smaller image.';
              } else if (
                error.message.includes('not found') ||
                error.message.includes('bucket')
              ) {
                errorMessage +=
                  'Storage bucket not found. Please create a "menu-images" bucket in your Supabase project.';
              } else {
                errorMessage += error.message;
              }

              // Show error but also offer fallback to base64
              toast.error(`${errorMessage} Falling back to base64.`);
              // Convert to base64 as fallback
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64String = reader.result as string;
                console.warn(
                  `Image uploaded as base64, length: ${base64String.length}`,
                );
                setPreview(base64String);
                onChange(base64String);
                setIsUploading(false);
              };
              reader.readAsDataURL(file);
              return;
            }

            if (data) {
              // Get the public URL
              const { data: urlData } = supabase.storage
                .from('menu-images')
                .getPublicUrl(filePath);

              const publicUrl = urlData.publicUrl;
              console.warn('✅ Image uploaded successfully:', publicUrl);
              setPreview(publicUrl);
              onChange(publicUrl);
              setIsUploading(false);
            }
          } catch (error) {
            console.error('❌ Upload error:', error);
            toast.error(
              `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}. Falling back to base64.`,
            );
            // Convert to base64 as fallback
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64String = reader.result as string;
              console.warn(
                `Image uploaded as base64, length: ${base64String.length}`,
              );
              setPreview(base64String);
              onChange(base64String);
              setIsUploading(false);
            };
            reader.readAsDataURL(file);
            return;
          }
        } else {
          // Convert to base64 (legacy method)
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            console.warn('Image uploaded, base64 length:', base64String.length);
            setPreview(base64String);
            onChange(base64String);
            setIsUploading(false);
          };
          reader.readAsDataURL(file);
          return; // Don't set isUploading to false here, it's handled in reader.onloadend
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(
          `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      } finally {
        setIsUploading(false);
      }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault(); // Prevent any form submission
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent any form submission
      setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent any form submission
      setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent any form submission
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    };

    const handleRemove = () => {
      setPreview(null);
      onChange(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    return (
      <div className='space-y-2'>
        {label && <Label>{label}</Label>}

        <div
          className={`relative border-2 border-dashed rounded-xl overflow-hidden transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{ aspectRatio }}
        >
          {preview ? (
            <div className='relative w-full h-full group'>
              <OptimizedImage
                src={preview}
                alt='Upload preview'
                className='w-full h-full object-cover'
              />
              <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2'>
                <Button
                  type='button'
                  size='sm'
                  variant='secondary'
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className='gap-2'
                >
                  <Upload className='w-4 h-4' />
                  Change
                </Button>
                <Button
                  type='button'
                  size='sm'
                  variant='destructive'
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemove();
                  }}
                  className='gap-2'
                >
                  <X className='w-4 h-4' />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <button
              type='button'
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={isUploading}
              className='w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors p-4 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <div className='text-4xl'>{fallbackIcon}</div>
              <div className='flex items-center gap-2'>
                {isUploading ? (
                  <Loader2 className='w-5 h-5 animate-spin' />
                ) : (
                  <ImageIcon className='w-5 h-5' />
                )}
                <span className='text-sm font-medium'>
                  {isUploading ? 'Uploading...' : 'Upload Image'}
                </span>
              </div>
              <span className='text-xs text-muted-foreground'>
                Click or drag & drop (max {useSupabaseStorage ? '5MB' : '2MB'})
              </span>
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          onChange={handleFileInputChange}
          className='hidden'
        />
      </div>
    );
  },
);

export default ImageUpload;
