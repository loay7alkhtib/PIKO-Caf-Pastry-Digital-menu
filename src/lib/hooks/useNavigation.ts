import { useCallback } from 'react';
import type { Page } from '../types';

interface UseNavigationProps {
  onNavigate: (page: Page, categoryId?: string) => void;
}

export function useNavigation({ onNavigate }: UseNavigationProps) {
  const navigateToHome = useCallback(() => {
    onNavigate('home');
  }, [onNavigate]);

  const navigateToCategory = useCallback(
    (categoryId: string) => {
      onNavigate('category', categoryId);
    },
    [onNavigate]
  );


  const navigateToLogin = useCallback(() => {
    onNavigate('login');
  }, [onNavigate]);

  const navigateToSignUp = useCallback(() => {
    onNavigate('signup');
  }, [onNavigate]);

  const navigateToAdminLogin = useCallback(() => {
    onNavigate('admin-login');
  }, [onNavigate]);

  const navigateToAdmin = useCallback(() => {
    onNavigate('admin');
  }, [onNavigate]);

  return {
    navigateToHome,
    navigateToCategory,
    navigateToLogin,
    navigateToSignUp,
    navigateToAdminLogin,
    navigateToAdmin,
  };
}
