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
                duration: 1000,
                style: {
                  background: '#FAFAF7',
                  color: '#1E3820',
                  borderRadius: '12px',
                  border: '1px solid #D1E2D2',
                  boxShadow: '0 4px 24px rgba(44,74,46,0.12)',
                  fontFamily: '\'DM Sans\', sans-serif',
                  fontSize: '14px',
                },
                success: { iconTheme: { primary: '#3D6B40', secondary: '#FAFAF7' } },
                error: { iconTheme: { primary: '#ef4444', secondary: '#FAFAF7' } },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
