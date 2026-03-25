'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import { useAuthStore } from '@/store/auth.store';
import { Order, ApiResponse } from '@/types';
import api from '@/lib/api';

const STATUS_CONFIG = {
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

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="page-container max-w-3xl">
          <h1 className="section-title mb-8">Mis pedidos</h1>

          {isLoading ? (
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
              <Package className="w-14 h-14 mx-auto text-emerald-200 mb-4" />
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
                return (
                  <div key={order.id} className="card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-mono font-bold text-emerald-600">#{order.order_number}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(order.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                      <span className={config.color + ' flex items-center gap-1'}>
                        <Icon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </div>

                    <div className="space-y-1 mb-3">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm text-gray-700">
                          <span>{item.product_name} <span className="text-gray-400">x{item.quantity}</span></span>
                          <span>${item.subtotal.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-sm text-gray-500">
                        {order.delivery_type === 'delivery' ? '🚚 Entrega a domicilio' : '🏪 Retiro en tienda'}
                      </span>
                      <span className="font-bold text-gray-900">${order.total.toFixed(2)}</span>
                    </div>
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
