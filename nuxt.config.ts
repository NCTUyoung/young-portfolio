// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    'nuxt-headlessui',
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon'
  ],

  // @nuxt/icon：離線優先（從 @iconify-json/lucide bundle 圖示到輸出），避免 GitHub Pages 打到 CDN
  icon: {
    serverBundle: {
      collections: ['lucide']
    }
  },

  headlessui: {
    prefix: 'Headless'
  },

  // 字型：@nuxt/fonts（子集化／快取）
  // - Outfit：拉丁 UI／標題幾何感
  // - Noto Sans TC：繁中與 Outfit 未覆蓋字元
  // - Noto Serif JP：豎排／引言等日式裝飾（font-jp）
  fonts: {
    families: [
      {
        name: 'Outfit',
        weights: [200, 300, 400, 500, 600, 700, 800, 900],
        provider: 'google'
      },
      {
        name: 'Noto Sans TC',
        weights: [200, 300, 400, 500, 600, 700, 900],
        provider: 'google'
      },
      {
        name: 'Noto Serif JP',
        weights: [100, 200, 300],
        provider: 'google'
      }
    ]
  },

  css: [
    '~/assets/css/main.css'
    // 'leaflet/dist/leaflet.css' 改於 app/components/EventMap.vue 內 import，
    // 避開 Vite 7 + Windows 讀取 node_modules CSS 透過 @fs 絕對路徑時的 MIME 異常。
  ],
  typescript: {
    strict: true
  },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  // GitHub Pages 靜態輸出配置
  nitro: {
    preset: 'github-pages',
    prerender: {
      // Nuxt 4 預設 crawlLinks=true 會從首頁爬連結；admin 為本機後台頁，不進 SSG
      crawlLinks: true,
      failOnError: false,
      ignore: ['/admin', '/young-portfolio/admin'],
      routes: [
        '/',
        '/gallery',
        '/gallery/all',
        '/gallery/digital',
        '/gallery/photography',
      ]
    }
  },

  // 對 /admin 停用 SSR 與預渲染（僅客戶端渲染本機管理介面）
  routeRules: {
    '/admin': { ssr: false, prerender: false }
  },

  // 靜態站點生成 (SSG) 配置
  ssr: true, // 啟用 SSR 為了預渲染

  // 關掉 payload extraction：
  // - Nuxt 4 在 Windows 寫 .nuxt/cache/nuxt/payload/<route> 時沒先 mkdir 父目錄，
  //   dev 刷某些子頁會 500（ENOENT）。
  // - 本站資料流走 Pinia 客戶端 fetch `public/*.json`，_payload.json 預抽取沒加速效益。
  experimental: {
    payloadExtraction: false
  },

  // Pinia 配置：Nuxt 4 起 srcDir 搬到 app/，stores 同步
  pinia: {
    storesDirs: ['./app/stores/**'],
  },

  // GitHub Pages 特定配置 + 全站預設 SEO 設定
  app: {
    buildAssetsDir: '_nuxt/', // 確保資源路徑正確
    baseURL: '/young-portfolio/', // GitHub Pages 專案倉庫需要設定基礎路徑
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: {
        lang: 'zh-Hant'
        // 勿在此寫死 class="dark"：會讓已選淺色者在刷新時先看到深色再被 useDark 改掉（FOUCD）。
        // 主題 class 由下方 theme-boot 內嵌腳本依 localStorage「vueuse-color-scheme」在首幀前同步。
      },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      titleTemplate: '%s | Young Portfolio',
      // 與 @vueuse/core useDark → useColorMode 預設 storageKey 一致；需在 Vue 載入前執行
      script: [
        {
          key: 'theme-boot-vueuse',
          tagPriority: 'critical',
          innerHTML: `(function(){try{var k='vueuse-color-scheme';var raw=localStorage.getItem(k);var m=raw;if(m==null||m==='')m='dark';if(m==='auto')m=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';var el=document.documentElement;if(m==='dark')el.classList.add('dark');else el.classList.remove('dark')}catch(e){}})()`,
          type: 'text/javascript'
        }
      ],
      meta: [
        {
          name: 'description',
          content:
            'NCTU Young 個人作品集：數位電繪與攝影；圖片庫依類別與事件,攝影附地圖與拍攝資訊。'
        },
        // 讓瀏覽器原生 form control、scrollbar 正確配合 dark 預設
        { name: 'color-scheme', content: 'dark light' },
        {
          name: 'theme-color',
          content: '#1c1917',
          media: '(prefers-color-scheme: dark)'
        },
        {
          name: 'theme-color',
          content: '#fafaf9',
          media: '(prefers-color-scheme: light)'
        },
        { property: 'og:site_name', content: 'Young Portfolio' },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'zh_TW' },
        { property: 'og:url', content: 'https://nctuyoung.github.io/young-portfolio/' },
        {
          property: 'og:image',
          content:
            'https://nctuyoung.github.io/young-portfolio/images/photography/WBC%E6%9D%B1%E4%BA%AC%20%E5%8F%B0%E6%BE%B3/DSC_9877-%E7%B7%A8%E8%BC%AF-1.jpg'
        },
        { name: 'twitter:card', content: 'summary_large_image' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/young-portfolio/favicon.ico' },
        { rel: 'canonical', href: 'https://nctuyoung.github.io/young-portfolio/' }
      ]
    }
  }
})