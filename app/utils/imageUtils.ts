import type { GalleryItem, ExifData } from '~~/shared/types/gallery'
import {
  FOCAL_LENGTH_CATEGORIES,
  APERTURE_CATEGORIES,
  ISO_CATEGORIES,
  TAG_PRIORITY
} from '~~/shared/config/constants'

/**
 * 圖片處理核心工具函數
 * 專注於圖片分析、標籤生成、EXIF 處理等核心功能
 *
 * 注意：格式化函數已移至 formatters.ts
 */

// ==================== EXIF 數據處理 ====================

/**
 * 從 EXIF 提取拍攝時間
 * 優先順序：DateTimeOriginal (原始拍攝時間) > DateTime (修改時間) > CreateDate (創建時間)
 */
export const extractCaptureTime = (exif: ExifData): Date => {
  // 嘗試提取各種時間格式
  const timeFields = [
    exif?.DateTimeOriginal,
    exif?.DateTime,
    exif?.CreateDate
  ]

  for (const timeField of timeFields) {
    if (timeField) {
      try {
        const parsedTime = new Date(timeField)
        // 驗證時間是否有效（不是無效日期且在合理範圍內）
        if (!isNaN(parsedTime.getTime()) && parsedTime.getFullYear() > 1900) {
          return parsedTime
        }
      } catch (error) {
        console.warn('無法解析 EXIF 時間:', timeField, error)
        continue
      }
    }
  }

  // 如果所有 EXIF 時間都無效，返回當前時間
  console.warn('無法從 EXIF 提取有效的拍攝時間，使用當前時間')
  return new Date()
}

/**
 * 驗證和清理 EXIF 數據
 *
 * exifr 回傳值型別為 `unknown`，欄位可能缺漏或型別不符；用小型 helper 將欄位
 * 收斂到 ExifData 期望的 string / number / Date|string 型別，避免下游使用時又要重複防禦。
 */
const asString = (v: unknown): string =>
  typeof v === 'string' ? v : ''

const asNumber = (v: unknown): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : 0

const asDateLike = (v: unknown): string | Date | undefined =>
  v instanceof Date ? v : (typeof v === 'string' ? v : undefined)

export const normalizeExifData = (exif: Record<string, unknown>): ExifData => {
  return {
    Make: asString(exif?.Make),
    Model: asString(exif?.Model),
    FocalLength: asNumber(exif?.FocalLength),
    FNumber: asNumber(exif?.FNumber),
    ISO: asNumber(exif?.ISO),
    ExposureTime: asNumber(exif?.ExposureTime),
    DateTimeOriginal: asDateLike(exif?.DateTimeOriginal),
    DateTime: asDateLike(exif?.DateTime),
    CreateDate: asDateLike(exif?.CreateDate)
  }
}

// ==================== 分類工具 ====================

/**
 * 根據焦距分類鏡頭類型
 */
export const categorizeFocalLength = (focalLength: number): string => {
  for (const [_key, category] of Object.entries(FOCAL_LENGTH_CATEGORIES)) {
    if ('max' in category && focalLength <= category.max) {
      return category.label
    }
    if ('min' in category && 'max' in category && focalLength >= category.min && focalLength <= category.max) {
      return category.label
    }
    if ('min' in category && !('max' in category) && focalLength >= category.min) {
      return category.label
    }
  }
  return '標準'
}

/**
 * 根據光圈值分類
 */
export const categorizeAperture = (aperture: number): string => {
  for (const category of Object.values(APERTURE_CATEGORIES)) {
    if ('max' in category && aperture <= category.max) {
      return category.label
    }
    if ('min' in category && 'max' in category && aperture >= category.min && aperture <= category.max) {
      return category.label
    }
    if ('min' in category && !('max' in category) && aperture >= category.min) {
      return category.label
    }
  }
  return '中等光圈'
}

/**
 * 根據 ISO 值分類
 */
export const categorizeISO = (iso: number): string => {
  for (const category of Object.values(ISO_CATEGORIES)) {
    if ('max' in category && iso <= category.max) {
      return category.label
    }
    if ('min' in category && 'max' in category && iso >= category.min && iso <= category.max) {
      return category.label
    }
    if ('min' in category && !('max' in category) && iso >= category.min) {
      return category.label
    }
  }
  return '中等ISO'
}

// ==================== 智能標籤生成 ====================

/**
 * 基於 EXIF 數據生成智能標籤
 */
export const generateSmartTags = (exif: ExifData, filename: string, userTags?: string): string[] => {
  const tags: string[] = []

  // 基於焦距判斷鏡頭類型
  if (exif?.FocalLength) {
    tags.push(categorizeFocalLength(exif.FocalLength))
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

  if (filename.includes('室內') || filename.includes('indoor')) {
    tags.push('室內')
  } else if (filename.includes('室外') || filename.includes('outdoor')) {
    tags.push('室外')
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

/**
 * 獲取主要標籤（按優先順序）
 */
export const getPrimaryTag = (image: GalleryItem): string | null => {
  if (!image.tags || image.tags.length === 0) {
    return null
  }

  for (const tag of TAG_PRIORITY) {
    if (image.tags.includes(tag)) {
      return tag
    }
  }

  return image.tags[0] ?? null
}

// ==================== 標題和描述生成 ====================

/**
 * 根據檔名生成標題和描述
 */
export const generateTitleAndDescription = (filename: string): { title: string; description: string } => {
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

/**
 * 獲取顯示標題
 */
export const getDisplayTitle = (image: GalleryItem): string => {
  if (image.camera) {
    const number = image.filename.match(/DSC_(\d+)/)?.[1]
    return number ? `攝影 #${number}` : '攝影作品'
  }
  return image.title
}

// ==================== 檔案工具 ====================
//
/**
 * 生成唯一的圖片 ID
 */
export const generateImageId = (category: 'digital' | 'photography', filename: string): string => {
  return `${category}-${filename.replace(/\.[^/.]+$/, '')}`
}

// ==================== 版面工具 ====================

/**
 * 根據 index 決定圖片卡片高度 class（瀑布流錯落效果）
 */
export const getImageClass = (index: number): string => {
  const classes = ['h-64', 'h-80', 'h-48', 'h-72', 'h-56'] as const
  // 陣列為 const literal，長度 ≥ 1，modulo 後一定命中；以非 null 斷言收掉 noUncheckedIndexedAccess。
  return classes[index % classes.length]!
}