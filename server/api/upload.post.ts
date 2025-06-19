import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { formidable } from 'formidable'
import exifr from 'exifr'
import {
  generateSmartTags,
  generateTitleAndDescription,
  extractCaptureTime,
  normalizeExifData,
  formatDate,
  inferEventFromTime
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
    const category = (fields.category?.[0] || 'gallery') as 'gallery' | 'photography'
    const manualEventName = fields.event?.[0] || ''
    const eventDescription = fields.eventDescription?.[0] || ''
    const eventLocation = fields.eventLocation?.[0] || ''

    const categoryDir = join('./public/images', category)

    // 創建分類目錄
    if (!existsSync(categoryDir)) {
      mkdirSync(categoryDir, { recursive: true })
    }

    // 處理上傳的檔案
    const fileList = Array.isArray(files.files) ? files.files : [files.files].filter(Boolean)

    for (const file of fileList) {
      if (file) {
        const originalName = file.originalFilename || 'unnamed'

        // 先確定檔案的創作/拍攝時間
        let captureTime = new Date()

        if (category === 'photography') {
          // 攝影作品：優先從 EXIF 提取拍攝時間
          let rawExifData: any = {}

          try {
            rawExifData = await exifr.parse(file.filepath)
          } catch (error) {
            console.warn(`無法讀取 ${originalName} 的 EXIF 資訊:`, error)
          }

          // 標準化 EXIF 數據
          const exifData = normalizeExifData(rawExifData)

          // 提取拍攝時間
          const exifTime = extractCaptureTime(exifData)
          if (exifTime) {
            captureTime = exifTime
          }

          // 攝影作品使用手動填寫的事件名稱
          const eventInfo = {
            name: manualEventName,
            description: eventDescription,
            location: eventLocation
          }

          // 創建事件目錄
          const eventDir = join(categoryDir, eventInfo.name)
          if (!existsSync(eventDir)) {
            mkdirSync(eventDir, { recursive: true })
          }

          // 移動檔案到事件目錄
          const newPath = join(eventDir, originalName)
          const fs = await import('fs/promises')
          await fs.rename(file.filepath, newPath)

          // 生成標題和描述
          const { title: autoTitle, description: autoDescription } = generateTitleAndDescription(originalName)

          // 基於拍攝參數產生智能標籤
          const tags = generateSmartTags(exifData, originalName, fields[`tags_${originalName}`]?.[0])

          uploadedFiles.push({
            filename: `${category}/${eventInfo.name}/${originalName}`,
            time: formatDate(captureTime),
            title: fields[`title_${originalName}`]?.[0] || autoTitle,
            content: fields[`content_${originalName}`]?.[0] || autoDescription,
            tags: tags,
            event: eventInfo,
            camera: exifData.Make,
            model: exifData.Model,
            focalLength: exifData.FocalLength,
            aperture: exifData.FNumber,
            iso: exifData.ISO,
            shutterSpeed: exifData.ExposureTime
          })
        } else {
          // 繪圖作品：優先使用用戶指定的創作日期，否則嘗試 EXIF
          const userCreationDate = fields[`creationDate_${originalName}`]?.[0]
          if (userCreationDate) {
            captureTime = new Date(userCreationDate)
          } else {
            // 嘗試讀取 EXIF 資料（電繪作品可能也有 EXIF）
            try {
              const rawExifData = await exifr.parse(file.filepath)
              if (rawExifData) {
                const exifData = normalizeExifData(rawExifData)
                const exifTime = extractCaptureTime(exifData)
                if (exifTime) {
                  captureTime = exifTime
                }
              }
            } catch (error) {
              console.warn(`無法讀取 ${originalName} 的 EXIF 資訊，使用當前時間`)
            }
          }

          // 繪圖作品根據時間自動推斷事件
          const eventInfo = inferEventFromTime(captureTime, category)

          // 創建事件目錄
          const eventDir = join(categoryDir, eventInfo.name)
          if (!existsSync(eventDir)) {
            mkdirSync(eventDir, { recursive: true })
          }

          // 移動檔案到事件目錄
          const newPath = join(eventDir, originalName)
          const fs = await import('fs/promises')
          await fs.rename(file.filepath, newPath)

          uploadedFiles.push({
            filename: `${category}/${eventInfo.name}/${originalName}`,
            time: formatDate(captureTime),
            title: fields[`title_${originalName}`]?.[0] || originalName.split('.')[0],
            content: fields[`content_${originalName}`]?.[0] || '',
            color: fields[`color_${originalName}`]?.[0] || 'blue',
            event: eventInfo
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

    // 更新事件統計
    if (!categoryData.eventStats) categoryData.eventStats = {}

    // 統計每個事件的圖片數量
    uploadedFiles.forEach(file => {
      if (file.event && file.event.name) {
        if (!categoryData.eventStats[file.event.name]) {
          categoryData.eventStats[file.event.name] = 0
        }
        categoryData.eventStats[file.event.name] += 1
      }
    })

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