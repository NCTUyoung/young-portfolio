import { ref, computed, watch } from 'vue'
import { useFullscreen, onKeyStroke, useMagicKeys, useEventListener } from '@vueuse/core'
import type { GalleryItem } from '~/stores/gallery'

export interface ViewerState {
  isOpen: boolean
  currentIndex: number
  images: GalleryItem[]
  scale: number
  translateX: number
  translateY: number
}

// 全域單例狀態
const globalViewerState = ref<ViewerState>({
  isOpen: false,
  currentIndex: 0,
  images: [],
  scale: 1,
  translateX: 0,
  translateY: 0
})

const globalViewerRef = ref<HTMLElement>()
const globalImageRef = ref<HTMLImageElement>()

export const useImageViewer = () => {
  // ===== VueUse 功能 =====
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(globalViewerRef)
  const keys = useMagicKeys()

  // ===== 計算屬性 =====
  const currentImage = computed(() => {
    const { images, currentIndex } = globalViewerState.value
    return images[currentIndex] || null
  })

  const hasPrevious = computed(() => globalViewerState.value.currentIndex > 0)
  const hasNext = computed(() => globalViewerState.value.currentIndex < globalViewerState.value.images.length - 1)

  const imageTransform = computed(() => {
    const { scale, translateX, translateY } = globalViewerState.value
    return `scale(${scale}) translate(${translateX}px, ${translateY}px)`
  })

  // ===== 方法 =====
  const openViewer = (images: GalleryItem[], startIndex = 0) => {
    console.log('Opening viewer with', images.length, 'images')
    globalViewerState.value = {
      isOpen: true,
      currentIndex: startIndex,
      images,
      scale: 1,
      translateX: 0,
      translateY: 0
    }
    console.log('Viewer state:', globalViewerState.value.isOpen)
  }

  const closeViewer = () => {
    globalViewerState.value.isOpen = false
    resetTransform()
  }

  const goToPrevious = () => {
    if (hasPrevious.value) {
      globalViewerState.value.currentIndex--
      resetTransform()
    }
  }

  const goToNext = () => {
    if (hasNext.value) {
      globalViewerState.value.currentIndex++
      resetTransform()
    }
  }

  const goToIndex = (index: number) => {
    if (index >= 0 && index < globalViewerState.value.images.length) {
      globalViewerState.value.currentIndex = index
      resetTransform()
    }
  }

  const resetTransform = () => {
    globalViewerState.value.scale = 1
    globalViewerState.value.translateX = 0
    globalViewerState.value.translateY = 0
  }

  const zoomIn = () => {
    const newScale = Math.min(globalViewerState.value.scale * 1.5, 5)
    globalViewerState.value.scale = newScale
  }

  const zoomOut = () => {
    const newScale = Math.max(globalViewerState.value.scale / 1.5, 0.5)
    globalViewerState.value.scale = newScale

    // 如果縮放到1以下，重置位置
    if (newScale <= 1) {
      globalViewerState.value.translateX = 0
      globalViewerState.value.translateY = 0
    }
  }

  const handleWheel = (event: WheelEvent) => {
    if (!globalViewerState.value.isOpen) return
    event.preventDefault()

    if (event.deltaY < 0) {
      zoomIn()
    } else {
      zoomOut()
    }
  }

  const handleMouseDown = (event: MouseEvent) => {
    if (!globalViewerState.value.isOpen || globalViewerState.value.scale <= 1) return

    let isDragging = false
    const startX = event.clientX - globalViewerState.value.translateX
    const startY = event.clientY - globalViewerState.value.translateY

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) {
        isDragging = true
      }

      globalViewerState.value.translateX = e.clientX - startX
      globalViewerState.value.translateY = e.clientY - startY
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // ===== 鍵盤快捷鍵 =====
  onKeyStroke('Escape', () => {
    if (globalViewerState.value.isOpen) {
      closeViewer()
    }
  })

  onKeyStroke('ArrowLeft', () => {
    if (globalViewerState.value.isOpen) {
      goToPrevious()
    }
  })

  onKeyStroke('ArrowRight', () => {
    if (globalViewerState.value.isOpen) {
      goToNext()
    }
  })

  onKeyStroke('f', () => {
    if (globalViewerState.value.isOpen) {
      toggleFullscreen()
    }
  })

  onKeyStroke('+', () => {
    if (globalViewerState.value.isOpen) {
      zoomIn()
    }
  })

  onKeyStroke('-', () => {
    if (globalViewerState.value.isOpen) {
      zoomOut()
    }
  })

  onKeyStroke('0', () => {
    if (globalViewerState.value.isOpen) {
      resetTransform()
    }
  })

  // 使用 useMagicKeys 處理組合鍵
  watch(keys.ctrl_plus, (pressed) => {
    if (pressed && globalViewerState.value.isOpen) zoomIn()
  })

  watch(keys.ctrl_minus, (pressed) => {
    if (pressed && globalViewerState.value.isOpen) zoomOut()
  })

  // ===== 事件監聽器 =====
  useEventListener('wheel', handleWheel, { passive: false })
  useEventListener(globalImageRef, 'mousedown', handleMouseDown)

  // ===== 監聽器 =====
  watch(() => globalViewerState.value.isOpen, (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  })

  // ===== 返回 API =====
  return {
    // 狀態
    viewerState: globalViewerState,
    viewerRef: globalViewerRef,
    imageRef: globalImageRef,
    isFullscreen,

    // 計算屬性
    currentImage,
    hasPrevious,
    hasNext,
    imageTransform,

    // 方法
    openViewer,
    closeViewer,
    goToPrevious,
    goToNext,
    goToIndex,
    resetTransform,
    zoomIn,
    zoomOut,
    toggleFullscreen,

    // 事件處理器
    handleWheel,
    handleMouseDown
  }
}