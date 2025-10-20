# Critical Fixes for PIKO Café Pastry Digital Menu

## 1. Fix Floating Point Precision Issues

### Problem
JavaScript floating point arithmetic causes precision errors in cart calculations.

### Solution
Replace direct arithmetic with proper decimal handling:

```typescript
// In src/lib/CartContext.tsx
const total = items.reduce(
  (sum, item) => {
    // Use Math.round to avoid floating point precision issues
    return Math.round((sum + item.price * item.quantity) * 100) / 100;
  },
  0
);
```

## 2. Fix Context Provider Issues

### Problem
Components fail when context providers are missing.

### Solution
Create a proper test wrapper:

```typescript
// In test files
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <LangProvider>
    <DataProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </DataProvider>
  </LangProvider>
);
```

## 3. Fix Memory Leaks

### Problem
Event listeners and intervals not cleaned up.

### Solution
Add proper cleanup in useEffect:

```typescript
// In src/lib/DataContext.tsx
useEffect(() => {
  const interval = setInterval(async () => {
    // ... refresh logic
  }, 30000);

  const handleFocus = async () => {
    // ... focus logic
  };

  window.addEventListener('focus', handleFocus);

  return () => {
    clearInterval(interval);
    window.removeEventListener('focus', handleFocus);
  };
}, [fetchAllData]);
```

## 4. Fix State Management Issues

### Problem
setState called synchronously within effects.

### Solution
Move state updates outside effects:

```typescript
// Instead of:
useEffect(() => {
  if (categories.length > 0 && !selectedCategory) {
    setSelectedCategory(categories[0].id); // ❌ Don't do this
  }
}, [categories, selectedCategory]);

// Do this:
useEffect(() => {
  if (categories.length > 0 && !selectedCategory) {
    // Use a callback or move to a separate effect
    const timer = setTimeout(() => {
      setSelectedCategory(categories[0].id);
    }, 0);
    return () => clearTimeout(timer);
  }
}, [categories, selectedCategory]);
```

## 5. Add Error Boundaries

### Problem
App crashes on errors without graceful handling.

### Solution
Create error boundary component:

```typescript
// src/components/ErrorBoundary.tsx
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Something went wrong</h2>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

## 6. Fix LocalStorage Error Handling

### Problem
App crashes when localStorage quota is exceeded.

### Solution
Add try-catch blocks:

```typescript
// In src/App.tsx
const [page, setPage] = useState<Page>(() => {
  try {
    const saved = localStorage.getItem('piko_last_page');
    return (saved as Page) || 'home';
  } catch (error) {
    console.warn('localStorage error:', error);
    return 'home';
  }
});
```

## 7. Fix Console Statements

### Problem
67 console statements in production code.

### Solution
Replace with proper logging:

```typescript
// Create src/lib/logger.ts
export const logger = {
  info: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  }
};
```

## 8. Fix TypeScript Any Types

### Problem
45 instances of `any` type usage.

### Solution
Create proper types:

```typescript
// Instead of:
const handleError = (error: any) => { ... }

// Use:
interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

const handleError = (error: ApiError) => { ... }
```

## 9. Fix Unused Variables

### Problem
89 unused variables causing linting errors.

### Solution
Remove or prefix with underscore:

```typescript
// Instead of:
const page = 'home'; // unused

// Use:
const _page = 'home'; // prefix with underscore
// or remove entirely if not needed
```

## 10. Add Data Validation

### Problem
No validation for API responses.

### Solution
Add validation functions:

```typescript
// src/lib/validation.ts
export const validateCategory = (data: unknown): Category | null => {
  if (!data || typeof data !== 'object') return null;
  
  const category = data as any;
  
  if (!category.id || !category.names || !category.icon) {
    return null;
  }
  
  return category as Category;
};

export const validateItem = (data: unknown): Item | null => {
  if (!data || typeof data !== 'object') return null;
  
  const item = data as any;
  
  if (!item.id || !item.names || !item.category_id || typeof item.price !== 'number') {
    return null;
  }
  
  return item as Item;
};
```

## Implementation Priority

1. **Immediate (Critical)**: Fix floating point precision and context issues
2. **High Priority**: Add error boundaries and fix memory leaks
3. **Medium Priority**: Fix linting issues and add validation
4. **Low Priority**: Optimize performance and add comprehensive tests

## Testing the Fixes

After implementing these fixes, run:

```bash
# Fix linting issues
npm run lint:fix

# Run tests
npm run test:run

# Check coverage
npm run test:coverage
```

These fixes should resolve the most critical issues and significantly improve the application's stability and code quality.
