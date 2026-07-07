import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product } from '../types';

export type AddItemResult = 'added' | 'incremented' | 'out_of_stock';
export type UpdateQuantityResult = 'updated' | 'removed' | 'out_of_stock';

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, amount?: number) => AddItemResult;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => UpdateQuantityResult;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product: Product, amount: number = 1): AddItemResult => {
        // `available` descuenta unidades reservadas por pedidos activos;
        // fallback a stock físico para respuestas viejas del backend.
        const stock = Number(product.available ?? product.stock) || 0;
        if (stock <= 0) return 'out_of_stock';

        const items = get().items;
        const existing = items.find((i) => i.product_id === product.id);
        const currentQty = existing?.quantity || 0;
        const requested = currentQty + amount;

        if (requested > stock) return 'out_of_stock';

        if (existing) {
          set({
            items: items.map((i) =>
              i.product_id === product.id
                ? { ...i, quantity: requested, stock }
                : i
            ),
          });
          return 'incremented';
        }

        set({
          items: [
            ...items,
            {
              product_id: product.id,
              product_name: product.name,
              product_price: product.price,
              quantity: amount,
              stock,
              primary_image: product.primary_image,
            },
          ],
        });
        return 'added';
      },

      removeItem: (productId: string) => {
        set({ items: get().items.filter((i) => i.product_id !== productId) });
      },

      updateQuantity: (productId: string, quantity: number): UpdateQuantityResult => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return 'removed';
        }
        const item = get().items.find((i) => i.product_id === productId);
        if (!item) return 'updated';
        if (quantity > item.stock) return 'out_of_stock';
        set({
          items: get().items.map((i) =>
            i.product_id === productId ? { ...i, quantity } : i
          ),
        });
        return 'updated';
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),

      getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      getTotalPrice: () =>
        get().items.reduce((sum, i) => sum + i.product_price * i.quantity, 0),
    }),
    {
      name: 'femstore-cart',
      version: 2,
      partialize: (state) => ({ items: state.items }),
      migrate: (persistedState: unknown, version: number) => {
        // v2 introduce el campo `stock` en CartItem; carritos viejos se descartan
        if (version < 2) return { items: [] };
        return persistedState as { items: CartItem[] };
      },
    }
  )
);
