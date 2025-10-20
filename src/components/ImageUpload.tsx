import React, { memo, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Image as ImageIcon, Loader2, Upload, X } from 'lucide-react';
import OptimizedImage from './OptimizedImage';
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
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (file: File) => {
      console.log('🔄 ImageUpload: Starting file selection process');

      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Check file size (max 5MB for Supabase Storage, 2MB for base64)
      const maxSize = useSupabaseStorage ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(
          `Image size must be less than ${useSupabaseStorage ? '5MB' : '2MB'}`,
        );
        return;
      }

      console.log('🔄 ImageUpload: File validation passed, starting upload');
      setIsUploading(true);

      try {
        if (useSupabaseStorage) {
          // Direct upload to Supabase Storage using REST API
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

            console.log('🔄 Uploading directly to Supabase:', filePath);

            // Create FormData
            const formData = new FormData();
            formData.append('file', file, uniqueFileName);

            // Upload to Supabase Storage
            const response = await fetch(
              `https://eoaissoqwlfvfizfomax.supabase.co/storage/v1/object/menu-images/${filePath}`,
              {
                method: 'POST',
                headers: {
                  Authorization:
                    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvYWlzc29xd2xmdmZpemZvbWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTY5OTIsImV4cCI6MjA3NTMzMjk5Mn0.SHkFV9EvSnWVmC0tApVU6A6C1rrDqsPMO922rMC1JpY',
                },
                body: formData,
              },
            );

            if (response.ok) {
              const publicUrl = `https://eoaissoqwlfvfizfomax.supabase.co/storage/v1/object/public/menu-images/${filePath}`;
              setPreview(publicUrl);
              onChange(publicUrl);
              console.log('✅ Image uploaded successfully:', publicUrl);
            } else {
              const errorText = await response.text();
              console.error('❌ Upload failed:', response.status, errorText);
              alert(`Upload failed: HTTP ${response.status} - ${errorText}`);
            }
          } catch (error) {
            console.error('❌ Upload error:', error);
            alert(
              `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
          }
        } else {
          // Convert to base64 (legacy method)
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            console.log('Image uploaded, base64 length:', base64String.length);
            setPreview(base64String);
            onChange(base64String);
            setIsUploading(false);
          };
          reader.readAsDataURL(file);
          return; // Don't set isUploading to false here, it's handled in reader.onloadend
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert(
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
  }
);

export default ImageUpload;
