/**
 * Utils 統一導出文件
 * 提供常用組合對象，避免重複導入問題
 *
 * 建議：
 * - 直接從具體文件導入: import { formatDateFull } from '~/utils/formatters'
 * - 使用組合對象: import { DateFormatters } from '~/utils'
 */

import { formatDateShort, formatDateFull, formatDateKey, formatShutterSpeed, formatCameraName, formatAperture, formatFocalLength, formatISO } from './formatters'
import { validateFile, validateEvent, validateGalleryItem, validateEmail, validateUrl, validateDateString } from './validators'

// ==================== 常用組合對象 ====================

/**
 * 格式化日期的所有變體
 */
export const DateFormatters = {
  short: formatDateShort,
  full: formatDateFull,
  key: formatDateKey
} as const

/**
 * 所有驗證函數
 */
export const Validators = {
  file: validateFile,
  event: validateEvent,
  image: validateGalleryItem,
  email: validateEmail,
  url: validateUrl,
  date: validateDateString
} as const

/**
 * 攝影相關格式化函數
 */
export const PhotoFormatters = {
  shutterSpeed: formatShutterSpeed,
  aperture: formatAperture,
  iso: formatISO,
  focalLength: formatFocalLength,
  camera: formatCameraName
} as const