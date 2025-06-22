import type { GalleryItem, ExifData } from '~/types/gallery'
import {
  FOCAL_LENGTH_CATEGORIES,
  APERTURE_CATEGORIES,
  ISO_CATEGORIES,
  TAG_PRIORITY
} from '~/config/constants'
import {
  formatShutterSpeed,
  formatCameraName
} from './formatters'

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
 */
export const normalizeExifData = (exif: any): ExifData => {
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

// ==================== 分類工具 ====================

/**
 * 根據焦距分類鏡頭類型
 */
export const categorizeFocalLength = (focalLength: number): string => {
  for (const [key, category] of Object.entries(FOCAL_LENGTH_CATEGORIES)) {
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

  return image.tags[0]
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

// ==================== 檔案驗證 ====================

/**
 * 檢查是否為有效的圖片文件
 */
export const isValidImageFile = (filename: string): boolean => {
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff']
  return validExtensions.some(ext => filename.toLowerCase().endsWith(ext))
}

/**
 * 生成唯一的圖片 ID
 */
export const generateImageId = (category: 'digital' | 'photography', filename: string): string => {
  return `${category}-${filename.replace(/\.[^/.]+$/, '')}`
}