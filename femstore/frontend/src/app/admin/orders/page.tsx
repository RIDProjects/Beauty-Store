'use client';
import { useState, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Order, OrderStatus, ApiResponse, Pagination } from '@/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS: { value: string; label: string; class: string }[] = [
  { value: '', label: 'Todos', class: '' },
  { value: 'pending', label: 'Pendiente', class: 'badge-yellow' },
  { value: 'confirmed', label: 'Confirmado', class: 'badge-blue' },
  { value: 'processing', label: 'Procesando', class: 'badge-blue' },
  { value: 'shipped', label: 'Enviado', class: 'badge-blue' },
  { value: 'delivered', label: 'Entregado', class: 'badge-green' },
  { value: 'cancelled', label: 'Cancelado', class: 'badge-gray' },
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
      setOrders(data.data || []);
      if (data.pagination) setPagination(data.pagination);
    } catch { toast.error('Error cargando pedidos'); } finally { setIsLoading(false); }
  };

  useEffect(() => { setPage(1); }, [statusFilter]);
  useEffect(() => { fetchOrders(); }, [statusFilter, page]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      toast.success('Estado actualizado ✅');
      fetchOrders();
    } catch { toast.error('Error al actualizar estado'); }
  };

  const getStatusConfig = (status: string) =>
    STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[1];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Pedidos</h1>
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
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="card p-5 animate-pulse h-20" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-16 text-center text-gray-400">
          <Search className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <p>No hay pedidos con este filtro</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const statusConf = getStatusConfig(order.status);
            const nextStatuses = NEXT_STATUSES[order.status] || [];
            const isExpanded = expandedOrder === order.id;

            return (
              <div key={order.id} className="card overflow-hidden">
                {/* Header */}
                <div
                  className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono font-bold text-emerald-600 text-sm">#{order.order_number}</span>
                      <span className={statusConf.class}>{statusConf.label}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800">{order.customer_name}</p>
                    <p className="text-xs text-gray-400">{order.customer_phone} • {new Date(order.created_at).toLocaleDateString('es-ES')}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900">${Number(order.total).toFixed(2)}</p>
                    <p className="text-xs text-gray-400">
                      {order.delivery_type === 'delivery' ? '🚚 Domicilio' : '🏪 Retiro'}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
                    {/* Items */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Productos</p>
                      <div className="space-y-1">
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm text-gray-700">
                            <span>{item.product_name} <span className="text-gray-400">×{item.quantity}</span></span>
                            <span>${Number(item.subtotal).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Customer info */}
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      {order.customer_email && (
                        <div><span className="text-gray-400">Email: </span><span className="text-gray-800">{order.customer_email}</span></div>
                      )}
                      {order.delivery_address && (
                        <div><span className="text-gray-400">Dirección: </span><span className="text-gray-800">{order.delivery_address}</span></div>
                      )}
                      {order.notes && (
                        <div className="sm:col-span-2"><span className="text-gray-400">Notas: </span><span className="text-gray-800">{order.notes}</span></div>
                      )}
                    </div>

                    {/* Status actions */}
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
                                className="px-4 py-1.5 bg-white border border-gray-200 hover:border-emerald-400 hover:text-emerald-600 text-gray-700 rounded-lg text-sm font-medium transition-all"
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

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">
            ← Anterior
          </button>
          <span className="text-sm text-gray-600">Página {page} de {pagination.totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages} className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
