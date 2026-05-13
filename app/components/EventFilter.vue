<template>
  <div
    v-if="(filterState.selectedCategory === 'photography' || filterState.selectedCategory === 'digital') && availableEvents.length > 0"
    :class="variant === 'rail' ? 'mb-6' : 'mb-8'"
  >
    <!--
      Rail variant：垂直列，無摘要鈕（rail 僅 lg+ 顯示，無需手機 collapse 邏輯）
      Horizontal variant：原本的小標 + 手機 collapse 結構
    -->
    <div v-if="variant !== 'rail'" class="mb-3 flex items-end justify-between gap-3">
      <p class="jp-section-label">Event</p>
      <!-- 手機（< sm）：摘要 + 展開鈕；展開後改成「收起」 -->
      <button
        v-if="hasMultipleEvents"
        type="button"
        class="sm:hidden inline-flex items-center gap-2 text-[0.65rem] tracking-[0.32em] uppercase text-stone-500 dark:text-stone-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors py-1"
        :aria-expanded="mobileExpanded"
        aria-controls="event-filter-mobile-list"
        @click="mobileExpanded = !mobileExpanded"
      >
        <span class="font-jp tracking-[0.3em]">{{ mobileExpanded ? '収' : '選' }}</span>
        <span>{{ mobileExpanded ? 'Close' : `${availableEvents.length} Events` }}</span>
        <svg
          class="w-3 h-3 transition-transform duration-300"
          :class="{ 'rotate-180': mobileExpanded }"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
    </div>

    <!-- Rail variant：小標單獨一行（無 collapse 鈕） -->
    <p v-else class="jp-section-label mb-3">Event</p>

    <!--
      手機（< sm）收束視圖：當前選擇 + 全部數量。點摘要列也展開。
      設計理由（design brief priority 1）：mobile 上 event chips 水平溢出讓人不確定能不能滑，
      改為「目前選了什麼 / 點開抽屜」的收束結構，把策展焦點還給作品。
      Rail variant 跳過（rail 僅 lg+ 顯示）。
    -->
    <button
      v-if="variant !== 'rail' && hasMultipleEvents && !mobileExpanded"
      type="button"
      class="sm:hidden w-full flex items-baseline justify-between gap-3 border-b border-stone-200 dark:border-stone-700 pb-2.5 text-left hover:border-accent-400/60 transition-colors"
      :aria-label="`目前篩選：${currentMobileLabel}，按下展開所有事件`"
      @click="mobileExpanded = true"
    >
      <span class="text-sm font-light tracking-wide text-stone-800 dark:text-stone-100 truncate">
        {{ currentMobileLabel }}
      </span>
      <span class="text-xs tabular-nums tracking-wide text-accent-500 dark:text-accent-400 flex-shrink-0">
        {{ currentMobileCount }}
      </span>
    </button>

    <!--
      Rail variant：固定垂直列，max-h + overflow 防溢出（11 個 chips 垂直堆 ~ 300px+）
      Horizontal：原本桌機 wrap / 手機展開排列
    -->
    <div
      id="event-filter-mobile-list"
      :class="variant === 'rail'
        ? 'flex flex-col max-h-[44vh] overflow-y-auto -mx-2 px-2 hide-scrollbar'
        : ['-mx-1 gap-x-1 gap-y-1 px-1 sm:flex-wrap sm:overflow-visible sm:pb-0', mobileExpanded ? 'flex flex-wrap pb-1' : 'hidden sm:flex']"
    >
      <!-- 全部事件 -->
      <button
        type="button"
        :class="[
          'relative touch-manipulation font-light tracking-wide transition-all duration-300 group rounded-none',
          variant === 'rail'
            ? 'flex items-baseline justify-between gap-3 px-2 py-1.5 text-left'
            : 'px-4 py-2.5',
          filterState.selectedEvent === null
            ? 'text-stone-800 dark:text-stone-100'
            : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
        ]"
        @click="onSelectEvent(null)"
      >
        <!--
          選中底線（漸層暈染）— horizontal 版置於 button 底；
          rail 版改為左側 hairline 直條，配合垂直列邏輯。
        -->
        <span
          v-if="variant !== 'rail'"
          :class="[
            'absolute bottom-0 left-1/2 -translate-x-1/2 h-px transition-all duration-500 ease-out',
            filterState.selectedEvent === null
              ? 'w-full bg-gradient-to-r from-transparent via-accent-500 dark:via-accent-400 to-transparent'
              : 'w-0 bg-transparent'
          ]"
        />
        <span
          v-else
          :class="[
            'absolute left-0 top-1/2 -translate-y-1/2 w-px transition-all duration-300 ease-out',
            filterState.selectedEvent === null
              ? 'h-4/5 bg-accent-500 dark:bg-accent-400'
              : 'h-0 bg-transparent'
          ]"
        />
        <!-- 計數格式 name · n（rail 改為 name 與 count 兩端對齊） -->
        <span class="text-xs truncate">全部事件</span>
        <span v-if="variant !== 'rail'" class="mx-1.5 text-stone-300 dark:text-stone-700 text-xs">·</span>
        <span
          class="text-xs tabular-nums transition-colors duration-300 shrink-0"
          :class="[
            variant === 'rail' ? '' : '',
            filterState.selectedEvent === null
              ? 'text-accent-500 dark:text-accent-400'
              : 'text-stone-400 dark:text-stone-600'
          ]"
        >{{ totalWorksInCategory }}</span>
      </button>

      <!-- 垂直分隔線（桌機 horizontal 才出現） -->
      <span v-if="variant !== 'rail'" class="hidden self-center sm:block w-px h-4 bg-stone-200/60 dark:bg-stone-700/50 mx-1"/>

      <!-- 各事件 -->
      <template v-for="(event, index) in availableEvents" :key="event.name">
        <button
          type="button"
          :class="[
            'relative touch-manipulation font-light tracking-wide transition-all duration-300 group rounded-none',
            variant === 'rail'
              ? 'flex items-baseline justify-between gap-3 px-2 py-1.5 text-left'
              : 'px-4 py-2.5',
            filterState.selectedEvent === event.name
              ? 'text-stone-800 dark:text-stone-100'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
          ]"
          @click="onSelectEvent(event.name)"
        >
          <!-- 選中底線 / 側線 -->
          <span
            v-if="variant !== 'rail'"
            :class="[
              'absolute bottom-0 left-1/2 -translate-x-1/2 h-px transition-all duration-500 ease-out',
              filterState.selectedEvent === event.name
                ? 'w-full bg-gradient-to-r from-transparent via-accent-500 dark:via-accent-400 to-transparent'
                : 'w-0 bg-transparent'
            ]"
          />
          <span
            v-else
            :class="[
              'absolute left-0 top-1/2 -translate-y-1/2 w-px transition-all duration-300 ease-out',
              filterState.selectedEvent === event.name
                ? 'h-4/5 bg-accent-500 dark:bg-accent-400'
                : 'h-0 bg-transparent'
            ]"
          />
          <!-- 計數格式 name · n -->
          <span class="text-xs truncate">{{ event.name }}</span>
          <span v-if="variant !== 'rail'" class="mx-1.5 text-stone-300 dark:text-stone-700 text-xs">·</span>
          <span
            class="text-xs tabular-nums transition-colors duration-300 shrink-0"
            :class="filterState.selectedEvent === event.name
              ? 'text-accent-500 dark:text-accent-400'
              : 'text-stone-400 dark:text-stone-600'"
          >{{ event.count }}</span>
        </button>

        <!-- 事件間的細分隔線（horizontal 桌機才顯示） -->
        <span
          v-if="variant !== 'rail' && index < availableEvents.length - 1"
          class="hidden sm:inline-block self-center w-px h-3 bg-stone-200/50 dark:bg-stone-700/40 mx-0.5"
        />
      </template>
    </div>

    <!-- 底部 hairline（兩端漸淡）— rail 版間距更緊湊 -->
    <div :class="['jp-hairline w-full', variant === 'rail' ? 'mt-3' : 'mt-4']"/>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '~/stores/gallery'

withDefaults(defineProps<{
  /**
   * default: 桌機橫向 chips / 手機 collapse 摘要
   * rail: 桌機左側 rail 內垂直列（lg+ 專用，不渲染 mobile collapse）
   */
  variant?: 'default' | 'rail'
}>(), { variant: 'default' })

const galleryStore = useGalleryStore()
const {
  filterState,
  availableEvents,
  photographyWorks,
  digitalWorks,
  currentWorks
} = storeToRefs(galleryStore)
const { setSelectedEvent } = galleryStore

const mobileExpanded = ref(false)
const hasMultipleEvents = computed(() => availableEvents.value.length > 0)

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

const currentMobileLabel = computed(() => {
  const name = filterState.value.selectedEvent
  if (!name) return '全部事件'
  return name
})

const currentMobileCount = computed(() => {
  const name = filterState.value.selectedEvent
  if (!name) return totalWorksInCategory.value
  return availableEvents.value.find(e => e.name === name)?.count ?? 0
})

const onSelectEvent = (name: string | null) => {
  setSelectedEvent(name)
  // 選完即收起，回到作品瀏覽（手機體驗）
  mobileExpanded.value = false
}

// 切換分類時收起 mobile 展開狀態
// 2026-05-09：移除 'all' 後 digital / photography 兩類都支援 event filter，
// 不再需要「切到 all 時清 event」邏輯。
watch(() => filterState.value.selectedCategory, () => {
  mobileExpanded.value = false
})
</script>
