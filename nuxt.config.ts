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

  // GitHub Pages 特定配置
  app: {
    buildAssetsDir: '_nuxt/', // 確保資源路徑正確
    baseURL: '/young-portfolio/' // GitHub Pages 專案倉庫需要設定基礎路徑
  }
})
