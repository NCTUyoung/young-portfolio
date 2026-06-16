<template>
  <section
    v-if="years.length > 0"
    class="relative max-w-7xl mx-auto px-2 sm:px-6 mt-2 mb-10 lg:mb-14"
    aria-labelledby="digital-intro-heading"
  >
    <!--
      R3（act-critic galleryWorlds）：繪世界「鎮場格牆 hero-row」領銜。
      回應 Round 2 critic next-step:「繪首屏置頂一張鎮場格牆 hero-row（首訪 3 秒見方格），
      並把章節 chips 收進 hover」。

      上一版 intro 是全文字（縦書「繪」+ Statement + By-Year chips）→ 世界圖像承諾遲到。
      新版把製圖格牆的「方格語言」直接抬到第一屏：一條等寬方格 hero-row 橫貫，
      訪客 3 秒內就看見繪世界的版面骨架（嚴格方格 + 藍圖溝縫 + 製圖標牌），
      文字 Statement 退為格牆右上的「圖說」，年表 chips 收進 hover 才展開的抽屜。

      與 photography 的割面 gateway（先割面對峙 → 顯影地圖）刻意分歧：
        繪 = 一進站就是「對齊牆」的方格秩序感
        影 = 一進站是割面對峙的張力 + 顯影地圖的探索感
    -->

    <!-- 製圖格牆 hero-row：頂置等寬方格，世界圖像承諾即刻兌現 -->
    <div ref="rowEl" class="digw-hero" :class="{ 'digw-hero--in': inView }" aria-hidden="true">
      <div class="digw-hero__rail">
        <div
          v-for="(item, i) in heroCells"
          :key="item.filename"
          class="digw-hero__cell"
          :style="cellStyle(i)"
        >
          <picture class="contents">
            <source :srcset="getGridImageSrcset(item.filename)" sizes="(max-width: 639px) 33vw, 16vw" type="image/webp">
            <img
              :src="getThumbPath(item.filename, 400)"
              :srcset="getGridImageSrcset(item.filename)"
              sizes="(max-width: 639px) 33vw, 16vw"
              :alt="item.title || '繪作品'"
              class="digw-hero__img"
              loading="eager"
              decoding="async"
            >
          </picture>
          <span class="digw-hero__plate">{{ plate(i) }}</span>
        </div>
      </div>

      <!-- 格牆右上「圖說」：Statement 退為標註，不再獨佔第一屏 -->
      <div class="digw-hero__legend">
        <p id="digital-intro-heading" class="digw-hero__eyebrow">繪 · Drafting Wall</p>
        <p lang="ja" class="digw-hero__statement font-jp">線と形を、繰り返す。</p>
        <p class="digw-hero__count jp-kansuji">
          <span class="digw-hero__count-num">{{ totalCount }}</span>
          <span class="digw-hero__count-unit">葉 · across {{ years.length }} years</span>
        </p>
      </div>
    </div>

    <!--
      年表抽屜：By-Year chips 收進 details，hover/click 才展開（回應「章節 chips 收進 hover」）。
      summary 不長得像 button（hairline-only），符合 wabi-sabi 克制。
    -->
    <details class="digw-years group mt-5 lg:mt-6">
      <summary class="digw-years__summary">
        <span class="digw-years__line" aria-hidden="true"/>
        <span class="font-jp">年表</span>
        <span class="digw-years__roman">By Year · {{ years.length }}</span>
        <span class="digw-years__chev" aria-hidden="true">⌄</span>
      </summary>
      <ol class="digw-years__list">
        <li
          v-for="entry in years"
          :key="entry.year"
          class="digw-years__item"
        >
          <span class="jp-kansuji digw-years__year">{{ entry.year }}</span>
          <span class="digw-years__cnt">{{ entry.count }}</span>
        </li>
      </ol>
    </details>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '~/stores/gallery'
import { useImagePath } from '~/composables/useImagePath'

const galleryStore = useGalleryStore()
const { digitalWorks } = storeToRefs(galleryStore)
const { getThumbPath, getGridImageSrcset } = useImagePath()

const totalCount = computed(() => digitalWorks.value.length)

/**
 * hero-row 取最新數張作品（time 降序），桌機鋪 6 格、手機 3 格（CSS 控制溢出隱藏）。
 * 純鎮場視覺（aria-hidden），點擊瀏覽仍走下方各年章節的 GalleryDigitalGridWall。
 */
const heroCells = computed(() => {
  return [...digitalWorks.value]
    .sort((a, b) => String(b.time || '').localeCompare(String(a.time || '')))
    .slice(0, 6)
})

// 製圖標牌：A-01、A-02 …（與 GalleryDigitalGridWall.plate 同語彙）
function plate (i: number): string {
  return `A-${String(i + 1).padStart(2, '0')}`
}

// snap-in 階梯延遲
function cellStyle (i: number) {
  return { '--cell-delay': `${i * 0.06}s` } as Record<string, string>
}

const rowEl = ref<HTMLElement | null>(null)
const inView = ref(false)
let io: IntersectionObserver | null = null

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
  }, { rootMargin: '0px 0px -8% 0px' })
  if (rowEl.value) io.observe(rowEl.value)
})

onBeforeUnmount(() => io?.disconnect())

// 把每一張作品的 time（"YYYY Mon DD"）抽出年份並計數，依年降序
const years = computed(() => {
  const counter = new Map<string, number>()
  for (const w of digitalWorks.value) {
    const year = typeof w.time === 'string' ? w.time.slice(0, 4) : ''
    if (!/^\d{4}$/.test(year)) continue
    counter.set(year, (counter.get(year) ?? 0) + 1)
  }
  return Array.from(counter.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => b.year.localeCompare(a.year))
})
</script>

<style scoped>
/* ===== R3：繪世界 hero-row 製圖格牆（鎮場，首屏即見方格） ===== */
.digw-hero {
  position: relative;
  border: 1px solid color-mix(in srgb, var(--accent) 24%, transparent);
  background:
    linear-gradient(to right, color-mix(in srgb, var(--accent) 5%, transparent) 1px, transparent 1px) 0 0 / 16.666% 100%,
    var(--surface);
  padding: 1px;
}
.digw-hero::after {
  content: '';
  position: absolute;
  inset: 5px;
  border: 1px solid color-mix(in srgb, var(--accent) 10%, transparent);
  pointer-events: none;
  z-index: 3;
}

.digw-hero__rail {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: color-mix(in srgb, var(--accent) 14%, transparent);
}
@media (min-width: 640px) { .digw-hero__rail { grid-template-columns: repeat(6, 1fr); } }

.digw-hero__cell {
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  /* R5：cell 底層用極淡藍圖方格紙 skeleton，未 decode 時讀作「製圖中」而非破圖空格
     （回應 Round 4 critic「繪格牆全空白＝沒世界」——blank-safe 底層） */
  background:
    repeating-linear-gradient(
      45deg,
      color-mix(in srgb, var(--accent) 5%, var(--surface)) 0,
      color-mix(in srgb, var(--accent) 5%, var(--surface)) 6px,
      var(--surface) 6px,
      var(--surface) 12px
    );
  /* R5：base 可見（no-JS / 慢 hydration / 快速捲動都不會留白）；
     snap 進場由 .digw-hero--in 的 keyframe（from{opacity:0}）負責，純增強不阻擋顯示 */
  opacity: 1;
  transform: none;
}
/* 手機只露 3 格（第 4-6 格在 grid 第二列，過高 → 隱藏避免兩列） */
@media (max-width: 639px) {
  .digw-hero__cell:nth-child(n+4) { display: none; }
}
.digw-hero--in .digw-hero__cell {
  animation: digw-hero-snap 0.5s cubic-bezier(0.2, 0.9, 0.3, 1) forwards;
  animation-delay: var(--cell-delay, 0s);
}
@keyframes digw-hero-snap {
  from { opacity: 0; transform: translateY(10px) scale(0.985); }
  60%  { opacity: 1; }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.digw-hero__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.92);
  transition: transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1), filter 0.5s ease;
}
.digw-hero__cell:hover .digw-hero__img { transform: scale(1.05); filter: saturate(1.05); }

.digw-hero__plate {
  position: absolute;
  top: 0.35rem;
  left: 0.4rem;
  z-index: 2;
  /* R4：等寬 mono 製圖標牌（與 GridWall 同語彙、與影 serif 對立） */
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
.digw-hero__cell:hover .digw-hero__plate { opacity: 0.9; }

/* 圖說：格牆右上的 statement plate（取代舊全文字第一屏） */
.digw-hero__legend {
  position: absolute;
  top: 0.9rem;
  right: 0.9rem;
  z-index: 4;
  max-width: min(64%, 22rem);
  text-align: right;
  padding: 0.55rem 0.75rem;
  background: color-mix(in srgb, var(--surface) 82%, transparent);
  backdrop-filter: blur(3px);
  border: 1px solid color-mix(in srgb, var(--accent) 14%, transparent);
}
.digw-hero__eyebrow {
  margin: 0;
  font-size: 0.58rem;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: var(--accent);
  /* R4：eyebrow 改等寬 mono，呼應藍圖標題列（影世界 eyebrow 仍 serif） */
  font-family: var(--world-mono, ui-monospace, monospace);
}
.digw-hero__statement {
  margin: 0.35rem 0 0;
  font-size: clamp(0.95rem, 2.4vw, 1.45rem);
  font-weight: 200;
  letter-spacing: 0.28em;
  line-height: 1.5;
  color: rgb(41 37 36);
}
:global(.dark) .digw-hero__statement { color: rgb(245 245 244); }
.digw-hero__count {
  margin: 0.5rem 0 0;
  font-size: 0.62rem;
  letter-spacing: 0.18em;
  color: rgb(120 113 108);
}
:global(.dark) .digw-hero__count { color: rgb(168 162 158); }
.digw-hero__count-num {
  font-family: 'Noto Serif JP', serif;
  font-size: 1.05rem;
  color: var(--accent);
  margin-right: 0.3rem;
}

/* 手機：legend 收窄、移到底部左側避免壓圖太重 */
@media (max-width: 639px) {
  .digw-hero__legend {
    top: auto;
    bottom: 0.6rem;
    right: 0.6rem;
    left: 0.6rem;
    max-width: none;
  }
  .digw-hero__statement { font-size: 1rem; letter-spacing: 0.2em; }
}

/* ===== 年表抽屜（chips 收進 hover/click 展開） ===== */
.digw-years { margin-inline: auto; }
.digw-years__summary {
  cursor: pointer;
  list-style: none;
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  font-size: 0.62rem;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: rgb(120 113 108);
  transition: color 0.3s ease;
}
.digw-years__summary::-webkit-details-marker { display: none; }
.digw-years:hover .digw-years__summary,
.digw-years[open] .digw-years__summary { color: var(--accent); }
.digw-years__line {
  display: inline-block;
  width: 28px;
  height: 1px;
  background: currentColor;
  opacity: 0.5;
  transition: width 0.3s ease;
}
.digw-years:hover .digw-years__line { width: 42px; }
.digw-years__roman { font-size: 0.58rem; opacity: 0.7; }
.digw-years__chev { transition: transform 0.3s ease; }
.digw-years[open] .digw-years__chev { transform: rotate(180deg); }

.digw-years__list {
  margin: 1rem 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem 1.5rem;
  animation: digw-years-in 0.4s ease both;
}
@keyframes digw-years-in {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.digw-years__item { display: inline-flex; align-items: baseline; gap: 0.4rem; }
.digw-years__year {
  font-size: 0.85rem;
  letter-spacing: 0.18em;
  font-weight: 300;
  color: rgb(68 64 60);
}
:global(.dark) .digw-years__year { color: rgb(231 229 228); }
.digw-years__cnt {
  font-size: 0.62rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.1em;
  color: var(--accent);
}

@media (prefers-reduced-motion: reduce) {
  .digw-hero__cell { opacity: 1 !important; transform: none !important; animation: none !important; }
  .digw-hero--in .digw-hero__cell { animation: none !important; }
  .digw-hero__img, .digw-hero__plate { transition: none; }
  .digw-years__list { animation: none; }
  .digw-years__line, .digw-years__chev { transition: none; }
}
</style>
