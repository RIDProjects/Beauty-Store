import Link from 'next/link';
import { Heart, Star, Truck, Shield, RotateCcw } from 'lucide-react';
import Header from '@/components/layout/Header';
import ProductCard from '@/components/shop/ProductCard';
import { Product, Category, ApiResponse } from '@/types';
import LogoSVG from '@/components/layout/Logo';

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    // Obtener productos más vendidos (ordered by sales)
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products?limit=8&is_active=true&sort=sales`, {
      next: { revalidate: 60 },
    });
    const data: ApiResponse<Product[]> = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, {
      next: { revalidate: 300 },
    });
    const data: ApiResponse<Category[]> = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [products, categories] = await Promise.all([getFeaturedProducts(), getCategories()]);

  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative min-h-[600px] flex items-center bg-gradient-to-br from-blush-50 via-cream-50 to-blush-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
          {/* Background con imagen del logo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none" role="img" aria-label="Logo Vainy Bliss de fondo">
            <img 
              src="/logo.png" 
              alt="Logo Vainy Bliss"
              className="max-w-4xl w-full h-full object-contain"
            />
          </div>
          
          <div className="page-container py-16 relative z-10">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-blush-500 fill-blush-500" />
                <span className="text-blush-600 dark:text-blush-400 font-medium text-sm">Nueva colección disponible</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
                Tu estilo,{' '}
                <span className="text-gradient">tu esencia</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-xl leading-relaxed mb-8 max-w-lg">
                Descubre nuestra colección exclusiva de moda y belleza diseñada especialmente para mujeres como tú.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/shop/products" className="btn-primary text-center">
                  Explorar colección
                </Link>
                <Link href="/shop/products?category=belleza" className="btn-secondary text-center">
                  Ver novedades
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-10 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>Calidad garantizada</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-blush-400" />
                  <span>Entrega rápida</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span>Compra segura</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="py-14 bg-white dark:bg-gray-900">
            <div className="page-container">
              <h2 className="section-title text-center mb-3">Categorías</h2>
              <p className="text-center text-gray-500 dark:text-gray-400 mb-10">Encuentra exactamente lo que buscas</p>
              <div className="flex flex-wrap justify-center gap-3">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/shop/products?category_id=${cat.id}`}
                    className="px-6 py-3 bg-blush-50 dark:bg-blush-900/30 hover:bg-blush-500 text-blush-700 dark:text-blush-300 hover:text-white rounded-full font-medium transition-all duration-200 border border-blush-200 dark:border-blush-700 hover:border-blush-500 hover:shadow-md"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Featured Products */}
        <section className="py-14 bg-gray-50 dark:bg-gray-800">
          <div className="page-container">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="section-title mb-2">Productos destacados</h2>
                <p className="text-gray-500 dark:text-gray-400">Lo más amado de nuestra colección</p>
              </div>
              <Link href="/shop/products" className="text-blush-500 hover:text-blush-700 font-medium text-sm transition-colors">
                Ver todos →
              </Link>
            </div>
            {products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400 dark:text-gray-500">
                <Heart className="w-12 h-12 mx-auto mb-3 text-blush-200" />
                <p>Pronto tendremos productos disponibles</p>
              </div>
            )}
          </div>
        </section>

        {/* Features banner */}
        <section className="py-12 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          <div className="page-container">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                { icon: Truck, title: 'Envío a domicilio', desc: 'Recibe tus pedidos cómodamente en casa' },
                { icon: Shield, title: 'Compra segura', desc: 'Tus datos siempre protegidos' },
                { icon: RotateCcw, title: 'Atención al cliente', desc: 'Estamos aquí para ayudarte' },
              ].map((feat) => (
                <div key={feat.title} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-blush-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="w-12 h-12 bg-blush-100 dark:bg-blush-900 rounded-xl flex items-center justify-center flex-shrink-0">
                    <feat.icon className="w-6 h-6 text-blush-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{feat.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-10">
        <div className="page-container text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Heart className="w-5 h-5 text-blush-400 fill-blush-400" />
            <span className="text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>Vainy Bliss</span>
          </div>
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Vainy Bliss. Todos los derechos reservados.</p>
        </div>
      </footer>
    </>
  );
}
