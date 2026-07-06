import Link from 'next/link';
import Header from '@/components/layout/Header';

export const metadata = {
  title: 'Política de Privacidad – Vainy Bliss',
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-transparent py-12">
        <div className="page-container max-w-3xl">
          <h1 className="section-title mb-2">Política de Privacidad</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Última actualización: abril 2025</p>

          <div className="card p-8 space-y-6 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">1. Información que recopilamos</h2>
              <p>Recopilamos información que usted nos proporciona directamente al registrarse o realizar un pedido: nombre, teléfono, dirección de entrega y correo electrónico. No almacenamos datos de tarjetas de crédito.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">2. Uso de la información</h2>
              <p>Utilizamos su información exclusivamente para procesar y comunicar el estado de sus pedidos, y para contactarla mediante WhatsApp o teléfono si es necesario.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">3. Protección de datos</h2>
              <p>Los datos sensibles (teléfono, correo, dirección) se cifran antes de ser enviados a nuestros servidores. Nunca compartimos su información personal con terceros.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">4. Cookies</h2>
              <p>Utilizamos almacenamiento local del navegador para mantener su sesión activa y guardar su carrito de compras. No utilizamos cookies de seguimiento de terceros.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">5. Contacto</h2>
              <p>Para cualquier consulta sobre sus datos personales, puede contactarnos por WhatsApp o mediante nuestra página de inicio.</p>
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
