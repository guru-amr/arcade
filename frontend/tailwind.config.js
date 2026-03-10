/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#f5f5f7',
        surface: '#ffffff',
        primary: '#111827',
        accent: '#0f766e',
        muted: '#9ca3af',
      },
      fontFamily: {
        sans: ['system-ui', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

