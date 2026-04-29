<template>
  <div ref="pageRef">
    <!-- =====================================================================
         Hero — 編集中（書扉式版心，與全站日式排版同步）
         2026-04-28：依 design brief priority 5，移除高飽和橘色 CTA + blob 裝飾，
                     改 jp-section-title / hairline / 縦書き「文」收尾。
                     CTA 採 underline + → 箭頭，與 Home Hero 的「作品を見る」同 family。
         ===================================================================== -->
    <section class="relative py-24 lg:py-36 overflow-hidden">
      <!-- 背景大字「文」（與侘寂段落同手法，淡水印） -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span class="font-jp text-[clamp(12rem,30vw,24rem)] font-extralight text-stone-200/40 dark:text-stone-800/35 leading-none tracking-wider">文</span>
      </div>

      <div class="relative max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
        <header class="reveal mb-14 lg:mb-20 flex items-baseline justify-between flex-wrap gap-4">
          <h1 class="jp-section-title text-4xl sm:text-5xl">文章
            <span class="jp-section-ruby">Writings</span>
          </h1>
          <span class="jp-vertical-caption hidden lg:inline-block">編集中</span>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <!-- 左：縦書き短句 + 印章「文」-->
          <div class="reveal-left lg:col-span-5 relative flex md:items-start">
            <div class="jp-frame bg-stone-50 dark:bg-stone-800/40 aspect-tatami w-full max-w-xs relative flex items-center justify-center">
              <!-- 直書短句（桌機）-->
              <blockquote class="hidden md:flex writing-vertical font-jp text-xl lg:text-2xl font-extralight tracking-[0.45em] text-stone-700 dark:text-stone-200 leading-[2.4]">
                文字は<span class="mx-3"/>思考の足跡
              </blockquote>
              <!-- 橫書短句（手機）-->
              <blockquote class="md:hidden font-jp text-xl font-extralight tracking-[0.3em] text-stone-700 dark:text-stone-200 leading-[2] text-center px-6">
                文字は<br>思考の足跡
              </blockquote>
            </div>
            <span class="jp-seal absolute -bottom-3 -right-3 shadow-sm" aria-hidden="true">文</span>
          </div>

          <!-- 右：說明 + 低調 CTA -->
          <div class="lg:col-span-7 lg:pl-4">
            <p class="reveal jp-eyebrow text-stone-500"><span>Coming Soon</span></p>
            <p class="reveal reveal-delay-1 mt-4 font-jp text-2xl tracking-[0.3em] text-stone-800 dark:text-stone-100 font-light">
              編集中
            </p>
            <p class="reveal reveal-delay-1 mt-2 text-xs tracking-[0.45em] uppercase text-stone-500 dark:text-stone-400 font-light">In Preparation</p>

            <div class="reveal reveal-delay-1 jp-hairline my-8 max-w-xs"/>

            <p class="reveal reveal-delay-2 jp-body text-[0.95rem] max-w-xl">
              設計心得、技術筆記與創作故事——目前正在用心整理。每篇文章都是一次對話，敬請期待。
            </p>

            <div class="reveal reveal-delay-3 mt-10 lg:mt-14 flex flex-wrap items-center gap-x-8 gap-y-4">
              <NuxtLink
                to="/gallery"
                class="group inline-flex items-center gap-3 text-stone-800 dark:text-stone-100 border-b border-stone-400/70 dark:border-stone-500/70 pb-2 pr-2 hover:border-accent-500 dark:hover:border-accent-400 transition-colors duration-500"
              >
                <span class="font-jp tracking-[0.25em] text-lg">作品を見る</span>
                <span class="text-xs tracking-[0.3em] text-stone-500 dark:text-stone-400 uppercase">Gallery</span>
                <svg class="w-4 h-4 text-stone-500 dark:text-stone-400 transition-transform duration-500 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </NuxtLink>
              <NuxtLink
                to="/"
                class="group inline-flex items-center gap-2 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 transition-colors duration-500"
              >
                <span class="font-jp tracking-[0.25em] text-base">表紙へ戻る</span>
                <svg class="w-3.5 h-3.5 transition-transform duration-500 group-hover:-translate-x-1 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- =====================================================================
         目次 — 預告（書頁式 table-of-contents，非 generic feature cards）
         2026-04-28：依 design brief priority 5，preview cards 改成「目次條列」式：
                     章碼（其一／其二）+ 漢字大號 + 標題 + 描述 + hairline。
                     不再用圓角卡片 + 圖示色塊，回歸 stone + hairline + 余白。
         ===================================================================== -->
    <section class="relative py-24 lg:py-32 bg-stone-100/40 dark:bg-stone-800/25">
      <div class="jp-hairline absolute top-0 left-0 right-0"/>
      <div class="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
        <header class="reveal mb-14 lg:mb-20 flex items-baseline justify-between flex-wrap gap-4">
          <h2 class="jp-section-title text-3xl sm:text-4xl">目次
            <span class="jp-section-ruby">Index</span>
          </h2>
          <span class="text-[0.7rem] tracking-[0.4em] text-stone-400 dark:text-stone-500 uppercase">{{ previews.length }} Chapters · 予定</span>
        </header>

        <ol class="space-y-0 divide-y divide-stone-200/70 dark:divide-stone-700/40 border-y border-stone-200/70 dark:border-stone-700/40">
          <li
            v-for="(preview, index) in previews"
            :key="preview.title"
            class="reveal py-6 lg:py-8 group"
            :class="[`reveal-delay-${Math.min(index + 1, 5)}`]"
          >
            <article class="grid grid-cols-12 gap-4 lg:gap-8 items-baseline">
              <!-- 章碼（漢數字）+ 漢字 -->
              <div class="col-span-12 sm:col-span-3 lg:col-span-2 flex sm:flex-col items-baseline sm:items-start gap-3 sm:gap-1">
                <p class="jp-kansuji text-xs tracking-[0.4em] text-stone-400 dark:text-stone-500">{{ preview.kansuji }}</p>
                <p class="font-jp text-3xl sm:text-4xl font-extralight tracking-[0.2em] text-stone-700 dark:text-stone-200 leading-none">{{ preview.kanji }}</p>
              </div>

              <!-- 標題 + 描述 -->
              <div class="col-span-12 sm:col-span-9 lg:col-span-9">
                <h3 class="font-jp text-lg lg:text-xl font-light tracking-[0.2em] text-stone-800 dark:text-stone-100 group-hover:text-accent-700 dark:group-hover:text-accent-400 transition-colors">
                  {{ preview.title }}
                </h3>
                <p class="jp-body text-sm mt-3 text-stone-600 dark:text-stone-400 max-w-2xl">
                  {{ preview.description }}
                </p>
              </div>

              <!-- 狀態 -->
              <div class="hidden lg:flex col-span-1 justify-end">
                <span class="text-[0.65rem] tracking-[0.4em] uppercase text-stone-400 dark:text-stone-500">予定</span>
              </div>
            </article>
          </li>
        </ol>

        <p class="reveal mt-10 text-center text-[0.65rem] tracking-[0.5em] uppercase text-stone-400 dark:text-stone-500">
          To Be Continued · 続く
        </p>
      </div>
    </section>

    <!-- =====================================================================
         引言（直書、極簡，與 Home 侘寂段落同 family）
         ===================================================================== -->
    <section class="reveal relative py-24 lg:py-32 overflow-hidden">
      <div class="relative max-w-3xl mx-auto px-6 flex items-center justify-center gap-12">
        <!-- 直書引言（桌機） -->
        <blockquote class="hidden md:flex writing-vertical font-jp text-2xl lg:text-3xl font-extralight tracking-[0.4em] text-stone-700 dark:text-stone-200 leading-[2.2]">
          文字は思考の足跡<span class="mx-4"/>一篇は一度の対話
        </blockquote>

        <!-- 橫書引言（手機） -->
        <blockquote class="md:hidden font-jp text-xl font-extralight tracking-[0.3em] text-stone-700 dark:text-stone-200 leading-[2] text-center">
          「文字は思考の足跡，<br>一篇は一度の対話。」
        </blockquote>

        <!-- 署名（直書） -->
        <div class="hidden md:flex flex-col items-center gap-3 text-stone-400 dark:text-stone-500">
          <div class="w-px h-8 bg-stone-400/60 dark:bg-stone-500/60"/>
          <span class="writing-vertical font-jp text-[0.7rem] tracking-[0.6em]">編集中</span>
          <div class="w-px h-8 bg-stone-400/60 dark:bg-stone-500/60"/>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useScrollReveal } from '~/composables/useScrollReveal'

const { observeAll } = useScrollReveal()
const pageRef = ref<HTMLElement | null>(null)

// 「目次」式預告：每章章碼（漢數字）+ 漢字標 + 中文標題 + 描述
// 取代原 generic feature cards（彩色 bg + Lucide-like icon）
const previews = [
  {
    kansuji: '其の一',
    kanji: '思',
    title: '設計心得',
    description: '分享數位繪圖與攝影構圖的思考過程，從靈感發想到作品完成的創作筆記。',
  },
  {
    kansuji: '其の二',
    kanji: '築',
    title: '技術筆記',
    description: '記錄 Vue、Nuxt、Tailwind CSS 等前端開發技術的學習心得與實作經驗。',
  },
  {
    kansuji: '其の三',
    kanji: '語',
    title: '創作故事',
    description: '每個作品背後的靈感來源與創作過程，分享從構思到完成的完整故事。',
  },
  {
    kansuji: '其の四',
    kanji: '具',
    title: '器材評測',
    description: '繪圖板、相機鏡頭、軟體工具的使用體驗與比較分析。',
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
