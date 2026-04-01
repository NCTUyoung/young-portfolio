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

  // 計算屬性（?. 防 corrupted / 部分 hydrate 導致整包 undefined）
  const digitalWorks = computed(() => digitalData.value?.works ?? [])
  const digitalEventStats = computed(() => digitalData.value?.eventStats ?? {})
  const photographyWorks = computed(() => photographyData.value?.works ?? [])
  const eventStats = computed(() => photographyData.value?.eventStats ?? {})

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

  /** 至少完成一次 hydrate 或 loadAllWorks，供 ?event= 路由邏輯避免在資料未到前誤清網址 */
  const galleryDataReady = ref(false)

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
    try {
      await Promise.all([
        loadDigitalWorks(),
        loadPhotographyWorks()
      ])
    } finally {
      galleryDataReady.value = true
    }
  }

  /** SSR / useAsyncData：一次寫入兩類作品，避免重複 fetch */
  const hydrateFromPayload = (payload: {
    digital?: { works: GalleryItem[], eventStats: Record<string, number> }
    photography?: { works: GalleryItem[], eventStats: Record<string, number> }
  }) => {
    if (payload.digital && Array.isArray(payload.digital.works)) {
      digitalData.value = payload.digital
    }
    if (payload.photography && Array.isArray(payload.photography.works)) {
      photographyData.value = payload.photography
    }
    digitalError.value = null
    photographyError.value = null
    isLoadingDigital.value = false
    isLoadingPhotography.value = false
    galleryDataReady.value = true
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

  /**
   * localStorage 可能留下舊的 selectedEvent；與目前類別的 availableEvents 對不上時會篩出 0 張，畫面空白。
   */
  watch(
    [availableEvents, () => filterState.value.selectedEvent, () => filterState.value.selectedCategory, galleryDataReady],
    () => {
      if (import.meta.server) return
      if (!galleryDataReady.value) return
      const cat = filterState.value.selectedCategory
      if (cat !== 'digital' && cat !== 'photography') return
      const sel = filterState.value.selectedEvent
      if (sel === null) return
      const evs = availableEvents.value
      if (evs.length === 0) return
      const valid = new Set(evs.map(e => e.name))
      if (!valid.has(sel)) {
        setSelectedEvent(null)
      }
    },
    { flush: 'post' }
  )

  return {
    digitalWorks,
    photographyWorks,
    eventStats,
    digitalEventStats,
    expandedGroups,
    isLoading,
    filterState,
    galleryDataReady,

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
    hydrateFromPayload,
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
