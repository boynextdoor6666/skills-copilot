/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['PT Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        'display': ['Montserrat', 'Inter', 'sans-serif'],
      },
      colors: {
        // Профессиональная темная палитра
        dark: {
          50: '#fafafa',
          100: '#e5e5e5',
          200: '#b8b8b8',
          300: '#8a8a8a',
          400: '#6b6b6b',
          500: '#3a3a3a',
          600: '#2a2a2a',
          700: '#1a1a1a',
          800: '#141414',
          900: '#0a0a0a',
        },
        // IMDb желтый
        imdb: {
          DEFAULT: '#f5c518',
          light: '#ffdb4d',
          dark: '#d4a917',
        },
        // Alias for accent to use consistently
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Amber-500 style
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          DEFAULT: '#f5c518', // IMDb default
        },
        // Metacritic зеленый
        meta: {
          DEFAULT: '#00d95f',
          light: '#00ff7f',
          dark: '#00a84a',
        },
        // Акценты для рейтингов
        critics: {
          DEFAULT: '#ff6b6b',
          light: '#ff8787',
          dark: '#e05555',
        },
        audience: {
          DEFAULT: '#4dabf7',
          light: '#74c0fc',
          dark: '#339af0',
        },
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'card': '0 4px 12px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 12px 24px rgba(0, 0, 0, 0.5)',
        'glow-yellow': '0 0 20px rgba(245, 197, 24, 0.3)',
        'glow-green': '0 0 20px rgba(0, 217, 95, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '8px',
        'lg': '12px',
      },
    },
  },
  plugins: [],
}