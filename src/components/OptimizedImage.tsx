import React, { useState } from 'react';
import { cn } from './ui/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  fallback?: string;
  sizes?: string;
}

export default function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  placeholder = 'blur',
  fallback = '/placeholder-image.jpg',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
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

// useImagePreload and ImagePreloader moved to ./image-preload.ts to satisfy
// react-refresh rule about exporting only components from this file.
