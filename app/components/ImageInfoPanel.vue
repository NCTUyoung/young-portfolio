<template>
  <div
v-if="showInfoPanel && currentViewerImage && imageInfo"
       class="info-panel fixed top-0 right-0 z-50 h-full overflow-y-auto border-l border-stone-700/60 bg-stone-950/97 backdrop-blur-md transition-all duration-300 max-md:left-0 max-md:w-full max-md:border-l-0"
       :style="panelWidthStyle"
       @wheel.stop>

    <!-- 可拖拽的調整邊界（僅桌面） -->
    <div
class="absolute left-0 top-0 z-10 hidden h-full w-2 cursor-col-resize transition-colors hover:bg-stone-600/30 md:block"
         @mousedown="startResize"
         @touchstart="startResize">
      <!-- 調整握把（hairline） -->
      <div class="absolute left-0 top-1/2 transform -translate-y-1/2 w-px h-16 bg-stone-500/70 hover:bg-stone-300 transition-colors"/>
    </div>

    <!-- 面板標題 — 和紙小標 -->
    <div class="sticky top-0 bg-stone-950/85 backdrop-blur-md border-b border-stone-700/50 p-4 z-10">
      <div class="flex items-center justify-between">
        <div>
          <p class="jp-section-label mb-0.5">Info</p>
          <h3 class="text-stone-100 font-jp font-light tracking-wider text-base">圖片資訊</h3>
        </div>
        <button class="p-1 text-stone-400 hover:text-stone-100 transition-colors" @click="imageViewerStore.toggleInfoPanel">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 面板內容 -->
    <div class="p-5 space-y-7">
      <!-- 縮圖預覽 — 去圓角，走 jp-frame 風格 -->
      <div class="text-center">
        <div class="inline-block border border-stone-700/60 overflow-hidden bg-stone-900">
          <img
:src="getThumbPath(currentViewerImage.filename, 400)"
               :alt="imageInfo.title"
               class="w-32 h-32 object-contain"
               decoding="async"
               loading="lazy"
          >
        </div>
        <div class="mt-3 text-sm text-stone-300 text-center font-jp font-light tracking-wider">{{ imageInfo.title }}</div>
      </div>

      <!-- 基本資訊 -->
      <section class="space-y-3">
        <h4 class="text-stone-200 font-jp font-light tracking-[0.3em] text-xs pb-2 border-b border-stone-700/50">基本資訊</h4>

        <div class="space-y-2 text-sm font-light">
          <div class="flex justify-between gap-4">
            <span class="text-stone-500 flex-shrink-0">檔名</span>
            <span class="text-stone-200 font-mono text-xs truncate">{{ imageInfo.filename }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-stone-500">格式</span>
            <span class="text-stone-200">{{ imageInfo.format }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-stone-500">尺寸</span>
            <span class="text-stone-200 jp-kansuji">{{ imageInfo.dimensions }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-stone-500">檔案大小</span>
            <span class="text-stone-200 jp-kansuji">{{ formattedFileSize }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-stone-500">類別</span>
            <span class="text-stone-200">{{ imageInfo.category === 'digital' ? '數位藝術' : '攝影作品' }}</span>
          </div>
        </div>
      </section>

      <!-- 時間資訊 -->
      <section class="space-y-3">
        <h4 class="text-stone-200 font-jp font-light tracking-[0.3em] text-xs pb-2 border-b border-stone-700/50">時間資訊</h4>

        <div class="space-y-2 text-sm font-light">
          <div class="flex justify-between">
            <span class="text-stone-500">日期</span>
            <span class="text-stone-200 jp-kansuji">{{ currentViewerImage.date || '未知' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-stone-500">時間</span>
            <span class="text-stone-200 jp-kansuji">{{ currentViewerImage.time || '未知' }}</span>
          </div>
          <div v-if="imageInfo.createdAt" class="flex justify-between">
            <span class="text-stone-500">建立時間</span>
            <span class="text-stone-200 jp-kansuji">{{ formatDate(imageInfo.createdAt) }}</span>
          </div>
        </div>
      </section>

      <!-- 攝影參數 (如果有) -->
      <section v-if="imageInfo.category === 'photography' && (imageInfo.iso || imageInfo.aperture || imageInfo.shutterSpeed || imageInfo.focalLength)" class="space-y-3">
        <h4 class="text-stone-200 font-jp font-light tracking-[0.3em] text-xs pb-2 border-b border-stone-700/50">攝影參數</h4>

        <div class="space-y-2 text-sm font-light">
          <div v-if="imageInfo.iso" class="flex justify-between">
            <span class="text-stone-500">ISO</span>
            <span class="text-stone-200 jp-kansuji">{{ imageInfo.iso }}</span>
          </div>
          <div v-if="imageInfo.aperture" class="flex justify-between">
            <span class="text-stone-500">光圈</span>
            <span class="text-stone-200 jp-kansuji">f/{{ imageInfo.aperture }}</span>
          </div>
          <div v-if="imageInfo.shutterSpeed" class="flex justify-between">
            <span class="text-stone-500">快門</span>
            <span class="text-stone-200 jp-kansuji">1/{{ imageInfo.shutterSpeed }}s</span>
          </div>
          <div v-if="imageInfo.focalLength" class="flex justify-between">
            <span class="text-stone-500">焦距</span>
            <span class="text-stone-200 jp-kansuji">{{ imageInfo.focalLength }}mm</span>
          </div>
        </div>
      </section>

      <!-- 直方圖 -->
      <ImageHistogram />

      <!-- 標籤 -->
      <section v-if="imageInfo.tags && imageInfo.tags.length > 0" class="space-y-3">
        <h4 class="text-stone-200 font-jp font-light tracking-[0.3em] text-xs pb-2 border-b border-stone-700/50">標籤</h4>

        <div class="flex flex-wrap gap-2">
          <span
v-for="tag in imageInfo.tags"
                :key="tag"
                class="px-2.5 py-0.5 bg-stone-800/70 text-stone-300 text-xs border border-stone-700/60 font-light tracking-wide">
            {{ tag }}
          </span>
        </div>
      </section>

      <!-- 描述 -->
      <section v-if="imageInfo.description" class="space-y-3">
        <h4 class="text-stone-200 font-jp font-light tracking-[0.3em] text-xs pb-2 border-b border-stone-700/50">描述</h4>

        <p class="jp-body !text-sm !leading-[1.9] !text-stone-300">
          {{ imageInfo.description }}
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useMediaQuery } from '@vueuse/core'
import { useImageViewerStore } from '~/stores/imageViewer'
import ImageHistogram from './ImageHistogram.vue'

const imageViewerStore = useImageViewerStore()
const { getThumbPath } = useImagePath()
const {
  showInfoPanel,
  infoPanelWidth,
  currentViewerImage
} = storeToRefs(imageViewerStore)

const isDesktopInfoLayout = useMediaQuery('(min-width: 768px)')

const panelWidthStyle = computed(() => {
  if (!isDesktopInfoLayout.value) return {}
  return { width: `${infoPanelWidth.value}px` }
})

// 拖拽調整寬度相關狀態
const isResizing = ref(false)
const startX = ref(0)
const startWidth = ref(320)

// 寬度限制
const MIN_WIDTH = 280
const MAX_WIDTH = 600

// 開始調整寬度
const startResize = (event: MouseEvent | TouchEvent) => {
  event.preventDefault()
  isResizing.value = true

  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  startX.value = clientX
  startWidth.value = infoPanelWidth.value

  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.addEventListener('touchmove', handleResize, { passive: false })
  document.addEventListener('touchend', stopResize)

  // 添加全局樣式，防止選取文字
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'col-resize'
}

// 處理調整寬度
const handleResize = (event: MouseEvent | TouchEvent) => {
  if (!isResizing.value) return

  event.preventDefault()
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const deltaX = startX.value - clientX // 注意方向：向左拖拽是增加寬度
  const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth.value + deltaX))

  // 直接從 store 實例調用方法
  imageViewerStore.updateInfoPanelWidth(newWidth)
}

// 停止調整寬度
const stopResize = () => {
  isResizing.value = false

  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.removeEventListener('touchmove', handleResize)
  document.removeEventListener('touchend', stopResize)

  // 恢復正常樣式
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
}

// 清理事件監聽器
onUnmounted(() => {
  if (isResizing.value) {
    stopResize()
  }
})

// 圖片資訊計算屬性
const imageInfo = computed(() => {
  if (!currentViewerImage.value) return null

  const image = currentViewerImage.value

  // 改進日期處理邏輯
  let createdDate: Date | null = null

  try {
    if (image.date && image.time) {
      const dateTime = `${image.date} ${image.time}`
      const parsed = new Date(dateTime)
      if (!isNaN(parsed.getTime())) {
        createdDate = parsed
      }
    }

    if (!createdDate && image.date) {
      const parsed = new Date(image.date)
      if (!isNaN(parsed.getTime())) {
        createdDate = parsed
      }
    }

    if (!createdDate && image.filename) {
      const dateMatch = image.filename.match(/(\d{4})-?(\d{2})-?(\d{2})/)
      if (dateMatch) {
        const [, year, month, day] = dateMatch
        const parsed = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        if (!isNaN(parsed.getTime())) {
          createdDate = parsed
        }
      }
    }
  } catch (error) {
    console.warn('日期解析失敗:', error)
    createdDate = null
  }

  // 調試信息（開發時使用）
  if (import.meta.dev) {
    console.log('圖片時間資訊:', {
      date: image.date,
      time: image.time,
      filename: image.filename,
      parsedDate: createdDate
    })
  }

  // 估算圖片尺寸
  const estimatedWidth = image.iso ? 1920 : 1280
  const estimatedHeight = image.iso ? 1080 : 720
  const dimensions = `${estimatedWidth} × ${estimatedHeight}`

  // 根據類型和參數估算檔案大小
  const estimatedSize = image.category === 'photography' ? 2.5 * 1024 * 1024 : 1.8 * 1024 * 1024

  return {
    filename: image.filename,
    title: image.title || '未命名',
    description: image.description || '',
    category: image.category || '未分類',
    dimensions: dimensions,
    fileSize: estimatedSize,
    format: image.filename?.split('.').pop()?.toUpperCase() || 'UNKNOWN',
    createdAt: createdDate,
    updatedAt: createdDate,
    colors: [],
    tags: image.tags || [],
    // 攝影相關資訊
    iso: image.iso,
    aperture: image.aperture,
    shutterSpeed: image.shutterSpeed,
    focalLength: image.focalLength
  }
})

const formattedFileSize = computed(() => {
  if (!imageInfo.value?.fileSize) return '未知'

  const size = imageInfo.value.fileSize
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
})

const formatDate = (date: Date | null) => {
  if (!date) return '未知'

  if (isNaN(date.getTime())) {
    return '未知'
  }

  try {
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (error) {
    console.warn('日期格式化失敗:', error)
    return '未知'
  }
}
</script>