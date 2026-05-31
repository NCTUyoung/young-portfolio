<template>
  <div
    v-if="kai && kage"
    ref="rootRef"
    class="gw"
    :class="`gw--${weightSide}`"
    role="group"
    aria-roledescription="繪と影の分岐（割面ゲートウェイ）"
    aria-label="ギャラリー入口 — 繪か影、境目を引いて道を選ぶ"
  >
    <!-- 段頭：分岐宣言。Featured 的「対置」在這裡升格成「選路」— 不是看，是走哪條。 -->
    <div class="gw__head">
      <p class="gw__eyebrow">
        <span class="gw__eyebrow-kana font-jp">岐</span>
        <span>繪 ↔ 影 · Drag the seam, choose a path</span>
      </p>
      <div class="gw__toggle" role="group" aria-label="重心を選ぶ">
        <button
          type="button"
          class="gw__toggle-btn"
          :class="weightSide === 'kai' && 'is-active'"
          :aria-pressed="weightSide === 'kai'"
          @click="setWeight('kai')"
        >
          <span class="font-jp">繪</span>
          <span class="gw__toggle-cap">Digital</span>
        </button>
        <span class="gw__toggle-sep" aria-hidden="true"/>
        <button
          type="button"
          class="gw__toggle-btn"
          :class="weightSide === 'both' && 'is-active'"
          :aria-pressed="weightSide === 'both'"
          @click="setWeight('both')"
        >
          <span class="font-jp">岐</span>
          <span class="gw__toggle-cap">Both</span>
        </button>
        <span class="gw__toggle-sep" aria-hidden="true"/>
        <button
          type="button"
          class="gw__toggle-btn"
          :class="weightSide === 'kage' && 'is-active'"
          :aria-pressed="weightSide === 'kage'"
          @click="setWeight('kage')"
        >
          <span class="font-jp">影</span>
          <span class="gw__toggle-cap">Photo</span>
        </button>
      </div>
    </div>

    <!--
      割面（split surface）：左繪 / 右影、中央可拖動接縫。
      與 index Featured 的差別：這裡每片是「路口」不是「作品」——
      點擊收重那一側 = 進入 /gallery/<track> 路由。seam 是選路手勢。
    -->
    <div
      class="gw__surface"
      :style="{ '--split': split + '%', '--split-n': split, '--kai-ink': kaiInk, '--kage-ink': kageInk }"
    >
      <!-- 左：繪 路口 -->
      <button
        type="button"
        class="gw__pane gw__pane--kai"
        :aria-label="`繪のギャラリーへ入る（${kaiCount} 葉）`"
        @click="enter('digital')"
      >
        <img :src="getThumbPath(kai.filename, 800)" :alt="kaiEvent" class="gw__img" loading="eager" decoding="async" draggable="false">
        <span class="gw__veil" aria-hidden="true"/>
        <span class="gw__tag gw__tag--kai font-jp" aria-hidden="true">繪</span>
        <span class="gw__cap gw__cap--kai">
          <span class="gw__cap-event font-jp">{{ kaiEvent }}</span>
          <span class="gw__cap-line font-jp">{{ kaiLine }}</span>
          <span class="gw__cap-enter">
            <span class="jp-kansuji">{{ kaiCount }} 葉</span>
            <span class="gw__cap-go" aria-hidden="true">繪へ →</span>
          </span>
        </span>
      </button>

      <!-- 右：影 路口 -->
      <button
        type="button"
        class="gw__pane gw__pane--kage"
        :aria-label="`影のギャラリーへ入る（${kageCount} 葉）`"
        @click="enter('photography')"
      >
        <img :src="getThumbPath(kage.filename, 800)" :alt="kageEvent" class="gw__img" loading="eager" decoding="async" draggable="false">
        <span class="gw__veil" aria-hidden="true"/>
        <span class="gw__tag gw__tag--kage font-jp" aria-hidden="true">影</span>
        <span class="gw__cap gw__cap--kage">
          <span class="gw__cap-event font-jp">{{ kageEvent }}</span>
          <span class="gw__cap-line font-jp">{{ kageLine }}</span>
          <span class="gw__cap-enter">
            <span class="jp-kansuji">{{ kageCount }} 葉</span>
            <span class="gw__cap-go" aria-hidden="true">← 影へ</span>
          </span>
        </span>
      </button>

      <!-- 中央接縫：可拖動分岐點。slider role，鍵盤左右調整。 -->
      <div
        ref="seamRef"
        class="gw__seam"
        role="slider"
        tabindex="0"
        :aria-valuemin="20"
        :aria-valuemax="80"
        :aria-valuenow="Math.round(split)"
        aria-label="繪と影の分岐をドラッグして道を選ぶ"
        @pointerdown="onPointerDown"
        @keydown="onKey"
      >
        <span class="gw__seam-line" aria-hidden="true"/>
        <span class="gw__seam-grip" aria-hidden="true">
          <span class="gw__seam-kanji font-jp">岐</span>
        </span>
      </div>
    </div>

    <p class="gw__foot" aria-hidden="true">
      <span class="gw__foot-line"/>
      <span>境目を引く／重い側をタップで入る</span>
      <span class="gw__foot-line"/>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import type { GalleryItem } from '~~/shared/types/gallery'
import { useGalleryStore } from '~/stores/gallery'
import { useImagePath } from '~/composables/useImagePath'

const { getThumbPath } = useImagePath()
const router = useRouter()

const galleryStore = useGalleryStore()
const { photographyWorks, digitalWorks } = storeToRefs(galleryStore)

const TARGET = 'featured' as const
function featured (works: GalleryItem[]) {
  const f = works.filter(w => Array.isArray(w.series) && w.series.includes(TARGET))
  return f.length ? f : works
}
function yearOf (item: GalleryItem): number {
  const t = item.time || item.event?.name || ''
  const m = String(t).match(/(\d{4})/)
  return m ? Number(m[1]) : 0
}

// 各軌最新代表（featured，否則第一張）— 作為路口封面
const kaiPick = computed(() => featured(digitalWorks.value).slice().sort((a, b) => yearOf(b) - yearOf(a)))
const kagePick = computed(() => featured(photographyWorks.value).slice().sort((a, b) => yearOf(b) - yearOf(a)))
const kai = computed<GalleryItem | null>(() => kaiPick.value[0] ?? null)
const kage = computed<GalleryItem | null>(() => kagePick.value[0] ?? null)

// 路口資料層：事件名 + strongest_line + 葉數（餵 store，非 hardcode）
const kaiEvent = computed(() => kai.value?.event?.name || kai.value?.title || '繪')
const kageEvent = computed(() => kage.value?.event?.name || kage.value?.title || '影')
const kaiLine = computed(() => kai.value?.seriesNarrative?.strongest_line || '一筆ずつ、物語')
const kageLine = computed(() => kage.value?.seriesNarrative?.strongest_line || '光と影の間')
const kaiCount = computed(() => digitalWorks.value.length)
const kageCount = computed(() => photographyWorks.value.length)

const kaiInk = computed(() => kai.value?.seriesNarrative?.palette?.[0] || 'rgb(217 123 46)')
const kageInk = computed(() => kage.value?.seriesNarrative?.palette?.[0] || 'rgb(46 70 102)')

// 分岐位置（% from left）。default 50（對等岐路）。
const split = ref(50)
type Weight = 'kai' | 'both' | 'kage'
const weightSide = computed<Weight>(() => {
  if (split.value <= 38) return 'kage'
  if (split.value >= 62) return 'kai'
  return 'both'
})
function setWeight (w: Weight) {
  split.value = w === 'kai' ? 70 : w === 'kage' ? 30 : 50
}

const rootRef = ref<HTMLElement | null>(null)
const seamRef = ref<HTMLElement | null>(null)

function clamp (v: number) { return Math.max(20, Math.min(80, v)) }

function applyFromPointer (clientX: number, clientY: number) {
  const surface = rootRef.value?.querySelector('.gw__surface') as HTMLElement | null
  if (!surface) return
  const rect = surface.getBoundingClientRect()
  const vertical = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  if (vertical) {
    if (!rect.height) return
    split.value = clamp(((clientY - rect.top) / rect.height) * 100)
  } else {
    if (!rect.width) return
    split.value = clamp(((clientX - rect.left) / rect.width) * 100)
  }
}

function onPointerMove (e: PointerEvent) { applyFromPointer(e.clientX, e.clientY) }
function onPointerUp () {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
}
function onPointerDown (e: PointerEvent) {
  e.preventDefault()
  applyFromPointer(e.clientX, e.clientY)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}
function onKey (e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') { split.value = clamp(split.value - 4); e.preventDefault() }
  else if (e.key === 'ArrowRight') { split.value = clamp(split.value + 4); e.preventDefault() }
  else if (e.key === 'Home') { setWeight('kage'); e.preventDefault() }
  else if (e.key === 'End') { setWeight('kai'); e.preventDefault() }
  else if (e.key === 'Enter' || e.key === ' ') {
    enter(weightSide.value === 'kage' ? 'photography' : 'digital'); e.preventDefault()
  }
}

function enter (track: 'digital' | 'photography') {
  router.push(`/gallery/${track}`)
}
</script>

<style scoped>
.gw { position: relative; }

.gw__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.gw__eyebrow {
  display: inline-flex;
  align-items: baseline;
  gap: 0.7rem;
  font-size: 0.6rem;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: var(--fg-muted);
}
.gw__eyebrow-kana {
  font-size: 1.1rem; letter-spacing: 0.1em; font-weight: 200; color: var(--fg-2);
}

.gw__toggle { display: inline-flex; align-items: stretch; gap: 0.55rem; }
.gw__toggle-btn {
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  background: none; border: none; padding: 0;
  cursor: pointer;
  color: var(--fg-muted);
  opacity: 0.5;
  transition: opacity 0.4s ease, color 0.4s ease;
}
.gw__toggle-btn:hover { opacity: 0.85; }
.gw__toggle-btn.is-active { opacity: 1; color: var(--fg-2); }
.gw__toggle-btn.is-active .font-jp { color: var(--accent); }
.gw__toggle-btn .font-jp { font-size: 0.95rem; font-weight: 200; letter-spacing: 0.08em; line-height: 1; }
.gw__toggle-cap { font-size: 0.5rem; letter-spacing: 0.2em; text-transform: uppercase; white-space: nowrap; }
.gw__toggle-sep { width: 1px; align-self: stretch; min-height: 1rem; background: var(--hairline); }
.gw__toggle-btn:focus-visible { outline: 1px solid var(--accent); outline-offset: 3px; }

.gw__surface {
  position: relative;
  display: flex;
  align-items: stretch;
  height: clamp(340px, 52vh, 520px);
  overflow: hidden;
  background: var(--surface);
  box-shadow: 0 1px 0 0 var(--border);
  user-select: none;
}
.gw__pane {
  position: relative;
  flex: 0 0 auto;
  overflow: hidden;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  transition: flex-basis 0.55s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.gw__pane--kai { flex-basis: var(--split); }
.gw__pane--kage { flex-basis: calc(100% - var(--split)); }

.gw__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.88);
  transition: transform 0.8s ease, filter 0.6s ease;
}
.gw__pane--kai .gw__img { object-position: left center; }
.gw__pane--kage .gw__img { object-position: right center; }
.gw__pane:hover .gw__img,
.gw__pane:focus-visible .gw__img { filter: saturate(1); transform: scale(1.02); }

.gw__veil {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(28,25,23,0.6) 0%, rgba(28,25,23,0.08) 48%, transparent 72%);
  pointer-events: none;
}
.gw--kage .gw__pane--kai .gw__veil,
.gw--kai .gw__pane--kage .gw__veil {
  background: linear-gradient(to top, rgba(28,25,23,0.66) 0%, rgba(28,25,23,0.32) 60%, rgba(28,25,23,0.15) 100%);
}

.gw__pane:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }

.gw__tag {
  position: absolute;
  top: 0.75rem;
  font-size: 0.8rem;
  line-height: 1;
  font-weight: 300;
  color: #f5f5f4;
  background: rgba(28,25,23,0.5);
  padding: 4px 6px;
  backdrop-filter: blur(2px);
}
.gw__tag--kai { left: 0.75rem; }
.gw__tag--kage { right: 0.75rem; }

.gw__cap {
  position: absolute;
  bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  max-width: min(90%, 300px);
  color: #f5f5f4;
  text-align: left;
}
.gw__cap--kai { left: 1rem; }
.gw__cap--kage { right: 1rem; text-align: right; align-items: flex-end; }
.gw__cap-event {
  font-size: 1.05rem;
  letter-spacing: 0.1em;
  line-height: 1.3;
  font-weight: 300;
  text-shadow: 0 1px 6px rgba(0,0,0,0.5);
}
.gw__cap-line {
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  line-height: 1.55;
  font-weight: 300;
  opacity: 0.9;
  text-shadow: 0 1px 6px rgba(0,0,0,0.45);
}
.gw__cap-enter {
  display: inline-flex;
  align-items: baseline;
  gap: 0.7rem;
  margin-top: 0.25rem;
  font-size: 0.58rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  opacity: 0.9;
}
.gw__cap--kage .gw__cap-enter { flex-direction: row-reverse; }
.gw__cap-go {
  letter-spacing: 0.2em;
  font-weight: 400;
  opacity: 0;
  transform: translateY(2px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}
/* 收重那一側的「入る」提示浮現 — 把選路意圖講清楚 */
.gw--kai .gw__pane--kai .gw__cap-go,
.gw--kage .gw__pane--kage .gw__cap-go,
.gw__pane:hover .gw__cap-go,
.gw__pane:focus-visible .gw__cap-go { opacity: 1; transform: translateY(0); }

.gw__seam {
  position: absolute;
  top: 0; bottom: 0;
  left: var(--split);
  width: 40px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: col-resize;
  touch-action: none;
  z-index: 3;
  transition: left 0.55s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.gw__seam:active { transition: none; }
.gw__seam-line {
  position: absolute;
  top: 0; bottom: 0; left: 50%;
  width: 1px;
  transform: translateX(-50%);
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--kai-ink) 70%, transparent) 0%,
    rgba(245,245,244,0.85) 50%,
    color-mix(in srgb, var(--kage-ink) 70%, transparent) 100%
  );
  box-shadow: 0 0 8px color-mix(in srgb, var(--kai-ink) 30%, transparent);
}
.gw__seam-grip {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: var(--bg);
  border: 1px solid var(--border);
  box-shadow: 0 1px 6px rgba(0,0,0,0.18);
}
.gw__seam-kanji {
  writing-mode: vertical-rl;
  font-size: 0.7rem;
  letter-spacing: 0;
  font-weight: 300;
  color: var(--fg-2);
  line-height: 1;
}
.gw__seam:focus-visible { outline: none; }
.gw__seam:focus-visible .gw__seam-grip { outline: 2px solid var(--accent); outline-offset: 3px; }

.gw__foot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  margin-top: 1rem;
  font-size: 0.56rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--fg-muted);
}
.gw__foot-line { width: 32px; height: 1px; background: var(--hairline); }

@media (max-width: 767px) {
  .gw__surface {
    flex-direction: column;
    height: auto;
    --tower: clamp(420px, 80vh, 640px);
  }
  .gw__pane {
    flex: 0 0 auto;
    width: 100%;
    transition: height 0.5s cubic-bezier(0.22, 0.61, 0.36, 1);
  }
  .gw__surface:has(.gw__seam:active) .gw__pane { transition: none; }
  .gw__pane--kai { height: calc(var(--tower) * var(--split-n) / 100); }
  .gw__pane--kage { height: calc(var(--tower) * (100 - var(--split-n)) / 100); }
  .gw__pane--kai .gw__img { object-position: center top; }
  .gw__pane--kage .gw__img { object-position: center bottom; }
  .gw__seam {
    left: 0; right: 0; top: 50%;
    width: auto; height: 40px;
    transform: translateY(-50%);
    cursor: ns-resize;
  }
  .gw__seam-line {
    top: 50%; bottom: auto; left: 0; right: 0;
    width: auto; height: 1px;
    transform: translateY(-50%);
    background: linear-gradient(
      to right,
      color-mix(in srgb, var(--kai-ink) 70%, transparent) 0%,
      rgba(245,245,244,0.85) 50%,
      color-mix(in srgb, var(--kage-ink) 70%, transparent) 100%
    );
  }
  .gw__seam-kanji { writing-mode: horizontal-tb; }
}

@media (prefers-reduced-motion: reduce) {
  .gw__pane, .gw__seam, .gw__img, .gw__cap-go { transition: none; }
}
</style>
