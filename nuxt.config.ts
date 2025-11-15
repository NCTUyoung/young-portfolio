// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    'nuxt-headlessui'
  ],

  headlessui: {
    prefix: 'Headless'
  },

  css: ['~/assets/css/main.css'],
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
      routes: ['/']
    }
  },

  // 靜態站點生成 (SSG) 配置
  ssr: true, // 啟用 SSR 為了預渲染

  // Pinia 配置（可選）
  pinia: {
    storesDirs: ['./stores/**'],
  },

  // GitHub Pages 特定配置 + 全站預設 SEO 設定
  app: {
    buildAssetsDir: '_nuxt/', // 確保資源路徑正確
    baseURL: '/young-portfolio/', // GitHub Pages 專案倉庫需要設定基礎路徑
    head: {
      htmlAttrs: {
        lang: 'zh-Hant'
      },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      titleTemplate: '%s | Young Portfolio',
      meta: [
        {
          name: 'description',
          content: 'Young 的個人作品集，包含數位插畫與攝影作品，展現創作與攝影紀錄。'
        },
        { property: 'og:site_name', content: 'Young Portfolio' },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'zh_TW' },
        {
          name: 'twitter:card',
          content: 'summary_large_image'
        }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/young-portfolio/favicon.ico' }
      ]
    }
  }
})
