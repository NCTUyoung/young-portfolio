import { ref } from 'vue'
import { API_CONFIG, ERROR_MESSAGES, LOADING_MESSAGES } from '~/config/constants'
import { useGlobalToast } from './useToast'

/**
 * 統一的 API 處理 composable
 * 提供統一的錯誤處理、重試機制和載入狀態管理
 */
export const useApi = () => {
  const toast = useGlobalToast()

  // 創建帶有錯誤處理和重試的 API 請求方法
  const createApiRequest = <T = any>(
    requestFn: () => Promise<T>,
    options: {
      retries?: number
      loadingMessage?: string
      successMessage?: string
      errorMessage?: string
      showToast?: boolean
    } = {}
  ) => {
    const {
      retries = API_CONFIG.retryAttempts,
      loadingMessage,
      successMessage,
      errorMessage,
      showToast = true
    } = options

    const isLoading = ref(false)
    const error = ref<string | null>(null)
    const data = ref<T | null>(null)

    const execute = async (): Promise<T | null> => {
      isLoading.value = true
      error.value = null

      let lastError: any

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          if (loadingMessage && showToast) {
            toast.loading(loadingMessage)
          }

          const result = await requestFn()
          data.value = result

          if (successMessage && showToast) {
            toast.success(successMessage)
          }

          return result
        } catch (err: any) {
          lastError = err
          console.warn(`API request attempt ${attempt + 1} failed:`, err)

          // 如果不是最後一次嘗試，等待後重試
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * (attempt + 1)))
          }
        }
      }

      // 所有重試都失敗了
      const finalErrorMessage = errorMessage || lastError?.message || ERROR_MESSAGES.network
      error.value = finalErrorMessage

      if (showToast) {
        toast.error('請求失敗', finalErrorMessage)
      }

      isLoading.value = false
      throw lastError
    }

    return {
      isLoading: readonly(isLoading),
      error: readonly(error),
      data: readonly(data),
      execute
    }
  }

  // 專門的圖片載入方法
  const loadGalleryData = (category: 'gallery' | 'photography') => {
    return createApiRequest(
      () => $fetch('/api/gallery', { query: { category } }),
      {
        loadingMessage: LOADING_MESSAGES.gallery,
        errorMessage: `載入${category === 'gallery' ? '數位作品' : '攝影作品'}失敗`
      }
    )
  }

  // 檔案上傳方法
  const uploadFiles = (formData: FormData) => {
    return createApiRequest(
      () => $fetch('/api/upload', {
        method: 'POST',
        body: formData,
        timeout: API_CONFIG.timeout
      }),
      {
        loadingMessage: LOADING_MESSAGES.upload,
        successMessage: '上傳成功！',
        errorMessage: ERROR_MESSAGES.uploadFailed
      }
    )
  }

  // 圖片刪除方法
  const deleteImage = (filename: string, category: string) => {
    return createApiRequest(
      () => $fetch('/api/delete-image', {
        method: 'DELETE',
        body: { filename, category }
      }),
      {
        loadingMessage: LOADING_MESSAGES.deleting,
        successMessage: '刪除成功！',
        errorMessage: ERROR_MESSAGES.deleteFailed
      }
    )
  }

  // 圖片更新方法
  const updateImage = (imageData: any) => {
    return createApiRequest(
      () => $fetch('/api/update-image', {
        method: 'PATCH',
        body: imageData
      }),
      {
        loadingMessage: LOADING_MESSAGES.updating,
        successMessage: '更新成功！',
        errorMessage: ERROR_MESSAGES.saveFailed
      }
    )
  }

  // 事件更新方法
  const updateEvent = (eventData: any) => {
    return createApiRequest(
      () => $fetch('/api/update-event', {
        method: 'PATCH',
        body: eventData
      }),
      {
        loadingMessage: LOADING_MESSAGES.updating,
        successMessage: '事件更新成功！',
        errorMessage: '更新事件失敗'
      }
    )
  }

  // 批量操作方法
  const batchExecute = async <T>(
    requests: Array<() => Promise<T>>,
    options: {
      concurrent?: number
      onProgress?: (completed: number, total: number) => void
    } = {}
  ) => {
    const { concurrent = 3, onProgress } = options
    const results: Array<T | Error> = []
    let completed = 0

    // 分批執行請求
    for (let i = 0; i < requests.length; i += concurrent) {
      const batch = requests.slice(i, i + concurrent)

      const batchPromises = batch.map(async (request, index) => {
        try {
          const result = await request()
          completed++
          onProgress?.(completed, requests.length)
          return result
        } catch (error) {
          completed++
          onProgress?.(completed, requests.length)
          return error as Error
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }

    return results
  }

  return {
    createApiRequest,
    loadGalleryData,
    uploadFiles,
    deleteImage,
    updateImage,
    updateEvent,
    batchExecute
  }
}