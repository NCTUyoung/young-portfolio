<template>
  <!--
    Gallery 左 rail（lg+ 專用）— 把原本頁眉的 chrome 整層搬到左側 sticky 欄，
    讓主內容（EventCover / Map / Strip / Timeline）從 viewport 頂端開始。
    對齊 sites/rinko-kawauchi.md（左側極窄 fixed nav）+ sites/ryan-mcginley.md（左側固定寬 nav）。

    Path B（2026-05-15）：把 rail 從「設定面板」改為「目錄頁／書脊」。
    - 左邊緣加單字縦書き 漢字（digital=繪 / photography=影）作為 category 身分標識
    - 移除 count → tabs 之間的 jp-hairline 切段；改以余白拉開節奏
    詳見 wiki/inspirations/gallery-left-rail.md。
  -->
  <aside
    class="relative w-60 shrink-0 self-start sticky top-[calc(env(safe-area-inset-top,0px)+4rem)] max-h-[calc(100vh-4rem)] overflow-y-auto hide-scrollbar py-8 pr-6 pl-6"
    aria-label="Gallery filters"
  >
    <!--
      縦書き書脊：以單字 kanji 替代 hairline 切段，rail 從「設定面板」變「目錄頁」。
      aria-hidden + pointer-events-none：純裝飾、不干擾 a11y tree 與點擊。
      色度刻意壓到 stone-200/700（接近隱身）— 讓書脊在余白中淡入，不搶 H1 焦點。
    -->
    <span
      v-if="spineKanji"
      class="writing-vertical pointer-events-none select-none absolute -left-0.5 top-9 font-jp text-2xl tracking-[0.5em] text-stone-400/70 dark:text-stone-500/50"
      aria-hidden="true"
    >{{ spineKanji }}</span>

    <!-- 標題區：eyebrow + Works h1 + count（與舊頁眉同 lockup，緊湊版） -->
    <p class="jp-eyebrow text-accent-500 dark:text-accent-400 mb-2"><span>Gallery</span></p>
    <h1 class="text-2xl font-extralight text-stone-800 dark:text-stone-200 tracking-wider mb-2">Works</h1>
    <p class="text-stone-500 dark:text-stone-400 font-light mb-7 text-xs tracking-wide flex items-center gap-1.5">
      <span class="text-accent-500 dark:text-accent-400">{{ categoryLabel }}</span>
      <span class="text-stone-300 dark:text-stone-700">·</span>
      <span>{{ categoryCount }} works</span>
    </p>

    <!-- Category tabs：保留橫向，w-60 容得下兩個 tab -->
    <GalleryTabBar />

    <!-- Event filter：rail 模式（垂直列） -->
    <EventFilter variant="rail" />

    <!-- 搜尋 + 年份：rail 模式（垂直堆疊） -->
    <GalleryFilterToolbar variant="rail" />
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '~/stores/gallery'
import GalleryTabBar from '~/components/GalleryTabBar.vue'
import EventFilter from '~/components/EventFilter.vue'
import GalleryFilterToolbar from '~/components/GalleryFilterToolbar.vue'

defineProps<{
  categoryLabel: string
  categoryCount: number
}>()

const { filterState } = storeToRefs(useGalleryStore())

// 對齊 pages/.../[[event]].vue 章節 / footer 之比喻：digital=繪、photography=影
const spineKanji = computed(() => {
  const c = filterState.value.selectedCategory
  if (c === 'digital') return '繪'
  if (c === 'photography') return '影'
  return ''
})
</script>
