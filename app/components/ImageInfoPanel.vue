<template>
  <div
v-if="showInfoPanel && currentViewerImage && imageInfo"
       class="info-panel info-panel--spread fixed inset-0 z-[60] bg-stone-950/96 backdrop-blur-md transition-all duration-300"
       @wheel.stop>

    <!-- ▌兩頁對開（desktop md+ 兩欄；mobile 單欄）— spread 物理隱喻 -->
    <div class="info-spread">

      <!-- 左頁：影像（desktop only） -->
      <div class="info-spread__leaf info-spread__leaf--image" aria-hidden="true">
        <img
          :src="getImagePath(currentViewerImage.filename)"
          :alt="imageInfo.title"
          class="info-spread__image"
          decoding="async"
          loading="eager"
        >
        <!-- 跨頁中縫朱印 -->
        <span class="info-spread__seam" aria-hidden="true"/>
        <!-- 左頁腳：縦書 event eyebrow（編輯感標頭） -->
        <p v-if="eventEyebrow" class="info-spread__leaf-eyebrow jp-kansuji" aria-hidden="true">
          {{ eventEyebrow }}
        </p>
      </div>

      <!-- 右頁：對頁文章 -->
      <div class="info-spread__leaf info-spread__leaf--article">
        <!-- 面板標題 — jp-eyebrow「對頁文章」 -->
        <div class="sticky top-0 bg-stone-950/90 backdrop-blur-md border-b border-stone-700/40 px-7 py-3.5 z-10 info-header">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="info-header__hairline" aria-hidden="true"/>
          <p class="info-header__eyebrow">對頁註 · ANNOTATION</p>
        </div>
        <button class="info-header__close" aria-label="關閉資訊面板" @click="imageViewerStore.toggleInfoPanel">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 面板內容 — editorial reading layout -->
    <div class="info-body">
      <!-- ▌Hero block: event h1 → image # 與 position 同行 small -->
      <section class="info-hero">
        <div class="info-hero__meta">
          <p class="info-eyebrow">{{ trackEyebrow }}</p>
          <h2 v-if="eventTitle" class="info-title">{{ eventTitle }}</h2>
          <p class="info-subline">
            <span class="info-subline__label">{{ imageInfo.title }}</span>
            <span v-if="positionInEvent" class="info-subline__sep" aria-hidden="true"/>
            <span v-if="positionInEvent" class="info-subline__pos jp-kansuji tabular-nums">{{ positionInEvent }}</span>
          </p>
        </div>
      </section>

      <!-- ▌Narrative paragraph — 對頁註解（R26 起 image-level note 優先） -->
      <section v-if="narrativeText" class="info-narrative">
        <span class="info-narrative__dropcap" aria-hidden="true">「</span>
        <p class="jp-body info-narrative__body">{{ narrativeText }}</p>
        <p v-if="narrativeIsImageLevel" class="info-narrative__source">
          <span class="info-narrative__source-dot" aria-hidden="true"/>単張記 · IMAGE NOTE
        </p>
        <p v-if="moodLabel" class="info-mood">
          <span class="info-mood__label">気配</span>
          <span class="info-mood__value">{{ moodLabel }}</span>
        </p>
        <div v-if="paletteSwatches.length" class="info-palette" :aria-label="`Series palette ${paletteSwatches.join(', ')}`">
          <span
            v-for="(c, i) in paletteSwatches"
            :key="`${c}-${i}`"
            class="info-palette__swatch"
            :style="{ background: c }"
          />
        </div>
      </section>

      <!-- ▌EXIF inline strip — 一行式編輯感 -->
      <section v-if="exifLine" class="info-exif">
        <p class="info-eyebrow">寫真スペック · EXIF</p>
        <p class="info-exif__line jp-kansuji">{{ exifLine }}</p>
      </section>

      <!-- ▌色彩分析 (直方圖) -->
      <section class="info-histogram">
        <p class="info-eyebrow">色相分析 · HISTOGRAM</p>
        <ImageHistogram />
      </section>

      <!-- ▌Tags as sumi-dots -->
      <section v-if="imageInfo.tags && imageInfo.tags.length > 0" class="info-tags">
        <p class="info-eyebrow">語彙 · KEYWORDS</p>
        <ul class="info-tags__list">
          <li v-for="tag in imageInfo.tags" :key="tag" class="info-tag">
            <span class="info-tag__dot" aria-hidden="true"/>{{ tag }}
          </li>
        </ul>
      </section>

      <!-- ▌Photographer note — fallback to meaningful description -->
      <section v-if="meaningfulDescription && meaningfulDescription !== narrativeText" class="info-note">
        <p class="info-eyebrow">作者覚書 · NOTE</p>
        <p class="jp-body info-note__body">{{ meaningfulDescription }}</p>
      </section>

      <!--
        ▌對軌配對 PAIRED — R49 dual-track narrative pairing
        若當前 image 設了 pairWith，顯示對軌作品 thumb + 章首詩 + 跳轉
      -->
      <section v-if="pairedImage" class="info-paired">
        <p class="info-eyebrow">對軌 · PAIRED</p>
        <NuxtLink :to="`/gallery/${pairedImage.category}?image=${encodeURIComponent(pairedImage.id)}`" class="info-paired__link">
          <div class="info-paired__thumb">
            <img :src="getThumbPath(pairedImage.filename, 400)" :alt="`對軌 — ${pairedImage.title}`" decoding="async" loading="lazy">
          </div>
          <div class="info-paired__meta">
            <p class="info-paired__kana font-jp">{{ pairedImage.category === 'digital' ? '繪' : '影' }}</p>
            <p class="info-paired__title">{{ pairedImage.title }}</p>
            <p v-if="pairedImage.event?.name" class="info-paired__event">{{ pairedImage.event.name }}</p>
            <p class="info-paired__cta">PAIRED →</p>
          </div>
        </NuxtLink>
      </section>

      <!-- ▌Footnote — 檔案/時間 — 編輯腳註 -->
      <section class="info-footnote">
        <p class="info-eyebrow">奥付 · COLOPHON</p>
        <dl class="info-footnote__list jp-kansuji">
          <div><dt>檔名</dt><dd class="font-mono truncate">{{ filenameBasename }}</dd></div>
          <div><dt>格式</dt><dd>{{ imageInfo.format }}</dd></div>
          <div><dt>尺寸</dt><dd>{{ imageInfo.dimensions }}</dd></div>
          <div><dt>日期</dt><dd>{{ currentViewerImage.date || '未知' }}</dd></div>
          <div v-if="imageInfo.model"><dt>機材</dt><dd>{{ imageInfo.model }}</dd></div>
        </dl>
      </section>
        </div>
      </div><!-- /info-spread__leaf--article -->

    </div><!-- /info-spread -->
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted, defineAsyncComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useMediaQuery } from '@vueuse/core'
import { useImageViewerStore } from '~/stores/imageViewer'
import { useGalleryStore } from '~/stores/gallery'
import { nonBoilerplateOrEmpty } from '~/utils/descriptionFilters'

// Histogram 會跑 canvas 取色 + 排序，單獨切出來避免在只看描述時也背一份
const ImageHistogram = defineAsyncComponent(() => import('./ImageHistogram.vue'))

const imageViewerStore = useImageViewerStore()
const { getThumbPath, getImagePath } = useImagePath()
const {
  showInfoPanel,
  infoPanelWidth,
  currentViewerImage
} = storeToRefs(imageViewerStore)

const isDesktopInfoLayout = useMediaQuery('(min-width: 768px)')

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- WIP: 桌機可調寬資訊面板，尚未接進 template
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- WIP: 拖拽調整面板寬度，尚未接上 resize handle
const startResize = (event: MouseEvent | TouchEvent) => {
  event.preventDefault()
  isResizing.value = true

  const clientX = 'touches' in event ? (event.touches[0]?.clientX ?? 0) : event.clientX
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
  const clientX = 'touches' in event ? (event.touches[0]?.clientX ?? 0) : event.clientX
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
      if (dateMatch && dateMatch[1] && dateMatch[2] && dateMatch[3]) {
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
    iso: image.iso,
    aperture: image.aperture,
    shutterSpeed: image.shutterSpeed,
    focalLength: image.focalLength,
    model: image.model
  }
})

const meaningfulDescription = computed(() =>
  nonBoilerplateOrEmpty(imageInfo.value?.description)
)

/**
 * Viewer 對頁註解 — R26 優先序：
 *   1. image-level `note`（單張個性化，最具體）
 *   2. series `annotation`（event-level 註，R25 引入）
 *   3. legacy `narrative`（R22 字串，向後相容）
 * 同時告知是否為 image-level，UI 可加 「単張」chip 標示。
 */
const narrativeText = computed(() => {
  const cur = currentViewerImage.value as { note?: string; seriesNarrative?: { annotation?: string; narrative?: string } } | null
  const sn = cur?.seriesNarrative
  const n = cur?.note || sn?.annotation || sn?.narrative
  return n && n.trim() ? n : null
})

const narrativeIsImageLevel = computed(() => {
  return Boolean((currentViewerImage.value as { note?: string } | null)?.note?.trim())
})

/**
 * R49：對軌配對 — 從 pairWith id 解析另一 track 的作品
 * 從 gallery store 找匹配 id 的 GalleryItem
 */
const galleryStore = useGalleryStore()
const pairedImage = computed(() => {
  const pairId = (currentViewerImage.value as { pairWith?: string } | null)?.pairWith
  if (!pairId) return null
  const all = [...galleryStore.digitalWorks, ...galleryStore.photographyWorks]
  return all.find((w) => w.id === pairId) || null
})

const moodLabel = computed(() => {
  const m = (currentViewerImage.value as { seriesNarrative?: { mood?: string } } | null)?.seriesNarrative?.mood
  return m && m.trim() ? m : null
})

const paletteSwatches = computed<string[]>(() => {
  const p = (currentViewerImage.value as { seriesNarrative?: { palette?: string[] } } | null)?.seriesNarrative?.palette
  return Array.isArray(p) ? p.slice(0, 5) : []
})

/** Event eyebrow — "<event name> · <location?>" — kept for left page label */
const eventEyebrow = computed(() => {
  const ev = (currentViewerImage.value as { event?: { name?: string, location?: string } } | null)?.event
  if (!ev?.name) return null
  return ev.location ? `${ev.name} · ${ev.location}` : ev.name
})

/** Event as h1 title — event.name alone (location moves to eyebrow) */
const eventTitle = computed(() => {
  const ev = (currentViewerImage.value as { event?: { name?: string } } | null)?.event
  return ev?.name || null
})

/** Track eyebrow — "繪 · DIGITAL TRACK" / "影 · PHOTOGRAPHY TRACK" + 地點若有 */
const trackEyebrow = computed(() => {
  const cur = currentViewerImage.value
  if (!cur) return ''
  const cat = cur.category
  const head = cat === 'photography' ? '影 · PHOTOGRAPHY' : '繪 · DIGITAL'
  const ev = (cur as { event?: { location?: string } }).event
  return ev?.location ? `${head} · ${ev.location}` : head
})

/** Filename basename — strip path, e.g. "photography/春日街拍/DSC_7030-1.jpg" → "DSC_7030-1.jpg" */
const filenameBasename = computed(() => {
  const f = currentViewerImage.value?.filename || ''
  const idx = f.lastIndexOf('/')
  return idx >= 0 ? f.slice(idx + 1) : f
})

/** Position in event — "第 03 / 12 張" (1-indexed) */
const positionInEvent = computed(() => {
  const cur = currentViewerImage.value
  if (!cur || !cur.event?.name) return null
  const all = imageViewerStore.viewerImages
  const sameEvent = all.filter((w) => w.event?.name === cur.event?.name)
  if (sameEvent.length < 2) return null
  const idx = sameEvent.findIndex((w) => w.filename === cur.filename)
  if (idx < 0) return null
  const pos = (idx + 1).toString().padStart(2, '0')
  const total = sameEvent.length.toString().padStart(2, '0')
  return `第 ${pos} ／ ${total} 張`
})

/** EXIF 單行：f/2.8 · 1/500s · ISO 100 · 119mm（缺資料就跳過） */
const exifLine = computed(() => {
  const info = imageInfo.value
  if (!info || info.category !== 'photography') return null
  const parts: string[] = []
  if (info.aperture) parts.push(`f/${info.aperture}`)
  if (info.shutterSpeed) {
    const s = info.shutterSpeed
    parts.push(s < 1 ? `1/${Math.round(1 / s)}s` : `${s}s`)
  }
  if (info.iso) parts.push(`ISO ${info.iso}`)
  if (info.focalLength) parts.push(`${info.focalLength}mm`)
  return parts.length ? parts.join('  ·  ') : null
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- WIP: 檔案大小顯示，尚未接進 template
const formattedFileSize = computed(() => {
  if (!imageInfo.value?.fileSize) return '未知'

  const size = imageInfo.value.fileSize
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- WIP: 拍攝日期格式化，尚未接進 template
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

<style scoped>
/* ===== 兩頁對開 spread layout（desktop 跨頁；mobile 單欄） ===== */
.info-panel--spread {
  display: block;
  overflow: hidden;
}
.info-spread {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  width: 100%;
  height: 100%;
}
@media (min-width: 768px) {
  .info-spread {
    grid-template-columns: minmax(0, 1.4fr) minmax(420px, 1fr);
  }
}
.info-spread__leaf {
  position: relative;
  overflow: hidden;
}
.info-spread__leaf--image {
  display: none;
  background: rgb(12 10 9 / 0.96);
  align-items: center;
  justify-content: center;
  padding: 3.5rem 2.5rem 4rem;
}
@media (min-width: 768px) {
  .info-spread__leaf--image {
    display: flex;
  }
}
.info-spread__image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 30px 60px rgb(0 0 0 / 0.6));
}
/* 中縫朱印 — 模仿書脊裝幀 */
.info-spread__seam {
  display: none;
  position: absolute;
  top: 0;
  right: 0;
  width: 1px;
  height: 100%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgb(214 211 209 / 0.18) 12%,
    rgb(214 211 209 / 0.35) 50%,
    rgb(214 211 209 / 0.18) 88%,
    transparent 100%
  );
  z-index: 2;
}
@media (min-width: 768px) {
  .info-spread__seam {
    display: block;
  }
}
/* 左頁腳 eyebrow — 縦書 event name 標頭裝飾 */
.info-spread__leaf-eyebrow {
  display: none;
  position: absolute;
  left: 1.4rem;
  top: 1.6rem;
  font-size: 0.65rem;
  letter-spacing: 0.32em;
  color: rgb(168 162 158 / 0.7);
  text-transform: uppercase;
  font-weight: 300;
  margin: 0;
  writing-mode: vertical-rl;
  text-orientation: mixed;
}
@media (min-width: 768px) {
  .info-spread__leaf-eyebrow {
    display: inline-block;
  }
}
.info-spread__leaf--article {
  overflow-y: auto;
  background: rgb(28 25 23 / 0.94);
  position: relative;
}
@media (min-width: 768px) {
  .info-spread__leaf--article {
    border-left: 0; /* seam handles separator */
  }
}

/* ===== 對頁文章 editorial layout ===== */
.info-header__hairline {
  display: inline-block;
  width: 18px;
  height: 1px;
  background: rgb(214 211 209 / 0.45);
}
.info-header__eyebrow {
  font-size: 0.62rem;
  letter-spacing: 0.34em;
  color: rgb(231 184 125 / 0.92);
  text-transform: uppercase;
  font-weight: 300;
  margin: 0;
}
.info-header__close {
  padding: 0.35rem;
  color: rgb(168 162 158);
  background: transparent;
  border: 1px solid transparent;
  transition: color 0.2s ease, border-color 0.2s ease;
}
.info-header__close:hover {
  color: rgb(250 250 249);
  border-color: rgb(214 211 209 / 0.25);
}

.info-body {
  padding: 2rem 2.2rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 560px;
}
@media (min-width: 768px) {
  .info-body {
    padding: 2.4rem 2.6rem 4rem;
    margin-right: auto;
  }
}

/* ▌Hero — event name 大字 h1，作品編號降到 subline */
.info-hero {
  display: flex;
  align-items: flex-start;
}
.info-hero__meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}
.info-subline {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  color: rgb(168 162 158 / 0.82);
}
.info-subline__sep {
  display: inline-block;
  width: 14px;
  height: 1px;
  background: rgb(214 211 209 / 0.28);
}
.info-subline__pos {
  color: rgb(214 211 209 / 0.88);
  letter-spacing: 0.18em;
}
.info-eyebrow {
  font-size: 0.6rem;
  letter-spacing: 0.32em;
  color: rgb(168 162 158 / 0.9);
  text-transform: uppercase;
  font-weight: 300;
  margin: 0;
}
.info-title {
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-weight: 300;
  font-size: 2rem;
  letter-spacing: 0.06em;
  line-height: 1.2;
  color: rgb(250 250 249);
  margin: 0;
}
@media (min-width: 768px) {
  .info-title { font-size: 2.4rem; }
}

/* ▌Narrative — 對頁文章主體 */
.info-narrative {
  position: relative;
  padding: 1rem 0 0;
  border-top: 1px solid rgb(214 211 209 / 0.12);
}
.info-narrative__dropcap {
  position: absolute;
  top: 0.55rem;
  left: -0.3rem;
  font-family: 'Noto Serif JP', serif;
  font-size: 2rem;
  line-height: 1;
  color: rgb(231 184 125 / 0.55);
  pointer-events: none;
}
.info-narrative__body {
  font-size: 0.88rem !important;
  line-height: 2 !important;
  color: rgb(231 229 228 / 0.92) !important;
  margin: 0;
  /* text-indent 移除（R26）— dropcap 已承擔首行啟筆 */
}
.info-narrative__source {
  margin: 0.7rem 0 0;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.6rem;
  letter-spacing: 0.36em;
  color: rgb(231 184 125 / 0.85);
  text-transform: uppercase;
  font-weight: 300;
}
.info-narrative__source-dot {
  width: 5px;
  height: 5px;
  background: rgb(231 184 125 / 0.85);
  border-radius: 9999px;
  display: inline-block;
}
.info-mood {
  margin: 0.85rem 0 0;
  display: flex;
  align-items: baseline;
  gap: 0.55rem;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
}
.info-mood__label {
  font-family: 'Noto Serif JP', serif;
  color: rgb(231 184 125 / 0.85);
  letter-spacing: 0.18em;
}
.info-mood__value {
  font-style: italic;
  color: rgb(168 162 158);
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.05em;
}
.info-palette {
  margin-top: 0.55rem;
  display: flex;
  gap: 6px;
}
.info-palette__swatch {
  width: 18px;
  height: 18px;
  border-radius: 0;
  border: 1px solid rgb(214 211 209 / 0.18);
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.25);
}

/* ▌EXIF inline strip */
.info-exif {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.info-exif__line {
  font-size: 0.92rem;
  letter-spacing: 0.08em;
  color: rgb(250 250 249 / 0.92);
  font-weight: 300;
  margin: 0;
  font-family: 'Inter', 'Noto Sans TC', sans-serif;
}

/* ▌Histogram */
.info-histogram {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

/* ▌Tags as sumi-dots */
.info-tags {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}
.info-tags__list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem 1rem;
  list-style: none;
  padding: 0;
  margin: 0;
}
.info-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.75rem;
  color: rgb(214 211 209 / 0.88);
  letter-spacing: 0.05em;
}
.info-tag__dot {
  width: 4px;
  height: 4px;
  border-radius: 9999px;
  background: rgb(231 184 125 / 0.85);
  display: inline-block;
}

/* ▌Photographer note */
.info-note__body {
  font-size: 0.82rem !important;
  line-height: 1.85 !important;
  color: rgb(214 211 209 / 0.75) !important;
}

/* ===== R49 對軌配對 PAIRED section ===== */
.info-paired {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}
.info-paired__link {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 0.85rem;
  text-decoration: none;
  color: inherit;
  padding: 0.55rem;
  border: 1px solid rgb(214 211 209 / 0.16);
  background: rgb(28 25 23 / 0.4);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}
.info-paired__link:hover {
  background: rgb(28 25 23 / 0.6);
  border-color: rgb(231 184 125 / 0.4);
}
.info-paired__thumb {
  width: 120px;
  height: 80px;
  overflow: hidden;
  background: rgb(28 25 23);
}
.info-paired__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.9);
  transition: filter 0.3s ease, transform 0.4s ease;
}
.info-paired__link:hover .info-paired__thumb img {
  filter: saturate(1.08);
  transform: scale(1.04);
}
.info-paired__meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}
.info-paired__kana {
  font-size: 0.92rem;
  letter-spacing: 0.18em;
  color: rgb(231 184 125 / 0.95);
  font-weight: 300;
  line-height: 1;
}
.info-paired__title {
  margin: 0;
  font-family: 'Noto Serif JP', serif;
  font-size: 0.92rem;
  color: rgb(250 250 249);
  font-weight: 300;
  letter-spacing: 0.04em;
}
.info-paired__event {
  margin: 0;
  font-size: 0.7rem;
  color: rgb(168 162 158);
  letter-spacing: 0.18em;
}
.info-paired__cta {
  margin: 0.3rem 0 0;
  font-size: 0.62rem;
  letter-spacing: 0.36em;
  color: rgb(231 184 125 / 0.9);
  text-transform: uppercase;
}

/* ▌Colophon footnote */
.info-footnote {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding-top: 1rem;
  border-top: 1px solid rgb(214 211 209 / 0.12);
}
.info-footnote__list {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.info-footnote__list > div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.72rem;
  color: rgb(168 162 158 / 0.88);
}
.info-footnote__list dt {
  flex-shrink: 0;
  color: rgb(120 113 108 / 0.85);
  letter-spacing: 0.18em;
}
.info-footnote__list dd {
  margin: 0;
  text-align: right;
  color: rgb(214 211 209 / 0.88);
  word-break: break-all;
}

@media (max-width: 767px) {
  .info-body { padding: 1.25rem 1rem 2rem; gap: 1.6rem; }
  .info-narrative__body { font-size: 0.85rem !important; }
  .info-title { font-size: 1.2rem; }
}
</style>