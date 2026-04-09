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
        // Rosa empolvado (color principal del logo)
        blush: {
          50: '#FDF8F8',
          100: '#FAF0F0',
          200: '#F5E1E1',
          300: '#EBCBCB',
          400: '#D4A5A5',
          500: '#C08585',
          600: '#B88383',
          700: '#9A6B6B',
          800: '#7D5555',
          900: '#5E4040',
        },
        // Dorado suave
        gold: {
          50: '#FBF9F5',
          100: '#F5F0E6',
          200: '#E8DCC8',
          300: '#D9C7A8',
          400: '#C9B896',
          500: '#BBA67A',
          600: '#A88D63',
          700: '#8C724F',
          800: '#705A41',
          900: '#524331',
        },
        // Crema elegante
        cream: {
          50: '#FDFCFB',
          100: '#FDFBF9',
          200: '#FAF6F0',
          300: '#F5EDE3',
          400: '#EDE3D4',
          500: '#E8D5B7',
        },
        // Mantener colores existentes por compatibilidad
        border: '#F5E1E1',
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
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
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
