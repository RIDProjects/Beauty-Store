import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesStore {
  ids: string[];
  toggle: (productId: string) => boolean; // retorna true si quedó como favorito
  isFavorite: (productId: string) => boolean;
  clear: () => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (productId: string) => {
        const ids = get().ids;
        if (ids.includes(productId)) {
          set({ ids: ids.filter((id) => id !== productId) });
          return false;
        }
        set({ ids: [...ids, productId] });
        return true;
      },
      isFavorite: (productId: string) => get().ids.includes(productId),
      clear: () => set({ ids: [] }),
    }),
    {
      name: 'femstore-favorites',
      version: 1,
    }
  )
);
