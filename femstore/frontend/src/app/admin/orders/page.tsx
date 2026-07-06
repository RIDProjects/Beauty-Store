'use client';
import { useState, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Order, OrderStatus, ApiResponse, Pagination } from '@/types';
import api, { decryptOrders } from '@/lib/api';
import toast from 'react-hot-toast';
import { formatWhatsAppLink, storeConfig } from '@/lib/config';

const STATUS_OPTIONS: { value: string; label: string; class: string }[] = [
  { value: '', label: 'Todos', class: '' },
  { value: 'pending',    label: 'Pendiente',  class: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-amber-400 bg-amber-400/10' },
  { value: 'confirmed',  label: 'Confirmado', class: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-blue-400 bg-blue-400/10' },
  { value: 'processing', label: 'Procesando', class: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-blue-400 bg-blue-400/10' },
  { value: 'shipped',    label: 'Enviado',    class: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-purple-400 bg-purple-400/10' },
  { value: 'delivered',  label: 'Entregado',  class: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-green-400 bg-green-400/10' },
  { value: 'cancelled',  label: 'Cancelado',  class: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-gray-500 bg-gray-500/10' },
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
              <p className="font-semibold mb-1">⚠️ Se agotó: {outOfStock.map((p) => p.name).join(', ')}</p>
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
        <h1 className="text-xl font-bold text-white">Pedidos</h1>
        <p className="text-sm text-gray-500">{pagination?.total ?? '—'} pedidos en total</p>
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
                : 'bg-gray-800/60 text-gray-400 border-gray-700 hover:border-blush-500/50 hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-gray-800/60 rounded-2xl p-5 animate-pulse h-20" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-16 text-center text-gray-600">
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
              <div key={order.id} className="bg-gray-800/60 border border-gray-700/50 rounded-2xl overflow-hidden">
                {/* Header */}
                <div
                  className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-700/30 transition-colors"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono font-bold text-blush-400 text-sm">#{order.order_number}</span>
                      <span className={statusConf.class}>{statusConf.label}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-200">{order.customer_name}</p>
                    <p className="text-xs text-gray-500">{order.customer_phone} • {new Date(order.created_at).toLocaleDateString('es-ES')}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-white">${Number(order.total).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      {order.delivery_type === 'delivery' ? '🚚 Domicilio' : '🏪 Retiro'}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-700/50 p-4 bg-gray-900/50 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Productos</p>
                      <div className="space-y-1">
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm text-gray-300">
                            <span>{item.product_name} <span className="text-gray-500">×{item.quantity}</span></span>
                            <span>${Number(item.subtotal).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      {order.customer_email && (
                        <div><span className="text-gray-500">Email: </span><span className="text-gray-200">{order.customer_email}</span></div>
                      )}
                      {order.delivery_address && (
                        <div><span className="text-gray-500">Dirección: </span><span className="text-gray-200">{order.delivery_address}</span></div>
                      )}
                      {order.notes && (
                        <div className="sm:col-span-2"><span className="text-gray-500">Notas: </span><span className="text-gray-200">{order.notes}</span></div>
                      )}
                    </div>

                    {nextStatuses.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Cambiar estado</p>
                        <div className="flex gap-2 flex-wrap">
                          {nextStatuses.map((st) => {
                            const conf = getStatusConfig(st);
                            return (
                              <button
                                key={st}
                                onClick={() => handleStatusChange(order.id, st)}
                                className="px-4 py-1.5 bg-gray-800 border border-gray-600 hover:border-blush-400 hover:text-blush-400 text-gray-300 rounded-lg text-sm font-medium transition-all"
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
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="bg-gray-800 border border-gray-700 hover:border-blush-500 text-gray-300 py-2 px-4 rounded-xl text-sm disabled:opacity-40 transition-colors">
            ← Anterior
          </button>
          <span className="text-sm text-gray-500">Página {page} de {pagination.totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages} className="bg-gray-800 border border-gray-700 hover:border-blush-500 text-gray-300 py-2 px-4 rounded-xl text-sm disabled:opacity-40 transition-colors">
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
