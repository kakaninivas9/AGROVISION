/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.css"
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          darkest: '#050a14',
          dark: '#0b1121',
          DEFAULT: '#111827',
          light: '#1f2937',
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          glow: 'rgba(16, 185, 129, 0.4)',
        },
        slate: {
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      boxShadow: {
        'glow-green': '0 0 15px rgba(16, 185, 129, 0.5)',
        'glow-green-sm': '0 0 10px rgba(16, 185, 129, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
