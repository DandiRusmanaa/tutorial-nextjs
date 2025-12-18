#!/bin/bash
# Fix TypeScript cache dan restart dev server

echo "🔧 Clearing Next.js cache..."
rm -rf .next

echo "🔧 Clearing node_modules/.cache..."
rm -rf node_modules/.cache

echo "📦 Reinstalling dependencies..."
pnpm install

echo "✅ Done! Now run: pnpm dev"
echo "The TypeScript errors should disappear after dev server starts."
