<template>
  <!--
    R9（act-critic loop）：gallery 層「起算尺」轉場 overlay。
    回應 Round 8 critic next-step：「digital↔photography 切換時加 startYear 時間軸轉場，
    把首屏 ledger 語彙延伸到 gallery 層」。

    跨層大改（非舊 motif 深 5%）：
      - 首屏 Hero 的「双軌起算 ledger」（繪 二〇一八 ─ 六年先行 ─ 影 二〇二四）原本只活在 index 第一屏。
      - 本輪把同一條尺搬到 gallery 路由：當訪客切 tab（繪⇄影），尺從 viewport 中央橫貫，
        中央 gauge marker 沿尺身「滑」到目標軌的起算年，到位後整層淡出露出新類別內容。
      - 切到「影」：marker 自繪(2018)滑向影(2024)，實線追進、dashed 退去（時間往後走）。
      - 切到「繪」：marker 反向滑回 2018，dashed 重新長出（回到「影軌尚未存在」的空白）。
    這把 tab 切換從「離散換頁」變成「在同一條時間尺上移動讀數」，
    雙主線的六年時間差成為每次切軌都會被重新量一次的核心敘事。

    鐵律守門：stone 主軸 / hairline-only 尺身 / accent 僅 gauge 邊與 marker / 軌墨色僅做 kana 描色不填面。
    無自動播放：只由「使用者點 tab」這個 user-initiated 動作觸發（符合 hero-static 鐵律的 user-interaction 例外）。
    a11y：overlay aria-hidden（純裝飾轉場），prefers-reduced-motion 直接跳過動畫只留 120ms 淡出。
  -->
  <transition name="track-xition" @after-leave="onAfterLeave">
    <div
      v-if="active"
      class="track-xition-overlay"
      aria-hidden="true"
    >
      <div class="track-xition-stage">
        <p class="track-xition__eyebrow">起算 · Since</p>

        <div class="track-xition__rail">
          <!-- 左端：繪軌起點（先行軌） -->
          <div
            class="track-xition__node track-xition__node--kai"
            :class="{ 'is-target': targetIsKai }"
          >
            <span class="track-xition__kana font-jp" :style="{ color: kai.ink }">{{ kai.kana }}</span>
            <span class="track-xition__year jp-kansuji">{{ kai.startKansuji }}</span>
            <span class="track-xition__roman">{{ kai.roman }}</span>
          </div>

          <!-- 尺身：實線 + dashed + 沿尺滑動的 gauge marker -->
          <div class="track-xition__span">
            <span class="track-xition__track-base"/>
            <!-- 已度量的實線：寬度由 marker 位置驅動（時間「走過」的那段） -->
            <span class="track-xition__track-walked" :style="{ width: markerPct }"/>
            <!-- 尚未存在的 dashed：marker 之後那段（影軌空白 / 未來） -->
            <span class="track-xition__track-void" :style="{ left: markerPct }"/>

            <!-- 沿尺滑動的量距 marker：寫出目標軌的起算年 + 六年先行 -->
            <span class="track-xition__marker" :style="{ left: markerPct }">
              <span class="track-xition__marker-pin"/>
              <span class="track-xition__marker-badge">
                <span class="track-xition__gauge-num jp-kansuji">{{ trackLedger.gapKansuji }}</span>
                <span class="track-xition__gauge-unit font-jp">年先行</span>
              </span>
            </span>
          </div>

          <!-- 右端：影軌起點（後發軌） -->
          <div
            class="track-xition__node track-xition__node--kage"
            :class="{ 'is-target': !targetIsKai }"
          >
            <span class="track-xition__kana font-jp" :style="{ color: kage.ink }">{{ kage.kana }}</span>
            <span class="track-xition__year jp-kansuji">{{ kage.startKansuji }}</span>
            <span class="track-xition__roman">{{ kage.roman }}</span>
          </div>
        </div>

        <!-- 目標軌宣言：marker 到位後浮現 -->
        <p class="track-xition__decl font-jp" :style="{ '--ink': targetTrack.ink }">
          {{ targetTrack.declaration }}
        </p>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '~/stores/gallery'
import type { FilterState } from '~~/shared/types/gallery'

const galleryStore = useGalleryStore()
const { digitalManifesto, photographyManifesto, trackTransitionTick, trackTransitionTo } = storeToRefs(galleryStore)

const ARABIC_TO_KANSUJI = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'] as const
function toKansuji (n: number): string {
  return String(n).split('').map(d => ARABIC_TO_KANSUJI[Number(d)] ?? d).join('')
}

const trackLedger = computed(() => {
  const kai = digitalManifesto.value
  const kage = photographyManifesto.value
  const lead = kai.startYear <= kage.startYear ? kai : kage
  const late = kai.startYear <= kage.startYear ? kage : kai
  const gap = Math.max(0, late.startYear - lead.startYear)
  return {
    kai: { ...kai, startKansuji: toKansuji(kai.startYear) },
    kage: { ...kage, startKansuji: toKansuji(kage.startYear) },
    gap,
    gapKansuji: toKansuji(gap)
  }
})

const kai = computed(() => trackLedger.value.kai)
const kage = computed(() => trackLedger.value.kage)

const active = ref(false)
const targetCategory = ref<FilterState['selectedCategory']>('photography')
/** 讓 marker 先停在「來源軌」起點，下一幀才移到目標，才看得到沿尺滑動。 */
const settled = ref(false)

const targetIsKai = computed(() => targetCategory.value === 'digital')
const targetTrack = computed(() => (targetIsKai.value ? kai.value : kage.value))

const TARGET_PCT = computed(() => (targetIsKai.value ? '6%' : '94%'))
const ORIGIN_PCT = computed(() => (targetIsKai.value ? '94%' : '6%'))

/**
 * marker 在尺身上的位置（%）。
 * 入場瞬間停在來源軌端點（settled=false），下一幀切到目標端點觸發 1.1s 滑動：
 *   切到「影」→ marker 自繪(2018, 左)滑向影(2024, 右)，時間往後走；
 *   切到「繪」→ marker 自影(2024, 右)滑回繪(2018, 左)，回到「影軌尚未存在」的空白。
 */
const markerPct = computed(() => (settled.value ? TARGET_PCT.value : ORIGIN_PCT.value))

const prefersReducedMotion = () =>
  typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let holdTimer: number | null = null

function play (category: FilterState['selectedCategory']) {
  targetCategory.value = category
  settled.value = false
  active.value = true
  if (holdTimer !== null) window.clearTimeout(holdTimer)

  const reduced = prefersReducedMotion()
  // 下一幀（reduced-motion 跳過滑動）把 marker 移到目標，觸發 CSS width/left transition。
  if (reduced) {
    settled.value = true
  } else {
    requestAnimationFrame(() => requestAnimationFrame(() => { settled.value = true }))
  }

  // marker 滑到位（~1.1s）後短暫停留再淡出；reduced-motion 直接縮短
  const hold = reduced ? 220 : 1700
  holdTimer = window.setTimeout(() => {
    active.value = false
    holdTimer = null
  }, hold)
}

function onAfterLeave () {
  // overlay 離場後不做事；保留 hook 供未來串接 content reveal
}

// 由 store 的 trackTransitionTick 驅動（user-initiated tab 切換才會 bump），初次載入不播。
watch(trackTransitionTick, (tick, prev) => {
  if (typeof window === 'undefined') return
  if (!tick || tick === prev) return
  play(trackTransitionTo.value)
})

defineExpose({ play })
</script>

<style scoped>
.track-xition-overlay {
  position: fixed;
  inset: 0;
  z-index: 1120;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  /* 米色幕：幾乎不透明讓尺成為唯一焦點，僅留極淡底層暗示「同一個 gallery 在換軌」 */
  background: rgb(250 249 246 / 0.985);
  backdrop-filter: blur(6px);
}
:global(.dark) .track-xition-overlay {
  background: rgb(23 21 20 / 0.985);
}

.track-xition-stage {
  width: min(78vw, 40rem);
  padding: 0 1rem;
}

.track-xition__eyebrow {
  font-family: 'Noto Serif JP', serif;
  font-size: 0.6rem;
  letter-spacing: 0.44em;
  text-transform: uppercase;
  text-align: center;
  color: rgb(217 123 46 / 0.9);
  margin: 0 0 1.6rem;
  opacity: 0;
  animation: xition-eyebrow-in 0.5s ease 0.1s forwards;
}
:global(.dark) .track-xition__eyebrow { color: rgb(231 184 125 / 0.9); }

.track-xition__rail {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.9rem;
}

.track-xition__node {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  opacity: 0.42;
  transition: opacity 0.6s ease;
}
.track-xition__node.is-target { opacity: 1; }
.track-xition__node--kage { align-items: flex-end; text-align: right; }

.track-xition__kana {
  font-size: 1.9rem;
  font-weight: 200;
  letter-spacing: 0.12em;
  line-height: 1;
}
.track-xition__year {
  font-family: 'Noto Serif JP', serif;
  font-size: 1rem;
  letter-spacing: 0.26em;
  color: rgb(41 37 36);
  font-weight: 300;
}
:global(.dark) .track-xition__year { color: rgb(245 245 244); }
.track-xition__roman {
  font-family: 'Inter', sans-serif;
  font-size: 0.56rem;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: rgb(120 113 108);
}
:global(.dark) .track-xition__roman { color: rgb(168 162 158); }

/* 尺身：base hairline 全寬，walked 實線從左追進，void dashed 在 marker 後 */
.track-xition__span {
  position: relative;
  height: 2.4rem;
  min-width: 0;
}
.track-xition__track-base,
.track-xition__track-walked,
.track-xition__track-void {
  position: absolute;
  top: 50%;
  height: 0;
}
.track-xition__track-base {
  left: 0;
  right: 0;
  border-top: 1px dashed rgb(168 162 158 / 0.35);
}
.track-xition__track-walked {
  left: 0;
  border-top: 1px solid rgb(168 162 158 / 0.85);
  transition: width 1.1s cubic-bezier(0.22, 1, 0.36, 1);
}
.track-xition__track-void {
  right: 0;
  border-top: 1px dashed rgb(168 162 158 / 0.55);
  transition: left 1.1s cubic-bezier(0.22, 1, 0.36, 1);
}
:global(.dark) .track-xition__track-walked { border-top-color: rgb(168 162 158 / 0.7); }
:global(.dark) .track-xition__track-void { border-top-color: rgb(120 113 108 / 0.6); }

/* 沿尺滑動的 marker */
.track-xition__marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: left 1.1s cubic-bezier(0.22, 1, 0.36, 1);
}
.track-xition__marker-pin {
  width: 1px;
  height: 1.1rem;
  background: rgb(217 123 46 / 0.8);
}
:global(.dark) .track-xition__marker-pin { background: rgb(231 184 125 / 0.75); }
.track-xition__marker-badge {
  margin-top: 0.35rem;
  display: inline-flex;
  align-items: baseline;
  gap: 0.3rem;
  padding: 0.22rem 0.6rem;
  background: rgb(255 255 255 / 0.95);
  border: 1px solid rgb(217 123 46 / 0.55);
  white-space: nowrap;
}
:global(.dark) .track-xition__marker-badge {
  background: rgb(28 25 23 / 0.95);
  border-color: rgb(231 184 125 / 0.5);
}
.track-xition__gauge-num {
  font-family: 'Noto Serif JP', serif;
  font-size: 0.95rem;
  letter-spacing: 0.1em;
  color: rgb(217 123 46);
  line-height: 1;
}
:global(.dark) .track-xition__gauge-num { color: rgb(231 184 125); }
.track-xition__gauge-unit {
  font-size: 0.6rem;
  letter-spacing: 0.28em;
  color: rgb(120 113 108);
}
:global(.dark) .track-xition__gauge-unit { color: rgb(168 162 158); }

/* 目標軌宣言：marker 到位後淡入 */
.track-xition__decl {
  margin: 2.2rem 0 0;
  text-align: center;
  font-size: 0.95rem;
  font-weight: 300;
  letter-spacing: 0.08em;
  line-height: 1.8;
  color: rgb(68 64 60);
  position: relative;
  padding-top: 0.9rem;
  opacity: 0;
  animation: xition-decl-in 0.7s ease 0.7s forwards;
}
:global(.dark) .track-xition__decl { color: rgb(214 211 209); }
.track-xition__decl::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 1.8rem;
  height: 2px;
  background: var(--ink, rgb(217 123 46));
  opacity: 0.7;
}

@keyframes xition-eyebrow-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes xition-decl-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

/* overlay 整層淡入淡出 */
.track-xition-enter-active { transition: opacity 0.35s ease; }
.track-xition-leave-active { transition: opacity 0.5s ease; }
.track-xition-enter-from,
.track-xition-leave-to { opacity: 0; }

@media (max-width: 640px) {
  .track-xition-stage { width: 90vw; }
  .track-xition__kana { font-size: 1.5rem; }
  .track-xition__year { font-size: 0.86rem; letter-spacing: 0.2em; }
  .track-xition__roman { font-size: 0.5rem; letter-spacing: 0.26em; }
  .track-xition__decl { font-size: 0.84rem; }
  .track-xition__rail { gap: 0.7rem; }
  .track-xition__marker-badge { padding: 0.2rem 0.5rem; gap: 0.24rem; }
  .track-xition__gauge-num { font-size: 0.86rem; }
  .track-xition__gauge-unit { font-size: 0.55rem; letter-spacing: 0.22em; }
}

@media (prefers-reduced-motion: reduce) {
  .track-xition__track-walked,
  .track-xition__track-void,
  .track-xition__marker { transition: none; }
  .track-xition__eyebrow,
  .track-xition__decl { animation-duration: 0.12s; animation-delay: 0s; }
  .track-xition-enter-active,
  .track-xition-leave-active { transition: opacity 0.12s linear; }
}
</style>
