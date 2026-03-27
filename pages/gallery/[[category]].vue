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
      <div v-if="isGalleryLoading" class="text-center py-28">
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
        class="mb-16 max-w-7xl mx-auto"
      >
        <p class="jp-section-label mb-3">Visited Places</p>
        <EventMap
          :events="eventLocations"
          @focus-event="handleFocusEvent"
        />
      </section>

      <!-- 根據當前類別顯示不同佈局（帶切換動畫） -->
      <transition name="gallery-fade" mode="out-in">
      <div v-if="!isGalleryLoading" :key="currentCategory">
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
          <GalleryPhotographySection
            :items="photographyEventItems"
            :focused-event-name="focusedEventName"
            :register-event-ref="setEventRef"
          />
        </div>

        <!-- 全部作品 - 混合佈局 -->
        <div v-else>
          <GalleryAllMixedSection :items="mixedPhotoItems" />
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
      class="hidden md:flex fixed right-[10%] top-1/2 z-[1005] -translate-y-1/2 px-3 py-1.5 text-[0.7rem] tracking-[0.3em] rounded-full bg-white/90 border border-stone-200 text-stone-500 hover:text-accent-600 hover:border-accent-300 shadow-japanese transition-all"
      type="button"
      @click="scrollToMap"
    >
      MAP
    </button>

    <!-- 回到地圖：手機右下圓形按鈕 -->
    <button
      v-if="showBackToMap && currentCategory === 'photography'"
      class="md:hidden fixed bottom-20 right-5 z-[1005] w-10 h-10 rounded-full bg-white/95 border border-stone-200 text-[0.7rem] tracking-[0.2em] text-stone-500 shadow-japanese flex items-center justify-center active:scale-95 transition-all"
      type="button"
      @click="scrollToMap"
    >
      MAP
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, computed, ref, nextTick, type ComponentPublicInstance } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '~/stores/gallery'
import { fetchDigitalWorks, fetchPhotographyWorks } from '~/stores/galleryLoaders'
import { SEO_CONFIG } from '~/config/constants'
import {
  resolveGalleryShareMeta,
  parseGalleryImageIdFromRoute,
  parseGalleryEventFromRoute,
  absoluteUrlFromSitePath
} from '~/utils/gallerySeo'
import type { GalleryItem, FilterState } from '~/types/gallery'
import { useImageViewerStore } from '~/stores/imageViewer'
import { useGlobalToast } from '~/composables/useToast'

// ===== 組件引入 =====
import GalleryTabBar from '~/components/GalleryTabBar.vue'
import EventFilter from '~/components/EventFilter.vue'
import GalleryMasonryLayout from '~/components/GalleryMasonryLayout.vue'
import GalleryPhotographySection from '~/components/gallery/GalleryPhotographySection.vue'
import GalleryAllMixedSection from '~/components/gallery/GalleryAllMixedSection.vue'
import EventMap from '~/components/EventMap.vue'
import ImageViewer from '~/components/ImageViewer.vue'

// ===== Store 和 Composables =====
const galleryStore = useGalleryStore()
const {
  mixedPhotoItems,
  eventLocations,
  isLoading,
  allWorks,
  digitalError,
  photographyError,
  filterState,
  digitalWorks,
  photographyWorks,
  currentWorks,
} = storeToRefs(galleryStore)

const {
  loadAllWorks,
  hydrateFromPayload,
  setSelectedEvent,
} = galleryStore

const { getImagePath, getThumbPath } = useImagePath()

const { data: galleryPayload, pending: galleryPending } = await useAsyncData('gallery-works', async () => {
  const [digital, photo] = await Promise.all([fetchDigitalWorks(), fetchPhotographyWorks()])
  return { digital, photo }
})

watch(galleryPayload, (v) => {
  if (v) hydrateFromPayload(v)
}, { immediate: true })

const isGalleryLoading = computed(() => galleryPending.value || isLoading.value)

const imageViewerStore = useImageViewerStore()
const toast = useGlobalToast()

/** Lightbox 與 `?image=` 網址同步（見 composables/useGalleryImageRoute.ts） */
useGalleryImageRoute()
useGalleryCategoryRoute()
useGalleryEventRoute()
const pageRef = ref<HTMLElement | null>(null)
const mapSectionRef = ref<HTMLElement | null>(null)
const showBackToMap = ref(false)

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
  if (!name) return
  if (!el) {
    eventRefs.value[name] = null
    return
  }
  const target = ('$el' in el ? (el.$el as HTMLElement) : (el as HTMLElement))
  eventRefs.value[name] = target
}

const handleFocusEvent = async (eventName: string) => {
  let target = eventRefs.value[eventName]

  // 若目標事件被篩選掉、不在 DOM 中，先切換到該事件再捲動
  if (!target && filterState.value.selectedEvent !== eventName) {
    setSelectedEvent(eventName)
    await nextTick()
    await nextTick() // 再等一幀，確保 ref 已設定
    target = eventRefs.value[eventName]
  }

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
  // 僅在「兩邊都空」才補抓會漏掉「只灌到數位、攝影仍為 []」的狀況（需手動重整才正常）
  try {
    if (!digitalError.value && !photographyError.value) {
      if (digitalWorks.value.length === 0 || photographyWorks.value.length === 0) {
        await loadAllWorks()
      }
    }
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

// ===== SEO（SSR：useAsyncData 先灌入作品，才能依 ?image= / ?event= 產生 OG／Twitter／JSON-LD）=====
const seoTitles: Record<FilterState['selectedCategory'], string> = {
  all: 'Works - 作品集',
  digital: 'Works - 數位繪圖',
  photography: 'Works - 攝影作品',
}

const seoDefaultDescription = '數位藝術與攝影作品集，包含數位插畫與攝影紀錄。'

const defaultOgImageAbs = absoluteUrlFromSitePath(
  SEO_CONFIG.siteUrl,
  'images/photography/2024新北耶誕城/DSC_4319-NEF_DxO_DeepPRIMEXD-1.jpg'
)

const route = useRoute()
const requestUrl = useRequestURL()

const shareUrl = computed(() => {
  if (import.meta.client) return window.location.href
  return `${requestUrl.origin}${requestUrl.pathname}${requestUrl.search}`
})

const absPathClean = (filename: string) => {
  const p = getImagePath(filename)
  return absoluteUrlFromSitePath(SEO_CONFIG.siteUrl, p.replace(/^\//, ''))
}

const absThumb800Clean = (filename: string) => {
  const p = getThumbPath(filename, 800)
  return absoluteUrlFromSitePath(SEO_CONFIG.siteUrl, p.replace(/^\//, ''))
}

const gallerySeoResolved = computed(() =>
  resolveGalleryShareMeta({
    category: currentCategory.value,
    categoryTitle: seoTitles[currentCategory.value] || seoTitles.all,
    imageId: parseGalleryImageIdFromRoute(route.query as Record<string, unknown>),
    eventName: parseGalleryEventFromRoute(route.query as Record<string, unknown>),
    allWorks: allWorks.value,
    absPath: absPathClean,
    absThumb800: absThumb800Clean,
    defaultOgImageAbs,
    defaultTitle: seoTitles[currentCategory.value] || seoTitles.all,
    defaultDescription: seoDefaultDescription
  })
)

useSeoMeta({
  title: computed(() => gallerySeoResolved.value.title),
  description: computed(() => gallerySeoResolved.value.description),
  ogTitle: computed(() => gallerySeoResolved.value.title),
  ogDescription: computed(() => gallerySeoResolved.value.description),
  ogType: 'website',
  ogUrl: shareUrl,
  ogImage: computed(() => gallerySeoResolved.value.ogImage),
  ogImageAlt: computed(() => gallerySeoResolved.value.ogImageAlt),
  twitterCard: 'summary_large_image',
  twitterImage: computed(() => gallerySeoResolved.value.ogImage)
})

useHead({
  script: computed(() => {
    const ld = gallerySeoResolved.value.jsonLd
    if (!ld) return []
    return [{ type: 'application/ld+json', innerHTML: JSON.stringify(ld) }]
  })
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
