/**
 * Static WebP thumbnail paths (see scripts/generate-thumbs.mjs).
 * Used for grid / previews; full originals via getImagePath in useImagePath.
 */

export type ThumbWidth = 400 | 800

/**
 * Make paths safe for HTML `src` / `srcset` (space breaks the `url 400w` token list).
 * Only replace spaces with `%20` — do not encode whole segments: over-encoding can break
 * dev/static servers matching filesystem paths for CJK folder names.
 */
export function encodePublicUrlPath (path: string): string {
  if (!path) return path
  return path.replace(/ /g, '%20')
}

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
