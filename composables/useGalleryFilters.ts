import { computed, ref, type Ref } from 'vue'
import type { GalleryItem, FilterState } from '~/types/gallery'
import {
  searchImages,
  filterImagesByYear,
  filterImagesByCategory,
  filterImagesByEvent,
  sortImagesByTime,
  filterVisibleImages,
  getAvailableYears,
  getAvailableEvents
} from '~/utils/galleryUtils'

/**
 * 畫廊篩選組合式函數
 * 統一處理所有篩選邏輯
 */
export const useGalleryFilters = (
  allImages: Ref<GalleryItem[]>,
  filterState: Ref<FilterState>
) => {
  // 是否正在篩選
  const isFiltering = computed(() => {
    return filterState.value.searchQuery.trim() !== '' ||
           filterState.value.yearFilter !== null ||
           filterState.value.selectedEvent !== null ||
           filterState.value.selectedCategory !== 'all'
  })

  // 基本篩選後的圖片
  const baseFilteredImages = computed(() => {
    let filtered = filterVisibleImages(allImages.value)

    // 按類別篩選
    filtered = filterImagesByCategory(filtered, filterState.value.selectedCategory)

    // 按事件篩選
    filtered = filterImagesByEvent(filtered, filterState.value.selectedEvent)

    return sortImagesByTime(filtered)
  })

  // 完全篩選後的圖片
  const filteredImages = computed(() => {
    let filtered = baseFilteredImages.value

    // 搜尋篩選
    filtered = searchImages(filtered, filterState.value.searchQuery)

    // 年份篩選
    filtered = filterImagesByYear(filtered, filterState.value.yearFilter)

    return sortImagesByTime(filtered)
  })

  // 可用的年份選項
  const availableYears = computed(() => {
    return getAvailableYears(baseFilteredImages.value)
  })

  // 可用的事件選項
  const availableEvents = computed(() => {
    return getAvailableEvents(baseFilteredImages.value)
  })

  // 類別統計
  const categoryStats = computed(() => {
    const digital = allImages.value.filter(img => img.category === 'digital')
    const photography = allImages.value.filter(img => img.category === 'photography')

    return {
      all: allImages.value.length,
      digital: digital.length,
      photography: photography.length
    }
  })

  // 篩選結果統計
  const filterStats = computed(() => {
    const total = baseFilteredImages.value.length
    const filtered = filteredImages.value.length

    return {
      total,
      filtered,
      isFiltered: isFiltering.value,
      percentage: total > 0 ? Math.round((filtered / total) * 100) : 0
    }
  })

  // 重置所有篩選
  const resetFilters = () => {
    filterState.value.selectedCategory = 'all'
    filterState.value.selectedEvent = null
    filterState.value.searchQuery = ''
    filterState.value.yearFilter = null
  }

  // 重置搜尋
  const resetSearch = () => {
    filterState.value.searchQuery = ''
  }

  // 重置年份篩選
  const resetYearFilter = () => {
    filterState.value.yearFilter = null
  }

  // 重置事件篩選
  const resetEventFilter = () => {
    filterState.value.selectedEvent = null
  }

  // 設置快速篩選（預設組合）
  const setQuickFilter = (type: 'recent' | 'this-year' | 'digital-only' | 'photography-only') => {
    resetFilters()

    const currentYear = new Date().getFullYear().toString()

    switch (type) {
      case 'recent':
        // 最近的作品（當年）
        filterState.value.yearFilter = currentYear
        break

      case 'this-year':
        // 本年度作品
        filterState.value.yearFilter = currentYear
        break

      case 'digital-only':
        // 僅數位作品
        filterState.value.selectedCategory = 'digital'
        break

      case 'photography-only':
        // 僅攝影作品
        filterState.value.selectedCategory = 'photography'
        break
    }
  }

  // 檢查是否有活躍的篩選
  const hasActiveFilters = computed(() => {
    return filterState.value.selectedCategory !== 'all' ||
           filterState.value.selectedEvent !== null ||
           filterState.value.searchQuery.trim() !== '' ||
           filterState.value.yearFilter !== null
  })

  return {
    // 狀態
    isFiltering,
    hasActiveFilters,

    // 篩選結果
    baseFilteredImages,
    filteredImages,

    // 選項
    availableYears,
    availableEvents,

    // 統計
    categoryStats,
    filterStats,

    // 操作方法
    resetFilters,
    resetSearch,
    resetYearFilter,
    resetEventFilter,
    setQuickFilter
  }
}