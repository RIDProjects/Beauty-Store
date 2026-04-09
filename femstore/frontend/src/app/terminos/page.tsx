import Link from 'next/link';
import Header from '@/components/layout/Header';

export const metadata = {
  title: 'Términos y Condiciones – Vainy Bliss',
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="page-container max-w-3xl">
          <h1 className="section-title mb-2">Términos y Condiciones</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Última actualización: abril 2025</p>

          <div className="card p-8 space-y-6 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">1. Aceptación</h2>
              <p>Al utilizar Vainy Bliss usted acepta estos términos y condiciones. Si no está de acuerdo, le pedimos que no utilice nuestra plataforma.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">2. Pedidos</h2>
              <p>Los pedidos son confirmados una vez que el vendedor los revise y los acepte. Nos reservamos el derecho de cancelar pedidos por falta de stock o inconvenientes en el pago. En ese caso, se le notificará de inmediato.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">3. Precios</h2>
              <p>Los precios mostrados en la tienda incluyen impuestos aplicables. Nos reservamos el derecho de modificar precios sin previo aviso, pero el precio vigente al momento del pedido será respetado.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">4. Entrega</h2>
              <p>Los tiempos de entrega son estimativos. No nos responsabilizamos por demoras causadas por terceros (couriers, condiciones climáticas, etc.).</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">5. Devoluciones</h2>
              <p>Para consultas sobre devoluciones o cambios, contáctenos por WhatsApp dentro de las 48 horas de recibido el producto. Los productos deben estar sin uso y en su embalaje original.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">6. Contacto</h2>
              <p>Para cualquier consulta, comuníquese con nosotros a través de WhatsApp o el número de teléfono disponible en nuestra página de inicio.</p>
            </section>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-blush-600 dark:text-blush-400 text-sm hover:underline">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
