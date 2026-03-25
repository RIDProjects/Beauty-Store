import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import AuthProvider from '@/components/layout/AuthProvider';

export const metadata: Metadata = {
  title: 'Vainy Bliss – Moda & Belleza Natural',
  description: 'Descubre nuestra colección exclusiva de ropa, accesorios y productos de belleza con tonos naturales.',
  keywords: 'moda femenina, ropa mujer, accesorios, belleza, tienda online, estilo natural',
  openGraph: {
    title: 'Vainy Bliss',
    description: 'Tu tienda de moda y belleza natural',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 1000,
              style: {
                background: '#fff',
                color: '#1a1a2e',
                borderRadius: '12px',
                border: '1px solid #a7f3d0',
                boxShadow: '0 4px 24px rgba(16,185,129,0.12)',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
