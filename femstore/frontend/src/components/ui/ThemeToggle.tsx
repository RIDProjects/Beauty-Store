'use client';

import { useThemeStore } from '@/store/theme.store';
import { Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const { isDark, toggle } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  // Solo mostrar después de hydrate para evitar hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Renderizar un placeholder invisible durante SSR/hydration
    return (
      <button
        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800"
        aria-label="Cambiar tema"
      >
        <div className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-yellow-500" />
      ) : (
        <Moon className="w-5 h-5 text-gray-600" />
      )}
    </button>
  );
}