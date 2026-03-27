import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: '#111827',
        sidebarMuted: '#1f2937',
        contentBg: '#f9fafb',
        brand: '#2563eb'
      }
    }
  },
  plugins: []
} satisfies Config
