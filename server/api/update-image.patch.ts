import type { PhotographyData, GalleryData } from '~~/shared/types/gallery'
import { formatDateFull } from '~/utils/formatters'
import { readGalleryData, updateGalleryData } from '../utils/galleryDataStore'
import type { GalleryCategory } from '../utils/galleryDataStore'

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
    const { filename, category, updates } = body as {
      filename?: string
      category?: GalleryCategory
      updates?: Record<string, unknown> & { date?: string; tags?: string | string[] }
    }

    if (!filename || !category || !updates) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少必要參數 filename、category 或 updates'
      })
    }

    const existing = await readGalleryData(category)
    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: '找不到圖庫資料檔案'
      })
    }

    // 處理更新數據（轉成純值，後面在 lock 內套用）
    const processedUpdates: Record<string, unknown> = { ...updates }
    if (updates.date) {
      try {
        const date = new Date(updates.date)
        processedUpdates.time = formatDateFull(date)
        Reflect.deleteProperty(processedUpdates, 'date')
      } catch (err) {
        console.warn('Invalid date format:', updates.date, err)
      }
    }

    let updatedImage: ImgRecord | null = null

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
        const originalImage = typed.Img[imageIndex]
        const next: ImgRecord = { ...originalImage, ...processedUpdates }
        if (category === 'photography' && typeof updates.tags === 'string') {
          next.tags = updates.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        }
        typed.Img[imageIndex] = next as CategoryData['Img'][number]
        updatedImage = next
        return data
      }
    )

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
