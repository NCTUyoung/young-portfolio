// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * 讀作品 JSON、依 category 分組所有 event 名，組出
 * `/gallery/<category>/<event>` 路徑供 Nitro 預渲染。
 *
 * 為什麼 build 時讀靜態 JSON：每個事件需要一份獨立 HTML 才能讓社群爬蟲（OG / Twitter）
 * 抓得到對應的 hero 圖；單純靠 Nuxt crawlLinks 看不到 EventFilter 的 button click，
 * 不會自動發現這些事件路徑，必須在這裡明列。
 *
 * URL 編碼策略：用原始 unicode（Wikipedia 風格），瀏覽器顯示乾淨、Nitro 輸出資料夾
 * 與 GitHub Pages 服務都直接走 utf-8 路徑。
 */
function buildEventPrerenderRoutes (): string[] {
  type Work = { event?: { name?: string } }
  type Bag = { Img?: Record<string, Work> }
  const here = fileURLToPath(new URL('.', import.meta.url))
  const read = (rel: string): Bag => {
    try {
      return JSON.parse(readFileSync(`${here}/public/${rel}`, 'utf8')) as Bag
    } catch {
      return { Img: {} }
    }
  }
  const photo = read('photographyList.json')
  const digi = read('galleryList.json')
  const collect = (bag: Bag, cat: 'photography' | 'digital'): string[] => {
    const set = new Set<string>()
    for (const w of Object.values(bag.Img || {})) {
      const n = w?.event?.name
      if (typeof n === 'string' && n.length > 0) set.add(n)
    }
    return [...set].map(name => `/gallery/${cat}/${name}`)
  }
  return [
    ...collect(photo, 'photography'),
    ...collect(digi, 'digital')
  ]
}

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
  //
  // serverBundle 只覆蓋 SSR 時直接渲染進 HTML 的 <Icon>。lightbox（ImageViewer）以
  // v-if="isOpen" 包住，預設關閉、SSR 沒渲染，因此一旦使用者打開、client 才掛載這批
  // <Icon name="lucide:..."> 時會走 fallback：fetch https://api.iconify.design/。
  // 行動網路慢／隱私阻擋（uBlock、Brave、Edge tracker prevention 等）會擋掉這個 CDN，
  // 結果是手機上看到的 lightbox 按鈕全部空白（只剩唯一已改 inline SVG 的關閉鍵 X）。
  // clientBundle.scan：build 時掃 .vue 找出實際用到的 lucide:* 名稱並打進前端 JS，
  // 完全不再打 CDN。sizeLimitKb 為防呆上限，目前用量遠低於此值。
  icon: {
    serverBundle: {
      collections: ['lucide']
    },
    clientBundle: {
      scan: true,
      sizeLimitKb: 256
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
      },
      // R2（galleryWorlds 字體分家）：繪/影 各擁獨立字體家族 —
      // 影(kage)＝Shippori Mincho（高對比文人明體，暗房抒情）；
      // 繪(kai)＝Zen Kaku Gothic New（幾何 gothic，製圖俐落）。
      // 由 .gallery-world[data-world] re-map --world-display token 驅動，
      // 桌機/手機同源，徹底拉開兩世界字體節奏（回應 Round 1 critic「字體家族未分家」）。
      {
        name: 'Shippori Mincho',
        weights: [400, 500, 600],
        provider: 'google'
      },
      {
        name: 'Zen Kaku Gothic New',
        weights: [300, 400, 500],
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
  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        '@headlessui/vue',
        'leaflet'
      ]
    }
  },

  // GitHub Pages 靜態輸出配置
  nitro: {
    preset: 'github-pages',
    prerender: {
      // Nuxt 4 預設 crawlLinks=true 會從首頁爬連結；admin 為本機後台頁，不進 SSG。
      crawlLinks: true,
      // failOnError=true：若有事件路由 SSR 死掉直接讓 build 紅，避免悄悄漏掉。
      failOnError: true,
      ignore: ['/admin', '/young-portfolio/admin'],
      routes: [
        '/',
        '/gallery',
        // 2026-05-09：移除 /gallery/all 預渲染（雙主線敘事不容 mixed feed）；
        // 舊 path 由 useGalleryCategoryRoute 在 client-side replace 到 /gallery/photography
        '/gallery/digital',
        '/gallery/photography',
        // 每個事件一份 HTML：分享連結（Slack/Discord/X/Threads）爬蟲現在能讀到該事件的 hero 圖與 JSON-LD。
        // 不對 slug 做 encodeURIComponent；Nitro 對 prerender 路由內部會 decodeURI 後再 encodeURI（見
        // nitropack/dist/core/index.mjs 的 generateRoute），原始 unicode 字串能直接落到輸出資料夾名。
        ...buildEventPrerenderRoutes()
      ]
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
    // 必須留 false。
    //
    // 原因：路徑含非 ASCII（例：`/gallery/photography/2024新北耶誕城`）時，Nitro 預渲染會擲：
    //   TypeError: Cannot convert argument to a ByteString because the character at index 21 has a value of 26032 which is greater than 255.
    // (26032 = '新' 的 Unicode codepoint)
    //
    // payloadExtraction=true 時 Nuxt 會在 SSR 渲染同時對 `<route>/_payload.json` 發 fetch，
    // 該 fetch 會把原路徑塞進 HTTP header（Link 或自訂 prerender header），但**未 URL-encode**；
    // fetch 規範要求 header value 是 ByteString（ASCII），CJK codepoint 直接超出 255 而炸。
    // 確認：以 `'prerender:route'` hook 印 res.body 抓到 TypeError；nitropack 2.13.3 + Nuxt 4.4.2 復現。
    //
    // 影響：本站只有一個全域 `useAsyncData('gallery-works')`，payload 抽取的 perf 收益微乎其微，
    // 關掉的代價接近零（仍是 SSG，HTML 已含 SSR 內容）；換得 19 個事件路由能正確 prerender。
    //
    // 重啟條件：等上游修好（Nitro / Nuxt 對 header 寫入做 encodeURI），再開回 production-only。
    payloadExtraction: false
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