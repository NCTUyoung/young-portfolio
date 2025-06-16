<template>
  <div class="min-h-screen bg-stone-50/30">
    <!-- Header -->
    <div class="container mx-auto px-6 py-12 md:py-20">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl sm:text-4xl md:text-5xl font-extralight text-stone-800 mb-6 tracking-wider leading-tight">Works</h1>
        <p class="text-stone-600 font-light mb-8 md:mb-12 text-base md:text-lg leading-relaxed tracking-wide">作品集 - Digital Art & Photography</p>

        <!-- Category Tabs -->
        <div class="mb-6 md:mb-8">
          <GalleryTabBar />
        </div>

        <!-- Event Filter -->
        <div class="mb-10 md:mb-16">
          <EventFilter />
        </div>
      </div>
    </div>

    <!-- Gallery with Timeline -->
    <div class="container mx-auto px-6 relative">
      <!-- Timeline Line -->
      <div class="absolute left-12 top-0 bottom-0 w-px bg-stone-200/60 hidden md:block"></div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-20">
        <div class="inline-block animate-spin rounded-full h-10 w-10 border-b border-stone-300"></div>
        <p class="mt-6 text-stone-500 font-light tracking-wide">載入中...</p>
      </div>

      <!-- Desktop: Timeline Layout -->
      <div v-if="!isLoading" class="hidden md:block">
        <div class="space-y-24 max-w-6xl mx-auto">
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
            <div class="mb-8 border border-stone-200/60 rounded-xl hover:border-stone-300/80 transition-all duration-500">
              <!-- Group Header -->
              <div class="p-8 border-b border-stone-200/40">
                <div class="flex items-center justify-between">
                  <h3 class="text-2xl font-extralight text-stone-800 tracking-wider leading-relaxed">
                    {{ item.eventName || '其他作品' }}
                  </h3>
                  <button
                    @click="toggleGroupExpansion(item.eventName || 'no-event')"
                    class="flex items-center gap-3 px-4 py-2 text-sm text-stone-500 hover:text-stone-700 border border-stone-200/60 rounded-lg transition-all duration-300 hover:bg-stone-50/50 font-light tracking-wide shrink-0"
                  >
                    <span>{{ isGroupExpanded(item.eventName || 'no-event') ? '收起' : '展開' }}</span>
                    <svg class="w-4 h-4 transform transition-transform duration-300 opacity-70"
                         :class="isGroupExpanded(item.eventName || 'no-event') ? 'rotate-180' : ''"
                         fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                  </button>
                </div>
                <p class="text-sm text-stone-500 mt-4 font-light tracking-wide">{{ item.images?.length || 0 }} 張作品</p>
              </div>

              <!-- Preview Images -->
              <div class="p-6">
                <div class="grid grid-cols-3 gap-3">
                  <div v-for="(image, idx) in (item.images || []).slice(0, 3)"
                       :key="image.filename"
                       @click="openImageViewer(image, item.images || [])"
                       class="aspect-square rounded-lg overflow-hidden border border-stone-200/50 cursor-pointer group hover:border-stone-300/70 transition-all duration-300">
                    <img :src="getImagePath(image.filename)"
                         :alt="image.title"
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out">
                  </div>
                </div>
                <div v-if="(item.images?.length || 0) > 3" class="text-center mt-6">
                  <span class="text-xs text-stone-400 font-light tracking-wide">
                    還有 {{ (item.images?.length || 0) - 3 }} 張作品
                  </span>
                </div>
              </div>

              <!-- Expanded Group Items -->
              <div v-if="isGroupExpanded(item.eventName || 'no-event')"
                   class="space-y-12 ml-6 border-l border-stone-200/40 pl-8 pb-8 relative">
                <div v-for="(image, imageIndex) in item.images || []"
                     :key="image.filename"
                     class="relative">
                  <!-- 連接線 -->
                  <div v-if="imageIndex < (item.images?.length || 0) - 1"
                       class="absolute top-full left-0 right-0 z-0 flex justify-between px-10"
                       style="height: 3rem;">
                    <div class="w-px h-full bg-stone-200/50"></div>
                    <div class="w-px h-full bg-stone-200/50"></div>
                  </div>

                  <PhotoCard :image="image" @openViewer="(img: GalleryItem) => openImageViewer(img, item.images || [])" />
                </div>
              </div>
            </div>
          </GalleryTimelineItem>
        </div>
      </div>

      <!-- Mobile: Simple Card Layout -->
      <div v-if="!isLoading" class="md:hidden block">
        <div class="space-y-6">
          <!-- Category Sections -->
          <div v-for="(item, index) in mixedPhotoItems" :key="item.key">
            <!-- Category Header -->
            <div v-if="item.eventName" class="mb-4">
              <h3 class="text-lg font-extralight text-stone-800 tracking-wider mb-2">
                {{ item.eventName }}
              </h3>
              <p class="text-xs text-stone-500 font-light">{{ item.images?.length || 0 }} 張作品</p>
            </div>

            <!-- Photo Grid -->
            <div class="grid grid-cols-2 gap-3 mb-8">
              <div v-for="image in item.images || []"
                   :key="image.filename"
                   @click="openImageViewer(image, item.images || [])"
                   class="aspect-square rounded-lg overflow-hidden border border-stone-200/50 cursor-pointer group active:scale-95 transition-all duration-200">
                <img :src="getImagePath(image.filename)"
                     :alt="image.title"
                     class="w-full h-full object-cover">

                <!-- Mobile Info Overlay -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-active:opacity-100 transition-opacity duration-200 flex items-end p-3">
                  <div class="text-white text-sm font-light">
                    <p class="truncate">{{ image.title }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Ungrouped Images -->
          <div v-if="mixedPhotoItems.some(item => !item.eventName && item.images?.length)">
            <div class="mb-4">
              <h3 class="text-lg font-extralight text-stone-800 tracking-wider mb-2">其他作品</h3>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div v-for="item in mixedPhotoItems.filter(item => !item.eventName)"
                   :key="item.key">
                <div v-for="image in item.images || []"
                     :key="image.filename"
                     @click="openImageViewer(image, item.images || [])"
                     class="aspect-square rounded-lg overflow-hidden border border-stone-200/50 cursor-pointer group active:scale-95 transition-all duration-200 relative">
                  <img :src="getImagePath(image.filename)"
                       :alt="image.title"
                       class="w-full h-full object-cover">

                  <!-- Mobile Info Overlay -->
                  <div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-active:opacity-100 transition-opacity duration-200 flex items-end p-3">
                    <div class="text-white text-sm font-light">
                      <p class="truncate">{{ image.title }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="container mx-auto px-6 py-24 md:py-24 py-16 text-center">
      <div class="text-3xl md:text-3xl text-2xl font-extralight text-stone-300 italic tracking-wider">friday vibes</div>
      <div class="text-sm text-stone-400 mt-4 font-light tracking-wide">thank god it's friday!</div>
    </div>

    <!-- 圖片檢視器 -->
    <ImageViewer />

  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore, type GalleryItem } from '~/stores/gallery'
import { useImageViewerStore } from '~/stores/imageViewer'
import { useGlobalToast } from '~/composables/useToast'

// ===== 組件引入 =====
import GalleryTabBar from '~/components/GalleryTabBar.vue'
import EventFilter from '~/components/EventFilter.vue'
import GalleryTimelineItem from '~/components/GalleryTimelineItem.vue'
import PhotoCard from '~/components/PhotoCard.vue'
import ImageViewer from '~/components/ImageViewer.vue'

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
  toggleGroupExpansion
} = galleryStore

const imageViewerStore = useImageViewerStore()
const toast = useGlobalToast()
const { getImagePath } = useImagePath()

// ===== 計算屬性 =====
const isGroupExpanded = (groupKey: string) => {
  return expandedGroups.value[groupKey] || false
}

// ===== 圖片檢視器方法 =====
const openImageViewer = (clickedImage: GalleryItem, images: GalleryItem[]) => {
  imageViewerStore.openImageViewer(clickedImage, images)
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