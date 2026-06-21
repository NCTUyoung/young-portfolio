<template>
  <!--
    g1（圖片庫策展 UX 大改 / 影暗室）：暗室「接觸印樣格」(contact-sheet grid)。

    取代 baseline 的 GalleryFilmRoll（單欄全幅、每格 1 大圖 + EXIF 側欄 ≈ 1 屏/格）。
    那個版型雖 bold，但 13 張 = 13+ 屏，是 30.5 屏病灶的主因。

    本元件保留暗室 identity（齒孔軌、frame number、冷調負片、明體），
    但把「一格一屏」改成「一捲印樣」——多欄密鋪小格，像攝影師夾在燈桌上看整捲底片。
    每格仍可點開 lightbox 看大圖 + 完整 EXIF（資訊未丟，只是移到 lightbox）。
    desktop 自動 justified 多欄（依首圖比例給 1~2 欄寬），徹底砍屏數。
    捲到逐格 develop-in（顯影），守 prefers-reduced-motion。
  -->
  <div
    ref="sheetEl"
    class="contact-sheet"
    :class="{ 'contact-sheet--loupe-on': loupe.active }"
    @pointermove="onSheetPointerMove"
    @pointerleave="onSheetPointerLeave"
  >
    <!-- 卷頭片導 leader：膠卷起始曝光標頭 -->
    <div class="contact-sheet__leader" aria-hidden="true">
      <span class="contact-sheet__leader-code">KAGE · 400</span>
      <span class="contact-sheet__leader-ticks"/>
      <span class="contact-sheet__leader-frames">{{ String(items.length).padStart(2, '0') }} FRAMES</span>
      <!--
        g+（影暗室 signature 互動）：放大鏡狀態指示。
        桌機指標型裝置才常駐「ルーペ」提示；觸控/細指標降級隱藏（見 CSS pointer:coarse）。
      -->
      <span class="contact-sheet__leader-loupe">ルーペ — 移動游標如閱讀負片</span>
    </div>

    <!--
      g+（離線比例瀑布流）：欄式 masonry（Pinterest 式錯落）。
      每格用離線預算的 aspectRatio 開 aspect-ratio box（零 CLS）；欄分配由純函式
      computeMasonryColumns 依「最矮欄」貪婪填入（比例來自資料 → server/client 一致）。
      欄數 SSR 固定 3、掛載後依容器寬調 4/3/2，避免 hydration mismatch（見 script）。
    -->
    <div ref="rootEl" class="contact-sheet__masonry">
      <ol
        v-for="(col, ci) in columns"
        :key="ci"
        class="contact-sheet__col"
      >
        <li
          v-for="cell in col"
          :key="cell.image.filename"
          :ref="el => setFrameRef(cell.i, el)"
          class="contact-sheet__cell"
          :data-frame="cell.i"
          :style="{ aspectRatio: aspectOf(cell.image) }"
          :class="{ 'contact-sheet__cell--developed': developed[cell.i], 'contact-sheet__cell--under-loupe': loupe.active && loupe.index === cell.i }"
        >
          <span class="contact-sheet__sprockets" aria-hidden="true"/>
          <span class="contact-sheet__no" aria-hidden="true">{{ frameNo(cell.i) }}</span>
          <button
            type="button"
            class="contact-sheet__btn group"
            :aria-label="cell.image.title || '攝影作品'"
            @click="$emit('imageClick', cell.image)"
          >
            <picture class="contents">
              <source :srcset="getGridAvifSrcset(cell.image.filename)" :sizes="cellSizes" type="image/avif">
              <source :srcset="getGridImageSrcset(cell.image.filename)" :sizes="cellSizes" type="image/webp">
              <img
                :src="getThumbPath(cell.image.filename, 400)"
                :srcset="getGridImageSrcset(cell.image.filename)"
                :sizes="cellSizes"
                :alt="cell.image.title"
                class="contact-sheet__img"
                :loading="cell.i < 4 ? 'eager' : 'lazy'"
                decoding="async"
              >
            </picture>
            <!-- hover 浮出最小標籤（標題 + 焦段/光圈），避免常駐占高度 -->
            <span class="contact-sheet__cap">
              <span class="contact-sheet__cap-title font-jp">{{ cell.image.title || '未命名' }}</span>
              <span v-if="exifLine(cell.image)" class="contact-sheet__cap-exif">{{ exifLine(cell.image) }}</span>
            </span>
          </button>
        </li>
      </ol>
    </div>

    <!--
      g+（影暗室 signature 互動）：游標放大鏡 (loupe / ルーペ)。
      像攝影師把放大鏡壓在燈桌上的接觸印樣，逐格細看負片。
      鏡片內以 background-image 把該格 800w 縮圖放大並依游標相對位置位移＝真實放大；
      鏡緣冷銀 + 安全燈紅 focus 環，鏡下方浮現 frame no + EXIF（如讀負片邊框註記）。
      純 pointer 驅動（hover/move），無 timer/autoplay；
      觸控 / coarse pointer 自動降級為點擊開圖（見 CSS @media (pointer: coarse)）。
      prefers-reduced-motion 下取消位移平滑與顯影過場（見 CSS）。
    -->
    <div
      v-show="loupe.active"
      ref="loupeEl"
      class="contact-sheet__loupe"
      aria-hidden="true"
    >
      <div class="contact-sheet__loupe-glass" :style="loupeGlassStyle"/>
      <div v-if="loupe.exif" class="contact-sheet__loupe-readout">
        <span class="contact-sheet__loupe-no">{{ loupe.frame }}</span>
        <span class="contact-sheet__loupe-exif">{{ loupe.exif }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useImagePath } from '~/composables/useImagePath'
import { formatShutterSpeed } from '~/utils/formatters'
import { computeMasonryColumns } from '~/utils/masonryColumns'
import { DEFAULT_ASPECT_RATIO } from '~/utils/justifiedGalleryLayout'
import type { GalleryItem } from '~~/shared/types/gallery'

const props = defineProps<{ items: GalleryItem[] }>()
defineEmits<{ imageClick: [item: GalleryItem] }>()

const { getThumbPath, getGridImageSrcset, getGridAvifSrcset } = useImagePath()

const cellSizes = '(max-width: 639px) 47vw, (max-width: 1023px) 31vw, 23vw'

/* =========================================================
   離線比例瀑布流（masonry）
   比例 resolver 優先吃離線預算的 image.aspectRatio，缺才退 DEFAULT_ASPECT_RATIO（避免破版）。
   ========================================================= */
const ratioByFn = computed(() => {
  const m = new Map<string, number>()
  for (const it of props.items) {
    m.set(it.filename, it.aspectRatio && it.aspectRatio > 0 ? it.aspectRatio : DEFAULT_ASPECT_RATIO)
  }
  return m
})
function ratioOf (fn: string): number { return ratioByFn.value.get(fn) ?? DEFAULT_ASPECT_RATIO }
function aspectOf (img: GalleryItem): string { return String(ratioOf(img.filename)) }

/**
 * 欄數：SSR 與首次 hydration 固定 3——server 無從量容器寬，client 首繪須與 server 一致才不會
 * hydration mismatch；掛載後再依容器寬調 4/3/2。比例來自資料（非 runtime 量測），故欄分配在
 * server / client 同一份輸入下結果一致。
 */
const SSR_COLUMNS = 3
const columnCount = ref(SSR_COLUMNS)
function colsForWidth (w: number): number {
  if (w >= 1100) return 4
  if (w >= 720) return 3
  return 2
}

interface MasonryCell { image: GalleryItem; i: number }
const columns = computed<MasonryCell[][]>(() => {
  const idx = new Map(props.items.map((it, i) => [it.filename, i] as const))
  return computeMasonryColumns(props.items, ratioOf, columnCount.value)
    .map(col => col.items.map(image => ({ image, i: idx.get(image.filename)! })))
})

function exifLine (img: GalleryItem): string | null {
  const parts: string[] = []
  if (img.focalLength) parts.push(`${img.focalLength}mm`)
  if (img.aperture) parts.push(`f/${img.aperture}`)
  if (img.shutterSpeed) parts.push(formatShutterSpeed(img.shutterSpeed))
  return parts.length ? parts.join(' · ') : null
}

function frameNo (i: number): string {
  const m = props.items[i]?.filename?.match(/(\d{2,5})(?:[-_.]|\.\w+$)/)
  const n = m?.[1]
  return n ? `${n}A` : String(i + 1).padStart(2, '0') + 'A'
}

/* =========================================================
   g+：游標放大鏡 (loupe / ルーペ)
   桌機指標型裝置才啟用；觸控/coarse pointer 直接 return（CSS 也再擋一層）。
   鏡片以 background-image 放大該格圖，依游標在該格內的相對 (px,py) 設 background-position，
   做出「真實放大」的視差。EXIF 浮在鏡下。
   ========================================================= */
const LOUPE_SIZE = 168 // 鏡片直徑(px)
const LOUPE_ZOOM = 2.6 // 放大倍率

const sheetEl = ref<HTMLElement | null>(null)
const loupeEl = ref<HTMLElement | null>(null)
const loupe = reactive<{
  active: boolean
  index: number
  src: string
  bgSize: string
  bgPos: string
  frame: string
  exif: string | null
}>({ active: false, index: -1, src: '', bgSize: '', bgPos: '', frame: '', exif: null })

const loupeGlassStyle = computed(() => ({
  backgroundImage: loupe.src ? `url("${loupe.src}")` : 'none',
  backgroundSize: loupe.bgSize,
  backgroundPosition: loupe.bgPos
}))

let isFinePointer = false
let loupeRaf = 0

function deactivateLoupe () {
  loupe.active = false
  loupe.index = -1
}

function onSheetPointerMove (e: PointerEvent) {
  // 只在桌機指標型裝置啟用；觸控以原本「點擊開圖」為主，避免擋住 tap。
  if (!isFinePointer || e.pointerType === 'touch') {
    if (loupe.active) deactivateLoupe()
    return
  }
  const cell = (e.target as HTMLElement | null)?.closest<HTMLElement>('.contact-sheet__cell')
  if (!cell || !sheetEl.value) {
    if (loupe.active) deactivateLoupe()
    return
  }
  const i = Number(cell.dataset.frame)
  const img = props.items[i]
  if (!img) {
    if (loupe.active) deactivateLoupe()
    return
  }

  const cellRect = cell.getBoundingClientRect()
  const sheetRect = sheetEl.value.getBoundingClientRect()
  // 游標在該格內的相對比例 (0~1)
  const fx = Math.min(1, Math.max(0, (e.clientX - cellRect.left) / cellRect.width))
  const fy = Math.min(1, Math.max(0, (e.clientY - cellRect.top) / cellRect.height))

  // 放大底圖：寬高 = 鏡片直徑 × 倍率；background-position 依比例對齊游標所指處
  const bg = LOUPE_SIZE * LOUPE_ZOOM
  loupe.src = getThumbPath(img.filename, 800)
  loupe.bgSize = `${bg}px ${bg}px`
  loupe.bgPos = `${fx * 100}% ${fy * 100}%`
  loupe.frame = frameNo(i)
  loupe.exif = exifLine(img)
  loupe.index = i
  loupe.active = true

  // 鏡片跟游標（相對 sheet 容器定位）；rAF 節流避免抖動
  const lx = e.clientX - sheetRect.left
  const ly = e.clientY - sheetRect.top
  cancelAnimationFrame(loupeRaf)
  loupeRaf = requestAnimationFrame(() => {
    if (loupeEl.value) {
      loupeEl.value.style.transform = `translate3d(${lx - LOUPE_SIZE / 2}px, ${ly - LOUPE_SIZE / 2}px, 0)`
    }
  })
}

function onSheetPointerLeave () {
  cancelAnimationFrame(loupeRaf)
  deactivateLoupe()
}

const rootEl = ref<HTMLElement | null>(null)
const developed = reactive<Record<number, boolean>>({})
const frameEls: (HTMLElement | null)[] = []
function setFrameRef (i: number, el: Element | { $el: Element } | null) {
  if (!el) { frameEls[i] = null; return }
  frameEls[i] = ('$el' in el ? el.$el : el) as HTMLElement
}

let frameIo: IntersectionObserver | null = null
const idxByEl = new WeakMap<Element, number>()

function developAll () {
  props.items.forEach((_, i) => { developed[i] = true })
}

/* 欄數隨容器寬調整（掛載後）；ratio 來自資料故重分配只是把同一批 DOM 節點（keyed by
   filename）reparent 到不同欄，IntersectionObserver/loupe 仍綁同一批 element node，不受影響。 */
let colRo: ResizeObserver | null = null
function measureColumns () {
  const w = sheetEl.value?.clientWidth || 0
  if (w) columnCount.value = colsForWidth(w)
}

onMounted(() => {
  if (typeof window === 'undefined') return
  // 桌機指標型裝置才開放放大鏡（hover 可用 + 細指標）；觸控降級為點擊開圖。
  isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches

  // 欄數量測須在 reduced-motion 早返之前（否則 reduce 使用者卡在 SSR 的 3 欄）。
  measureColumns()
  if (typeof ResizeObserver !== 'undefined' && sheetEl.value) {
    colRo = new ResizeObserver((entries) => {
      for (const e of entries) if (e.contentRect.width) columnCount.value = colsForWidth(e.contentRect.width)
    })
    colRo.observe(sheetEl.value)
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce || typeof IntersectionObserver === 'undefined') {
    developAll()
    return
  }
  frameIo = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue
      const i = idxByEl.get(e.target)
      if (i === undefined || developed[i]) continue
      developed[i] = true
      frameIo?.unobserve(e.target)
    }
  }, { rootMargin: '0px 0px -4% 0px', threshold: 0 })

  requestAnimationFrame(() => {
    frameEls.forEach((el, i) => {
      if (!el) return
      idxByEl.set(el, i)
      frameIo?.observe(el)
    })
  })
})

onBeforeUnmount(() => {
  frameIo?.disconnect()
  colRo?.disconnect()
  colRo = null
  if (typeof window !== 'undefined') cancelAnimationFrame(loupeRaf)
})
</script>

<style scoped>
/* =========================================================
   g1：暗室接觸印樣格（contact-sheet grid）
   多欄密鋪小格，保留齒孔/序號/冷調負片 identity，砍掉單欄長柱。
   ========================================================= */
.contact-sheet { position: relative; width: 100%; }

/* 卷頭片導 leader（沿用 film-roll 語法，承接膠卷感） */
.contact-sheet__leader {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.2rem 0 0.9rem;
  font-family: var(--world-mono, ui-monospace, monospace);
  font-size: 0.56rem;
  letter-spacing: 0.28em;
  color: color-mix(in srgb, var(--accent) 70%, var(--fg-muted));
  text-transform: uppercase;
}
.contact-sheet__leader-ticks {
  flex: 1;
  height: 8px;
  align-self: center;
  background-image: repeating-linear-gradient(
    to right,
    color-mix(in srgb, var(--accent) 36%, transparent) 0,
    color-mix(in srgb, var(--accent) 36%, transparent) 2px,
    transparent 2px,
    transparent 12px
  );
}
.contact-sheet__leader-code,
.contact-sheet__leader-frames { white-space: nowrap; opacity: 0.9; }
.contact-sheet__leader-loupe {
  white-space: nowrap;
  font-family: 'Noto Serif JP', serif;
  letter-spacing: 0.22em;
  text-transform: none;
  color: color-mix(in srgb, var(--accent) 80%, var(--fg-muted));
  opacity: 0.78;
}
/* 觸控／粗指標裝置無放大鏡 → 隱藏提示，避免誤導 */
@media (hover: none), (pointer: coarse) {
  .contact-sheet__leader-loupe { display: none; }
}

/* 印樣瀑布流：等寬欄並排，欄內各格保留原比例垂直堆疊（Pinterest 式錯落） */
.contact-sheet__masonry {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
}
.contact-sheet__col {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}
@media (max-width: 639px) {
  .contact-sheet__masonry,
  .contact-sheet__col { gap: 0.45rem; }
}

.contact-sheet__cell {
  position: relative;
  /* aspect-ratio 由 inline style 依離線預算比例逐格設定（錯落、零 CLS） */
  /* 逐格顯影 */
  opacity: 0.45;
  filter: blur(3px) saturate(0.6) brightness(0.96);
  transform: translateY(0.6rem);
  transition:
    opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
    filter 0.7s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, filter, transform;
}
.contact-sheet__cell--developed {
  opacity: 1;
  filter: blur(0) saturate(1) brightness(1);
  transform: translateY(0);
}
/* 左緣齒孔軌（每格保留膠卷邊） */
.contact-sheet__sprockets {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 0.7rem;
  z-index: 2;
  pointer-events: none;
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0, transparent 6px,
    color-mix(in srgb, var(--accent) 24%, transparent) 6px,
    color-mix(in srgb, var(--accent) 24%, transparent) 13px,
    transparent 13px, transparent 19px
  );
  border-right: 1px solid color-mix(in srgb, var(--accent) 16%, transparent);
}
.contact-sheet__no {
  position: absolute;
  top: 0.3rem;
  left: 0.95rem;
  z-index: 3;
  font-family: 'Noto Serif JP', serif;
  font-size: 0.55rem;
  letter-spacing: 0.14em;
  color: rgba(238, 241, 243, 0.85);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
}

.contact-sheet__btn {
  position: absolute;
  inset: 0;
  display: block;
  padding: 0;
  margin: 0;
  border: 0;
  cursor: pointer;
  overflow: hidden;
  /* freshen「光卓」：膠格框實底改冷銀亮（light 模式） */
  background: #e7edf1;
  outline: 1px solid rgba(82, 100, 122, 0.18);
}
:global(.dark) .contact-sheet__btn {
  background: rgba(20, 24, 27, 0.08);
  outline: 1px solid color-mix(in srgb, var(--accent) 16%, transparent);
}
.contact-sheet__btn:focus-visible { outline: 2px solid var(--accent); }
.contact-sheet__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.9) contrast(1.02);
  transition: transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1), filter 0.5s ease;
}
.contact-sheet__btn:hover .contact-sheet__img,
.contact-sheet__btn:focus-visible .contact-sheet__img {
  transform: scale(1.04);
  filter: saturate(1.04) contrast(1.05);
}

/* hover 浮出最小標籤（不常駐 → 不吃高度） */
.contact-sheet__cap {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  padding: 1.4rem 0.7rem 0.55rem;
  background: linear-gradient(to top, rgba(12, 15, 18, 0.82), transparent);
  opacity: 0;
  transform: translateY(0.3rem);
  transition: opacity 0.3s ease, transform 0.3s ease;
  pointer-events: none;
}
.contact-sheet__btn:hover .contact-sheet__cap,
.contact-sheet__btn:focus-visible .contact-sheet__cap {
  opacity: 1;
  transform: translateY(0);
}
.contact-sheet__cap-title {
  display: block;
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 0.78rem;
  font-weight: 400;
  letter-spacing: 0.06em;
  line-height: 1.4;
  color: #eef1f3;
}
.contact-sheet__cap-exif {
  display: block;
  margin-top: 0.15rem;
  font-family: ui-monospace, monospace;
  font-size: 0.56rem;
  letter-spacing: 0.1em;
  color: rgba(190, 200, 212, 0.82);
}

/* =========================================================
   g+：游標放大鏡 (loupe / ルーペ)
   像把放大鏡壓在燈桌上看接觸印樣。鏡片＝放大底圖 + 冷銀鏡緣 + 安全燈紅環。
   ========================================================= */
.contact-sheet__loupe {
  position: absolute;
  top: 0;
  left: 0;
  width: 168px;
  height: 168px;
  z-index: 30;
  pointer-events: none;
  border-radius: 50%;
  /* freshen「光卓」：冷銀鏡緣 + 安全燈紅內環；light 模式鏡身改冷銀亮 */
  box-shadow:
    0 0 0 1px rgba(82, 100, 122, 0.5),
    0 0 0 5px rgba(225, 232, 237, 0.95),
    0 0 0 6px rgba(200, 60, 48, 0.55),
    0 14px 38px -8px rgba(82, 100, 122, 0.4);
  overflow: hidden;
  /* rAF 設 transform；位置切換做極短平滑（reduced-motion 取消） */
  transition: transform 0.08s linear;
  background: #e7edf1;
}
:global(.dark) .contact-sheet__loupe {
  box-shadow:
    0 0 0 1px rgba(238, 241, 243, 0.65),
    0 0 0 5px rgba(20, 24, 27, 0.92),
    0 0 0 6px rgba(200, 60, 48, 0.55),
    0 14px 38px -8px rgba(0, 0, 0, 0.72);
  background: #0b0e11;
}
.contact-sheet__loupe-glass {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background-repeat: no-repeat;
  filter: saturate(1.05) contrast(1.06);
  /* 玻璃凸面高光 + 暈影，做出鏡片感 */
  box-shadow:
    inset 0 0 22px 6px rgba(0, 0, 0, 0.45),
    inset 22px 22px 30px -18px rgba(255, 255, 255, 0.32);
}
.contact-sheet__loupe-readout {
  position: absolute;
  left: 50%;
  bottom: -1.65rem;
  transform: translateX(-50%);
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.18rem 0.6rem;
  white-space: nowrap;
  /* freshen「光卓」：鏡下讀數面板（框上文字，非照片上）→ 冷銀亮底 + 深 slate 文字 */
  background: rgba(231, 237, 241, 0.92);
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
  border-radius: 2px;
}
:global(.dark) .contact-sheet__loupe-readout {
  background: rgba(12, 15, 18, 0.86);
}
.contact-sheet__loupe-no {
  font-family: 'Noto Serif JP', serif;
  font-size: 0.58rem;
  letter-spacing: 0.14em;
  color: #2b3640;
}
:global(.dark) .contact-sheet__loupe-no {
  color: rgba(238, 241, 243, 0.92);
}
.contact-sheet__loupe-exif {
  font-family: ui-monospace, monospace;
  font-size: 0.56rem;
  letter-spacing: 0.08em;
  /* freshen「光卓」：讀數面板上的 EXIF → 深 slate（亮底可讀） */
  color: #56697e;
}
:global(.dark) .contact-sheet__loupe-exif {
  color: color-mix(in srgb, var(--accent) 65%, #cbd5e1);
}

/* 放大鏡作用時：聚焦該格、其餘略沉，呼應「壓鏡細看一格」的注意力收束 */
.contact-sheet--loupe-on .contact-sheet__cell { transition: opacity 0.35s ease; }
.contact-sheet--loupe-on .contact-sheet__cell.contact-sheet__cell--developed {
  opacity: 0.62;
}
.contact-sheet--loupe-on .contact-sheet__cell--under-loupe.contact-sheet__cell--developed {
  opacity: 1;
}
.contact-sheet__cell--under-loupe .contact-sheet__btn {
  outline: 1px solid color-mix(in srgb, var(--accent) 55%, transparent);
}

/* 觸控／粗指標：不渲染放大鏡（JS 也已擋；雙保險） */
@media (hover: none), (pointer: coarse) {
  .contact-sheet__loupe { display: none !important; }
  .contact-sheet--loupe-on .contact-sheet__cell.contact-sheet__cell--developed { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .contact-sheet__cell,
  .contact-sheet__cell--developed {
    opacity: 1 !important;
    filter: none !important;
    transform: none !important;
    transition: none !important;
  }
  .contact-sheet__img,
  .contact-sheet__cap { transition: none; }
  /* 放大鏡保留功能（仍可細看），但取消跟隨平滑與聚焦淡化動態 */
  .contact-sheet__loupe { transition: none; }
  .contact-sheet--loupe-on .contact-sheet__cell.contact-sheet__cell--developed { opacity: 1 !important; }
}
</style>
