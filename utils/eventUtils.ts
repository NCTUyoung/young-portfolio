import type { PhotoEvent } from '~/types/gallery'

/**
 * 事件相關工具函數
 * 處理攝影事件和數位作品事件的邏輯
 */

// 預定義的事件庫 - 可以擴展
export const PREDEFINED_EVENTS: Record<string, PhotoEvent> = {
  '2024-12-13': {
    name: '2024新北耶誕城',
    description: '新北市耶誕城燈光秀拍攝',
    location: '新北市板橋區'
  },
  '2025-01-17': {
    name: '春日街拍',
    description: '城市日常生活紀錄',
    location: '台北市'
  },
  '2025-01-25': {
    name: '2025 桃園三本柱',
    description: '桃園地標建築攝影',
    location: '桃園市'
  }
  // 可以繼續添加更多事件...
}

/**
 * 根據檔名查找對應的事件
 */
export const findEventByFilename = (filename: string): PhotoEvent | null => {
  // 優先從檔名中尋找事件關鍵字
  for (const event of Object.values(PREDEFINED_EVENTS)) {
    // 移除年份數字，只比較事件名稱核心部分
    const eventKeywords = event.name.replace(/\d+/g, '').trim()
    if (filename.includes(eventKeywords)) {
      return event
    }
  }
  return null
}

/**
 * 根據日期查找對應的事件
 */
export const findEventByDate = (dateKey: string): PhotoEvent | null => {
  return PREDEFINED_EVENTS[dateKey] || null
}

/**
 * 查找事件（綜合檔名和日期）
 */
export const findEvent = (dateKey: string, filename: string): PhotoEvent | null => {
  // 優先從檔名中尋找
  const eventByFilename = findEventByFilename(filename)
  if (eventByFilename) return eventByFilename

  // 其次根據日期匹配
  return findEventByDate(dateKey)
}

/**
 * 根據時間自動推斷事件名稱
 */
export const inferEventFromTime = (captureTime: Date, category: 'digital' | 'photography'): PhotoEvent => {
  const year = captureTime.getFullYear()

  if (category === 'digital') {
    return {
      name: `${year}年電繪作品`,
      description: `${year}年創作的電繪作品集`,
      location: ''
    }
  } else {
    return {
      name: `${year}年攝影作品`,
      description: `${year}年拍攝的攝影作品集`,
      location: ''
    }
  }
}

/**
 * 根據檔案路徑推斷事件名稱
 */
export const inferEventFromPath = (filepath: string): PhotoEvent | null => {
  // 從路徑中提取可能的事件名稱
  // 例如：images/photography/2024新北耶誕城/DSC_001.jpg
  const pathParts = filepath.split('/')

  for (const part of pathParts) {
    // 檢查是否匹配已知事件
    const event = findEventByFilename(part)
    if (event) return event
  }

  return null
}

/**
 * 驗證事件數據的完整性
 */
export const validateEvent = (event: Partial<PhotoEvent>): event is PhotoEvent => {
  return !!(event.name && event.description !== undefined && event.location !== undefined)
}

/**
 * 創建新事件
 */
export const createEvent = (
  name: string,
  description: string = '',
  location: string = ''
): PhotoEvent => {
  return {
    name: name.trim(),
    description: description.trim(),
    location: location.trim()
  }
}

/**
 * 獲取所有可用的事件名稱
 */
export const getAllEventNames = (): string[] => {
  return Object.values(PREDEFINED_EVENTS).map(event => event.name)
}

/**
 * 按年份分組事件
 */
export const groupEventsByYear = (): Record<string, PhotoEvent[]> => {
  const groups: Record<string, PhotoEvent[]> = {}

  Object.values(PREDEFINED_EVENTS).forEach(event => {
    // 從事件名稱中提取年份
    const yearMatch = event.name.match(/(\d{4})/)
    const year = yearMatch ? yearMatch[1] : 'unknown'

    if (!groups[year]) {
      groups[year] = []
    }
    groups[year].push(event)
  })

  return groups
}

/**
 * 搜尋事件
 */
export const searchEvents = (query: string): PhotoEvent[] => {
  const lowercaseQuery = query.toLowerCase()

  return Object.values(PREDEFINED_EVENTS).filter(event =>
    event.name.toLowerCase().includes(lowercaseQuery) ||
    event.description.toLowerCase().includes(lowercaseQuery) ||
    event.location.toLowerCase().includes(lowercaseQuery)
  )
}