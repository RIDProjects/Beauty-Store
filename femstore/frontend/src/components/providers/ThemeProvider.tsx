'use client';

import { useEffect } from 'react';
import { useThemeStore, applyTheme } from '@/store/theme.store';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const isDark = useThemeStore((s) => s.isDark);

  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  return <>{children}</>;
}