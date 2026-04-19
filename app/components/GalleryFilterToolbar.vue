<template>
  <!-- 搜尋 + 年份篩選：低調一行，與全站「細線／簡素」呼應；手機上由左排列 -->
  <div v-if="showToolbar" class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <!-- 搜尋欄：hairline 下底線、無框 -->
    <label class="relative flex min-w-0 flex-1 items-center gap-2 border-b border-stone-200 dark:border-stone-700 focus-within:border-accent-400 dark:focus-within:border-accent-500 transition-colors">
      <Icon name="lucide:search" class="w-4 h-4 text-stone-400 dark:text-stone-500 shrink-0" aria-hidden="true"/>
      <input
        :value="filterState.searchQuery"
        type="search"
        :placeholder="searchPlaceholder"
        class="w-full bg-transparent py-2 text-sm font-light tracking-wide text-stone-700 dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-600 placeholder:font-light focus:outline-none"
        :aria-label="searchPlaceholder"
        @input="onSearchInput"
      >
      <button
        v-if="filterState.searchQuery"
        type="button"
        class="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
        aria-label="清除搜尋"
        @click="clearSearch"
      >
        <Icon name="lucide:x" class="w-3.5 h-3.5" aria-hidden="true"/>
      </button>
    </label>

    <!-- 年份：純文字底線選單，展開時顯示年度與數量 -->
    <div v-if="availableYears.length > 1" class="flex items-center gap-2 whitespace-nowrap">
      <span class="jp-section-label !text-[0.6rem]">Year</span>
      <select
        :value="filterState.yearFilter ?? ''"
        class="min-w-[6rem] border-b border-stone-200 dark:border-stone-700 bg-transparent pb-1 text-sm font-light tracking-wide text-stone-700 dark:text-stone-200 focus:border-accent-400 focus:outline-none"
        aria-label="依年份篩選"
        @change="onYearChange"
      >
        <option value="">全部年份</option>
        <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '~/stores/gallery'

const galleryStore = useGalleryStore()
const { filterState, availableYears } = storeToRefs(galleryStore)
const { setSearchQuery, setYearFilter } = galleryStore

const showToolbar = computed(() => true)

const searchPlaceholder = computed(() => {
  const cat = filterState.value.selectedCategory
  if (cat === 'digital') return '搜尋數位作品（標題、描述、標籤）'
  if (cat === 'photography') return '搜尋攝影作品（標題、描述、標籤）'
  return '搜尋作品（標題、描述、標籤）'
})

const onSearchInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  setSearchQuery(target.value)
}

const clearSearch = () => {
  setSearchQuery('')
}

const onYearChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const value = target.value
  setYearFilter(value === '' ? null : value)
}
</script>
