'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Package, ShoppingCart, Tag,
  LogOut, ChevronRight, Menu, Bell,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import LogoSVG from '@/components/layout/Logo';
import api from '@/lib/api';
import { ApiResponse } from '@/types';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Productos', icon: Package },
  { href: '/admin/orders', label: 'Pedidos', icon: ShoppingCart },
  { href: '/admin/categories', label: 'Categorías', icon: Tag },
  { href: '/admin/notifications', label: 'Notificaciones', icon: Bell },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isInitialized } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isInitialized) return;
    if (!user || user.role !== 'admin') {
      router.replace('/auth/login');
    }
  }, [user, isInitialized, router]);

  // Contador de notificaciones sin leer — refresca al navegar y cada 60s.
  // Popup grande al entrar al admin con pendientes, y en cada aumento del contador.
  const prevCountRef = useRef<number | null>(null);
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const fetchCount = async () => {
      try {
        const { data } = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
        const count = data.data?.count ?? 0;
        setUnreadCount(count);

        const onNotificationsPage = window.location.pathname === '/admin/notifications';
        const isNew = prevCountRef.current === null || count > prevCountRef.current;
        if (count > 0 && isNew && !onNotificationsPage) {
          toast(
            (t) => (
              <div className="flex items-start gap-3 py-1">
                <div className="w-10 h-10 rounded-full bg-blush-500/15 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-blush-500" />
                </div>
                <div>
                  <p className="font-semibold text-base">
                    Tenés {count} notificaci{count === 1 ? 'ón' : 'ones'} sin leer
                  </p>
                  <Link
                    href="/admin/notifications"
                    onClick={() => toast.dismiss(t.id)}
                    className="text-sm text-blush-500 font-medium underline"
                  >
                    Ver notificaciones →
                  </Link>
                </div>
              </div>
            ),
            { id: 'unread-notifications', duration: 8000 }
          );
        }
        if (onNotificationsPage) toast.dismiss('unread-notifications');
        prevCountRef.current = count;
      } catch { /* silencioso — el badge no es crítico */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [user, pathname]);

  if (!user || user.role !== 'admin') return null;

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <Link href="/" className="flex flex-col gap-1">
          <LogoSVG className="h-10 w-auto" />
          <p className="text-xs text-[var(--color-text-muted)] pl-1">Panel Admin</p>
        </Link>
      </div>

      {/* Nav */}
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
                  ? 'bg-blush-500 text-white shadow-lg shadow-blush-500/20'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]'
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {item.href === '/admin/notifications' && unreadCount > 0 && (
                <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              {active && item.href !== '/admin/notifications' && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-blush-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-blush-600 dark:text-blush-400 text-sm font-bold">{user.name[0].toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--color-text)] truncate">{user.name}</p>
            <p className="text-xs text-[var(--color-text-muted)] truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[var(--color-bg)]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-[var(--color-bg)] border-r flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-64 bg-[var(--color-bg)] z-50 lg:hidden shadow-2xl">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-[var(--color-bg)] border-b px-6 py-4 flex items-center gap-4" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[var(--color-text-muted)]">Panel de administración</p>
          </div>
          <Link href="/" className="text-xs text-blush-600 dark:text-blush-400 hover:text-blush-500 dark:hover:text-blush-300 transition-colors hidden sm:block">
            Ver tienda →
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-[var(--color-bg)]">
          {children}
        </main>
      </div>
    </div>
  );
}
