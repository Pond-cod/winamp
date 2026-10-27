/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        winamp: {
          dark: '#14171a',
          panel: '#1f2429',
          border: '#374151',
          accent: '#00e5ff',
          neonGreen: '#39ff14',
          amber: '#ffb300'
        }
      },
      fontFamily: {
        mono: ['"Courier New"', 'Courier', 'monospace'],
        retro: ['"Trebuchet MS"', 'Arial', 'sans-serif']
      }
    },
  },
  plugins: [],
}
