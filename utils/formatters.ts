/**
 * 純格式化工具函數
 * 這些是無狀態的純函數，不依賴響應式數據
 */

import { SHUTTER_SPEED_FORMATS } from '~/config/constants'

// ==================== 日期格式化 ====================

/**
 * 格式化日期為簡短格式 (MM/DD)
 */
export const formatDateShort = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}/${day}`
}

/**
 * 格式化日期為完整格式 (YYYY MMM DD)
 */
export const formatDateFull = (date: string | Date): string => {
  const d = new Date(date)
  const year = d.getFullYear()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = monthNames[d.getMonth()]
  const day = String(d.getDate()).padStart(2, '0')

  return `${year} ${month} ${day}`
}

/**
 * 格式化日期鍵 (YYYY-MM-DD)
 */
export const formatDateKey = (date: string | Date): string => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// ==================== 攝影相關格式化 ====================

/**
 * 格式化快門速度
 */
export const formatShutterSpeed = (speed: number): string => {
  if (speed >= SHUTTER_SPEED_FORMATS.threshold) {
    return `${speed}s`
  } else {
    const fraction = Math.round(1 / speed)
    return `1/${fraction}s`
  }
}

/**
 * 格式化相機名稱
 */
export const formatCameraName = (camera: string, model: string): string => {
  if (camera === 'NIKON CORPORATION') {
    return model || 'Nikon Camera'
  }
  return `${camera} ${model}`.trim()
}

/**
 * 格式化檔案大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// ==================== 數字格式化 ====================

/**
 * 格式化光圈值
 */
export const formatAperture = (aperture: number): string => {
  return `f/${aperture}`
}

/**
 * 格式化焦距
 */
export const formatFocalLength = (focalLength: number): string => {
  return `${focalLength}mm`
}

/**
 * 格式化 ISO 值
 */
export const formatISO = (iso: number): string => {
  return `ISO ${iso}`
}

// ==================== 文字格式化 ====================

/**
 * 截斷文字並添加省略號
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * 首字母大寫
 */
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * 駝峰轉換為破折號分隔
 */
export const kebabCase = (text: string): string => {
  return text.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()
}