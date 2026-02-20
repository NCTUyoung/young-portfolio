<template>
  <div ref="pageRef">
    <!-- ===== 不對稱 Hero ===== -->
    <section class="relative py-20 sm:py-28 overflow-hidden">
      <!-- 背景裝飾 -->
      <div class="absolute top-0 left-0 w-2/5 h-full bg-stone-100/50 dark:bg-stone-800/30 rounded-r-[4rem] hidden lg:block"></div>
      <div class="deco-line-v h-24 top-12 left-[38%] hidden lg:block"></div>

      <div class="relative max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        <div class="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <!-- 左側：大裝飾數字/圖形 -->
          <div class="reveal flex-shrink-0 relative">
            <!-- 裝飾背景圓 -->
            <div class="absolute inset-0 -m-8 rounded-full bg-accent-100/40 dark:bg-accent-900/20 blur-2xl"></div>
            <div class="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
              <!-- 浮動動畫圖示 -->
              <div class="animate-float">
                <svg class="w-24 h-24 text-accent-400/70 dark:text-accent-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="0.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </div>
              <!-- 呼吸圓點裝飾 -->
              <div class="absolute top-4 right-4 w-4 h-4 rounded-full bg-accent-400/50 animate-breathe"></div>
              <div class="absolute bottom-8 left-2 w-2.5 h-2.5 rounded-full bg-accent-300/40 animate-breathe" style="animation-delay: 1s"></div>
            </div>
          </div>

          <!-- 右側：文字說明 -->
          <div class="flex-1 text-center lg:text-left">
            <p class="reveal text-xs tracking-[0.3em] uppercase text-accent-500 dark:text-accent-400 font-light mb-4">Coming Soon</p>
            <h1 class="reveal reveal-delay-1 text-4xl sm:text-5xl font-extralight text-stone-800 dark:text-stone-100 tracking-wider leading-tight">
              文章專區
            </h1>
            <p class="reveal reveal-delay-2 mt-6 text-stone-500 dark:text-stone-400 font-light tracking-wide leading-relaxed max-w-md">
              設計心得、技術筆記與創作故事，正在用心撰寫中。<br />
              敬請期待更多精彩內容。
            </p>

            <div class="reveal reveal-delay-3 mt-8 flex items-center justify-center lg:justify-start gap-4">
              <NuxtLink
                to="/gallery"
                class="inline-flex items-center px-7 py-3 bg-accent-600 hover:bg-accent-700 text-white font-light tracking-wider rounded-lg transition-all duration-300 group shadow-lg shadow-accent-600/20"
              >
                瀏覽作品集
                <svg class="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </NuxtLink>
              <NuxtLink
                to="/"
                class="text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 font-light tracking-wide transition-colors duration-300"
              >
                返回首頁
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 預告內容 — 水平滾動 ===== -->
    <section class="py-20 lg:py-24 bg-stone-50/40 dark:bg-stone-800/20 relative">
      <div class="deco-line-h w-full top-0 left-0"></div>

      <div class="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        <div class="reveal mb-10 flex items-end gap-6">
          <div>
            <p class="text-xs tracking-[0.3em] uppercase text-accent-500 dark:text-accent-400 font-light mb-3">Preview</p>
            <h2 class="text-2xl sm:text-3xl font-extralight text-stone-800 dark:text-stone-200 tracking-wider">即將帶來</h2>
          </div>
          <div class="hidden sm:block h-px flex-1 max-w-[100px] bg-gradient-to-r from-accent-400/60 to-transparent mb-2"></div>
        </div>
      </div>

      <!-- 水平滾動卡片 strip -->
      <div class="reveal overflow-x-auto hide-scrollbar px-6 sm:px-8 lg:px-12">
        <div class="flex gap-6 max-w-6xl mx-auto pb-4" style="min-width: max-content;">
          <div
            v-for="(preview, index) in previews"
            :key="preview.title"
            class="flex-shrink-0 w-72 sm:w-80 bg-white/80 dark:bg-stone-800/60 backdrop-blur-sm rounded-2xl border border-stone-200/60 dark:border-stone-700/60 p-8 hover:border-accent-200/60 dark:hover:border-accent-700/40 transition-all duration-500 group"
            :class="[`reveal-delay-${index + 1}`]"
          >
            <div class="w-12 h-12 rounded-xl mb-6 flex items-center justify-center transition-colors duration-500"
                 :class="preview.bgClass">
              <svg class="w-6 h-6" :class="preview.iconClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="preview.icon" />
              </svg>
            </div>
            <h3 class="text-lg font-light text-stone-700 dark:text-stone-300 tracking-wider mb-3">{{ preview.title }}</h3>
            <p class="text-stone-500 dark:text-stone-400 text-sm font-light tracking-wide leading-relaxed">{{ preview.description }}</p>
          </div>

          <!-- 更多即將推出 — 裝飾結尾卡片 -->
          <div class="flex-shrink-0 w-48 flex items-center justify-center">
            <div class="text-center">
              <div class="text-3xl text-stone-200 dark:text-stone-700 mb-2">···</div>
              <p class="text-xs text-stone-400 dark:text-stone-500 font-light tracking-wider">更多內容<br />敬請期待</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 底部引言 ===== -->
    <section class="reveal py-20 lg:py-28 relative overflow-hidden">
      <div class="max-w-3xl mx-auto px-6 text-center">
        <p class="text-2xl sm:text-3xl font-extralight text-stone-300 dark:text-stone-600 tracking-wider italic leading-relaxed">
          "文字是思考的足跡，<br class="hidden sm:block" />每篇文章都是一次對話。"
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useScrollReveal } from '~/composables/useScrollReveal'

const { observeAll } = useScrollReveal()
const pageRef = ref<HTMLElement | null>(null)

const previews = [
  {
    title: '設計心得',
    description: '分享數位繪圖與攝影構圖的思考過程，從靈感發想到作品完成的創作筆記。',
    icon: 'M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42',
    bgClass: 'bg-accent-100/80 dark:bg-accent-900/30 group-hover:bg-accent-200/80 dark:group-hover:bg-accent-800/40',
    iconClass: 'text-accent-600 dark:text-accent-400',
  },
  {
    title: '技術筆記',
    description: '記錄 Vue、Nuxt、Tailwind CSS 等前端開發技術的學習心得與實作經驗。',
    icon: 'M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5',
    bgClass: 'bg-stone-100/80 dark:bg-stone-700/60 group-hover:bg-accent-100/60 dark:group-hover:bg-accent-900/20',
    iconClass: 'text-stone-500 dark:text-stone-400 group-hover:text-accent-500 dark:group-hover:text-accent-400',
  },
  {
    title: '創作故事',
    description: '每個作品背後的靈感來源與創作過程，分享從構思到完成的完整故事。',
    icon: 'M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18',
    bgClass: 'bg-stone-100/80 dark:bg-stone-700/60 group-hover:bg-accent-100/60 dark:group-hover:bg-accent-900/20',
    iconClass: 'text-stone-500 dark:text-stone-400 group-hover:text-accent-500 dark:group-hover:text-accent-400',
  },
  {
    title: '器材評測',
    description: '繪圖板、相機鏡頭、軟體工具的使用體驗與比較分析。',
    icon: 'M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z',
    bgClass: 'bg-stone-100/80 dark:bg-stone-700/60 group-hover:bg-accent-100/60 dark:group-hover:bg-accent-900/20',
    iconClass: 'text-stone-500 dark:text-stone-400 group-hover:text-accent-500 dark:group-hover:text-accent-400',
  },
]

onMounted(() => {
  observeAll(pageRef.value)
})

// 頁面 meta
useSeoMeta({
  title: '文章專區',
  description: '分享設計心得、技術筆記與創作故事。',
  ogTitle: '文章專區 - 設計心得與技術筆記',
  ogDescription: '分享設計過程、技術筆記與創作背後的故事，文章功能即將推出。',
  ogType: 'website',
  ogUrl: 'https://nctuyoung.github.io/young-portfolio/article',
  ogImage: 'https://nctuyoung.github.io/young-portfolio/images/gallery/2024年電繪作品/23.jpg',
  twitterCard: 'summary_large_image'
})
</script>
