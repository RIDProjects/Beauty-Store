'use client';

import { useThemeStore } from '@/store/theme.store';
import { Moon, Sun } from 'lucide-react';

// No mounted guard needed here. The inline script in layout.tsx applies
// the `.dark` class to <html> before React loads, so CSS dark: variants
// already show the correct icon on the first paint. Both icons are always
// in the DOM; visibility is controlled by CSS, not JS state.
// suppressHydrationWarning handles the aria-label SSR/client mismatch
// (server renders isDark=false; client may read isDark=true from localStorage).
export default function ThemeToggle() {
  const { isDark, toggle } = useThemeStore();

  return (
    <button
      onClick={toggle}
      className="theme-toggle"
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      suppressHydrationWarning
    >
      <Sun className="w-5 h-5 text-yellow-400 hidden dark:block" />
      <Moon className="w-5 h-5 block dark:hidden" style={{ color: 'var(--color-accent)' }} />
    </button>
  );
}
