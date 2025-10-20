import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LangProvider, useLang } from '../LangContext';
import { renderWithProviders } from '../../test/utils/test-utils';

const TestComponent = () => {
  const { lang, setLang } = useLang();

  return (
    <div>
      <div data-testid='current-lang'>{lang}</div>
      <button onClick={() => setLang('tr')}>Set Turkish</button>
      <button onClick={() => setLang('ar')}>Set Arabic</button>
      <button onClick={() => setLang('en')}>Set English</button>
    </div>
  );
};

describe('LangContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should provide default language (English)', () => {
    renderWithProviders(
      <LangProvider>
        <TestComponent />
      </LangProvider>
    );

    expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
  });

  it('should change language to Turkish', async () => {
    renderWithProviders(
      <LangProvider>
        <TestComponent />
      </LangProvider>
    );

    fireEvent.click(screen.getByText('Set Turkish'));

    await waitFor(() => {
      expect(screen.getByTestId('current-lang')).toHaveTextContent('tr');
    });
  });

  it('should change language to Arabic', async () => {
    renderWithProviders(
      <LangProvider>
        <TestComponent />
      </LangProvider>
    );

    fireEvent.click(screen.getByText('Set Arabic'));

    await waitFor(() => {
      expect(screen.getByTestId('current-lang')).toHaveTextContent('ar');
    });
  });

  it('should change language back to English', async () => {
    renderWithProviders(
      <LangProvider>
        <TestComponent />
      </LangProvider>
    );

    // First change to Turkish
    fireEvent.click(screen.getByText('Set Turkish'));

    await waitFor(() => {
      expect(screen.getByTestId('current-lang')).toHaveTextContent('tr');
    });

    // Then change back to English
    fireEvent.click(screen.getByText('Set English'));

    await waitFor(() => {
      expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
    });
  });

  it('should persist language in localStorage', async () => {
    renderWithProviders(
      <LangProvider>
        <TestComponent />
      </LangProvider>
    );

    fireEvent.click(screen.getByText('Set Turkish'));

    await waitFor(() => {
      expect(screen.getByTestId('current-lang')).toHaveTextContent('tr');
    });

    // Check that language is stored in localStorage
    expect(localStorage.getItem('piko-lang')).toBe('tr');
  });

  it('should load language from localStorage on initialization', () => {
    // Set language in localStorage before rendering
    localStorage.setItem('piko-lang', 'ar');

    renderWithProviders(
      <LangProvider>
        <TestComponent />
      </LangProvider>
    );

    expect(screen.getByTestId('current-lang')).toHaveTextContent('ar');
  });

  it('should handle invalid language values gracefully', () => {
    // Set invalid language in localStorage
    localStorage.setItem('piko-lang', 'invalid-lang');

    renderWithProviders(
      <LangProvider>
        <TestComponent />
      </LangProvider>
    );

    // Should fallback to default language
    expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
  });

  it('should handle language switching with RTL support', async () => {
    const TestComponentRTL = () => {
      const { lang, setLang } = useLang();

      return (
        <div>
          <div data-testid='current-lang'>{lang}</div>
          <div data-testid='rtl-support'>{lang === 'ar' ? 'rtl' : 'ltr'}</div>
          <button onClick={() => setLang('ar')}>Set Arabic</button>
          <button onClick={() => setLang('en')}>Set English</button>
        </div>
      );
    };

    renderWithProviders(
      <LangProvider>
        <TestComponentRTL />
      </LangProvider>
    );

    // Start with English (LTR)
    expect(screen.getByTestId('rtl-support')).toHaveTextContent('ltr');

    // Switch to Arabic (RTL)
    fireEvent.click(screen.getByText('Set Arabic'));

    await waitFor(() => {
      expect(screen.getByTestId('current-lang')).toHaveTextContent('ar');
      expect(screen.getByTestId('rtl-support')).toHaveTextContent('rtl');
    });

    // Switch back to English (LTR)
    fireEvent.click(screen.getByText('Set English'));

    await waitFor(() => {
      expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
      expect(screen.getByTestId('rtl-support')).toHaveTextContent('ltr');
    });
  });

  it('should handle multiple language changes', async () => {
    renderWithProviders(
      <LangProvider>
        <TestComponent />
      </LangProvider>
    );

    // Change to Turkish
    fireEvent.click(screen.getByText('Set Turkish'));
    await waitFor(() => {
      expect(screen.getByTestId('current-lang')).toHaveTextContent('tr');
    });

    // Change to Arabic
    fireEvent.click(screen.getByText('Set Arabic'));
    await waitFor(() => {
      expect(screen.getByTestId('current-lang')).toHaveTextContent('ar');
    });

    // Change to English
    fireEvent.click(screen.getByText('Set English'));
    await waitFor(() => {
      expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
    });

    // Verify final state
    expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
    expect(localStorage.getItem('piko-lang')).toBe('en');
  });

  it('should handle component unmounting and remounting', async () => {
    const { unmount } = renderWithProviders(
      <LangProvider>
        <TestComponent />
      </LangProvider>
    );

    // Change language
    fireEvent.click(screen.getByText('Set Turkish'));
    await waitFor(() => {
      expect(screen.getByTestId('current-lang')).toHaveTextContent('tr');
    });

    // Unmount component
    unmount();

    // Remount component
    renderWithProviders(
      <LangProvider>
        <TestComponent />
      </LangProvider>
    );

    // Language should persist
    expect(screen.getByTestId('current-lang')).toHaveTextContent('tr');
  });
});
