import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { removeThumbsForPublicImageFilename } from '../utils/thumbFromSource'
import { readGalleryData, updateGalleryData } from '../utils/galleryDataStore'
import type { GalleryCategory } from '../utils/galleryDataStore'

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
    const { filename, category } = body as {
      filename?: string
      category?: GalleryCategory
    }

    if (!filename || !category) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少必要參數 filename 或 category'
      })
    }

    const imagePath = `./public/images/${filename}`

    const existing = await readGalleryData(category)
    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: '找不到圖庫資料檔案'
      })
    }

    await updateGalleryData(
      category,
      () => existing,
      (data) => {
        const typed = data as unknown as CategoryData
        const imageIndex = typed.Img.findIndex((img) => img.filename === filename)
        if (imageIndex === -1) {
          throw createError({
            statusCode: 404,
            statusMessage: '找不到指定的圖片記錄'
          })
        }
        const imageRecord = typed.Img[imageIndex]
        typed.Img.splice(imageIndex, 1)
        typed.totalNumber = typed.Img.length.toString()

        const eventName = imageRecord?.event?.name
        if (eventName && typed.eventStats?.[eventName]) {
          typed.eventStats[eventName] -= 1
          if (typed.eventStats[eventName] <= 0) {
            Reflect.deleteProperty(typed.eventStats, eventName)
          }
        }
        return data
      }
    )

    // JSON 成功寫入後再刪實體檔案（失敗不會造成資料不一致留孤兒記錄）
    if (existsSync(imagePath)) {
      try { await unlink(imagePath) } catch (err) { console.warn('刪除原圖失敗:', err) }
    }
    removeThumbsForPublicImageFilename(filename)

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
