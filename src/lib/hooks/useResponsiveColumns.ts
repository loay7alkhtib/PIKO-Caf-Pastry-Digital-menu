import { useEffect, useMemo, useState } from 'react';

export function useResponsiveColumns() {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  // Track window width for responsive columns
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate responsive column count
  const columnCount = useMemo(() => {
    if (windowWidth >= 1536) return 6; // 2xl
    if (windowWidth >= 1280) return 5; // xl
    if (windowWidth >= 1024) return 4; // lg
    if (windowWidth >= 768) return 3; // md
    return 2; // mobile & small tablet - 2 columns for better bento grid
  }, [windowWidth]);

  // Responsive gutter size
  const gutterSize = useMemo(() => {
    if (windowWidth < 768) return '0.75rem'; // 12px on mobile
    if (windowWidth < 1024) return '1rem'; // 16px on tablet
    return '1.25rem'; // 20px on desktop
  }, [windowWidth]);

  return { columnCount, gutterSize, windowWidth };
}
