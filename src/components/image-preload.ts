import { useEffect, useState } from 'react';

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

export function ImagePreloader({ srcs }: { srcs: string[] }) {
  const [, setPreloadedCount] = useState(0);

  useEffect(() => {
    let loaded = 0;
    const handleLoad = () => {
      loaded++;
      setPreloadedCount(loaded);
    };
    srcs.forEach(src => {
      const img = new Image();
      img.onload = handleLoad;
      img.onerror = handleLoad;
      img.src = src;
    });
  }, [srcs]);

  return null;
}
