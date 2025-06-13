<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="container mx-auto px-4 py-12">
      <h1 class="text-4xl font-light text-gray-800 mb-4 tracking-wide">Works</h1>
      <p class="text-gray-600 font-light mb-8">作品集 - Digital Art & Photography</p>

      <!-- Category Tabs -->
      <GalleryTabBar />

      <!-- Event Filter -->
      <EventFilter />
    </div>

    <!-- Gallery with Timeline -->
    <div class="container mx-auto px-4 relative">
      <!-- Timeline Line -->
      <div class="absolute left-8 top-0 bottom-0 w-px bg-gray-300 hidden md:block"></div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        <p class="mt-4 text-gray-600">載入中...</p>
      </div>

      <!-- Gallery Items -->
      <div v-else class="space-y-16">
        <GalleryTimelineItem
          v-for="(item, index) in mixedPhotoItems"
          :key="item.key"
          :index="index"
          :time-label="item.timeRange || ''"
          :event-info="item.eventInfo"
          :event-key="item.eventName || 'no-event'"
          :show-event-control="!!item.eventName"
          :show-event-info="!!item.eventName"
        >
          <!-- Group Card -->
          <div class="mb-4 border border-gray-100 rounded-lg">
            <!-- Group Header -->
            <div class="p-6 border-b border-gray-150">
              <div class="flex items-center justify-between">
                <h3 class="text-xl font-light text-gray-800 tracking-wide">
                  {{ item.eventName || '其他作品' }}
                </h3>
                <button
                  @click="toggleGroupExpansion(item.eventName || 'no-event')"
                  class="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded transition-colors duration-200"
                >
                  <span>{{ isGroupExpanded(item.eventName || 'no-event') ? '收起' : '展開' }}</span>
                  <svg class="w-4 h-4 transform transition-transform duration-200"
                       :class="isGroupExpanded(item.eventName || 'no-event') ? 'rotate-180' : ''"
                       fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                  </svg>
                </button>
              </div>
              <p class="text-sm text-gray-600 mt-2">{{ item.images?.length || 0 }} 張作品</p>
            </div>

            <!-- Preview Images -->
            <div class="p-4">
              <div class="grid grid-cols-3 gap-2">
                <div v-for="(image, idx) in (item.images || []).slice(0, 3)"
                     :key="image.filename"
                     @click="openImageViewer(image)"
                     class="aspect-square rounded overflow-hidden border border-gray-100 cursor-pointer">
                  <img :src="`/images/${image.filename}`"
                       :alt="image.title"
                       class="w-full h-full object-cover hover:scale-105 transition-transform duration-300">
                </div>
              </div>
              <div v-if="(item.images?.length || 0) > 3" class="text-center mt-3">
                <span class="text-xs text-gray-500">還有 {{ (item.images?.length || 0) - 3 }} 張作品</span>
              </div>
            </div>

            <!-- Expanded Group Items -->
            <div v-if="isGroupExpanded(item.eventName || 'no-event')"
                 class="space-y-8 ml-4 border-l-2 border-gray-150 pl-6 pb-6 relative">
              <div v-for="(image, imageIndex) in item.images || []"
                   :key="image.filename"
                   class="relative">
                <!-- 連接線 -->
                <div v-if="imageIndex < (item.images?.length || 0) - 1"
                     class="absolute top-full left-0 right-0 z-0 flex justify-between px-8"
                     style="height: 2rem;">
                  <div class="w-0.5 h-full bg-gray-400 opacity-70"></div>
                  <div class="w-0.5 h-full bg-gray-400 opacity-70"></div>
                </div>

                <PhotoCard :image="image" @openViewer="openImageViewer" />
              </div>
            </div>
          </div>
        </GalleryTimelineItem>
      </div>
    </div>

    <!-- Footer -->
    <div class="container mx-auto px-4 py-16 text-center">
      <div class="text-2xl font-light text-gray-400 italic">friday vibes</div>
      <div class="text-sm text-gray-500 mt-2">thank god it's friday!</div>
    </div>

    <!-- 圖片檢視器 -->
    <div v-if="imageViewerOpen" class="fixed inset-0 z-[9999] bg-black bg-opacity-90 backdrop-blur-sm">
      <!-- 背景點擊關閉 -->
      <div @click="closeImageViewer" class="absolute inset-0"></div>

      <!-- 主要內容 -->
      <div class="relative w-full h-full flex items-center justify-center p-4">
        <!-- 頂部工具列 -->
        <div class="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
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
                 'transition-transform duration-200 ease-out select-none',
                 viewerScale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
               ]"
               :style="imageStyle"
               draggable="false"
               @click.stop
               @mousedown="handleMouseDown" />

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
                class="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 backdrop-blur-sm text-white rounded-full hover:bg-opacity-70 transition-colors"
                title="下一張 (→)">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>

        <!-- 放射型輪盤縮圖導航 -->
        <div v-if="viewerImages.length > 1" class="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div class="relative">
            <!-- 放射型縮圖 -->
            <div class="relative">
              <button v-for="(image, index) in viewerImages"
                      :key="image.id"
                      @click="selectRadialImage(index)"
                      :style="{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: '48px',
                        height: '48px',
                        transform: `translate(-50%, -50%) translate(${posMap[index]?.x || 0}px, ${posMap[index]?.y || 0}px)`,
                        opacity: index === currentImageIndex ? 1 : (isTransitioning && index === previousImageIndex ? 0 : 0.6),
                        zIndex: index === currentImageIndex ? 30 : 20,
                        transition: 'opacity 0.4s ease-out, transform 0.4s ease-out'
                      }"
                      :class="[
                        'rounded-full border-2 overflow-hidden bg-gray-800 bg-opacity-80 hover:scale-110 transition-all duration-300',
                        index === currentImageIndex
                          ? 'border-white shadow-2xl shadow-blue-500/60 radial-nav-active'
                          : 'border-gray-600 hover:border-white'
                      ]"
                      :title="`${image.title} (${index + 1}/${viewerImages.length})`">
                <!-- 縮圖圖片 -->
                <img :src="`/images/${image.filename}`" :alt="image.title" class="w-full h-full object-cover" />

                <!-- 當前圖片的特殊效果 -->
                <div v-if="index === currentImageIndex"
                     class="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-600/20 animate-pulse"></div>
              </button>
            </div>

            <!-- 中心控制按鈕 -->
            <button class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-black bg-opacity-70 backdrop-blur-sm rounded-full border-2 border-white border-opacity-30 hover:border-opacity-60 transition-all duration-300 flex items-center justify-center group z-40">
              <div class="text-white text-xs font-medium">{{ currentImageIndex + 1 }}/{{ viewerImages.length }}</div>
              <div class="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </button>

            <!-- 背景光暈 -->
            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-10 scale-150 animate-pulse pointer-events-none w-20 h-20"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore, type GalleryItem } from '~/stores/gallery'
import { useGlobalToast } from '~/composables/useToast'

// ===== 組件引入 =====
import GalleryTabBar from '~/components/GalleryTabBar.vue'
import EventFilter from '~/components/EventFilter.vue'
import GalleryTimelineItem from '~/components/GalleryTimelineItem.vue'
import PhotoCard from '~/components/PhotoCard.vue'

// ===== Store 和 Composables =====
const galleryStore = useGalleryStore()
const {
  mixedPhotoItems,
  expandedGroups,
  isLoading,
  digitalError,
  photographyError
} = storeToRefs(galleryStore)

const {
  loadAllWorks,
  toggleGroupExpansion,
  refreshData
} = galleryStore

const toast = useGlobalToast()

// ===== 圖片檢視器狀態 =====
const imageViewerOpen = ref(false)
const viewerImages = ref<GalleryItem[]>([])
const currentImageIndex = ref(0)
const viewerScale = ref(1)
const viewerTranslateX = ref(0)
const viewerTranslateY = ref(0)
const isDragging = ref(false)
const fitToScreen = ref(true)
const imageElement = ref<HTMLImageElement>()

// 放射型導航狀態
const previousImageIndex = ref(0)
const isTransitioning = ref(false)
const posMap = reactive<Record<number, { x: number; y: number }>>({})
const animating = ref(false)
const animStart = ref(0)
const radius = 140

// ===== 計算屬性 =====
const isGroupExpanded = (groupKey: string) => {
  return expandedGroups.value[groupKey] || false
}

const currentViewerImage = computed(() => {
  return viewerImages.value[currentImageIndex.value] || null
})

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

const canZoomIn = computed(() => viewerScale.value < 5)
const canZoomOut = computed(() => viewerScale.value > 0.5)
const hasPrevious = computed(() => currentImageIndex.value > 0)
const hasNext = computed(() => currentImageIndex.value < viewerImages.value.length - 1)

// ===== 圖片檢視器方法 =====
const openImageViewer = (clickedImage: GalleryItem) => {
  // 找到點擊圖片所屬的組
  let targetGroup: any = null
  for (const item of mixedPhotoItems.value) {
    if (item.images?.some(img => img.id === clickedImage.id)) {
      targetGroup = item
      break
    }
  }

  // 設置檢視器圖片列表
  if (targetGroup && targetGroup.images) {
    const startIndex = targetGroup.images.findIndex((img: GalleryItem) => img.id === clickedImage.id)
    viewerImages.value = targetGroup.images
    currentImageIndex.value = Math.max(0, startIndex)
  } else {
    viewerImages.value = [clickedImage]
    currentImageIndex.value = 0
  }

  imageViewerOpen.value = true
  document.body.style.overflow = 'hidden'
}

const closeImageViewer = () => {
  imageViewerOpen.value = false
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

const resetTransform = () => {
  viewerScale.value = 1
  viewerTranslateX.value = 0
  viewerTranslateY.value = 0
  fitToScreen.value = true
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
  }
}

const zoomOut = () => {
  if (canZoomOut.value) {
    const newScale = Math.max(viewerScale.value / 1.5, 0.5)
    viewerScale.value = newScale

    // 如果縮放到1以下，重置位置
    if (newScale <= 1) {
      viewerTranslateX.value = 0
      viewerTranslateY.value = 0
    }
  }
}

// ===== 放射型導航方法 =====
function calcXY(idx: number, currentIdx: number) {
  const total = viewerImages.value.length
  if (total === 1) return { x: 0, y: -radius }

  // 以 currentIdx 為 0，重新映射索引到 0..total-1
  const order = (idx - currentIdx + total) % total

  // 半圓分佈：從 0 度到 180 度（上半圓）
  const angleStep = 180 / Math.max(1, total - 1)
  const angle = 0 + order * angleStep // 從右邊 0 度到左邊 180 度
  const rad = (angle * Math.PI) / 180

  const x = Math.cos(rad) * radius
  const y = -Math.sin(rad) * radius // 負號讓 y 向上，形成上半圓

  return { x, y }
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function easeOutQuad(t: number) {
  return 1 - (1 - t) * (1 - t)
}

function startRadialAnimation(oldIdx: number, newIdx: number) {
  const total = viewerImages.value.length
  if (total <= 1) return

  animating.value = true
  animStart.value = performance.now()

  const startCoords: Record<number, { x: number; y: number }> = {}
  const targetCoords: Record<number, { x: number; y: number }> = {}

  for (let i = 0; i < total; i++) {
    startCoords[i] = calcXY(i, oldIdx)
    targetCoords[i] = calcXY(i, newIdx)
    posMap[i] = { ...startCoords[i] }
  }

  const duration = 400
  const step = (now: number) => {
    const t = Math.min((now - animStart.value) / duration, 1)
    const k = easeOutQuad(t)

    for (let i = 0; i < total; i++) {
      posMap[i].x = lerp(startCoords[i].x, targetCoords[i].x, k)
      posMap[i].y = lerp(startCoords[i].y, targetCoords[i].y, k)
    }

    if (t < 1) {
      requestAnimationFrame(step)
    } else {
      animating.value = false
    }
  }
  requestAnimationFrame(step)
}

function updatePosMap(center: number) {
  viewerImages.value.forEach((_, idx) => {
    posMap[idx] = calcXY(idx, center)
  })
}

const selectRadialImage = (index: number) => {
  if (index === currentImageIndex.value || animating.value) return

  const oldIdx = currentImageIndex.value
  previousImageIndex.value = oldIdx
  isTransitioning.value = true

  // 開始動畫
  startRadialAnimation(oldIdx, index)

  // 400ms 後更新索引
  setTimeout(() => {
    currentImageIndex.value = index
    isTransitioning.value = false
    resetTransform()
    updatePosMap(index)
  }, 400)
}

// ===== 事件處理 =====
const handleMouseDown = (event: MouseEvent) => {
  if (viewerScale.value <= 1) return

  isDragging.value = true
  const startX = event.clientX - viewerTranslateX.value
  const startY = event.clientY - viewerTranslateY.value

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return
    viewerTranslateX.value = e.clientX - startX
    viewerTranslateY.value = e.clientY - startY
  }

  const handleMouseUp = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleWheel = (event: WheelEvent) => {
  if (!imageViewerOpen.value) return
  event.preventDefault()

  if (event.deltaY < 0) {
    zoomIn()
  } else {
    zoomOut()
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!imageViewerOpen.value) return

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

// ===== 監聽器 =====
watch(currentImageIndex, (val) => {
  if (!animating.value) updatePosMap(val)
})

watch(viewerImages, () => updatePosMap(currentImageIndex.value))

watch([digitalError, photographyError], ([digitalErr, photoErr]) => {
  if (digitalErr) {
    toast.error('載入數位作品失敗', '請檢查網路連線或稍後再試')
  }
  if (photoErr) {
    toast.error('載入攝影作品失敗', '請檢查網路連線或稍後再試')
  }
})

// ===== 生命週期 =====
onMounted(async () => {
  try {
    await toast.promise(
      loadAllWorks(),
      {
        loading: '載入作品中...',
        success: '作品載入完成！',
        error: '載入作品失敗'
      }
    )

    // 默認展開第一個組
    if (mixedPhotoItems.value.length > 0) {
      const firstGroup = mixedPhotoItems.value[0]
      if (firstGroup.eventName) {
        toggleGroupExpansion(firstGroup.eventName)
      } else {
        toggleGroupExpansion('no-event')
      }
    }
  } catch (error) {
    console.error('Failed to load works:', error)
  }

  // 初始化放射型導航位置
  updatePosMap(currentImageIndex.value)

  // 添加事件監聽
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('wheel', handleWheel, { passive: false })
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('wheel', handleWheel)
  document.body.style.overflow = ''
})

// ===== SEO =====
useHead({
  title: 'Works - 作品集',
  meta: [
    { name: 'description', content: '數位藝術與攝影作品集' }
  ]
})
</script>

<style scoped>
/* ===== 滾動條樣式 ===== */
.overflow-x-auto::-webkit-scrollbar {
  height: 4px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* ===== 放射型導航動畫 ===== */
@keyframes radialFadeIn {
  from {
    opacity: 0;
    transform: scale(0.3);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes radialPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.6), 0 0 20px rgba(147, 51, 234, 0.4);
  }
  50% {
    box-shadow: 0 0 0 15px rgba(59, 130, 246, 0), 0 0 30px rgba(147, 51, 234, 0.6);
  }
}

@keyframes currentGlow {
  0%, 100% {
    filter: brightness(1) saturate(1);
  }
  50% {
    filter: brightness(1.2) saturate(1.3);
  }
}

.radial-nav-active {
  animation: radialPulse 2s infinite, currentGlow 1.5s ease-in-out infinite;
}

/* ===== 工具類 ===== */
.rotate-45 {
  transform: rotate(45deg);
}

.gradient-border {
  position: relative;
  background: linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899);
  border-radius: 50%;
  padding: 2px;
}

.gradient-border::before {
  content: '';
  position: absolute;
  inset: 2px;
  background: black;
  border-radius: 50%;
  z-index: -1;
}
</style>