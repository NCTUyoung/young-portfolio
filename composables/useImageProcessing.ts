import { ref, computed } from 'vue'
import type { GalleryItem, ExifData } from '~/types/gallery'
import {
  FOCAL_LENGTH_CATEGORIES,
  APERTURE_CATEGORIES,
  ISO_CATEGORIES,
  TAG_PRIORITY
} from '~/config/constants'
import { formatDateKey } from '~/utils/formatters'

/**
 * 圖片處理相關的 composable
 * 處理圖片分析、標籤生成、EXIF 數據等有狀態的邏輯
 */
export const useImageProcessing = () => {
  // 響應式狀態
  const isProcessing = ref(false)
  const processingProgress = ref(0)
  const processedImages = ref<GalleryItem[]>([])

  // ==================== 分類邏輯 ====================

  /**
   * 根據焦距分類鏡頭類型
   */
  const categorizeFocalLength = (focalLength: number): string => {
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
  const categorizeAperture = (aperture: number): string => {
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
  const categorizeISO = (iso: number): string => {
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
  const generateSmartTags = (exif: ExifData, filename: string, userTags?: string): string[] => {
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
  const getPrimaryTag = (image: GalleryItem): string | null => {
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
  const generateTitleAndDescription = (filename: string): { title: string; description: string } => {
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
  const getDisplayTitle = (image: GalleryItem): string => {
    if (image.camera) {
      const number = image.filename.match(/DSC_(\d+)/)?.[1]
      return number ? `攝影 #${number}` : '攝影作品'
    }
    return image.title
  }

  // ==================== EXIF 數據處理 ====================

  /**
   * 從 EXIF 提取拍攝時間
   */
  const extractCaptureTime = (exif: ExifData): Date => {
    if (exif?.DateTimeOriginal) {
      return new Date(exif.DateTimeOriginal)
    } else if (exif?.DateTime) {
      return new Date(exif.DateTime)
    } else if (exif?.CreateDate) {
      return new Date(exif.CreateDate)
    }
    return new Date()
  }

  /**
   * 驗證和清理 EXIF 數據
   */
  const normalizeExifData = (exif: any): ExifData => {
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

  // ==================== 批量處理 ====================

  /**
   * 批量處理圖片數據
   */
  const batchProcessImages = async (
    images: GalleryItem[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<GalleryItem[]> => {
    isProcessing.value = true
    processingProgress.value = 0

    const processed: GalleryItem[] = []

    for (let i = 0; i < images.length; i++) {
      const image = images[i]

      // 處理單張圖片
      const processedImage = {
        ...image,
        title: image.title || generateTitleAndDescription(image.filename).title,
        description: image.description || generateTitleAndDescription(image.filename).description
      }

      processed.push(processedImage)

      // 更新進度
      processingProgress.value = Math.round(((i + 1) / images.length) * 100)
      onProgress?.(i + 1, images.length)

      // 避免阻塞 UI
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    processedImages.value = processed
    isProcessing.value = false

    return processed
  }

  // ==================== 圖片分析 ====================

  /**
   * 分析圖片集合的統計數據
   */
  const analyzeImageCollection = computed(() => {
    const images = processedImages.value

    return {
      total: images.length,
      categories: {
        digital: images.filter(img => img.category === 'digital').length,
        photography: images.filter(img => img.category === 'photography').length
      },
      tags: (() => {
        const tagCounts = new Map<string, number>()
        images.forEach(img => {
          img.tags?.forEach(tag => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
          })
        })
        return Array.from(tagCounts.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10) // 前10個最常用標籤
      })(),
      cameras: (() => {
        const cameraCounts = new Map<string, number>()
        images.forEach(img => {
          if (img.camera) {
            const cameraName = `${img.camera} ${img.model}`.trim()
            cameraCounts.set(cameraName, (cameraCounts.get(cameraName) || 0) + 1)
          }
        })
        return Array.from(cameraCounts.entries()).sort(([,a], [,b]) => b - a)
      })()
    }
  })

  return {
    // 狀態
    isProcessing: readonly(isProcessing),
    processingProgress: readonly(processingProgress),
    processedImages: readonly(processedImages),

    // 計算屬性
    analyzeImageCollection,

    // 方法
    categorizeFocalLength,
    categorizeAperture,
    categorizeISO,
    generateSmartTags,
    getPrimaryTag,
    generateTitleAndDescription,
    getDisplayTitle,
    extractCaptureTime,
    normalizeExifData,
    batchProcessImages
  }
}