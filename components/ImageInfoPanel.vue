<template>
  <div v-if="showInfoPanel && currentViewerImage && imageInfo"
       class="info-panel fixed top-0 right-0 h-full bg-black bg-opacity-90 backdrop-blur-md border-l border-gray-600 overflow-y-auto z-50 transition-all duration-300"
       :style="{ width: infoPanelWidth + 'px' }"
       @wheel.stop>

    <!-- 可拖拽的調整邊界 -->
    <div class="absolute left-0 top-0 w-2 h-full cursor-col-resize hover:bg-blue-500 hover:bg-opacity-30 transition-colors z-10"
         @mousedown="startResize"
         @touchstart="startResize">
      <!-- 調整握把 -->
      <div class="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-20 bg-gray-400 rounded-r opacity-70 hover:opacity-100 transition-opacity"></div>
    </div>

    <!-- 面板標題 -->
    <div class="sticky top-0 bg-black bg-opacity-75 backdrop-blur-sm border-b border-gray-600 p-4">
      <div class="flex items-center justify-between">
        <h3 class="text-white font-medium">圖片資訊</h3>
        <button @click="imageViewerStore.toggleInfoPanel" class="p-1 text-gray-400 hover:text-white transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- 面板內容 -->
    <div class="p-4 space-y-6">
      <!-- 縮圖預覽 -->
      <div class="text-center">
        <div class="inline-block border border-gray-600 rounded-lg overflow-hidden bg-gray-800">
          <img :src="`/images/${currentViewerImage.filename}`"
               :alt="imageInfo.title"
               class="w-32 h-32 object-contain" />
        </div>
        <div class="mt-2 text-sm text-gray-300 text-center font-medium">{{ imageInfo.title }}</div>
      </div>

      <!-- 基本資訊 -->
      <div class="space-y-3">
        <h4 class="text-white font-medium border-b border-gray-600 pb-2">基本資訊</h4>

        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-400">檔名：</span>
            <span class="text-gray-200 font-mono">{{ imageInfo.filename }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">格式：</span>
            <span class="text-gray-200">{{ imageInfo.format }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">尺寸：</span>
            <span class="text-gray-200">{{ imageInfo.dimensions }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">檔案大小：</span>
            <span class="text-gray-200">{{ formattedFileSize }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">類別：</span>
            <span class="text-gray-200">{{ imageInfo.category === 'digital' ? '數位藝術' : '攝影作品' }}</span>
          </div>
        </div>
      </div>

      <!-- 時間資訊 -->
      <div class="space-y-3">
        <h4 class="text-white font-medium border-b border-gray-600 pb-2">時間資訊</h4>

        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-400">日期：</span>
            <span class="text-gray-200">{{ currentViewerImage.date || '未知' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">時間：</span>
            <span class="text-gray-200">{{ currentViewerImage.time || '未知' }}</span>
          </div>
          <div v-if="imageInfo.createdAt" class="flex justify-between">
            <span class="text-gray-400">建立時間：</span>
            <span class="text-gray-200">{{ formatDate(imageInfo.createdAt) }}</span>
          </div>
        </div>
      </div>

      <!-- 攝影參數 (如果有) -->
      <div v-if="imageInfo.category === 'photography' && (imageInfo.iso || imageInfo.aperture || imageInfo.shutterSpeed || imageInfo.focalLength)" class="space-y-3">
        <h4 class="text-white font-medium border-b border-gray-600 pb-2">攝影參數</h4>

        <div class="space-y-2 text-sm">
          <div v-if="imageInfo.iso" class="flex justify-between">
            <span class="text-gray-400">ISO：</span>
            <span class="text-gray-200">{{ imageInfo.iso }}</span>
          </div>
          <div v-if="imageInfo.aperture" class="flex justify-between">
            <span class="text-gray-400">光圈：</span>
            <span class="text-gray-200">f/{{ imageInfo.aperture }}</span>
          </div>
          <div v-if="imageInfo.shutterSpeed" class="flex justify-between">
            <span class="text-gray-400">快門：</span>
            <span class="text-gray-200">1/{{ imageInfo.shutterSpeed }}s</span>
          </div>
          <div v-if="imageInfo.focalLength" class="flex justify-between">
            <span class="text-gray-400">焦距：</span>
            <span class="text-gray-200">{{ imageInfo.focalLength }}mm</span>
          </div>
        </div>
      </div>

      <!-- 直方圖 -->
      <ImageHistogram />

      <!-- 標籤 -->
      <div v-if="imageInfo.tags && imageInfo.tags.length > 0" class="space-y-3">
        <h4 class="text-white font-medium border-b border-gray-600 pb-2">標籤</h4>

        <div class="flex flex-wrap gap-2">
          <span v-for="tag in imageInfo.tags"
                :key="tag"
                class="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs border border-gray-600">
            {{ tag }}
          </span>
        </div>
      </div>

      <!-- 描述 -->
      <div v-if="imageInfo.description" class="space-y-3">
        <h4 class="text-white font-medium border-b border-gray-600 pb-2">描述</h4>

        <p class="text-gray-300 text-sm leading-relaxed">
          {{ imageInfo.description }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useImageViewerStore } from '~/stores/imageViewer'
import ImageHistogram from './ImageHistogram.vue'

const imageViewerStore = useImageViewerStore()
const {
  showInfoPanel,
  infoPanelWidth,
  currentViewerImage
} = storeToRefs(imageViewerStore)

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
  if (process.dev) {
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