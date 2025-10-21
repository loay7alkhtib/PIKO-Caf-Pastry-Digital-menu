import { useEffect } from 'react';

export function useScrollToTop(dependency?: string | number | boolean) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [dependency]);
}
