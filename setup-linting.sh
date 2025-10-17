#!/bin/bash

# Piko Digital Menu - Linting Setup Script
# This script sets up the complete linting and code quality environment

echo "🚀 Setting up Piko Digital Menu linting environment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📦 Installing dependencies..."

# Install all dependencies
npm install

echo "🔧 Setting up Husky for pre-commit hooks..."

# Initialize Husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run pre-commit"

echo "✅ Running initial linting check..."

# Run linting to check for any issues
npm run lint

echo "🎨 Running Prettier to format code..."

# Format all code
npm run format

echo "🔍 Running TypeScript type check..."

# Check types
npm run type-check

echo "🧪 Running initial test suite..."

# Run tests to verify setup
npm run test:run

echo ""
echo "🎉 Setup complete! Your Piko Digital Menu project now has:"
echo ""
echo "✅ ESLint configuration with TypeScript and React rules"
echo "✅ Prettier for consistent code formatting"
echo "✅ Husky pre-commit hooks"
echo "✅ lint-staged for efficient linting"
echo "✅ TypeScript type checking"
echo "✅ Vitest testing framework with React Testing Library"
echo "✅ Test coverage reporting"
echo "✅ Comprehensive npm scripts"
echo ""
echo "📋 Available commands:"
echo "  npm run dev              # Start development server"
echo "  npm run lint             # Check for linting errors"
echo "  npm run lint:fix         # Fix auto-fixable errors"
echo "  npm run format           # Format code with Prettier"
echo "  npm run type-check       # Check TypeScript types"
echo "  npm run test             # Run tests in watch mode"
echo "  npm run test:ui          # Open Vitest UI"
echo "  npm run test:coverage    # Run tests with coverage"
echo "  npm run build            # Build for production"
echo ""
echo "📖 For detailed information:"
echo "  - LINTING.md    # Linting and code quality guide"
echo "  - TESTING.md    # Testing framework guide"
echo ""
echo "🚀 Happy coding!"
