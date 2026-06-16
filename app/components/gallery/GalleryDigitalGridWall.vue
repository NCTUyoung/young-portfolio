<template>
  <!--
    R2（galleryWorlds 大改）：繪世界專屬「製圖格牆」(drafting grid wall)。
    回應 Round 1 critic jump-out:「繪走嚴格 grid 對齊牆、影走單欄寬留白直落流，
    讓結構本身分歧」。

    與 photography 的 justified 直落流刻意對立：
      影 = 每列高度齊、寬度依比例浮動（攝影沖印感、橫向呼吸）
      繪 = 嚴格等寬方格 + 藍圖式 hairline 格線溝縫（製圖紙、對齊牆）
    一眼分得出「我在繪的世界」——這是版面骨架層的分歧，不是換底色。

    每格 snap-in 階梯進場（呼應 kai 世界的 grid-snap 語法），
    hover 時方格微抬升 + 露出格號（製圖標註感）。所有動效守 prefers-reduced-motion。
  -->
  <div ref="rootEl" class="dgw" :class="{ 'dgw--in': inView }">
    <!--
      R4：藍圖製圖牆觸感層（回應 Round 3 next-step「格牆改藍圖紙紋＋等寬 mono 製圖字體」）。
      四角註冊套印標記（registration / crop marks）+ 頂緣等寬 mono 刻度尺，
      讓整面牆讀起來像鋪在製圖桌上的工程藍圖，而非通用圖片網格。純裝飾、aria-hidden。
    -->
    <span class="dgw__reg dgw__reg--tl" aria-hidden="true"/>
    <span class="dgw__reg dgw__reg--tr" aria-hidden="true"/>
    <span class="dgw__reg dgw__reg--bl" aria-hidden="true"/>
    <span class="dgw__reg dgw__reg--br" aria-hidden="true"/>
    <div class="dgw__scale" aria-hidden="true">
      <span class="dgw__scale-label">SCALE 1:1</span>
      <span class="dgw__scale-ticks"/>
      <span class="dgw__scale-label">N {{ String(items.length).padStart(2, '0') }}</span>
    </div>
    <!--
      R6（act-critic galleryWorlds 跳層）：繪世界改「方格矩陣鍵盤導航」閱讀機制。
      回應 Round 5 critic next-step：繪做鍵盤/hover 可導航的方格矩陣（hover/聚焦放大鄰格、
      方向鍵跳格），與影世界「scroll-driven 過片」對立 —— 兩世界『怎麼讀』分家：
        影 = 線性向下捲動，一格格顯影（被動順讀）
        繪 = 二維矩陣，方向鍵 ←↑→↓ 在格間跳轉，被導航格 grid-snap 放大、鄰格內縮
             （主動定位，像在製圖桌上挑圖紙）。Enter/Space 開圖。
      grid role + roving tabindex，守 a11y（方向鍵移焦點，Tab 仍可逐格）。
    -->
    <!--
      R9：對角製圖掃線（diagonal ruling sweep）。進場時一道淡朱對角線由左上向右下掃過，
      像製圖師先拉對角基準線、磚塊才沿線落定 → 把「棋盤對角波」的方向講明白。
      純裝飾、aria-hidden、一次性、reduced-motion 下不播。
    -->
    <span class="dgw__rule" aria-hidden="true"/>
    <div
      ref="gridEl"
      class="dgw__grid"
      role="grid"
      :aria-label="`作品方格矩陣，共 ${items.length} 件，可用方向鍵導航`"
      @keydown="onGridKey"
    >
      <button
        v-for="(item, i) in items"
        :key="item.filename"
        :ref="el => setCellRef(i, el)"
        type="button"
        class="dgw__cell group"
        :class="{ 'dgw__cell--active': activeIdx === i }"
        :style="cellStyle(i)"
        :tabindex="activeIdx === i || (activeIdx === -1 && i === 0) ? 0 : -1"
        :aria-label="item.title || '作品'"
        @click="$emit('imageClick', item)"
        @focus="activeIdx = i"
        @mouseenter="activeIdx = i"
        @mouseleave="activeIdx = -1"
      >
        <picture class="contents">
          <source :srcset="getGridAvifSrcset(item.filename)" :sizes="cellSizes" type="image/avif">
          <source :srcset="getGridImageSrcset(item.filename)" :sizes="cellSizes" type="image/webp">
          <img
            :src="getThumbPath(item.filename, 800)"
            :srcset="getGridImageSrcset(item.filename)"
            :sizes="cellSizes"
            :alt="item.title"
            class="dgw__img"
            :loading="i < 8 ? 'eager' : 'lazy'"
            decoding="async"
          >
        </picture>

        <!-- 製圖標註：左上格號（單調等寬數字）— 強化「對齊牆 / 製圖紙」識別 -->
        <span class="dgw__plate" aria-hidden="true">{{ plate(i) }}</span>

        <!-- hover 標題：克制的下緣墨帶 -->
        <span class="dgw__cap">
          <span class="dgw__cap-title font-jp">{{ item.title || '未命名' }}</span>
          <span v-if="item.time" class="dgw__cap-year jp-kansuji">{{ item.time }}</span>
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useImagePath } from '~/composables/useImagePath'
import type { GalleryItem } from '~~/shared/types/gallery'

const props = defineProps<{ items: GalleryItem[] }>()
const emit = defineEmits<{ imageClick: [item: GalleryItem] }>()

const { getThumbPath, getGridImageSrcset, getGridAvifSrcset } = useImagePath()

const cellSizes = '(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw'

const rootEl = ref<HTMLElement | null>(null)
const inView = ref(false)
let io: IntersectionObserver | null = null

// 座標格號：R01·C03 …（製圖紙 row/col 索引感，等寬 mono 呈現，純裝飾）
// 桌機 4 欄為基準產生 grid 座標，呼應「對齊牆」的工程定位語彙
function plate (i: number): string {
  const cols = 4
  const r = Math.floor(i / cols) + 1
  const c = (i % cols) + 1
  return `R${String(r).padStart(2, '0')}·C${String(c).padStart(2, '0')}`
}

// R9（兩世界進場節奏分家）：繪 = 棋盤式對角波（diagonal checkerboard wave）。
// 進場延遲改由「行+列」的反對角帶決定，而非線性 i —— 磚塊沿左上→右下對角線一帶一帶
// snap 落定，像製圖師對角鋪格。與影世界「逐格橫向過片」的線性節奏刻意對立，
// 讓「進場節奏」本身成為第五個分家維度（回應 Round 8 critic）。
// 桌機 4 欄為節奏基準；封頂對角帶數避免長清單末端等太久。
function cellStyle (i: number) {
  const cols = 4
  const r = Math.floor(i / cols)
  const c = i % cols
  const band = Math.min(r + c, 12)       // 反對角帶序號（0,1,1,2,2,2…）
  const step = band * 0.07
  return { '--cell-delay': `${step}s` } as Record<string, string>
}

// ===== R6：方格矩陣鍵盤導航 =====
const gridEl = ref<HTMLElement | null>(null)
const activeIdx = ref(-1)
const cellEls: (HTMLElement | null)[] = []
function setCellRef (i: number, el: Element | { $el: Element } | null) {
  cellEls[i] = el ? (('$el' in el ? el.$el : el) as HTMLElement) : null
}

/** 由實際 grid template 算當前欄數（響應式：手機 2 / 平板 3 / 桌機 4） */
function colCount (): number {
  if (!gridEl.value || typeof window === 'undefined') return 4
  const cols = window.getComputedStyle(gridEl.value).gridTemplateColumns
  const n = cols.split(' ').filter(Boolean).length
  return n > 0 ? n : 4
}

function focusCell (i: number) {
  const clamped = Math.max(0, Math.min(props.items.length - 1, i))
  activeIdx.value = clamped
  cellEls[clamped]?.focus()
}

/** ←↑→↓ 在二維矩陣間跳格；Enter/Space 開圖；Home/End 跳首尾 */
function onGridKey (e: KeyboardEvent) {
  const cols = colCount()
  const cur = activeIdx.value < 0 ? 0 : activeIdx.value
  switch (e.key) {
    case 'ArrowRight': e.preventDefault(); focusCell(cur + 1); break
    case 'ArrowLeft':  e.preventDefault(); focusCell(cur - 1); break
    case 'ArrowDown':  e.preventDefault(); focusCell(cur + cols); break
    case 'ArrowUp':    e.preventDefault(); focusCell(cur - cols); break
    case 'Home':       e.preventDefault(); focusCell(0); break
    case 'End':        e.preventDefault(); focusCell(props.items.length - 1); break
    case 'Enter':
    case ' ':
      if (props.items[cur]) { e.preventDefault(); emit('imageClick', props.items[cur]!) }
      break
  }
}

onMounted(() => {
  if (typeof window === 'undefined') return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce || typeof IntersectionObserver === 'undefined') {
    inView.value = true
    return
  }
  io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        inView.value = true
        io?.disconnect()
        break
      }
    }
  }, { rootMargin: '0px 0px -10% 0px' })
  if (rootEl.value) io.observe(rootEl.value)
})

onBeforeUnmount(() => io?.disconnect())
</script>

<style scoped>
.dgw {
  /* 製圖格牆外框：藍圖式雙線收邊（與 photography 的「無框直落流」對立） */
  position: relative;
  border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
  /* R4：底層藍圖方格紙（major + minor），讓溝縫之外仍透出製圖網格觸感 */
  background:
    linear-gradient(to right, color-mix(in srgb, var(--accent) 7%, transparent) 1px, transparent 1px) 0 0 / 25% 100%,
    linear-gradient(to right, color-mix(in srgb, var(--accent) 3.5%, transparent) 1px, transparent 1px) 0 0 / 6.25% 100%,
    linear-gradient(to bottom, color-mix(in srgb, var(--accent) 3.5%, transparent) 1px, transparent 1px) 0 0 / 100% 14px,
    var(--surface);
  padding: 1px;
  /* 頂緣留出刻度尺空間 */
  padding-top: 1.45rem;
}
.dgw::after {
  /* 內側細框（製圖紙 inset rule） */
  content: '';
  position: absolute;
  inset: 5px;
  top: 1.35rem;
  border: 1px solid color-mix(in srgb, var(--accent) 10%, transparent);
  pointer-events: none;
  z-index: 1;
}

/* R4：四角註冊套印標記（crop / registration marks）——藍圖製圖識別 */
.dgw__reg {
  position: absolute;
  width: 10px;
  height: 10px;
  z-index: 3;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.6s ease 0.2s;
}
.dgw--in .dgw__reg { opacity: 0.55; }
.dgw__reg::before,
.dgw__reg::after {
  content: '';
  position: absolute;
  background: color-mix(in srgb, var(--accent) 60%, transparent);
}
.dgw__reg::before { left: 0; top: 50%; width: 100%; height: 1px; transform: translateY(-50%); }
.dgw__reg::after  { top: 0; left: 50%; height: 100%; width: 1px; transform: translateX(-50%); }
.dgw__reg--tl { top: 3px; left: 3px; }
.dgw__reg--tr { top: 3px; right: 3px; }
.dgw__reg--bl { bottom: 3px; left: 3px; }
.dgw__reg--br { bottom: 3px; right: 3px; }

/* R4：頂緣等寬 mono 刻度尺（dimension rule）— 製圖桌標註語彙 */
.dgw__scale {
  position: absolute;
  top: 0.42rem;
  left: 0.7rem;
  right: 0.7rem;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  pointer-events: none;
  font-family: var(--world-mono, ui-monospace, monospace);
  font-size: 0.5rem;
  letter-spacing: 0.22em;
  color: color-mix(in srgb, var(--accent) 75%, var(--fg-muted));
}
.dgw__scale-label { white-space: nowrap; opacity: 0.85; }
.dgw__scale-ticks {
  flex: 1;
  height: 6px;
  align-self: flex-end;
  /* 等距刻度：每 24px 一道短刻度線，像比例尺 */
  background-image: repeating-linear-gradient(
    to right,
    color-mix(in srgb, var(--accent) 38%, transparent) 0,
    color-mix(in srgb, var(--accent) 38%, transparent) 1px,
    transparent 1px,
    transparent 24px
  );
  background-position: bottom;
  border-bottom: 1px solid color-mix(in srgb, var(--accent) 24%, transparent);
}

/* R9：對角製圖掃線 — 一道淡朱對角線在進場時由左上掃向右下，講明對角鋪格方向 */
.dgw__rule {
  position: absolute;
  inset: 1.45rem 1px 1px;
  z-index: 4;
  pointer-events: none;
  overflow: hidden;
  opacity: 0;
}
.dgw__rule::before {
  content: '';
  position: absolute;
  top: -60%;
  left: -60%;
  width: 70%;
  height: 220%;
  background: linear-gradient(
    to right,
    transparent 0,
    color-mix(in srgb, var(--accent) 38%, transparent) 48%,
    color-mix(in srgb, var(--accent) 60%, transparent) 50%,
    color-mix(in srgb, var(--accent) 38%, transparent) 52%,
    transparent 100%
  );
  transform: rotate(34deg);
  transform-origin: center;
}
.dgw--in .dgw__rule {
  animation: dgw-rule-sweep 0.9s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
@keyframes dgw-rule-sweep {
  0%   { opacity: 0; }
  18%  { opacity: 0.9; }
  100% { opacity: 0; }
}
.dgw--in .dgw__rule::before {
  animation: dgw-rule-slide 0.9s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
@keyframes dgw-rule-slide {
  from { transform: rotate(34deg) translateX(-40%); }
  to   { transform: rotate(34deg) translateX(360%); }
}

.dgw__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  /* 1px 溝縫 + 格線背景 → 像方格紙上的對齊牆 */
  gap: 1px;
  background: color-mix(in srgb, var(--accent) 14%, transparent);
}
@media (min-width: 640px) { .dgw__grid { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 1024px) { .dgw__grid { grid-template-columns: repeat(4, 1fr); } }

.dgw__cell {
  position: relative;
  aspect-ratio: 1 / 1;       /* 嚴格等比方格 — 與 photography 浮動高度對立 */
  overflow: hidden;
  /* R5：blank-safe 底層 — 未 decode 時讀作藍圖方格紙「製圖中」，非破圖空格
     （回應 Round 4 critic「繪格牆全空白＝沒世界」） */
  background:
    repeating-linear-gradient(
      45deg,
      color-mix(in srgb, var(--accent) 5%, var(--surface)) 0,
      color-mix(in srgb, var(--accent) 5%, var(--surface)) 6px,
      var(--surface) 6px,
      var(--surface) 12px
    );
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  /* R5：base 可見（no-JS / 快速捲動不留白）；snap 進場由 .dgw--in 的 keyframe 負責 */
  opacity: 1;
  transform: none;
  transition: transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1), box-shadow 0.4s ease;
}
.dgw--in .dgw__cell {
  animation: dgw-snap 0.5s cubic-bezier(0.2, 0.9, 0.3, 1) backwards;
  animation-delay: var(--cell-delay, 0s);
}
/* R9：棋盤對角波 — 磚塊沿左上→右下對角線方向 snap 落定（往右下推一格 + 縮放），
   配合 cellStyle 的「行+列」帶延遲，整面牆讀作製圖師一帶一帶對角鋪格。
   方向性（左上偏移）讓對角推進可見，而非單純原地浮現。 */
@keyframes dgw-snap {
  from { opacity: 0; transform: translate(-7px, -7px) scale(0.94); }
  55%  { opacity: 1; }
  to   { opacity: 1; transform: translate(0, 0) scale(1); }
}

.dgw__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.94);
  transition: transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1), filter 0.5s ease;
}
.dgw__cell:hover { z-index: 4; box-shadow: 0 8px 24px rgba(28, 25, 23, 0.18); }
.dgw__cell:hover .dgw__img,
.dgw__cell:focus-visible .dgw__img { transform: scale(1.05); filter: saturate(1.05); }
.dgw__cell:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; z-index: 4; }

/*
   R6：方向鍵導航的「被導航格」grid-snap 放大 + 製圖瞄準框。
   active 格抬升、露出十字定位標（製圖桌挑圖紙的瞄準感），
   與影世界線性過片對立：繪是『被定位的一格』，影是『被捲過的一卷』。
*/
.dgw__cell--active {
  z-index: 5;
  box-shadow: 0 10px 30px rgba(28, 25, 23, 0.22);
}
.dgw__cell--active .dgw__img { transform: scale(1.06); filter: saturate(1.06); }
/* 製圖瞄準十字（crosshair）— 僅被導航格出現，強化「定位中」語彙 */
.dgw__cell--active::before,
.dgw__cell--active::after {
  content: '';
  position: absolute;
  z-index: 3;
  background: color-mix(in srgb, var(--accent) 70%, transparent);
  pointer-events: none;
  opacity: 0.75;
}
.dgw__cell--active::before { left: 50%; top: 0; width: 1px; height: 14px; transform: translateX(-50%); box-shadow: 0 calc(100% - 14px) 0 color-mix(in srgb, var(--accent) 70%, transparent); }
.dgw__cell--active::after  { top: 50%; left: 0; height: 1px; width: 14px; transform: translateY(-50%); box-shadow: calc(100% - 14px) 0 0 color-mix(in srgb, var(--accent) 70%, transparent); }
.dgw__cell--active .dgw__plate { opacity: 0.92; }
.dgw__cell--active .dgw__cap { opacity: 1; transform: translateY(0); }

/* 格號標牌：製圖索引座標，等寬 mono、常駐淡顯、hover 提亮 */
.dgw__plate {
  position: absolute;
  top: 0.4rem;
  left: 0.45rem;
  z-index: 2;
  font-family: var(--world-mono, ui-monospace, monospace);
  font-size: 0.5rem;
  letter-spacing: 0.14em;
  font-variant-numeric: tabular-nums;
  color: #f5f5f4;
  background: color-mix(in srgb, var(--accent) 78%, rgba(28, 25, 23, 0.55));
  padding: 2px 5px;
  /* R4：常駐極淡（製圖標註不消失），hover 提亮——觸感比影世界「標」得更死板 */
  opacity: 0.32;
  transform: translateY(0);
  transition: opacity 0.35s ease;
}
.dgw__cell:hover .dgw__plate,
.dgw__cell:focus-visible .dgw__plate { opacity: 0.92; }

.dgw__cap {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.7rem 0.6rem 0.55rem;
  text-align: left;
  color: #f5f5f4;
  background: linear-gradient(to top, rgba(28, 25, 23, 0.86) 0%, rgba(28, 25, 23, 0.18) 60%, transparent 100%);
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.dgw__cell:hover .dgw__cap,
.dgw__cell:focus-visible .dgw__cap { opacity: 1; transform: translateY(0); }
.dgw__cap-title { font-size: 0.78rem; font-weight: 300; letter-spacing: 0.06em; line-height: 1.3; }
.dgw__cap-year { font-size: 0.6rem; letter-spacing: 0.2em; opacity: 0.78; }

@media (prefers-reduced-motion: reduce) {
  .dgw__cell { opacity: 1; transform: none; transition: none; animation: none !important; }
  .dgw--in .dgw__cell { animation: none !important; }
  .dgw__img, .dgw__plate, .dgw__cap, .dgw__reg { transition: none; }
  /* R9：對角掃線在 reduced-motion 下完全不播（裝飾，無資訊損失） */
  .dgw__rule, .dgw--in .dgw__rule, .dgw--in .dgw__rule::before { animation: none !important; opacity: 0 !important; }
  /* reduced-motion 下註冊標記直接顯示（不靠淡入過場） */
  .dgw__reg { opacity: 0.55; }
  /* R6：被導航格仍以瞄準十字＋外框標示（去掉縮放，靠 outline/crosshair 仍可辨位） */
  .dgw__cell--active .dgw__img { transform: none; }
}
</style>
