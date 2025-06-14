/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#05b2ca',
        secondary: '#133f6e',
        success: '#05b494',
        error: '#bd0e0e',
        light: '#fafafa'
      },
      fontFamily: {
        ui: ['Rubik', 'sans-serif'],
        title: ['Luckiest Guy', 'cursive']
      }
    },
  },
  plugins: [],
}
