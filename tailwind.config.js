/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        element: {
          wood: '#4ade80',
          'wood-dark': '#22c55e',
          fire: '#f87171',
          'fire-dark': '#ef4444',
          earth: '#fbbf24',
          'earth-dark': '#d97706',
          metal: '#e5e7eb',
          'metal-dark': '#9ca3af',
          water: '#60a5fa',
          'water-dark': '#3b82f6',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
