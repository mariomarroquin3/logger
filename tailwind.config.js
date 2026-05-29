/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: '#0f1117',
          card:    '#1a1d27',
          border:  '#252836',
          muted:   '#2d3145',
        },
        accent: {
          cyan:   '#06b6d4',
          green:  '#10b981',
          red:    '#ef4444',
          yellow: '#f59e0b',
          blue:   '#3b82f6',
          purple: '#8b5cf6',
        },
      },
      keyframes: {
        highlight: {
          '0%':   { backgroundColor: 'rgba(6,182,212,0.25)' },
          '100%': { backgroundColor: 'transparent' },
        },
        'pulse-alarm': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        highlight:    'highlight 2s ease-out forwards',
        'pulse-alarm':'pulse-alarm 1s ease-in-out infinite',
        'fade-in':    'fade-in 0.3s ease-out',
        'slide-in':   'slide-in 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
