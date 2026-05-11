<template>
  <!--
    Event Cover — 進入 /gallery/photography/<event> 時的扉頁
    啟發自 sites/ryan-mcginley.md（單張全幅 + 簡素 metadata）與
    sites/rinko-kawauchi.md（書頁式克制版面）。
    沉浸型訪客優先：跳過 overview 的 Map/Statement/Strip 三章節，
    直接給該 event 一張代表照 + 三行 editorial metadata + 一個展開鈕。
    路線 A：D1 自動取 group.images[0] 為 cover；無 admin 控制；無 URL state（純 UI）。
  -->
  <section
    v-if="coverImage"
    class="event-cover"
    aria-labelledby="event-cover-heading"
  >
    <!-- 全幅扉頁：80vh / md:88vh，min 420px 兜底 -->
    <div class="event-cover-image relative w-full h-[80vh] md:h-[88vh] min-h-[420px] overflow-hidden bg-stone-100 dark:bg-stone-900">
      <picture>
        <source type="image/avif" :srcset="getAvifThumbPath(coverImage.filename, 1600)">
        <source type="image/webp" :srcset="getThumbPath(coverImage.filename, 1600)">
        <img
          :src="getImagePath(coverImage.filename)"
          :alt="`${eventName} 扉頁 — ${coverImage.title || ''}`"
          class="w-full h-full object-cover"
          loading="eager"
          fetchpriority="high"
          decoding="async"
          draggable="false"
        >
      </picture>
      <!-- 圖底淡墨漸層收束：與下方白底 metadata 區自然融合 -->
      <div
        aria-hidden="true"
        class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-stone-50 dark:from-stone-950 to-transparent pointer-events-none"
      />
    </div>

    <!-- Cover meta + expand CTA：editorial 風格、置中、無 box -->
    <div class="event-cover-meta max-w-3xl mx-auto px-6 py-12 md:py-16 text-center">
      <p class="jp-section-label">扉頁 · Cover</p>
      <h2
        id="event-cover-heading"
        class="font-jp text-3xl md:text-4xl font-extralight tracking-[0.2em] text-stone-800 dark:text-stone-100 mt-4"
      >
        {{ eventName }}
      </h2>
      <span aria-hidden="true" class="jp-hairline mx-auto my-6 block w-24"/>

      <p class="event-cover-meta-line text-[0.7rem] tracking-[0.4em] text-stone-500 dark:text-stone-400 uppercase flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span v-if="eventInfo?.location">{{ eventInfo.location }}</span>
        <span v-if="eventInfo?.location && timeRange" aria-hidden="true" class="text-stone-300 dark:text-stone-700">·</span>
        <span v-if="timeRange">{{ timeRange }}</span>
        <span v-if="(eventInfo?.location || timeRange) && images.length" aria-hidden="true" class="text-stone-300 dark:text-stone-700">·</span>
        <span class="jp-kansuji">{{ images.length }} 葉</span>
      </p>

      <button
        type="button"
        class="cover-expand mt-10 inline-flex items-center gap-3 text-stone-600 dark:text-stone-300 hover:text-accent-600 dark:hover:text-accent-400 transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/60 focus-visible:ring-offset-4 focus-visible:ring-offset-stone-50 dark:focus-visible:ring-offset-stone-950 rounded-sm"
        @click="$emit('expand')"
      >
        <span class="text-xs tracking-[0.4em] uppercase">展開全部</span>
        <span aria-hidden="true" class="block w-12 h-px bg-stone-400/60 dark:bg-stone-500/60 group-hover:bg-accent-500 dark:group-hover:bg-accent-400 transition-colors"/>
        <span aria-hidden="true" class="cover-arrow block text-stone-400 dark:text-stone-500 motion-reduce:animate-none">↓</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MixedPhotoItem } from '~~/shared/types/gallery'

const props = defineProps<{
  group: MixedPhotoItem
}>()

defineEmits<{ expand: [] }>()

const { getImagePath, getThumbPath, getAvifThumbPath } = useImagePath()

const eventName = computed(() => props.group.eventName ?? '')
const eventInfo = computed(() => props.group.eventInfo ?? null)
const images = computed(() => props.group.images ?? [])
const timeRange = computed(() => props.group.timeRange ?? '')

/**
 * D1：cover 來源 = group.images 第一張。
 * 升級路徑（路線 B）：未來若加 SERIES_TAG = 'event-cover'，
 * 此處改為 `images.find(i => i.series?.includes('event-cover')) ?? images[0]`。
 */
const coverImage = computed(() => images.value[0] ?? null)
</script>

<style scoped>
.cover-arrow {
  animation: cover-bounce 2.4s ease-in-out infinite;
}

@keyframes cover-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(4px); }
}

@media (prefers-reduced-motion: reduce) {
  .cover-arrow { animation: none; }
}
</style>
