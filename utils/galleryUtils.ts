import type { GalleryItem } from '~/types/gallery'
import { formatDateFull } from './formatters'

/**
 * 畫廊特定的工具函數
 * 專注於畫廊展示、篩選、分組等邏輯
 *
 * 注意：
 * - 格式化函數已移至 formatters.ts
 * - 圖片處理邏輯已移至 useImageProcessing composable
 * - 驗證函數已移至 validators.ts
 */

/**
 * 按年份分組圖片
 */
export const groupImagesByYear = (images: GalleryItem[]): Record<string, GalleryItem[]> => {
  return images.reduce((groups, image) => {
    const year = new Date(image.time).getFullYear().toString()
    if (!groups[year]) {
      groups[year] = []
    }
    groups[year].push(image)
    return groups
  }, {} as Record<string, GalleryItem[]>)
}

/**
 * 按事件分組圖片
 */
export const groupImagesByEvent = (images: GalleryItem[]): Record<string, GalleryItem[]> => {
  return images.reduce((groups, image) => {
    const eventName = image.event?.name || 'no-event'
    if (!groups[eventName]) {
      groups[eventName] = []
    }
    groups[eventName].push(image)
    return groups
  }, {} as Record<string, GalleryItem[]>)
}

/**
 * 計算時間範圍
 */
export const calculateTimeRange = (images: GalleryItem[]): string => {
  if (images.length === 0) return ''

  const times = images.map(img => new Date(img.time))
  const minTime = new Date(Math.min(...times.map(t => t.getTime())))
  const maxTime = new Date(Math.max(...times.map(t => t.getTime())))

  return minTime.getTime() === maxTime.getTime()
    ? formatDateFull(minTime)
    : `${formatDateFull(minTime)} - ${formatDateFull(maxTime)}`
}

/**
 * 排序圖片（按時間降序）
 */
export const sortImagesByTime = (images: GalleryItem[]): GalleryItem[] => {
  return [...images].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
}

/**
 * 篩選可見圖片
 */
export const filterVisibleImages = (images: GalleryItem[]): GalleryItem[] => {
  return images.filter(image => image.visible !== false)
}

/**
 * 搜尋圖片
 */
export const searchImages = (images: GalleryItem[], query: string): GalleryItem[] => {
  if (!query.trim()) return images

  const lowercaseQuery = query.toLowerCase()
  return images.filter(image =>
    image.title.toLowerCase().includes(lowercaseQuery) ||
    image.description.toLowerCase().includes(lowercaseQuery) ||
    image.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  )
}

/**
 * 按年份篩選圖片
 */
export const filterImagesByYear = (images: GalleryItem[], year: string | null): GalleryItem[] => {
  if (!year) return images
  return images.filter(image => new Date(image.time).getFullYear().toString() === year)
}

/**
 * 按類別篩選圖片
 */
export const filterImagesByCategory = (images: GalleryItem[], category: 'all' | 'digital' | 'photography'): GalleryItem[] => {
  if (category === 'all') return images
  return images.filter(image => image.category === category)
}

/**
 * 按事件篩選圖片
 */
export const filterImagesByEvent = (images: GalleryItem[], eventName: string | null): GalleryItem[] => {
  if (!eventName) return images
  return images.filter(image => image.event?.name === eventName)
}

/**
 * 獲取所有可用年份
 */
export const getAvailableYears = (images: GalleryItem[]): string[] => {
  const years = [...new Set(images.map(image =>
    new Date(image.time).getFullYear().toString()
  ))]
  return years.sort((a, b) => b.localeCompare(a)) // 降序排列
}

/**
 * 獲取所有可用事件
 */
export const getAvailableEvents = (images: GalleryItem[]): Array<{ name: string; count: number }> => {
  const eventCounts = new Map<string, number>()

  images.forEach(image => {
    if (image.event) {
      const count = eventCounts.get(image.event.name) || 0
      eventCounts.set(image.event.name, count + 1)
    }
  })

  return Array.from(eventCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name))
}