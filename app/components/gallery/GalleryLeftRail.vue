<template>
  <!--
    Gallery 左 rail（lg+ 專用）— 把原本頁眉的 chrome 整層搬到左側 sticky 欄，
    讓主內容（EventCover / Map / Strip / Timeline）從 viewport 頂端開始。
    對齊 sites/rinko-kawauchi.md（左側極窄 fixed nav）+ sites/ryan-mcginley.md（左側固定寬 nav）。
    詳見 wiki/inspirations/gallery-left-rail.md。
  -->
  <aside
    class="w-60 shrink-0 self-start sticky top-[calc(env(safe-area-inset-top,0px)+4rem)] max-h-[calc(100vh-4rem)] overflow-y-auto hide-scrollbar py-8 pr-6 pl-1"
    aria-label="Gallery filters"
  >
    <!-- 標題區：eyebrow + Works h1 + count（與舊頁眉同 lockup，緊湊版） -->
    <p class="jp-eyebrow text-accent-500 dark:text-accent-400 mb-2"><span>Gallery</span></p>
    <h1 class="text-2xl font-extralight text-stone-800 dark:text-stone-200 tracking-wider mb-2">Works</h1>
    <p class="text-stone-500 dark:text-stone-400 font-light mb-5 text-xs tracking-wide flex items-center gap-1.5">
      <span class="text-accent-500 dark:text-accent-400">{{ categoryLabel }}</span>
      <span class="text-stone-300 dark:text-stone-700">·</span>
      <span>{{ categoryCount }} works</span>
    </p>

    <div class="jp-hairline w-full mb-5"/>

    <!-- Category tabs：保留橫向，w-60 容得下兩個 tab -->
    <GalleryTabBar />

    <!-- Event filter：rail 模式（垂直列） -->
    <EventFilter variant="rail" />

    <!-- 搜尋 + 年份：rail 模式（垂直堆疊） -->
    <GalleryFilterToolbar variant="rail" />
  </aside>
</template>

<script setup lang="ts">
import GalleryTabBar from '~/components/GalleryTabBar.vue'
import EventFilter from '~/components/EventFilter.vue'
import GalleryFilterToolbar from '~/components/GalleryFilterToolbar.vue'

defineProps<{
  categoryLabel: string
  categoryCount: number
}>()
</script>
