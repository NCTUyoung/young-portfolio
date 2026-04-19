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
} from '~~/shared/types/gallery'

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
  const photographyWorks = computed(() => photographyData.value?.works ?? [])

  /**
   * `eventStats`：由實際 works 即時重算，而非信任 JSON 內預先嵌入的統計。
   * 原本的 JSON `eventStats` 會出現「桃猿 vs 桃園」之類 typo 導致的幽靈鍵，
   * 或是事件改名後統計未同步；改 runtime 後永遠與可見作品一致。
   */
  function computeEventStats (works: GalleryItem[]): Record<string, number> {
    const out: Record<string, number> = {}
    for (const w of works) {
      const name = w.event?.name
      if (!name) continue
      out[name] = (out[name] || 0) + 1
    }
    return out
  }
  const eventStats = computed(() => computeEventStats(photographyWorks.value))
  const digitalEventStats = computed(() => computeEventStats(digitalWorks.value))

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

  /**
   * Memo 快取採簡易 LRU 防長時間瀏覽時無限成長。
   * 實測同一 session 內可能經過多次分類切換 + 搜尋，key 可能累積到數百，
   * 每項又持有整排作品陣列；超過 `MAX_CACHE_ENTRIES` 時丟最舊項。
   */
  const MAX_CACHE_ENTRIES = 64
  const cache = ref(new Map<string, unknown>())

  function cacheGet<T> (key: string): T | undefined {
    if (!cache.value.has(key)) return undefined
    // LRU touch：取出再放回以刷新插入順序
    const v = cache.value.get(key) as T
    cache.value.delete(key)
    cache.value.set(key, v)
    return v
  }

  function cacheSet<T> (key: string, value: T): void {
    if (cache.value.has(key)) cache.value.delete(key)
    cache.value.set(key, value)
    while (cache.value.size > MAX_CACHE_ENTRIES) {
      const oldestKey = cache.value.keys().next().value
      if (oldestKey === undefined) break
      cache.value.delete(oldestKey)
    }
  }

  const allWorks = computed(() => {
    const cacheKey = `allWorks-${digitalWorks.value.length}-${photographyWorks.value.length}`
    const hit = cacheGet<GalleryItem[]>(cacheKey)
    if (hit) return hit

    const sorted = combineAndSortAllWorks(digitalWorks.value, photographyWorks.value)
    cacheSet(cacheKey, sorted)
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

  /**
   * mixedPhotoItems 以 filteredItems（已套用搜尋 + 年份）為輸入，
   * 讓 UI 上新增的搜尋／年份濾器能直接影響畫面，而不是只改 store 的 `filteredItems` 無人使用。
   */
  const mixedPhotoItems = computed(() => {
    const cacheKey = `mixedItems-${filteredItems.value.length}-${JSON.stringify(filterState.value)}`
    const hit = cacheGet<ReturnType<typeof buildMixedPhotoItems>>(cacheKey)
    if (hit) return hit

    const sorted = buildMixedPhotoItems(filteredItems.value)
    cacheSet(cacheKey, sorted)
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
