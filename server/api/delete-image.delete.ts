import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import type { PhotographyData, GalleryData } from '~/types/gallery'

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'DELETE') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    const body = await readBody(event)
    const { filename, category } = body

    if (!filename || !category) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少必要參數 filename 或 category'
      })
    }

    // 選擇對應的JSON檔案
    const jsonFileName = category === 'photography' ? 'photographyList.json' : 'galleryList.json'
    const jsonPath = `./public/${jsonFileName}`
    const imagePath = `./public/images/${filename}`

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

    // 檢查圖片是否存在於資料中
    const imageIndex = categoryData.Img.findIndex((img: any) => img.filename === filename)
    if (imageIndex === -1) {
      throw createError({
        statusCode: 404,
        statusMessage: '找不到指定的圖片記錄'
      })
    }

    const imageRecord = categoryData.Img[imageIndex]

    // 刪除檔案系統中的圖片
    if (existsSync(imagePath)) {
      unlinkSync(imagePath)
    }

    // 從 JSON 資料中移除圖片記錄
    categoryData.Img.splice(imageIndex, 1)

    // 更新總數
    categoryData.totalNumber = categoryData.Img.length.toString()

    // 更新事件統計（僅攝影類別）
    if (category === 'photography' && imageRecord.event?.name) {
      const eventName = imageRecord.event.name
      if (categoryData.eventStats && categoryData.eventStats[eventName]) {
        categoryData.eventStats[eventName] -= 1

        // 如果事件圖片數為 0，移除該事件統計
        if (categoryData.eventStats[eventName] <= 0) {
          delete categoryData.eventStats[eventName]
        }
      }
    }

    // 寫入更新後的 JSON
    writeFileSync(jsonPath, JSON.stringify(categoryData, null, 2), 'utf-8')

    return {
      success: true,
      message: '圖片刪除成功',
      deletedFilename: filename
    }

    } catch (error: any) {
    console.error('Delete image error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: '刪除圖片失敗: ' + (error instanceof Error ? error.message : String(error))
    })
  }
})