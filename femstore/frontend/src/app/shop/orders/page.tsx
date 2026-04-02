'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Clock, CheckCircle, Truck, XCircle, ChevronDown, MessageCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import { useAuthStore } from '@/store/auth.store';
import { Order, OrderStatus, ApiResponse } from '@/types';
import api from '@/lib/api';
import { storeConfig } from '@/lib/config';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending:    { label: 'Pendiente',   color: 'badge-yellow', icon: Clock },
  confirmed:  { label: 'Confirmado',  color: 'badge-blue',   icon: CheckCircle },
  processing: { label: 'Procesando',  color: 'badge-blue',   icon: Package },
  shipped:    { label: 'Enviado',     color: 'badge-blue',   icon: Truck },
  delivered:  { label: 'Entregado',   color: 'badge-green',  icon: CheckCircle },
  cancelled:  { label: 'Cancelado',   color: 'badge-gray',   icon: XCircle },
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
        setOrders(data.data || []);
      } catch { /* ignore */ } finally { setIsLoading(false); }
    };
    fetchOrders();
  }, [user, isInitialized, router]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<ApiResponse<Order[]>>('/orders/my');
      setOrders(data.data || []);
    } catch { /* ignore */ } finally { setIsLoading(false); }
  };

  const getWhatsAppLink = (order: Order) => {
    const message = `Hola! Tengo una consulta sobre mi pedido #${order.order_number}`;
    return `https://wa.me/${storeConfig.vendorWhatsApp}?text=${encodeURIComponent(message)}`;
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="page-container max-w-3xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="section-title mb-0">Mis pedidos</h1>
            <button 
              onClick={handleRefresh}
              disabled={isLoading}
              className="text-sm text-blush-600 hover:text-blush-700 font-medium"
            >
              {isLoading ? 'Actualizando...' : '🔄 Actualizar'}
            </button>
          </div>

          {isLoading && orders.length === 0 ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-14 h-14 mx-auto text-blush-200 mb-4" />
              <p className="text-gray-500 font-medium">Aún no tienes pedidos</p>
              <p className="text-gray-400 text-sm mt-1">¡Explora nuestra tienda y haz tu primer pedido!</p>
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
                    <div 
                      className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-mono font-bold text-blush-600">#{order.order_number}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
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
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <span className="text-sm text-gray-500">
                          {order.items?.length} producto{order.items?.length !== 1 ? 's' : ''} • {' '}
                          {order.delivery_type === 'delivery' ? '🚚 Entrega a domicilio' : '🏪 Retiro en tienda'}
                        </span>
                        <span className="font-bold text-gray-900">${Number(order.total).toFixed(2)}</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-100 p-5 bg-gray-50 space-y-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Productos</p>
                          <div className="space-y-2">
                            {order.items?.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm text-gray-700">
                                <span>{item.product_name} <span className="text-gray-400">x{item.quantity}</span></span>
                                <span>${Number(item.subtotal).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {order.delivery_address && (
                          <div className="text-sm">
                            <span className="text-gray-400">Dirección de entrega: </span>
                            <span className="text-gray-800">{order.delivery_address}</span>
                          </div>
                        )}
                        {order.notes && (
                          <div className="text-sm">
                            <span className="text-gray-400">Notas: </span>
                            <span className="text-gray-800">{order.notes}</span>
                          </div>
                        )}

                        <div className="pt-3 border-t border-gray-200">
                          <a
                            href={getWhatsAppLink(order)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-2.5 bg-blush-500 hover:bg-blush-600 text-white rounded-xl font-medium transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Consultar por WhatsApp
                          </a>
                          <p className="text-xs text-gray-400 text-center mt-2">
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
