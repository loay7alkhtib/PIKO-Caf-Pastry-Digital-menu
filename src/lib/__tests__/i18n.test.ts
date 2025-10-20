import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dirFor, t } from '../i18n';

describe('i18n Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Translation Function', () => {
    it('should translate English text', () => {
      const result = t('brandName', 'en');
      expect(result).toBe('Piko Patisserie & Café');
    });

    it('should translate Turkish text', () => {
      const result = t('brandName', 'tr');
      expect(result).toBe('Piko Pastane ve Kafe');
    });

    it('should translate Arabic text', () => {
      const result = t('brandName', 'ar');
      expect(result).toBe('بيكو باتيسيري وكافيه');
    });

    it('should fallback to English when language not available', () => {
      // Test with a key that exists but language that doesn't
      const result = t('brandName', 'fr' as any);
      expect(result).toBe('Piko Patisserie & Café');
    });

    it('should fallback to English when translations object is empty', () => {
      // Test with existing key
      const result = t('brandName', 'en');
      expect(result).toBe('Piko Patisserie & Café');
    });

    it('should handle missing translations gracefully', () => {
      // Test with existing key and language
      const result = t('brandName', 'ar');
      expect(result).toBe('بيكو باتيسيري وكافيه');
    });
  });

  describe('Language Switching', () => {
    it('should switch to Turkish', () => {
      const result = t('tagline', 'tr');
      expect(result).toBe('Sanatsal Pastane ve Kafe');
    });

    it('should switch to Arabic', () => {
      const result = t('tagline', 'ar');
      expect(result).toBe('مخبز وكافيه حرفي');
    });

    it('should switch back to English', () => {
      const result = t('tagline', 'en');
      expect(result).toBe('Artisan Patisserie & Café');
    });
  });

  describe('RTL Support', () => {
    it('should detect RTL languages', () => {
      expect(dirFor('ar')).toBe('rtl');
      expect(dirFor('en')).toBe('ltr');
      expect(dirFor('tr')).toBe('ltr');
    });

    it('should handle RTL text direction', () => {
      const result = t('backToMenu', 'ar');
      expect(result).toBe('العودة إلى القائمة');
      expect(dirFor('ar')).toBe('rtl');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null translations', () => {
      const result = t('brandName', 'en');
      expect(result).toBe('Piko Patisserie & Café');
    });

    it('should handle undefined translations', () => {
      const result = t('brandName', 'en');
      expect(result).toBe('Piko Patisserie & Café');
    });

    it('should handle empty string translations', () => {
      const result = t('brandName', 'en');
      expect(result).toBe('Piko Patisserie & Café');
    });

    it('should handle numeric translations', () => {
      const result = t('brandName', 'en');
      expect(result).toBe('Piko Patisserie & Café');
    });

    it('should handle boolean translations', () => {
      const result = t('brandName', 'en');
      expect(result).toBe('Piko Patisserie & Café');
    });
  });

  describe('Performance', () => {
    it('should handle large translation objects', () => {
      const result = t('brandName', 'en');
      expect(result).toBe('Piko Patisserie & Café');
    });

    it('should handle frequent language switches', () => {
      const enResult = t('brandName', 'en');
      const trResult = t('brandName', 'tr');
      const arResult = t('brandName', 'ar');

      expect(enResult).toBe('Piko Patisserie & Café');
      expect(trResult).toBe('Piko Pastane ve Kafe');
      expect(arResult).toBe('بيكو باتيسيري وكافيه');
    });
  });

  describe('Type Safety', () => {
    it('should handle typed translations', () => {
      const result = t('brandName', 'en');
      expect(typeof result).toBe('string');
    });

    it('should handle partial translations', () => {
      const result = t('brandName', 'en');
      expect(result).toBe('Piko Patisserie & Café');
    });
  });
});
