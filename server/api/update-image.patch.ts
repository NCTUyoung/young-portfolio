import { readFileSync, writeFileSync } from 'fs'
import type { PhotographyData, GalleryData } from '~/types/gallery'
import { formatDateFull } from '~/utils/formatters'

type ImgRecord = Record<string, unknown>
type CategoryData = (PhotographyData | GalleryData) & { Img: ImgRecord[] }

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'PATCH') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    const body = await readBody(event)
    const { filename, category, updates } = body

    console.log('Update image request:', { filename, category, updates })

    if (!filename || !category || !updates) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少必要參數 filename、category 或 updates'
      })
    }

    // 選擇對應的JSON檔案
    const jsonFileName = category === 'photography' ? 'photographyList.json' : 'galleryList.json'
    const jsonPath = `./public/${jsonFileName}`

    // 讀取 JSON 數據
    let categoryData: CategoryData
    try {
      const jsonContent = readFileSync(jsonPath, 'utf-8')
      categoryData = JSON.parse(jsonContent)
    } catch {
      throw createError({
        statusCode: 404,
        statusMessage: '找不到圖庫資料檔案'
      })
    }

    // 找到要更新的圖片
    const imageIndex = categoryData.Img.findIndex((img) => img.filename === filename)
    if (imageIndex === -1) {
      throw createError({
        statusCode: 404,
        statusMessage: '找不到指定的圖片記錄'
      })
    }

    // 處理更新數據
    const processedUpdates: Record<string, unknown> = { ...updates }

    // 如果有日期更新，轉換為正確格式
    if (updates.date) {
      try {
        console.log('Original date from client:', updates.date)
        const date = new Date(updates.date)
        console.log('Parsed date object:', date)
        const formattedDate = formatDateFull(date)
        console.log('Formatted date:', formattedDate)
        processedUpdates.time = formattedDate
        Reflect.deleteProperty(processedUpdates, 'date') // 移除原始 date 字段
      } catch (err) {
        console.warn('Invalid date format:', updates.date, err)
      }
    }

    // 更新圖片資訊
    const originalImage = categoryData.Img[imageIndex]
    const updatedImage: ImgRecord = { ...originalImage, ...processedUpdates }

    // 如果是攝影作品且有標籤更新，需要處理標籤格式
    if (category === 'photography' && updates.tags) {
      if (typeof updates.tags === 'string') {
        // 如果是字符串，分割成陣列
        updatedImage.tags = updates.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag)
      }
    }

    categoryData.Img[imageIndex] = updatedImage

    console.log('Updated image data:', updatedImage)

    // 寫入更新後的 JSON
    writeFileSync(jsonPath, JSON.stringify(categoryData, null, 2), 'utf-8')

    console.log('Successfully wrote updated data to file')

    return {
      success: true,
      message: '圖片資訊更新成功',
      updatedImage
    }
  } catch (error: unknown) {
    console.error('Update image error:', error)
    const err = error as { statusCode?: number }
    if (err.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: '更新圖片資訊失敗: ' + (error instanceof Error ? error.message : String(error))
    })
  }
})
