import { useEffect } from 'react';

export function useScrollToTop(dependency?: any) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [dependency]);
}
