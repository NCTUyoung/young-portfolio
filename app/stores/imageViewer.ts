import { defineStore } from 'pinia'
import { ref, computed, reactive, nextTick } from 'vue'
import type { GalleryItem } from './gallery'
import {
  calcRadialXY,
  computeRadialVisibleWindow,
  easeOutQuad,
  lerp
} from '~/utils/radialNavigation'

export const useImageViewerStore = defineStore('imageViewer', () => {
  // ===== 基本狀態 =====
  const isOpen = ref(false)
  const viewerImages = ref<GalleryItem[]>([])
  const currentImageIndex = ref(0)

  // ===== 縮放和平移狀態 =====
  const viewerScale = ref(1)
  const viewerTranslateX = ref(0)
  const viewerTranslateY = ref(0)
  const isDragging = ref(false)
  const fitToScreen = ref(true)
  const dragSensitivity = ref(0.4)

  // ===== 選擇區域放大狀態 =====
  const isSelectionMode = ref(false)
  const isSelecting = ref(false)
  const selectionStart = ref({ x: 0, y: 0 })
  const selectionEnd = ref({ x: 0, y: 0 })
  const selectionRect = ref({ x: 0, y: 0, width: 0, height: 0 })

  // ===== 導覽器狀態 =====
  const showNavigator = ref(false)
  const navigatorDragging = ref(false)
  const navigatorX = ref(0)
  const navigatorY = ref(0)

  // ===== 資訊面板狀態 =====
  const showInfoPanel = ref(false)
  const infoPanelWidth = ref(320)

  // ===== 放射型導航狀態 =====
  const previousImageIndex = ref(0)
  const isTransitioning = ref(false)
  const posMap = reactive<Record<number, { x: number; y: number }>>({})
  const animating = ref(false)
  const animStart = ref(0)
  const radius = 140

  // ===== 計算屬性 =====
  const currentViewerImage = computed(() => {
    return viewerImages.value[currentImageIndex.value] || null
  })

  const canZoomIn = computed(() => viewerScale.value < 5)
  const canZoomOut = computed(() => viewerScale.value > 0.5)
  const hasPrevious = computed(() => currentImageIndex.value > 0)
  const hasNext = computed(() => currentImageIndex.value < viewerImages.value.length - 1)

  const imageTransform = computed(() => {
    return `scale(${viewerScale.value}) translate(${viewerTranslateX.value}px, ${viewerTranslateY.value}px)`
  })

  const imageStyle = computed(() => {
    const baseStyle = {
      transform: imageTransform.value,
      transformOrigin: 'center center'
    }

    if (fitToScreen.value) {
      return {
        ...baseStyle,
        maxWidth: '100%',
        maxHeight: '100%',
        width: 'auto',
        height: 'auto'
      }
    } else {
      return {
        ...baseStyle,
        maxWidth: 'none',
        maxHeight: 'none',
        width: 'auto',
        height: 'auto'
      }
    }
  })

  // 選擇框樣式計算
  const selectionBoxStyle = computed(() => {
    return {
      left: Math.min(selectionStart.value.x, selectionEnd.value.x) + 'px',
      top: Math.min(selectionStart.value.y, selectionEnd.value.y) + 'px',
      width: Math.abs(selectionEnd.value.x - selectionStart.value.x) + 'px',
      height: Math.abs(selectionEnd.value.y - selectionStart.value.y) + 'px'
    }
  })

  // ===== 基本操作方法 =====
    const openImageViewer = (clickedImage: GalleryItem, images: GalleryItem[]) => {
    const startIndex = images.findIndex(img => img.id === clickedImage.id)
    viewerImages.value = images
    currentImageIndex.value = Math.max(0, startIndex)
    isOpen.value = true
    document.body.style.overflow = 'hidden'
    initNavigatorPosition()
  }

  // ===== 選擇區域放大方法 =====
  const toggleSelectionMode = () => {
    isSelectionMode.value = !isSelectionMode.value
    if (!isSelectionMode.value) {
      resetSelection()
    }
  }

  const resetSelection = () => {
    isSelecting.value = false
    selectionStart.value = { x: 0, y: 0 }
    selectionEnd.value = { x: 0, y: 0 }
    selectionRect.value = { x: 0, y: 0, width: 0, height: 0 }
  }

  const startSelection = (x: number, y: number) => {
    if (!isSelectionMode.value) return

    isSelecting.value = true
    selectionStart.value = { x, y }
    selectionEnd.value = { x, y }
  }

  const updateSelection = (x: number, y: number) => {
    if (!isSelecting.value) return

    selectionEnd.value = { x, y }

    // 更新選擇矩形
    const rect = {
      x: Math.min(selectionStart.value.x, x),
      y: Math.min(selectionStart.value.y, y),
      width: Math.abs(x - selectionStart.value.x),
      height: Math.abs(y - selectionStart.value.y)
    }
    selectionRect.value = rect
  }

  const endSelection = () => {
    if (!isSelecting.value) return

    isSelecting.value = false

    // 如果選擇區域太小，則忽略
    if (selectionRect.value.width < 20 || selectionRect.value.height < 20) {
      resetSelection()
      return
    }

    // 執行區域放大
    zoomToSelection()
  }

                const zoomToSelection = () => {
    const rect = selectionRect.value
    if (rect.width === 0 || rect.height === 0) return

    // 獲取容器和圖片元素
    const containerElement = document.querySelector('.image-viewer-area') as HTMLElement
    const imageElement = document.querySelector('.image-viewer-area img') as HTMLImageElement
    if (!containerElement || !imageElement) return

    const containerRect = containerElement.getBoundingClientRect()
    const imageRect = imageElement.getBoundingClientRect()

    // 容器中心點
    const containerCenterX = containerRect.width / 2
    const containerCenterY = containerRect.height / 2

    // 選擇框中心點（相對於容器）
    const selectionCenterX = rect.x + rect.width / 2
    const selectionCenterY = rect.y + rect.height / 2

    // 將選擇框坐標轉換為相對於圖片的坐標
    const imageLeftInContainer = imageRect.left - containerRect.left
    const imageTopInContainer = imageRect.top - containerRect.top

    // 選擇框在圖片上的位置（像素）
    const selectionInImageX = selectionCenterX - imageLeftInContainer
    const selectionInImageY = selectionCenterY - imageTopInContainer

    // 將像素位置轉換為圖片的相對位置（0-1）
    const relativeX = selectionInImageX / imageRect.width
    const relativeY = selectionInImageY / imageRect.height

    // 計算新的縮放比例
    const padding = 0.8 // 留 20% 的邊距
    const targetScaleX = (containerRect.width * padding) / rect.width
    const targetScaleY = (containerRect.height * padding) / rect.height
    const finalScale = Math.min(Math.max(Math.min(targetScaleX, targetScaleY), 0.5), 5)

    // 重新開始計算，假設圖片在初始狀態（fit-to-screen）
    // 計算圖片在初始狀態下的尺寸
    const imageNaturalWidth = imageElement.naturalWidth
    const imageNaturalHeight = imageElement.naturalHeight
    const containerAspect = containerRect.width / containerRect.height
    const imageAspect = imageNaturalWidth / imageNaturalHeight

    let fitWidth, fitHeight
    if (imageAspect > containerAspect) {
      fitWidth = containerRect.width
      fitHeight = containerRect.width / imageAspect
    } else {
      fitWidth = containerRect.height * imageAspect
      fitHeight = containerRect.height
    }

    // 選擇點在初始圖片上的位置
    const targetPointX = relativeX * fitWidth
    const targetPointY = relativeY * fitHeight

    // 計算需要的平移量，讓目標點移動到容器中心
    const translateX = (containerCenterX - targetPointX) / dragSensitivity.value
    const translateY = (containerCenterY - targetPointY) / dragSensitivity.value

    // 應用新的變換
    viewerScale.value = finalScale
    viewerTranslateX.value = translateX
    viewerTranslateY.value = translateY
    fitToScreen.value = false

    // 清除選擇
    resetSelection()
    isSelectionMode.value = false

    // 更新導覽器顯示
    updateNavigatorVisibility()
  }

  const closeImageViewer = () => {
    isOpen.value = false
    document.body.style.overflow = ''
    resetTransform()
  }

  const goToPreviousImage = () => {
    if (hasPrevious.value) {
      selectRadialImage(currentImageIndex.value - 1)
    }
  }

  const goToNextImage = () => {
    if (hasNext.value) {
      selectRadialImage(currentImageIndex.value + 1)
    }
  }

  // ===== 縮放和平移方法 =====
  const resetTransform = () => {
    viewerScale.value = 1
    viewerTranslateX.value = 0
    viewerTranslateY.value = 0
    fitToScreen.value = true
    updateNavigatorVisibility()
  }

  const toggleFitToScreen = () => {
    fitToScreen.value = !fitToScreen.value
    if (fitToScreen.value) {
      resetTransform()
    }
  }

  const zoomIn = () => {
    if (canZoomIn.value) {
      viewerScale.value = Math.min(viewerScale.value * 1.5, 5)
      updateNavigatorVisibility()
    }
  }

  const zoomOut = () => {
    if (canZoomOut.value) {
      const newScale = Math.max(viewerScale.value / 1.5, 0.5)
      viewerScale.value = newScale

      if (newScale <= 1) {
        viewerTranslateX.value = 0
        viewerTranslateY.value = 0
      }

      updateNavigatorVisibility()
    }
  }

  // ===== 導覽器方法 =====
  const updateNavigatorVisibility = () => {
    showNavigator.value = viewerScale.value > 1.2
  }

  const initNavigatorPosition = () => {
    if (typeof window === 'undefined') return
    const desktop = window.matchMedia('(min-width: 768px)').matches
    const rightOffset =
      showInfoPanel.value && desktop ? infoPanelWidth.value + 20 : 20
    navigatorX.value = window.innerWidth - rightOffset - 180
    navigatorY.value = window.innerHeight - 220
  }

  // ===== 資訊面板方法 =====
  const toggleInfoPanel = () => {
    showInfoPanel.value = !showInfoPanel.value
    nextTick(() => {
      initNavigatorPosition()
    })
  }

  const updateInfoPanelWidth = (width: number) => {
    infoPanelWidth.value = width
    nextTick(() => {
      initNavigatorPosition()
    })
  }

  // ===== 放射型導航方法 =====
  // 純演算法已拆到 `~/utils/radialNavigation`；這裡的 `calcXY` 只保留 store 介面，
  // 幫 template 把「目前可見圖片數」塞進 util。`total===1` 時回傳 y=-radius 是
  // 兼容舊值；util 回 y=-140，與 `radius` 常數相同，無行為差異。
  const calcXY = (idx: number, currentIdx: number) => {
    return calcRadialXY(idx, currentIdx, viewerImages.value.length)
  }

  // 計算要顯示在放射型導航中的圖片（最多 7 張）。
  const getVisibleRadialImages = computed(() => {
    const total = viewerImages.value.length
    const current = currentImageIndex.value
    if (total === 0) return []

    const { start, end } = computeRadialVisibleWindow(total, current, 7)
    const visibleImages = []
    for (let i = start; i <= end; i++) {
      visibleImages.push({
        ...viewerImages.value[i],
        originalIndex: i,
        displayIndex: i - start
      })
    }
    return visibleImages
  })

  // 給動畫用的輕量版本（不帶 `displayIndex`，下游 `forEach((_, displayIdx) => ...)`
  // 自然帶出來；保留最小 shape 就夠了）。
  const getVisibleAt = (centerIdx: number) => {
    const total = viewerImages.value.length
    const { start, end } = computeRadialVisibleWindow(total, centerIdx, 7)
    const out: Array<GalleryItem & { originalIndex: number }> = []
    for (let i = start; i <= end; i++) {
      out.push({ ...viewerImages.value[i], originalIndex: i })
    }
    return out
  }

  const startRadialAnimation = (oldIdx: number, newIdx: number) => {
    const total = viewerImages.value.length
    if (total <= 1) return

    animating.value = true
    animStart.value = performance.now()

    const oldVisibleImages = getVisibleAt(oldIdx)
    const newVisibleImages = getVisibleAt(newIdx)

    const startCoords: Record<number, { x: number; y: number }> = {}
    const targetCoords: Record<number, { x: number; y: number }> = {}

    // 為舊的可見圖片設置起始位置
    oldVisibleImages.forEach((img, displayIdx) => {
      startCoords[img.originalIndex] = calcXY(displayIdx, oldVisibleImages.findIndex(v => v.originalIndex === oldIdx))
      posMap[img.originalIndex] = { ...startCoords[img.originalIndex] }
    })

    // 為新的可見圖片設置目標位置
    newVisibleImages.forEach((img, displayIdx) => {
      targetCoords[img.originalIndex] = calcXY(displayIdx, newVisibleImages.findIndex(v => v.originalIndex === newIdx))
    })

    const duration = 400
    const step = (now: number) => {
      const t = Math.min((now - animStart.value) / duration, 1)
      const k = easeOutQuad(t)

      // 清空位置映射
      Object.keys(posMap).forEach(key => {
        Reflect.deleteProperty(posMap, Number(key))
      })

      // 插值動畫
      newVisibleImages.forEach((img) => {
        const start = startCoords[img.originalIndex] || targetCoords[img.originalIndex]
        const target = targetCoords[img.originalIndex]

        posMap[img.originalIndex] = {
          x: lerp(start.x, target.x, k),
          y: lerp(start.y, target.y, k)
        }
      })

      if (t < 1) {
        requestAnimationFrame(step)
      } else {
        animating.value = false
      }
    }
    requestAnimationFrame(step)
  }

    const updatePosMap = (center: number) => {
    const visibleImages = getVisibleRadialImages.value

    // 清空現有的位置映射
    Object.keys(posMap).forEach(key => {
      Reflect.deleteProperty(posMap, Number(key))
    })

    // 為可見的圖片計算位置
    visibleImages.forEach((img, displayIdx) => {
      posMap[img.originalIndex] = calcXY(displayIdx, visibleImages.findIndex(v => v.originalIndex === center))
    })
  }

  const selectRadialImage = (index: number) => {
    if (index === currentImageIndex.value || animating.value) return

    const oldIdx = currentImageIndex.value
    previousImageIndex.value = oldIdx
    isTransitioning.value = true

    startRadialAnimation(oldIdx, index)

    setTimeout(() => {
      currentImageIndex.value = index
      isTransitioning.value = false
      resetTransform()
      updatePosMap(index)
    }, 400)
  }

  const handleCenterButtonClick = () => {
    if (currentImageIndex.value !== 0) {
      selectRadialImage(0)
    }
  }

  return {
    // 狀態
    isOpen,
    viewerImages,
    currentImageIndex,
    viewerScale,
    viewerTranslateX,
    viewerTranslateY,
    isDragging,
    fitToScreen,
    dragSensitivity,
    showNavigator,
    navigatorDragging,
    navigatorX,
    navigatorY,
    showInfoPanel,
    infoPanelWidth,
    previousImageIndex,
    isTransitioning,
    posMap,
    animating,
    radius,
    isSelectionMode,
    isSelecting,
    selectionStart,
    selectionEnd,
    selectionRect,

    // 計算屬性
    currentViewerImage,
    canZoomIn,
    canZoomOut,
    hasPrevious,
    hasNext,
    imageTransform,
    imageStyle,
    selectionBoxStyle,
    getVisibleRadialImages,

    // 方法
    openImageViewer,
    closeImageViewer,
    goToPreviousImage,
    goToNextImage,
    resetTransform,
    toggleFitToScreen,
    zoomIn,
    zoomOut,
    updateNavigatorVisibility,
    initNavigatorPosition,
    toggleInfoPanel,
    updateInfoPanelWidth,
    calcXY,
    updatePosMap,
    selectRadialImage,
    handleCenterButtonClick,
    // 選擇區域方法
    toggleSelectionMode,
    resetSelection,
    startSelection,
    updateSelection,
    endSelection,
    zoomToSelection
  }
})