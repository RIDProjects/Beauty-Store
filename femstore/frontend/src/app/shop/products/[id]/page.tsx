'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft, Heart, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import { Product, ApiResponse } from '@/types';
import { useCartStore } from '@/store/cart.store';
import { useFavoritesStore } from '@/store/favorites.store';
import { getImageUrl } from '@/lib/api';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartStore();
  const isFavorite = useFavoritesStore((s) => (product ? s.ids.includes(product.id) : false));
  const toggleFavorite = useFavoritesStore((s) => s.toggle);

  const handleToggleFavorite = () => {
    if (!product) return;
    const nowFav = toggleFavorite(product.id);
    if (nowFav) toast.success(`${product.name} agregado a favoritos ❤️`);
    else toast(`${product.name} eliminado de favoritos`);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get<ApiResponse<Product>>(`/products/${id}`);
        setProduct(data.data || null);
      } catch {
        toast.error('Producto no encontrado');
        router.push('/shop/products');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id, router]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product!.name,
          text: product!.description || `Mirá este producto: ${product!.name}`,
          url,
        });
      } catch {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('¡Link copiado al portapapeles! 🔗');
      } catch {
        toast.error('No se pudo copiar el link');
      }
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    const stock = Number(product.stock) || 0;
    if (stock <= 0) {
      toast.error('Producto sin stock');
      return;
    }
    const result = addItem(product, quantity);
    if (result === 'out_of_stock') {
      toast.error(`Solo hay ${stock} unidades disponibles`);
      return;
    }
    toast.success(`${product.name} agregado al carrito 🛍️`);
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-transparent py-8">
          <div className="page-container max-w-5xl">
            <div className="animate-pulse mb-6 h-4 bg-[var(--color-surface-alt)] rounded w-32" />
            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <div className="aspect-square bg-[var(--color-surface-alt)] rounded-2xl" />
                <div className="flex gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-16 h-16 bg-[var(--color-surface-alt)] rounded-xl" />
                  ))}
                </div>
              </div>
              <div className="space-y-4 animate-pulse">
                <div className="h-3 bg-[var(--color-surface-alt)] rounded w-1/4" />
                <div className="h-8 bg-[var(--color-surface-alt)] rounded w-3/4" />
                <div className="h-7 bg-[var(--color-surface-alt)] rounded w-1/3" />
                <div className="space-y-2 pt-2">
                  <div className="h-3 bg-[var(--color-surface-alt)] rounded" />
                  <div className="h-3 bg-[var(--color-surface-alt)] rounded w-5/6" />
                  <div className="h-3 bg-[var(--color-surface-alt)] rounded w-4/6" />
                </div>
                <div className="h-12 bg-[var(--color-surface-alt)] rounded-xl mt-4" />
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!product) return null;

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ id: 'placeholder', url: '', is_primary: true, sort_order: 0, product_id: product.id }];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-transparent">
          <div className="page-container py-8">
          <Link
            href="/shop/products"
            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blush-500 transition-colors mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>

          <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
            <div className="space-y-3">
              <div className="relative aspect-square rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                <Image
                  src={getImageUrl(images[activeImage]?.url)}
                  alt={product.name}
                  fill
                  className="object-cover"
                  onError={(e) => { const img = e.target as HTMLImageElement; img.onerror = null; img.src = '/placeholder-product.svg'; }}
                />

                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImage((i) => (i - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActiveImage((i) => (i + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImage(idx)}
                      className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                        activeImage === idx ? 'border-blush-500' : 'border-transparent'
                      }`}
                    >
                      <Image
                        src={getImageUrl(img.url)}
                        alt={`${product.name} ${idx + 1}`}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              {product.category_name && (
                <span className="badge-blush">{product.category_name}</span>
              )}

              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{product.name}</h1>


              <div className="flex items-end gap-3">
                {product.is_on_sale && product.sale_price ? (
                  <>
                    <span className="text-4xl font-bold text-red-500 dark:text-red-400">
                      ${Number(product.sale_price).toFixed(2)}
                    </span>
                    <span className="text-xl text-gray-400 line-through mb-1">
                      ${Number(product.price).toFixed(2)}
                    </span>
                    <span className="bg-red-500 text-white text-sm font-bold px-2.5 py-1 rounded-full mb-1">
                      Oferta
                    </span>
                  </>
                ) : (
                  <span className="text-4xl font-bold text-blush-600 dark:text-blush-400">
                    ${Number(product.price).toFixed(2)}
                  </span>
                )}
              </div>

              {product.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Descripción</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{product.description}</p>
                </div>
              )}

              <div>
                <label className="label">Cantidad</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-blush-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 transition-colors"
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-bold text-lg dark:text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min((Number(product.stock) || 0), q + 1))}
                    disabled={quantity >= (Number(product.stock) || 0)}
                    className="w-10 h-10 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-blush-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 transition-colors"
                  >
                    +
                  </button>

                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={(Number(product.stock) || 0) <= 0}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {(Number(product.stock) || 0) <= 0 ? 'Sin stock' : 'Agregar al carrito'}
                </button>
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  aria-pressed={isFavorite}
                  aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                  className={`btn-secondary px-4 py-3 ${isFavorite ? 'bg-blush-50 dark:bg-blush-900/30 border-blush-300' : ''}`}
                >
                  <Heart
                    className={`w-5 h-5 ${isFavorite ? 'text-blush-500 fill-blush-500' : ''}`}
                  />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="btn-secondary px-4 py-3"
                  aria-label="Compartir producto"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                {['Calidad garantizada en cada producto', 'Entrega a domicilio disponible', 'Atención personalizada'].map((text) => (
                  <div key={text} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-accent-light)' }}>
                      <span className="text-blush-700 text-xs">✓</span>
                    </div>
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
