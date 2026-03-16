<template>
  <div ref="pageRef" class="min-h-screen transition-colors duration-300">
    <!-- Header — 個性化設計 -->
    <div class="container mx-auto px-6 py-12 md:py-20 relative">
      <!-- 裝飾線 -->
      <div class="deco-line-v h-20 top-4 right-[8%] hidden lg:block"/>
      <div class="deco-dot top-4 right-[8%] hidden lg:block" style="transform: translate(-2px, -8px)"/>
      <!-- 右側豎排裝飾字 -->
      <div class="absolute top-8 right-[8%] hidden lg:flex flex-col items-center gap-2 select-none pointer-events-none" style="transform: translateX(20px)">
        <span class="writing-vertical font-jp text-[0.6rem] tracking-[0.5em] text-stone-300/50 dark:text-stone-700/40">記録と創作</span>
      </div>

      <div class="max-w-7xl mx-auto">
        <!-- 小標 + 主標 -->
        <div class="mb-2">
          <p class="jp-section-label mb-2">Gallery</p>
          <div class="flex items-end gap-6">
            <h1 class="text-3xl md:text-4xl font-extralight text-stone-800 dark:text-stone-200 tracking-wider">Works</h1>
            <!-- 裝飾細線 -->
            <div class="hidden sm:block h-px flex-1 max-w-[120px] bg-gradient-to-r from-accent-400/50 to-transparent mb-2"/>
          </div>
        </div>

        <!-- 作品數量 -->
        <p class="text-stone-500 dark:text-stone-400 font-light mb-6 text-sm tracking-wide flex items-center gap-2">
          <span class="text-accent-500 dark:text-accent-400">{{ categoryLabel }}</span>
          <span class="text-stone-300 dark:text-stone-700">·</span>
          <span>{{ categoryCount }} works</span>
        </p>

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
      <div v-if="isLoading" class="text-center py-28">
        <!-- 日式菱形旋轉動畫 -->
        <div class="inline-flex flex-col items-center gap-6">
          <div class="relative w-10 h-10">
            <div class="absolute inset-0 border border-accent-300/60 dark:border-accent-600/40 rotate-45 animate-spin" style="animation-duration: 2s;"/>
            <div class="absolute inset-[6px] border border-accent-400/40 dark:border-accent-500/30 rotate-45 animate-spin" style="animation-duration: 3s; animation-direction: reverse;"/>
            <div class="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-accent-400 dark:bg-accent-500 rotate-45"/>
          </div>
          <p class="jp-section-label">Loading</p>
        </div>
      </div>

      <!-- 地點地圖：僅在攝影作品分類顯示 -->
      <section
        v-if="eventLocations && eventLocations.length && currentCategory === 'photography'"
        ref="mapSectionRef"
        class="mb-16 max-w-6xl mx-auto"
      >
        <p class="jp-section-label mb-3">Visited Places</p>
        <EventMap
          :events="eventLocations"
          @focus-event="handleFocusEvent"
        />
      </section>

      <!-- 根據當前類別顯示不同佈局（帶切換動畫） -->
      <transition name="gallery-fade" mode="out-in">
      <div v-if="!isLoading" :key="currentCategory">
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
              <div
                v-for="(item, index) in photographyEventItems"
                :key="item.key"
                :ref="el => setEventRef(item.eventName || 'no-event', el)"
                :class="[
                  'transition-colors duration-500',
                  focusedEventName === item.eventName
                    ? 'bg-amber-50/40 dark:bg-amber-900/10 rounded-2xl -mx-4 px-4 py-2'
                    : ''
                ]"
              >
                <GalleryTimelineItem
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
                      <h3 class="text-lg font-extralight text-stone-700 dark:text-stone-300 tracking-wider">
                        {{ item.eventName || '其他作品' }}
                      </h3>
                      <p class="text-xs text-stone-400 dark:text-stone-500 mt-1 font-light tracking-wide">{{ item.images?.length || 0 }} 張作品</p>
                    </div>

                    <div class="space-y-3">
                      <div
                        v-for="(rowImages, rowIdx) in getImageRows(item.images || [])"
                        :key="`row-${rowIdx}`"
                        class="flex gap-3"
                        :style="{ height: getRowHeight(rowIdx, index) }">
                        <div
                          v-for="(image, imgIdx) in rowImages"
                          :key="image.filename"
                          :class="[
                            getImageWidth(imgIdx, rowIdx, index),
                            'relative rounded-lg overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300',
                            isImageLoaded(image.filename) ? 'bg-white dark:bg-stone-800' : 'bg-stone-100 dark:bg-stone-800 animate-pulse'
                          ]"
                          @click="openImageViewer(image, item.images || [])">
                          <img
                            :src="getImagePath(image.filename)"
                            :alt="image.title"
                            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                            loading="lazy"
                            @load="markImageLoaded(image.filename)"
                          >
                          <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                            <h4 class="text-white text-sm font-light mb-2 truncate">{{ image.title || '未命名' }}</h4>
                            <div class="text-white/80 text-xs space-y-1 font-light">
                              <div v-if="image.camera || image.model" class="flex items-center gap-2">
                                <svg class="w-3 h-3 opacity-70" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
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
          </div>

          <!-- Mobile Layout for Photography -->
          <div class="md:hidden block">
            <div class="space-y-12">
              <div v-for="item in photographyEventItems" :key="item.key">
                <div v-if="item.eventName" class="mb-4">
                  <h3 class="text-base font-extralight text-stone-700 dark:text-stone-300 tracking-wider">
                    {{ item.eventName }}
                  </h3>
                  <p class="text-xs text-stone-400 dark:text-stone-500 font-light">{{ item.images?.length || 0 }} 張作品</p>
                </div>
                <div class="space-y-2">
                  <div
v-for="(rowImages, rowIdx) in getImageRows(item.images || [])"
                       :key="`row-${rowIdx}`"
                       class="flex gap-2"
                       style="height: 150px">
                    <div
v-for="image in rowImages"
                         :key="image.filename"
                         :class="[
                           'flex-1 rounded-lg overflow-hidden cursor-pointer group active:scale-95 transition-all duration-200 relative',
                           isImageLoaded(image.filename) ? 'bg-white dark:bg-stone-800' : 'bg-stone-100 dark:bg-stone-800 animate-pulse'
                         ]"
                         @click="openImageViewer(image, item.images || [])">
                      <img
                        :src="getImagePath(image.filename)"
                        :alt="image.title"
                        class="w-full h-full object-cover"
                        loading="lazy"
                        @load="markImageLoaded(image.filename)"
                      >
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
                    <h3 class="text-lg font-extralight text-stone-700 dark:text-stone-300 tracking-wider">
                      {{ item.eventName || '其他作品' }}
                    </h3>
                    <p class="text-xs text-stone-400 dark:text-stone-500 mt-1 font-light tracking-wide">{{ item.images?.length || 0 }} 張作品</p>
                  </div>
                  <!-- 重用 GalleryMasonryLayout：flex 行式排版，圖片按比例分配寬度、同行等高、不裁切 -->
                  <GalleryMasonryLayout
                    :items="item.images || []"
                    @image-click="(img, imgs) => openImageViewer(img, imgs)"
                  />
                </div>
              </GalleryTimelineItem>
            </div>
          </div>
        </div>
      </div>
      </transition>
    </div>

    <!-- Footer — 根據分類變化 -->
    <div class="container mx-auto px-6 py-20 lg:py-28 text-center relative overflow-hidden">
      <div class="deco-line-h w-40 top-0 left-1/2 -translate-x-1/2"/>

      <!-- 背景漢字裝飾 -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span class="font-jp text-[10rem] sm:text-[14rem] font-thin leading-none text-stone-100/80 dark:text-stone-800/40">
          {{ currentCategory === 'digital' ? '繪' : currentCategory === 'photography' ? '影' : '創' }}
        </span>
      </div>

      <div class="relative">
        <!-- 上方裝飾 -->
        <div class="flex items-center justify-center gap-3 mb-6">
          <div class="h-px w-12 bg-gradient-to-r from-transparent to-accent-300/40 dark:to-accent-600/30"/>
          <div class="w-1 h-1 rounded-full bg-accent-400/50"/>
          <div class="h-px w-12 bg-gradient-to-l from-transparent to-accent-300/40 dark:to-accent-600/30"/>
        </div>

        <div class="font-jp text-2xl md:text-3xl font-thin text-stone-300 dark:text-stone-600 tracking-wider">{{ footerQuote }}</div>
        <div class="text-xs text-accent-400/50 dark:text-accent-500/35 mt-3 font-light tracking-[0.4em]">{{ footerSub }}</div>
      </div>
    </div>

    <!-- 圖片檢視器 -->
    <ImageViewer />

    <!-- 回到地圖：桌機右側膠囊按鈕 -->
    <button
      v-if="showBackToMap && currentCategory === 'photography'"
      class="hidden md:flex fixed right-[10%] top-1/2 -translate-y-1/2 px-3 py-1.5 text-[0.7rem] tracking-[0.3em] rounded-full bg-white/90 border border-stone-200 text-stone-500 hover:text-accent-600 hover:border-accent-300 shadow-japanese transition-all"
      type="button"
      @click="scrollToMap"
    >
      MAP
    </button>

    <!-- 回到地圖：手機右下圓形按鈕 -->
    <button
      v-if="showBackToMap && currentCategory === 'photography'"
      class="md:hidden fixed bottom-20 right-5 w-10 h-10 rounded-full bg-white/95 border border-stone-200 text-[0.7rem] tracking-[0.2em] text-stone-500 shadow-japanese flex items-center justify-center active:scale-95 transition-all"
      type="button"
      @click="scrollToMap"
    >
      MAP
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, computed, ref, type ComponentPublicInstance } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '~/stores/gallery'
import type { GalleryItem } from '~/types/gallery'
import { useImageViewerStore } from '~/stores/imageViewer'
import { useGlobalToast } from '~/composables/useToast'

// ===== 組件引入 =====
import GalleryTabBar from '~/components/GalleryTabBar.vue'
import EventFilter from '~/components/EventFilter.vue'
import GalleryTimelineItem from '~/components/GalleryTimelineItem.vue'
import EventMap from '~/components/EventMap.vue'
import ImageViewer from '~/components/ImageViewer.vue'

// ===== Store 和 Composables =====
const galleryStore = useGalleryStore()
const {
  mixedPhotoItems,
  eventLocations,
  isLoading,
  digitalError,
  photographyError,
  filterState,
  digitalWorks,
  currentWorks,
} = storeToRefs(galleryStore)

const {
  loadAllWorks
} = galleryStore

const imageViewerStore = useImageViewerStore()
const toast = useGlobalToast()
const { getImagePath } = useImagePath()
const pageRef = ref<HTMLElement | null>(null)
const mapSectionRef = ref<HTMLElement | null>(null)
const showBackToMap = ref(false)

// 攝影作品載入狀態（用於優雅的 loading 效果）
const loadedPhotographyImages = ref<Record<string, boolean>>({})

const markImageLoaded = (filename: string) => {
  loadedPhotographyImages.value[filename] = true
}

const isImageLoaded = (filename: string) => {
  return !!loadedPhotographyImages.value[filename]
}
// ===== 計算屬性 =====
// 當前選擇的類別
const currentCategory = computed(() => filterState.value.selectedCategory)

// Gallery header dynamic info
const categoryLabel = computed(() => {
  const labels: Record<string, string> = { digital: 'Digital Art', photography: 'Photography', all: 'All Works' }
  return labels[currentCategory.value] || 'All Works'
})
const categoryCount = computed(() => {
  if (currentCategory.value === 'digital') return digitalArtItems.value.length
  if (currentCategory.value === 'photography') {
    return photographyEventItems.value.reduce((sum, g) => sum + (g.images?.length || 0), 0)
  }
  return mixedPhotoItems.value.reduce((sum, g) => sum + (g.images?.length || 0), 0)
})

// Footer quotes by category
const footerQuotes: Record<string, { quote: string; sub: string }> = {
  digital:     { quote: '每一筆都是故事', sub: 'every stroke tells a story' },
  photography: { quote: '光影之間，皆是詩', sub: 'poetry between light and shadow' },
  all:         { quote: '創作不止，記錄不息', sub: 'create, capture, repeat' },
}
const footerQuote = computed(() => footerQuotes[currentCategory.value]?.quote || footerQuotes.all.quote)
const footerSub = computed(() => footerQuotes[currentCategory.value]?.sub || footerQuotes.all.sub)

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

// 地圖點擊 → 導覽到下方事件區塊
const eventRefs = ref<Record<string, HTMLElement | null>>({})
const focusedEventName = ref<string | null>(null)
let focusTimer: number | null = null

const setEventRef = (name: string | null, el: Element | ComponentPublicInstance | null) => {
  if (!name || !el) return
  const target = ('$el' in el ? (el.$el as HTMLElement) : (el as HTMLElement))
  eventRefs.value[name] = target
}

const handleFocusEvent = (eventName: string) => {
  const target = eventRefs.value[eventName]
  if (!target) return

  const offset = 96
  const top = target.getBoundingClientRect().top + window.scrollY - offset

  window.scrollTo({
    top,
    behavior: 'smooth'
  })

   focusedEventName.value = eventName
   if (focusTimer !== null) {
     window.clearTimeout(focusTimer)
   }
   focusTimer = window.setTimeout(() => {
     focusedEventName.value = null
   }, 900)
}

const handleScroll = () => {
  if (!mapSectionRef.value) return
  const mapBottom = mapSectionRef.value.getBoundingClientRect().bottom
  const threshold = 80
  showBackToMap.value = mapBottom < threshold
}

const scrollToMap = () => {
  if (!mapSectionRef.value) return
  const offset = 80
  const top = mapSectionRef.value.getBoundingClientRect().top + window.scrollY - offset

  window.scrollTo({
    top,
    behavior: 'smooth'
  })
}

// 收集所有無分類的圖片（保留供未來擴展用）
const _ungroupedImages = computed(() => {
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
    await loadAllWorks()
  } catch (error) {
    console.error('Failed to load works:', error)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', handleScroll)
  }
})

// ===== SEO =====
useSeoMeta({
  title: 'Works - 作品集',
  description: '數位藝術與攝影作品集，包含數位插畫與攝影紀錄。',
  ogTitle: 'Works - 數位藝術與攝影作品集',
  ogDescription: '瀏覽 Young 的數位插畫與攝影作品，以事件與時間軸呈現創作與生活紀錄。',
  ogType: 'website',
  ogUrl: 'https://nctuyoung.github.io/young-portfolio/gallery',
  ogImage: 'https://nctuyoung.github.io/young-portfolio/images/photography/2024新北耶誕城/DSC_4319-NEF_DxO_DeepPRIMEXD-1.jpg',
  twitterCard: 'summary_large_image'
})
</script>

<style scoped>
/* ===== Category 切換過場 ===== */
.gallery-fade-enter-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.gallery-fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.gallery-fade-enter-from { opacity: 0; transform: translateY(12px); }
.gallery-fade-leave-to   { opacity: 0; transform: translateY(-8px); }

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

/* 按鈕懸停效果（僅標記了 .btn-float 的按鈕會上浮） */
.btn-float:hover {
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