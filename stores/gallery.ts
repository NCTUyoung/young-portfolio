import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useLocalStorage, useDebounceFn } from '@vueuse/core'
import {
  sortImagesByTime,
  calculateTimeRange
} from '~/utils/galleryUtils'
import { generateImageId } from '~/utils/imageUtils'
import { formatDateFull } from '~/utils/formatters'
import type {
  GalleryItem,
  PhotoEvent,
  EventGroup,
  MixedPhotoItem,
  FilterState,
  DigitalArtItem,
  PhotographyItem,
  GalleryData,
  PhotographyData
} from '~/types/gallery'

type EventLocationPoint = {
  name: string
  lat: number
  lng: number
  coverFilename: string
  timeRange: string
  count: number
  location?: string
}

// 類型定義已移至 types/gallery.ts，通過上方 import 語句導入

// 這些工具函數已移至 utils/galleryUtils.ts
// 在 return 語句中會重新導出以保持向後兼容

// 數據轉換工具函數
const transformDigitalWork = (img: DigitalArtItem): GalleryItem => ({
  id: generateImageId('digital', img.filename),
  filename: img.filename,
  title: img.title,
  description: img.content,
  date: img.time,
  time: img.time,
  color: img.color,
  event: img.event || null,
  category: 'digital' as const,
  visible: true
})

const transformPhotographyWork = (img: PhotographyItem): GalleryItem => ({
  id: generateImageId('photography', img.filename),
  filename: img.filename,
  title: img.title,
  description: img.content,
  date: img.time,
  time: img.time,
  tags: img.tags || [],
  event: img.event || null,
  camera: img.camera,
  model: img.model,
  focalLength: img.focalLength,
  aperture: img.aperture,
  iso: img.iso,
  shutterSpeed: img.shutterSpeed,
  category: 'photography' as const,
  visible: true
})

// 在不同環境下穩健載入 JSON（本機 dev / GitHub Pages）
const fetchJsonWithFallback = async (filename: string): Promise<unknown> => {
  const candidates = [
    // GitHub Pages 專案頁面（/young-portfolio/）
    `/young-portfolio/${filename}`,
    // 一般根目錄
    `/${filename}`,
    // 相對路徑（本機 dev 也可能適用）
    filename
  ]

  let lastError: unknown = null

  for (const path of candidates) {
    try {
      return await $fetch(path)
    } catch (error) {
      lastError = error
    }
  }

  throw lastError
}

const fetchDigitalWorks = async (): Promise<{ works: GalleryItem[], eventStats: Record<string, number> }> => {
  const data = await fetchJsonWithFallback('galleryList.json') as GalleryData

  const works = sortImagesByTime(
    data.Img.map(transformDigitalWork)
  )

  return {
    works,
    eventStats: data.eventStats || {}
  }
}

const fetchPhotographyWorks = async (): Promise<{ works: GalleryItem[], eventStats: Record<string, number> }> => {
  const data = await fetchJsonWithFallback('photographyList.json') as PhotographyData

  const works = sortImagesByTime(
    data.Img.map(transformPhotographyWork)
  )

  return {
    works,
    eventStats: data.eventStats || {}
  }
}

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

    const combined = [
      ...digitalWorks.value.map(work => ({ ...work, category: 'digital' as const })),
      ...photographyWorks.value.map(work => ({ ...work, category: 'photography' as const }))
    ]

    const sorted = combined.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

    cache.value.set(cacheKey, sorted)
    return sorted
  })

  const currentWorks = computed(() => {
    const { selectedCategory, selectedEvent } = filterState.value

    let works: GalleryItem[] = []

    if (selectedCategory === 'digital') {
      works = digitalWorks.value

      if (selectedEvent) {
        works = works.filter(work => work.event && work.event.name === selectedEvent)
      }
    } else if (selectedCategory === 'photography') {
      works = photographyWorks.value

      if (selectedEvent) {
        works = works.filter(work => work.event && work.event.name === selectedEvent)
      }
    } else {
      works = allWorks.value
    }

    // 按時間排序 (最新的在前)
    return works.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  })

  const filteredItems = computed(() => {
    const { searchQuery, yearFilter } = filterState.value
    let filtered = currentWorks.value

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    if (yearFilter) {
      filtered = filtered.filter(item =>
        new Date(item.date).getFullYear().toString() === yearFilter
      )
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  })

  const groupedWorks = computed((): EventGroup[] => {
    const works = currentWorks.value
    const hasEvents = works.some(work => work.event)
    if (!hasEvents) return []

            // 手動分組（保持現有邏輯，但使用工具函數優化）
    const groups = new Map<string, GalleryItem[]>()

    works.forEach(work => {
      const eventName = work.event?.name || 'no-event'
      if (!groups.has(eventName)) {
        groups.set(eventName, [])
      }
      groups.get(eventName)!.push(work)
    })

    return Array.from(groups.entries()).map(([eventName, images]): EventGroup => ({
      eventName: eventName === 'no-event' ? null : eventName,
      eventInfo: images[0]?.event || undefined,
      images: sortImagesByTime(images),
      timeRange: calculateTimeRange(images)
    })).sort((a, b) => {
      const aLatest = Math.max(...a.images.map((img) => new Date(img.time).getTime()))
      const bLatest = Math.max(...b.images.map((img) => new Date(img.time).getTime()))
      return bLatest - aLatest
    })
  })

  const mixedPhotoItems = computed((): MixedPhotoItem[] => {
    const cacheKey = `mixedItems-${currentWorks.value.length}-${JSON.stringify(filterState.value)}`

    if (cache.value.has(cacheKey)) {
      return cache.value.get(cacheKey)
    }

    const items: MixedPhotoItem[] = []
    const groups = new Map()

    currentWorks.value.forEach(work => {
      let groupKey = 'no-event'
      let groupName: string | null = null
      let eventInfo: PhotoEvent | undefined = undefined

      if (work.event) {
        groupKey = work.event.name
        groupName = work.event.name
        eventInfo = work.event
      }
      else if (work.category === 'digital') {
        const year = new Date(work.time).getFullYear()
        groupKey = `digital-${year}`
        groupName = `${year}年電繪作品`
      }
      else {
        groupName = '攝影作品'
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          eventName: groupName,
          eventInfo: eventInfo,
          images: [],
          timeRange: ''
        })
      }

      groups.get(groupKey).images.push(work)
    })

    groups.forEach((group, key) => {
      const times = group.images.map((img: GalleryItem) => new Date(img.time))
      const minTime = new Date(Math.min(...times))
      const maxTime = new Date(Math.max(...times))

      group.timeRange = minTime.getTime() === maxTime.getTime()
        ? formatDateFull(minTime)
        : `${formatDateFull(minTime)} - ${formatDateFull(maxTime)}`

      group.images.sort((a: GalleryItem, b: GalleryItem) =>
        new Date(b.time).getTime() - new Date(a.time).getTime()
      )

      items.push({
        type: 'group',
        key: `group-${key}`,
        ...group
      })
    })

    const sorted = items.sort((a: MixedPhotoItem, b: MixedPhotoItem) => {
      const aLatest = Math.max(...(a.images || []).map((img: GalleryItem) => new Date(img.time).getTime()))
      const bLatest = Math.max(...(b.images || []).map((img: GalleryItem) => new Date(img.time).getTime()))
      return bLatest - aLatest
    })

    cache.value.set(cacheKey, sorted)
    return sorted
  })

  // 事件地點資訊（供前台地圖使用）
  const EVENT_COORDS: Record<string, { lat: number, lng: number }> = {
    '春日街拍': { lat: 25.0478, lng: 121.5319 }, // 台北市
    '2024新北耶誕城': { lat: 25.0119, lng: 121.4657 }, // 新北市板橋區
    '2025 桃猿三本柱': { lat: 25.0013, lng: 121.2016 }, // 樂天桃園棒球場
    '攝影社 米倉團拍': { lat: 24.7959, lng: 120.9848 }, // 交大新竹校區
    '調色測試': { lat: 24.8212, lng: 121.1818 }, // 六福村
    '交大外拍': { lat: 24.7959, lng: 120.9848 }, // 交大新竹校區
    '2025 聖誕台北': { lat: 25.0478, lng: 121.5319 }, // 台北市
    '峨嵋湖風鈴木': { lat: 24.6784, lng: 120.9851 }, // 峨眉湖
    'WBC 2026': { lat: 35.7058, lng: 139.7518 } // 東京巨蛋
  }

  const eventLocations = computed<EventLocationPoint[]>(() => {
    const groups = new Map<string, { images: GalleryItem[], timeRange: string, eventInfo?: PhotoEvent | null }>()

    photographyWorks.value.forEach(work => {
      if (!work.event?.name) return
      const name = work.event.name

      if (!groups.has(name)) {
        groups.set(name, { images: [], timeRange: '', eventInfo: work.event })
      }
      groups.get(name)!.images.push(work)
    })

    const result: EventLocationPoint[] = []

    groups.forEach((group, name) => {
      const imagesSorted = sortImagesByTime(group.images)
      const cover = imagesSorted[0]
      const timeRange = calculateTimeRange(imagesSorted)

      const info = group.eventInfo
      const coordFromEvent = info?.lat !== undefined && info?.lng !== undefined
        ? { lat: info.lat, lng: info.lng }
        : undefined
      const coord = coordFromEvent || EVENT_COORDS[name]

      if (!coord) {
        return
      }

      result.push({
        name,
        lat: coord.lat,
        lng: coord.lng,
        coverFilename: cover.filename,
        timeRange,
        count: imagesSorted.length,
        location: info?.location
      })
    })

    // 依事件最新時間降冪排序，較新的事件在前
    return result.sort((a, b) => {
      const aLatest = Math.max(...groups.get(a.name)!.images.map(img => new Date(img.time).getTime()))
      const bLatest = Math.max(...groups.get(b.name)!.images.map(img => new Date(img.time).getTime()))
      return bLatest - aLatest
    })
  })

  const availableEvents = computed(() => {
    const eventCounts = new Map<string, number>()
    const eventLatestTime = new Map<string, number>()
    const category = filterState.value.selectedCategory

    const recordEvent = (work: GalleryItem) => {
      if (!work.event) return

      const name = work.event.name
      const currentCount = eventCounts.get(name) || 0
      eventCounts.set(name, currentCount + 1)

      const time = new Date(work.time).getTime()
      const latest = eventLatestTime.get(name) ?? -Infinity
      if (time > latest) {
        eventLatestTime.set(name, time)
      }
    }

    if (category === 'all' || category === 'digital') {
      digitalWorks.value.forEach(work => {
        recordEvent(work)
      })
    }

    if (category === 'all' || category === 'photography') {
      photographyWorks.value.forEach(work => {
        recordEvent(work)
      })
    }

    const events = Array.from(eventCounts.entries())
      .map(([name, count]) => ({ name, count }))

    // 針對數位繪圖類別，按年份倒序排序
    if (category === 'digital') {
      return events.sort((a, b) => {
        // 提取年份進行排序（例如："2024年電繪作品" -> 2024）
        const yearA = parseInt(a.name.match(/(\d{4})/)?.[1] || '0')
        const yearB = parseInt(b.name.match(/(\d{4})/)?.[1] || '0')

        if (yearA !== yearB) {
          return yearB - yearA // 年份倒序（新的在前）
        }

        // 如果年份相同或沒有年份，按名稱排序
        return a.name.localeCompare(b.name)
      })
    }

    // 其他類別依事件「最新作品時間」倒序排列（較新的事件在前），若時間相同再用名稱排序
    return events.sort((a, b) => {
      const timeA = eventLatestTime.get(a.name) ?? 0
      const timeB = eventLatestTime.get(b.name) ?? 0

      if (timeA !== timeB) {
        return timeB - timeA
      }

      return a.name.localeCompare(b.name)
    })
  })

  const availableYears = computed(() => {
    const years = [...new Set(allWorks.value.map((item: GalleryItem) =>
      new Date(item.date).getFullYear().toString()
    ))] as string[]

    return years.sort((a: string, b: string) => b.localeCompare(a))
  })

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
    // 第一次點擊時，從「預設展開」切換為收合
    if (current === undefined) {
      expandedGroups.value[groupKey] = false
    } else {
      expandedGroups.value[groupKey] = !current
    }
  }

  const shouldShowEventOnTimeline = (image: GalleryItem, index: number): boolean => {
    if (!image.event) return false

    const currentEvent = image.event.name
    for (let i = 0; i < index; i++) {
      const prevImage = currentWorks.value[i]
      if (prevImage.event && prevImage.event.name === currentEvent) {
        return false
      }
    }
    return true
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