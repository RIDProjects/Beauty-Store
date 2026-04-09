'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, CheckCircle, MapPin, Phone, User, FileText, Package, Plus, Trash2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { CheckoutFormData, ApiResponse, Order, CustomerAddress } from '@/types';
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
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);
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
      // Load saved addresses
      api.get<ApiResponse<CustomerAddress[]>>('/addresses')
        .then(({ data }) => {
          const addrs = data.data || [];
          setSavedAddresses(addrs);
          const def = addrs.find((a) => a.is_default);
          if (def) {
            setSelectedAddressId(def.id);
            setForm((f) => ({ ...f, delivery_address: def.address }));
          }
        })
        .catch(() => {});
      setStep('form');
    } else {
      setStep('auth-check');
    }
  }, [isInitialized, user, items.length, router, step]);

  const handleSaveNewAddress = async () => {
    if (!form.delivery_address?.trim()) {
      toast.error('Ingresá la dirección primero');
      return;
    }
    setSavingAddress(true);
    try {
      const { data } = await api.post<ApiResponse<CustomerAddress>>('/addresses', {
        label: newAddressLabel.trim() || 'Mi dirección',
        address: form.delivery_address.trim(),
        is_default: savedAddresses.length === 0,
      });
      const newAddr = data.data!;
      setSavedAddresses((prev) => [...prev, newAddr]);
      setSelectedAddressId(newAddr.id);
      setShowNewAddressForm(false);
      setNewAddressLabel('');
      toast.success('Dirección guardada');
    } catch {
      toast.error('No se pudo guardar la dirección');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await api.delete(`/addresses/${id}`);
      setSavedAddresses((prev) => prev.filter((a) => a.id !== id));
      if (selectedAddressId === id) {
        setSelectedAddressId(null);
        setForm((f) => ({ ...f, delivery_address: '' }));
      }
    } catch {
      toast.error('Error al eliminar dirección');
    }
  };

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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
          <div className="card p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-blush-100 dark:bg-blush-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-blush-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Finalizar compra</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Para continuar necesitas iniciar sesión o puedes continuar como invitada</p>
            <div className="space-y-3">
              <Link href="/auth/login?redirect=/shop/checkout" className="btn-primary w-full block text-center">
                Iniciar sesión
              </Link>
              <Link href="/auth/register?redirect=/shop/checkout" className="btn-secondary w-full block text-center">
                Crear cuenta
              </Link>
              <button
                onClick={() => setStep('form')}
                className="btn-secondary w-full"
              >
                Continuar como invitada
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

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

    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
          <div className="card p-8 max-w-lg w-full">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 text-center">
              #{placedOrder.order_number}
            </h2>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-6">¡Pedido confirmado! 🎉</p>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Resumen del pedido</h3>
              <div className="space-y-2">
                {placedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>{item.product_name} x{item.quantity}</span>
                    <span>${Number(item.subtotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 mt-3 pt-3 flex justify-between font-bold text-gray-900 dark:text-white">
                <span>Total</span>
                <span className="text-blush-600">${Number(placedOrder.total).toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 mb-4 flex gap-2 items-start">
              <span className="text-amber-500 text-lg leading-none mt-0.5">⚠️</span>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Paso importante:</strong> tocá el botón de abajo para enviarnos tu pedido por WhatsApp. Sin ese mensaje no podremos procesarlo.
              </p>
            </div>

            <div className="space-y-3">
              <a
                href={whatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full block text-center text-base py-4"
              >
                📲 Enviar pedido por WhatsApp
              </a>
              <Link href="/shop/orders" className="btn-secondary w-full block text-center">
                Ver mis pedidos
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
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="page-container">
          <h1 className="section-title mb-8">Finalizar compra</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
                <div className="card p-6">
                  <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blush-500" />
                    Información de contacto
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label htmlFor="customer_name" className="label">Nombre completo *</label>
                      <input
                        id="customer_name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        className="input"
                        placeholder="María López"
                        value={form.customer_name}
                        onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="customer_phone" className="label">
                        <Phone className="w-3.5 h-3.5 inline mr-1" />
                        Teléfono *
                      </label>
                      <input
                        id="customer_phone"
                        name="tel"
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        className="input"
                        placeholder="+1 234 567 8900"
                        value={form.customer_phone}
                        onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="customer_email" className="label">Email <span className="text-gray-400 dark:text-gray-500 font-normal">(opcional)</span></label>
                      <input
                        id="customer_email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        className="input"
                        placeholder="tu@email.com"
                        value={form.customer_email}
                        onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
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
                            ? 'border-blush-500 bg-blush-50 dark:bg-blush-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blush-200'
                        }`}
                      >
                        <p className="font-semibold text-gray-900 dark:text-white">{opt.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>

                  {form.delivery_type === 'delivery' && (
                    <div className="space-y-3">
                      <label className="label">
                        <MapPin className="w-3.5 h-3.5 inline mr-1" />
                        Dirección de entrega *
                      </label>

                      {/* Saved addresses (only for logged-in users) */}
                      {user && savedAddresses.length > 0 && (
                        <div className="space-y-2">
                          {savedAddresses.map((addr) => (
                            <div
                              key={addr.id}
                              className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                selectedAddressId === addr.id
                                  ? 'border-blush-500 bg-blush-50 dark:bg-blush-900/20'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-blush-200'
                              }`}
                              onClick={() => {
                                setSelectedAddressId(addr.id);
                                setForm((f) => ({ ...f, delivery_address: addr.address }));
                              }}
                            >
                              <div className="w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center border-blush-400">
                                {selectedAddressId === addr.id && (
                                  <div className="w-2 h-2 rounded-full bg-blush-500" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{addr.label}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{addr.address}</p>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr.id); }}
                                className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors flex-shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* New address area */}
                      {(!user || showNewAddressForm || savedAddresses.length === 0) ? (
                        <div className="space-y-2">
                          <textarea
                            id="delivery_address"
                            name="street-address"
                            autoComplete="street-address"
                            className="input resize-none"
                            rows={3}
                            placeholder="Calle, número, colonia, ciudad..."
                            value={form.delivery_address}
                            onChange={(e) => {
                              setSelectedAddressId(null);
                              setForm({ ...form, delivery_address: e.target.value });
                            }}
                            required
                          />
                          {user && (
                            <div className="flex gap-2 items-center">
                              <input
                                type="text"
                                className="input flex-1 text-sm py-2"
                                placeholder='Etiqueta (ej: "Casa", "Trabajo")'
                                value={newAddressLabel}
                                onChange={(e) => setNewAddressLabel(e.target.value)}
                              />
                              <button
                                type="button"
                                onClick={handleSaveNewAddress}
                                disabled={savingAddress}
                                className="btn-secondary text-sm py-2 whitespace-nowrap"
                              >
                                {savingAddress ? 'Guardando...' : 'Guardar'}
                              </button>
                              {savedAddresses.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setShowNewAddressForm(false)}
                                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm"
                                >
                                  Cancelar
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setShowNewAddressForm(true); setSelectedAddressId(null); setForm((f) => ({ ...f, delivery_address: '' })); }}
                          className="flex items-center gap-2 text-sm text-blush-600 hover:text-blush-700 font-medium transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Agregar nueva dirección
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="card p-6">
                  <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blush-500" />
                    Notas adicionales <span className="text-gray-400 dark:text-gray-500 font-normal text-sm">(opcional)</span>
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
                <h2 className="font-bold text-gray-900 dark:text-white mb-4">Resumen del pedido</h2>
                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={item.product_id} className="flex justify-between items-start text-sm">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-gray-800 dark:text-gray-200 font-medium truncate">{item.product_name}</p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">x{item.quantity} × ${Number(item.product_price).toFixed(2)}</p>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100 flex-shrink-0">
                        ${(Number(item.product_price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="font-medium">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Envío</span>
                    <span className="text-green-600 dark:text-green-400 text-sm font-medium">A coordinar</span>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <span className="font-bold text-gray-900 dark:text-white">Total</span>
                    <span className="font-bold text-blush-600 text-xl">${total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-3">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
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
