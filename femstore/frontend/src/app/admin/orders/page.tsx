'use client';
import { useState, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Order, OrderStatus, ApiResponse, Pagination } from '@/types';
import api, { decryptOrders } from '@/lib/api';
import toast from 'react-hot-toast';
import { formatWhatsAppLink, storeConfig } from '@/lib/config';

const STATUS_OPTIONS: { value: string; label: string; class: string }[] = [
  { value: '', label: 'Todos', class: '' },
  { value: 'pending',    label: 'Pendiente',  class: 'badge-status-pending' },
  { value: 'confirmed',  label: 'Confirmado', class: 'badge-status-confirmed' },
  { value: 'processing', label: 'Procesando', class: 'badge-status-processing' },
  { value: 'shipped',    label: 'Enviado',    class: 'badge-status-shipped' },
  { value: 'delivered',  label: 'Entregado',  class: 'badge-status-delivered' },
  { value: 'cancelled',  label: 'Cancelado',  class: 'badge-status-cancelled' },
];

const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending:    ['confirmed', 'cancelled'],
  confirmed:  ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped:    ['delivered'],
  delivered:  [],
  cancelled:  [],
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await api.get<ApiResponse<Order[]>>(`/orders?${params.toString()}`);
      setOrders(decryptOrders(data.data || []));
      if (data.pagination) setPagination(data.pagination);
    } catch { toast.error('Error cargando pedidos'); } finally { setIsLoading(false); }
  };

  useEffect(() => { setPage(1); }, [statusFilter]);
  useEffect(() => { fetchOrders(); }, [statusFilter, page]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { data } = await api.patch<ApiResponse<Order>>(`/orders/${orderId}/status`, { status: newStatus });
      toast.success('Estado actualizado ✅');

      // Si la entrega dejó productos en stock 0, ofrecer el aviso por WhatsApp
      // (mismo patrón de link wa.me que la confirmación de pedido del checkout)
      const outOfStock = data.data?.out_of_stock_products;
      if (outOfStock?.length) {
        const message =
          `⚠️ *PRODUCTO AGOTADO - ${storeConfig.storeName}*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `${outOfStock.map((p) => `• ${p.name}`).join('\n')}\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `Revisá el inventario en el panel de administración.`;

        toast(
          (t) => (
            <div className="text-sm">
              <p className="font-semibold mb-1">Se agotó: {outOfStock.map((p) => p.name).join(', ')}</p>
              <a
                href={formatWhatsAppLink(message)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => toast.dismiss(t.id)}
                className="text-green-600 font-medium underline"
              >
                Enviar aviso por WhatsApp →
              </a>
            </div>
          ),
          { duration: 12000 }
        );
      }

      fetchOrders();
    } catch { toast.error('Error al actualizar estado'); }
  };

  const getStatusConfig = (status: string) =>
    STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[1];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-text)]">Pedidos</h1>
        <p className="text-sm text-[var(--color-text-muted)]">{pagination?.total ?? '—'} pedidos en total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              statusFilter === opt.value
                ? 'bg-blush-500 text-white border-blush-500'
                : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-blush-500/50 hover:text-[var(--color-text)]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-[var(--color-surface)] rounded-2xl p-5 animate-pulse h-20" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-16 text-center text-[var(--color-text-muted)]">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No hay pedidos con este filtro</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const statusConf = getStatusConfig(order.status);
            const nextStatuses = NEXT_STATUSES[order.status] || [];
            const isExpanded = expandedOrder === order.id;

            return (
              <div key={order.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
                {/* Header */}
                <div
                  className="p-4 flex items-center gap-4 cursor-pointer hover:bg-[var(--color-surface-alt)] transition-colors"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono font-bold text-blush-600 dark:text-blush-400 text-sm">#{order.order_number}</span>
                      <span className={statusConf.class}>{statusConf.label}</span>
                    </div>
                    <p className="text-sm font-medium text-[var(--color-text)]">{order.customer_name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{order.customer_phone} • {new Date(order.created_at).toLocaleDateString('es-ES')}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-[var(--color-text)]">${Number(order.total).toFixed(2)}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {order.delivery_type === 'delivery' ? 'Domicilio' : 'Retiro'}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-[var(--color-border)] p-4 bg-[var(--color-surface-alt)] space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase mb-2">Productos</p>
                      <div className="space-y-1">
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm text-[var(--color-text)]">
                            <span>{item.product_name} <span className="text-[var(--color-text-muted)]">×{item.quantity}</span></span>
                            <span>${Number(item.subtotal).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      {order.customer_email && (
                        <div><span className="text-[var(--color-text-muted)]">Email: </span><span className="text-[var(--color-text)]">{order.customer_email}</span></div>
                      )}
                      {order.delivery_address && (
                        <div><span className="text-[var(--color-text-muted)]">Dirección: </span><span className="text-[var(--color-text)]">{order.delivery_address}</span></div>
                      )}
                      {order.notes && (
                        <div className="sm:col-span-2"><span className="text-[var(--color-text-muted)]">Notas: </span><span className="text-[var(--color-text)]">{order.notes}</span></div>
                      )}
                    </div>

                    {nextStatuses.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase mb-2">Cambiar estado</p>
                        <div className="flex gap-2 flex-wrap">
                          {nextStatuses.map((st) => {
                            const conf = getStatusConfig(st);
                            return (
                              <button
                                key={st}
                                onClick={() => handleStatusChange(order.id, st)}
                                className="px-4 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-blush-400 hover:text-blush-600 dark:hover:text-blush-400 text-[var(--color-text)] rounded-lg text-sm font-medium transition-all"
                              >
                                → {conf.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-blush-500 text-[var(--color-text)] py-2 px-4 rounded-xl text-sm disabled:opacity-40 transition-colors">
            ← Anterior
          </button>
          <span className="text-sm text-[var(--color-text-muted)]">Página {page} de {pagination.totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages} className="bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-blush-500 text-[var(--color-text)] py-2 px-4 rounded-xl text-sm disabled:opacity-40 transition-colors">
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
