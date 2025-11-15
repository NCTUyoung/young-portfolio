/**
 * 圖片路徑處理 composable
 * 統一處理圖片路徑，支援 GitHub Pages baseURL
 */
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
   * 獲取圖片的完整 URL（包含域名）
   * @param filename 圖片檔名
   */
  const getFullImageUrl = (filename: string): string => {
    const path = getImagePath(filename)

    if (process.server) {
      // 服務端渲染時只需要回傳相對路徑（交給瀏覽器補上 domain）
      return path
    }

    // 客戶端返回完整 URL（domain + baseURL + 路徑）
    return `${window.location.origin}${path}`
  }

  return {
    getImagePath,
    getFullImageUrl
  }
}