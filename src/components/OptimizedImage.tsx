import React, { useEffect, useRef, useState } from 'react';
import { cn } from './ui/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  fallback?: string;
  sizes?: string;
  quality?: number;
}

// Generate WebP URL with quality optimization
function getOptimizedImageUrl(
  src: string,
  width?: number,
  height?: number,
  quality: number = 80,
): string {
  if (!src) return '';

  // If it's already a CDN URL or optimized, return as-is
  if (
    src.includes('supabase') ||
    src.includes('cloudinary') ||
    src.includes('vercel')
  ) {
    return src;
  }

  // For local images, you might want to use a service like Cloudinary or Vercel's Image Optimization
  // For now, return the original src
  return src;
}

// Generate blur placeholder
function generateBlurDataURL(width: number = 10, height: number = 10): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f3f4f6');
    gradient.addColorStop(1, '#e5e7eb');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  return canvas.toDataURL('image/jpeg', 0.1);
}

export default function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  fallback = '/placeholder-image.jpg',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 80,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  // For now, use the original src to avoid any optimization issues
  const finalSrc = hasError ? fallback : src;

  return (
    <div className={cn('relative overflow-hidden bg-muted', className)}>
      {/* Loading skeleton */}
      {!isLoaded && placeholder === 'empty' && (
        <div className='absolute inset-0 bg-muted animate-pulse' />
      )}

      {/* Actual image */}
      <img
        src={finalSrc}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        decoding='async'
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          'w-full h-full object-cover',
        )}
      />

      {/* Error fallback */}
      {hasError && (
        <div className='absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground'>
          <div className='text-center'>
            <div className='text-2xl mb-2'>📷</div>
            <div className='text-xs'>Image unavailable</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for preloading images
export function useImagePreload(src: string) {
  const [isPreloaded, setIsPreloaded] = useState(false);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.onload = () => setIsPreloaded(true);
    img.onerror = () => setIsPreloaded(false);
    img.src = src;
  }, [src]);

  return isPreloaded;
}

// Component for preloading multiple images
export function ImagePreloader({ srcs }: { srcs: string[] }) {
  const [preloadedCount, setPreloadedCount] = useState(0);

  useEffect(() => {
    let loaded = 0;
    const total = srcs.length;

    const handleLoad = () => {
      loaded++;
      setPreloadedCount(loaded);
    };

    srcs.forEach(src => {
      const img = new Image();
      img.onload = handleLoad;
      img.onerror = handleLoad; // Count errors as "loaded" to avoid hanging
      img.src = src;
    });
  }, [srcs]);

  return (
    <div className='sr-only'>
      Preloaded {preloadedCount}/{srcs.length} images
    </div>
  );
}
