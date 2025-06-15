import { readFileSync, writeFileSync } from 'fs'
import type { PhotographyData, GalleryData } from '~/types/gallery'

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'PATCH') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    const body = await readBody(event)
    const {
      originalEventName,
      newEventName,
      newDescription,
      newLocation,
      category
    } = body

    if (!originalEventName || !newEventName || !category) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少必要參數 originalEventName、newEventName 或 category'
      })
    }

    // 選擇對應的JSON檔案
    const jsonFileName = category === 'photography' ? 'photographyList.json' : 'galleryList.json'
    const jsonPath = `./public/${jsonFileName}`

    // 讀取 JSON 數據
    let categoryData
    try {
      const jsonContent = readFileSync(jsonPath, 'utf-8')
      categoryData = JSON.parse(jsonContent)
    } catch (error) {
      throw createError({
        statusCode: 404,
        statusMessage: '找不到圖庫資料檔案'
      })
    }

    // 找到該事件的所有圖片並更新事件資訊
    let updatedCount = 0
    categoryData.Img.forEach((img: any) => {
      // 檢查是否屬於要更新的事件
      if (category === 'photography' && img.event) {
        if (img.event.name === originalEventName) {
          // 更新攝影作品的事件資訊
          img.event.name = newEventName
          img.event.description = newDescription || ''
          img.event.location = newLocation || ''
          updatedCount++
        }
      } else if (category === 'gallery') {
        // 對於繪圖作品，可能需要根據其他條件判斷事件歸屬
        // 這裡暫時跳過，因為繪圖作品目前沒有明確的事件關聯機制
        // 如果需要可以後續擴展
      }
    })

    if (updatedCount === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: '找不到指定事件的圖片記錄'
      })
    }

    // 寫入更新後的 JSON
    writeFileSync(jsonPath, JSON.stringify(categoryData, null, 2), 'utf-8')

    return {
      success: true,
      message: `成功更新事件資訊，共更新 ${updatedCount} 張圖片`,
      updatedCount
    }

  } catch (error: any) {
    console.error('Update event error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: '更新事件資訊失敗: ' + (error instanceof Error ? error.message : String(error))
    })
  }
})