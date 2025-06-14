import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useStorage, useAsyncState, useDebounceFn, useLocalStorage } from '@vueuse/core'

export interface PhotoEvent {
  name: string
  description?: string
  location?: string
}

export interface GalleryItem {
  id: string
  filename: string
  title: string
  description: string
  imagePath?: string
  category: 'digital' | 'photography'
  date: string
  time: string
  tags?: string[]
  visible?: boolean
  // 數位作品相關
  color?: string
  // 攝影作品相關
  event?: PhotoEvent | null
  camera?: string
  model?: string
  focalLength?: number
  aperture?: number
  iso?: number
  shutterSpeed?: number
}

export interface EventGroup {
  eventName: string | null
  eventInfo?: PhotoEvent
  images: GalleryItem[]
  timeRange: string
}

export interface MixedPhotoItem {
  type: 'group' | 'photo'
  key: string
  time?: string
  eventName?: string | null
  eventInfo?: PhotoEvent
  images?: GalleryItem[]
  timeRange?: string
  filename?: string
  title?: string
  event?: PhotoEvent
  isFirstInEvent?: boolean
  [key: string]: any
}

export interface FilterState {
  selectedCategory: 'all' | 'digital' | 'photography'
  selectedEvent: string | null
  searchQuery: string
  yearFilter: string | null
}

const formatDate = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}/${day}`
}

const formatShutterSpeed = (speed: number): string => {
  if (speed >= 1) {
    return `${speed}s`
  } else {
    const fraction = Math.round(1 / speed)
    return `1/${fraction}s`
  }
}

const formatCameraName = (camera: string, model: string): string => {
  if (camera === 'NIKON CORPORATION') {
    return model || 'Nikon Camera'
  }
  return `${camera} ${model}`.trim()
}

const getDisplayTitle = (image: GalleryItem): string => {
  if (image.camera) {
    const number = image.filename.match(/DSC_(\d+)/)?.[1]
    return number ? `攝影 #${number}` : '攝影作品'
  }
  return image.title
}

const getPrimaryTag = (image: GalleryItem): string | null => {
  if (!image.tags || image.tags.length === 0) {
    return null
  }

  const priority = ['後製', '夜拍', '人像', '望遠', '廣角', '淺景深', '標準', '日光']

  for (const tag of priority) {
    if (image.tags.includes(tag)) {
      return tag
    }
  }

  return image.tags[0]
}

const getImageClass = (index: number): string => {
  const classes = ['h-64', 'h-80', 'h-48', 'h-72', 'h-56']
  return classes[index % classes.length]
}

const fetchDigitalWorks = async (): Promise<GalleryItem[]> => {
  const response = await fetch('/galleryList.json')
  const data = await response.json()

  return data.Img.map((img: any) => ({
    id: `digital-${img.filename}`,
    filename: img.filename,
    title: img.title,
    description: img.content,
    date: img.time,
    time: img.time,
    color: img.color,
    category: 'digital' as const,
    visible: true
  }))
}

const fetchPhotographyWorks = async (): Promise<{ works: GalleryItem[], eventStats: Record<string, number> }> => {
  const response = await fetch('/photographyList.json')
  const data = await response.json()

  const works = data.Img.map((img: any) => ({
    id: `photo-${img.filename}`,
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
  }))

  return {
    works,
    eventStats: data.eventStats || {}
  }
}

export const useGalleryStore = defineStore('gallery', () => {
  const {
    state: digitalWorks,
    isLoading: isLoadingDigital,
    error: digitalError,
    execute: loadDigitalWorks
  } = useAsyncState(fetchDigitalWorks, [], {
    immediate: false,
    resetOnExecute: false
  })

  const {
    state: photographyData,
    isLoading: isLoadingPhotography,
    error: photographyError,
    execute: loadPhotographyWorks
  } = useAsyncState(fetchPhotographyWorks, { works: [], eventStats: {} }, {
    immediate: false,
    resetOnExecute: false
  })

  const photographyWorks = computed(() => photographyData.value.works)
  const eventStats = computed(() => photographyData.value.eventStats)

  const isLoading = computed(() => isLoadingDigital.value || isLoadingPhotography.value)

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
    } else if (selectedCategory === 'photography') {
      works = photographyWorks.value

      if (selectedEvent) {
        works = works.filter(work => work.event && work.event.name === selectedEvent)
      }
    } else {
      works = allWorks.value
    }

    return works
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

    const groups = new Map()

    works.forEach(work => {
      const eventName = work.event?.name || null
      const key = eventName || 'no-event'

      if (!groups.has(key)) {
        groups.set(key, {
          eventName,
          eventInfo: work.event,
          images: [],
          timeRange: ''
        })
      }

      groups.get(key).images.push(work)
    })

    const groupArray = Array.from(groups.values()).map((group: any) => {
      const times = group.images.map((img: GalleryItem) => new Date(img.time))
      const minTime = new Date(Math.min(...times))
      const maxTime = new Date(Math.max(...times))

      group.timeRange = minTime.getTime() === maxTime.getTime()
        ? formatDate(minTime)
        : `${formatDate(minTime)} - ${formatDate(maxTime)}`

      group.images.sort((a: GalleryItem, b: GalleryItem) =>
        new Date(b.time).getTime() - new Date(a.time).getTime()
      )

      return group
    })

    return groupArray.sort((a: EventGroup, b: EventGroup) => {
      const aLatest = Math.max(...a.images.map((img: GalleryItem) => new Date(img.time).getTime()))
      const bLatest = Math.max(...b.images.map((img: GalleryItem) => new Date(img.time).getTime()))
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

      if (work.category === 'photography' && work.event) {
        groupKey = work.event.name
        groupName = work.event.name
        eventInfo = work.event
      }
      else if (work.category === 'digital') {
        const year = new Date(work.time).getFullYear()
        groupKey = `digital-${year}`
        groupName = `數位作品 ${year}`
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
        ? formatDate(minTime)
        : `${formatDate(minTime)} - ${formatDate(maxTime)}`

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
    // 計算每個事件的最新時間
    const eventTimes: Record<string, number> = {}

    photographyWorks.value.forEach(work => {
      if (work.event && work.event.name) {
        const eventName = work.event.name
        const workTime = new Date(work.time).getTime()

        if (!eventTimes[eventName] || workTime > eventTimes[eventName]) {
          eventTimes[eventName] = workTime
        }
      }
    })

    // 按最新時間排序事件
    return Object.entries(eventStats.value)
      .map(([name, count]) => ({
        name,
        count,
        latestTime: eventTimes[name] || 0
      }))
      .sort((a, b) => b.latestTime - a.latestTime) // 最新的事件在前
      .map(({ name, count }) => ({ name, count })) // 移除 latestTime，只保留需要的屬性
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

  watch([digitalWorks, photographyWorks], () => {
    clearCache(['allWorks', 'mixedItems'])
  }, { deep: true })

  return {
    digitalWorks,
    photographyWorks,
    eventStats,
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

    formatDate,
    formatShutterSpeed,
    formatCameraName,
    getDisplayTitle,
    getPrimaryTag,
    getImageClass,

    digitalError,
    photographyError
  }
})