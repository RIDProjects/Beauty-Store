'use client';
import { useState, useEffect } from 'react';
import { ShoppingCart, Calendar, Clock, AlertCircle, Package, TrendingUp, DollarSign, Truck, Store } from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Order, ApiResponse } from '@/types';
import api from '@/lib/api';

interface Stats {
  total_orders: number;
  pending_orders: number;
  total_revenue: number;
  today_orders: number;
  week_orders: number;
  month_orders: number;
  out_of_stock: number;
  total_products: number;
  total_products_value: number;
  total_units_sold: number;
  total_sold_revenue: number;
  chart_data: { date: string; count: number }[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pendiente',  color: 'badge-status-pending' },
  confirmed:  { label: 'Confirmado', color: 'badge-status-confirmed' },
  processing: { label: 'Procesando', color: 'badge-status-processing' },
  shipped:    { label: 'Enviado',    color: 'badge-status-shipped' },
  delivered:  { label: 'Entregado',  color: 'badge-status-delivered' },
  cancelled:  { label: 'Cancelado',  color: 'badge-status-cancelled' },
};

function formatChartDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 shadow-xl text-sm">
      <p className="text-[var(--color-text-muted)] mb-1">{label}</p>
      <p className="text-[var(--color-text)] font-bold">{payload[0].value} pedidos</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          api.get<ApiResponse<Stats>>('/orders/stats'),
          api.get<ApiResponse<Order[]>>('/orders?limit=8'),
        ]);
        setStats(statsRes.data.data || null);
        setRecentOrders(ordersRes.data.data || []);
      } catch { /* ignore */ } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartData = stats?.chart_data?.map((d) => ({
    ...d,
    label: formatChartDate(d.date),
  })) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Dashboard
        </h1>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">Resumen de tu tienda</p>
      </div>

      {/* ── Stat cards ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 animate-pulse h-28" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Pedidos hoy */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm text-[var(--color-text-muted)]">Pedidos hoy</p>
              <ShoppingCart className="w-5 h-5 text-blush-600 dark:text-blush-400 opacity-60" />
            </div>
            <p className="text-3xl font-bold text-[var(--color-text)]">{stats.today_orders}</p>
          </div>

          {/* Pedidos semana */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm text-[var(--color-text-muted)]">Pedidos esta semana</p>
              <Calendar className="w-5 h-5 text-blush-600 dark:text-blush-400 opacity-60" />
            </div>
            <p className="text-3xl font-bold text-[var(--color-text)]">{stats.week_orders}</p>
          </div>

          {/* Pedidos mes */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm text-[var(--color-text-muted)]">Pedidos este mes</p>
              <Clock className="w-5 h-5 text-blush-600 dark:text-blush-400 opacity-60" />
            </div>
            <p className="text-3xl font-bold text-[var(--color-text)]">{stats.month_orders}</p>
          </div>

          {/* Pendientes */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm text-[var(--color-text-muted)]">Pedidos pendientes</p>
              <AlertCircle className="w-5 h-5 text-amber-400 opacity-60" />
            </div>
            <p className="text-3xl font-bold text-[var(--color-text)]">{stats.pending_orders}</p>
            {stats.pending_orders > 0 && (
              <Link href="/admin/orders?status=pending" className="text-xs text-blush-600 dark:text-blush-400 hover:text-blush-500 dark:hover:text-blush-300 mt-2 block transition-colors">
                Ver pedidos pendientes →
              </Link>
            )}
          </div>

          {/* Sin stock */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm text-[var(--color-text-muted)]">Productos sin stock</p>
              <Package className="w-5 h-5 text-red-400 opacity-60" />
            </div>
            <p className="text-3xl font-bold text-[var(--color-text)]">{stats.out_of_stock}</p>
            {stats.out_of_stock > 0 && (
              <Link href="/admin/products" className="text-xs text-blush-600 dark:text-blush-400 hover:text-blush-500 dark:hover:text-blush-300 mt-2 block transition-colors">
                Ver productos →
              </Link>
            )}
          </div>

          {/* Total productos */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm text-[var(--color-text-muted)]">Total productos</p>
              <Package className="w-5 h-5 text-blush-600 dark:text-blush-400 opacity-60" />
            </div>
            <p className="text-3xl font-bold text-[var(--color-text)]">{stats.total_products}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Valor inventario: ${Number(stats.total_products_value).toFixed(2)}
            </p>
          </div>

          {/* Unidades vendidas */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm text-[var(--color-text-muted)]">Unidades vendidas</p>
              <TrendingUp className="w-5 h-5 text-green-400 opacity-60" />
            </div>
            <p className="text-3xl font-bold text-[var(--color-text)]">{stats.total_units_sold}</p>
          </div>

          {/* Ganancias confirmadas */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm text-[var(--color-text-muted)]">Ganancias confirmadas</p>
              <DollarSign className="w-5 h-5 text-green-400 opacity-60" />
            </div>
            <p className="text-3xl font-bold text-[var(--color-text)]">${Number(stats.total_sold_revenue).toFixed(2)}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Pedidos completados</p>
          </div>
        </div>
      )}

      {/* ── Chart + Table row ── */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Últimos pedidos */}
        <div className="lg:col-span-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <h2 className="font-semibold text-[var(--color-text)]">Últimos Pedidos</h2>
            <Link href="/admin/orders" className="text-xs text-blush-600 dark:text-blush-400 hover:text-blush-500 dark:hover:text-blush-300 transition-colors">
              Ver todos →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="p-10 text-center text-[var(--color-text-muted)]">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay pedidos aún</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-[var(--color-text-muted)] uppercase border-b border-[var(--color-border)]">
                  <th className="text-left px-5 py-3">ID</th>
                  <th className="text-left px-5 py-3 hidden sm:table-cell">Cliente</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Tipo</th>
                  <th className="text-left px-5 py-3 hidden sm:table-cell">Fecha</th>
                  <th className="text-left px-5 py-3">Estado</th>
                  <th className="text-right px-5 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {recentOrders.map((order) => {
                  const s = STATUS_LABELS[order.status] ?? STATUS_LABELS.pending;
                  return (
                    <tr key={order.id} className="hover:bg-[var(--color-surface-alt)] transition-colors">
                      <td className="px-5 py-3">
                        <span className="font-mono text-blush-600 dark:text-blush-400 font-semibold text-xs">
                          #{order.order_number}
                        </span>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <span className="text-[var(--color-text)]">{order.customer_name}</span>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <span className="text-[var(--color-text-muted)]" title={order.delivery_type === 'delivery' ? 'Entrega a domicilio' : 'Retiro en tienda'}>
                          {order.delivery_type === 'delivery'
                            ? <Truck className="w-4 h-4" aria-label="Entrega a domicilio" />
                            : <Store className="w-4 h-4" aria-label="Retiro en tienda" />}
                        </span>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <span className="text-[var(--color-text-muted)] text-xs">
                          {new Date(order.created_at).toLocaleDateString('es-ES')}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={s.color}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-[var(--color-text)] font-semibold">${Number(order.total).toFixed(2)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Chart */}
        <div className="lg:col-span-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
          <h2 className="font-semibold text-[var(--color-text)] mb-4">Pedidos últimos 30 días</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="blushGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={6}
                />
                <YAxis
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  fill="url(#blushGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: 'var(--color-accent)', stroke: 'var(--color-surface)', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-[var(--color-text-muted)] text-sm">
              Sin datos aún
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
