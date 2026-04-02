import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeStore {
  isDark: boolean;
  _hasHydrated: boolean;
  toggle: () => void;
  setDark: (dark: boolean) => void;
  setHasHydrated: (state: boolean) => void;
}

// Get initial theme from localStorage directly to avoid flash
const getInitialTheme = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem('theme-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.state?.isDark ?? false;
    }
  } catch {}
  return false;
};

// Apply dark mode class to document immediately (before React loads)
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

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      isDark: getInitialTheme(),
      _hasHydrated: false,
      toggle: () => set((state) => ({ isDark: !state.isDark })),
      setDark: (dark) => set({ isDark: dark }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Apply dark mode class to document
export const applyTheme = (isDark: boolean) => {
  if (typeof window !== 'undefined') {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
};