<template>
    <!-- 圖片檢視器 — 墨色背景（stone），延續全站 palette -->
  <div
    v-if="isOpen"
    ref="lightboxRoot"
    role="dialog"
    aria-modal="true"
    aria-label="圖片檢視器"
    tabindex="-1"
    class="fixed inset-0 z-[9999] bg-stone-950/97 backdrop-blur-sm"
  >
    <!-- 背景點擊關閉 -->
    <div class="absolute inset-0" @click="closeImageViewer"/>

    <!-- 主要內容 -->
    <div class="relative w-full h-full flex">
      <!-- 圖片檢視區域 -->
      <div
class="image-viewer-area flex-1 flex items-center justify-center p-2 sm:p-4 transition-all duration-300"
           :style="{
             marginRight: panelLayoutOffsetPx
           }"
           @wheel.prevent="handleWheel">

        <!-- 頂部工具列（手機改為兩列，避免按鈕與標題擠成一行） -->
        <div
class="absolute top-2 left-2 z-10 flex flex-col gap-2 sm:top-4 sm:left-4 sm:flex-row sm:items-start sm:justify-between"
             :style="toolbarInsetStyle">

          <!-- 圖片資訊 — 和紙卡片 -->
          <div class="min-w-0 flex max-w-full items-center space-x-4 bg-stone-900/75 px-3 py-2 backdrop-blur-md border border-stone-700/50 sm:px-4">
            <div class="min-w-0 text-stone-100">
              <h3 class="truncate font-jp font-light tracking-wider">{{ currentViewerImage?.title || '未命名' }}</h3>
              <p class="text-xs text-stone-400 font-light tracking-[0.2em] jp-kansuji">{{ currentImageIndex + 1 }} / {{ viewerImages.length }}</p>
            </div>
          </div>

          <!-- 操作按鈕 -->
          <div class="flex flex-shrink-0 flex-wrap items-center justify-end gap-1 bg-stone-900/75 px-1 py-1 backdrop-blur-md border border-stone-700/50 sm:gap-2 sm:px-2 sm:py-2">
            <!-- 縮放控制 -->
            <button
:disabled="!canZoomOut" class="p-2 text-stone-200 hover:text-stone-50 hover:bg-stone-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="縮小 (Ctrl + -)"
                    aria-label="縮小"
                    @click="zoomOut">
              <Icon name="lucide:zoom-out" class="w-5 h-5" aria-hidden="true"/>
            </button>

            <span class="text-stone-200 text-sm min-w-[60px] text-center font-light jp-kansuji">{{ Math.round(viewerScale * 100) }}%</span>

            <button
:disabled="!canZoomIn" class="p-2 text-stone-200 hover:text-stone-50 hover:bg-stone-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="放大 (Ctrl + +)"
                    aria-label="放大"
                    @click="zoomIn">
              <Icon name="lucide:zoom-in" class="w-5 h-5" aria-hidden="true"/>
            </button>

            <!-- 適應螢幕/原始大小切換 -->
            <button
class="p-2 text-stone-200 hover:text-stone-50 hover:bg-stone-700/50 transition-colors"
                    :title="fitToScreen ? '顯示原始大小' : '適應螢幕'"
                    :aria-label="fitToScreen ? '顯示原始大小' : '適應螢幕'"
                    @click="toggleFitToScreen">
              <Icon
                :name="fitToScreen ? 'lucide:maximize' : 'lucide:minimize'"
                class="w-5 h-5"
                aria-hidden="true"
              />
            </button>

            <!-- 重置縮放 -->
            <button
class="p-2 text-stone-200 hover:text-stone-50 hover:bg-stone-700/50 transition-colors"
                    title="重置縮放 (0)"
                    aria-label="重置縮放"
                    @click="resetTransform">
              <Icon name="lucide:rotate-ccw" class="w-5 h-5" aria-hidden="true"/>
            </button>



            <!-- 資訊面板切換 -->
            <button
class="p-2 text-stone-200 hover:text-stone-50 hover:bg-stone-700/50 transition-colors"
                    :class="{ 'bg-stone-700/60 text-stone-50': showInfoPanel }"
                    title="圖片資訊 (I)"
                    aria-label="切換圖片資訊面板"
                    :aria-pressed="showInfoPanel"
                    @click="toggleInfoPanel">
              <Icon name="lucide:info" class="w-5 h-5" aria-hidden="true"/>
            </button>

            <!-- 關閉按鈕 -->
            <button
class="p-2 text-stone-200 hover:text-stone-50 hover:bg-stone-700/50 transition-colors"
                    title="關閉 (Esc)"
                    aria-label="關閉圖片檢視器"
                    @click="closeImageViewer">
              <Icon name="lucide:x" class="w-5 h-5" aria-hidden="true"/>
            </button>
          </div>
        </div>

                <!-- 主要圖片區域 -->
        <div class="relative w-full h-full flex items-center justify-center overflow-hidden" @click.stop>
          <img
v-if="currentViewerImage"
               ref="imageElement"
               :src="getImagePath(currentViewerImage.filename)"
               :alt="currentViewerImage.title"
               :class="[
                 'select-none user-select-none',
                 isDragging ? 'cursor-grabbing' : (viewerScale > 1 ? 'cursor-grab' : 'cursor-default'),
                 isDragging ? '' : 'transition-transform duration-200 ease-out'
               ]"
               :style="imageStyle"
               draggable="false"
               loading="lazy"
               decoding="async"
               @click.stop
               @mousedown="handleMouseDown"
               @touchstart="handleTouchStart"
               @contextmenu.stop
          >

          <!-- 載入中 -->
          <div v-if="!currentViewerImage" class="absolute inset-0 flex items-center justify-center">
            <div class="text-stone-200 text-center font-light">
              <div class="animate-spin rounded-full h-10 w-10 border border-stone-500 border-t-stone-200 mx-auto mb-4"/>
              <p class="tracking-[0.3em] text-xs">LOADING</p>
            </div>
          </div>
        </div>

        <!-- 導航按鈕 -->
        <button
v-if="viewerImages.length > 1 && hasPrevious"
                class="absolute left-2 top-1/2 sm:left-4 transform -translate-y-1/2 p-2.5 sm:p-3 bg-stone-900/70 backdrop-blur-md border border-stone-700/50 text-stone-200 rounded-full hover:bg-stone-800/85 hover:text-stone-50 transition-colors"
                title="上一張 (←)"
                aria-label="上一張"
                @click="goToPreviousImage">
          <Icon name="lucide:chevron-left" class="w-6 h-6" aria-hidden="true"/>
        </button>

        <button
v-if="viewerImages.length > 1 && hasNext"
                class="absolute top-1/2 transform -translate-y-1/2 p-2.5 sm:p-3 bg-stone-900/70 backdrop-blur-md border border-stone-700/50 text-stone-200 rounded-full hover:bg-stone-800/85 hover:text-stone-50 transition-colors"
                :style="nextNavButtonStyle"
                title="下一張 (→)"
                aria-label="下一張"
                @click="goToNextImage">
          <Icon name="lucide:chevron-right" class="w-6 h-6" aria-hidden="true"/>
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
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useMediaQuery } from '@vueuse/core'
import { useImageViewerStore } from '~/stores/imageViewer'
import ImageInfoPanel from './ImageInfoPanel.vue'
import ImageNavigator from './ImageNavigator.vue'
import RadialNavigation from './RadialNavigation.vue'

const imageViewerStore = useImageViewerStore()
const { getImagePath } = useImagePath()
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

const isDesktopViewerLayout = useMediaQuery('(min-width: 768px)')

/** 僅桌面側欄模式時為主圖區讓出寬度；手機改為全螢幕覆蓋面板，避免主圖被壓扁 */
const panelLayoutOffsetPx = computed(() => {
  if (!showInfoPanel.value || !isDesktopViewerLayout.value) return '0px'
  return `${infoPanelWidth.value}px`
})

const toolbarInsetStyle = computed(() => {
  const pad = 16
  const offset = showInfoPanel.value && isDesktopViewerLayout.value ? infoPanelWidth.value + pad : pad
  return { right: `${offset}px` }
})

const nextNavButtonStyle = computed(() => {
  const pad = 16
  const offset = showInfoPanel.value && isDesktopViewerLayout.value ? infoPanelWidth.value + pad : pad
  return { right: `${offset}px` }
})

const imageElement = ref<HTMLImageElement>()
const lightboxRoot = ref<HTMLElement>()

/**
 * Lightbox focus trap：
 * - 開啟時：記住原焦點、鎖 body 捲動、把焦點移入 dialog
 * - Tab / Shift+Tab 循環 dialog 內的可聚焦元素
 * - 關閉時：還原捲動與焦點
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

let previouslyFocused: HTMLElement | null = null
let previousBodyOverflow = ''

const getFocusable = (): HTMLElement[] => {
  const root = lightboxRoot.value
  if (!root) return []
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null)
}

const activateTrap = async () => {
  previouslyFocused = (document.activeElement as HTMLElement) ?? null
  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  await nextTick()
  const [first] = getFocusable()
  ;(first ?? lightboxRoot.value)?.focus()
}

const releaseTrap = () => {
  document.body.style.overflow = previousBodyOverflow
  previousBodyOverflow = ''
  if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
    previouslyFocused.focus()
  }
  previouslyFocused = null
}

const handleTabKey = (event: KeyboardEvent) => {
  if (event.key !== 'Tab' || !isOpen.value || !lightboxRoot.value) return
  const items = getFocusable()
  if (items.length === 0) {
    event.preventDefault()
    lightboxRoot.value.focus()
    return
  }
  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement as HTMLElement | null

  if (event.shiftKey) {
    if (active === first || !lightboxRoot.value.contains(active)) {
      event.preventDefault()
      last.focus()
    }
  } else if (active === last) {
    event.preventDefault()
    first.focus()
  }
}

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
  document.addEventListener('keydown', handleTabKey, true)
  if (isOpen.value) activateTrap()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('keydown', handleTabKey, true)
  releaseTrap()
})

// 隨 store 的 isOpen 啟／停 focus trap
watch(isOpen, (open) => {
  if (open) activateTrap()
  else releaseTrap()
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