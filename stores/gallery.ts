import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useLocalStorage, useDebounceFn } from '@vueuse/core'
import { useApi } from '~/composables/useApi'
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
  FilterState
} from '~/types/gallery'

// 類型定義已移至 types/gallery.ts，通過上方 import 語句導入

// 這些工具函數已移至 utils/galleryUtils.ts
// 在 return 語句中會重新導出以保持向後兼容

// 數據轉換工具函數
const transformDigitalWork = (img: any): GalleryItem => ({
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

const transformPhotographyWork = (img: any): GalleryItem => ({
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

const fetchDigitalWorks = async (): Promise<{ works: GalleryItem[], eventStats: Record<string, number> }> => {
  const data: any = await $fetch('/galleryList.json')

  const works = sortImagesByTime(
    data.Img.map(transformDigitalWork)
  )

  return {
    works,
    eventStats: data.eventStats || {}
  }
}

const fetchPhotographyWorks = async (): Promise<{ works: GalleryItem[], eventStats: Record<string, number> }> => {
  const data: any = await $fetch('/photographyList.json')

  const works = sortImagesByTime(
    data.Img.map(transformPhotographyWork)
  )

  return {
    works,
    eventStats: data.eventStats || {}
  }
}

export const useGalleryStore = defineStore('gallery', () => {
  // 使用新的 API composable
  const api = useApi()

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
    } catch (error: any) {
      digitalError.value = error.message || '載入數位作品失敗'
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
    } catch (error: any) {
      photographyError.value = error.message || '載入攝影作品失敗'
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
      let eventInfo: any = null

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

  const availableEvents = computed(() => {
    const eventCounts = new Map<string, number>()
    const category = filterState.value.selectedCategory

    if (category === 'all' || category === 'digital') {
      digitalWorks.value.forEach(work => {
        if (work.event) {
          const count = eventCounts.get(work.event.name) || 0
          eventCounts.set(work.event.name, count + 1)
        }
      })
    }

    if (category === 'all' || category === 'photography') {
      photographyWorks.value.forEach(work => {
        if (work.event) {
          const count = eventCounts.get(work.event.name) || 0
          eventCounts.set(work.event.name, count + 1)
        }
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

    // 其他類別保持原有的字母順序
    return events.sort((a, b) => a.name.localeCompare(b.name))
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
    expandedGroups.value[groupKey] = !expandedGroups.value[groupKey]
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

    // 重新導出工具函數以保持向後兼容（這些函數現在來自 utils/galleryUtils.ts）
    formatDate: (date: Date) => {
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${month}/${day}`
    },
    formatShutterSpeed: (speed: number) => {
      if (speed >= 1) return `${speed}s`
      return `1/${Math.round(1 / speed)}`
    },
    formatCameraName: (camera: string, model: string) => {
      if (camera === 'NIKON CORPORATION') return model || 'Nikon Camera'
      return `${camera} ${model}`.trim()
    },
    getDisplayTitle: (image: GalleryItem) => {
      if (image.camera) {
        const number = image.filename.match(/DSC_(\d+)/)?.[1]
        return number ? `攝影 #${number}` : '攝影作品'
      }
      return image.title
    },
    getPrimaryTag: (image: GalleryItem) => {
      if (!image.tags || image.tags.length === 0) return null
      const priority = ['後製', '夜拍', '人像', '望遠', '廣角', '淺景深', '標準', '日光']
      for (const tag of priority) {
        if (image.tags.includes(tag)) return tag
      }
      return image.tags[0]
    },
    getImageClass: (index: number) => {
      const classes = ['h-64', 'h-80', 'h-48', 'h-72', 'h-56']
      return classes[index % classes.length]
    },

    digitalError,
    photographyError
  }
})