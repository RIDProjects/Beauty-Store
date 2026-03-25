'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ShoppingBag, ArrowLeft, Star, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import { Product, ApiResponse } from '@/types';
import { useCartStore } from '@/store/cart.store';
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
  const { addItem, openCart } = useCartStore();

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

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) addItem(product);
    openCart();
    toast.success(`${product.name} agregado al carrito 🛍️`);
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="page-container py-10">
          <div className="animate-pulse grid md:grid-cols-2 gap-10">
            <div className="aspect-square bg-rose-50 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-100 rounded w-3/4" />
              <div className="h-6 bg-rose-50 rounded w-1/4" />
              <div className="h-24 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
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
      <main className="min-h-screen bg-gray-50">
        <div className="page-container py-8">
          {/* Breadcrumb */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-emerald-500 transition-colors mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>

          <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
            {/* Images */}
            <div className="space-y-3">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-emerald-50">
                <Image
                  src={getImageUrl(images[activeImage]?.url)}
                  alt={product.name}
                  fill
                  className="object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.jpg'; }}
                />

                {/* Navigation arrows */}
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

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImage(idx)}
                      className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                        activeImage === idx ? 'border-emerald-500' : 'border-transparent'
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

            {/* Product Info */}
            <div className="space-y-6">
              {product.category_name && (
                <span className="badge-emerald">{product.category_name}</span>
              )}

              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
                <span className="text-sm text-gray-500 ml-1">Producto destacado</span>
              </div>

              <div className="text-4xl font-bold text-emerald-600">
                ${Number(product.price).toFixed(2)}
              </div>

              {product.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Descripción</h3>
                  <p className="text-gray-600 leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="label">Cantidad</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-xl border-2 border-gray-200 hover:border-emerald-300 flex items-center justify-center font-bold text-gray-600 transition-colors"
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-bold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-10 h-10 rounded-xl border-2 border-gray-200 hover:border-emerald-300 flex items-center justify-center font-bold text-gray-600 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={handleAddToCart} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Agregar al carrito
                </button>
                <button className="btn-secondary px-4 py-3">
                  <Heart className="w-5 h-5" />
                </button>
              </div>

              {/* Trust badges */}
              <div className="bg-emerald-50 rounded-xl p-4 space-y-2">
                {['Calidad garantizada en cada producto', 'Entrega a domicilio disponible', 'Atención personalizada'].map((text) => (
                  <div key={text} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-4 h-4 rounded-full bg-emerald-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-700 text-xs">✓</span>
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
