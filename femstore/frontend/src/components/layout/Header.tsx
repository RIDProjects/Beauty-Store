'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingBag, User, Menu, X, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import CartDrawer from '../shop/CartDrawer';
import LogoSVG from './Logo';
import ThemeToggle from '@/components/ui/ThemeToggle';
import api from '@/lib/api';
import { Category, ApiResponse } from '@/types';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  const { user, logout, isInitialized } = useAuthStore();
  const { getTotalItems, openCart } = useCartStore();
  const totalItems = getTotalItems();

  useEffect(() => {
    api.get<ApiResponse<Category[]>>('/categories')
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => {});
  }, []);

  if (pathname.startsWith('/admin')) return null;

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-sm shadow-sm" style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="page-container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <LogoSVG className="h-8 w-auto" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className={`text-sm font-medium transition-colors duration-200 ${
                  pathname === '/' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-accent)]'
                }`}
              >
                Inicio
              </Link>
              <Link
                href="/shop/products"
                className={`text-sm font-medium transition-colors duration-200 ${
                  pathname === '/shop/products' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-accent)]'
                }`}
              >
                Tienda
              </Link>
              {/* Categories dropdown */}
              {categories.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setCategoriesOpen((o) => !o)}
                    onBlur={() => setTimeout(() => setCategoriesOpen(false), 150)}
                    className={`flex items-center gap-1 text-sm font-medium transition-colors duration-200 ${
                      categoriesOpen ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-accent)]'
                    }`}
                  >
                    Categorías
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {categoriesOpen && (
                    <div className="absolute left-0 top-full mt-2 w-52 rounded-xl shadow-lg z-50 py-1.5" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                      <button
                        onClick={() => { router.push('/shop/products'); setCategoriesOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm transition-colors hover:text-[var(--color-accent)]"
                        style={{ color: 'var(--color-text)' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-accent-light)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        Todos los productos
                      </button>
                      <div style={{ borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => { router.push(`/shop/products?category_id=${cat.id}`); setCategoriesOpen(false); }}
                          className="w-full text-left px-4 py-2 text-sm transition-colors hover:text-[var(--color-accent)]"
                          style={{ color: 'var(--color-text)' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-accent-light)')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />

              <button
                onClick={openCart}
                className="btn-ghost p-2 relative"
                aria-label="Carrito"
              >
                <ShoppingBag className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                {mounted && totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 text-white text-xs rounded-full flex items-center justify-center font-bold animate-fade-in" style={{ backgroundColor: 'var(--color-accent)' }}>
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </button>

              {isInitialized && (
                user ? (
                  <div className="relative hidden md:block">
                    <button
                      onClick={() => setUserMenuOpen((o) => !o)}
                      onBlur={() => setTimeout(() => setUserMenuOpen(false), 150)}
                      className="flex items-center gap-2 btn-ghost px-3"
                      aria-expanded={userMenuOpen}
                    >
                      <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent-light)' }}>
                        <span className="text-xs font-bold" style={{ color: 'var(--color-accent)' }}>{user.name[0].toUpperCase()}</span>
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{user.name.split(' ')[0]}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform`} style={{ color: 'var(--color-text-muted)' }} />
                    </button>
                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-48 rounded-xl shadow-lg z-50" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                        <div className="p-2">
                          {user.role === 'admin' && (
                            <Link href="/admin" className="block px-3 py-2 text-sm rounded-lg transition-colors hover:text-[var(--color-accent)]" style={{ color: 'var(--color-text)' }}>
                              Panel Admin
                            </Link>
                          )}
                          <Link href="/shop/orders" className="block px-3 py-2 text-sm rounded-lg transition-colors hover:text-[var(--color-accent)]" style={{ color: 'var(--color-text)' }}>
                            Mis Pedidos
                          </Link>
                          <button
                            onClick={logout}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          >
                            Cerrar sesión
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href="/auth/login" className="btn-primary py-2 px-4 text-sm flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Ingresar</span>
                  </Link>
                )
              )}

              <button
                className="md:hidden btn-ghost p-2"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden animate-slide-up" style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <div className="page-container py-4 space-y-1">
              {[{ href: '/', label: 'Inicio' }, { href: '/shop/products', label: 'Tienda' }].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === link.href ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
                  }`}
                  style={pathname === link.href ? { backgroundColor: 'var(--color-accent-light)' } : {}}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {categories.length > 0 && (
                <>
                  <p className="px-3 pt-2 text-xs uppercase font-semibold" style={{ color: 'var(--color-text-muted)' }}>Categorías</p>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { router.push(`/shop/products?category_id=${cat.id}`); setMobileOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:text-[var(--color-accent)]"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {cat.name}
                    </button>
                  ))}
                </>
              )}
              <div className="pt-2 mt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                {isInitialized && (user ? (
                  <>
                    <span className="block px-3 py-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>Hola, {user.name}</span>
                    {user.role === 'admin' && (
                      <Link href="/admin" className="block px-3 py-2 text-sm" style={{ color: 'var(--color-text)' }}>Panel Admin</Link>
                    )}
                    <Link href="/shop/orders" className="block px-3 py-2 text-sm" style={{ color: 'var(--color-text)' }}>Mis Pedidos</Link>
                    <button onClick={logout} className="block w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400">
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <Link href="/auth/login" className="block px-3 py-2 text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
                    Iniciar sesión
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      <CartDrawer />
    </>
  );
}
