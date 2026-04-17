<template>
  <div
    v-if="(filterState.selectedCategory === 'photography' || filterState.selectedCategory === 'digital') && availableEvents.length > 0"
    class="mb-8"
  >
    <!-- 小標（上方不再加 hairline，避免雙線堆疊） -->
    <p class="jp-section-label mb-3">Event</p>

    <!-- 底線 Tab 篩選列（窄螢幕可橫向捲動，避免多事件時換行過多） -->
    <div
      class="-mx-1 flex w-full max-w-full min-w-0 gap-x-1 gap-y-1 overflow-x-auto overflow-y-hidden overscroll-x-contain px-1 pb-1 [-webkit-overflow-scrolling:touch] sm:flex-wrap sm:overflow-visible sm:pb-0"
    >
      <!-- 全部事件 -->
      <button
        type="button"
        class="relative flex-shrink-0 touch-manipulation px-4 py-2.5 font-light tracking-wide transition-all duration-300 group rounded-none"
        :class="filterState.selectedEvent === null
          ? 'text-stone-800 dark:text-stone-100'
          : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'"
        @click="setSelectedEvent(null)"
      >
        <!-- 選中底線（漸層暈染） -->
        <span
          :class="[
            'absolute bottom-0 left-1/2 -translate-x-1/2 h-px transition-all duration-500 ease-out',
            filterState.selectedEvent === null
              ? 'w-full bg-gradient-to-r from-transparent via-accent-500 dark:via-accent-400 to-transparent'
              : 'w-0 bg-transparent'
          ]"
        />
        <!-- 計數格式 name · n -->
        <span class="text-xs">全部事件</span>
        <span class="mx-1.5 text-stone-300 dark:text-stone-700 text-xs">·</span>
        <span
          class="text-xs tabular-nums transition-colors duration-300"
          :class="filterState.selectedEvent === null
            ? 'text-accent-500 dark:text-accent-400'
            : 'text-stone-400 dark:text-stone-600'"
        >{{ totalWorksInCategory }}</span>
      </button>

      <!-- 垂直分隔線 -->
      <span class="hidden flex-shrink-0 self-center sm:block w-px h-4 bg-stone-200/60 dark:bg-stone-700/50 mx-1"/>

      <!-- 各事件 -->
      <template v-for="(event, index) in availableEvents" :key="event.name">
        <button
          type="button"
          class="relative flex-shrink-0 touch-manipulation px-4 py-2.5 font-light tracking-wide transition-all duration-300 group rounded-none"
          :class="filterState.selectedEvent === event.name
            ? 'text-stone-800 dark:text-stone-100'
            : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'"
          @click="setSelectedEvent(event.name)"
        >
          <!-- 選中底線（漸層暈染） -->
          <span
            :class="[
              'absolute bottom-0 left-1/2 -translate-x-1/2 h-px transition-all duration-500 ease-out',
              filterState.selectedEvent === event.name
                ? 'w-full bg-gradient-to-r from-transparent via-accent-500 dark:via-accent-400 to-transparent'
                : 'w-0 bg-transparent'
            ]"
          />
          <!-- 計數格式 name · n -->
          <span class="text-xs">{{ event.name }}</span>
          <span class="mx-1.5 text-stone-300 dark:text-stone-700 text-xs">·</span>
          <span
            class="text-xs tabular-nums transition-colors duration-300"
            :class="filterState.selectedEvent === event.name
              ? 'text-accent-500 dark:text-accent-400'
              : 'text-stone-400 dark:text-stone-600'"
          >{{ event.count }}</span>
        </button>

        <!-- 事件間的細分隔線（最後一個不加） -->
        <span
          v-if="index < availableEvents.length - 1"
          class="self-center w-px h-3 bg-stone-200/50 dark:bg-stone-700/40 mx-0.5"
        />
      </template>
    </div>

    <!-- 底部 hairline（兩端漸淡） -->
    <div class="jp-hairline w-full mt-4"/>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '~/stores/gallery'

const galleryStore = useGalleryStore()
const {
  filterState,
  availableEvents,
  photographyWorks,
  digitalWorks,
  currentWorks
} = storeToRefs(galleryStore)
const { setSelectedEvent } = galleryStore

// 「全部事件」顯示的是目前類別的總作品數（不受事件篩選影響）
const totalWorksInCategory = computed(() => {
  if (filterState.value.selectedCategory === 'digital') {
    return digitalWorks.value.length
  }
  if (filterState.value.selectedCategory === 'photography') {
    return photographyWorks.value.length
  }
  return currentWorks.value.length
})

// 當切換到不支援事件的類別時，自動清除事件選擇
watch(() => filterState.value.selectedCategory, (newCategory) => {
  if (newCategory === 'all' && filterState.value.selectedEvent) {
    setSelectedEvent(null)
  }
})
</script>
