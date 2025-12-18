@echo off
REM Fix TypeScript cache dan restart dev server untuk Windows

echo 🔧 Clearing Next.js cache...
rmdir /s /q .next

echo 🔧 Reinstalling dependencies...
pnpm install

echo ✅ Done! Now run: pnpm dev
echo The TypeScript errors should disappear after dev server starts.
pause
