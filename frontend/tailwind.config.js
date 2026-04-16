/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff0f0',
          100: '#ffe0e0',
          500: '#8B0000',
          600: '#6d0000',
          700: '#4f0000',
        },
      },
    },
  },
  plugins: [],
};
