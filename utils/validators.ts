import type { PhotoEvent, ExifData, GalleryItem } from '~/types/gallery'
import { SUPPORTED_IMAGE_FORMATS, MAX_FILE_SIZE_MB } from '~/config/constants'

/**
 * 統一驗證工具函數
 * 處理各種數據驗證邏輯
 */

// ==================== 檔案驗證 ====================

/**
 * 檢查是否為有效的圖片文件
 */
export const isValidImageFile = (filename: string): boolean => {
  return SUPPORTED_IMAGE_FORMATS.some(ext => filename.toLowerCase().endsWith(ext))
}

/**
 * 檢查檔案大小是否符合限制
 */
export const isValidFileSize = (sizeInBytes: number): boolean => {
  const sizeInMB = sizeInBytes / (1024 * 1024)
  return sizeInMB <= MAX_FILE_SIZE_MB
}

/**
 * 檢查檔案類型是否為圖片
 */
export const isImageMimeType = (mimeType: string): boolean => {
  return mimeType.startsWith('image/')
}

/**
 * 綜合檔案驗證
 */
export const validateFile = (file: File): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!isImageMimeType(file.type)) {
    errors.push('檔案必須是圖片格式')
  }

  if (!isValidImageFile(file.name)) {
    errors.push(`檔案格式不支援，支援的格式: ${SUPPORTED_IMAGE_FORMATS.join(', ')}`)
  }

  if (!isValidFileSize(file.size)) {
    errors.push(`檔案大小不能超過 ${MAX_FILE_SIZE_MB}MB`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// ==================== 事件驗證 ====================

/**
 * 驗證事件數據的完整性
 */
export const validateEvent = (event: Partial<PhotoEvent>): event is PhotoEvent => {
  return !!(event.name && event.description !== undefined && event.location !== undefined)
}

/**
 * 驗證事件名稱格式
 */
export const validateEventName = (name: string): { valid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: '事件名稱不能為空' }
  }

  if (name.trim().length < 2) {
    return { valid: false, error: '事件名稱至少需要2個字符' }
  }

  if (name.trim().length > 50) {
    return { valid: false, error: '事件名稱不能超過50個字符' }
  }

  return { valid: true }
}

/**
 * 驗證事件描述
 */
export const validateEventDescription = (description: string): { valid: boolean; error?: string } => {
  if (description.length > 200) {
    return { valid: false, error: '事件描述不能超過200個字符' }
  }

  return { valid: true }
}

/**
 * 驗證事件地點
 */
export const validateEventLocation = (location: string): { valid: boolean; error?: string } => {
  if (location.length > 100) {
    return { valid: false, error: '事件地點不能超過100個字符' }
  }

  return { valid: true }
}

/**
 * 綜合事件驗證
 */
export const validateEventData = (event: Partial<PhotoEvent>): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (event.name !== undefined) {
    const nameValidation = validateEventName(event.name)
    if (!nameValidation.valid && nameValidation.error) {
      errors.push(nameValidation.error)
    }
  }

  if (event.description !== undefined) {
    const descriptionValidation = validateEventDescription(event.description)
    if (!descriptionValidation.valid && descriptionValidation.error) {
      errors.push(descriptionValidation.error)
    }
  }

  if (event.location !== undefined) {
    const locationValidation = validateEventLocation(event.location)
    if (!locationValidation.valid && locationValidation.error) {
      errors.push(locationValidation.error)
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// ==================== EXIF 驗證 ====================

/**
 * 驗證 EXIF 數據的有效性
 */
export const validateExifData = (exif: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  // 檢查必要的 EXIF 字段
  if (exif.FocalLength && (typeof exif.FocalLength !== 'number' || exif.FocalLength <= 0)) {
    errors.push('焦距必須是正數')
  }

  if (exif.FNumber && (typeof exif.FNumber !== 'number' || exif.FNumber <= 0)) {
    errors.push('光圈值必須是正數')
  }

  if (exif.ISO && (typeof exif.ISO !== 'number' || exif.ISO <= 0)) {
    errors.push('ISO 值必須是正數')
  }

  if (exif.ExposureTime && (typeof exif.ExposureTime !== 'number' || exif.ExposureTime <= 0)) {
    errors.push('快門速度必須是正數')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 檢查 EXIF 數據是否完整
 */
export const hasCompleteExifData = (exif: ExifData): boolean => {
  return !!(
    exif.Make &&
    exif.Model &&
    exif.FocalLength &&
    exif.FNumber &&
    exif.ISO &&
    exif.ExposureTime
  )
}

// ==================== 圖片數據驗證 ====================

/**
 * 驗證圖片標題
 */
export const validateImageTitle = (title: string): { valid: boolean; error?: string } => {
  if (!title || title.trim().length === 0) {
    return { valid: false, error: '圖片標題不能為空' }
  }

  if (title.trim().length > 100) {
    return { valid: false, error: '圖片標題不能超過100個字符' }
  }

  return { valid: true }
}

/**
 * 驗證圖片描述
 */
export const validateImageDescription = (description: string): { valid: boolean; error?: string } => {
  if (description.length > 500) {
    return { valid: false, error: '圖片描述不能超過500個字符' }
  }

  return { valid: true }
}

/**
 * 驗證圖片標籤
 */
export const validateImageTags = (tags: string[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (tags.length > 10) {
    errors.push('圖片標籤不能超過10個')
  }

  tags.forEach((tag, index) => {
    if (tag.trim().length === 0) {
      errors.push(`第${index + 1}個標籤不能為空`)
    }
    if (tag.trim().length > 20) {
      errors.push(`第${index + 1}個標籤不能超過20個字符`)
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 綜合圖片數據驗證
 */
export const validateGalleryItem = (item: Partial<GalleryItem>): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (item.title !== undefined) {
    const titleValidation = validateImageTitle(item.title)
    if (!titleValidation.valid && titleValidation.error) {
      errors.push(titleValidation.error)
    }
  }

  if (item.description !== undefined) {
    const descriptionValidation = validateImageDescription(item.description)
    if (!descriptionValidation.valid && descriptionValidation.error) {
      errors.push(descriptionValidation.error)
    }
  }

  if (item.tags !== undefined) {
    const tagsValidation = validateImageTags(item.tags)
    if (!tagsValidation.valid) {
      errors.push(...tagsValidation.errors)
    }
  }

  if (item.filename !== undefined && !isValidImageFile(item.filename)) {
    errors.push('檔案名稱格式不正確')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// ==================== 表單驗證 ====================

/**
 * 驗證電子郵件格式
 */
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!email || email.trim().length === 0) {
    return { valid: false, error: '電子郵件不能為空' }
  }

  if (!emailRegex.test(email)) {
    return { valid: false, error: '電子郵件格式不正確' }
  }

  return { valid: true }
}

/**
 * 驗證 URL 格式
 */
export const validateUrl = (url: string): { valid: boolean; error?: string } => {
  try {
    new URL(url)
    return { valid: true }
  } catch {
    return { valid: false, error: 'URL 格式不正確' }
  }
}

/**
 * 驗證日期格式 (YYYY-MM-DD)
 */
export const validateDateString = (dateString: string): { valid: boolean; error?: string } => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/

  if (!dateRegex.test(dateString)) {
    return { valid: false, error: '日期格式必須為 YYYY-MM-DD' }
  }

  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    return { valid: false, error: '日期格式不正確' }
  }

  return { valid: true }
}

// ==================== 通用驗證 ====================

/**
 * 檢查是否為空值
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * 檢查數值範圍
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max
}

/**
 * 檢查字串長度
 */
export const isValidLength = (str: string, min: number, max: number): boolean => {
  const length = str.trim().length
  return length >= min && length <= max
}