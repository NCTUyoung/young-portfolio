import type { ExifData, EventDefinition } from '~/types/gallery'

// 事件定義 - 統一維護
export const EVENTS: Record<string, EventDefinition> = {
  '2024-12-13': {
    name: '2024新北耶誕城',
    description: '新北市耶誕城燈光秀拍攝',
    location: '新北市板橋區'
  },
  '2025-05-17': {
    name: '春日街拍',
    description: '城市日常生活紀錄',
    location: '台北市'
  }
  // 可以繼續添加更多事件...
}

// 格式化日期
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = monthNames[d.getMonth()]
  const day = String(d.getDate()).padStart(2, '0')

  return `${year} ${month} ${day}`
}

// 格式化日期鍵（用於匹配事件）
export function formatDateKey(date: string | Date): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 基於拍攝參數產生智能標籤
export function generateSmartTags(exif: ExifData, filename: string, userTags?: string): string[] {
  const tags: string[] = []

  // 基於焦距判斷鏡頭類型
  if (exif?.FocalLength) {
    const focal = exif.FocalLength
    if (focal <= 24) tags.push('廣角')
    else if (focal <= 50) tags.push('標準')
    else if (focal <= 85) tags.push('人像')
    else tags.push('望遠')
  }

  // 基於光圈判斷景深效果
  if (exif?.FNumber) {
    if (exif.FNumber <= 2.8) tags.push('淺景深')
    else if (exif.FNumber >= 8) tags.push('深景深')
  }

  // 基於ISO判斷拍攝環境
  if (exif?.ISO) {
    if (exif.ISO >= 800) tags.push('夜拍')
    else if (exif.ISO <= 200) tags.push('日光')
  }

  // 基於快門速度判斷動態
  if (exif?.ExposureTime) {
    if (exif.ExposureTime <= 0.002) tags.push('高速快門')
    else if (exif.ExposureTime >= 0.1) tags.push('慢速快門')
  }

  // 檔名分析
  if (filename.includes('編輯') || filename.includes('edit')) {
    tags.push('後製')
  }

  // 室內/室外判斷
  if (filename.includes('室內') || filename.includes('indoor')) {
    tags.push('室內')
  }

  // 加入用戶自定義標籤
  if (userTags) {
    const customTags = userTags.split(',').map(tag => tag.trim()).filter(tag => tag)
    tags.push(...customTags)
  }

  // 確保至少有一個基本標籤
  if (tags.length === 0) {
    tags.push('攝影')
  }

  return [...new Set(tags)] // 去重
}

// 根據檔名生成標題和描述
export function generateTitleAndDescription(filename: string): { title: string; description: string } {
  // 分析檔名中的模式
  if (filename.includes('DSC_')) {
    const number = filename.match(/DSC_(\d+)/)?.[1]
    return {
      title: `攝影作品 #${number}`,
      description: "數位單眼相機拍攝作品"
    }
  }

  if (filename.includes('編輯')) {
    return {
      title: "後製攝影作品",
      description: "經過後製處理的攝影作品"
    }
  }

  return {
    title: filename.replace(/\.[^/.]+$/, "").replace(/-/g, ' '),
    description: "攝影作品"
  }
}

// 查找對應的事件
export function findEvent(dateKey: string, filename: string): EventDefinition | null {
  // 優先從檔名中尋找事件關鍵字
  for (const [key, event] of Object.entries(EVENTS)) {
    if (filename.includes(event.name.replace(/\d+/, '').trim())) {
      return event
    }
  }

  // 其次根據日期匹配
  return EVENTS[dateKey] || null
}

// 從 EXIF 提取拍攝時間
export function extractCaptureTime(exif: ExifData): Date {
  if (exif?.DateTimeOriginal) {
    return new Date(exif.DateTimeOriginal)
  } else if (exif?.DateTime) {
    return new Date(exif.DateTime)
  } else if (exif?.CreateDate) {
    return new Date(exif.CreateDate)
  }

  return new Date() // 如果沒有 EXIF 時間，使用當前時間
}

// 驗證和清理 EXIF 數據
export function normalizeExifData(exif: any): ExifData {
  return {
    Make: exif?.Make || '',
    Model: exif?.Model || '',
    FocalLength: exif?.FocalLength || 0,
    FNumber: exif?.FNumber || 0,
    ISO: exif?.ISO || 0,
    ExposureTime: exif?.ExposureTime || 0,
    DateTimeOriginal: exif?.DateTimeOriginal,
    DateTime: exif?.DateTime,
    CreateDate: exif?.CreateDate
  }
}

/**
 * 根據時間自動推斷事件名稱
 * @param captureTime 拍攝/創作時間
 * @param category 分類類型 ('gallery' | 'photography')
 * @returns 事件資訊
 */
export function inferEventFromTime(captureTime: Date, category: 'gallery' | 'photography') {
  const year = captureTime.getFullYear()

  if (category === 'gallery') {
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