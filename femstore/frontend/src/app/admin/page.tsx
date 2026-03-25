'use client';
import { useState, useEffect } from 'react';
import { ShoppingCart, Package, DollarSign, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Order, ApiResponse } from '@/types';
import api from '@/lib/api';

interface Stats {
  total_orders: number;
  pending_orders: number;
  total_revenue: number;
  today_orders: number;
}

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  pending:    { label: 'Pendiente',  class: 'badge-yellow' },
  confirmed:  { label: 'Confirmado', class: 'badge-blue' },
  processing: { label: 'Procesando', class: 'badge-blue' },
  shipped:    { label: 'Enviado',    class: 'badge-blue' },
  delivered:  { label: 'Entregado',  class: 'badge-green' },
  cancelled:  { label: 'Cancelado',  class: 'badge-gray' },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          api.get<ApiResponse<Stats>>('/orders/stats'),
          api.get<ApiResponse<Order[]>>('/orders?limit=5'),
        ]);
        setStats(statsRes.data.data || null);
        setRecentOrders(ordersRes.data.data || []);
      } catch { /* ignore */ } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = stats ? [
    { label: 'Total Pedidos', value: stats.total_orders, icon: ShoppingCart, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Pendientes', value: stats.pending_orders, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Ingresos Totales', value: `$${Number(stats.total_revenue).toFixed(2)}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Pedidos Hoy', value: stats.today_orders, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen de tu tienda</p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-8 w-8 bg-gray-100 rounded-lg mb-3" />
              <div className="h-6 bg-gray-100 rounded w-1/2 mb-1" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="card p-5">
              <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { href: '/admin/products', label: 'Gestionar productos', icon: Package, color: 'bg-emerald-500' },
          { href: '/admin/orders', label: 'Ver pedidos', icon: ShoppingCart, color: 'bg-sage-600' },
          { href: '/admin/categories', label: 'Categorías', icon: Package, color: 'bg-emerald-600' },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`${action.color} text-white p-4 rounded-2xl flex items-center gap-3 hover:opacity-90 transition-opacity shadow-sm`}
          >
            <action.icon className="w-5 h-5" />
            <span className="font-medium text-sm">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Pedidos recientes</h2>
          <Link href="/admin/orders" className="text-sm text-emerald-500 hover:underline">Ver todos →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-gray-200" />
            <p>Aún no hay pedidos</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentOrders.map((order) => {
              const s = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
              return (
                <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-mono font-semibold text-sm text-emerald-600">#{order.order_number}</p>
                    <p className="text-sm text-gray-700">{order.customer_name}</p>
                    <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('es-ES')}</p>
                  </div>
                  <div className="text-right">
                    <span className={s.class + ' mb-1 block'}>{s.label}</span>
                    <p className="font-bold text-gray-900">${Number(order.total).toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
