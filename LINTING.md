# 🛠️ Linting & Code Quality Setup

This document explains the comprehensive linting and code quality setup for the Piko Digital Menu project.

## 📋 Overview

Our linting setup ensures:

- **Code Quality**: Consistent, readable, and maintainable code
- **Bug Prevention**: Catch potential issues before they reach production
- **Type Safety**: Full TypeScript type checking
- **Format Consistency**: Automatic code formatting
- **Pre-commit Hooks**: Quality checks before commits

## 🛠️ Tools & Configuration

### ESLint

- **Purpose**: JavaScript/TypeScript linting
- **Config**: `eslint.config.js`
- **Rules**: TypeScript, React, and general code quality rules

### Prettier

- **Purpose**: Code formatting
- **Config**: `.prettierrc`
- **Ignore**: `.prettierignore`

### Husky

- **Purpose**: Git hooks for pre-commit checks
- **Setup**: Automatically configured

### lint-staged

- **Purpose**: Run linters only on staged files
- **Config**: `.lintstagedrc`

## 🚀 Available Scripts

```bash
# Development
npm run dev              # Start development server

# Linting
npm run lint             # Check for linting errors
npm run lint:fix         # Fix auto-fixable linting errors

# Formatting
npm run format           # Format all files with Prettier
npm run format:check     # Check if files are formatted correctly

# Type Checking
npm run type-check       # Run TypeScript type checking

# Building
npm run build            # Build for production

# Pre-commit (automatically runs)
npm run pre-commit       # Run lint-staged checks
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin-specific components
│   ├── figma/          # Figma-generated components
│   └── ui/             # Base UI components (Radix UI)
├── lib/                # Core utilities and contexts
│   ├── config/         # Configuration files
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── pages/              # Main application pages
├── styles/             # Global styles
└── supabase/           # Supabase functions
```

## 🔧 ESLint Rules

### TypeScript Rules

- `@typescript-eslint/no-unused-vars`: Warn about unused variables
- `@typescript-eslint/no-explicit-any`: Warn about `any` types
- `@typescript-eslint/prefer-const`: Enforce `const` over `let`
- `@typescript-eslint/no-floating-promises`: Catch unhandled promises
- `@typescript-eslint/await-thenable`: Ensure proper async/await usage

### React Rules

- `react-hooks/exhaustive-deps`: Check hook dependencies
- `react-hooks/rules-of-hooks`: Enforce hooks rules
- `react-refresh/only-export-components`: Optimize hot reloading

### Code Quality Rules

- `no-console`: Warn about console statements (except warn/error)
- `no-debugger`: Error on debugger statements
- `prefer-const`: Enforce const declarations
- `prefer-template`: Use template literals over string concatenation
- `object-shorthand`: Use object shorthand syntax

## 🎨 Prettier Configuration

- **Semicolons**: Always use semicolons
- **Quotes**: Single quotes for strings
- **Trailing Commas**: ES5 compatible
- **Print Width**: 80 characters
- **Tab Width**: 2 spaces
- **End of Line**: LF (Unix style)

## 🔄 Pre-commit Workflow

1. **Stage files**: `git add .`
2. **Commit**: `git commit -m "message"`
3. **Husky triggers**: Pre-commit hook runs
4. **lint-staged runs**:
   - ESLint on `.ts/.tsx` files
   - Prettier on all supported files
5. **If checks pass**: Commit proceeds
6. **If checks fail**: Commit is blocked

## 🐛 Common Issues & Solutions

### ESLint Errors

```bash
# Fix auto-fixable issues
npm run lint:fix

# Check specific file
npx eslint src/components/MyComponent.tsx
```

### Prettier Issues

```bash
# Format all files
npm run format

# Check formatting
npm run format:check
```

### TypeScript Errors

```bash
# Check types
npm run type-check

# Build with type checking
npm run build
```

## 📊 Quality Metrics

The setup helps maintain:

- **Zero TypeScript errors** in production builds
- **Consistent code formatting** across the team
- **No console.log statements** in production
- **Proper React hooks usage**
- **Clean import/export statements**

## 🔧 IDE Integration

### VS Code

Install these extensions for best experience:

- ESLint
- Prettier - Code formatter
- TypeScript Importer
- Auto Rename Tag

### Settings

Add to your VS Code settings:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["typescript", "typescriptreact"]
}
```

## 🚨 Troubleshooting

### Common Issues

1. **ESLint not running**: Check if dependencies are installed
2. **Prettier conflicts**: Ensure ESLint and Prettier configs are compatible
3. **Type errors**: Run `npm run type-check` to see detailed errors
4. **Husky not working**: Run `npm run prepare` to reinstall hooks

### Reset Everything

```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Reinstall Husky
npm run prepare
```

## 📈 Best Practices

1. **Run linting before commits**: `npm run lint`
2. **Format code regularly**: `npm run format`
3. **Check types during development**: `npm run type-check`
4. **Fix issues immediately**: Don't let linting errors accumulate
5. **Use meaningful commit messages**: Help with debugging

## 🎯 Benefits

This setup provides:

- **Faster Development**: Catch errors early
- **Better Code Quality**: Consistent, readable code
- **Team Collaboration**: Shared coding standards
- **Production Safety**: Prevent bugs from reaching users
- **Maintainability**: Easier to understand and modify code
