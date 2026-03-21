import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useLocalStorage, useDebounceFn } from '@vueuse/core'
import { fetchDigitalWorks, fetchPhotographyWorks } from '~/stores/galleryLoaders'
import { GALLERY_EVENT_COORDS_FALLBACK } from '~/stores/galleryConstants'
import {
  combineAndSortAllWorks,
  getCurrentWorks,
  applySearchAndYearFilter,
  buildGroupedWorks,
  buildMixedPhotoItems,
  buildEventLocations,
  buildAvailableEvents,
  buildAvailableYears,
  shouldShowEventOnTimeline as shouldShowEventOnTimelineForWorks
} from '~/stores/gallerySelectors'
import type {
  GalleryItem,
  FilterState
} from '~/types/gallery'

export const useGalleryStore = defineStore('gallery', () => {
  // 基本狀態
  const digitalData = ref<{ works: GalleryItem[], eventStats: Record<string, number> }>({ works: [], eventStats: {} })
  const photographyData = ref<{ works: GalleryItem[], eventStats: Record<string, number> }>({ works: [], eventStats: {} })
  const isLoadingDigital = ref(false)
  const isLoadingPhotography = ref(false)
  const digitalError = ref<string | null>(null)
  const photographyError = ref<string | null>(null)

  // 計算屬性
  const digitalWorks = computed(() => digitalData.value.works)
  const digitalEventStats = computed(() => digitalData.value.eventStats)
  const photographyWorks = computed(() => photographyData.value.works)
  const eventStats = computed(() => photographyData.value.eventStats)

  const isLoading = computed(() => isLoadingDigital.value || isLoadingPhotography.value)

  // 載入方法
  const loadDigitalWorks = async () => {
    isLoadingDigital.value = true
    digitalError.value = null

    try {
      const result = await fetchDigitalWorks()
      digitalData.value = result
    } catch (error: unknown) {
      digitalError.value = error instanceof Error ? error.message : '載入數位作品失敗'
    } finally {
      isLoadingDigital.value = false
    }
  }

  const loadPhotographyWorks = async () => {
    isLoadingPhotography.value = true
    photographyError.value = null

    try {
      const result = await fetchPhotographyWorks()
      photographyData.value = result
    } catch (error: unknown) {
      photographyError.value = error instanceof Error ? error.message : '載入攝影作品失敗'
    } finally {
      isLoadingPhotography.value = false
    }
  }

  const filterState = useLocalStorage<FilterState>('gallery-filters', {
    selectedCategory: 'all',
    selectedEvent: null,
    searchQuery: '',
    yearFilter: null
  })

  const expandedGroups = ref<Record<string, boolean>>({})

  const cache = ref(new Map())

  const allWorks = computed(() => {
    const cacheKey = `allWorks-${digitalWorks.value.length}-${photographyWorks.value.length}`

    if (cache.value.has(cacheKey)) {
      return cache.value.get(cacheKey)
    }

    const sorted = combineAndSortAllWorks(digitalWorks.value, photographyWorks.value)
    cache.value.set(cacheKey, sorted)
    return sorted
  })

  const currentWorks = computed(() =>
    getCurrentWorks(
      filterState.value,
      digitalWorks.value,
      photographyWorks.value,
      allWorks.value
    )
  )

  const filteredItems = computed(() =>
    applySearchAndYearFilter(
      currentWorks.value,
      filterState.value.searchQuery,
      filterState.value.yearFilter
    )
  )

  const groupedWorks = computed(() => buildGroupedWorks(currentWorks.value))

  const mixedPhotoItems = computed(() => {
    const cacheKey = `mixedItems-${currentWorks.value.length}-${JSON.stringify(filterState.value)}`

    if (cache.value.has(cacheKey)) {
      return cache.value.get(cacheKey)
    }

    const sorted = buildMixedPhotoItems(currentWorks.value)
    cache.value.set(cacheKey, sorted)
    return sorted
  })

  const eventLocations = computed(() =>
    buildEventLocations(photographyWorks.value, GALLERY_EVENT_COORDS_FALLBACK)
  )

  const availableEvents = computed(() =>
    buildAvailableEvents(filterState.value, digitalWorks.value, photographyWorks.value)
  )

  const availableYears = computed(() => buildAvailableYears(allWorks.value))

  const categoryStats = computed(() => {
    const allWorksLength = digitalWorks.value.length + photographyWorks.value.length
    return {
      all: allWorksLength,
      digital: digitalWorks.value.length,
      photography: photographyWorks.value.length
    }
  })

  const loadAllWorks = async () => {
    await Promise.all([
      loadDigitalWorks(),
      loadPhotographyWorks()
    ])
  }

  const debouncedSetSearchQuery = useDebounceFn((query: string) => {
    filterState.value.searchQuery = query
    clearCache(['mixedItems', 'filteredItems'])
  }, 300)

  const setSelectedCategory = (category: 'all' | 'digital' | 'photography') => {
    filterState.value.selectedCategory = category
    clearCache(['mixedItems'])
  }

  const setSelectedEvent = (event: string | null) => {
    filterState.value.selectedEvent = event
    clearCache(['mixedItems'])
  }

  const setSearchQuery = (query: string) => {
    debouncedSetSearchQuery(query)
  }

  const setYearFilter = (year: string | null) => {
    filterState.value.yearFilter = year
    clearCache(['filteredItems'])
  }

  const clearFilters = () => {
    filterState.value.selectedCategory = 'all'
    filterState.value.selectedEvent = null
    filterState.value.searchQuery = ''
    filterState.value.yearFilter = null
    clearCache()
  }

  const toggleGroupExpansion = (groupKey: string) => {
    const current = expandedGroups.value[groupKey]
    if (current === undefined) {
      expandedGroups.value[groupKey] = false
    } else {
      expandedGroups.value[groupKey] = !current
    }
  }

  const shouldShowEventOnTimeline = (image: GalleryItem, index: number): boolean => {
    if (!image.event) return false
    return shouldShowEventOnTimelineForWorks(currentWorks.value, index)
  }

  const clearCache = (keys?: string[]) => {
    if (keys) {
      keys.forEach(key => {
        for (const cacheKey of cache.value.keys()) {
          if (cacheKey.includes(key)) {
            cache.value.delete(cacheKey)
          }
        }
      })
    } else {
      cache.value.clear()
    }
  }

  const refreshData = async () => {
    clearCache()
    await loadAllWorks()
  }

  watch([digitalData, photographyData], () => {
    clearCache(['allWorks', 'mixedItems'])
  }, { deep: true })

  return {
    digitalWorks,
    photographyWorks,
    eventStats,
    digitalEventStats,
    expandedGroups,
    isLoading,
    filterState,

    allWorks,
    currentWorks,
    filteredItems,
    groupedWorks,
    mixedPhotoItems,
    eventLocations,
    availableEvents,
    availableYears,
    categoryStats,

    loadAllWorks,
    loadDigitalWorks,
    loadPhotographyWorks,
    setSelectedCategory,
    setSelectedEvent,
    setSearchQuery,
    setYearFilter,
    clearFilters,
    toggleGroupExpansion,
    shouldShowEventOnTimeline,
    refreshData,
    clearCache,

    digitalError,
    photographyError
  }
})
