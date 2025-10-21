import React, { memo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useLang } from '../lib/LangContext';
import { t } from '../lib/i18n';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  className?: string;
}

const SearchBar = memo(
  ({ onSearch, onClear, className = '' }: SearchBarProps) => {
    const { lang } = useLang();
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      onSearch(value);
    };

    const handleClear = () => {
      setQuery('');
      onClear();
      inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClear();
      }
    };

    return (
      <div className={`relative ${className}`}>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
        <Input
          ref={inputRef}
          type='text'
          placeholder={t('searchPlaceholder', lang)}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className='pl-10 pr-10 h-10 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20'
        />
        {query && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={handleClear}
            className='absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/50'
            aria-label={t('clearSearch', lang)}
          >
            <X className='w-4 h-4' />
          </Button>
        )}
      </div>
    );
  },
);

SearchBar.displayName = 'SearchBar';

export default SearchBar;
