<template>
  <div ref="pageRef" class="min-h-screen transition-colors duration-300">
    <!-- Header — 個性化設計 -->
    <div class="container mx-auto px-4 py-8 sm:px-6 md:py-20 relative">
      <!-- 右側縦書き裝飾字（配 hairline 收尾，不再孤立色點） -->
      <div class="absolute top-10 right-[6%] hidden lg:flex flex-col items-center gap-4 select-none pointer-events-none">
        <span class="jp-hairline-v h-16"/>
        <span class="jp-vertical-caption text-stone-400/60 dark:text-stone-600/60">記録と創作</span>
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
    <div class="container mx-auto px-4 sm:px-6 relative">
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
        class="mb-16 max-w-7xl mx-auto scroll-mt-24"
      >
        <p class="jp-section-label mb-3">Visited Places</p>
        <EventMap
          :events="eventLocations"
          :selected-event-name="filterState.selectedEvent"
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
    <div class="container mx-auto px-4 py-16 sm:px-6 sm:py-20 lg:py-28 text-center relative overflow-hidden">
      <div class="deco-line-h absolute left-1/2 top-0 w-40 -translate-x-1/2"/>

      <!-- 背景漢字裝飾 -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span class="font-jp text-[10rem] sm:text-[14rem] font-thin leading-none text-stone-100/80 dark:text-stone-800/40">
          {{ currentCategory === 'digital' ? '繪' : currentCategory === 'photography' ? '影' : '創' }}
        </span>
      </div>

      <div class="relative">
        <!-- 上方裝飾：hairline + 墨點 -->
        <div class="flex items-center justify-center gap-3 mb-6">
          <div class="h-px w-12 bg-gradient-to-r from-transparent to-stone-300/60 dark:to-stone-600/40"/>
          <span class="jp-sumi-dot opacity-70"/>
          <div class="h-px w-12 bg-gradient-to-l from-transparent to-stone-300/60 dark:to-stone-600/40"/>
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
      class="md:hidden fixed z-[1005] flex h-11 w-11 touch-manipulation items-center justify-center rounded-full border border-stone-200 bg-white/95 text-[0.65rem] tracking-[0.2em] text-stone-500 shadow-japanese transition-all active:scale-95 right-[max(1rem,env(safe-area-inset-right))] bottom-[calc(5rem+env(safe-area-inset-bottom))]"
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
import { SEO_CONFIG } from '~~/shared/config/constants'
import {
  resolveGalleryShareMeta,
  parseGalleryImageIdFromRoute,
  parseGalleryEventFromRoute,
  absoluteUrlFromSitePath
} from '~/utils/gallerySeo'
import type { GalleryItem, FilterState } from '~~/shared/types/gallery'
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
  if (typeof window !== 'undefined') {
    if (typeof target.checkVisibility === 'function') {
      if (!target.checkVisibility()) return
    } else if (target.getClientRects().length === 0) {
      return
    }
  }
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

  target.scrollIntoView({ behavior: 'smooth', block: 'start' })

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

/** 地圖區是否已貼在導覽列下方；區塊高於視窗時只檢查頂緣對齊（避免矮螢幕誤判） */
const isMapComfortablyVisible = () => {
  const el = mapSectionRef.value
  if (!el) return true
  const r = el.getBoundingClientRect()
  const vh = window.innerHeight
  const navReserve = 88
  if (r.top > navReserve + 56) return false
  if (r.top < 52) return false
  if (r.height >= vh - navReserve - 24) {
    return r.top >= navReserve - 16 && r.top <= navReserve + 48
  }
  if (r.bottom > vh - 10) return false
  return true
}

const scrollToMap = () => {
  mapSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ===== 圖片檢視器方法 =====
const openImageViewer = (clickedImage: GalleryItem, images: GalleryItem[]) => {
  imageViewerStore.openImageViewer(clickedImage, images)
}


// ===== 監聽器 =====
/** 篩選某一事件時：地圖 flyTo（EventMap）；僅在需要時捲到「整塊地圖區」對齊視窗上方，避免半張地圖＋半張作品 */
watch(
  () => filterState.value.selectedEvent,
  async (name) => {
    if (currentCategory.value !== 'photography' || !name) return
    await nextTick()
    await nextTick()

    if (focusTimer !== null) {
      window.clearTimeout(focusTimer)
      focusTimer = null
    }
    focusedEventName.value = name
    focusTimer = window.setTimeout(() => {
      focusedEventName.value = null
      focusTimer = null
    }, 1200)

    if (!isMapComfortablyVisible()) {
      scrollToMap()
    }
  }
)

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
/* 僅保留頁面內過場與響應式 h1 調整；共用樣式（shadow-japanese、backdrop-blur-japanese、scrollbar 等）已遷入 assets/css/main.css */
.gallery-fade-enter-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.gallery-fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.gallery-fade-enter-from { opacity: 0; transform: translateY(12px); }
.gallery-fade-leave-to   { opacity: 0; transform: translateY(-8px); }

@media (max-width: 768px) {
  h1 {
    font-size: 2rem !important;
    line-height: 1.2;
  }
}

@media (max-width: 480px) {
  h1 {
    font-size: 1.75rem !important;
  }
}
</style>
