'use client';

import { useEffect } from 'react';
import { useThemeStore, applyTheme } from '@/store/theme.store';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const isDark = useThemeStore((s) => s.isDark);
  const hasHydrated = useThemeStore((s) => s._hasHydrated);

  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  // Show children only after hydration to prevent flash
  if (!hasHydrated) {
    // Aplicar tema inicial inmediatamente para evitar flash
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme-storage');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.state?.isDark) {
            document.documentElement.classList.add('dark');
          }
        } catch {}
      }
    }
    return <div className="hidden">{children}</div>;
  }

  return <>{children}</>;
}