<template>
  <div class="gallery-filter p-4 bg-white rounded-lg shadow-md mb-6">
    <!-- 搜尋欄 -->
    <div class="mb-4 relative">
      <div class="relative">
        <input
          v-model="localSearchQuery"
          type="text"
          placeholder="搜尋作品..."
          class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          :class="{ 'pr-10': localSearchQuery }"
        >
        <!-- 搜尋圖示 -->
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>

        <!-- 清除搜尋按鈕 -->
        <button
          v-if="localSearchQuery"
          @click="clearSearch"
          class="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
        >
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- 搜尋狀態指示 -->
      <div v-if="isSearching" class="absolute right-2 top-2">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    </div>

    <!-- 分類過濾 -->
    <div class="mb-4">
      <h4 class="text-sm font-medium text-gray-700 mb-2">分類</h4>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="(count, category) in categoryStats"
          :key="category"
          @click="setSelectedCategory(category as any)"
          :class="[
            'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105',
            filterState.selectedCategory === category
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
          ]"
        >
          {{ getCategoryLabel(category) }}
          <span class="ml-1 opacity-75">({{ count }})</span>
        </button>
      </div>
    </div>

    <!-- 年份過濾 -->
    <div class="mb-4">
      <h4 class="text-sm font-medium text-gray-700 mb-2">年份</h4>
      <div class="flex flex-wrap gap-2">
        <button
          @click="setYearFilter(null)"
          :class="[
            'px-3 py-1 rounded text-sm transition-all duration-200 transform hover:scale-105',
            !filterState.yearFilter
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
          ]"
        >
          所有年份
        </button>
        <button
          v-for="year in availableYears"
          :key="year"
          @click="setYearFilter(year)"
          :class="[
            'px-3 py-1 rounded text-sm transition-all duration-200 transform hover:scale-105',
            filterState.yearFilter === year
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
          ]"
        >
          {{ year }}
        </button>
      </div>
    </div>

    <!-- 統計和操作 -->
    <div class="flex justify-between items-center pt-4 border-t border-gray-200">
      <div class="flex items-center space-x-4">
        <span class="text-sm text-gray-600">
          顯示 <span class="font-semibold text-blue-600">{{ filteredItems.length }}</span> / {{ allWorks.length }} 個作品
        </span>

        <!-- 篩選狀態指示 -->
        <div v-if="hasActiveFilters" class="flex items-center text-xs text-orange-600">
          <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd"></path>
          </svg>
          已套用篩選
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <!-- 重新整理按鈕 -->
        <button
          @click="refreshData"
          class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title="重新整理"
          :disabled="isLoading"
        >
          <svg
            class="w-4 h-4"
            :class="{ 'animate-spin': isLoading }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </button>

        <!-- 清除過濾器 -->
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-105 duration-200"
        >
          清除篩選
        </button>
      </div>
    </div>

    <!-- 載入狀態 -->
    <div v-if="isLoading" class="text-center py-4 border-t border-gray-200 mt-4">
      <div class="inline-flex items-center">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
        <span class="text-gray-600">載入中...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '~/stores/gallery'
import { useGalleryFilters } from '~/composables/useGalleryFilters'
import { useDebounceFn, useStorage } from '@vueuse/core'

const galleryStore = useGalleryStore()

// 使用 storeToRefs 來保持響應性
const {
  allWorks,
  filterState,
  isLoading
} = storeToRefs(galleryStore)

// 使用新的篩選 composable
const galleryFilters = useGalleryFilters(allWorks, filterState)

// 從 composable 獲取篩選相關狀態和方法
const {
  filteredImages: filteredItems,
  availableYears,
  categoryStats,
  hasActiveFilters,
  resetFilters: clearFilters
} = galleryFilters

// 使用 actions
const {
  setSelectedCategory,
  setSearchQuery,
  setYearFilter
} = galleryStore

// 本地搜尋狀態
const localSearchQuery = ref(filterState.value.searchQuery)
const isSearching = ref(false)

// 使用 VueUse 的防抖功能
const debouncedSearch = useDebounceFn((query: string) => {
  setSearchQuery(query)
  isSearching.value = false
}, 300)

// 監聽本地搜尋輸入
watch(localSearchQuery, (newQuery) => {
  isSearching.value = true
  debouncedSearch(newQuery)
})

// 使用 VueUse 儲存使用者偏好
const userPreferences = useStorage('gallery-filter-preferences', {
  lastCategory: 'all',
  rememberFilters: true
})

// 分類標籤映射
const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    all: '全部',
    digital: '數位繪圖',
    photography: '攝影作品'
  }
  return labels[category] || category
}

// 方法
const clearSearch = () => {
  localSearchQuery.value = ''
  setSearchQuery('')
  isSearching.value = false
}

const refreshData = () => {
  // 重新載入資料
  galleryStore.refreshData()
}

// 儲存使用者偏好
watch(() => filterState.value.selectedCategory, (newCategory) => {
  if (userPreferences.value.rememberFilters) {
    userPreferences.value.lastCategory = newCategory
  }
})

// 初始化時恢復使用者偏好
onMounted(() => {
  if (userPreferences.value.rememberFilters && userPreferences.value.lastCategory !== 'all') {
    setSelectedCategory(userPreferences.value.lastCategory as any)
  }
})
</script>

<style scoped>
.gallery-filter {
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.9);
}

/* 自定義滾動條樣式 */
.gallery-filter::-webkit-scrollbar {
  width: 6px;
}

.gallery-filter::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.gallery-filter::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.gallery-filter::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>