/**
 * WebP thumbnails under public/images/_thumbs/{400w,800w}/ — same layout as scripts/generate-thumbs.mjs
 */
import { mkdir } from 'fs/promises'
import { dirname, join, relative, resolve } from 'path'
import { existsSync, unlinkSync } from 'fs'
import sharp from 'sharp'

const WIDTHS = [400, 800] as const
const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i

function publicImagesRoot (): string {
  return resolve(process.cwd(), 'public', 'images')
}

/**
 * Generate 400w + 800w WebP thumbs for one file under public/images (skips _thumbs).
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
    const outFile = join(root, '_thumbs', `${w}w`, `${relNoExt}.webp`)
    await mkdir(dirname(outFile), { recursive: true })
    await sharp(full)
      .resize(w, w, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(outFile)
  }
}

/**
 * Remove thumb WebPs for a gallery filename (path under public/images, e.g. photography/foo/bar.jpg).
 */
export function removeThumbsForPublicImageFilename (filename: string): void {
  const relNoExt = filename.replace(/\.[^.]+$/i, '')
  const root = publicImagesRoot()
  for (const w of WIDTHS) {
    const p = join(root, '_thumbs', `${w}w`, `${relNoExt}.webp`)
    if (existsSync(p)) {
      try {
        unlinkSync(p)
      } catch (e) {
        console.warn(`Failed to remove thumb: ${p}`, e)
      }
    }
  }
}
