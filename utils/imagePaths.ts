/**
 * Static WebP thumbnail paths (see scripts/generate-thumbs.mjs).
 * Used for grid / previews; full originals via getImagePath in useImagePath.
 */

export type ThumbWidth = 400 | 800

/** gallery/foo.jpg → gallery/foo.webp */
export function toThumbRelativeWebp (filename: string): string {
  const clean = filename.startsWith('/') ? filename.slice(1) : filename
  return clean.replace(/\.[^.]+$/i, '') + '.webp'
}

export function buildThumbPath (
  filename: string,
  width: ThumbWidth,
  normalizedAppBase: string
): string {
  const rel = toThumbRelativeWebp(filename)
  const base = normalizedAppBase === '/' ? '' : normalizedAppBase
  return `${base}images/_thumbs/${width}w/${rel}`
}

/** Default sizes for responsive grid + 400/800 srcset */
export const GRID_IMAGE_SIZES = '(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 1200px'
