'use client';

import { useThemeStore } from '@/store/theme.store';
import { Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const { isDark, toggle } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <button className="theme-toggle" aria-label="Cambiar tema"><div className="w-5 h-5" /></button>;

  return (
    <button
      onClick={toggle}
      className="theme-toggle"
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {isDark
        ? <Sun className="w-5 h-5 text-yellow-400" />
        : <Moon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
      }
    </button>
  );
}
