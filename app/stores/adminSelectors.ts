/**
 * Admin store 純函式：上傳條件、管理分組、概覽統計（可單獨測試）
 */
import type { GalleryItem, CategoryType } from '~~/shared/types/gallery'
import type { UnifiedGalleryItem } from '~/stores/adminTypes'

export type GroupedManageRow = {
  eventName: string
  description: string
  location: string
  items: UnifiedGalleryItem[]
  latestTime: number
}

export function computeCanUpload (p: {
  fileCount: number
  uploading: boolean
  uploadCategory: CategoryType
  eventMode: 'new' | 'existing'
  eventName: string
  selectedExistingEvent: string
}): boolean {
  if (p.fileCount === 0 || p.uploading) return false

  if (p.uploadCategory === 'photography') {
    if (p.eventMode === 'new') {
      return p.eventName.trim() !== ''
    }
    if (p.eventMode === 'existing') {
      return p.selectedExistingEvent.trim() !== ''
    }
  }

  return true
}

export function pickDataByCategory (
  category: CategoryType,
  galleryData: UnifiedGalleryItem[],
  photographyData: UnifiedGalleryItem[]
): UnifiedGalleryItem[] {
  return category === 'gallery' ? (galleryData || []) : (photographyData || [])
}

export function buildGroupedManageData (
  data: UnifiedGalleryItem[],
  manageCategory: CategoryType,
  selectedEvent: string
): GroupedManageRow[] {
  const groups: Record<string, {
    eventName: string
    description: string
    location: string
    items: UnifiedGalleryItem[]
  }> = {}

  data.forEach(item => {
    let currentEventName = '預設事件'
    let description = '未分類作品'
    let location = ''

    const itemWithEvent = item as GalleryItem & { event?: { name?: string; description?: string; location?: string } }
    if (itemWithEvent.event) {
      const event = itemWithEvent.event
      currentEventName = event.name || '預設事件'
      description = event.description || '未分類作品'
      location = event.location || ''
    } else if (manageCategory === 'gallery') {
      const year = new Date(item.time).getFullYear()
      currentEventName = `${year}年電繪作品`
      description = `${year} 年創作的電繪作品`
      location = ''
    }

    const bucket = groups[currentEventName] ?? (groups[currentEventName] = {
      eventName: currentEventName,
      description,
      location,
      items: []
    })

    bucket.items.push(item)
  })

  let result: GroupedManageRow[] = Object.values(groups).map(group => {
    const sortedItems = group.items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    return {
      ...group,
      items: sortedItems,
      latestTime: Math.max(...sortedItems.map(item => new Date(item.time).getTime()))
    }
  }).sort((a, b) => {
    const timeDiff = b.latestTime - a.latestTime
    if (timeDiff !== 0) return timeDiff
    return b.items.length - a.items.length
  })

  if (selectedEvent && selectedEvent !== '') {
    result = result.filter(group => group.eventName === selectedEvent)
  }

  return result
}

export function buildAvailableEventsForManage (
  data: UnifiedGalleryItem[],
  manageCategory: CategoryType
): string[] {
  const events = new Set<string>()

  data.forEach(item => {
    const itemEv = item as GalleryItem & { event?: { name?: string } }
    if (itemEv.event) {
      events.add(itemEv.event.name || '預設事件')
    } else if (manageCategory === 'gallery') {
      const year = new Date(item.time).getFullYear()
      events.add(`${year}年電繪作品`)
    } else {
      events.add('預設事件')
    }
  })

  return Array.from(events).sort()
}

export function buildOverviewStats (
  data: UnifiedGalleryItem[],
  overviewCategory: CategoryType
) {
  return {
    totalImages: data.length,
    uniqueCameras: overviewCategory === 'photography'
      ? Array.from(new Set(data.map(item => (item as GalleryItem & { camera?: string }).camera).filter(c => c && c !== 'Unknown')))
      : [],
    uniqueColors: overviewCategory === 'gallery'
      ? Array.from(new Set(data.map(item => (item as GalleryItem).color).filter(c => c)))
      : [],
    recentUploads: (() => {
      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      return data.filter(item => {
        const itemDate = new Date(item.time)
        return itemDate >= thisMonth
      }).length
    })(),
    events: overviewCategory === 'photography'
      ? Array.from(new Set(data.map(item => (item as GalleryItem & { event?: { name?: string } }).event?.name).filter(e => e)))
      : []
  }
}

export function buildRecentOverviewItems (data: UnifiedGalleryItem[]): UnifiedGalleryItem[] {
  return data.slice(0, 20).sort((a, b) =>
    new Date(b.time).getTime() - new Date(a.time).getTime()
  )
}

export function extractPhotographyEventNames (photographyData: UnifiedGalleryItem[]): string[] {
  const events = new Set<string>()

  photographyData.forEach(item => {
    const pe = item as GalleryItem & { event?: { name?: string } }
    if (pe.event && pe.event.name) {
      events.add(pe.event.name)
    }
  })

  return Array.from(events).sort()
}
