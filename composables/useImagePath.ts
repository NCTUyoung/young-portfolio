/**
 * 圖片路徑處理 composable
 * 統一處理圖片路徑，支援 GitHub Pages baseURL
 */
export const useImagePath = () => {
  /**
   * 獲取完整的圖片路徑
   * @param filename 圖片檔名（包含相對路徑）
   * @returns 完整的圖片 URL
   */
  const getImagePath = (filename: string): string => {
    // 移除開頭的斜線（如果有的話）
    const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename

    // 預設根目錄
    let base = '/'

    // 在瀏覽器端，從目前網址推導專案根目錄（例如 /young-portfolio/）
    if (process.client) {
      const path = window.location.pathname // e.g. /young-portfolio/gallery/
      const match = path.match(/^\/([^/]+)\//)
      if (match && match[1]) {
        base = `/${match[1]}/`
      }
    }

    // 根路徑時：/images/xxx
    if (base === '/' || base === '') {
      return `/images/${cleanFilename}`
    }

    // GitHub Pages 專案頁面等子路徑情境：/young-portfolio/images/xxx
    return `${base}images/${cleanFilename}`
  }

  /**
   * 獲取圖片的完整 URL（包含域名）
   * @param filename 圖片檔名
   * @returns 完整的圖片 URL
   */
  const getFullImageUrl = (filename: string): string => {
    if (process.server) {
      // 服務端渲染時返回相對路徑即可
      return getImagePath(filename)
    }

    // 客戶端返回完整 URL（包含 domain + baseURL）
    return `${window.location.origin}${getImagePath(filename)}`
  }

  return {
    getImagePath,
    getFullImageUrl
  }
}