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
      // 註：事件專頁以 `?event=<name>` 傳遞，query string 在靜態輸出下
      // 無法產生不同 HTML 檔（Nitro 對 query 不做路徑扁平化，只會蓋同一份）。
      // 分享時的 OG／JSON-LD 仍會在使用者實際造訪時由 client-side hydration 動態寫入
      // `<head>`，社群爬蟲需要獨立 HTML 才能看到的情境屬已知限制，暫不處理；
      // 若未來要完整靜態化，請把路由從 `?event=` 改為 `/gallery/photography/<event-slug>`。
    }
  },

  // 對 /admin 停用 SSR 與預渲染（僅客戶端渲染本機管理介面）
  routeRules: {
    '/admin': { ssr: false, prerender: false }
  },

  // 靜態站點生成 (SSG) 配置
  ssr: true, // 啟用 SSR 為了預渲染

  // payload extraction：
  // - dev（Windows）：Nuxt 4 在 Windows 寫 .nuxt/cache/nuxt/payload/<route>
  //   時沒先 mkdir 父目錄，dev 刷某些子頁會 500（ENOENT），所以 dev 強制關掉。
  // - production / nuxt generate：打開可讓 useAsyncData 的結果打包成 _payload.json，
  //   使用者二次造訪事件頁時不必重新 fetch 與轉換作品清單，TTI 更快。
  experimental: {
    payloadExtraction: process.env.NODE_ENV === 'production'
  },

  // Pinia：不設 storesDirs，用預設（= `<srcDir>/stores` = `app/stores/`）。
  // 注意 @pinia/nuxt 的 storesDirs 是以 `layer.app` 為基準解析的相對路徑，
  // 在 Nuxt 4 下 `layer.app` 已經是 `app/`，所以寫 `'./app/stores'` 會變成
  // `app/app/stores`（不存在）→ 全部 useXxxStore auto-import silent fail，
  // dev 端會看到 `ReferenceError: useAdminStore is not defined`。
  // 非要寫就寫 `'./stores'` 或絕對路徑；最穩的是交給預設。

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
          innerHTML: `(function(){try{var k='vueuse-color-scheme';var raw=localStorage.getItem(k);var m=raw;if(m==null||m==='')m='light';if(m==='auto')m=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';var el=document.documentElement;if(m==='dark')el.classList.add('dark');else el.classList.remove('dark')}catch(e){}})()`,
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
        // og:image 全站預設（非首頁也能分享）；首頁的 useSeoMeta 會以 hero series
        // 圖覆寫（page-level 後註冊 > global meta）。若要換 hero 圖，改
        // photographyList.json 的 `series: ['hero']` 目標；此預設同步更新。
        // 2026-04-19 Phase 3A：DSC_9877 = 首屏靜照，與 hero tag 同源。
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