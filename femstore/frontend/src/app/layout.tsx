import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import AuthProvider from '@/components/layout/AuthProvider';
import ThemeProvider from '@/components/providers/ThemeProvider';

export const metadata: Metadata = {
  title: 'Vainy Bliss – Moda & Belleza Natural',
  description: 'Descubre nuestra colección exclusiva de ropa, accesorios y productos de belleza con tonos naturales.',
  keywords: 'moda femenina, ropa mujer, accesorios, belleza, tienda online, estilo natural',
  openGraph: {
    title: 'Vainy Bliss',
    description: 'Tu tienda de moda y belleza natural',
    type: 'website',
  },
  icons: {
    icon: '/logo-vb.svg',
    apple: '/logo-vb.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider>
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
                  border: '1px solid #F5E1E1',
                  boxShadow: '0 4px 24px rgba(192,133,133,0.12)',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                },
                success: { iconTheme: { primary: '#C08585', secondary: '#fff' } },
                error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                dark: {
                  background: '#1f2937',
                  color: '#f9fafb',
                  border: '1px solid #374151',
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
