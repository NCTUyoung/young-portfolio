import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs'

type ImgRecord = {
  filename: string
  event?: { name?: string }
  [key: string]: unknown
}

type CategoryData = {
  Img: ImgRecord[]
  totalNumber: string
  eventStats?: Record<string, number>
}

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

    // 檢查圖片是否存在於資料中
    const imageIndex = categoryData.Img.findIndex((img) => img.filename === filename)
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

    // 更新事件統計
    if (imageRecord.event?.name) {
      const eventName = imageRecord.event.name
      if (categoryData.eventStats && categoryData.eventStats[eventName]) {
        categoryData.eventStats[eventName] -= 1
        if (categoryData.eventStats[eventName] <= 0) {
          Reflect.deleteProperty(categoryData.eventStats, eventName)
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
  } catch (error: unknown) {
    console.error('Delete image error:', error)
    const err = error as { statusCode?: number }
    if (err.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: '刪除圖片失敗: ' + (error instanceof Error ? error.message : String(error))
    })
  }
})
