import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg: '#1a1d21',
          hover: '#27292d',
          active: '#1164a3',
          text: '#d1d2d3',
          muted: '#8b8d90',
          border: '#27292d',
        },
        brand: {
          50: '#e8f0fb',
          100: '#c3d5f5',
          200: '#9dbaf0',
          300: '#779eea',
          400: '#5a88e5',
          500: '#3d72e1',
          600: '#3166cc',
          700: '#2557b0',
          800: '#1b4894',
          900: '#0c2d6b',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config
