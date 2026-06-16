<template>
  <section
    class="atl"
    aria-labelledby="atl-heading"
  >
    <!--
      i3（act-critic / 製図台の横スクロール年表）：
      回應 Round 2 critic「門很強，但門後仍是部落格地層 —— digital 逐年堆疊格牆」。
      KILL 了頁面舊的 v-for stacked 章節 (其の N / 20XX年電繪作品 → GridWall)。
      取代為一條【横向可拖動的製図台年表】：年份不再上下堆疊（部落格），而是
      左→右鋪在同一張製圖桌上，各年為一欄（年脊 + 作品藍圖格直欄）。
      頂部年尺（year-ruler）= 可點的刻度，點某年把製圖桌平移到該年（呼應門的拖縫 motif，
      但這裡是横向）。使用者主動橫拖 / Shift+滾輪 / 方向鍵 / 點年份 來探索。
      全 user-initiated，無 timer/autoplay。守 prefers-reduced-motion。
      桌機 (lg+) 才橫向；手機降級為直落堆疊（normal scroll，瀏覽不破）。
    -->

    <!--
      i6（act-critic / 門と台を一本の軌に縫う）：
      回應 Round 5 critic next-step「把門下方的年表 grid 整段砍掉，改成從 gate strip
      拖到底界時無縫接續展開該世界完整卷軸——一條軌道貫穿門與內容，消滅 grid／門兩種
      視覺語言並存的斷層」。
      KILL 舊「製図台抬頭」(其自帶 h2『年表を、横に引く』+ sub + 獨立年尺) —— 它在門
      正下方再起一個帶大標題的 section，正是 critic 指的「門驚艷、捲下去秒回部落格」斷層。
      改為一條【縫合條 seam-rail】：細 hairline 軌（非新標題）把門接到內容，年尺刻度
      直接掛在這條軌上，讀作「門的製図台在此延續」而非「新區塊開始」。同時整條軌道
      full-bleed 撐到視窗滿寬，與門同一張 cream 桌面相連，消除「頁中插一張卡」的部落格感。
    -->
    <header class="atl__seam world-enter world-enter-d1">
      <span class="atl__seam-thread" aria-hidden="true"/>
      <span class="atl__seam-label" aria-hidden="true">
        <span class="atl__seam-kanji font-jp">製図台</span>
        <span class="atl__seam-roman">続く · TABLE CONTINUES</span>
      </span>

      <!-- 年尺：掛在縫合軌上的橫向刻度，點某年→製図桌平移到該年 -->
      <nav class="atl__ruler" aria-label="年で移動">
        <button
          v-for="(g, gi) in groups"
          :key="g.eventName"
          type="button"
          class="atl__tick"
          :class="{ 'atl__tick--active': activeYear === gi }"
          :aria-current="activeYear === gi ? 'true' : undefined"
          @click="scrollToYear(gi)"
        >
          <span class="atl__tick-mark" aria-hidden="true"/>
          <span class="atl__tick-year jp-kansuji">{{ g.year }}</span>
          <span class="atl__tick-cnt">{{ g.images.length }}</span>
        </button>
      </nav>

      <span class="atl__seam-count" aria-hidden="true">
        <span class="jp-kansuji">{{ totalCount }}</span> 葉
      </span>
    </header>

    <!-- 製図台：橫向可拖動軌道（桌機）／直落堆疊（手機） -->
    <div
      ref="trackEl"
      class="atl__table"
      role="group"
      :aria-label="`製図台、${groups.length} 年を横スクロールで閲覧`"
      tabindex="0"
      @wheel="onWheel"
      @keydown="onTableKey"
      @pointerdown="onPointerDown"
    >
      <article
        v-for="(g, gi) in groups"
        :key="g.eventName"
        :ref="el => setColRef(gi, el)"
        class="atl__col"
        :data-year-idx="gi"
      >
        <!-- 年脊：縱書年份 + 章碼 + 最強句（取代 stacked 章節 header） -->
        <header class="atl__spine">
          <span class="atl__spine-index">其の {{ kansuji(gi + 1) }}</span>
          <span class="atl__spine-year font-jp" aria-hidden="true">{{ g.year }}</span>
          <span class="atl__spine-meta">
            <span class="atl__spine-cnt jp-kansuji">{{ g.images.length }} 葉</span>
          </span>
          <p v-if="g.strongestLine" class="atl__spine-line font-jp">「{{ g.strongestLine }}」</p>
        </header>

        <!-- 該年作品藍圖格直欄 -->
        <div class="atl__stack">
          <button
            v-for="(item, ii) in g.images"
            :key="item.filename"
            type="button"
            class="atl__cell"
            :aria-label="item.title || '作品'"
            @pointermove="onCellReveal"
            @pointerenter="onCellReveal"
            @pointerleave="onCellRevealLeave"
            @click="$emit('imageClick', item)"
          >
            <picture class="contents">
              <source :srcset="getGridAvifSrcset(item.filename)" :sizes="cellSizes" type="image/avif">
              <source :srcset="getGridImageSrcset(item.filename)" :sizes="cellSizes" type="image/webp">
              <img
                :src="getThumbPath(item.filename, 400)"
                :srcset="getGridImageSrcset(item.filename)"
                :sizes="cellSizes"
                :alt="item.title"
                class="atl__img"
                :loading="gi === 0 && ii < 4 ? 'eager' : 'lazy'"
                decoding="async"
              >
            </picture>
            <!--
              i8（act-critic / 下書き→完成 製図リビール）：繪世界招牌互動。
              每格上覆一層「青焼き下書き」(blueprint line-art underdrawing) ——
              同圖經 invert+contrast 濾鏡化為線稿藍圖。游標在格上左→右移動，
              以 --reveal（0..1，跟隨指標 X）由左向右「擦出」完成稿，像在製図台上
              把描圖紙掀開露出底下上色完稿。純 user-initiated（pointer），無 timer。
              指標離開回到全線稿（下書き靜止態）。aria-hidden（純視覺，原圖已具 alt）。
              觸控/reduced-motion 降級：CSS 隱藏線稿層，直接顯示完成稿（瀏覽不破）。
            -->
            <span class="atl__draft" aria-hidden="true">
              <img
                :src="getThumbPath(item.filename, 400)"
                :srcset="getGridImageSrcset(item.filename)"
                :sizes="cellSizes"
                alt=""
                class="atl__draft-img"
                loading="lazy"
                decoding="async"
              >
              <span class="atl__draft-grid"/>
            </span>
            <span class="atl__seamline" aria-hidden="true"/>
            <span class="atl__plate" aria-hidden="true">{{ plate(gi, ii) }}</span>
            <span class="atl__draft-tag" aria-hidden="true">下書き</span>
            <span class="atl__cap">
              <span class="atl__cap-title font-jp">{{ item.title || '未命名' }}</span>
            </span>
          </button>
        </div>
      </article>

      <!-- 製図桌尾端封口（橫向終點，wabi-sabi 收筆） -->
      <div class="atl__end" aria-hidden="true">
        <span class="atl__end-kana font-jp">繪</span>
        <span class="atl__end-rule"/>
        <span class="atl__end-label">END OF TABLE</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useImagePath } from '~/composables/useImagePath'
import type { GalleryItem } from '~~/shared/types/gallery'

interface YearGroup {
  eventName: string
  year: string
  images: GalleryItem[]
  strongestLine: string | null
}

const props = defineProps<{ groups: YearGroup[] }>()
defineEmits<{ imageClick: [item: GalleryItem] }>()

const { getThumbPath, getGridImageSrcset, getGridAvifSrcset } = useImagePath()

const cellSizes = '(max-width: 1023px) 88vw, 22vw'
const totalCount = computed(() => props.groups.reduce((s, g) => s + g.images.length, 0))

const KANSUJI = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']
function kansuji (n: number): string { return KANSUJI[n] || String(n) }

// 製圖座標格號：A01·02 …（年-序索引，等寬 mono、製圖標註語彙）
function plate (gi: number, ii: number): string {
  return `${String.fromCharCode(65 + (gi % 26))}${String(gi + 1).padStart(2, '0')}·${String(ii + 1).padStart(2, '0')}`
}

// ===== i8：下書き→完成 製図リビール（游標 X 驅動每格擦出完稿） =====
/**
 * 游標在格上移動時，依指標相對 X（0..1）設 --reveal，
 * CSS 用它把上覆的青焼き線稿由左向右裁開、露出完稿。
 * 細指標裝置才有意義（hover）；觸控不觸發 pointermove 連續流，且 CSS 已隱藏線稿層。
 * 無 timer/autoplay；reduced-motion 由 CSS 直接顯示完稿。
 */
function onCellReveal (e: PointerEvent) {
  const el = e.currentTarget as HTMLElement | null
  if (!el) return
  const r = el.getBoundingClientRect()
  if (r.width <= 0) return
  const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
  el.style.setProperty('--reveal', String(x))
}
function onCellRevealLeave (e: PointerEvent) {
  const el = e.currentTarget as HTMLElement | null
  if (el) el.style.setProperty('--reveal', '0')
}

// ===== 橫向製圖桌：拖動 / 滾輪 / 方向鍵 / 年尺跳轉 =====
const trackEl = ref<HTMLElement | null>(null)
const colEls: (HTMLElement | null)[] = []
const activeYear = ref(0)

function setColRef (i: number, el: Element | { $el: Element } | null) {
  colEls[i] = el ? (('$el' in el ? el.$el : el) as HTMLElement) : null
}

function prefersReduced (): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** 桌機橫向佈局時才接管橫向手勢；手機是直落，沿用 normal scroll */
function isHorizontal (): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
}

function scrollToYear (gi: number) {
  const track = trackEl.value
  const col = colEls[gi]
  if (!track || !col) return
  activeYear.value = gi
  const left = col.offsetLeft - 24
  if (isHorizontal()) {
    track.scrollTo({ left, behavior: prefersReduced() ? 'auto' : 'smooth' })
  } else {
    col.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' })
  }
}

/** 垂直滾輪 → 橫向平移製圖桌（桌機）。讓「向下捲」自然變「向右探索年表」。 */
function onWheel (e: WheelEvent) {
  if (!isHorizontal()) return
  const track = trackEl.value
  if (!track) return
  // 已是橫向意圖（trackpad 橫滑）就交給 native；純垂直滾輪才轉橫
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
  const atStart = track.scrollLeft <= 0 && e.deltaY < 0
  const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1 && e.deltaY > 0
  if (atStart || atEnd) return // 邊界放行，讓頁面接著捲
  e.preventDefault()
  track.scrollLeft += e.deltaY
  syncActiveYear()
}

function onTableKey (e: KeyboardEvent) {
  if (!isHorizontal()) return
  if (e.key === 'ArrowRight') { e.preventDefault(); scrollToYear(Math.min(props.groups.length - 1, activeYear.value + 1)) }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); scrollToYear(Math.max(0, activeYear.value - 1)) }
  else if (e.key === 'Home') { e.preventDefault(); scrollToYear(0) }
  else if (e.key === 'End') { e.preventDefault(); scrollToYear(props.groups.length - 1) }
}

// 拖動平移（pointer drag-to-pan，桌機）
let dragging = false
let startX = 0
let startScroll = 0
function onPointerDown (e: PointerEvent) {
  if (!isHorizontal()) return
  // 不攔截作品按鈕點擊：只在拖動位移超閾值才視為 pan
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
    syncActiveYear()
  }
}
function onPointerUp () {
  dragging = false
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
}

/** 依當前 scrollLeft 推算最靠左可視的年欄，更新年尺 active 高亮 */
function syncActiveYear () {
  const track = trackEl.value
  if (!track) return
  const x = track.scrollLeft + 60
  let best = 0
  for (let i = 0; i < colEls.length; i++) {
    const c = colEls[i]
    if (c && c.offsetLeft <= x) best = i
  }
  activeYear.value = best
}

let scrollRaf = 0
function onTrackScroll () {
  cancelAnimationFrame(scrollRaf)
  scrollRaf = requestAnimationFrame(syncActiveYear)
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
.atl {
  position: relative;
  /* i6：full-bleed —— 撐到視窗滿寬，與門同一張桌面相連，消除「頁中插一張卡」的部落格感 */
  width: 100vw;
  max-width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  /* 效能：首屏之下，未捲到前不排版/繪製（含每格雙圖的 draft 疊層），縮小整頁 Layout。 */
  content-visibility: auto;
  contain-intrinsic-size: auto 640px;
}

/* ===== i6：縫合條 seam-rail —— 把門接到內容的一條軌（取代「製図台抬頭」大標題 section） ===== */
.atl__seam {
  position: relative;
  display: flex;
  align-items: center;
  gap: clamp(1rem, 3vw, 2.2rem);
  /* full-bleed 內縮回內容欄寬，但軌本身貫穿 */
  padding: 0.9rem clamp(1.25rem, 4vw, 3rem) 0.7rem;
  /* 縫合軌：一條 hairline 貫穿整條，年尺刻度掛其上 */
  border-bottom: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
}
.atl__seam-thread {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent 0,
    color-mix(in srgb, var(--accent) 40%, transparent) 12%,
    color-mix(in srgb, var(--accent) 40%, transparent) 88%,
    transparent 100%
  );
}
.atl__seam-label {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: baseline;
  gap: 0.7rem;
}
.atl__seam-kanji {
  font-family: var(--world-display, 'Zen Kaku Gothic New', sans-serif);
  font-size: 0.95rem;
  font-weight: var(--world-display-weight, 400);
  letter-spacing: 0.24em;
  color: rgb(68 64 60);
}
:global(.dark) .atl__seam-kanji { color: rgb(231 229 228); }
.atl__seam-roman {
  font-family: var(--world-mono, ui-monospace, monospace);
  font-size: 0.54rem;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--accent);
}
.atl__seam-count {
  flex: 0 0 auto;
  margin-left: auto;
  font-family: var(--world-mono, ui-monospace, monospace);
  font-size: 0.62rem;
  letter-spacing: 0.2em;
  color: rgb(120 113 108);
}
:global(.dark) .atl__seam-count { color: rgb(168 162 158); }
.atl__seam-count .jp-kansuji { color: var(--accent); font-size: 0.92rem; margin-right: 0.15rem; }

@media (max-width: 1023px) {
  /* 手機：縫合條換行收攏，年尺橫滑 */
  .atl__seam { flex-wrap: wrap; gap: 0.6rem 1.2rem; padding-bottom: 0.5rem; }
  .atl__seam-count { margin-left: 0; }
}

/* ===== 年尺（掛在縫合軌上的橫向刻度導航） ===== */
.atl__ruler {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: flex-end;
  gap: clamp(1rem, 3.2vw, 2.4rem);
  padding: 0.15rem 0 0;
  overflow-x: auto;
  scrollbar-width: none;
}
.atl__ruler::-webkit-scrollbar { display: none; }
@media (max-width: 1023px) {
  .atl__ruler { flex: 1 1 100%; order: 3; }
}
.atl__tick {
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
  color: rgb(120 113 108);
  transition: color 0.3s ease;
}
:global(.dark) .atl__tick { color: rgb(150 144 140); }
.atl__tick:hover { color: var(--accent); }
.atl__tick-mark {
  width: 1px;
  height: 9px;
  background: currentColor;
  opacity: 0.45;
  transition: height 0.3s ease, opacity 0.3s ease;
}
.atl__tick--active { color: var(--accent); }
.atl__tick--active .atl__tick-mark { height: 16px; opacity: 1; }
.atl__tick-year {
  font-family: var(--world-mono, ui-monospace, monospace);
  font-size: 0.92rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.06em;
}
.atl__tick-cnt {
  font-size: 0.55rem;
  letter-spacing: 0.1em;
  opacity: 0.7;
  font-variant-numeric: tabular-nums;
}
.atl__tick:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }

/* ===== 製図台軌道 ===== */
.atl__table {
  position: relative;
  /* 藍圖製圖桌底紋：major + minor 網格（呼應 GridWall 的對齊牆語彙） */
  background:
    linear-gradient(to right, color-mix(in srgb, var(--accent) 5%, transparent) 1px, transparent 1px) 0 0 / 56px 100%,
    linear-gradient(to bottom, color-mix(in srgb, var(--accent) 3.5%, transparent) 1px, transparent 1px) 0 0 / 100% 56px,
    var(--surface);
  border-top: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
}
.atl__table:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }

/* 桌機：橫向軌道（年份左→右並排，KILL stacked 部落格） */
@media (min-width: 1024px) {
  .atl__table {
    display: flex;
    align-items: stretch;
    gap: 0;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 1.5rem 1.5rem 1.75rem;
    scroll-snap-type: x proximity;
    cursor: grab;
    scrollbar-width: thin;
    scrollbar-color: color-mix(in srgb, var(--accent) 40%, transparent) transparent;
  }
  .atl__table:active { cursor: grabbing; }
  .atl__table::-webkit-scrollbar { height: 8px; }
  .atl__table::-webkit-scrollbar-thumb {
    background: color-mix(in srgb, var(--accent) 35%, transparent);
    border-radius: 4px;
  }
}

/* ===== 年欄 ===== */
.atl__col {
  position: relative;
  scroll-snap-align: start;
  padding: 0 1.5rem;
  border-left: 1px solid color-mix(in srgb, var(--accent) 14%, transparent);
  /* perf：把每年一欄設為 layout 邊界 —— 字體/圖片載入逐步 settle 時，
     原本每次都 relayout 整條 ~19000px 製図桌（mount 期 54 次 Layout、1553ms）；
     contain 後單次只重排該欄，進場大幅去卡。 */
  contain: layout;
}
.atl__col:first-child { border-left: none; padding-left: 0.5rem; }

@media (min-width: 1024px) {
  .atl__col {
    flex: 0 0 auto;
    width: clamp(280px, 26vw, 360px);
    display: grid;
    grid-template-rows: auto 1fr;
  }
}
@media (max-width: 1023px) {
  .atl__col {
    border-left: none;
    padding: 0 1rem;
    margin-bottom: 2.5rem;
  }
}

/* 年脊：縱書年份 + 章碼（桌機橫向時是欄頭，手機是 row 章節 header） */
.atl__spine {
  position: relative;
  padding: 0.4rem 0 1rem;
  margin-bottom: 0.6rem;
  border-bottom: 1px solid color-mix(in srgb, var(--accent) 18%, transparent);
}
.atl__spine::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.5rem;
  width: 2px;
  height: 1.4rem;
  background: color-mix(in srgb, var(--accent) 55%, transparent);
}
.atl__spine-index {
  display: block;
  padding-left: 0.7rem;
  font-family: var(--world-mono, ui-monospace, monospace);
  font-size: 0.58rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--accent) 85%, var(--fg-muted));
  margin-bottom: 0.3rem;
}
.atl__spine-year {
  display: block;
  padding-left: 0.7rem;
  font-family: var(--world-display, 'Zen Kaku Gothic New', sans-serif);
  font-size: 2rem;
  font-weight: var(--world-display-weight, 400);
  letter-spacing: 0.04em;
  line-height: 1;
  color: rgb(41 37 36);
}
:global(.dark) .atl__spine-year { color: rgb(231 229 228); }
.atl__spine-meta {
  display: block;
  padding-left: 0.7rem;
  margin-top: 0.35rem;
}
.atl__spine-cnt {
  font-size: 0.62rem;
  letter-spacing: 0.2em;
  color: var(--accent);
}
.atl__spine-line {
  margin: 0.55rem 0 0;
  padding-left: 0.7rem;
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 0.82rem;
  font-weight: 300;
  letter-spacing: 0.04em;
  line-height: 1.65;
  color: rgb(120 113 108);
}
:global(.dark) .atl__spine-line { color: rgb(168 162 158); }

/* 作品藍圖格直欄 */
.atl__stack {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1px;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  align-content: start;
}
@media (min-width: 1024px) {
  .atl__stack { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 1023px) {
  .atl__stack { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 639px) {
  .atl__stack { grid-template-columns: repeat(2, 1fr); }
}

.atl__cell {
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  /* blank-safe 藍圖方格紙底層（未 decode 不留白） */
  background:
    repeating-linear-gradient(
      45deg,
      color-mix(in srgb, var(--accent) 5%, var(--surface)) 0,
      color-mix(in srgb, var(--accent) 5%, var(--surface)) 6px,
      var(--surface) 6px,
      var(--surface) 12px
    );
  transition: box-shadow 0.4s ease;
}
.atl__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.94);
  transition: transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1), filter 0.5s ease;
}
.atl__cell:hover { z-index: 4; box-shadow: 0 8px 24px rgba(28, 25, 23, 0.18); }
.atl__cell:hover .atl__img,
.atl__cell:focus-visible .atl__img { transform: scale(1.06); filter: saturate(1.06); }
.atl__cell:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; z-index: 4; }

/* ===== i8 / j1：下書き→完成 製図リビール =====
   j1 修正（critic / R8 缺陷）：舊版 .atl__draft 預設 opacity 0.9 全覆完稿，靠游標
   --reveal 才左→右擦退，導致「預設只見藍曬下書き、看不到實際作品」。
   反轉為「完稿恆為預設可見、下書き僅 hover 時浮現」：draft 層預設 opacity:0（不覆稿），
   hover 時淡入並由游標 X 擦出右側完稿（保留招牌互動，但默認狀態即見作品）。 */
.atl__cell { --reveal: 0; }
/* 青焼き下書き層：同圖經 invert+灰階+高對比 → 線稿藍圖；以 --reveal 由左向右裁退 */
.atl__draft {
  position: absolute;
  inset: 0;
  z-index: 3;
  overflow: hidden;
  pointer-events: none;
  /* 露出右側完稿：線稿層只保留 0 → (1-reveal) 的左段 */
  clip-path: inset(0 calc(var(--reveal) * 100%) 0 0);
  /* j1：預設不覆稿（完稿可見），hover 才淡入下書き層 */
  opacity: 0;
  transition: clip-path 0.18s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.3s ease;
  /* 青焼き底色（製図 cyanotype） */
  background: #14304a;
}
.atl__cell:hover .atl__draft,
.atl__cell:focus-visible .atl__draft { opacity: 1; }
.atl__draft-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* invert+grayscale+contrast = 線稿；微 hue 偏 cyan，混入藍圖底 */
  filter: grayscale(1) invert(1) contrast(1.5) brightness(0.92) sepia(0.35) hue-rotate(160deg) saturate(2.2);
  mix-blend-mode: screen;
  opacity: 0.9;
}
/* 製図方格紙疊紋 */
.atl__draft-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(180, 214, 240, 0.18) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(180, 214, 240, 0.18) 1px, transparent 1px);
  background-size: 18px 18px;
  mix-blend-mode: screen;
}
/* 顯影縫：線稿與完稿交界的一道光，跟著 --reveal 左→右掃 */
.atl__seamline {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 4;
  left: calc(var(--reveal) * 100%);
  width: 2px;
  margin-left: -1px;
  pointer-events: none;
  background: linear-gradient(to bottom,
    transparent 0,
    color-mix(in srgb, var(--accent) 90%, white) 50%,
    transparent 100%);
  box-shadow: 0 0 6px 1px color-mix(in srgb, var(--accent) 70%, transparent);
  opacity: 0;
  transition: opacity 0.2s ease, left 0.18s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.atl__cell:hover .atl__seamline,
.atl__cell:focus-visible .atl__seamline { opacity: 1; }
/* 「下書き」角標：只在線稿仍主導（指標未推過半）時可見 */
.atl__draft-tag {
  position: absolute;
  z-index: 4;
  bottom: 0.4rem;
  right: 0.45rem;
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 0.52rem;
  letter-spacing: 0.18em;
  color: rgba(200, 224, 244, 0.92);
  text-shadow: 0 1px 2px rgba(8, 24, 40, 0.8);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.25s ease;
}
.atl__cell:hover .atl__draft-tag,
.atl__cell:focus-visible .atl__draft-tag { opacity: calc(0.9 - var(--reveal)); }

/* 觸控/粗指標：無懸停意義 → 隱藏線稿層，直接顯示完稿（瀏覽不破） */
@media (hover: none), (pointer: coarse) {
  .atl__draft, .atl__seamline, .atl__draft-tag { display: none; }
}

.atl__plate {
  position: absolute;
  top: 0.35rem;
  left: 0.4rem;
  z-index: 2;
  font-family: var(--world-mono, ui-monospace, monospace);
  font-size: 0.48rem;
  letter-spacing: 0.12em;
  font-variant-numeric: tabular-nums;
  color: #f5f5f4;
  background: color-mix(in srgb, var(--accent) 78%, rgba(28, 25, 23, 0.55));
  padding: 1px 4px;
  opacity: 0.3;
  transition: opacity 0.3s ease;
}
.atl__cell:hover .atl__plate,
.atl__cell:focus-visible .atl__plate { opacity: 0.92; }

.atl__cap {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  z-index: 5;
  padding: 0.65rem 0.55rem 0.5rem;
  text-align: left;
  color: #f5f5f4;
  background: linear-gradient(to top, rgba(28, 25, 23, 0.86) 0%, rgba(28, 25, 23, 0.16) 60%, transparent 100%);
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.atl__cell:hover .atl__cap,
.atl__cell:focus-visible .atl__cap { opacity: 1; transform: translateY(0); }
.atl__cap-title { font-size: 0.72rem; font-weight: 300; letter-spacing: 0.05em; line-height: 1.3; }

/* 製図桌尾端封口 */
.atl__end {
  display: none;
}
@media (min-width: 1024px) {
  .atl__end {
    flex: 0 0 auto;
    width: clamp(120px, 12vw, 180px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.9rem;
    padding-left: 1.5rem;
    border-left: 1px solid color-mix(in srgb, var(--accent) 14%, transparent);
    user-select: none;
  }
  .atl__end-kana {
    font-family: var(--world-display, 'Zen Kaku Gothic New', sans-serif);
    font-size: 3.5rem;
    font-weight: 200;
    color: color-mix(in srgb, var(--accent) 22%, transparent);
    line-height: 1;
  }
  .atl__end-rule {
    width: 1px;
    height: 48px;
    background: color-mix(in srgb, var(--accent) 30%, transparent);
  }
  .atl__end-label {
    font-family: var(--world-mono, ui-monospace, monospace);
    font-size: 0.5rem;
    letter-spacing: 0.3em;
    color: var(--fg-muted);
    writing-mode: vertical-rl;
  }
}

@media (prefers-reduced-motion: reduce) {
  .atl__img, .atl__plate, .atl__cap,
  .atl__tick-mark { transition: none; }
  /* i8：減動偏好 → 不做擦出動畫，直接呈現完稿（隱藏線稿層與顯影縫） */
  .atl__draft, .atl__seamline, .atl__draft-tag { display: none; }
}
</style>
