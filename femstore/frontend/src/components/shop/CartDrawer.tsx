'use client';
import { memo } from 'react';
import { X, ShoppingBag, Trash2, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cart.store';
import { getImageUrl } from '@/lib/api';
import type { CartItem } from '@/types';

interface CartItemRowProps {
  item: CartItem;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove: (id: string) => void;
}

const CartItemRow = memo(function CartItemRow({ item, onIncrement, onDecrement, onRemove }: CartItemRowProps) {
  return (
    <div className="flex gap-3 p-3 bg-[var(--color-surface-alt)] rounded-xl">
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-blush-50 dark:bg-[#243526]">
        <Image
          src={getImageUrl(item.primary_image)}
          alt={item.product_name}
          width={64}
          height={64}
          className="object-cover w-full h-full"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.jpg'; }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.product_name}</p>
        <p className="text-blush-600 dark:text-blush-400 font-bold text-sm">${Number(item.product_price).toFixed(2)}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <button
            onClick={() => onDecrement(item.product_id)}
            className="w-8 h-8 rounded-full bg-white dark:bg-[#243526] border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:border-blush-300 transition-colors"
            aria-label={`Reducir cantidad de ${item.product_name}`}
          >
            <Minus className="w-3 h-3 text-gray-600 dark:text-gray-300" aria-hidden="true" />
          </button>
          <span className="text-sm font-medium w-5 text-center dark:text-white" aria-label={`Cantidad: ${item.quantity}`}>{item.quantity}</span>
          <button
            onClick={() => onIncrement(item.product_id)}
            disabled={item.quantity >= item.stock}
            className="w-8 h-8 rounded-full bg-white dark:bg-[#243526] border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:border-blush-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label={`Aumentar cantidad de ${item.product_name}`}
          >
            <Plus className="w-3 h-3 text-gray-600 dark:text-gray-300" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="flex flex-col items-end justify-between">
        <button
          onClick={() => onRemove(item.product_id)}
          className="p-1 hover:text-red-500 text-gray-400 transition-colors"
          aria-label={`Eliminar ${item.product_name} del carrito`}
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </button>
        <p className="text-sm font-bold text-gray-800 dark:text-white">
          ${(Number(item.product_price) * item.quantity).toFixed(2)}
        </p>
      </div>
    </div>
  );
});

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getTotalPrice, getTotalItems } = useCartStore();
  const total = getTotalPrice();
  const count = getTotalItems();

  const handleIncrement = (productId: string) => {
    const item = items.find((i) => i.product_id === productId);
    if (!item) return;
    const result = updateQuantity(productId, item.quantity + 1);
    if (result === 'out_of_stock') {
      toast.error(`Solo hay ${item.stock} unidades disponibles`);
    }
  };

  const handleDecrement = (productId: string) => {
    const item = items.find((i) => i.product_id === productId);
    if (!item) return;
    updateQuantity(productId, item.quantity - 1);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-[#121A12] z-50 shadow-2xl flex flex-col animate-slide-in-right border-l border-gray-200 dark:border-[#2a352a]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-[#2a352a]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blush-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Mi Carrito</h2>
            {count > 0 && (
              <span className="badge-blush">{count} {count === 1 ? 'item' : 'items'}</span>
            )}
          </div>
          <button onClick={closeCart} className="btn-ghost p-1.5" aria-label="Cerrar carrito">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-16">
              <div className="w-20 h-20 bg-blush-50 dark:bg-blush-900/30 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-blush-300" />
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Tu carrito está vacío</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">¡Agrega productos que te encanten!</p>
              </div>
              <Link href="/shop/products" onClick={closeCart} className="btn-primary text-sm py-2.5">
                Ver productos
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <CartItemRow
                key={item.product_id}
                item={item}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
                onRemove={removeItem}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 dark:border-[#2a352a] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">${total.toFixed(2)}</span>
            </div>
            <Link
              href="/shop/checkout"
              onClick={closeCart}
              className="btn-primary w-full text-center block"
            >
              Finalizar compra
            </Link>
            <button
              onClick={closeCart}
              className="w-full text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Seguir comprando
            </button>
          </div>
        )}
      </div>
    </>
  );
}
