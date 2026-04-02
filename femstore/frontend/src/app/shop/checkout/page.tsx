'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, CheckCircle, MapPin, Phone, User, FileText, Package } from 'lucide-react';
import Header from '@/components/layout/Header';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { CheckoutFormData, ApiResponse, Order } from '@/types';
import api, { decryptOrder } from '@/lib/api';
import { storeConfig } from '@/lib/config';
import toast from 'react-hot-toast';

type Step = 'auth-check' | 'form' | 'success';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { user, isInitialized } = useAuthStore();
  const [step, setStep] = useState<Step>('auth-check');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [form, setForm] = useState<CheckoutFormData>({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    delivery_type: 'pickup',
    delivery_address: '',
    notes: '',
  });

  const total = getTotalPrice();

  useEffect(() => {
    if (step === 'success' && placedOrder) {
      const itemsList = placedOrder.items
        ?.map((item) => `• ${item.product_name} x${item.quantity} = $${Number(item.subtotal).toFixed(2)}`)
        .join('\n');
      
      const whatsAppMessage = `🛍️ *Nuevo Pedido - #${placedOrder.order_number}*\n\n` +
        `👤 *Cliente:* ${placedOrder.customer_name}\n` +
        `📱 *Teléfono:* ${placedOrder.customer_phone}\n\n` +
        `🛒 *Productos:*\n${itemsList}\n\n` +
        `💰 *Total: $${Number(placedOrder.total).toFixed(2)}*\n` +
        `🚚 *Entrega:* ${placedOrder.delivery_type === 'delivery' ? `A domicilio: ${placedOrder.delivery_address}` : 'Retiro en tienda'}`;
      
      const whatsAppLink = `https://wa.me/${storeConfig.vendorWhatsApp}?text=${encodeURIComponent(whatsAppMessage)}`;
      
      window.location.href = whatsAppLink;
    }
  }, [step, placedOrder]);

  useEffect(() => {
    if (!isInitialized) return;
    if (items.length === 0 && step !== 'success') {
      router.push('/shop/products');
      return;
    }
    if (user) {
      setForm((f) => ({
        ...f,
        customer_name: user.name || f.customer_name,
        customer_phone: user.phone || f.customer_phone,
        customer_email: user.email || f.customer_email,
      }));
      setStep('form');
    } else {
      setStep('auth-check');
    }
  }, [isInitialized, user, items.length, router, step]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name || !form.customer_phone) {
      toast.error('Nombre y teléfono son requeridos');
      return;
    }
    if (form.delivery_type === 'delivery' && !form.delivery_address) {
      toast.error('Ingresa tu dirección de entrega');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        customer_email: form.customer_email || undefined,
        delivery_type: form.delivery_type,
        delivery_address: form.delivery_type === 'delivery' ? form.delivery_address : undefined,
        notes: form.notes || undefined,
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      };

      const { data } = await api.post<ApiResponse<Order>>('/orders', payload);
      const decryptedOrder = decryptOrder(data.data!);
      setPlacedOrder(decryptedOrder);
      clearCart();
      localStorage.setItem('justCompletedOrder', 'true');
      setStep('success');
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al procesar el pedido';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'auth-check') {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="card p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-blush-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-blush-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Finalizar compra</h2>
            <p className="text-gray-500 mb-6">Para continuar necesitas iniciar sesión o puedes continuar como invitada</p>
            <div className="space-y-3">
              <Link href="/auth/login?redirect=/shop/checkout" className="btn-primary w-full block text-center">
                Iniciar sesión
              </Link>
              <Link href="/auth/register?redirect=/shop/checkout" className="btn-secondary w-full block text-center">
                Crear cuenta
              </Link>
              <button
                onClick={() => setStep('form')}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
              >
                Continuar como invitada →
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (step === 'success' && placedOrder) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="card p-8 max-w-lg w-full text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Pedido confirmado! 🎉</h2>
            <p className="text-gray-500 mb-4">Redirigiendo a WhatsApp...</p>
            <p className="text-sm text-gray-400">
              Si no se abre WhatsApp, hacé click en el botón de abajo
            </p>
            <div className="mt-6">
              <Link href="/shop/products" className="btn-secondary">
                Volver a la tienda
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="page-container">
          <h1 className="section-title mb-8">Finalizar compra</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="card p-6">
                  <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blush-500" />
                    Información de contacto
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="label">Nombre completo *</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="María López"
                        value={form.customer_name}
                        onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="label">
                        <Phone className="w-3.5 h-3.5 inline mr-1" />
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        className="input"
                        placeholder="+1 234 567 8900"
                        value={form.customer_phone}
                        onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Email <span className="text-gray-400 font-normal">(opcional)</span></label>
                      <input
                        type="email"
                        className="input"
                        placeholder="tu@email.com"
                        value={form.customer_email}
                        onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blush-500" />
                    Método de entrega
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    {[
                      { value: 'pickup', label: '🏪 Retiro en tienda', desc: 'Coordinar punto de entrega' },
                      { value: 'delivery', label: '🚚 Entrega a domicilio', desc: 'Recíbelo en tu dirección' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm({ ...form, delivery_type: opt.value as 'pickup' | 'delivery' })}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          form.delivery_type === opt.value
                            ? 'border-blush-500 bg-blush-50'
                            : 'border-gray-200 hover:border-blush-200'
                        }`}
                      >
                        <p className="font-semibold text-gray-900">{opt.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>

                  {form.delivery_type === 'delivery' && (
                    <div>
                      <label className="label">
                        <MapPin className="w-3.5 h-3.5 inline mr-1" />
                        Dirección de entrega *
                      </label>
                      <textarea
                        className="input resize-none"
                        rows={3}
                        placeholder="Calle, número, colonia, ciudad..."
                        value={form.delivery_address}
                        onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="card p-6">
                  <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blush-500" />
                    Notas adicionales <span className="text-gray-400 font-normal text-sm">(opcional)</span>
                  </h2>
                  <textarea
                    className="input resize-none"
                    rows={3}
                    placeholder="Instrucciones especiales, talla, color preferido..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-primary w-full text-lg py-4">
                  {isSubmitting ? 'Procesando pedido...' : `Confirmar pedido • $${total.toFixed(2)}`}
                </button>
              </form>
            </div>

            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-20">
                <h2 className="font-bold text-gray-900 mb-4">Resumen del pedido</h2>
                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={item.product_id} className="flex justify-between items-start text-sm">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-gray-800 font-medium truncate">{item.product_name}</p>
                        <p className="text-gray-500 text-xs">x{item.quantity} × ${Number(item.product_price).toFixed(2)}</p>
                      </div>
                      <span className="font-medium text-gray-900 flex-shrink-0">
                        ${(Number(item.product_price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-gray-600 text-sm">Envío</span>
                    <span className="text-green-600 text-sm font-medium">A coordinar</span>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-blush-600 text-xl">${total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs text-amber-700">
                    📱 Al confirmar, el vendedor recibirá tu pedido por WhatsApp y te contactará para coordinar el pago y la entrega.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
