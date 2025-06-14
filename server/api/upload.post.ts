import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { formidable } from 'formidable'
import exifr from 'exifr'
import {
  generateSmartTags,
  generateTitleAndDescription,
  extractCaptureTime,
  normalizeExifData,
  formatDate
} from '~/utils/photoUtils'
import type { ExifData, PhotographyData, GalleryData } from '~/types/gallery'

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    const form = formidable({
      maxFiles: 20,
      maxFileSize: 50 * 1024 * 1024, // 50MB per file
      maxTotalFileSize: 200 * 1024 * 1024, // 200MB total
      uploadDir: './public/images',
      keepExtensions: true,
      multiples: true
    })

    // 確保上傳目錄存在
    if (!existsSync('./public/images')) {
      mkdirSync('./public/images', { recursive: true })
    }

    const [fields, files] = await form.parse(event.node.req)

    const uploadedFiles = []
    const eventName = fields.event?.[0] || 'default'
    const category = fields.category?.[0] || 'gallery' // 'gallery' 或 'photography'
    const eventDescription = fields.eventDescription?.[0] || ''
    const eventLocation = fields.eventLocation?.[0] || ''

    const categoryDir = join('./public/images', category)
    const eventDir = join(categoryDir, eventName)

    // 創建分類和事件目錄
    if (!existsSync(categoryDir)) {
      mkdirSync(categoryDir, { recursive: true })
    }
    if (!existsSync(eventDir)) {
      mkdirSync(eventDir, { recursive: true })
    }

    // 處理上傳的檔案
    const fileList = Array.isArray(files.files) ? files.files : [files.files].filter(Boolean)

    for (const file of fileList) {
      if (file) {
        const originalName = file.originalFilename || 'unnamed'
        const newPath = join(eventDir, originalName)

                // 移動檔案到目標位置
        const fs = await import('fs/promises')
        await fs.rename(file.filepath, newPath)

        // 根據分類建立不同的資料結構
                if (category === 'photography') {
          // 攝影作品結構 - 自動提取 EXIF 資訊
          let rawExifData: any = {}

          try {
            rawExifData = await exifr.parse(newPath)
          } catch (error) {
            console.warn(`無法讀取 ${originalName} 的 EXIF 資訊:`, error)
          }

          // 標準化 EXIF 數據
          const exifData = normalizeExifData(rawExifData)

          // 提取拍攝時間
          const captureTime = extractCaptureTime(exifData)

          // 生成標題和描述
          const { title: autoTitle, description: autoDescription } = generateTitleAndDescription(originalName)

          // 基於拍攝參數產生智能標籤
          const tags = generateSmartTags(exifData, originalName, fields[`tags_${originalName}`]?.[0])

          uploadedFiles.push({
            filename: `${category}/${eventName}/${originalName}`,
            time: formatDate(captureTime),
            title: fields[`title_${originalName}`]?.[0] || autoTitle,
            content: fields[`content_${originalName}`]?.[0] || autoDescription,
            tags: tags,
            event: {
              name: eventName,
              description: eventDescription,
              location: eventLocation
            },
            camera: exifData.Make,
            model: exifData.Model,
            focalLength: exifData.FocalLength,
            aperture: exifData.FNumber,
            iso: exifData.ISO,
            shutterSpeed: exifData.ExposureTime
          })
        } else {
          // 繪圖作品結構
          uploadedFiles.push({
            filename: `${category}/${eventName}/${originalName}`,
            time: formatDate(new Date()),
            title: fields[`title_${originalName}`]?.[0] || originalName.split('.')[0],
            content: fields[`content_${originalName}`]?.[0] || '',
            color: fields[`color_${originalName}`]?.[0] || 'blue'
          })
        }
      }
    }

    // 選擇對應的JSON檔案
    const jsonFileName = category === 'photography' ? 'photographyList.json' : 'galleryList.json'
    const jsonPath = `./public/${jsonFileName}`
    let categoryData

    try {
      const jsonContent = readFileSync(jsonPath, 'utf-8')
      categoryData = JSON.parse(jsonContent)
    } catch (error) {
      // 根據分類建立初始結構
      if (category === 'photography') {
        categoryData = {
          totalNumber: "0",
          category: "photography" as const,
          eventStats: {},
          Img: []
        } as PhotographyData
      } else {
        categoryData = {
          totalNumber: "0",
          Img: []
        } as GalleryData
      }
    }

    // 添加新上傳的圖片到JSON
    categoryData.Img.push(...uploadedFiles)
    categoryData.totalNumber = categoryData.Img.length.toString()

    // 更新事件統計（僅攝影類別）
    if (category === 'photography') {
      if (!categoryData.eventStats) categoryData.eventStats = {}
      if (!categoryData.eventStats[eventName]) {
        categoryData.eventStats[eventName] = 0
      }
      categoryData.eventStats[eventName] += uploadedFiles.length
    }

    // 寫入更新後的JSON
    writeFileSync(jsonPath, JSON.stringify(categoryData, null, 2), 'utf-8')

    return {
      success: true,
      message: `成功上傳 ${uploadedFiles.length} 個${category === 'photography' ? '攝影' : '繪圖'}作品`,
      files: uploadedFiles,
      category
    }

  } catch (error) {
    console.error('Upload error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: '上傳失敗: ' + (error instanceof Error ? error.message : String(error))
    })
  }
})