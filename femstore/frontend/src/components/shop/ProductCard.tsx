'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Heart } from 'lucide-react';
import { Product } from '@/types';
import { useCartStore } from '@/store/cart.store';
import { getImageUrl } from '@/lib/api';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product);
    toast.success(`${product.name} agregado al carrito 🛍️`);
  };

  return (
    <Link href={`/shop/products/${product.id}`} className="group card hover:shadow-md transition-all duration-300">
      <div className="relative aspect-[3/4] bg-emerald-50 overflow-hidden">
        <Image
          src={getImageUrl(product.primary_image)}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.jpg'; }}
        />

        <button
          onClick={(e) => e.preventDefault()}
          className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-emerald-50"
        >
          <Heart className="w-4 h-4 text-emerald-400" />
        </button>

        {product.category_name && (
          <div className="absolute top-3 left-3">
            <span className="badge-emerald text-xs">{product.category_name}</span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleAddToCart}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg"
          >
            <ShoppingBag className="w-4 h-4" />
            Agregar al carrito
          </button>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-emerald-600 transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-gray-500 text-xs mt-1 line-clamp-1">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="text-emerald-600 font-bold text-lg">${Number(product.price).toFixed(2)}</span>
          {product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
            <span className="text-xs text-amber-600 font-medium">¡Últimas {product.stock}!</span>
          )}
        </div>
      </div>
    </Link>
  );
}
