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
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=localStorage.getItem('theme-storage');if(s&&JSON.parse(s).state&&JSON.parse(s).state.isDark){document.documentElement.classList.add('dark');}}catch(e){}`,
          }}
        />
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 2500,
                style: {
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 4px 24px rgba(18,26,18,0.2)',
                  fontFamily: '\'DM Sans\', sans-serif',
                  fontSize: '14px',
                },
                success: { iconTheme: { primary: 'var(--color-accent)', secondary: '#FAFAF7' } },
                error: { iconTheme: { primary: '#ef4444', secondary: '#FAFAF7' } },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
