'use client';

import { useThemeStore } from '@/store/theme.store';
import { Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const { isDark, toggle } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <button className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-surface-alt)' }} aria-label="Cambiar tema">
        <div className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg transition-colors"
      style={{ backgroundColor: 'var(--color-surface-alt)' }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-border)')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-surface-alt)')}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
      )}
    </button>
  );
}
