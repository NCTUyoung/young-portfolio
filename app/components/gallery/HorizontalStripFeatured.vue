<template>
  <section
    v-if="stripItems.length > 0"
    class="hidden md:block relative mt-6 mb-12 lg:mt-8 lg:mb-16"
    aria-labelledby="featured-strip-heading"
  >
    <!-- Strip 容器（相對定位，承載側欄標題 + 漸層遮罩） -->
    <div class="relative">
      <!--
        側欄標題（縦書き「精選」書腰）
        - 絕對定位覆蓋在 scroller 上方，讓右側 scroller 維持全寬溢出
        - z-20 高於左漸層遮罩（z-10），避免被遮住
        - 不透明 bg 讓水平滾動的圖片自然從側欄背後滑過（書頁掠過書腰效果）
      -->
      <div
        class="pointer-events-none absolute left-0 top-0 bottom-0 z-20 hidden md:flex flex-col items-center justify-between py-3 w-[120px] lg:w-[140px] bg-stone-50/70 dark:bg-stone-900/70 backdrop-blur-md"
        :style="{ height: stripHeight }"
        aria-hidden="true"
      >
        <p class="jp-section-label pl-4 self-start" style="writing-mode: horizontal-tb;">
          Featured Series
        </p>
        <div class="flex-1 flex flex-col items-center justify-center gap-4 min-h-0">
          <h2
            id="featured-strip-heading"
            class="writing-vertical font-jp text-xl lg:text-2xl font-extralight tracking-[0.5em] text-stone-800 dark:text-stone-100"
          >
            精選
          </h2>
          <div class="jp-hairline-v h-16 lg:h-20" />
          <p class="writing-vertical font-jp text-[0.6rem] tracking-[0.4em] uppercase text-stone-400 dark:text-stone-500">
            Horizontal Cut
          </p>
        </div>
        <p class="text-[0.6rem] tracking-[0.35em] text-stone-400 dark:text-stone-500 uppercase flex flex-col items-center gap-1">
          <span>scroll</span>
          <span aria-hidden="true">→</span>
        </p>
      </div>

      <!--
        左漸層：擴寬覆蓋側欄 + 過渡區
        - 原本 w-20 (80px)；現在覆蓋側欄(~140px) + 過渡(~60px) = w-[200px]
        - 側欄之後、圖片滑入的區間有柔和漸淡過渡
      -->
      <div
        class="pointer-events-none absolute left-0 top-0 bottom-0 w-[180px] lg:w-[200px] z-10 bg-gradient-to-r from-stone-50 via-stone-50/80 dark:from-stone-900 dark:via-stone-900/80 to-transparent transition-opacity duration-300"
        :class="showLeftMask ? 'opacity-100' : 'opacity-0'"
        aria-hidden="true"
      />
      <!-- 右漸層 -->
      <div
        class="pointer-events-none absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-stone-50 via-stone-50/80 dark:from-stone-900 dark:via-stone-900/80 to-transparent transition-opacity duration-300"
        :class="showRightMask ? 'opacity-100' : 'opacity-0'"
        aria-hidden="true"
      />

      <div
        ref="scrollerRef"
        class="horizontal-strip overflow-x-auto overflow-y-hidden"
        role="region"
        aria-label="精選系列水平瀏覽，可用 Tab 與方向鍵導覽"
        tabindex="0"
        @scroll.passive="onScroll"
        @keydown="onKeydown"
      >
        <!--
          左 padding 從 px-6/sm:px-10 改為 pl-[140px]/lg:pl-[160px] + pr-6/sm:pr-10
          確保第一張圖初始位置不被側欄覆蓋（+ 20px 呼吸）
        -->
        <div
          class="inline-flex items-stretch gap-3 pl-[140px] lg:pl-[160px] pr-6 sm:pr-10 py-2"
          :style="{ height: stripHeight }"
        >
          <button
            v-for="(img, idx) in stripItems"
            :key="img.filename"
            :ref="el => setImageEl(img.filename, el as HTMLElement | null)"
            type="button"
            class="group relative shrink-0 overflow-hidden bg-stone-100 dark:bg-stone-800 transition-[filter,transform] duration-500 hover:brightness-[1.03] hover:scale-[1.005] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50 dark:focus-visible:ring-offset-stone-900"
            :style="buttonStyle(img.filename)"
            :aria-label="buildAriaLabel(img, idx)"
            :tabindex="idx === focusedIndex ? 0 : -1"
            @click="handleClick(img)"
            @focus="focusedIndex = idx"
          >
            <picture class="contents">
              <source
                :srcset="getGridAvifSrcset(img.filename)"
                :sizes="HORIZONTAL_STRIP_SIZES"
                type="image/avif"
              >
              <source
                :srcset="getGridImageSrcset(img.filename)"
                :sizes="HORIZONTAL_STRIP_SIZES"
                type="image/webp"
              >
              <img
                :src="getThumbPath(img.filename, 800)"
                :srcset="getGridImageSrcset(img.filename)"
                :sizes="HORIZONTAL_STRIP_SIZES"
                :alt="img.title || img.event?.name || 'Featured work'"
                :data-filename="img.filename"
                class="h-full w-auto object-cover align-top select-none"
                :loading="idx < 2 ? 'eager' : 'lazy'"
                :fetchpriority="idx === 0 ? 'high' : 'auto'"
                decoding="async"
                draggable="false"
                @load="onImgLoad(img.filename, $event)"
              >
            </picture>

            <!-- 墨色和紙 hover overlay：與 GalleryPhotographySection 同風格，保一致感 -->
            <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none flex flex-col justify-end p-4">
              <p class="text-stone-100 text-sm font-jp tracking-[0.15em] font-light truncate">
                {{ img.event?.name || img.title || '—' }}
              </p>
              <p
                v-if="img.event?.location"
                class="text-stone-300 text-[0.65rem] tracking-[0.3em] uppercase mt-1 truncate"
              >
                {{ img.event.location }}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
    <!--
      [2026-04-20] 撤除原本底部「橫卷」hairline 裝飾條
      理由：左側 side caption 已經承擔「這是橫卷」的語義標記；
            保留底部條 = double-signaling，觸 design-aesthetic §1 簡素「能不能拿掉？」
      來源：inspirations/strip-side-caption.md

      [2026-04-20 v2] 改接入「日本編輯式封面」之底部資訊帶（editorial caption band）
      - 取代被撤的 hairline 裝飾條：承擔「出版式落點」而非「再一條墨印」
      - 嚴守「側欄強 + 底帶弱」分級（critic-agent 守門條件）
      - text-[0.6rem] tracking-[0.5em] stone-500 + pointer-events-none
      - 動態張數（featured count）讓資訊帶有實質承載，避免成為裝飾字串
      - showCaptionBand 預設 true；gallery/photography 與首頁皆顯示（user 選項 both）
      - 來源：concepts/japanese-editorial-cover.md 候補機制 2；案例 A 底部 credits 帶
    -->
    <p
      v-if="showCaptionBand"
      class="pointer-events-none select-none mt-5 lg:mt-6 text-center text-[0.6rem] tracking-[0.5em] uppercase text-stone-500 dark:text-stone-500 font-light"
      aria-hidden="true"
    >
      Featured · {{ captionCount }} Frames · 二〇二六
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import type { GalleryItem } from '~~/shared/types/gallery'
import { useGalleryStore } from '~/stores/gallery'
import { useImageViewerStore } from '~/stores/imageViewer'
import { useImagePath } from '~/composables/useImagePath'
import { useHorizontalStripRestore } from '~/composables/useHorizontalStripRestore'
import { HORIZONTAL_STRIP_SIZES } from '~/utils/imagePaths'

/**
 * Horizontal Featured Strip
 *
 * 資料來源：`photographyList.json` 中 `series` 欄位包含 `'featured'` 的作品。
 *   - Schema 定義見 `shared/types/gallery.ts` GalleryItem.series
 *   - 白名單見 `shared/config/constants.ts` SERIES_TAGS
 *   - Admin 可於 ImageEditDialog 勾選「加入精選水平軸」
 *   - Lint 由 `scripts/lint-gallery-data.mjs` 檢查名稱合法
 *
 * 排序：維持 `photographyList.json` Img 陣列的自然順序（即後台看到的順序），
 * 讓策展者可手動控制 strip 內排序。
 *
 * 桌機獨享（`hidden md:block`）— 手機不渲染，避開：
 *   1. 手機水平滑動 vs. 瀏覽器「返回手勢」衝突
 *   2. 手機上 ~4-8 張橫卷相當於半個螢幕高，視覺收不到「一覽」意圖
 *   3. 使用者 Q3(a) 決策：手機完全不顯示
 */

/**
 * linkMode：
 *   - `viewer`（預設）：點擊打開當頁 ImageViewer（scope 為同 event 的兄弟張）；
 *     用於 gallery/photography 頁面，本元件同頁面還有 ImageViewer 與 timeline。
 *   - `navigate`：點擊導向 `/gallery/photography?image=<id>`，讓 gallery 頁接手 viewer；
 *     用於首頁——首頁不掛 ImageViewer，避免多一層 overlay 狀態橫跨頁面。
 */
interface Props {
  linkMode?: 'viewer' | 'navigate'
  /**
   * 是否顯示底部編輯式資訊帶（`Featured · NN Frames · 二〇二六`）
   *
   * 來源：concepts/japanese-editorial-cover.md 候補機制 2（底部超細字資訊帶）
   * 決策：2026-04-20 v2 首頁改造 user 選 "both"——首頁與 gallery/photography 皆顯示
   * 守門：與左側書腰形成「強側欄 + 弱底帶」分級；若日後發現「上下夾 strip」感，
   *       可在單一頁面設 false 關閉，不需動本元件結構
   */
  showCaptionBand?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  linkMode: 'viewer',
  showCaptionBand: true
})

const TARGET_SERIES = 'featured' as const

const galleryStore = useGalleryStore()
const { photographyWorks } = storeToRefs(galleryStore)
const imageViewerStore = useImageViewerStore()
const { getThumbPath, getGridImageSrcset, getGridAvifSrcset } = useImagePath()
const { registerImage } = useHorizontalStripRestore()
const router = useRouter()

/** 從 store 過濾出掛了 `featured` series 的作品，順序依 JSON 自然序 */
const stripItems = computed<GalleryItem[]>(() => {
  if (!photographyWorks.value.length) return []
  return photographyWorks.value.filter(w => Array.isArray(w.series) && w.series.includes(TARGET_SERIES))
})

/**
 * 底部資訊帶用的張數（zero-padded 至少 2 位；99 張以下呈現自然）
 * 動態承載：避免變純裝飾字串，呼應 concept 頁「資訊帶 ≠ 第二條裝飾線」要求
 */
const captionCount = computed(() => stripItems.value.length.toString().padStart(2, '0'))

/** 固定高度：
 *  - 不用 dvh：iOS Safari URL bar 出現/消失會讓圖片「跳一下」，水平軸上特別明顯
 *  - 使用 vh：雖然 iOS 上 100vh > 可視區，但我們給 62vh + max 720 + min 360，
 *    實際視覺偏差 < 40px，桌機更是 0 偏差（URL bar 行為僅在行動瀏覽器）
 *  - 桌機獨享本元件，故 vh 在這裡完全安全
 */
const STRIP_VH = 62
const stripHeight = computed(() => `clamp(360px, ${STRIP_VH}vh, 720px)`)

// ===== Aspect ratio 量測（與 GalleryPhotographySection 相同技法） =====
const aspectRatios = ref<Record<string, number>>({})

function onImgLoad (filename: string, ev: Event) {
  const el = ev.target as HTMLImageElement
  if (el.naturalWidth > 0 && el.naturalHeight > 0) {
    const ratio = el.naturalWidth / el.naturalHeight
    const prev = aspectRatios.value[filename]
    if (prev === undefined || Math.abs(prev - ratio) > 1e-5) {
      aspectRatios.value = { ...aspectRatios.value, [filename]: ratio }
    }
  }
}

/** 用 aspect-ratio CSS 讓寬度隨圖比例 scale（固定高度 → 寬度自動） */
function buttonStyle (filename: string) {
  const ratio = aspectRatios.value[filename]
  return {
    aspectRatio: ratio ? String(ratio) : '3 / 2',
    height: '100%'
  }
}

// ===== Element refs（給 useHorizontalStripRestore） =====
function setImageEl (filename: string, el: HTMLElement | null) {
  registerImage(filename, el)
}

// ===== Scroller 與漸層遮罩邏輯 =====
const scrollerRef = ref<HTMLElement | null>(null)
const showLeftMask = ref(false)
const showRightMask = ref(true)
const focusedIndex = ref(0)

function updateMasks () {
  const el = scrollerRef.value
  if (!el) return
  const { scrollLeft, scrollWidth, clientWidth } = el
  showLeftMask.value = scrollLeft > 4
  showRightMask.value = scrollLeft + clientWidth < scrollWidth - 4
}

function onScroll () {
  updateMasks()
}

/**
 * Wheel 事件轉換：deltaY → scrollLeft
 *
 * 為什麼需要：
 *   - Trackpad 使用者：原生支援兩指水平滑動（deltaX），不需處理
 *   - 滑鼠滾輪使用者：只有 deltaY，若不攔截則只能拖 scrollbar（macOS 還隱藏）
 *
 * 實作細節：
 *   - 用 `{ passive: false }` 綁在 onMounted：Vue 的 `@wheel` 在某些瀏覽器預設 passive，
 *     無法 `preventDefault`，會導致「滾 strip 時頁面也往下滾」的重影
 *   - 僅當 `|deltaY| > |deltaX| * 1.5` 時判定為「垂直意圖」才轉換，避免干擾水平 trackpad
 *   - 若 strip 已滾到兩端且 deltaY 方向是繼續往該端，**不攔截**（不 preventDefault）
 *     讓頁面自然銜接垂直滾動（避免鎖死在 strip 裡）
 *   - 被攔截成水平滾動時：`preventDefault()` + `scrollBy({ behavior: 'auto' })` 即時感
 */
function handleWheel (ev: WheelEvent) {
  const el = scrollerRef.value
  if (!el) return
  const { deltaX, deltaY } = ev
  const absY = Math.abs(deltaY)
  const absX = Math.abs(deltaX)
  // 水平 trackpad 事件：放行由瀏覽器原生處理
  if (absY <= absX * 1.5) return

  const { scrollLeft, scrollWidth, clientWidth } = el
  const atLeftEnd = scrollLeft <= 0 && deltaY < 0
  const atRightEnd = scrollLeft + clientWidth >= scrollWidth - 1 && deltaY > 0
  // 抵達兩端且方向繼續往外：放行讓頁面垂直滾動
  if (atLeftEnd || atRightEnd) return

  ev.preventDefault()
  el.scrollBy({ left: deltaY, behavior: 'auto' })
}

// ===== Keyboard 導覽（roving tabindex） =====
function onKeydown (ev: KeyboardEvent) {
  const n = stripItems.value.length
  if (n === 0) return
  let next = focusedIndex.value
  switch (ev.key) {
    case 'ArrowRight':
      next = Math.min(n - 1, focusedIndex.value + 1)
      break
    case 'ArrowLeft':
      next = Math.max(0, focusedIndex.value - 1)
      break
    case 'Home':
      next = 0
      break
    case 'End':
      next = n - 1
      break
    default:
      return
  }
  ev.preventDefault()
  focusedIndex.value = next
  const scroller = scrollerRef.value
  if (!scroller) return
  const buttons = scroller.querySelectorAll<HTMLButtonElement>('button')
  const btn = buttons[next]
  if (btn) {
    btn.focus()
    // 關鍵：`block: 'nearest'` 不可省！否則垂直軸也被拉，頁面會亂跳
    btn.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }
}

// ===== 點擊：依 linkMode 分岔 =====
/**
 * viewer 模式：打開同頁 ImageViewer，scope 為「同 event」作品
 *   目的：gallery 頁內水平瀏覽時，viewer 可左右切到同 event 其他張，
 *   避免離開策展上下文。
 *
 * navigate 模式：跳 /gallery/photography?image=<encoded>
 *   目的：首頁沒有 ImageViewer 元件也沒載入完整 photographyWorks 的 siblings，
 *   讓 gallery 頁接手 viewer 邏輯（`useGalleryImageRoute` 會依 ?image= 開 viewer）。
 *   注意：要用 encodeURIComponent，`event?.name` 裡有「/」「空白」會破壞 query。
 */
function handleClick (img: GalleryItem) {
  if (props.linkMode === 'navigate') {
    // 用 img.id（store 產的穩定 slug）而非 filename：
    // useGalleryImageRoute 用 id 配對；filename 含「/」「空白」「中文」，
    // 雖 query encode 可處理，但 `tryOpenViewerFromQuery` 以 id 匹配 allWorks，
    // 傳錯會被 `galleryDataReady` 後的 clearImageQuery 清掉。
    router.push({
      path: '/gallery/photography',
      query: { image: img.id }
    })
    return
  }
  const eventName = img.event?.name
  const siblings = eventName
    ? photographyWorks.value.filter(w => w.event?.name === eventName)
    : [img]
  imageViewerStore.openImageViewer(img, siblings)
}

function buildAriaLabel (img: GalleryItem, idx: number): string {
  const prefix = `精選第 ${idx + 1} 張`
  const title = img.title || img.event?.name || ''
  return title ? `${prefix}：${title}，點擊放大瀏覽` : `${prefix}，點擊放大瀏覽`
}

onMounted(() => {
  updateMasks()
  const el = scrollerRef.value
  if (el) {
    el.addEventListener('wheel', handleWheel, { passive: false })

    /**
     * Cache 繞過 `@load`：當 `<img>` 在 SSR 後被 hydrate，而瀏覽器已從
     * disk/memory cache 取得圖（例如使用者剛從 /gallery 回到首頁），
     * `complete` 已是 true，`@load` 不會再觸發 → `aspectRatios` 空 →
     * 全部 fallback 到 3/2 → 直幅圖被擠扁裁切。
     *
     * 解法：mount 後掃一次 scroller 裡所有 img，有 naturalWidth 就直接
     * 補填 aspectRatios。後續還沒 load 完的圖會照常觸發 `@load`。
     */
    const imgs = el.querySelectorAll<HTMLImageElement>('img[data-filename]')
    imgs.forEach((img) => {
      if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
        const filename = img.dataset.filename
        if (filename && aspectRatios.value[filename] === undefined) {
          aspectRatios.value = {
            ...aspectRatios.value,
            [filename]: img.naturalWidth / img.naturalHeight
          }
        }
      }
    })
  }
})
onBeforeUnmount(() => {
  const el = scrollerRef.value
  if (el) {
    el.removeEventListener('wheel', handleWheel)
  }
})
</script>

<style scoped>
/* 隱藏 scrollbar：macOS 預設已隱藏，Windows/Linux 用 trackpad 者大多也關了；
   真正需要的使用者用漸層遮罩 + 鍵盤 + 滾輪補足可發現性。 */
.horizontal-strip {
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-behavior: smooth;
}
.horizontal-strip::-webkit-scrollbar {
  display: none;
}

/* prefers-reduced-motion：關掉 smooth scroll，避免使用者覺得受不了慣性 */
@media (prefers-reduced-motion: reduce) {
  .horizontal-strip {
    scroll-behavior: auto;
  }
}
</style>
