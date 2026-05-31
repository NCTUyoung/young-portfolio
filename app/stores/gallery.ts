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
  FilterState,
  TrackManifesto
} from '~~/shared/types/gallery'

export const useGalleryStore = defineStore('gallery', () => {
  // 基本狀態
  const digitalData = ref<{ works: GalleryItem[], eventStats: Record<string, number>, manifesto?: TrackManifesto }>({ works: [], eventStats: {} })
  const photographyData = ref<{ works: GalleryItem[], eventStats: Record<string, number>, manifesto?: TrackManifesto }>({ works: [], eventStats: {} })
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

  /**
   * R7：軌道入口導言（繪 / 影）。讀 JSON 頂層 trackManifesto，
   * leafLabel 缺省時用實際 works 數補上「N 葉」。
   * 終結「Featured cap 只吃某張剛好帶的 strongest_line」的資料偏食。
   */
  function resolveManifesto (
    raw: TrackManifesto | undefined,
    works: GalleryItem[],
    fallback: TrackManifesto
  ): TrackManifesto {
    const base = raw ?? fallback
    const leafLabel = base.leafLabel ?? `${works.length} 葉`
    return { ...base, leafLabel }
  }
  const digitalManifesto = computed<TrackManifesto>(() => resolveManifesto(
    digitalData.value?.manifesto,
    digitalWorks.value,
    { kana: '繪', roman: 'Digital Art', declaration: '線で世界を起こす', startYear: 2018, ink: 'rgb(196 110 58)' }
  ))
  const photographyManifesto = computed<TrackManifesto>(() => resolveManifesto(
    photographyData.value?.manifesto,
    photographyWorks.value,
    { kana: '影', roman: 'Photography', declaration: '光を待つことを覚えた', startYear: 2024, ink: 'rgb(58 86 122)' }
  ))

  /**
   * R10：精選年尺（FeaturedYearRuler 用）。
   * critic R9 jump-out：「別再雕轉場——把 startYear 升級成每張作品的『距起算第幾年』
   * 敘事 metadata，讓六年尺長駐在 gallery 內容本身，而非只活在 1.7 秒過場幕裡」。
   *
   * 回應：在資料／衍生層直接算出每張 featured 作品的「第幾年（yearIndex = 該作年份 − 軌起始年）」，
   * 並把雙軌共用一把 0..span 的整數年尺。讓「繪 8 年 vs 影 2 年」成為版面上的實體距離，
   * 首屏即見，不靠等待。年差角標（第 N 年）掛在每個節點上 = 敘事活在內容，不在轉場。
   */
  const FEATURED_TAG = 'featured' as const
  function yearOfWork (item: GalleryItem): number {
    const m = String(item.time || item.event?.name || '').match(/(\d{4})/)
    return m ? Number(m[1]) : 0
  }
  function buildTrackNodes (works: GalleryItem[], startYear: number) {
    return works
      .filter(w => Array.isArray(w.series) && w.series.includes(FEATURED_TAG))
      .map(w => ({ work: w, year: yearOfWork(w) }))
      .filter(n => n.year > 0)
      .map(n => ({ work: n.work, year: n.year, yearIndex: Math.max(0, n.year - startYear) }))
      .sort((a, b) => a.yearIndex - b.yearIndex)
  }
  /** 同年同軌只保留最後一張代表，避免年尺上節點重疊糊成一團 */
  function dedupeByYear<T extends { yearIndex: number }> (nodes: T[]): T[] {
    const byYear = new Map<number, T>()
    for (const n of nodes) byYear.set(n.yearIndex, n)
    return [...byYear.values()].sort((a, b) => a.yearIndex - b.yearIndex)
  }
  const featuredChronology = computed(() => {
    const kaiStart = digitalManifesto.value.startYear
    const kageStart = photographyManifesto.value.startYear
    const kaiNodes = dedupeByYear(buildTrackNodes(digitalWorks.value, kaiStart))
    const kageNodes = dedupeByYear(buildTrackNodes(photographyWorks.value, kageStart))
    // 共用年尺：以「繪起始年」為原點 0，跨度取兩軌最遠的一年
    const origin = Math.min(kaiStart, kageStart)
    const lastYear = Math.max(
      kaiStart + (kaiNodes.at(-1)?.yearIndex ?? 0),
      kageStart + (kageNodes.at(-1)?.yearIndex ?? 0)
    )
    const span = Math.max(1, lastYear - origin)
    // 把每軌節點重新投影到共用尺（offset = 軌起始年 − 共用原點）
    const project = (nodes: ReturnType<typeof buildTrackNodes>, start: number) =>
      nodes.map(n => ({ ...n, rulerPos: (start - origin + n.yearIndex) / span }))
    return {
      origin,
      span,
      kai: { startYear: kaiStart, nodes: project(kaiNodes, kaiStart) },
      kage: { startYear: kageStart, nodes: project(kageNodes, kageStart) }
    }
  })

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
    selectedCategory: 'photography',
    selectedEvent: null,
    searchQuery: '',
    yearFilter: null
  })

  // 2026-05-09 migration：舊版 localStorage 可能緩存 selectedCategory='all'。
  // 型別已收斂為 'digital' | 'photography'；任何非合法值一律 coerce 到 photography 預設。
  if (filterState.value.selectedCategory !== 'digital' && filterState.value.selectedCategory !== 'photography') {
    filterState.value.selectedCategory = 'photography'
  }

  const expandedGroups = ref<Record<string, boolean>>({})

  /** 至少完成一次 hydrate 或 loadAllWorks，供事件路由邏輯避免在資料未到前誤把合法路徑導走 */
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

  /**
   * R9：軌道切換轉場觸發器。
   * setSelectedCategory 偵測到「類別真的變了」時，在 client 端 bump 一個 tick，
   * 記下「從哪軌切到哪軌」。GalleryTrackTransition（掛在 app.vue，跨路由常駐）watch
   * 此 tick 播放「起算尺」overlay。放在 store 而非元件內 watch 的原因：
   * 切 tab 會走 router param 變更，page 元件在某些情況下會被 transition 卸載，
   * 元件內 watch 的 prev 會丟失；store 是全站單例，trigger 不會因路由卸載而消失。
   */
  const trackTransitionTick = ref(0)
  const trackTransitionTo = ref<'digital' | 'photography'>('photography')

  const setSelectedCategory = (category: 'digital' | 'photography') => {
    const prev = filterState.value.selectedCategory
    filterState.value.selectedCategory = category
    clearCache(['mixedItems'])
    if (import.meta.client && prev && prev !== category) {
      trackTransitionTo.value = category
      trackTransitionTick.value += 1
    }
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
    filterState.value.selectedCategory = 'photography'
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
    digitalManifesto,
    photographyManifesto,
    featuredChronology,
    trackTransitionTick,
    trackTransitionTo,
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
