/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  // Nuxt 4 把 app 程式碼全搬到 app/，Tailwind content 路徑必須跟著改，
  // 否則掃不到任何 class → 整站 utility 不會被編入 CSS（No utility classes detected）。
  content: [
    "./app/components/**/*.{js,vue,ts}",
    "./app/layouts/**/*.vue",
    "./app/pages/**/*.vue",
    "./app/plugins/**/*.{js,ts}",
    "./app/composables/**/*.{js,ts}",
    "./app/utils/**/*.{js,ts}",
    "./app/app.vue",
  ],
  theme: {
    extend: {
      // 全站 sans：Outfit（拉丁）→ Noto Sans TC（繁中）；日式裝飾用 font-jp
      fontFamily: {
        sans: [
          'Outfit',
          'Noto Sans TC',
          'PingFang TC',
          'Microsoft JhengHei',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
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
        // Semantic tokens — CSS var 驅動，.dark class 自動切換，無需寫 dark: variant
        bg:           'var(--bg)',
        'bg-sub':     'var(--bg-sub)',
        surface:      'var(--surface)',
        'surface-2':  'var(--surface-2)',
        'fg-1':       'var(--fg-1)',
        'fg-2':       'var(--fg-2)',
        'fg-3':       'var(--fg-3)',
        'fg-muted':   'var(--fg-muted)',
        'fg-faint':   'var(--fg-faint)',
        'border-ds':  'var(--border)',
        'border-soft':'var(--border-soft)',
        'accent-ds':  'var(--accent)',
        'accent-ink': 'var(--accent-ink)',
        'accent-soft-ds': 'var(--accent-soft)',
      },
      // 日式字距 — Tailwind 預設沒有的 JP 細分值
      letterSpacing: {
        'jp-body':    '0.05em',
        'jp-title':   '0.18em',
        'jp-display': '0.30em',
        eyebrow:      '0.35em',
        ruby:         '0.50em',
      },
      // 日式行高 — ds- prefix 避免蓋掉 Tailwind 預設值
      lineHeight: {
        'ds-tight':  '1.10',
        'ds-snug':   '1.30',
        'ds-normal': '1.55',
        'jp-body':   '2.00',
      },
      // 余白間距 — 對應 DS spacing tokens
      spacing: {
        section:     '6rem',
        'section-lg':'9rem',
        gutter:      '1.5rem',
        'gutter-md': '2.5rem',
        'gutter-lg': '4rem',
      },
      maxWidth: {
        content:    '72rem',
        'prose-ds': '64rem',
      },
      boxShadow: {
        japanese:         'var(--shadow-japanese)',
        'japanese-hover': 'var(--shadow-japanese-hover)',
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