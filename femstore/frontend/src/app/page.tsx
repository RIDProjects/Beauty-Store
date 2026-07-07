import Link from 'next/link';
import { Heart, Star, Truck, Shield, Phone, MessageCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import ProductCard from '@/components/shop/ProductCard';
import { Product, Category, ApiResponse } from '@/types';
import LogoSVG from '@/components/layout/Logo';
import { storeConfig, formatWhatsAppLink } from '@/lib/config';

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
        <section className="relative min-h-[600px] flex items-center overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
          <div className="absolute inset-0 opacity-10 pointer-events-none" role="img" aria-label="Logo Vainy Bliss de fondo">
            <img src="/logo.png" alt="" className="w-full h-full object-cover" />
          </div>

          <div className="page-container py-16 relative z-10">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5" style={{ color: 'var(--color-accent)', fill: 'var(--color-accent)' }} />
                <span className="font-medium text-sm" style={{ color: 'var(--color-accent)' }}>Nueva colección disponible</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{ color: 'var(--color-text)' }}>
                Tu estilo,{' '}
                <span className="text-gradient">tu esencia</span>
              </h1>
              <p className="text-xl leading-relaxed mb-8 max-w-lg" style={{ color: 'var(--color-text-muted)' }}>
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
              <div className="flex items-center gap-6 mt-10 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>Calidad garantizada</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
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
          <section className="py-14" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="page-container">
              <h2 className="section-title text-center mb-3">Categorías</h2>
              <p className="text-center mb-10" style={{ color: 'var(--color-text-muted)' }}>Encuentra exactamente lo que buscas</p>
              <div className="flex flex-wrap justify-center gap-3">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/shop/products?category_id=${cat.id}`}
                    className="px-6 py-3 rounded-full font-medium transition-all duration-200 hover:shadow-md"
                    style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)', border: '1px solid var(--color-border)' }}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Featured Products */}
        <section className="py-14 bg-[var(--color-bg)]">
          <div className="page-container">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="section-title mb-2">Productos destacados</h2>
                <p style={{ color: 'var(--color-text-muted)' }}>Lo más amado de nuestra colección</p>
              </div>
              <Link href="/shop/products" className="font-medium text-sm transition-colors" style={{ color: 'var(--color-accent)' }}>
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
              <div className="text-center py-20" style={{ color: 'var(--color-text-muted)' }}>
                <Heart className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-accent-light)' }} />
                <p>Pronto tendremos productos disponibles</p>
              </div>
            )}
          </div>
        </section>

        {/* Features banner */}
        <section className="py-12" style={{ backgroundColor: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
          <div className="page-container">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                { icon: Truck, title: 'Envío a domicilio', desc: 'Recibe tus pedidos cómodamente en casa' },
                { icon: Shield, title: 'Compra segura', desc: 'Tus datos siempre protegidos' },
                { icon: MessageCircle, title: 'Atención al cliente', desc: 'Estamos aquí para ayudarte' },
              ].map((feat) => (
                <div key={feat.title} className="hover-surface flex items-start gap-4 p-4 rounded-2xl transition-colors">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-accent-light)' }}>
                    <feat.icon className="w-6 h-6" style={{ color: 'var(--color-accent)' }} />
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>{feat.title}</h3>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
        <div className="page-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                <Heart className="w-5 h-5" style={{ color: 'var(--color-accent-hover)', fill: 'var(--color-accent-hover)' }} />
                <span className="text-xl font-bold" style={{ fontFamily: 'Cormorant, Georgia, serif', color: 'var(--color-text)' }}>Vainy Bliss</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                Moda y belleza diseñada para mujeres como tú.
              </p>
            </div>

            {/* Atención al cliente */}
            <div className="text-center md:text-left">
              <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Atención al cliente</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href={`tel:${storeConfig.vendorWhatsApp}`}
                    className="flex items-center justify-center md:justify-start gap-2 transition-colors hover:text-[var(--color-accent-hover)]"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <Phone className="w-4 h-4" />
                    <span>{storeConfig.vendorPhoneDisplay}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={formatWhatsAppLink('Hola, tengo una consulta sobre Vainy Bliss')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center md:justify-start gap-2 transition-colors hover:text-[var(--color-accent-hover)]"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Enlaces */}
            <div className="text-center md:text-left">
              <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Tienda</h3>
              <ul className="space-y-2 text-sm">
                {[
                  { href: '/shop/products', label: 'Todos los productos' },
                  { href: '/', label: 'Inicio' },
                  { href: '/politica-de-privacidad', label: 'Política de privacidad' },
                  { href: '/terminos', label: 'Términos y condiciones' },
                ].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition-colors hover:text-[var(--color-accent-hover)]" style={{ color: 'var(--color-text-muted)' }}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t pt-6 text-center" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>© {new Date().getFullYear()} Vainy Bliss. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
