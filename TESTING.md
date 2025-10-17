# 🧪 Testing Setup - Piko Digital Menu

This document explains the comprehensive testing setup for the Piko Digital Menu project.

## 📋 Overview

Our testing setup provides:

- **Unit Testing**: Component and hook testing
- **Integration Testing**: Full user workflows
- **Type Safety**: TypeScript testing support
- **Coverage Reports**: Code coverage analysis
- **CI/CD Integration**: Automated testing in pre-commit hooks

## 🛠️ Testing Stack

### Vitest

- **Fast**: Built on Vite for speed
- **TypeScript**: Native TypeScript support
- **Compatible**: Jest-compatible API
- **UI**: Visual test runner

### Testing Library

- **React Testing Library**: Component testing
- **User Event**: User interaction simulation
- **Jest DOM**: Custom matchers

### Coverage

- **V8 Coverage**: Fast coverage reporting
- **HTML Reports**: Visual coverage analysis
- **Thresholds**: Coverage requirements

## 🚀 Available Commands

```bash
# Testing
npm run test              # Run tests in watch mode
npm run test:ui           # Open Vitest UI
npm run test:run          # Run tests once
npm run test:coverage     # Run with coverage report

# Development
npm run dev               # Start dev server
npm run build             # Build for production
```

## 📁 Test Structure

```
src/
├── test/
│   ├── setup.ts          # Test configuration
│   └── utils/
│       └── test-utils.tsx # Testing utilities
├── components/
│   └── __tests__/        # Component tests
├── lib/
│   └── hooks/
│       └── __tests__/    # Hook tests
└── pages/
    └── __tests__/        # Page tests
```

## 🧪 Test Examples

### Component Testing

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/utils/test-utils';
import PikoLogo from '../PikoLogo';

describe('PikoLogo', () => {
  it('renders without crashing', () => {
    render(<PikoLogo />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
});
```

### Hook Testing

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCartOperations } from '../useCartOperations';

describe('useCartOperations', () => {
  it('should add item to cart', () => {
    const { result } = renderHook(() => useCartOperations());

    act(() => {
      result.current.addItemToCart(mockItem);
    });

    expect(mockCartContext.addItem).toHaveBeenCalledWith(mockItem);
  });
});
```

### Integration Testing

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '../../test/utils/test-utils';
import CategoryMenu from '../../pages/CategoryMenu';

describe('CategoryMenu Integration', () => {
  it('should display items and handle interactions', async () => {
    render(<CategoryMenu categoryId="test-category" onNavigate={vi.fn()} />);

    expect(screen.getByText('Test Category')).toBeInTheDocument();

    const addButton = screen.getByText('Add to Cart');
    fireEvent.click(addButton);

    expect(screen.getByText('Item added to cart')).toBeInTheDocument();
  });
});
```

## 🔧 Configuration

### Vitest Config (`vitest.config.ts`)

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### Test Setup (`src/test/setup.ts`)

- **Jest DOM**: Custom matchers
- **Cleanup**: Automatic cleanup after tests
- **Mocks**: Global mocks for browser APIs
- **Storage**: localStorage/sessionStorage mocks

## 📊 Coverage Reports

### Coverage Thresholds

- **Statements**: 80%
- **Branches**: 70%
- **Functions**: 80%
- **Lines**: 80%

### Coverage Commands

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/index.html
```

## 🎯 Testing Best Practices

### 1. Test Structure

```typescript
describe('ComponentName', () => {
  describe('when condition', () => {
    it('should do something', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### 2. Test Naming

- **Descriptive**: Clear what is being tested
- **Consistent**: Follow naming conventions
- **Specific**: Test one thing at a time

### 3. Mock Strategy

```typescript
// Mock external dependencies
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },
}));
```

### 4. Async Testing

```typescript
it('should handle async operations', async () => {
  const { result } = renderHook(() => useAsyncOperation());

  await act(async () => {
    await result.current.performAsyncOperation();
  });

  expect(result.current.isLoading).toBe(false);
});
```

## 🔄 Pre-commit Testing

Tests run automatically on pre-commit:

1. **Linting**: ESLint checks
2. **Formatting**: Prettier formatting
3. **Testing**: Related tests run
4. **Type Checking**: TypeScript validation

## 🐛 Debugging Tests

### Vitest UI

```bash
npm run test:ui
```

- Visual test runner
- Real-time results
- Debug capabilities

### Debug Mode

```typescript
// Add to test
import { debug } from '@testing-library/react';

it('should debug component', () => {
  render(<MyComponent />);
  debug(); // Prints component HTML
});
```

## 📈 Performance Testing

### Component Performance

```typescript
import { render } from '@testing-library/react';
import { performance } from 'perf_hooks';

it('should render within time limit', () => {
  const start = performance.now();
  render(<ExpensiveComponent />);
  const end = performance.now();

  expect(end - start).toBeLessThan(100); // 100ms limit
});
```

## 🚨 Common Issues

### 1. Mock Issues

```typescript
// Clear mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
```

### 2. Async Issues

```typescript
// Wait for async operations
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

### 3. Context Issues

```typescript
// Provide context in tests
const wrapper = ({ children }) => (
  <CartProvider>{children}</CartProvider>
);
```

## 🎉 Benefits

This testing setup provides:

- **Bug Prevention**: Catch issues early
- **Code Confidence**: Safe refactoring
- **Documentation**: Tests serve as examples
- **Quality Assurance**: Maintain high standards
- **Team Collaboration**: Shared testing practices

## 📖 Resources

- **Vitest Docs**: https://vitest.dev/
- **Testing Library**: https://testing-library.com/
- **Jest DOM**: https://github.com/testing-library/jest-dom
- **React Testing**: https://reactjs.org/docs/testing.html
