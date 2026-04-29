<template>
  <section
    v-if="years.length > 0"
    class="relative max-w-7xl mx-auto px-2 sm:px-6 mt-2 mb-12 lg:mb-16"
    aria-labelledby="digital-intro-heading"
  >
    <!--
      策展開場 — 與 photography 頁的「Map → Statement → Strip」同 family
      設計鐵律：stone 為主、accent 點綴（年份計數）、hairline 分區、縦書き「繪」承接題眼
      2026-04-28：依 design brief priority 4 補入，避免從 controls 直接掉入瀑布流
    -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-center">
      <!-- 左：縦書き「繪」軸 + 累計張數 -->
      <aside class="md:col-span-3 flex md:flex-col items-center md:items-end justify-center md:justify-start gap-4 select-none">
        <span
          class="font-jp text-4xl md:text-5xl lg:text-6xl font-extralight tracking-[0.4em] text-stone-700 dark:text-stone-200 [writing-mode:vertical-rl] leading-none"
          aria-hidden="true"
        >繪</span>
        <div class="hidden md:block jp-hairline-v h-12"/>
        <div class="md:text-right">
          <p class="jp-kansuji text-[0.65rem] tracking-[0.4em] text-stone-400 dark:text-stone-500 uppercase">Cumulative</p>
          <p class="font-jp text-xl font-extralight tracking-[0.18em] text-stone-700 dark:text-stone-200 mt-1">{{ totalCount }} <span class="text-[0.65rem] tracking-[0.35em] text-stone-400 dark:text-stone-500 ml-1">作品</span></p>
        </div>
      </aside>

      <!-- 中：Statement -->
      <div class="md:col-span-9">
        <p class="jp-section-label mb-3" id="digital-intro-heading">Digital Statement</p>
        <p
          lang="ja"
          class="font-jp text-xl sm:text-2xl lg:text-[1.7rem] font-extralight tracking-[0.32em] text-stone-800 dark:text-stone-100 leading-[1.9]"
        >
          線と形を、<span class="inline-block mx-1"/>繰り返す。
        </p>
        <p class="jp-body text-sm mt-4 text-stone-600 dark:text-stone-400 max-w-2xl">
          自幾何化的動物與經典再創作起步——人物、場景、概念藝術——以筆觸與構圖，反覆回到同一道線。
        </p>
      </div>
    </div>

    <!-- 年度索引（hairline 上方一道輕量年表，避免直接掉入瀑布流） -->
    <div class="mt-10 lg:mt-14">
      <div class="jp-hairline w-full mb-6"/>
      <div class="flex items-baseline justify-between gap-3">
        <p class="jp-section-label">By Year</p>
        <p class="text-[0.65rem] tracking-[0.35em] text-stone-400 dark:text-stone-500 uppercase">{{ years.length }} Years</p>
      </div>
      <ol class="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2 lg:gap-x-8">
        <li
          v-for="entry in years"
          :key="entry.year"
          class="flex items-baseline gap-1.5 group"
        >
          <span class="jp-kansuji text-[0.85rem] tracking-[0.18em] text-stone-700 dark:text-stone-200 font-light">{{ entry.year }}</span>
          <span class="text-[0.65rem] tabular-nums text-accent-500 dark:text-accent-400 tracking-wider">{{ entry.count }}</span>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '~/stores/gallery'

const galleryStore = useGalleryStore()
const { digitalWorks } = storeToRefs(galleryStore)

const totalCount = computed(() => digitalWorks.value.length)

// 把每一張作品的 time（"YYYY Mon DD"）抽出年份並計數，依年降序
const years = computed(() => {
  const counter = new Map<string, number>()
  for (const w of digitalWorks.value) {
    const year = typeof w.time === 'string' ? w.time.slice(0, 4) : ''
    if (!/^\d{4}$/.test(year)) continue
    counter.set(year, (counter.get(year) ?? 0) + 1)
  }
  return Array.from(counter.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => b.year.localeCompare(a.year))
})
</script>
