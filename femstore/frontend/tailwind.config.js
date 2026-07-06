/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Verde bosque — reemplaza el rosa como color principal
        blush: {
          50: '#F2F5F2',
          100: '#E4EDE6',
          200: '#D4DDD5',
          300: '#A8BEA8',
          400: '#7A9E80',
          500: '#556E5C',
          600: '#415548',
          700: '#344038',
          800: '#2A3530',
          900: '#1F2520',
        },
        // Tierra cálida — tonos neutros derivados de la paleta verde/crema
        gold: {
          50: '#F9F8F5',
          100: '#F0EDE6',
          200: '#E0DDD4',
          300: '#C8C4B8',
          400: '#A8A498',
          500: '#857F72',
          600: '#6A6459',
          700: '#524D44',
          800: '#3D3930',
          900: '#28241E',
        },
        // Crema natural — paleta Hilo y Miel
        cream: {
          50: '#FAFAF7',
          100: '#F5F3EC',
          200: '#EDEAE2',
          300: '#F0EDE6',
          400: '#E6E2D8',
          500: '#D6D1C4',
        },
        // Brand tokens Hilo y Miel (acceso directo)
        brand: {
          green: '#415548',
          'green-mid': '#556E5C',
          cream: '#F0EDE6',
          'cream-dark': '#E6E2D8',
          drop: '#2D3A2E',
          surface: '#FAFAF7',
        },
        border: '#D1E2D2',
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        sage: {
          50: '#f7f9f5',
          100: '#e8efe6',
          200: '#d1e0d3',
          300: '#b3cbb6',
          400: '#8fb996',
          500: '#6ba77a',
          600: '#559163',
          700: '#457851',
          800: '#3a6343',
          900: '#305238',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Cormorant', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.25s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
