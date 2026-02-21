import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'DELETE') {
    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
  }

  try {
    const body = await readBody(event)
    const { eventName, category } = body

    if (!eventName || !category) {
      throw createError({ statusCode: 400, statusMessage: '缺少必要參數 eventName 或 category' })
    }

    const jsonFileName = category === 'photography' ? 'photographyList.json' : 'galleryList.json'
    const jsonPath = `./public/${jsonFileName}`

    let categoryData: any
    try {
      const jsonContent = readFileSync(jsonPath, 'utf-8')
      categoryData = JSON.parse(jsonContent)
    } catch {
      throw createError({ statusCode: 404, statusMessage: '找不到圖庫資料檔案' })
    }

    // 找出屬於該事件的所有圖片
    const toDelete: any[] = []
    const remaining: any[] = []

    categoryData.Img.forEach((img: any) => {
      let imgEvent = ''
      if (img.event?.name) {
        imgEvent = img.event.name
      } else if (category === 'gallery') {
        const year = new Date(img.time).getFullYear()
        imgEvent = `${year}年電繪作品`
      } else {
        imgEvent = '預設事件'
      }

      if (imgEvent === eventName) {
        toDelete.push(img)
      } else {
        remaining.push(img)
      }
    })

    if (toDelete.length === 0) {
      throw createError({ statusCode: 404, statusMessage: '找不到該事件的圖片記錄' })
    }

    // 刪除實體檔案
    let deletedFiles = 0
    for (const img of toDelete) {
      const imagePath = `./public/images/${img.filename}`
      if (existsSync(imagePath)) {
        try {
          unlinkSync(imagePath)
          deletedFiles++
        } catch (e) {
          console.warn(`Failed to delete file: ${img.filename}`, e)
        }
      }
    }

    // 更新 JSON
    categoryData.Img = remaining
    categoryData.totalNumber = remaining.length.toString()

    // 清除 eventStats
    if (categoryData.eventStats && categoryData.eventStats[eventName]) {
      delete categoryData.eventStats[eventName]
    }

    writeFileSync(jsonPath, JSON.stringify(categoryData, null, 2), 'utf-8')

    return {
      success: true,
      message: `成功刪除事件「${eventName}」，共刪除 ${toDelete.length} 張圖片（${deletedFiles} 個檔案）`,
      deletedCount: toDelete.length
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: '刪除事件失敗: ' + (error instanceof Error ? error.message : String(error))
    })
  }
})
