'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Heart } from 'lucide-react';
import { Product } from '@/types';
import { useCartStore } from '@/store/cart.store';
import { useFavoritesStore } from '@/store/favorites.store';
import { getImageUrl } from '@/lib/api';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const isFavorite = useFavoritesStore((s) => s.ids.includes(product.id));
  const toggleFavorite = useFavoritesStore((s) => s.toggle);
  const isOutOfStock = (Number(product.stock) || 0) <= 0;

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nowFav = toggleFavorite(product.id);
    if (nowFav) {
      toast.success(`${product.name} agregado a favoritos ❤️`);
    } else {
      toast(`${product.name} eliminado de favoritos`);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock) {
      toast.error('Producto sin stock');
      return;
    }
    const result = addItem(product);
    if (result === 'out_of_stock') {
      toast.error(`No hay más stock disponible de ${product.name}`);
      return;
    }
    toast.success(`${product.name} agregado al carrito 🛍️`);
  };

  return (
    <Link href={`/shop/products/${product.id}`} className="group card hover:shadow-md transition-all duration-300">
      <div className="relative aspect-[3/4] overflow-hidden" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
        <Image
          src={getImageUrl(product.primary_image)}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { const img = e.target as HTMLImageElement; img.onerror = null; img.src = '/placeholder-product.svg'; }}
        />

        <button
          onClick={handleToggleFavorite}
          className={`absolute top-3 right-3 z-10 w-9 h-9 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${
            isFavorite
              ? 'bg-blush-500 hover:bg-blush-600'
              : 'bg-white/90 dark:bg-gray-800/90 hover:bg-blush-50 dark:hover:bg-blush-900 opacity-70 hover:opacity-100'
          }`}
          aria-label={isFavorite ? `Quitar ${product.name} de favoritos` : `Agregar ${product.name} a favoritos`}
          aria-pressed={isFavorite}
        >
          <Heart
            className={`w-4 h-4 ${isFavorite ? 'text-white fill-white' : 'text-blush-500'}`}
            aria-hidden="true"
          />
        </button>

        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 max-w-[60%]">
          {product.is_on_sale && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Oferta</span>
          )}
          {product.category_name && (
            <span className="badge-blush text-xs truncate inline-block">{product.category_name}</span>
          )}
        </div>

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
            <span className="bg-white text-gray-900 text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-md">
              Agotado
            </span>
          </div>
        )}

        {!isOutOfStock && (
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleAddToCart}
              className="w-full bg-blush-500 hover:bg-blush-600 text-white text-sm font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg"
              aria-label={`Agregar ${product.name} al carrito`}
            >
              <ShoppingBag className="w-4 h-4" aria-hidden="true" />
              Agregar al carrito
            </button>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-2 group-hover:text-blush-600 transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 line-clamp-1">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <div className="flex flex-col">
            {product.is_on_sale && product.sale_price ? (
              <>
                <span className="text-red-500 dark:text-red-400 font-bold text-lg">${Number(product.sale_price).toFixed(2)}</span>
                <span className="text-gray-400 dark:text-gray-500 text-xs line-through">${Number(product.price).toFixed(2)}</span>
              </>
            ) : (
              <span className="text-blush-600 dark:text-blush-400 font-bold text-lg">${Number(product.price).toFixed(2)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
