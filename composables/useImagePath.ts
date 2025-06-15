/**
 * 圖片路徑處理 composable
 * 統一處理圖片路徑，支援 GitHub Pages baseURL
 */
export const useImagePath = () => {
  const config = useRuntimeConfig()

  /**
   * 獲取完整的圖片路徑
   * @param filename 圖片檔名（包含相對路徑）
   * @returns 完整的圖片 URL
   */
  const getImagePath = (filename: string): string => {
    // 移除開頭的斜線（如果有的話）
    const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename

    // 在開發環境或沒有 baseURL 時使用相對路徑
    if (process.dev || !config.app.baseURL || config.app.baseURL === '/') {
      return `/images/${cleanFilename}`
    }

    // 在生產環境使用完整路徑（包含 baseURL）
    return `${config.app.baseURL}images/${cleanFilename}`
  }

  /**
   * 獲取圖片的完整 URL（包含域名）
   * @param filename 圖片檔名
   * @returns 完整的圖片 URL
   */
  const getFullImageUrl = (filename: string): string => {
    if (process.server) {
      // 服務端渲染時返回相對路徑
      return getImagePath(filename)
    }

    // 客戶端返回完整 URL
    return `${window.location.origin}${getImagePath(filename)}`
  }

  return {
    getImagePath,
    getFullImageUrl
  }
}