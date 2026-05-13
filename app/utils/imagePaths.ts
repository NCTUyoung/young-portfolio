/**
 * Static thumbnail paths（見 scripts/generate-thumbs.mjs）。
 * 用於 grid / previews；原圖走 useImagePath 的 getImagePath。
 *
 * 兩種編碼並存（AVIF 2026 已達 Safari 16+/Chrome/Firefox/Edge ≥95% 支援率）：
 * - AVIF：同品質下比 WebP 再小 20–30%，但編碼慢 5–10 倍，排 `<picture>` 第一順位。
 * - WebP：fallback 給老舊瀏覽器與 admin 用；也是 `<img>.src` 的最終 fallback。
 */

export type ThumbWidth = 400 | 800 | 1600
export type ThumbFormat = 'webp' | 'avif'

/**
 * 把路徑變成 HTML `src` / `srcset` 安全字串（空格會破壞 `url 400w` token list）。
 * 只替換空格為 `%20`；不整段 encode 以免 dev/static server 對 CJK 資料夾名 mismatch。
 */
export function encodePublicUrlPath (path: string): string {
  if (!path) return path
  return path.replace(/ /g, '%20')
}

/** gallery/foo.jpg → gallery/foo.<ext>（用於 `_thumbs` 底下 mirror） */
export function toThumbRelativePath (filename: string, format: ThumbFormat = 'webp'): string {
  const clean = filename.startsWith('/') ? filename.slice(1) : filename
  return clean.replace(/\.[^.]+$/i, '') + `.${format}`
}

/** Deprecated：向後相容 `toThumbRelativeWebp`，新的程式碼改用 `toThumbRelativePath`. */
export function toThumbRelativeWebp (filename: string): string {
  return toThumbRelativePath(filename, 'webp')
}

export function buildThumbPath (
  filename: string,
  width: ThumbWidth,
  normalizedAppBase: string,
  format: ThumbFormat = 'webp'
): string {
  const rel = toThumbRelativePath(filename, format)
  const base = normalizedAppBase === '/' ? '' : normalizedAppBase
  return `${base}images/_thumbs/${width}w/${rel}`
}

/** Default sizes for responsive grid + 400/800 srcset */
export const GRID_IMAGE_SIZES = '(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 1200px'

/**
 * Sizes hint for the horizontal featured strip (桌機獨享，寬 ~ 62vh ratio scale)。
 * 與 GRID_IMAGE_SIZES 獨立——strip 每張寬度約略是視口高度的 1~1.8 倍（依比例），
 * 但瀏覽器選 srcset 時用的是**顯示寬度**；strip 圖片實際渲染寬度約 500~1000 CSS px，
 * 因此 `800px` hint 讓高密度螢幕選 800w 資產，避開 sizes 為 100vw 導致選過大 source。
 * 若未來 strip 要上 1200w 資產，再改這個常數即可，不影響其他 grid。
 */
export const HORIZONTAL_STRIP_SIZES = '(max-width: 768px) 90vw, 800px'
