import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { removeThumbsForPublicImageFilename } from '../utils/thumbFromSource'
import { readGalleryData, updateGalleryData } from '../utils/galleryDataStore'
import type { GalleryCategory } from '../utils/galleryDataStore'

type ImgRecord = Record<string, unknown> & {
  event?: { name?: string }
  time?: string
  filename?: string
}
type CategoryData = {
  Img: ImgRecord[]
  totalNumber: string
  eventStats?: Record<string, unknown>
}

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'DELETE') {
    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
  }

  try {
    const body = await readBody(event)
    const { eventName, category } = body as {
      eventName?: string
      category?: GalleryCategory
    }

    if (!eventName || !category) {
      throw createError({ statusCode: 400, statusMessage: '缺少必要參數 eventName 或 category' })
    }

    const existing = await readGalleryData(category)
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: '找不到圖庫資料檔案' })
    }

    let toDelete: ImgRecord[] = []

    await updateGalleryData(
      category,
      () => existing,
      (data) => {
        const typed = data as unknown as CategoryData
        const keep: ImgRecord[] = []
        const drop: ImgRecord[] = []
        typed.Img.forEach((img) => {
          let imgEvent: string
          if (img.event?.name) {
            imgEvent = img.event.name
          } else if (category === 'gallery') {
            const year = new Date(img.time as string).getFullYear()
            imgEvent = `${year}年電繪作品`
          } else {
            imgEvent = '預設事件'
          }
          if (imgEvent === eventName) drop.push(img)
          else keep.push(img)
        })
        if (drop.length === 0) {
          throw createError({ statusCode: 404, statusMessage: '找不到該事件的圖片記錄' })
        }
        toDelete = drop
        typed.Img = keep
        typed.totalNumber = keep.length.toString()
        if (typed.eventStats && typed.eventStats[eventName]) {
          Reflect.deleteProperty(typed.eventStats, eventName)
        }
        return data
      }
    )

    // JSON 成功寫入後再刪實體檔案
    let deletedFiles = 0
    for (const img of toDelete) {
      const filename = img.filename
      const imagePath = `./public/images/${filename}`
      if (existsSync(imagePath)) {
        try {
          await unlink(imagePath)
          deletedFiles++
        } catch (e) {
          console.warn(`Failed to delete file: ${filename}`, e)
        }
      }
      if (filename) {
        removeThumbsForPublicImageFilename(filename)
      }
    }

    return {
      success: true,
      message: `成功刪除事件「${eventName}」，共刪除 ${toDelete.length} 張圖片（${deletedFiles} 個檔案）`,
      deletedCount: toDelete.length
    }
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string }
    if (err.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: '刪除事件失敗: ' + (error instanceof Error ? error.message : String(error))
    })
  }
})
