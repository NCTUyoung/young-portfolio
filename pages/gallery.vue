<template>
  <div class="min-h-screen bg-white">
    <!-- Header - 極簡風格 -->
    <div class="container mx-auto px-6 py-8 md:py-12">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-2xl md:text-3xl font-extralight text-stone-800 mb-3 tracking-wider">Works</h1>
        <p class="text-stone-500 font-light mb-6 text-sm tracking-wide">Digital Art & Photography</p>

        <!-- Category Tabs -->
        <div class="mb-4">
          <GalleryTabBar />
        </div>

        <!-- Event Filter -->
        <div class="mb-6">
          <EventFilter />
        </div>
      </div>
    </div>

    <!-- Gallery Content -->
    <div class="container mx-auto px-6 relative">
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-20">
        <div class="inline-block animate-spin rounded-full h-10 w-10 border-b border-stone-300"></div>
        <p class="mt-6 text-stone-500 font-light tracking-wide">載入中...</p>
      </div>

      <!-- 根據當前類別顯示不同佈局 -->
      <div v-if="!isLoading">
        <!-- 數位繪圖 - Pinterest 風格瀑布流佈局 -->
        <div v-if="currentCategory === 'digital'" class="max-w-7xl mx-auto">
          <GalleryMasonryLayout
            :items="digitalArtItems"
            :columns="4"
            :gap="16"
            @image-click="openImageViewer"
          />
        </div>

        <!-- 攝影作品 - 保持原有的日式佈局 -->
        <div v-else-if="currentCategory === 'photography'">
          <!-- Timeline Layout for Photography -->
          <div class="hidden md:block">
            <div class="space-y-32 max-w-6xl mx-auto">
              <GalleryTimelineItem
                v-for="(item, index) in photographyEventItems"
                :key="item.key"
                :index="index"
                :time-label="item.timeRange || ''"
                :event-info="item.eventInfo"
                :event-key="item.eventName || 'no-event'"
                :show-event-control="!!item.eventName"
                :show-event-info="!!item.eventName"
              >
                <!-- 日式雙欄佈局 -->
                <div class="mb-12">
                  <div class="mb-6">
                    <h3 class="text-lg font-extralight text-stone-700 tracking-wider">
                      {{ item.eventName || '其他作品' }}
                    </h3>
                    <p class="text-xs text-stone-400 mt-1 font-light tracking-wide">{{ item.images?.length || 0 }} 張作品</p>
                  </div>

                  <div class="space-y-3">
                    <div v-for="(rowImages, rowIdx) in getImageRows(item.images || [])"
                         :key="`row-${rowIdx}`"
                         class="flex gap-3"
                         :style="{ height: getRowHeight(rowIdx, index) }">
                      <div v-for="(image, imgIdx) in rowImages"
                           :key="image.filename"
                           @click="openImageViewer(image, item.images || [])"
                           :class="getImageWidth(imgIdx, rowIdx, index)"
                           class="relative rounded-lg overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300">
                        <img :src="getImagePath(image.filename)"
                             :alt="image.title"
                             class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                          <h4 class="text-white text-sm font-light mb-2 truncate">{{ image.title || '未命名' }}</h4>
                          <div class="text-white/80 text-xs space-y-1 font-light">
                            <div v-if="image.camera || image.model" class="flex items-center gap-2">
                              <svg class="w-3 h-3 opacity-70" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"></path>
                              </svg>
                              <span>{{ image.camera }} {{ image.model }}</span>
                            </div>
                            <div class="flex items-center gap-3 text-white/70">
                              <span v-if="image.aperture">f/{{ image.aperture }}</span>
                              <span v-if="image.shutterSpeed">{{ formatShutterSpeed(image.shutterSpeed) }}</span>
                              <span v-if="image.iso">ISO {{ image.iso }}</span>
                              <span v-if="image.focalLength">{{ image.focalLength }}mm</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </GalleryTimelineItem>
            </div>
          </div>

          <!-- Mobile Layout for Photography -->
          <div class="md:hidden block">
            <div class="space-y-12">
              <div v-for="(item, index) in photographyEventItems" :key="item.key">
                <div v-if="item.eventName" class="mb-4">
                  <h3 class="text-base font-extralight text-stone-700 tracking-wider">
                    {{ item.eventName }}
                  </h3>
                  <p class="text-xs text-stone-400 font-light">{{ item.images?.length || 0 }} 張作品</p>
                </div>
                <div class="space-y-2">
                  <div v-for="(rowImages, rowIdx) in getImageRows(item.images || [])"
                       :key="`row-${rowIdx}`"
                       class="flex gap-2"
                       style="height: 150px">
                    <div v-for="(image, imgIdx) in rowImages"
                         :key="image.filename"
                         @click="openImageViewer(image, item.images || [])"
                         class="flex-1 rounded-lg overflow-hidden cursor-pointer group active:scale-95 transition-all duration-200 relative">
                      <img :src="getImagePath(image.filename)"
                           :alt="image.title"
                           class="w-full h-full object-cover">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 全部作品 - 混合佈局 -->
        <div v-else>
          <!-- 保持原有的混合佈局 -->
          <div class="hidden md:block">
            <div class="space-y-32 max-w-6xl mx-auto">
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
                <div class="mb-12">
                  <div class="mb-6">
                    <h3 class="text-lg font-extralight text-stone-700 tracking-wider">
                      {{ item.eventName || '其他作品' }}
                    </h3>
                    <p class="text-xs text-stone-400 mt-1 font-light tracking-wide">{{ item.images?.length || 0 }} 張作品</p>
                  </div>
                  <div class="space-y-3">
                    <div v-for="(rowImages, rowIdx) in getImageRows(item.images || [])"
                         :key="`row-${rowIdx}`"
                         class="flex gap-3"
                         :style="{ height: getRowHeight(rowIdx, index) }">
                      <div v-for="(image, imgIdx) in rowImages"
                           :key="image.filename"
                           @click="openImageViewer(image, item.images || [])"
                           :class="getImageWidth(imgIdx, rowIdx, index)"
                           class="relative rounded-lg overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300">
                        <img :src="getImagePath(image.filename)"
                             :alt="image.title"
                             class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out">
                      </div>
                    </div>
                  </div>
                </div>
              </GalleryTimelineItem>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="container mx-auto px-6 py-16 text-center">
      <div class="text-2xl md:text-3xl font-extralight text-stone-300 italic tracking-wider">friday vibes</div>
      <div class="text-xs text-stone-400 mt-2 font-light tracking-wide">thank god it's friday!</div>
    </div>

    <!-- 圖片檢視器 -->
    <ImageViewer />
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '~/stores/gallery'
import type { GalleryItem, PhotographyItem } from '~/types/gallery'
import { useImageViewerStore } from '~/stores/imageViewer'
import { useGlobalToast } from '~/composables/useToast'

// ===== 組件引入 =====
import GalleryTabBar from '~/components/GalleryTabBar.vue'
import EventFilter from '~/components/EventFilter.vue'
import GalleryTimelineItem from '~/components/GalleryTimelineItem.vue'
import ImageViewer from '~/components/ImageViewer.vue'

// ===== Store 和 Composables =====
const galleryStore = useGalleryStore()
const {
  mixedPhotoItems,
  isLoading,
  digitalError,
  photographyError,
  filterState,
  digitalWorks,
  currentWorks,
  groupedWorks
} = storeToRefs(galleryStore)

const {
  loadAllWorks
} = galleryStore

const imageViewerStore = useImageViewerStore()
const toast = useGlobalToast()
const { getImagePath } = useImagePath()



// ===== 計算屬性 =====
// 當前選擇的類別
const currentCategory = computed(() => filterState.value.selectedCategory)

// 數位作品列表 - 使用經過篩選的 currentWorks
const digitalArtItems = computed(() => {
  if (filterState.value.selectedCategory === 'digital') {
    return currentWorks.value
  }
  return digitalWorks.value
})



// 攝影作品事件分組
const photographyEventItems = computed(() => {
  return mixedPhotoItems.value.filter(item =>
    item.images && item.images.some(img => img.category === 'photography')
  )
})

// 收集所有無分類的圖片
const ungroupedImages = computed(() => {
  const images: GalleryItem[] = []
  mixedPhotoItems.value.forEach(item => {
    if (!item.eventName && item.images) {
      images.push(...item.images)
    }
  })
  return images
})

// ===== 圖片檢視器方法 =====
const openImageViewer = (clickedImage: GalleryItem, images: GalleryItem[]) => {
  imageViewerStore.openImageViewer(clickedImage, images)
}



// ===== 網格佈局輔助函數 =====
// 將圖片分成每行兩張
const getImageRows = (images: GalleryItem[]) => {
  const rows = []
  for (let i = 0; i < images.length; i += 2) {
    rows.push(images.slice(i, i + 2))
  }
  return rows
}

// 獲取每行的高度
const getRowHeight = (rowIndex: number, groupIndex: number) => {
  // 定義不同的行高模式
  const heightPatterns = [
    ['200px', '280px', '240px', '200px', '320px'],  // 模式 A
    ['280px', '200px', '260px', '220px', '300px'],  // 模式 B
    ['240px', '240px', '200px', '280px', '240px'],  // 模式 C
    ['300px', '220px', '240px', '260px', '200px'],  // 模式 D
  ]

  const patternIndex = groupIndex % heightPatterns.length
  const pattern = heightPatterns[patternIndex]
  return pattern[rowIndex % pattern.length]
}

// 獲取圖片寬度比例
const getImageWidth = (imageIndex: number, rowIndex: number, groupIndex: number) => {
  // 定義不同的寬度比例模式
  const widthPatterns = [
    // 模式 A
    [
      ['w-3/5', 'w-2/5'],  // 3:2
      ['w-1/2', 'w-1/2'],  // 1:1
      ['w-2/5', 'w-3/5'],  // 2:3
      ['w-2/3', 'w-1/3'],  // 2:1
    ],
    // 模式 B
    [
      ['w-1/2', 'w-1/2'],  // 1:1
      ['w-1/3', 'w-2/3'],  // 1:2
      ['w-3/5', 'w-2/5'],  // 3:2
      ['w-1/2', 'w-1/2'],  // 1:1
    ],
    // 模式 C
    [
      ['w-2/3', 'w-1/3'],  // 2:1
      ['w-2/5', 'w-3/5'],  // 2:3
      ['w-1/2', 'w-1/2'],  // 1:1
      ['w-3/5', 'w-2/5'],  // 3:2
    ],
  ]

  const patternIndex = groupIndex % widthPatterns.length
  const rowPatterns = widthPatterns[patternIndex]
  const rowPattern = rowPatterns[rowIndex % rowPatterns.length]
  return rowPattern[imageIndex] || 'w-1/2'
}

// ===== 輔助方法 =====
// 判斷是否為攝影作品
const isPhotographyItem = (item: any): item is PhotographyItem => {
  return 'camera' in item && 'iso' in item && 'shutterSpeed' in item
}

// 格式化快門速度
const formatShutterSpeed = (speed: number) => {
  if (speed >= 1) {
    return `${speed}s`
  }
  return `1/${Math.round(1 / speed)}`
}

// ===== 監聽器 =====
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


  } catch (error) {
    console.error('Failed to load works:', error)
  }
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
/* ===== 日式排版優化樣式 ===== */

/* 滾動條樣式 - 更細緻的設計 */
.overflow-x-auto::-webkit-scrollbar {
  height: 2px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: rgba(168, 162, 158, 0.1);
  border-radius: 1px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: rgba(168, 162, 158, 0.3);
  border-radius: 1px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(168, 162, 158, 0.5);
}

/* 文字選擇樣式 */
::selection {
  background: rgba(168, 162, 158, 0.2);
  color: rgba(41, 37, 36, 0.9);
}

/* 優化動畫效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeInUp {
  animation: fadeInUp 0.6s ease-out;
}

/* 細緻的陰影效果 */
.shadow-japanese {
  box-shadow: 0 2px 8px rgba(168, 162, 158, 0.1), 0 1px 3px rgba(168, 162, 158, 0.05);
}

.shadow-japanese-hover {
  box-shadow: 0 4px 16px rgba(168, 162, 158, 0.15), 0 2px 6px rgba(168, 162, 158, 0.08);
}

/* 毛玻璃效果優化 */
.backdrop-blur-japanese {
  backdrop-filter: blur(8px) saturate(120%);
  -webkit-backdrop-filter: blur(8px) saturate(120%);
}

/* 按鈕懸停效果 */
button:hover {
  transform: translateY(-1px);
  transition: all 0.3s ease;
}

/* 圖片懸停效果 */
.group:hover img {
  filter: brightness(1.05) contrast(1.02);
}

/* 響應式設計優化 */
@media (max-width: 768px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  /* 標題尺寸調整 */
  h1 {
    font-size: 2rem !important;
    line-height: 1.2;
  }

  /* 手機版卡片佈局 */
  .grid-cols-2 > * {
    transition: transform 0.2s ease;
  }

  /* 觸控反饋 */
  .active\:scale-95:active {
    transform: scale(0.95);
  }

  /* 移除桌面版懸停效果 */
  .group:hover img {
    filter: none;
    transform: none;
  }
}

/* 極小螢幕優化 */
@media (max-width: 480px) {
  .container {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }

  h1 {
    font-size: 1.75rem !important;
  }

  /* 調整卡片間距 */
  .gap-3 {
    gap: 0.5rem;
  }

  /* 調整分類標題 */
  .text-lg {
    font-size: 1rem !important;
  }
}
</style>