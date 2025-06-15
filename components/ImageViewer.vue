<template>
    <!-- 圖片檢視器 -->
  <div v-if="isOpen" class="fixed inset-0 z-[9999] bg-black bg-opacity-90 backdrop-blur-sm">
    <!-- 背景點擊關閉 -->
    <div @click="closeImageViewer" class="absolute inset-0"></div>

    <!-- 主要內容 -->
    <div class="relative w-full h-full flex">
      <!-- 圖片檢視區域 -->
      <div class="image-viewer-area flex-1 flex items-center justify-center p-4 transition-all duration-300"
           :style="{
             marginRight: showInfoPanel ? infoPanelWidth + 'px' : '0px'
           }"
           @wheel.prevent="handleWheel">

        <!-- 頂部工具列 -->
        <div class="absolute top-4 left-4 z-10 flex items-center justify-between"
             :style="{
               right: showInfoPanel ? (infoPanelWidth + 16) + 'px' : '16px'
             }">

          <!-- 圖片資訊 -->
          <div class="flex items-center space-x-4 bg-black bg-opacity-50 backdrop-blur-sm rounded-lg px-4 py-2">
            <div class="text-white">
              <h3 class="font-medium">{{ currentViewerImage?.title || '未命名' }}</h3>
              <p class="text-sm text-gray-300">{{ currentImageIndex + 1 }} / {{ viewerImages.length }}</p>
            </div>
          </div>

          <!-- 操作按鈕 -->
          <div class="flex items-center space-x-2 bg-black bg-opacity-50 backdrop-blur-sm rounded-lg px-2 py-2">
            <!-- 縮放控制 -->
            <button @click="zoomOut" :disabled="!canZoomOut"
                    class="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="縮小 (Ctrl + -)">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"></path>
              </svg>
            </button>

            <span class="text-white text-sm min-w-[60px] text-center">{{ Math.round(viewerScale * 100) }}%</span>

            <button @click="zoomIn" :disabled="!canZoomIn"
                    class="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="放大 (Ctrl + +)">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
              </svg>
            </button>

            <!-- 適應螢幕/原始大小切換 -->
            <button @click="toggleFitToScreen"
                    class="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                    :title="fitToScreen ? '顯示原始大小' : '適應螢幕'">
              <svg v-if="fitToScreen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
              </svg>
            </button>

            <!-- 重置縮放 -->
            <button @click="resetTransform"
                    class="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                    title="重置縮放 (0)">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
            </button>



            <!-- 資訊面板切換 -->
            <button @click="toggleInfoPanel"
                    class="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                    :class="{ 'bg-white bg-opacity-20': showInfoPanel }"
                    title="圖片資訊 (I)">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </button>

            <!-- 關閉按鈕 -->
            <button @click="closeImageViewer"
                    class="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                    title="關閉 (Esc)">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

                <!-- 主要圖片區域 -->
        <div class="relative w-full h-full flex items-center justify-center overflow-hidden" @click.stop>
          <img v-if="currentViewerImage"
               ref="imageElement"
               :src="`/images/${currentViewerImage.filename}`"
               :alt="currentViewerImage.title"
               :class="[
                 'select-none user-select-none',
                 isDragging ? 'cursor-grabbing' : (viewerScale > 1 ? 'cursor-grab' : 'cursor-default'),
                 isDragging ? '' : 'transition-transform duration-200 ease-out'
               ]"
               :style="imageStyle"
               draggable="false"
               @click.stop
               @mousedown="handleMouseDown"
               @touchstart="handleTouchStart"
               @contextmenu.prevent />

          <!-- 載入中 -->
          <div v-if="!currentViewerImage" class="absolute inset-0 flex items-center justify-center">
            <div class="text-white text-center">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>載入中...</p>
            </div>
          </div>
        </div>

        <!-- 導航按鈕 -->
        <button v-if="viewerImages.length > 1 && hasPrevious"
                @click="goToPreviousImage"
                class="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 backdrop-blur-sm text-white rounded-full hover:bg-opacity-70 transition-colors"
                title="上一張 (←)">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>

        <button v-if="viewerImages.length > 1 && hasNext"
                @click="goToNextImage"
                class="absolute top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 backdrop-blur-sm text-white rounded-full hover:bg-opacity-70 transition-colors"
                :style="{
                  right: showInfoPanel ? (infoPanelWidth + 16) + 'px' : '16px'
                }"
                title="下一張 (→)">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>

        <!-- 放射型輪盤縮圖導航 -->
        <RadialNavigation />

        <!-- 導覽器 -->
        <ImageNavigator />
      </div>
    </div>

    <!-- 右側資訊面板 -->
    <ImageInfoPanel />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useImageViewerStore } from '~/stores/imageViewer'
import ImageInfoPanel from './ImageInfoPanel.vue'
import ImageNavigator from './ImageNavigator.vue'
import RadialNavigation from './RadialNavigation.vue'

const imageViewerStore = useImageViewerStore()
const {
  isOpen,
  viewerImages,
  currentImageIndex,
  viewerScale,
  viewerTranslateX,
  viewerTranslateY,
  isDragging,
  fitToScreen,
  dragSensitivity,
  showInfoPanel,
  infoPanelWidth,
  currentViewerImage,
  canZoomIn,
  canZoomOut,
  hasPrevious,
  hasNext,
  imageStyle
} = storeToRefs(imageViewerStore)

const {
  closeImageViewer,
  goToPreviousImage,
  goToNextImage,
  resetTransform,
  toggleFitToScreen,
  zoomIn,
  zoomOut,
  toggleInfoPanel,
  initNavigatorPosition
} = imageViewerStore

const imageElement = ref<HTMLImageElement>()

// 滾輪縮放處理
const handleWheel = (event: WheelEvent) => {
  if (!isOpen.value) return

  if (event.deltaY < 0) {
    zoomIn()
  } else {
    zoomOut()
  }
}

// 圖片拖拽處理
const handleMouseDown = (event: MouseEvent) => {
  if (viewerScale.value <= 1) return

  event.preventDefault()
  event.stopPropagation()

  isDragging.value = true
  const startX = event.clientX - viewerTranslateX.value / dragSensitivity.value
  const startY = event.clientY - viewerTranslateY.value / dragSensitivity.value

  let animationId: number | null = null

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return

    e.preventDefault()
    e.stopPropagation()

    if (animationId) {
      cancelAnimationFrame(animationId)
    }

    animationId = requestAnimationFrame(() => {
      viewerTranslateX.value = (e.clientX - startX) * dragSensitivity.value
      viewerTranslateY.value = (e.clientY - startY) * dragSensitivity.value
    })
  }

  const handleMouseUp = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    isDragging.value = false

    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }

    document.removeEventListener('mousemove', handleMouseMove, { capture: true })
    document.removeEventListener('mouseup', handleMouseUp, { capture: true })
  }

  document.addEventListener('mousemove', handleMouseMove, { capture: true, passive: false })
  document.addEventListener('mouseup', handleMouseUp, { capture: true, passive: false })
}

// 觸摸拖拽處理
const handleTouchStart = (event: TouchEvent) => {
  if (viewerScale.value <= 1 || event.touches.length !== 1) return

  event.preventDefault()
  event.stopPropagation()

  isDragging.value = true
  const touch = event.touches[0]
  const startX = touch.clientX - viewerTranslateX.value / dragSensitivity.value
  const startY = touch.clientY - viewerTranslateY.value / dragSensitivity.value

  let animationId: number | null = null

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.value || e.touches.length !== 1) return

    e.preventDefault()
    e.stopPropagation()

    const touch = e.touches[0]

    if (animationId) {
      cancelAnimationFrame(animationId)
    }

    animationId = requestAnimationFrame(() => {
      viewerTranslateX.value = (touch.clientX - startX) * dragSensitivity.value
      viewerTranslateY.value = (touch.clientY - startY) * dragSensitivity.value
    })
  }

  const handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()

    isDragging.value = false

    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }

    document.removeEventListener('touchmove', handleTouchMove, { capture: true })
    document.removeEventListener('touchend', handleTouchEnd, { capture: true })
  }

  document.addEventListener('touchmove', handleTouchMove, { capture: true, passive: false })
  document.addEventListener('touchend', handleTouchEnd, { capture: true, passive: false })
}

// 鍵盤事件處理
const handleKeydown = (event: KeyboardEvent) => {
  if (!isOpen.value) return

  switch (event.key) {
    case 'Escape':
      closeImageViewer()
      break
    case 'ArrowLeft':
      goToPreviousImage()
      break
    case 'ArrowRight':
      goToNextImage()
      break
    case '+':
    case '=':
      zoomIn()
      break
    case '-':
    case '_':
      zoomOut()
      break
    case '0':
      resetTransform()
      break
    case '1':
      toggleFitToScreen()
      break
    case 'i':
    case 'I':
      toggleInfoPanel()
      break
  }

  // Ctrl + 組合鍵
  if (event.ctrlKey) {
    switch (event.key) {
      case '+':
      case '=':
        event.preventDefault()
        zoomIn()
        break
      case '-':
      case '_':
        event.preventDefault()
        zoomOut()
        break
    }
  }
}

// 生命週期
onMounted(() => {
  initNavigatorPosition()
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
/* ===== 拖拽優化 ===== */
.user-select-none {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* 防止拖拽時出現文字選擇 */
.cursor-grab {
  cursor: grab;
  cursor: -webkit-grab;
}

.cursor-grabbing {
  cursor: grabbing;
  cursor: -webkit-grabbing;
}

/* 優化觸摸設備體驗 */
.touch-none {
  touch-action: none;
}

/* 提升渲染性能 */
img {
  will-change: transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

/* 拖拽時的樣式 */
.cursor-move {
  cursor: move;
  cursor: -webkit-grab;
}

.cursor-move:active,
.cursor-grabbing {
  cursor: grabbing;
  cursor: -webkit-grabbing;
}

/* 選擇模式樣式 */
.cursor-crosshair {
  cursor: crosshair;
}

/* 選擇框動畫 */
.selection-box {
  transition: all 0.1s ease-out;
}

/* 選擇框邊框動畫 */
@keyframes dash {
  to {
    stroke-dashoffset: -10;
  }
}

.selection-border-animated {
  stroke-dasharray: 5, 5;
  animation: dash 0.5s linear infinite;
}
</style>