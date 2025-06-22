import { ref, computed, reactive } from 'vue'
import type { GalleryItem } from '~/types/gallery'

/**
 * 放射型導航 composable
 * 從 imageViewer store 中提取複雜的放射型導航邏輯
 */
export const useRadialNavigation = (
  viewerImages: Ref<GalleryItem[]>,
  currentImageIndex: Ref<number>
) => {
  // 狀態
  const animating = ref(false)
  const animStart = ref(0)
  const posMap = reactive<Record<number, { x: number; y: number }>>({})
  const radius = 140

  // 計算要顯示在放射型導航中的圖片
  const getVisibleRadialImages = computed(() => {
    const total = viewerImages.value.length
    const current = currentImageIndex.value

    // 如果圖片數量少於等於7張，顯示所有圖片
    if (total <= 7) {
      return viewerImages.value.map((img, index) => ({
        ...img,
        originalIndex: index,
        displayIndex: index
      }))
    }

    // 如果圖片數量超過7張，只顯示當前圖片周圍的7張圖片
    const maxVisible = 7
    const halfVisible = Math.floor(maxVisible / 2)

    const visibleImages = []
    const startIndex = Math.max(0, current - halfVisible)
    const endIndex = Math.min(total - 1, startIndex + maxVisible - 1)

    // 如果接近末尾，從後往前調整
    const actualStart = Math.max(0, endIndex - maxVisible + 1)

    for (let i = actualStart; i <= endIndex; i++) {
      visibleImages.push({
        ...viewerImages.value[i],
        originalIndex: i,
        displayIndex: i - actualStart
      })
    }

    return visibleImages
  })

  // 計算位置
  const calcXY = (idx: number, currentIdx: number) => {
    const total = viewerImages.value.length
    if (total === 1) return { x: 0, y: -radius }

    const order = (idx - currentIdx + total) % total

    // 根據圖片數量動態調整半徑和角度範圍
    let dynamicRadius = radius
    let angleRange = 180

    if (total <= 3) {
      // 3張或以下：使用較小半徑，廣角分佈
      dynamicRadius = 80
      angleRange = 150
    } else if (total <= 5) {
      // 4-5張：使用中等半徑，3/4圓分佈
      dynamicRadius = 110
      angleRange = 200
    } else if (total <= 7) {
      // 6-7張：使用標準半徑，廣角分佈
      dynamicRadius = 140
      angleRange = 240
    } else {
      // 超過7張：使用較大半徑，3/4圓分佈，只顯示部分圖片
      dynamicRadius = 160
      angleRange = 220
    }

    const angleStep = angleRange / Math.max(1, total - 1)
    // 調整起始角度，讓縮圖居中對稱分佈
    const startAngle = 270 - angleRange / 2  // 從正下方開始，左右對稱分佈
    const angle = startAngle + order * angleStep
    const rad = (angle * Math.PI) / 180

    const x = Math.cos(rad) * dynamicRadius
    const y = -Math.sin(rad) * dynamicRadius

    return { x, y }
  }

  // 動畫輔助函數
  const lerp = (a: number, b: number, t: number) => {
    return a + (b - a) * t
  }

  const easeOutQuad = (t: number) => {
    return 1 - (1 - t) * (1 - t)
  }

  // 更新位置映射
  const updatePosMap = (center: number) => {
    const visibleImages = getVisibleRadialImages.value

    // 清空現有的位置映射
    Object.keys(posMap).forEach(key => {
      delete posMap[Number(key)]
    })

    // 為可見的圖片計算位置
    visibleImages.forEach((img, displayIdx) => {
      posMap[img.originalIndex] = calcXY(displayIdx, visibleImages.findIndex(v => v.originalIndex === center))
    })
  }

  // 開始放射型動畫
  const startRadialAnimation = (oldIdx: number, newIdx: number) => {
    const total = viewerImages.value.length
    if (total <= 1) return

    animating.value = true
    animStart.value = performance.now()

    // 獲取舊的和新的可見圖片列表
    const oldVisibleImages = total <= 7 ?
      viewerImages.value.map((img, idx) => ({ ...img, originalIndex: idx })) :
      (() => {
        const maxVisible = 7
        const halfVisible = Math.floor(maxVisible / 2)
        const startIndex = Math.max(0, oldIdx - halfVisible)
        const endIndex = Math.min(total - 1, startIndex + maxVisible - 1)
        const actualStart = Math.max(0, endIndex - maxVisible + 1)

        const visibleImages = []
        for (let i = actualStart; i <= endIndex; i++) {
          visibleImages.push({ ...viewerImages.value[i], originalIndex: i })
        }
        return visibleImages
      })()

    const newVisibleImages = total <= 7 ?
      viewerImages.value.map((img, idx) => ({ ...img, originalIndex: idx })) :
      (() => {
        const maxVisible = 7
        const halfVisible = Math.floor(maxVisible / 2)
        const startIndex = Math.max(0, newIdx - halfVisible)
        const endIndex = Math.min(total - 1, startIndex + maxVisible - 1)
        const actualStart = Math.max(0, endIndex - maxVisible + 1)

        const visibleImages = []
        for (let i = actualStart; i <= endIndex; i++) {
          visibleImages.push({ ...viewerImages.value[i], originalIndex: i })
        }
        return visibleImages
      })()

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
        delete posMap[Number(key)]
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

  return {
    // 狀態
    animating: readonly(animating),
    posMap: readonly(posMap),

    // 計算屬性
    getVisibleRadialImages,

    // 方法
    calcXY,
    updatePosMap,
    startRadialAnimation
  }
}