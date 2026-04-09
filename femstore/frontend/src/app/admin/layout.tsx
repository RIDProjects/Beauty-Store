'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Package, ShoppingCart, Tag,
  LogOut, ChevronRight, Menu, X
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import LogoSVG from '@/components/layout/Logo';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Productos', icon: Package },
  { href: '/admin/orders', label: 'Pedidos', icon: ShoppingCart },
  { href: '/admin/categories', label: 'Categorías', icon: Tag },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isInitialized } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;
    if (!user || user.role !== 'admin') {
      router.replace('/auth/login');
    }
  }, [user, isInitialized, router]);

  if (!user || user.role !== 'admin') return null;

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-blush-100 dark:border-gray-700">
        <Link href="/" className="flex items-center gap-2">
          <LogoSVG className="h-6 w-auto" />
          <div>
            <p className="font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Playfair Display, serif' }}>Vainy Bliss</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Panel Admin</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-blush-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-blush-50 dark:hover:bg-gray-800 hover:text-blush-600'
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {active && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-blush-100 dark:border-gray-700">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-blush-100 dark:bg-blush-900/30 rounded-full flex items-center justify-center">
            <span className="text-blush-600 text-sm font-bold">{user.name[0].toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 shadow-sm">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 z-50 lg:hidden shadow-xl">
            <SidebarContent />
          </aside>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden btn-ghost p-1.5"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-500 dark:text-gray-400">Panel de administración</p>
          </div>
          <Link href="/" className="text-xs text-blush-500 hover:underline hidden sm:block">
            Ver tienda →
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
