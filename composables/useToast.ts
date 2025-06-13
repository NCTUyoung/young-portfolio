import { ref, computed, readonly } from 'vue'
import { useIntervalFn, useTimeoutFn } from '@vueuse/core'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  persistent?: boolean
  progress?: number
}

export interface ToastOptions {
  type?: ToastType
  title: string
  message?: string
  duration?: number
  persistent?: boolean
}

export const useToast = () => {
  // ===== 響應式狀態 =====
  const toasts = ref<Toast[]>([])
  const maxToasts = 5

  // ===== 計算屬性 =====
  const visibleToasts = computed(() => toasts.value.slice(0, maxToasts))

  // ===== 工具函數 =====
  const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const getToastIcon = (type: ToastType) => {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    }
    return icons[type]
  }

  const getToastColor = (type: ToastType) => {
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500'
    }
    return colors[type]
  }

  // ===== 核心方法 =====
  const addToast = (options: ToastOptions): string => {
    const id = generateId()
    const duration = options.duration ?? 4000
    const persistent = options.persistent ?? false

    const toast: Toast = {
      id,
      type: options.type ?? 'info',
      title: options.title,
      message: options.message,
      duration,
      persistent,
      progress: persistent ? undefined : 100
    }

    // 添加到列表開頭
    toasts.value.unshift(toast)

    // 如果超過最大數量，移除最舊的
    if (toasts.value.length > maxToasts) {
      toasts.value = toasts.value.slice(0, maxToasts)
    }

    // 如果不是持久化的，設置自動移除
    if (!persistent && duration > 0) {
      startToastTimer(id, duration)
    }

    return id
  }

  const removeToast = (id: string) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const clearAllToasts = () => {
    toasts.value = []
  }

  const updateToast = (id: string, updates: Partial<Toast>) => {
    const toast = toasts.value.find(t => t.id === id)
    if (toast) {
      Object.assign(toast, updates)
    }
  }

  // ===== 計時器管理 =====
  const startToastTimer = (id: string, duration: number) => {
    const toast = toasts.value.find(t => t.id === id)
    if (!toast || toast.persistent) return

    const interval = 50 // 更新間隔 (ms)
    const steps = duration / interval
    let currentStep = 0

    const { pause, resume } = useIntervalFn(() => {
      currentStep++
      const progress = Math.max(0, 100 - (currentStep / steps) * 100)

      if (toast) {
        toast.progress = progress
      }

      if (currentStep >= steps) {
        pause()
        removeToast(id)
      }
    }, interval, { immediate: true })

    // 滑鼠懸停時暫停計時器
    const pauseTimer = () => pause()
    const resumeTimer = () => resume()

    return { pauseTimer, resumeTimer }
  }

  // ===== 便捷方法 =====
  const success = (title: string, message?: string, options?: Partial<ToastOptions>) => {
    return addToast({
      type: 'success',
      title,
      message,
      ...options
    })
  }

  const error = (title: string, message?: string, options?: Partial<ToastOptions>) => {
    return addToast({
      type: 'error',
      title,
      message,
      duration: 6000, // 錯誤訊息顯示更久
      ...options
    })
  }

  const warning = (title: string, message?: string, options?: Partial<ToastOptions>) => {
    return addToast({
      type: 'warning',
      title,
      message,
      duration: 5000,
      ...options
    })
  }

  const info = (title: string, message?: string, options?: Partial<ToastOptions>) => {
    return addToast({
      type: 'info',
      title,
      message,
      ...options
    })
  }

  // ===== 特殊用途方法 =====
  const loading = (title: string, message?: string) => {
    return addToast({
      type: 'info',
      title,
      message,
      persistent: true
    })
  }

  const promise = async <T>(
    promise: Promise<T>,
    options: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ): Promise<T> => {
    const loadingId = loading(options.loading)

    try {
      const result = await promise
      removeToast(loadingId)

      const successMessage = typeof options.success === 'function'
        ? options.success(result)
        : options.success

      success(successMessage)
      return result
    } catch (err) {
      removeToast(loadingId)

      const errorMessage = typeof options.error === 'function'
        ? options.error(err)
        : options.error

      error(errorMessage)
      throw err
    }
  }

  // ===== 返回 API =====
  return {
    // 狀態
    toasts: readonly(toasts),
    visibleToasts,

    // 核心方法
    addToast,
    removeToast,
    clearAllToasts,
    updateToast,

    // 便捷方法
    success,
    error,
    warning,
    info,
    loading,
    promise,

    // 工具方法
    getToastIcon,
    getToastColor
  }
}

// 全域 toast 實例
let globalToast: ReturnType<typeof useToast> | null = null

export const useGlobalToast = () => {
  if (!globalToast) {
    globalToast = useToast()
  }
  return globalToast
}