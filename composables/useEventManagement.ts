import { ref, computed } from 'vue'
import type { PhotoEvent } from '~/types/gallery'
import { PREDEFINED_EVENTS } from '~/utils/eventUtils'
import { formatDateKey } from '~/utils/formatters'

/**
 * 事件管理 composable
 * 處理攝影事件和數位作品事件的響應式邏輯
 */
export const useEventManagement = () => {
  // 響應式狀態
  const events = ref<Record<string, PhotoEvent>>({ ...PREDEFINED_EVENTS })
  const currentEvent = ref<PhotoEvent | null>(null)
  const isLoading = ref(false)

  // ==================== 計算屬性 ====================

  /**
   * 所有事件名稱列表
   */
  const allEventNames = computed(() => {
    return Object.values(events.value).map(event => event.name)
  })

  /**
   * 按年份分組的事件
   */
  const eventsByYear = computed(() => {
    const groups: Record<string, PhotoEvent[]> = {}

    Object.values(events.value).forEach(event => {
      // 從事件名稱中提取年份
      const yearMatch = event.name.match(/(\d{4})/)
      const year = yearMatch ? yearMatch[1] : 'unknown'

      if (!groups[year]) {
        groups[year] = []
      }
      groups[year].push(event)
    })

    return groups
  })

  /**
   * 最近的事件（最近一年）
   */
  const recentEvents = computed(() => {
    const currentYear = new Date().getFullYear()
    const lastYear = currentYear - 1

    return Object.values(events.value).filter(event => {
      const yearMatch = event.name.match(/(\d{4})/)
      const eventYear = yearMatch ? parseInt(yearMatch[1]) : 0
      return eventYear >= lastYear
    })
  })

  // ==================== 事件查找 ====================

  /**
   * 根據檔名查找對應的事件
   */
  const findEventByFilename = (filename: string): PhotoEvent | null => {
    for (const event of Object.values(events.value)) {
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
  const findEventByDate = (dateKey: string): PhotoEvent | null => {
    return events.value[dateKey] || null
  }

  /**
   * 查找事件（綜合檔名和日期）
   */
  const findEvent = (dateKey: string, filename: string): PhotoEvent | null => {
    // 優先從檔名中尋找
    const eventByFilename = findEventByFilename(filename)
    if (eventByFilename) return eventByFilename

    // 其次根據日期匹配
    return findEventByDate(dateKey)
  }

  /**
   * 根據檔案路徑推斷事件名稱
   */
  const findEventByPath = (filepath: string): PhotoEvent | null => {
    const pathParts = filepath.split('/')

    for (const part of pathParts) {
      const event = findEventByFilename(part)
      if (event) return event
    }

    return null
  }

  // ==================== 事件推斷 ====================

  /**
   * 根據時間自動推斷事件名稱
   */
  const inferEventFromTime = (captureTime: Date, category: 'digital' | 'photography'): PhotoEvent => {
    const year = captureTime.getFullYear()

    if (category === 'digital') {
      return createEvent(
        `${year}年電繪作品`,
        `${year}年創作的電繪作品集`,
        ''
      )
    } else {
      return createEvent(
        `${year}年攝影作品`,
        `${year}年拍攝的攝影作品集`,
        ''
      )
    }
  }

  // ==================== 事件管理 ====================

  /**
   * 創建新事件
   */
  const createEvent = (
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
   * 添加事件到管理列表
   */
  const addEvent = (event: PhotoEvent, dateKey?: string): void => {
    const key = dateKey || formatDateKey(new Date())
    events.value[key] = event
  }

  /**
   * 更新事件信息
   */
  const updateEvent = (dateKey: string, event: PhotoEvent): boolean => {
    if (events.value[dateKey]) {
      events.value[dateKey] = event
      return true
    }
    return false
  }

  /**
   * 刪除事件
   */
  const removeEvent = (dateKey: string): boolean => {
    if (events.value[dateKey]) {
      delete events.value[dateKey]
      return true
    }
    return false
  }

  /**
   * 設置當前事件
   */
  const setCurrentEvent = (event: PhotoEvent | null): void => {
    currentEvent.value = event
  }

  // ==================== 搜尋和篩選 ====================

  /**
   * 搜尋事件
   */
  const searchEvents = (query: string): PhotoEvent[] => {
    if (!query.trim()) return Object.values(events.value)

    const lowercaseQuery = query.toLowerCase()

    return Object.values(events.value).filter(event =>
      event.name.toLowerCase().includes(lowercaseQuery) ||
      event.description.toLowerCase().includes(lowercaseQuery) ||
      event.location.toLowerCase().includes(lowercaseQuery)
    )
  }

  /**
   * 按年份篩選事件
   */
  const filterEventsByYear = (year: string): PhotoEvent[] => {
    return Object.values(events.value).filter(event => {
      const yearMatch = event.name.match(/(\d{4})/)
      return yearMatch ? yearMatch[1] === year : false
    })
  }

  /**
   * 按地點篩選事件
   */
  const filterEventsByLocation = (location: string): PhotoEvent[] => {
    return Object.values(events.value).filter(event =>
      event.location.toLowerCase().includes(location.toLowerCase())
    )
  }

  // ==================== 驗證 ====================

  /**
   * 驗證事件數據的完整性
   */
  const validateEvent = (event: Partial<PhotoEvent>): event is PhotoEvent => {
    return !!(event.name && event.description !== undefined && event.location !== undefined)
  }

  /**
   * 檢查事件名稱是否已存在
   */
  const isEventNameExists = (name: string, excludeKey?: string): boolean => {
    return Object.entries(events.value).some(([key, event]) =>
      event.name === name && key !== excludeKey
    )
  }

  // ==================== 統計 ====================

  /**
   * 事件統計信息
   */
  const eventStats = computed(() => {
    const totalEvents = Object.keys(events.value).length
    const years = [...new Set(Object.values(events.value).map(event => {
      const yearMatch = event.name.match(/(\d{4})/)
      return yearMatch ? yearMatch[1] : 'unknown'
    }))]

    const locations = [...new Set(Object.values(events.value)
      .map(event => event.location)
      .filter(location => location.trim() !== ''))]

    return {
      total: totalEvents,
      years: years.sort((a, b) => b.localeCompare(a)),
      locations: locations.sort(),
      byYear: eventsByYear.value,
      recent: recentEvents.value.length
    }
  })

  // ==================== 批量操作 ====================

  /**
   * 批量導入事件
   */
  const importEvents = async (
    eventsData: Record<string, PhotoEvent>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<void> => {
    isLoading.value = true

    const entries = Object.entries(eventsData)

    for (let i = 0; i < entries.length; i++) {
      const [key, event] = entries[i]

      if (validateEvent(event)) {
        events.value[key] = event
      }

      onProgress?.(i + 1, entries.length)

      // 避免阻塞 UI
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    isLoading.value = false
  }

  /**
   * 導出事件數據
   */
  const exportEvents = (): Record<string, PhotoEvent> => {
    return { ...events.value }
  }

  return {
    // 狀態
    events: readonly(events),
    currentEvent: readonly(currentEvent),
    isLoading: readonly(isLoading),

    // 計算屬性
    allEventNames,
    eventsByYear,
    recentEvents,
    eventStats,

    // 查找方法
    findEventByFilename,
    findEventByDate,
    findEvent,
    findEventByPath,
    inferEventFromTime,

    // 管理方法
    createEvent,
    addEvent,
    updateEvent,
    removeEvent,
    setCurrentEvent,

    // 搜尋和篩選
    searchEvents,
    filterEventsByYear,
    filterEventsByLocation,

    // 驗證
    validateEvent,
    isEventNameExists,

    // 批量操作
    importEvents,
    exportEvents
  }
}