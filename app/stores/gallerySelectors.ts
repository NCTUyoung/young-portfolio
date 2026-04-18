/**
 * Gallery store 純函數：篩選、分組、混合佈局、地圖點、事件列表（可單獨測試）
 */
import { sortImagesByTime, calculateTimeRange } from '~/utils/galleryUtils'
import { formatDateFull } from '~/utils/formatters'
import type {
  GalleryItem,
  PhotoEvent,
  EventGroup,
  MixedPhotoItem,
  FilterState
} from '~~/shared/types/gallery'

export type EventLocationPoint = {
  name: string
  lat: number
  lng: number
  coverFilename: string
  timeRange: string
  count: number
  location?: string
}

export function combineAndSortAllWorks (
  digitalWorks: GalleryItem[],
  photographyWorks: GalleryItem[]
): GalleryItem[] {
  const combined = [
    ...digitalWorks.map(work => ({ ...work, category: 'digital' as const })),
    ...photographyWorks.map(work => ({ ...work, category: 'photography' as const }))
  ]
  return combined.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
}

export function getCurrentWorks (
  filterState: FilterState,
  digitalWorks: GalleryItem[],
  photographyWorks: GalleryItem[],
  allWorksSorted: GalleryItem[]
): GalleryItem[] {
  const { selectedCategory, selectedEvent } = filterState

  let works: GalleryItem[] = []

  if (selectedCategory === 'digital') {
    works = digitalWorks
    if (selectedEvent) {
      works = works.filter(work => work.event && work.event.name === selectedEvent)
    }
  } else if (selectedCategory === 'photography') {
    works = photographyWorks
    if (selectedEvent) {
      works = works.filter(work => work.event && work.event.name === selectedEvent)
    }
  } else {
    works = allWorksSorted
  }

  return works.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
}

export function applySearchAndYearFilter (
  works: GalleryItem[],
  searchQuery: string,
  yearFilter: string | null
): GalleryItem[] {
  let filtered = works

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
}

export function buildGroupedWorks (works: GalleryItem[]): EventGroup[] {
  const hasEvents = works.some(work => work.event)
  if (!hasEvents) return []

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
}

export function buildMixedPhotoItems (currentWorks: GalleryItem[]): MixedPhotoItem[] {
  const items: MixedPhotoItem[] = []
  const groups = new Map<string, {
    eventName: string | null
    eventInfo: PhotoEvent | undefined
    images: GalleryItem[]
    timeRange: string
  }>()

  currentWorks.forEach(work => {
    let groupKey = 'no-event'
    let groupName: string | null = null
    let eventInfo: PhotoEvent | undefined = undefined

    if (work.event) {
      groupKey = work.event.name
      groupName = work.event.name
      eventInfo = work.event
    } else if (work.category === 'digital') {
      const year = new Date(work.time).getFullYear()
      groupKey = `digital-${year}`
      groupName = `${year}年電繪作品`
    } else {
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

    groups.get(groupKey)!.images.push(work)
  })

  groups.forEach((group, key) => {
    const times = group.images.map((img: GalleryItem) => new Date(img.time))
    const minTime = new Date(Math.min(...times.map(t => t.getTime())))
    const maxTime = new Date(Math.max(...times.map(t => t.getTime())))

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

  return items.sort((a: MixedPhotoItem, b: MixedPhotoItem) => {
    const aLatest = Math.max(...(a.images || []).map((img: GalleryItem) => new Date(img.time).getTime()))
    const bLatest = Math.max(...(b.images || []).map((img: GalleryItem) => new Date(img.time).getTime()))
    return bLatest - aLatest
  })
}

export function buildEventLocations (
  photographyWorks: GalleryItem[],
  coordsFallback: Record<string, { lat: number, lng: number }>
): EventLocationPoint[] {
  const groups = new Map<string, { images: GalleryItem[], timeRange: string, eventInfo?: PhotoEvent | null }>()

  photographyWorks.forEach(work => {
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
    const coord = coordFromEvent || coordsFallback[name]

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

  return result.sort((a, b) => {
    const aLatest = Math.max(...groups.get(a.name)!.images.map(img => new Date(img.time).getTime()))
    const bLatest = Math.max(...groups.get(b.name)!.images.map(img => new Date(img.time).getTime()))
    return bLatest - aLatest
  })
}

export function buildAvailableEvents (
  filterState: FilterState,
  digitalWorks: GalleryItem[],
  photographyWorks: GalleryItem[]
): Array<{ name: string, count: number }> {
  const eventCounts = new Map<string, number>()
  const eventLatestTime = new Map<string, number>()
  const category = filterState.selectedCategory

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
    digitalWorks.forEach(recordEvent)
  }

  if (category === 'all' || category === 'photography') {
    photographyWorks.forEach(recordEvent)
  }

  const events = Array.from(eventCounts.entries())
    .map(([name, count]) => ({ name, count }))

  if (category === 'digital') {
    return events.sort((a, b) => {
      const yearA = parseInt(a.name.match(/(\d{4})/)?.[1] || '0')
      const yearB = parseInt(b.name.match(/(\d{4})/)?.[1] || '0')

      if (yearA !== yearB) {
        return yearB - yearA
      }

      return a.name.localeCompare(b.name)
    })
  }

  return events.sort((a, b) => {
    const timeA = eventLatestTime.get(a.name) ?? 0
    const timeB = eventLatestTime.get(b.name) ?? 0

    if (timeA !== timeB) {
      return timeB - timeA
    }

    return a.name.localeCompare(b.name)
  })
}

export function buildAvailableYears (allWorks: GalleryItem[]): string[] {
  const years = [...new Set(allWorks.map((item: GalleryItem) =>
    new Date(item.date).getFullYear().toString()
  ))]
  return years.sort((a: string, b: string) => b.localeCompare(a))
}

export function shouldShowEventOnTimeline (currentWorks: GalleryItem[], index: number): boolean {
  const image = currentWorks[index]
  if (!image?.event) return false

  const currentEvent = image.event.name
  for (let i = 0; i < index; i++) {
    const prevImage = currentWorks[i]
    if (prevImage.event && prevImage.event.name === currentEvent) {
      return false
    }
  }
  return true
}
