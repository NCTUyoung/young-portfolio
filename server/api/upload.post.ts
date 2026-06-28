import { mkdirSync, existsSync } from 'fs'
import { unlink } from 'fs/promises'
import { extname, join, resolve } from 'path'
import { formidable } from 'formidable'
import exifr from 'exifr'
import {
  generateSmartTags,
  generateTitleAndDescription,
  extractCaptureTime,
  normalizeExifData
} from '~/utils/imageUtils'
import { formatDateFull } from '~/utils/formatters'
import { inferEventFromTime } from '~/utils/eventUtils'
import type { PhotographyData, GalleryData } from '~~/shared/types/gallery'
import { generateThumbsForPublicImage } from '../utils/thumbFromSource'
import { readGalleryData, updateGalleryData } from '../utils/galleryDataStore'
import { ratioOf, focalOf } from '../utils/imageGeometry.mjs'

/**
 * 本機 admin 上傳的防呆白名單：只允許可被瀏覽器顯示的靜態影像格式。
 * 擋下 .html / .svg / .js 等可能夾帶 script 的副檔名進入 public/ 。
 */
const ALLOWED_MIME = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif'
])
const ALLOWED_EXT = new Set<string>(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'])

function isAcceptableImage (mimetype: string | null | undefined, filename: string): boolean {
  const mimeOk = !!mimetype && ALLOWED_MIME.has(mimetype.toLowerCase())
  const extOk = ALLOWED_EXT.has(extname(filename).toLowerCase())
  return mimeOk && extOk
}

/**
 * 上傳即算幾何：縱橫比 + 內容感知焦點，與批次 `npm run ratios` 共用 server/utils/imageGeometry。
 * 在此寫入後，新作品落地即帶 aspectRatio/focalX/focalY，前台不再 fallback 到 DEFAULT_ASPECT_RATIO
 * 而把直幅塞進寬框裁掉頭。量不到（解析失敗）就略過該欄，元件端維持既有 fallback。
 */
async function geometryOf (sourcePath: string): Promise<{ aspectRatio?: number, focalX?: number, focalY?: number }> {
  const abs = resolve(process.cwd(), sourcePath)
  const [aspectRatio, focal] = await Promise.all([ratioOf(abs), focalOf(abs)])
  return {
    ...(aspectRatio !== null ? { aspectRatio } : {}),
    ...(focal ? { focalX: focal.focalX, focalY: focal.focalY } : {})
  }
}

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

    // uploadedFiles 在攝影 / 繪圖兩支同名陣列中分別 push 後成為 PhotographyData['Img'] / GalleryData['Img']；
    // 此處先以聯集型別承接，下游再依 category 收斂 cast。
    type UploadedRecord = PhotographyData['Img'][number] | GalleryData['Img'][number]
    const uploadedFiles: UploadedRecord[] = []
    const category = (fields.category?.[0] || 'gallery') as 'gallery' | 'photography'
    const manualEventName = fields.event?.[0] || ''
    const eventDescription = fields.eventDescription?.[0] || ''
    const eventLocation = fields.eventLocation?.[0] || ''
    const addToExistingEvent = fields.addToExistingEvent?.[0] === 'true'

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

        // 白名單：擋下非影像／可執行副檔名，立刻刪除暫存檔
        if (!isAcceptableImage(file.mimetype, originalName)) {
          console.warn(
            `⚠️ 拒絕上傳 ${originalName}（mime=${file.mimetype}）— 僅允許 jpg/png/webp/avif/gif`
          )
          try { await unlink(file.filepath) } catch { /* ignore */ }
          continue
        }

        // 先確定檔案的創作/拍攝時間
        let captureTime = new Date()

        if (category === 'photography') {
          // 攝影作品：優先從 EXIF 提取拍攝時間
          let rawExifData: Record<string, unknown> = {}

          try {
            rawExifData = await exifr.parse(file.filepath)
          } catch (err) {
            console.warn(`無法讀取 ${originalName} 的 EXIF 資訊:`, err)
          }

          // 標準化 EXIF 數據
          const exifData = normalizeExifData(rawExifData)

          // 提取拍攝時間
          const exifTime = extractCaptureTime(exifData)
          if (exifTime && exifTime.getFullYear() > 1900) {
            captureTime = exifTime
            console.log(`✅ 使用 EXIF 拍攝時間: ${originalName} -> ${captureTime.toISOString()}`)
          } else {
            console.warn(`⚠️ 未找到有效 EXIF 拍攝時間，使用當前時間: ${originalName}`)
          }

          // 攝影作品事件處理
          let eventInfo

          if (addToExistingEvent && manualEventName) {
            // 添加到現有事件 - 從現有數據中查找事件信息
            const existingData = (await readGalleryData('photography')) ?? {
              Img: [] as PhotographyData['Img']
            } as PhotographyData

            // 查找現有事件的完整信息
            const existingImage = existingData.Img?.find((img: { event?: { name?: string } }) => img.event?.name === manualEventName)
            if (existingImage?.event) {
              eventInfo = {
                name: existingImage.event.name,
                description: existingImage.event.description || '',
                location: existingImage.event.location || ''
              }
              console.log(`✅ 添加到現有事件: ${eventInfo.name}`)
            } else {
              // 如果找不到現有事件，回退到創建新事件
              eventInfo = {
                name: manualEventName,
                description: eventDescription,
                location: eventLocation
              }
              console.warn(`⚠️ 找不到現有事件 "${manualEventName}"，將創建新事件`)
            }
          } else {
            // 創建新事件
            eventInfo = {
              name: manualEventName,
              description: eventDescription,
              location: eventLocation
            }
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

          try {
            await generateThumbsForPublicImage(newPath)
          } catch (e) {
            console.warn(`縮圖產生失敗（仍保留原圖）: ${newPath}`, e)
          }

          // 上傳即算幾何（縱橫比 + 焦點），免事後手動 npm run ratios
          const geometry = await geometryOf(newPath)

          // 生成標題和描述
          const { title: autoTitle, description: autoDescription } = generateTitleAndDescription(originalName)

          // 基於拍攝參數產生智能標籤
          const tags = generateSmartTags(exifData, originalName, fields[`tags_${originalName}`]?.[0])

          uploadedFiles.push({
            filename: `${category}/${eventInfo.name}/${originalName}`,
            time: formatDateFull(captureTime),
            title: fields[`title_${originalName}`]?.[0] || autoTitle,
            content: fields[`content_${originalName}`]?.[0] || autoDescription,
            tags: tags,
            event: eventInfo,
            // ExifData 欄位均為 optional；PhotographyItem 要求 required，缺項一律給安全預設。
            camera: exifData.Make ?? '',
            model: exifData.Model ?? '',
            focalLength: exifData.FocalLength ?? 0,
            aperture: exifData.FNumber ?? 0,
            iso: exifData.ISO ?? 0,
            shutterSpeed: exifData.ExposureTime ?? 0,
            ...geometry
          })
        } else {
          // 繪圖作品：優先使用用戶指定的創作日期，否則嘗試 EXIF
          const userCreationDate = fields[`creationDate_${originalName}`]?.[0]
          if (userCreationDate) {
            captureTime = new Date(userCreationDate)
          } else {
            // 嘗試讀取 EXIF/XMP 資料（PNG/PSD 可能有 XMP 創作日期）
            try {
              const rawExifData = await exifr.parse(file.filepath, { xmp: true })
              if (rawExifData) {
                const exifData = normalizeExifData(rawExifData)
                const exifTime = extractCaptureTime(exifData)
                if (exifTime && exifTime.getFullYear() > 1970) {
                  captureTime = exifTime
                  console.log(`✅ 從 EXIF/XMP 推斷創作時間: ${originalName} -> ${captureTime.toISOString()}`)
                }
              }
            } catch {
              console.warn(`無法讀取 ${originalName} 的 EXIF/XMP 資訊`)
            }

            // EXIF 無法取得時，嘗試 fs.stat() 的 birthtime（建立時間）或 mtime（修改時間）
            if (captureTime.getTime() > Date.now() - 5000) {
              // captureTime 仍是剛設定的「現在」，代表 EXIF 沒找到有效日期
              try {
                const { statSync } = await import('fs')
                const fileStat = statSync(file.filepath)
                // birthtime 優先（某些 OS 有真實建立時間）；否則用 mtime
                const statDate = fileStat.birthtime.getFullYear() > 1970
                  ? fileStat.birthtime
                  : fileStat.mtime
                if (statDate.getFullYear() > 1970) {
                  captureTime = statDate
                  console.log(`✅ 從 fs.stat() 推斷創作時間: ${originalName} -> ${captureTime.toISOString()}`)
                }
              } catch {
                console.warn(`無法讀取 ${originalName} 的檔案系統時間，使用當前時間`)
              }
            }
          }

          // 繪圖作品根據時間自動推斷事件
          const eventInfo = inferEventFromTime(captureTime, 'digital')

          // 創建事件目錄
          const eventDir = join(categoryDir, eventInfo.name)
          if (!existsSync(eventDir)) {
            mkdirSync(eventDir, { recursive: true })
          }

          // 移動檔案到事件目錄
          const newPath = join(eventDir, originalName)
          const fs = await import('fs/promises')
          await fs.rename(file.filepath, newPath)

          try {
            await generateThumbsForPublicImage(newPath)
          } catch (e) {
            console.warn(`縮圖產生失敗（仍保留原圖）: ${newPath}`, e)
          }

          // 上傳即算幾何（縱橫比 + 焦點），免事後手動 npm run ratios
          const geometry = await geometryOf(newPath)

          uploadedFiles.push({
            filename: `${category}/${eventInfo.name}/${originalName}`,
            time: formatDateFull(captureTime),
            title: fields[`title_${originalName}`]?.[0] || (originalName.split('.')[0] ?? originalName),
            content: fields[`content_${originalName}`]?.[0] || '',
            color: fields[`color_${originalName}`]?.[0] || 'blue',
            event: eventInfo,
            ...geometry
          })
        }
      }
    }

    // 以 per-file mutex 執行 read → merge → atomic write，避免多 tab 並發覆蓋
    if (category === 'photography') {
      await updateGalleryData(
        'photography',
        () => ({
          totalNumber: '0',
          category: 'photography',
          eventStats: {},
          Img: []
        } as PhotographyData),
        (data) => {
          data.Img.push(...uploadedFiles as PhotographyData['Img'])
          data.totalNumber = data.Img.length.toString()
          if (!data.eventStats) data.eventStats = {}
          for (const file of uploadedFiles) {
            const name = file.event?.name
            if (name) data.eventStats[name] = (data.eventStats[name] ?? 0) + 1
          }
          return data
        }
      )
    } else {
      await updateGalleryData(
        'gallery',
        () => ({ totalNumber: '0', Img: [] } as GalleryData),
        (data) => {
          data.Img.push(...uploadedFiles as GalleryData['Img'])
          data.totalNumber = data.Img.length.toString()
          return data
        }
      )
    }

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