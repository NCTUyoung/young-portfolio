<template>
  <div
    v-if="kai.nodes.length && kage.nodes.length"
    class="fyr"
    role="group"
    aria-roledescription="精選年尺 — 繪と影、起算年からの距離で並べた作品"
    :aria-label="`精選作品年尺：繪は ${kai.startYear} 年から ${kaiSpanYears} 年、影は ${kage.startYear} 年から ${kageSpanYears} 年`"
  >
    <!--
      R10 大改（回應 critic R9 jump-out「敘事在內容裡，不在等待裡」）：
      撤掉題詞見開き的兩片靜態起始年數字，改為「年尺 / Year-Ruler」——
      雙軌作品依各自『距起算第幾年』(store.featuredChronology) 掛在一條共用 0..span 整數年軸上，
      繪 2018→ 走滿八格，影 2024→ 只佔右段兩格，雙主線時間差就是版面上的實體水平距離，首屏即見。
      每個節點帶「第 N 年」角標 = 六/八年尺長駐在內容本身，不靠轉場過場幕。
    -->

    <!-- 繪軌（上）：自左起算，走最長 -->
    <FeaturedYearRulerTrack
      class="fyr__track fyr__track--kai"
      kana="繪"
      roman="Digital Art"
      align="top"
      :start-year="kai.startYear"
      :nodes="kai.nodes"
      :ink="kaiInk"
      to="/gallery/digital"
    />

    <!-- 中央共用年軸：整段刻度 + 起算原點印 -->
    <div class="fyr__axis" aria-hidden="true">
      <span class="fyr__axis-line"/>
      <span
        v-for="t in ticks"
        :key="t.year"
        class="fyr__tick"
        :class="{ 'fyr__tick--major': t.major }"
        :style="{ left: t.pos * 100 + '%' }"
      >
        <span class="fyr__tick-mark"/>
        <span v-if="t.major" class="fyr__tick-year jp-kansuji">{{ t.year }}</span>
      </span>
      <!-- 起算原點脊章「年」：固定在尺最左，提示這是一把時間尺 -->
      <span class="fyr__origin">
        <span class="jp-seal jp-seal--b fyr__origin-seal"><span class="jp-seal-ink">年</span></span>
      </span>
    </div>

    <!-- 影軌（下）：起算晚六年，只佔右段 -->
    <FeaturedYearRulerTrack
      class="fyr__track fyr__track--kage"
      kana="影"
      roman="Photography"
      align="bottom"
      :start-year="kage.startYear"
      :nodes="kage.nodes"
      :ink="kageInk"
      to="/gallery/photography"
    />

    <!-- 尺右端讀數：兩軌走了幾年的對照（敘事收束在數字差，不在轉場） -->
    <p class="fyr__legend">
      <span class="fyr__legend-item">
        <span class="fyr__legend-kana font-jp">繪</span>
        <span class="fyr__legend-num jp-kansuji">{{ kaiSpanYears }}</span>
        <span class="fyr__legend-unit">年</span>
      </span>
      <span class="fyr__legend-sep font-jp" aria-hidden="true">対</span>
      <span class="fyr__legend-item">
        <span class="fyr__legend-kana font-jp">影</span>
        <span class="fyr__legend-num jp-kansuji">{{ kageSpanYears }}</span>
        <span class="fyr__legend-unit">年</span>
      </span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '~/stores/gallery'
import FeaturedYearRulerTrack from '~/components/gallery/FeaturedYearRulerTrack.vue'

const galleryStore = useGalleryStore()
const { featuredChronology, digitalManifesto, photographyManifesto } = storeToRefs(galleryStore)

const origin = computed(() => featuredChronology.value.origin)
const span = computed(() => featuredChronology.value.span)
const kai = computed(() => featuredChronology.value.kai)
const kage = computed(() => featuredChronology.value.kage)

const kaiInk = computed(() => digitalManifesto.value.ink || 'rgb(196 110 58)')
const kageInk = computed(() => photographyManifesto.value.ink || 'rgb(58 86 122)')

// 各軌實際走過的年數（尾節點 yearIndex + 1，最少 1）
const kaiSpanYears = computed(() => (kai.value.nodes.at(-1)?.yearIndex ?? 0) + 1)
const kageSpanYears = computed(() => (kage.value.nodes.at(-1)?.yearIndex ?? 0) + 1)

// 共用年軸刻度：每年一刻，整千／起算年為 major（帶年份）
const ticks = computed(() => {
  const out: { year: number, pos: number, major: boolean }[] = []
  for (let i = 0; i <= span.value; i++) {
    const year = origin.value + i
    out.push({
      year,
      pos: span.value === 0 ? 0 : i / span.value,
      major: i === 0 || i === span.value || year % 2 === 0
    })
  }
  return out
})
</script>

<style scoped>
.fyr {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* 軌與軸的水平內距：留白給 plate 不被裁邊 */
.fyr__track {
  position: relative;
  z-index: 1;
}

/* ── 中央共用年軸 ───────────────────────────────── */
.fyr__axis {
  position: relative;
  height: 2.75rem;
  margin: 0.25rem 0;
}
.fyr__axis-line {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  transform: translateY(-50%);
  background: linear-gradient(to right, transparent, var(--border) 6%, var(--border) 94%, transparent);
}
.fyr__tick {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}
.fyr__tick-mark {
  width: 1px;
  height: 6px;
  background: var(--border);
}
.fyr__tick--major .fyr__tick-mark {
  height: 11px;
  background: color-mix(in srgb, var(--fg-muted) 60%, transparent);
}
.fyr__tick-year {
  position: absolute;
  top: calc(50% + 9px);
  font-size: 0.58rem;
  letter-spacing: 0.16em;
  color: var(--fg-muted);
  font-weight: 400;
  white-space: nowrap;
}
/* 起算原點印（年）釘在最左端 */
.fyr__origin {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translate(-50%, -50%);
}
.fyr__origin-seal {
  width: 1.6rem;
  height: 1.6rem;
  font-size: 0.62rem;
  background: var(--bg);
}

/* ── 右端讀數 ──────────────────────────────────── */
.fyr__legend {
  margin-top: 1.5rem;
  align-self: flex-end;
  display: inline-flex;
  align-items: baseline;
  gap: 0.85rem;
  font-size: 0.62rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--fg-muted);
}
.fyr__legend-item {
  display: inline-flex;
  align-items: baseline;
  gap: 0.3rem;
}
.fyr__legend-kana {
  font-size: 0.85rem;
  letter-spacing: 0.2em;
  color: var(--fg-2);
  font-weight: 300;
}
.fyr__legend-num {
  font-size: 1.1rem;
  color: var(--fg-2);
  font-weight: 300;
  letter-spacing: 0;
}
.fyr__legend-unit { letter-spacing: 0.1em; }
.fyr__legend-sep {
  font-size: 0.7rem;
  color: var(--fg-muted);
  opacity: 0.7;
}

/* ── 手機：尺轉縦向太重，改為兩軌段落式（軸退為兩段之間的細隔） ── */
@media (max-width: 767px) {
  .fyr__axis { height: 1.5rem; }
  .fyr__tick-year { font-size: 0.5rem; }
  .fyr__legend { align-self: center; }
}
</style>
