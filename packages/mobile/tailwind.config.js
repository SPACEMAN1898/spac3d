/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        sidebar: { DEFAULT: '#1a1d21', hover: '#26292d', active: '#1164a3' },
        primary: { DEFAULT: '#1264a3', hover: '#0b4f8a' },
        accent: { green: '#007a5a', yellow: '#f2c744', red: '#e01e5a' },
      },
    },
  },
  plugins: [],
};
