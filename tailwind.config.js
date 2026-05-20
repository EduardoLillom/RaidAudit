/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // WoW Class Colors
        wow: {
          paladin: '#f58cba',
          mage: '#3fc7eb',
          warrior: '#c69b6d',
          rogue: '#fff468',
          priest: '#ffffff',
          druid: '#ff7d0a',
          hunter: '#abd473',
          shaman: '#0070de',
          warlock: '#9482c9',
          deathknight: '#c41f3b',
        }
      }
    },
  },
  plugins: [],
}
