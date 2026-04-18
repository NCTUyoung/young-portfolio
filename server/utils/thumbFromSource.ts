/**
 * WebP + AVIF thumbnails under public/images/_thumbs/{400w,800w}/ — 對齊 scripts/generate-thumbs.mjs。
 *
 * 上傳成功後同步產兩種格式，避免前台 `<picture>` 第一順位（AVIF）404 落到 WebP 造成一次多餘請求。
 */
import { mkdir } from 'fs/promises'
import { dirname, join, relative, resolve } from 'path'
import { existsSync, unlinkSync } from 'fs'
import sharp from 'sharp'

const WIDTHS = [400, 800] as const
const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i

/**
 * 與 `scripts/generate-thumbs.mjs` 對齊：AVIF 50 ≈ WebP 80，但檔案再小 ~25%；
 * `effort:4` 是編碼速度／品質折衷。
 */
const OUTPUT_FORMATS = [
  { format: 'webp', quality: 82 },
  { format: 'avif', quality: 50 }
] as const

function publicImagesRoot (): string {
  return resolve(process.cwd(), 'public', 'images')
}

/**
 * Generate 400w + 800w WebP + AVIF thumbs for one file under public/images (skips _thumbs).
 */
export async function generateThumbsForPublicImage (sourcePath: string): Promise<void> {
  const full = resolve(process.cwd(), sourcePath)
  const root = publicImagesRoot()
  const rel = relative(root, full).replace(/\\/g, '/')
  if (!rel || rel.startsWith('..') || rel.startsWith('_thumbs/') || !IMAGE_EXT.test(rel)) {
    return
  }
  const relNoExt = rel.replace(/\.[^.]+$/i, '')
  for (const w of WIDTHS) {
    for (const { format, quality } of OUTPUT_FORMATS) {
      const outFile = join(root, '_thumbs', `${w}w`, `${relNoExt}.${format}`)
      await mkdir(dirname(outFile), { recursive: true })
      const pipeline = sharp(full).resize(w, w, { fit: 'inside', withoutEnlargement: true })
      if (format === 'webp') {
        await pipeline.webp({ quality }).toFile(outFile)
      } else {
        await pipeline.avif({ quality, effort: 4 }).toFile(outFile)
      }
    }
  }
}

/**
 * Remove thumb files (WebP + AVIF) for a gallery filename
 * (path under public/images, e.g. photography/foo/bar.jpg).
 */
export function removeThumbsForPublicImageFilename (filename: string): void {
  const relNoExt = filename.replace(/\.[^.]+$/i, '')
  const root = publicImagesRoot()
  for (const w of WIDTHS) {
    for (const { format } of OUTPUT_FORMATS) {
      const p = join(root, '_thumbs', `${w}w`, `${relNoExt}.${format}`)
      if (existsSync(p)) {
        try {
          unlinkSync(p)
        } catch (e) {
          console.warn(`Failed to remove thumb: ${p}`, e)
        }
      }
    }
  }
}
