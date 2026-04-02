'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, User, Menu, X, Heart } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import CartDrawer from '../shop/CartDrawer';
import LogoSVG from './Logo';
import ThemeToggle from '@/components/ui/ThemeToggle';

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/shop/products', label: 'Tienda' },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { getTotalItems, openCart } = useCartStore();
  const totalItems = getTotalItems();

  if (pathname.startsWith('/admin')) return null;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-blush-100 dark:border-gray-800 shadow-sm">
        <div className="page-container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <LogoSVG className="h-8 w-auto" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors duration-200 hover:text-blush-500 ${
                    pathname === link.href ? 'text-blush-500' : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Cart */}
              <button
                onClick={openCart}
                className="btn-ghost p-2 relative"
                aria-label="Carrito"
              >
                <ShoppingBag className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-blush-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-fade-in">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </button>

              {/* User */}
              {user ? (
                <div className="relative group hidden md:block">
                  <button className="flex items-center gap-2 btn-ghost px-3">
                    <div className="w-7 h-7 bg-blush-100 dark:bg-blush-900 rounded-full flex items-center justify-center">
                      <span className="text-blush-600 dark:text-blush-400 text-xs font-bold">{user.name[0].toUpperCase()}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{user.name.split(' ')[0]}</span>
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="p-2">
                      {user.role === 'admin' && (
                        <Link href="/admin" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blush-50 dark:hover:bg-gray-700 hover:text-blush-600 rounded-lg">
                          Panel Admin
                        </Link>
                      )}
                      <Link href="/shop/orders" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blush-50 dark:hover:bg-gray-700 hover:text-blush-600 rounded-lg">
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
                </div>
              ) : (
                <Link href="/auth/login" className="hidden md:flex btn-primary py-2 px-4 text-sm">
                  <User className="w-4 h-4 mr-1" />
                  Ingresar
                </Link>
              )}

              {/* Mobile menu button */}
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
          <div className="md:hidden border-t border-blush-100 dark:border-gray-800 bg-white dark:bg-gray-900 animate-slide-up">
            <div className="page-container py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'bg-blush-50 dark:bg-blush-900/30 text-blush-600 dark:text-blush-400'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 mt-2">
                {user ? (
                  <>
                    <span className="block px-3 py-1 text-xs text-gray-500 dark:text-gray-400">Hola, {user.name}</span>
                    {user.role === 'admin' && (
                      <Link href="/admin" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-200">Panel Admin</Link>
                    )}
                    <Link href="/shop/orders" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-200">Mis Pedidos</Link>
                    <button onClick={logout} className="block w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400">
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <Link href="/auth/login" className="block px-3 py-2 text-sm text-blush-600 dark:text-blush-400 font-medium">
                    Iniciar sesión
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <CartDrawer />
    </>
  );
}
