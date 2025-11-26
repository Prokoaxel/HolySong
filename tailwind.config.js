/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        holysong: {
          primary: '#1D4ED8', // azul
          accent: '#F97316',  // naranja acordes
          dark: '#020617'
        }
      }
    }
  },
  plugins: []
}
