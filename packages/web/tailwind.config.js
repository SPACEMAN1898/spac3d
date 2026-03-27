/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: '#1a1d21',
          hover: '#26292d',
          active: '#1164a3',
          text: '#cfd3d7',
          'text-muted': '#9ba3ad',
        },
        primary: {
          DEFAULT: '#1264a3',
          hover: '#0b4f8a',
          light: '#e8f5fe',
        },
        accent: {
          green: '#007a5a',
          yellow: '#f2c744',
          red: '#e01e5a',
        },
      },
    },
  },
  plugins: [],
};
