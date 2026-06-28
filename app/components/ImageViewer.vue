<template>
  <!--
    Teleport 到 <body>：lightbox 被渲染在 gallery 頁的 `.gallery-world` 內，而該容器
    `isolation: isolate` 會開新 stacking context，把這裡的 z-[9999] 鎖在其內 →
    固定導覽列（layout 的 z-[1100]，root context）反而蓋在 lightbox 上方，頂部工具列
    被導覽列遮住、整條導覽列從半透明墨底透出（使用者回饋「功能表與按鈕都不見了」）。
    Teleport 讓 lightbox 掛到 body root context，z-[9999] 才真正蓋過所有 chrome。
  -->
  <Teleport to="body">
    <!-- 圖片檢視器 — 墨色背景（stone），延續全站 palette -->
  <div
    v-if="isOpen"
    ref="lightboxRoot"
    role="dialog"
    aria-modal="true"
    aria-label="圖片檢視器"
    tabindex="-1"
    class="fixed inset-0 z-[9999] bg-stone-950/95 backdrop-blur-md"
  >
    <!-- 背景點擊關閉 -->
    <div class="absolute inset-0" @click="closeImageViewer"/>

    <!-- 主要內容 -->
    <div class="relative w-full h-full flex">
      <!-- 圖片檢視區域 — info spread takeover 開啟時整塊隱去（spread 自己接管畫面） -->
      <div
class="image-viewer-area flex-1 flex items-center justify-center p-2 sm:p-4 transition-all duration-300"
           :class="{ 'image-viewer-area--hidden': showInfoPanel }"
           :style="{
             marginRight: panelLayoutOffsetPx
           }"
           @wheel.prevent="handleWheel">

        <!-- 頂部漸層（讓標題／圖示不必框就可讀） -->
        <div class="viewer-top-veil pointer-events-none absolute inset-x-0 top-0 z-0 h-24 bg-gradient-to-b from-stone-950/75 via-stone-950/25 to-transparent sm:h-32"/>

        <!-- 頂部：標題（左）+ 工具列（右）— 無框浮空，遵循「余白・細線」原則 -->
        <div
class="viewer-toolbar-wrap absolute top-2.5 left-3 right-3 z-10 flex items-start justify-between gap-3 sm:top-5 sm:left-5 sm:right-5"
             :style="toolbarInsetStyle">

          <!-- 標題區：純文字 + 細線收束，無背景、無邊框 -->
          <div class="min-w-0 flex-1 pt-1 text-stone-100">
            <p class="text-[0.65rem] sm:text-xs text-stone-400 font-light tracking-[0.3em] jp-kansuji tabular-nums">
              <span class="text-stone-100">{{ currentImageIndex + 1 }}</span>
              <span class="mx-1.5 text-stone-600">／</span>
              <span>{{ viewerImages.length }}</span>
            </p>
            <h3 class="mt-1 truncate font-jp font-light tracking-wider text-[0.95rem] sm:text-base">
              {{ currentViewerImage?.title || '未命名' }}
            </h3>
            <span aria-hidden="true" class="mt-2 block h-px w-10 bg-stone-300/30"/>
          </div>

          <!-- 操作列：一排簡素圖示，無外框；「關閉」前以細線分隔收束 -->
          <div class="flex flex-shrink-0 items-center gap-0 mr-0 sm:-mr-2">
            <button
:disabled="!canZoomOut" class="viewer-btn"
                    title="縮小 (Ctrl + -)"
                    aria-label="縮小"
                    @click="zoomOut">
              <Icon name="lucide:zoom-out" class="viewer-ico" aria-hidden="true"/>
            </button>

            <span class="hidden sm:inline-block text-stone-300 text-xs min-w-[52px] text-center font-light jp-kansuji tabular-nums">{{ Math.round(viewerScale * 100) }}%</span>

            <button
:disabled="!canZoomIn" class="viewer-btn"
                    title="放大 (Ctrl + +)"
                    aria-label="放大"
                    @click="zoomIn">
              <Icon name="lucide:zoom-in" class="viewer-ico" aria-hidden="true"/>
            </button>

            <!-- 適應螢幕／原始大小切換（手機隱藏） -->
            <button
class="viewer-btn hidden sm:inline-flex"
                    :title="fitToScreen ? '顯示原始大小' : '適應螢幕'"
                    :aria-label="fitToScreen ? '顯示原始大小' : '適應螢幕'"
                    @click="toggleFitToScreen">
              <Icon
                :name="fitToScreen ? 'lucide:maximize' : 'lucide:minimize'"
                class="viewer-ico"
                aria-hidden="true"
              />
            </button>

            <button
class="viewer-btn"
                    title="重置縮放 (0)"
                    aria-label="重置縮放"
                    @click="resetTransform">
              <Icon name="lucide:rotate-ccw" class="viewer-ico" aria-hidden="true"/>
            </button>

            <button
class="viewer-btn"
                    :class="{ 'viewer-btn--active': showInfoPanel }"
                    title="圖片資訊 (I)"
                    aria-label="切換圖片資訊面板"
                    :aria-pressed="showInfoPanel"
                    @click="toggleInfoPanel">
              <Icon name="lucide:info" class="viewer-ico" aria-hidden="true"/>
            </button>

            <!-- 細線分隔，讓「關閉」成為一個獨立收束點 -->
            <span aria-hidden="true" class="mx-1 h-5 w-px bg-stone-500/30"/>

            <button
class="viewer-btn viewer-btn-close"
                    title="關閉 (Esc)"
                    aria-label="關閉圖片檢視器"
                    @click="closeImageViewer">
              <svg class="viewer-close-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M6 6L18 18" />
                <path d="M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>

        <!--
          Hit-zone overlays（McGinley 風格）：左/右兩側透明 click 區→ 上/下一張
          chevron 按鈕保留作 a11y fallback；縮放中（scale > 1）以 pointer-events:none
          讓出，避免覆蓋 image drag-to-pan
        -->
        <button
v-if="viewerImages.length > 1 && hasPrevious"
                type="button"
                tabindex="-1"
                aria-hidden="true"
                class="viewer-hit-zone viewer-hit-zone--left"
                :class="{ 'viewer-hit-zone--inactive': viewerScale > 1 }"
                @click="goToPreviousImage"/>
        <button
v-if="viewerImages.length > 1 && hasNext"
                type="button"
                tabindex="-1"
                aria-hidden="true"
                class="viewer-hit-zone viewer-hit-zone--right"
                :class="{ 'viewer-hit-zone--inactive': viewerScale > 1 }"
                :style="hitZoneRightStyle"
                @click="goToNextImage"/>

                <!-- 主要圖片區域 -->
        <div class="relative w-full h-full flex items-center justify-center overflow-hidden" @click.stop>
          <!--
            Lightbox 圖片來源優先序（`<picture>` 由瀏覽器選第一個能用的 source）：
              1) AVIF 1600w（2026 主流瀏覽器全支援，最小）
              2) WebP 1600w（fallback）
              3) 原圖（僅古早瀏覽器或 thumb 缺檔時兜底）
            放大到 >1x 仍是同一張 1600w，視覺上夠用；要原解析度可走 ImageInfoPanel 的「下載原圖」（後續再加）。
          -->
          <picture v-if="currentViewerImage">
            <source type="image/avif" :srcset="getAvifThumbPath(currentViewerImage.filename, 1600)">
            <source type="image/webp" :srcset="getThumbPath(currentViewerImage.filename, 1600)">
            <img
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
              loading="eager"
              fetchpriority="high"
              decoding="async"
              @click.stop
              @mousedown="handleMouseDown"
              @touchstart="handleTouchStart"
              @contextmenu.stop
            >
          </picture>

          <!-- 載入中 -->
          <div v-if="!currentViewerImage" class="absolute inset-0 flex items-center justify-center">
            <div class="text-stone-200 text-center font-light">
              <div class="animate-spin rounded-full h-10 w-10 border border-stone-500 border-t-stone-200 mx-auto mb-4"/>
              <p class="tracking-[0.3em] text-xs">LOADING</p>
            </div>
          </div>
        </div>

        <!-- 導航按鈕（保留為 a11y fallback；z-10 蓋過 hit-zone z-5） -->
        <button
v-if="viewerImages.length > 1 && hasPrevious"
                class="viewer-nav-btn absolute left-2 top-1/2 sm:left-4 z-10 transform -translate-y-1/2"
                title="上一張 (←)"
                aria-label="上一張"
                @click="goToPreviousImage">
          <Icon name="lucide:chevron-left" class="w-6 h-6" aria-hidden="true"/>
        </button>

        <button
v-if="viewerImages.length > 1 && hasNext"
                class="viewer-nav-btn absolute top-1/2 z-10 transform -translate-y-1/2"
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

        <!--
          R50 對軌 PAIRED overlay 已移除：那是「繪⇄影」跨世界跳轉浮層，與近期
          「拆分兩間獨立沉浸室、去除跨世界混合」方向相牴觸（且首訪者不解其意）。
          viewer 收斂為單一世界內的純粹翻閱。
        -->

        <!--
          ▌軌道縦書（編輯感）— 左側 vertical caption strip
          首訪可見的 cinematic editorial layer：
          - 縦書 category kanji（繪／影）與全站雙主線 motif 對位
          - 序號 + total 走 jp-kansuji 大字
          - 與右邊 InfoPanel 的「資訊」是兩種對讀層次（rail = 詩意 / panel = 數據）
        -->
        <aside
          v-if="currentViewerImage"
          class="viewer-track-rail pointer-events-none"
          :class="trackRailVariantClass"
          aria-hidden="true"
        >
          <span class="viewer-track-rail__kana">{{ trackRailKana }}</span>
          <span class="viewer-track-rail__hairline"/>
          <span class="viewer-track-rail__index jp-kansuji tabular-nums">
            {{ formatIndex(currentImageIndex + 1) }}
          </span>
          <span class="viewer-track-rail__divider">／</span>
          <span class="viewer-track-rail__total jp-kansuji tabular-nums">
            {{ formatIndex(viewerImages.length) }}
          </span>
        </aside>

        <!--
          ▌底部 hairline progress 軌：圖庫位置的視覺化
          一條 1px 漸層線（左淡 → 中亮 → 右淡），上方游標標示 currentIndex
          首訪 3 秒可見，與全站 hairline motif 對位
        -->
        <div
          v-if="viewerImages.length > 1"
          class="viewer-progress-rail pointer-events-none"
          :style="progressRailInsetStyle"
          aria-hidden="true"
        >
          <span class="viewer-progress-rail__line"/>
          <span
            class="viewer-progress-rail__cursor"
            :style="{ left: `${progressPercent}%` }"
          />
        </div>

        <!--
          底部 keyboard shortcut footer（ESC/←→/I/0 圖例）已移除：與頂部工具列按鈕
          tooltip + 底部進度軌重疊，且讓底部與放射輪盤一起顯得「駕駛艙」般擁擠。
          快捷鍵行為全數保留（鍵盤監聽未動），只是不再常駐顯示圖例 → 還底部余白。
        -->
      </div>
    </div>

    <!-- 右側資訊面板 -->
    <ImageInfoPanel />
  </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick, defineAsyncComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useMediaQuery } from '@vueuse/core'
import { useImageViewerStore } from '~/stores/imageViewer'
import { useGalleryStore } from '~/stores/gallery'

// 非關鍵子元件採 lazy 載入：使用者打開 lightbox 當下不一定會開資訊面板／縮圖盤，
// 拆出去可以省首屏 JS 體積，首次點開圖片時再按需載入。
const ImageInfoPanel = defineAsyncComponent(() => import('./ImageInfoPanel.vue'))
const ImageNavigator = defineAsyncComponent(() => import('./ImageNavigator.vue'))
const RadialNavigation = defineAsyncComponent(() => import('./RadialNavigation.vue'))

const imageViewerStore = useImageViewerStore()
const { getImagePath, getThumbPath, getAvifThumbPath } = useImagePath()
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

/**
 * spread takeover 模式：InfoPanel 是 fixed inset-0 全屏，所以主圖不再需要 marginRight。
 * 保留變數為 0 以維持其他樣式 binding（hit zones / toolbar inset）一致。
 */
const panelLayoutOffsetPx = computed(() => '0px')

const toolbarInsetStyle = computed(() => {
  const pad = 16
  const offset = showInfoPanel.value && isDesktopViewerLayout.value ? infoPanelWidth.value + pad : pad
  return { right: `calc(${offset}px + env(safe-area-inset-right, 0px))` }
})

const nextNavButtonStyle = computed(() => {
  const pad = 16
  const offset = showInfoPanel.value && isDesktopViewerLayout.value ? infoPanelWidth.value + pad : pad
  return { right: `${offset}px` }
})

/**
 * Hit-zone 右側 right 偏移：避免 hit-zone 跑到 InfoPanel 底下而失效。
 * Panel 開啟時（僅桌面），right = panel 寬；否則 right: 0。
 */
const hitZoneRightStyle = computed(() => ({
  right: panelLayoutOffsetPx.value
}))

/** 軌道縦書 rail：依 current image category 切換 (繪 / 影 / 集)，與全站雙主線 motif 對位 */
const trackRailKana = computed(() => {
  const cat = (currentViewerImage.value as { category?: string } | null)?.category
  if (cat === 'photography') return '影'
  if (cat === 'digital') return '繪'
  return '集'
})

const trackRailVariantClass = computed(() => {
  const cat = (currentViewerImage.value as { category?: string } | null)?.category
  if (cat === 'photography') return 'viewer-track-rail--kage'
  if (cat === 'digital') return 'viewer-track-rail--kai'
  return 'viewer-track-rail--mix'
})

/** Progress rail 百分比（依 currentImageIndex / (length - 1)） */
const progressPercent = computed(() => {
  const total = viewerImages.value.length
  if (total <= 1) return 0
  return (currentImageIndex.value / (total - 1)) * 100
})

/** Progress rail / shortcut footer 右側 inset 與 InfoPanel 連動 */
const progressRailInsetStyle = computed(() => ({
  right: panelLayoutOffsetPx.value
}))

/** R50：對軌 PAIRED — 從 store 找配對作品給 viewer overlay 用 */
const galleryStoreViewer = useGalleryStore()
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- WIP：配對 overlay 尚未接線，先保留 computed
const pairedImageInViewer = computed(() => {
  const pairId = (currentViewerImage.value as { pairWith?: string } | null)?.pairWith
  if (!pairId) return null
  const all = [...galleryStoreViewer.digitalWorks, ...galleryStoreViewer.photographyWorks]
  return all.find((w) => w.id === pairId) || null
})

/**
 * 格式化序號為兩位數零墊（編輯感）— 1 → 01、12 → 12
 * 不對 ≥100 做特別處理（保持自然）
 */
const formatIndex = (n: number) => {
  if (n < 10) return `0${n}`
  return `${n}`
}

const imageElement = ref<HTMLImageElement>()
const lightboxRoot = ref<HTMLElement>()

/**
 * Lightbox focus trap：
 * - 開啟時：記住原焦點、把焦點移入 dialog
 * - Tab / Shift+Tab 循環 dialog 內的可聚焦元素
 * - 關閉時：還原焦點
 *
 * 註：body 捲動鎖定由 `stores/imageViewer.ts` 的 open/closeImageViewer 統一管理，
 * 此處不可重複操作 body.style.overflow，否則關閉時會把先前由 store 設定的
 * 'hidden' 寫回，導致整頁滾輪事件失靈。
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

const getFocusable = (): HTMLElement[] => {
  const root = lightboxRoot.value
  if (!root) return []
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null)
}

const activateTrap = async () => {
  previouslyFocused = (document.activeElement as HTMLElement) ?? null
  await nextTick()
  const [first] = getFocusable()
  ;(first ?? lightboxRoot.value)?.focus()
}

const releaseTrap = () => {
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
  if (!first || !last) return
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
  if (!touch) return
  const startX = touch.clientX - viewerTranslateX.value / dragSensitivity.value
  const startY = touch.clientY - viewerTranslateY.value / dragSensitivity.value

  let animationId: number | null = null

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.value || e.touches.length !== 1) return

    e.preventDefault()
    e.stopPropagation()

    const moveTouch = e.touches[0]
    if (!moveTouch) return

    if (animationId) {
      cancelAnimationFrame(animationId)
    }

    animationId = requestAnimationFrame(() => {
      viewerTranslateX.value = (moveTouch.clientX - startX) * dragSensitivity.value
      viewerTranslateY.value = (moveTouch.clientY - startY) * dragSensitivity.value
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
/* ===== 檢視器按鈕（無框、簡素；手機 44px 最小觸控目標） ===== */
.viewer-btn {
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding: 0.625rem;
  color: rgb(214 211 209 / 0.9);
  background-color: transparent;
  transition: background-color 0.2s ease, color 0.2s ease;
}
.viewer-btn:not(.hidden) {
  display: inline-flex;
}
.viewer-btn:hover:not(:disabled) {
  background-color: rgb(41 37 36 / 0.5);
  color: rgb(250 250 249);
}
.viewer-btn:active:not(:disabled) {
  background-color: rgb(41 37 36 / 0.75);
}
.viewer-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.viewer-btn--active {
  color: rgb(237 184 125); /* accent-300，細微墨印色提示 */
}

/* 關閉鍵提升辨識度與觸控命中率（手機優先） */
.viewer-btn-close {
  min-width: 48px;
  min-height: 48px;
  padding: 0.75rem;
  color: rgb(250 250 249);
  background-color: rgb(28 25 23 / 0.55);
  border: 1px solid rgb(214 211 209 / 0.2);
  border-radius: 9999px;
  touch-action: manipulation;
}
.viewer-btn-close:hover:not(:disabled) {
  background-color: rgb(28 25 23 / 0.8);
  color: rgb(255 255 255);
  border-color: rgb(231 229 228 / 0.35);
}
.viewer-btn-close:active:not(:disabled) {
  background-color: rgb(28 25 23 / 0.9);
}
.viewer-close-icon {
  width: 22px;
  height: 22px;
  stroke: rgb(255 255 255);
  stroke-width: 2.25;
  stroke-linecap: round;
  fill: none;
}
@media (min-width: 640px) {
  .viewer-btn {
    min-width: 40px;
    min-height: 40px;
    padding: 0.5rem;
  }

  .viewer-btn-close {
    min-width: 44px;
    min-height: 44px;
    padding: 0.625rem;
  }

  .viewer-close-icon {
    width: 20px;
    height: 20px;
  }
}

/* 圖示尺寸 — 手機略小更簡素 */
.viewer-ico {
  width: 18px;
  height: 18px;
}
.viewer-ico-lg {
  width: 20px;
  height: 20px;
}
@media (min-width: 640px) {
  .viewer-ico { width: 20px; height: 20px; }
}

/* Hit-zone：左/右半 viewport invisible click 翻頁；保留 chevron 按鈕作 a11y fallback。
   啟發自 sites/ryan-mcginley.md（200 張全 DOM 預載翻頁式）；本站 lazy 仍走 thumb，
   但 click-zone 本身可獨立採納。30% 寬度為「足以涵蓋 image 邊界但留中央 40% 給 image」之折衷 */
.viewer-hit-zone {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 30%;
  background: transparent;
  border: 0;
  padding: 0;
  margin: 0;
  cursor: pointer;
  z-index: 5;
}
.viewer-hit-zone--left {
  left: 0;
}
.viewer-hit-zone--right {
  /* right via inline style (跟著 panelLayoutOffsetPx) */
}
/* 縮放中讓出：避免覆蓋 image drag-to-pan 與雙指捏合（行動版） */
.viewer-hit-zone--inactive {
  pointer-events: none;
  cursor: default;
}

/* 上／下一張 — 圓形浮空鈕，淡墨底 + 細邊 */
.viewer-nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 9999px;
  background-color: rgb(12 10 9 / 0.55);
  border: 1px solid rgb(168 162 158 / 0.2);
  color: rgb(231 229 228 / 0.9);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
.viewer-nav-btn:hover {
  background-color: rgb(12 10 9 / 0.82);
  color: rgb(250 250 249);
  border-color: rgb(231 229 228 / 0.35);
}
@media (min-width: 640px) {
  .viewer-nav-btn { width: 48px; height: 48px; }
}

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

/*
  關鍵：<picture> 預設 display:inline 且無尺寸，會切斷 <img> 的 max-height:100%
  百分比參照鏈——百分比高度只能對到 picture 自身的內容高（＝圖片本身高），等於沒有上限，
  於是直幅（portrait）圖無法被視窗高度框住、開圖時過大；橫幅靠 max-width 反而正常。
  用 display:contents 讓 picture 盒子消失，<img> 直接成為 .image-viewer-area 內
  w-full h-full flex 容器的子元素，max-width/height:100% 才會對到真正的視窗框，
  直/橫幅一致 fit。
*/
.image-viewer-area picture {
  display: contents;
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

/* 對頁 takeover 開啟時主圖區整塊隱去（InfoPanel 自己渲染左頁影像） */
.image-viewer-area--hidden {
  opacity: 0;
  pointer-events: none;
}

/* ===== R50：對軌 PAIRED overlay（viewer 右下角，首秒可見） ===== */
.viewer-paired-overlay {
  position: absolute;
  right: 5rem;
  bottom: 4.4rem;
  z-index: 7;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.5rem 0.85rem 0.5rem 0.55rem;
  background: rgb(12 10 9 / 0.7);
  border: 1px solid rgb(231 184 125 / 0.45);
  border-radius: 8px;
  backdrop-filter: blur(6px);
  text-decoration: none;
  color: inherit;
  transition: background-color 0.3s ease, border-color 0.3s ease, transform 0.4s ease;
}
.viewer-paired-overlay:hover {
  background: rgb(12 10 9 / 0.88);
  border-color: rgb(231 184 125 / 0.85);
  transform: translateY(-2px);
}
.viewer-paired-overlay__label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding-right: 0.4rem;
  border-right: 1px solid rgb(214 211 209 / 0.25);
}
.viewer-paired-overlay__kana {
  font-size: 1.05rem;
  letter-spacing: 0.05em;
  color: rgb(231 184 125 / 0.95);
  font-weight: 300;
  line-height: 1;
}
.viewer-paired-overlay__en {
  font-size: 0.5rem;
  letter-spacing: 0.32em;
  color: rgb(214 211 209 / 0.8);
  text-transform: uppercase;
}
.viewer-paired-overlay__thumb {
  width: 56px;
  height: 38px;
  overflow: hidden;
  background: rgb(28 25 23);
  border: 1px solid rgb(214 211 209 / 0.18);
  flex-shrink: 0;
}
.viewer-paired-overlay__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}
.viewer-paired-overlay:hover .viewer-paired-overlay__thumb img {
  transform: scale(1.08);
}
.viewer-paired-overlay__cta {
  font-size: 0.66rem;
  letter-spacing: 0.32em;
  color: rgb(231 184 125 / 0.92);
  text-transform: uppercase;
  font-family: 'Noto Serif JP', serif;
  display: inline-flex;
  align-items: baseline;
  gap: 0.3rem;
}

@media (max-width: 640px) {
  .viewer-paired-overlay {
    right: 0.6rem;
    bottom: 3.4rem;
    padding: 0.4rem 0.6rem 0.4rem 0.45rem;
    gap: 0.5rem;
  }
  .viewer-paired-overlay__thumb {
    width: 44px;
    height: 30px;
  }
}

/* ===== 軌道縦書 rail（編輯感 cinematic layer） ===== */
.viewer-track-rail {
  position: absolute;
  left: 1.25rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 6;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
  color: rgb(231 229 228 / 0.85);
  text-shadow: 0 0 8px rgb(0 0 0 / 0.55);
  user-select: none;
}
.viewer-track-rail__kana {
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: clamp(2.4rem, 5vw, 3.6rem);
  line-height: 1;
  font-weight: 300;
  letter-spacing: 0.18em;
  writing-mode: vertical-rl;
  text-orientation: upright;
  color: rgb(250 250 249 / 0.92);
}
.viewer-track-rail--kai .viewer-track-rail__kana {
  color: rgb(231 184 125 / 0.82); /* accent-300 hint for digital track */
}
.viewer-track-rail--kage .viewer-track-rail__kana {
  color: rgb(214 211 209 / 0.95); /* cooler stone for photography track */
}
.viewer-track-rail__hairline {
  display: block;
  width: 1px;
  height: 56px;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgb(231 229 228 / 0.4) 50%,
    transparent 100%
  );
}
.viewer-track-rail__index,
.viewer-track-rail__total,
.viewer-track-rail__divider {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: 0.75rem;
  letter-spacing: 0.25em;
  font-weight: 300;
  color: rgb(214 211 209 / 0.78);
  line-height: 1.4;
}
.viewer-track-rail__index {
  color: rgb(250 250 249 / 0.95);
  font-size: 0.85rem;
}
.viewer-track-rail__divider {
  color: rgb(168 162 158 / 0.5);
}

@media (max-width: 640px) {
  .viewer-track-rail {
    left: 0.6rem;
    gap: 0.6rem;
  }
  .viewer-track-rail__kana {
    font-size: 2rem;
  }
  .viewer-track-rail__hairline {
    height: 40px;
  }
}

/* ===== 底部 hairline progress rail ===== */
.viewer-progress-rail {
  position: absolute;
  bottom: 3.1rem;
  left: 5rem;
  height: 1px;
  z-index: 6;
}
.viewer-progress-rail__line {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    transparent 0%,
    rgb(231 229 228 / 0.18) 12%,
    rgb(231 229 228 / 0.45) 50%,
    rgb(231 229 228 / 0.18) 88%,
    transparent 100%
  );
}
.viewer-progress-rail__cursor {
  position: absolute;
  top: 50%;
  width: 18px;
  height: 18px;
  margin-left: -9px;
  transform: translateY(-50%);
  border-radius: 9999px;
  background: rgb(231 184 125 / 0.85); /* accent ink dot */
  box-shadow:
    0 0 0 1px rgb(28 25 23 / 0.65),
    0 0 12px rgb(231 184 125 / 0.45);
  transition: left 0.32s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.viewer-progress-rail__cursor::after {
  content: '';
  position: absolute;
  inset: 5px;
  border-radius: 9999px;
  background: rgb(250 250 249 / 0.92);
}

@media (max-width: 640px) {
  .viewer-progress-rail {
    bottom: 2.4rem;
    left: 2.6rem;
  }
  .viewer-progress-rail__cursor {
    width: 14px;
    height: 14px;
    margin-left: -7px;
  }
}

/* ===== 底部 keyboard shortcut footer ===== */
.viewer-shortcut-footer {
  position: absolute;
  bottom: 1rem;
  left: 5rem;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  font-size: 0.65rem;
  letter-spacing: 0.32em;
  color: rgb(214 211 209 / 0.62);
  text-transform: uppercase;
  font-weight: 300;
  text-shadow: 0 0 6px rgb(0 0 0 / 0.55);
  user-select: none;
}
.viewer-shortcut-footer__group {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.viewer-shortcut-footer__divider {
  display: inline-block;
  width: 18px;
  height: 1px;
  background: rgb(214 211 209 / 0.28);
}
.viewer-kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.6rem;
  height: 1.4rem;
  padding: 0 0.4rem;
  font-family: 'Inter', 'Helvetica Neue', sans-serif;
  font-size: 0.62rem;
  color: rgb(250 250 249 / 0.9);
  background: rgb(28 25 23 / 0.55);
  border: 1px solid rgb(231 229 228 / 0.18);
  border-radius: 3px;
  letter-spacing: 0.05em;
}

@media (max-width: 640px) {
  .viewer-shortcut-footer {
    left: 2.6rem;
    gap: 0.5rem;
    font-size: 0.58rem;
    letter-spacing: 0.22em;
  }
  .viewer-shortcut-footer__group span {
    display: none; /* keep only the kbd glyphs visible on mobile */
  }
  .viewer-shortcut-footer__divider {
    width: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .viewer-progress-rail__cursor {
    transition: none;
  }
}
</style>