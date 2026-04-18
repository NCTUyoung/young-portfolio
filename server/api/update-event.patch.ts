import { updateGalleryData, readGalleryData } from '../utils/galleryDataStore'
import type { GalleryCategory } from '../utils/galleryDataStore'

type ImgRecord = {
  event?: { name?: string; description?: string; location?: string }
  [key: string]: unknown
}

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
    } = body as {
      originalEventName?: string
      newEventName?: string
      newDescription?: string
      newLocation?: string
      category?: GalleryCategory
    }

    if (!originalEventName || !newEventName || !category) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少必要參數 originalEventName、newEventName 或 category'
      })
    }

    // 先確認檔案存在
    const existing = await readGalleryData(category)
    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: '找不到圖庫資料檔案'
      })
    }

    let updatedCount = 0

    await updateGalleryData(
      category,
      () => existing,
      (data) => {
        const imgs = (data as unknown as { Img: ImgRecord[] }).Img
        imgs.forEach((img) => {
          if (img.event?.name === originalEventName) {
            img.event.name = newEventName
            img.event.description = newDescription || ''
            img.event.location = newLocation || ''
            updatedCount++
          }
        })
        return data
      }
    )

    if (updatedCount === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: '找不到指定事件的圖片記錄'
      })
    }

    return {
      success: true,
      message: `成功更新事件資訊，共更新 ${updatedCount} 張圖片`,
      updatedCount
    }
  } catch (error: unknown) {
    console.error('Update event error:', error)
    const err = error as { statusCode?: number }
    if (err.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: '更新事件資訊失敗: ' + (error instanceof Error ? error.message : String(error))
    })
  }
})
