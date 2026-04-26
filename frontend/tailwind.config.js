/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f4f6fc',
          100: '#e7ecf7',
          200: '#cbd6ed',
          300: '#9eb4e0',
          400: '#6c8bd0',
          500: '#4667bf',
          600: '#344ca2',
          700: '#2a3d83',
          800: '#26346b',
          900: '#232e55',
          950: '#171e36',
        },
        background: '#0B0E14',
        surface: '#151A23',
        surfaceHover: '#1F2633',
        textPrimary: '#F8FAFC',
        textSecondary: '#94A3B8',
        accent: '#3B82F6'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
