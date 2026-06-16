<template>
  <section class="lt" aria-labelledby="lt-heading" data-world="kage">
    <!--
      i4（act-critic / 暗室の横引き膠卷光桌）：
      回應 Round 3 critic next-step「把製図台的橫向探索鏡像成影世界的『膠卷光桌』：
      暗室頁主欄改成可橫拉的連續膠卷條，齒孔＋片格號＋EXIF 隨拉動浮現，
      讓兩世界各有對位的招牌橫向手勢——一張製圖桌、一卷底片」。

      KILL 影世界舊「stacked 摺合章 timeline（其の N → ContactSheet）」死板縮圖格牆
      （critic AVOID jump-out：連續輪只攻 digital，影仍是部落格地層）。
      取代為一條【横向可拖動的暗房光桌膠卷流】：所有 event 的負片格首尾相接鋪成一長卷，
      左→右橫拉探索（拖動／⇧+滾輪／方向鍵／巻尺點跳）。每格＝負片框 + 齒孔 + frame no，
      拉到某格 → 該格「顯影」清晰並浮出 EXIF 邊框註記（像把底片捲到光桌中央細讀）。
      全 user-initiated，無 timer/autoplay。守 prefers-reduced-motion。
      桌機 (lg+) 才橫向膠卷光桌；手機降級為直落（normal scroll，瀏覽不破）。

      與繪 GalleryAtelierTimeline 對位（兩世界招牌橫向手勢分家）：
        繪 = 製図台（暖白藍圖網格、方格藍圖、縱書年脊、mono 製圖標號）
        影 = 膠卷光桌（暗調冷銀光桌、連續負片、齒孔軌、serif 邊框序號 + EXIF）
    -->

    <!--
      i6（act-critic / 門と一巻を一本の軌に縫う）：
      回應 Round 5 critic next-step「一條軌道貫穿門與內容，消滅 grid／門兩種視覺語言並存
      的斷層」。KILL 舊「光桌抬頭」(其自帶 h2『一巻を、横に繰る』+ sub + 獨立巻尺) ——
      它在門正下方再起一個帶大標題 section，正是「門驚艷、捲下去秒回部落格」的斷層。
      改為一條【縫合條 seam-rail】：暗調 hairline 軌把門接到膠卷，巻尺刻度掛其上，讀作
      「門的暗房光桌在此延續」而非「新區塊」。整條 full-bleed 撐到視窗滿寬，與門同一張
      暗桌相連。影世界 serif/銀冷語彙不變。
    -->
    <header class="lt__seam world-enter world-enter-d1">
      <span class="lt__seam-thread" aria-hidden="true"/>
      <span class="lt__seam-label">
        <span id="lt-heading" class="lt__seam-kanji font-jp">暗房光桌</span>
        <span class="lt__seam-roman" aria-hidden="true">続く · ROLL CONTINUES</span>
      </span>

      <!-- 巻尺：掛在縫合軌上的橫向刻度，點某巻→光桌平移到該巻 -->
      <nav class="lt__ruler" aria-label="巻で移動">
        <button
          v-for="(r, ri) in rolls"
          :key="r.eventName"
          type="button"
          class="lt__tick"
          :class="{ 'lt__tick--active': activeRoll === ri }"
          :aria-current="activeRoll === ri ? 'true' : undefined"
          @click="scrollToRoll(ri)"
        >
          <span class="lt__tick-mark" aria-hidden="true"/>
          <span class="lt__tick-name font-jp">{{ r.eventName }}</span>
          <span class="lt__tick-cnt jp-kansuji">{{ r.images.length }}</span>
        </button>
      </nav>

      <span class="lt__seam-count" aria-hidden="true">
        <span class="jp-kansuji">{{ totalCount }}</span> 枚
      </span>
    </header>

    <!-- 光桌：橫向可拖動膠卷軌（桌機）／直落（手機） -->
    <div
      ref="trackEl"
      class="lt__table"
      :class="{ 'lt__table--loupe-on': loupe.active }"
      role="group"
      :aria-label="`暗房光桌、${rolls.length} 巻を横スクロールで閲覧`"
      tabindex="0"
      @wheel="onWheel"
      @keydown="onTableKey"
      @pointerdown="onPointerDown"
      @pointermove="onLoupeMove"
      @pointerleave="onLoupeLeave"
    >
      <!--
        i6（影暗室 signature 互動 / 燈桌のルーペ）：游標放大鏡。
        把 Round 5「門驚艷、捲下去秒回部落格」的內容層補上招牌手勢——
        移動游標如把放大鏡壓在燈桌上閱讀負片，鏡下該格「顯影放大」並浮出片號＋EXIF。
        桌機指標型裝置才啟用（hover+fine pointer）；觸控降級為原本點擊開圖。
        守 prefers-reduced-motion（取消跟隨平滑）。aria-hidden（純視覺輔助，資訊另有 edge 註記）。
      -->
      <div
        v-show="loupe.active"
        ref="loupeEl"
        class="lt__loupe"
        aria-hidden="true"
      >
        <span class="lt__loupe-glass" :style="loupeGlassStyle"/>
        <span class="lt__loupe-readout">
          <span class="lt__loupe-no">{{ loupe.frame }}</span>
          <span v-if="loupe.exif" class="lt__loupe-exif">{{ loupe.exif }}</span>
        </span>
      </div>
      <!-- 卷頭片導 leader（膠卷起始曝光標頭） -->
      <div class="lt__leader" aria-hidden="true">
        <span class="lt__leader-code">KAGE · 400</span>
        <span class="lt__leader-arrow">▶</span>
        <span class="lt__leader-frames">{{ String(totalCount).padStart(3, '0') }} FRAMES</span>
      </div>

      <template v-for="(r, ri) in rolls" :key="r.eventName">
        <!-- 巻頭：縱書巻名 + 巻碼 + 巻首句（取代 stacked 章節 header） -->
        <article
          :ref="el => setRollRef(ri, el)"
          class="lt__roll"
          :data-roll-idx="ri"
        >
          <header class="lt__spine">
            <span class="lt__spine-index">巻の {{ kansuji(ri + 1) }}</span>
            <span class="lt__spine-name font-jp">{{ r.eventName }}</span>
            <span class="lt__spine-meta jp-kansuji">{{ r.images.length }} 枚</span>
            <p v-if="r.strongestLine" class="lt__spine-line font-jp">「{{ r.strongestLine }}」</p>
            <span v-if="r.location" class="lt__spine-loc">
              <span aria-hidden="true">／</span>{{ r.location }}
            </span>
          </header>

          <!-- 該巻負片格首尾相接（橫向連續膠卷條） -->
          <div class="lt__strip">
            <button
              v-for="(item, ii) in r.images"
              :key="item.filename"
              type="button"
              class="lt__frame group"
              :data-flat-idx="flatIndex(ri, ii)"
              :aria-label="item.title || '攝影作品'"
              @click="$emit('imageClick', item)"
            >
              <span class="lt__frame-no" aria-hidden="true">{{ frameNo(item, ii) }}</span>
              <picture class="contents">
                <source :srcset="getGridAvifSrcset(item.filename)" :sizes="cellSizes" type="image/avif">
                <source :srcset="getGridImageSrcset(item.filename)" :sizes="cellSizes" type="image/webp">
                <img
                  :src="getThumbPath(item.filename, 400)"
                  :srcset="getGridImageSrcset(item.filename)"
                  :sizes="cellSizes"
                  :alt="item.title"
                  class="lt__img"
                  :loading="ri === 0 && ii < 4 ? 'eager' : 'lazy'"
                  decoding="async"
                >
              </picture>
              <!-- 邊框註記：拉到鏡頭中央／hover 才浮現（像讀負片邊緣刻字） -->
              <span class="lt__edge">
                <span class="lt__edge-title font-jp">{{ item.title || '未命名' }}</span>
                <span v-if="exifLine(item)" class="lt__edge-exif">{{ exifLine(item) }}</span>
              </span>
            </button>
          </div>
        </article>

        <!-- 巻間接縫（膠卷捲與捲之間的曝光間隔，巻別分界視覺節拍） -->
        <div class="lt__splice" aria-hidden="true">
          <span class="lt__splice-mark"/>
        </div>
      </template>

      <!-- 膠卷尾端封口（橫向終點，wabi-sabi 收筆） -->
      <div class="lt__end" aria-hidden="true">
        <span class="lt__end-kana font-jp">影</span>
        <span class="lt__end-rule"/>
        <span class="lt__end-label">END OF ROLL</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, type ComponentPublicInstance } from 'vue'
import { useImagePath } from '~/composables/useImagePath'
import { formatShutterSpeed } from '~/utils/formatters'
import type { GalleryItem, MixedPhotoItem, SeriesNarrative } from '~~/shared/types/gallery'

const props = defineProps<{ items: MixedPhotoItem[] }>()
defineEmits<{ imageClick: [item: GalleryItem] }>()

const { getThumbPath, getGridImageSrcset, getGridAvifSrcset } = useImagePath()

const cellSizes = '(max-width: 1023px) 60vw, 22vw'

interface Roll {
  eventName: string
  images: GalleryItem[]
  strongestLine: string | null
  location: string | null
}

/**
 * 把 photography event 群組攤平成「巻」(rolls)，每巻一段連續負片。
 * 取代舊 timeline 的 per-event 摺合章；這裡全部展開鋪成一長卷橫拉。
 */
const rolls = computed<Roll[]>(() =>
  props.items
    .filter(g => g.images && g.images.length)
    .map((g) => {
      const sn = (g.images?.[0] as { seriesNarrative?: SeriesNarrative } | undefined)?.seriesNarrative
      return {
        eventName: g.eventName || '其他作品',
        images: g.images || [],
        strongestLine: sn?.strongest_line?.trim() || null,
        location: g.images?.[0]?.event?.location || null
      }
    })
)

const totalCount = computed(() => rolls.value.reduce((s, r) => s + r.images.length, 0))

const KANSUJI = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五']
function kansuji (n: number): string { return KANSUJI[n] || String(n) }

function exifLine (img: GalleryItem): string | null {
  const parts: string[] = []
  if (img.focalLength) parts.push(`${img.focalLength}mm`)
  if (img.aperture) parts.push(`f/${img.aperture}`)
  if (img.shutterSpeed) parts.push(formatShutterSpeed(img.shutterSpeed))
  return parts.length ? parts.join(' · ') : null
}

/** frame number：自檔名抽近似負片序號（DSC_7030 → 7030A），抽不到退回索引補零。 */
function frameNo (img: GalleryItem, ii: number): string {
  const m = img.filename?.match(/(\d{2,5})(?:[-_.]|\.\w+$)/)
  const n = m?.[1]
  return n ? `${n}A` : String(ii + 1).padStart(2, '0') + 'A'
}

/**
 * i6：把所有巻的負片格攤平成單一序列，供 loupe 以 data-flat-idx 快速取回該格 GalleryItem。
 * flatIndex(ri, ii) 與 flatImages 同序（先巻、後巻內序）。
 */
const flatImages = computed<GalleryItem[]>(() => rolls.value.flatMap(r => r.images))
function flatIndex (ri: number, ii: number): number {
  let base = 0
  for (let k = 0; k < ri; k++) base += rolls.value[k]?.images.length || 0
  return base + ii
}

// ===== i6：游標放大鏡 (loupe / ルーペ) — 燈桌上閱讀負片 =====
const LOUPE_SIZE = 172 // 鏡片直徑(px)
const LOUPE_ZOOM = 2.6 // 放大倍率
const loupeEl = ref<HTMLElement | null>(null)
const loupe = reactive<{
  active: boolean
  src: string
  bgSize: string
  bgPos: string
  frame: string
  exif: string | null
}>({ active: false, src: '', bgSize: '', bgPos: '', frame: '', exif: null })

const loupeGlassStyle = computed(() => ({
  backgroundImage: loupe.src ? `url("${loupe.src}")` : 'none',
  backgroundSize: loupe.bgSize,
  backgroundPosition: loupe.bgPos
}))

// 指標型裝置（滑鼠/觸控筆）才啟用游標放大鏡；觸控降級為點擊開圖。
// 在 client 上由 media query 一次性判定（無 listener，無 timer）。
const isFinePointer = typeof window !== 'undefined'
  && window.matchMedia('(hover: hover) and (pointer: fine)').matches
let loupeRaf = 0

function deactivateLoupe () { loupe.active = false }

function onLoupeMove (e: PointerEvent) {
  // 桌機指標型裝置才啟用；觸控以原本「點擊開圖」為主，避免擋住 tap。
  if (!isFinePointer || e.pointerType === 'touch' || dragging) {
    if (loupe.active) deactivateLoupe()
    return
  }
  const frame = (e.target as HTMLElement | null)?.closest<HTMLElement>('.lt__frame')
  const track = trackEl.value
  if (!frame || !track) {
    if (loupe.active) deactivateLoupe()
    return
  }
  const idx = Number(frame.dataset.flatIdx)
  const img = flatImages.value[idx]
  if (!img) {
    if (loupe.active) deactivateLoupe()
    return
  }

  const frameRect = frame.getBoundingClientRect()
  const trackRect = track.getBoundingClientRect()
  const fx = Math.min(1, Math.max(0, (e.clientX - frameRect.left) / frameRect.width))
  const fy = Math.min(1, Math.max(0, (e.clientY - frameRect.top) / frameRect.height))

  const bg = LOUPE_SIZE * LOUPE_ZOOM
  loupe.src = getThumbPath(img.filename, 800)
  loupe.bgSize = `${bg}px ${bg}px`
  loupe.bgPos = `${fx * 100}% ${fy * 100}%`
  loupe.frame = frameNo(img, idx)
  loupe.exif = exifLine(img)
  loupe.active = true

  // 鏡片跟游標（相對 track 容器、含 scrollLeft 補償）；rAF 節流
  const lx = e.clientX - trackRect.left
  const ly = e.clientY - trackRect.top
  cancelAnimationFrame(loupeRaf)
  loupeRaf = requestAnimationFrame(() => {
    if (loupeEl.value) {
      loupeEl.value.style.transform = `translate3d(${lx - LOUPE_SIZE / 2}px, ${ly - LOUPE_SIZE / 2}px, 0)`
    }
  })
}

function onLoupeLeave () {
  cancelAnimationFrame(loupeRaf)
  deactivateLoupe()
}

// ===== 橫向膠卷光桌：拖動 / 滾輪 / 方向鍵 / 巻尺跳轉 =====
const trackEl = ref<HTMLElement | null>(null)
const rollEls: (HTMLElement | null)[] = []
const activeRoll = ref(0)

function setRollRef (i: number, el: Element | ComponentPublicInstance | null) {
  rollEls[i] = el ? (('$el' in el ? el.$el : el) as HTMLElement) : null
}

function prefersReduced (): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** 桌機橫向佈局時才接管橫向手勢；手機是直落，沿用 normal scroll */
function isHorizontal (): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
}

function scrollToRoll (ri: number) {
  const track = trackEl.value
  const roll = rollEls[ri]
  if (!track || !roll) return
  activeRoll.value = ri
  if (isHorizontal()) {
    track.scrollTo({ left: roll.offsetLeft - 24, behavior: prefersReduced() ? 'auto' : 'smooth' })
  } else {
    roll.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' })
  }
}

/** 垂直滾輪 → 橫向繰膠卷（桌機）。讓「向下捲」自然變「向右繰底片」。 */
function onWheel (e: WheelEvent) {
  if (!isHorizontal()) return
  const track = trackEl.value
  if (!track) return
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return // trackpad 橫滑交給 native
  const atStart = track.scrollLeft <= 0 && e.deltaY < 0
  const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1 && e.deltaY > 0
  if (atStart || atEnd) return // 邊界放行，讓頁面接著捲
  e.preventDefault()
  track.scrollLeft += e.deltaY
  syncActiveRoll()
}

function onTableKey (e: KeyboardEvent) {
  if (!isHorizontal()) return
  if (e.key === 'ArrowRight') { e.preventDefault(); scrollToRoll(Math.min(rolls.value.length - 1, activeRoll.value + 1)) }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); scrollToRoll(Math.max(0, activeRoll.value - 1)) }
  else if (e.key === 'Home') { e.preventDefault(); scrollToRoll(0) }
  else if (e.key === 'End') { e.preventDefault(); scrollToRoll(rolls.value.length - 1) }
}

// 拖動繰片（pointer drag-to-pan，桌機）
let dragging = false
let startX = 0
let startScroll = 0
function onPointerDown (e: PointerEvent) {
  if (!isHorizontal()) return
  const track = trackEl.value
  if (!track) return
  dragging = true
  startX = e.clientX
  startScroll = track.scrollLeft
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}
function onPointerMove (e: PointerEvent) {
  if (!dragging) return
  const track = trackEl.value
  if (!track) return
  const dx = e.clientX - startX
  if (Math.abs(dx) > 4) {
    track.scrollLeft = startScroll - dx
    syncActiveRoll()
  }
}
function onPointerUp () {
  dragging = false
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
}

/** 依當前 scrollLeft 推算最靠左可視的巻，更新巻尺 active 高亮 */
function syncActiveRoll () {
  const track = trackEl.value
  if (!track) return
  const x = track.scrollLeft + 60
  let best = 0
  for (let i = 0; i < rollEls.length; i++) {
    const c = rollEls[i]
    if (c && c.offsetLeft <= x) best = i
  }
  activeRoll.value = best
}

let scrollRaf = 0
function onTrackScroll () {
  cancelAnimationFrame(scrollRaf)
  scrollRaf = requestAnimationFrame(syncActiveRoll)
}

onMounted(() => {
  trackEl.value?.addEventListener('scroll', onTrackScroll, { passive: true })
})
onBeforeUnmount(() => {
  trackEl.value?.removeEventListener('scroll', onTrackScroll)
  cancelAnimationFrame(scrollRaf)
  onPointerUp()
})
</script>

<style scoped>
/* =========================================================
   i4：暗室「膠卷光桌」橫向連續負片流
   暗調冷銀光桌、連續負片格、齒孔軌、serif 邊框序號 + EXIF
   與繪 GalleryAtelierTimeline（製図台）對位 → 兩世界招牌橫向手勢分家
   ========================================================= */
.lt {
  position: relative;
  /* i6：full-bleed —— 撐到視窗滿寬，與門同一張暗桌相連，消除「頁中插一張卡」的部落格感 */
  width: 100vw;
  max-width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  /* 效能：首屏之下，未捲到前不排版/繪製（80 格膠卷），縮小整頁 Layout。 */
  content-visibility: auto;
  contain-intrinsic-size: auto 640px;
}

/* ===== i6：縫合條 seam-rail —— 把門接到膠卷的一條暗調軌（取代「光桌抬頭」大標題） ===== */
.lt__seam {
  position: relative;
  display: flex;
  align-items: center;
  gap: clamp(1rem, 3vw, 2.2rem);
  padding: 0.9rem clamp(1.25rem, 4vw, 3rem) 0.7rem;
  /* 與下方光桌同一張暗桌：縫合條本身也是暗銀面，門→縫合條→膠卷連成一片 */
  background: linear-gradient(180deg, #1b2127 0%, #20262c 100%);
}
:global(.dark) .lt__seam {
  background: linear-gradient(180deg, #14181c 0%, #1a1f24 100%);
}
.lt__seam-thread {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent 0,
    color-mix(in srgb, var(--accent) 42%, transparent) 12%,
    color-mix(in srgb, var(--accent) 42%, transparent) 88%,
    transparent 100%
  );
}
.lt__seam-label {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: baseline;
  gap: 0.7rem;
}
.lt__seam-kanji {
  font-family: var(--world-display, 'Noto Serif JP', 'Source Han Serif TC', serif);
  font-size: 1rem;
  font-weight: var(--world-display-weight, 500);
  letter-spacing: 0.2em;
  color: #eef1f3;
}
.lt__seam-roman {
  font-family: var(--world-mono, ui-monospace, monospace);
  font-size: 0.54rem;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--accent) 78%, #9aadc5);
}
.lt__seam-count {
  flex: 0 0 auto;
  margin-left: auto;
  font-family: 'Noto Serif JP', serif;
  font-size: 0.64rem;
  letter-spacing: 0.2em;
  color: rgba(190, 200, 212, 0.7);
}
.lt__seam-count .jp-kansuji { color: var(--accent); font-size: 0.92rem; margin-right: 0.15rem; }

@media (max-width: 1023px) {
  .lt__seam { flex-wrap: wrap; gap: 0.6rem 1.2rem; padding-bottom: 0.5rem; }
  .lt__seam-count { margin-left: 0; }
}

/* ===== 巻尺（掛在縫合軌上的橫向刻度導航） ===== */
.lt__ruler {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: flex-end;
  gap: clamp(1rem, 3.2vw, 2.2rem);
  padding: 0.15rem 0 0;
  overflow-x: auto;
  scrollbar-width: none;
}
.lt__ruler::-webkit-scrollbar { display: none; }
@media (max-width: 1023px) {
  .lt__ruler { flex: 1 1 100%; order: 3; }
}
.lt__tick {
  position: relative;
  flex: 0 0 auto;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  padding: 0 0 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  /* 縫合條為暗銀面 → 刻度用冷銀，非暖石（無論明暗模式） */
  color: rgba(190, 200, 212, 0.72);
  transition: color 0.3s ease;
  max-width: 12rem;
}
:global(.dark) .lt__tick { color: rgba(190, 200, 212, 0.7); }
.lt__tick:hover { color: var(--accent); }
.lt__tick-mark {
  width: 1px;
  height: 9px;
  background: currentColor;
  opacity: 0.45;
  transition: height 0.3s ease, opacity 0.3s ease;
}
.lt__tick--active { color: var(--accent); }
.lt__tick--active .lt__tick-mark { height: 16px; opacity: 1; }
.lt__tick-name {
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 0.82rem;
  letter-spacing: 0.06em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 12rem;
}
.lt__tick-cnt {
  font-family: 'Noto Serif JP', serif;
  font-size: 0.55rem;
  letter-spacing: 0.1em;
  opacity: 0.7;
}
.lt__tick:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }

/* ===== 光桌軌道 ===== */
.lt__table {
  position: relative;
  /* 暗房光桌底：冷調深灰漸層 + 極淡冷銀柵欄（呼應燈桌透光格） */
  background:
    repeating-linear-gradient(to right,
      rgba(154, 173, 197, 0.04) 0, rgba(154, 173, 197, 0.04) 1px,
      transparent 1px, transparent 64px),
    linear-gradient(165deg, #20262c 0%, #14181c 100%);
  border-top: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
}
:global(.dark) .lt__table {
  background:
    repeating-linear-gradient(to right,
      rgba(154, 173, 197, 0.04) 0, rgba(154, 173, 197, 0.04) 1px,
      transparent 1px, transparent 64px),
    linear-gradient(165deg, #1a1f24 0%, #0e1114 100%);
}
.lt__table:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }

/* 卷頭片導 leader */
.lt__leader {
  display: none;
}

/* 桌機：橫向膠卷軌（巻首尾相接，KILL stacked 部落格） */
@media (min-width: 1024px) {
  .lt__table {
    display: flex;
    align-items: stretch;
    gap: 0;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 1.4rem 1.5rem 1.7rem;
    scroll-snap-type: x proximity;
    cursor: grab;
    scrollbar-width: thin;
    scrollbar-color: color-mix(in srgb, var(--accent) 40%, transparent) transparent;
  }
  .lt__table:active { cursor: grabbing; }
  .lt__table::-webkit-scrollbar { height: 8px; }
  .lt__table::-webkit-scrollbar-thumb {
    background: color-mix(in srgb, var(--accent) 35%, transparent);
    border-radius: 4px;
  }
  .lt__leader {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    width: clamp(72px, 7vw, 104px);
    padding-right: 1.2rem;
    border-right: 1px solid color-mix(in srgb, var(--accent) 16%, transparent);
    font-family: var(--world-mono, ui-monospace, monospace);
    font-size: 0.52rem;
    letter-spacing: 0.24em;
    color: color-mix(in srgb, var(--accent) 70%, #9aadc5);
    text-transform: uppercase;
    writing-mode: vertical-rl;
    user-select: none;
  }
  .lt__leader-arrow { writing-mode: horizontal-tb; opacity: 0.6; }
}

/* ===== 巻（一段連續負片） ===== */
.lt__roll {
  position: relative;
  scroll-snap-align: start;
  padding: 0 0.5rem;
  /* perf：整卷設為 layout 邊界，單卷內變動不觸發整條光桌 relayout。 */
  contain: layout;
}

@media (min-width: 1024px) {
  .lt__roll {
    flex: 0 0 auto;
    display: grid;
    grid-template-rows: auto 1fr;
    align-content: start;
  }
}
@media (max-width: 1023px) {
  .lt__roll {
    padding: 0 1rem;
    margin-bottom: 2.5rem;
  }
}

/* 巻頭：巻名 + 巻碼 + 巻首句（serif，與繪製図台 mono 年脊對立） */
.lt__spine {
  position: relative;
  padding: 0.4rem 0 0.9rem 0.7rem;
  margin-bottom: 0.7rem;
  border-bottom: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
  max-width: 22rem;
}
.lt__spine::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.5rem;
  width: 2px;
  height: 1.4rem;
  background: color-mix(in srgb, var(--accent) 60%, transparent);
}
.lt__spine-index {
  display: block;
  font-family: var(--world-mono, ui-monospace, monospace);
  font-size: 0.56rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--accent) 80%, #9aadc5);
  margin-bottom: 0.35rem;
}
.lt__spine-name {
  display: block;
  font-family: var(--world-display, 'Noto Serif JP', 'Source Han Serif TC', serif);
  font-size: 1.32rem;
  font-weight: var(--world-display-weight, 500);
  letter-spacing: 0.1em;
  line-height: 1.3;
  color: #eef1f3;
}
.lt__spine-meta {
  display: inline-block;
  margin-top: 0.3rem;
  font-family: 'Noto Serif JP', serif;
  font-size: 0.62rem;
  letter-spacing: 0.2em;
  color: color-mix(in srgb, var(--accent) 70%, #9aadc5);
}
.lt__spine-line {
  margin: 0.5rem 0 0;
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 0.82rem;
  font-weight: 300;
  letter-spacing: 0.04em;
  line-height: 1.65;
  color: rgba(206, 214, 224, 0.82);
  max-width: 22rem;
}
.lt__spine-loc {
  display: block;
  margin-top: 0.4rem;
  font-family: 'Noto Serif JP', serif;
  font-size: 0.66rem;
  letter-spacing: 0.14em;
  color: rgba(190, 200, 212, 0.6);
}
.lt__spine-loc span { color: color-mix(in srgb, var(--accent) 70%, transparent); }

/* 該巻負片格首尾相接（橫向連續膠卷條）：桌機橫排、手機格牆 */
.lt__strip {
  display: flex;
  align-items: stretch;
  gap: 0;
}
@media (max-width: 1023px) {
  .lt__strip {
    flex-wrap: wrap;
    gap: 1px;
    background: color-mix(in srgb, var(--accent) 14%, transparent);
  }
}

/* 一格負片 = 上下齒孔軌 + 負片框 */
.lt__frame {
  position: relative;
  flex: 0 0 auto;
  /* 桌機固定負片格寬（連續膠卷），上下留齒孔軌 */
  width: clamp(190px, 17vw, 240px);
  aspect-ratio: 3 / 2;
  padding: 0.85rem 0;
  margin: 0;
  border: 0;
  border-left: 1px solid rgba(20, 24, 27, 0.85);
  cursor: pointer;
  overflow: hidden;
  background: #0b0e11;
  /* 上下齒孔軌（連續膠卷邊孔，定義「這是一卷負片」） */
  background-image:
    repeating-linear-gradient(to right,
      transparent 0, transparent 7px,
      rgba(238, 241, 243, 0.5) 7px, rgba(238, 241, 243, 0.5) 14px,
      transparent 14px, transparent 22px);
  background-position: top, bottom;
  background-size: 100% 5px;
  background-repeat: repeat-x;
  /* 未顯影：略沉去飽和（停在光桌邊緣），拉到中央 / hover 才顯影 */
  transition: filter 0.5s ease, opacity 0.5s ease;
  /* perf：每格負片設為 layout 邊界，frame 內變動（hover 顯影/字體）不外溢重排整卷。 */
  contain: layout;
}
.lt__frame:first-child { border-left: 0; }

@media (max-width: 1023px) {
  .lt__frame {
    width: calc(50% - 0.5px);
    border-left: 0;
    background-color: #0b0e11;
    padding: 0.7rem 0;
  }
}
@media (max-width: 639px) {
  .lt__frame { width: calc(50% - 0.5px); }
}

.lt__frame-no {
  position: absolute;
  top: 0.12rem;
  left: 0.7rem;
  z-index: 3;
  font-family: 'Noto Serif JP', serif;
  font-size: 0.5rem;
  letter-spacing: 0.16em;
  color: color-mix(in srgb, var(--accent) 78%, #cbd5e1);
  opacity: 0.8;
}
.lt__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* 略偏冷、低飽和，像未調色的負片掃描 */
  filter: saturate(0.9) contrast(1.03);
  transition: transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1), filter 0.5s ease;
}
.lt__frame:hover { z-index: 4; }
.lt__frame:hover .lt__img,
.lt__frame:focus-visible .lt__img {
  transform: scale(1.04);
  filter: saturate(1.05) contrast(1.05);
}
.lt__frame:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; z-index: 4; }

/* 邊框註記（標題 + EXIF）：hover/focus 浮現，像讀負片邊緣刻字 */
.lt__edge {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  z-index: 2;
  padding: 1.2rem 0.6rem 0.55rem;
  background: linear-gradient(to top, rgba(11, 14, 17, 0.9) 0%, rgba(11, 14, 17, 0.2) 60%, transparent 100%);
  opacity: 0;
  transform: translateY(0.3rem);
  transition: opacity 0.3s ease, transform 0.3s ease;
  pointer-events: none;
}
.lt__frame:hover .lt__edge,
.lt__frame:focus-visible .lt__edge {
  opacity: 1;
  transform: translateY(0);
}
.lt__edge-title {
  display: block;
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 0.74rem;
  font-weight: 400;
  letter-spacing: 0.05em;
  line-height: 1.35;
  color: #eef1f3;
}
.lt__edge-exif {
  display: block;
  margin-top: 0.15rem;
  font-family: ui-monospace, monospace;
  font-size: 0.54rem;
  letter-spacing: 0.08em;
  color: color-mix(in srgb, var(--accent) 62%, #cbd5e1);
}

/* 巻間接縫（曝光間隔；桌機才顯示，作巻別分界） */
.lt__splice { display: none; }
@media (min-width: 1024px) {
  .lt__splice {
    flex: 0 0 auto;
    width: 2.4rem;
    align-self: stretch;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 0.3rem;
  }
  .lt__splice:last-of-type { display: none; }
  .lt__splice-mark {
    width: 1px;
    height: 60%;
    background: repeating-linear-gradient(to bottom,
      color-mix(in srgb, var(--accent) 40%, transparent) 0,
      color-mix(in srgb, var(--accent) 40%, transparent) 4px,
      transparent 4px, transparent 9px);
  }
}

/* 膠卷尾端封口 */
.lt__end { display: none; }
@media (min-width: 1024px) {
  .lt__end {
    flex: 0 0 auto;
    width: clamp(110px, 11vw, 170px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.9rem;
    padding-left: 1.5rem;
    border-left: 1px solid color-mix(in srgb, var(--accent) 16%, transparent);
    user-select: none;
  }
  .lt__end-kana {
    font-family: var(--world-display, 'Noto Serif JP', serif);
    font-size: 3.4rem;
    font-weight: 200;
    color: color-mix(in srgb, var(--accent) 28%, transparent);
    line-height: 1;
  }
  .lt__end-rule {
    width: 1px;
    height: 46px;
    background: color-mix(in srgb, var(--accent) 32%, transparent);
  }
  .lt__end-label {
    font-family: var(--world-mono, ui-monospace, monospace);
    font-size: 0.5rem;
    letter-spacing: 0.3em;
    color: rgba(190, 200, 212, 0.6);
    writing-mode: vertical-rl;
  }
}

@media (prefers-reduced-motion: reduce) {
  .lt__img, .lt__edge, .lt__frame,
  .lt__tick-mark { transition: none; }
}
</style>
