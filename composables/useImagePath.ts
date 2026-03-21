/**
 * 圖片路徑處理 composable
 * 統一處理圖片路徑，支援 GitHub Pages baseURL
 *
 * - getImagePath：原圖（lightbox、後台編輯、histogram）
 * - getThumbPath / getGridImageSrcset：網格用 WebP 縮圖（npm run thumbs）
 */
import { buildThumbPath, GRID_IMAGE_SIZES, type ThumbWidth } from '~/utils/imagePaths'

export const useImagePath = () => {
  // 直接使用 Nuxt 的 app.baseURL，避免手動從網址解析
  const config = useRuntimeConfig()
  const appBase = config.app?.baseURL || '/'
  const normalizedBase = appBase === '/' ? '' : appBase // '/' -> ''，'/young-portfolio/' -> '/young-portfolio/'

  /**
   * 獲取完整的圖片相對路徑（含 baseURL）
   * @param filename 圖片檔名（包含相對路徑）
   */
  const getImagePath = (filename: string): string => {
    const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename
    return `${normalizedBase}images/${cleanFilename}`
  }

  /**
   * WebP thumbnail path (400w / 800w). Run `npm run thumbs` after adding images.
   */
  const getThumbPath = (filename: string, width: ThumbWidth = 800): string => {
    return buildThumbPath(filename, width, normalizedBase)
  }

  /**
   * Responsive srcset for gallery grids (400w + 800w assets).
   */
  const getGridImageSrcset = (filename: string): string => {
    return `${getThumbPath(filename, 400)} 400w, ${getThumbPath(filename, 800)} 800w`
  }

  /**
   * 獲取圖片的完整 URL（包含域名）
   * @param filename 圖片檔名
   */
  const getFullImageUrl = (filename: string): string => {
    const path = getImagePath(filename)

    if (import.meta.server) {
      // 服務端渲染時只需要回傳相對路徑（交給瀏覽器補上 domain）
      return path
    }

    // 客戶端返回完整 URL（domain + baseURL + 路徑）
    return `${window.location.origin}${path}`
  }

  return {
    getImagePath,
    getThumbPath,
    getGridImageSrcset,
    gridImageSizes: GRID_IMAGE_SIZES,
    getFullImageUrl
  }
}