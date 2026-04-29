<template>
  <div class="relative -mx-1 mb-8">
    <!--
      右側漸層提示：手機（< sm）若 tab row 超出容器，提供視覺暗示有東西可滑。
      設計鐵律 §3：hairline 風格，不用實線截斷，故用 gradient 從透明→bg。
    -->
    <span
      v-if="showRightFade"
      aria-hidden="true"
      class="sm:hidden pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-stone-50 dark:from-stone-900 to-transparent z-[1]"
    />
    <div
      ref="scrollerRef"
      class="flex items-center gap-0 overflow-x-auto overscroll-x-contain px-1 pb-0.5 [-webkit-overflow-scrolling:touch] md:overflow-visible md:px-0"
      @scroll.passive="onScroll"
    >
      <template v-for="(tab, index) in tabs" :key="tab.key">
        <!-- 標籤連結：與 /gallery/:category 同步 -->
        <NuxtLink
          :to="{ path: `/gallery/${tab.key}`, query: route.query }"
          class="flex-shrink-0 touch-manipulation"
          :class="[
            'relative px-5 py-2.5 font-light tracking-wide transition-all duration-300 group',
            isActive(tab.key)
              ? 'text-stone-800 dark:text-stone-100'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
          ]"
        >
          <!-- 日式指示條：選中時出現 -->
          <span
            :class="[
              'absolute bottom-0 left-1/2 -translate-x-1/2 h-px transition-all duration-500 ease-out',
              isActive(tab.key)
                ? 'w-full bg-gradient-to-r from-transparent via-accent-500 dark:via-accent-400 to-transparent'
                : 'w-0 bg-accent-400/60'
            ]"
          />
          <!-- 選中圓點 -->
          <span
            :class="[
              'absolute -bottom-[3px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full transition-all duration-300',
              isActive(tab.key)
                ? 'bg-accent-500 dark:bg-accent-400 opacity-100'
                : 'opacity-0'
            ]"
          />

          <!-- 標籤文字 -->
          <span class="text-sm">{{ tab.label }}</span>

          <!-- 數量 badge -->
          <span
            :class="[
              'ml-1.5 text-xs transition-colors duration-300',
              isActive(tab.key)
                ? 'text-accent-500/80 dark:text-accent-400/80'
                : 'text-stone-300 dark:text-stone-600 group-hover:text-stone-400 dark:group-hover:text-stone-500'
            ]"
          >{{ categoryStats[tab.key] }}</span>
        </NuxtLink>

        <!-- 豎向分隔線（非最後一個） -->
        <div
          v-if="index < tabs.length - 1"
          class="w-px h-4 bg-stone-200/70 dark:bg-stone-700/50 mx-1"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '~/stores/gallery'

const route = useRoute()
const galleryStore = useGalleryStore()
const { categoryStats, filterState } = storeToRefs(galleryStore)

const tabs = [
  { key: 'digital', label: '數位繪圖' },
  { key: 'photography', label: '攝影作品' },
  { key: 'all', label: '全部作品' },
] as const

function isActive (key: string) {
  const p = route.params.category
  const segment = Array.isArray(p) ? p[0] : p
  if (segment === undefined || segment === '') {
    return filterState.value.selectedCategory === key
  }
  return segment === key
}

// 滾動可見度：只在窄螢幕下且實際 overflow 時顯示右側漸層
const scrollerRef = ref<HTMLElement | null>(null)
const showRightFade = ref(false)

function updateFade () {
  const el = scrollerRef.value
  if (!el) {
    showRightFade.value = false
    return
  }
  const { scrollLeft, scrollWidth, clientWidth } = el
  showRightFade.value = scrollLeft + clientWidth < scrollWidth - 4
}

function onScroll () {
  updateFade()
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  updateFade()
  if (typeof ResizeObserver !== 'undefined' && scrollerRef.value) {
    resizeObserver = new ResizeObserver(updateFade)
    resizeObserver.observe(scrollerRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>
