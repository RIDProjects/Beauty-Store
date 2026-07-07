'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Clock, CheckCircle, Truck, XCircle, ChevronDown, MessageCircle, RefreshCw } from 'lucide-react';
import Header from '@/components/layout/Header';
import { useAuthStore } from '@/store/auth.store';
import { Order, OrderStatus, ApiResponse } from '@/types';
import api, { decryptOrders } from '@/lib/api';
import { storeConfig } from '@/lib/config';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending:    { label: 'Pendiente',   color: 'badge-status-pending',    icon: Clock },
  confirmed:  { label: 'Confirmado',  color: 'badge-status-confirmed',  icon: CheckCircle },
  processing: { label: 'Procesando',  color: 'badge-status-processing', icon: Package },
  shipped:    { label: 'Enviado',     color: 'badge-status-shipped',    icon: Truck },
  delivered:  { label: 'Entregado',   color: 'badge-status-delivered',  icon: CheckCircle },
  cancelled:  { label: 'Cancelado',   color: 'badge-status-cancelled',  icon: XCircle },
};

export default function MyOrdersPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) { router.push('/auth/login'); return; }
    const fetchOrders = async () => {
      try {
        const { data } = await api.get<ApiResponse<Order[]>>('/orders/my');
        setOrders(decryptOrders(data.data || []));
      } catch { /* ignore */ } finally { setIsLoading(false); }
    };
    fetchOrders();
  }, [user, isInitialized, router]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<ApiResponse<Order[]>>('/orders/my');
      setOrders(decryptOrders(data.data || []));
    } catch { /* ignore */ } finally { setIsLoading(false); }
  };

  const getWhatsAppLink = (order: Order) => {
    const message = `Hola! Tengo una consulta sobre mi pedido #${order.order_number}`;
    return `https://wa.me/${storeConfig.vendorWhatsApp}?text=${encodeURIComponent(message)}`;
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-transparent py-8">
        <div className="page-container max-w-3xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="section-title mb-0">Mis pedidos</h1>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="text-sm text-blush-600 hover:text-blush-700 font-medium flex items-center gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
              {isLoading ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>

          {isLoading && orders.length === 0 ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="h-4 bg-[var(--color-surface-alt)] rounded w-1/3 mb-3" />
                  <div className="h-3 bg-[var(--color-surface-alt)] rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-14 h-14 mx-auto text-blush-200 mb-4" />
              <p className="text-[var(--color-text-muted)] font-medium">Aún no tienes pedidos</p>
              <p className="text-[var(--color-text-muted)] text-sm mt-1">¡Explora nuestra tienda y haz tu primer pedido!</p>
              <button onClick={() => router.push('/shop/products')} className="btn-primary mt-6">
                Ir a la tienda
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const Icon = config.icon;
                const isExpanded = expandedOrder === order.id;

                return (
                  <div key={order.id} className="card overflow-hidden">
                    <button
                      className="w-full text-left p-5 hover:bg-[var(--color-surface-alt)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-400"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      aria-expanded={isExpanded}
                      aria-label={`Pedido #${order.order_number}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-mono font-bold text-blush-600">#{order.order_number}</p>
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                            {new Date(order.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={config.color + ' flex items-center gap-1'}>
                            <Icon className="w-3 h-3" />
                            {config.label}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-border)]">
                        <span className="text-sm text-[var(--color-text-muted)]">
                          {order.items?.length} producto{order.items?.length !== 1 ? 's' : ''} • {' '}
                          {order.delivery_type === 'delivery' ? 'Entrega a domicilio' : 'Retiro en tienda'}
                        </span>
                        <span className="font-bold text-[var(--color-text)]">${Number(order.total).toFixed(2)}</span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-[var(--color-border)] p-5 bg-[var(--color-surface-alt)] space-y-4">
                        <div>
                          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase mb-2">Productos</p>
                          <div className="space-y-2">
                            {order.items?.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm text-[var(--color-text)]">
                                <span>{item.product_name} <span className="text-[var(--color-text-muted)]">x{item.quantity}</span></span>
                                <span>${Number(item.subtotal).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {order.delivery_address && (
                          <div className="text-sm">
                            <span className="text-[var(--color-text-muted)]">Dirección de entrega: </span>
                            <span className="text-[var(--color-text)]">{order.delivery_address}</span>
                          </div>
                        )}
                        {order.notes && (
                          <div className="text-sm">
                            <span className="text-[var(--color-text-muted)]">Notas: </span>
                            <span className="text-[var(--color-text)]">{order.notes}</span>
                          </div>
                        )}

                        <div className="pt-3 border-t border-[var(--color-border)]">
                          <a
                            href={getWhatsAppLink(order)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-2.5 bg-blush-500 hover:bg-blush-600 text-white rounded-xl font-medium transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Consultar por WhatsApp
                          </a>
                          <p className="text-xs text-[var(--color-text-muted)] text-center mt-2">
                            El vendedor te notificará cuando tu pedido esté listo o en camino
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
