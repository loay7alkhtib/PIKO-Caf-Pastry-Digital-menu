import React from 'react';
import { useLang } from '../lib/LangContext';
import { dirFor } from '../lib/i18n';

interface LanguageWrapperProps {
  children: React.ReactNode;
}

export default function LanguageWrapper({ children }: LanguageWrapperProps) {
  const { lang } = useLang();

  return (
    <div
      className={`min-h-screen bg-background text-foreground ${lang === 'ar' ? 'lang-ar' : ''}`}
      dir={dirFor(lang)}
    >
      {children}
    </div>
  );
}
