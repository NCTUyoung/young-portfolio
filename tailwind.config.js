/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
  ],
  theme: {
    extend: {
      // 日式字型 — Noto Serif JP 用於引言、漢字裝飾
      fontFamily: {
        jp: ['Noto Serif JP', 'Hiragino Mincho ProN', 'Yu Mincho', 'serif'],
      },
      // 暖調點綴色 — 赤陶 / 琥珀系
      colors: {
        accent: {
          50:  '#fdf8f0',
          100: '#faecd9',
          200: '#f4d5b0',
          300: '#edb87d',
          400: '#e4964a',
          500: '#db7b2e',
          600: '#c46023',
          700: '#a3491f',
          800: '#843b20',
          900: '#6c321d',
          950: '#3a180e',
        },
      },
      // 自訂動畫
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-left': {
          '0%':   { opacity: '0', transform: 'translateX(-40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          '0%':   { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        'breathe': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%':      { opacity: '1', transform: 'scale(1.05)' },
        },
        'draw-line': {
          '0%':   { 'stroke-dashoffset': '100%' },
          '100%': { 'stroke-dashoffset': '0%' },
        },
      },
      animation: {
        'fade-up':        'fade-up 0.7s ease-out both',
        'fade-in':        'fade-in 0.6s ease-out both',
        'slide-in-left':  'slide-in-left 0.7s ease-out both',
        'slide-in-right': 'slide-in-right 0.7s ease-out both',
        'float':          'float 4s ease-in-out infinite',
        'breathe':        'breathe 3s ease-in-out infinite',
      },
    },
  },
  plugins: [
    require('@headlessui/tailwindcss')
  ],
}