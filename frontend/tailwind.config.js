/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          primary: '#059669',
        },
        teal: {
          brand: '#0d7377',
        },
        'dark-green': '#0f766e',
        coral: '#d95f59',
        amber: {
          brand: '#f1ad28',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
