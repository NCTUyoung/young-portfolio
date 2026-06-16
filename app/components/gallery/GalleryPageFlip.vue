<template>
  <!--
    j2（act-critic / 翻面：書頁を繰る本物の過場）：
    回應 j1 critic BOLD NEXT STEP「把翻面做成真的『翻頁』：點書口時讓現世界整頁向書脊
    摺起、對向世界由書口展開——一次過場同時呈現兩世界正反面」。

    取代 R9『起算尺 overlay』(GalleryTrackTransition) —— 那是把切軌抽象成「一條尺上移動讀數」，
    critic 與五項標準 #4『翻書隱喻』要的是「看得見的翻面動作」。本元件改播一個 3D 翻頁：
      切到「影」：繪頁（cream 製図紙正面）以書脊為軸向左摺起 → 背面露出影頁（暗房負片）展開。
      切到「繪」：影頁（暗房負片正面）以書脊為軸向右摺起 → 背面露出繪頁（製図紙）展開。
    一張翻動的書頁，正面是離場世界、背面是進場世界，繞中央書脊轉 → 兩世界正反面在同一次
    翻面裡都被看見。中央一條 stone 書脊（gutter）固定，翻頁繞它旋轉。

    全 user-initiated：只由 store.trackTransitionTick bump 觸發（點 tab / 點書口 / 點翻面帶 →
    都走 setSelectedCategory → bump tick）。無 timer / autoplay，不違 hero-static 鐵律（此為 gallery 過場）。
    桌機與手機同一個翻面過場（取代 j1 手機頁尾弱帶）。
    鐵律：stone 書脊骨幹 / accent 僅書脊細光與封口印 / hairline-only 分隔 / 無填色濫用。
    a11y：overlay aria-hidden（純裝飾過場）。prefers-reduced-motion → 退化為極短交叉淡出，不轉 3D。
  -->
  <transition name="pf-fade" @after-leave="onAfterLeave">
    <div
      v-if="active"
      class="pf"
      :class="[`pf--to-${targetIsKai ? 'kai' : 'kage'}`, { 'pf--turning': turning, 'pf--reduced': reduced }]"
      aria-hidden="true"
    >
      <!-- 翻面舞台：以中央書脊為透視原點的對開本 -->
      <div class="pf__book">
        <!-- 進場世界的整頁（停在底層，被翻起的離場頁逐步揭開） -->
        <div class="pf__page pf__page--under" :class="`pf__face--${targetIsKai ? 'kai' : 'kage'}`">
          <PageFlipFace :world="targetIsKai ? 'kai' : 'kage'" side="incoming" />
        </div>

        <!-- 翻動中的書頁：正面=離場世界、背面=進場世界，繞書脊旋轉 -->
        <div class="pf__leaf" :class="`pf__leaf--${targetIsKai ? 'to-kai' : 'to-kage'}`">
          <div class="pf__leaf-face pf__leaf-front" :class="`pf__face--${targetIsKai ? 'kage' : 'kai'}`">
            <PageFlipFace :world="targetIsKai ? 'kage' : 'kai'" side="leaving" />
          </div>
          <div class="pf__leaf-face pf__leaf-back" :class="`pf__face--${targetIsKai ? 'kai' : 'kage'}`">
            <PageFlipFace :world="targetIsKai ? 'kai' : 'kage'" side="incoming-back" />
          </div>
        </div>

        <!-- 中央書脊（gutter）：stone 骨幹 + accent 細光，翻頁繞它轉 -->
        <div class="pf__spine" aria-hidden="true">
          <span class="pf__spine-line"/>
          <span class="pf__spine-seal font-jp">{{ targetIsKai ? '繪' : '影' }}</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, h, ref, watch, defineComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '~/stores/gallery'
import { useImagePath } from '~/composables/useImagePath'
import type { FilterState, GalleryItem } from '~~/shared/types/gallery'

const galleryStore = useGalleryStore()
const { trackTransitionTick, trackTransitionTo, digitalWorks, photographyWorks } = storeToRefs(galleryStore)
const { getThumbPath } = useImagePath()

const active = ref(false)
const turning = ref(false)
const reduced = ref(false)
const targetCategory = ref<FilterState['selectedCategory']>('photography')
const targetIsKai = computed(() => targetCategory.value === 'digital')

function yearOf (item: GalleryItem): number {
  const t = item.time || item.event?.name || ''
  const m = String(t).match(/(\d{4})/)
  return m ? Number(m[1]) : 0
}
const kaiLeaves = computed<GalleryItem[]>(() =>
  digitalWorks.value.slice().sort((a, b) => yearOf(b) - yearOf(a)).slice(0, 4)
)
const kageLeaves = computed<GalleryItem[]>(() =>
  photographyWorks.value.slice().sort((a, b) => yearOf(b) - yearOf(a)).slice(0, 4)
)
const kaiCount = computed(() => digitalWorks.value.length)
const kageCount = computed(() => photographyWorks.value.length)

/**
 * 翻面頁面（一面之內容）。繪=製図紙 cream + 藍圖縮圖；影=暗房負片 dark + 齒孔縮圖。
 * 純裝飾過場面（aria-hidden 由 overlay 承擔），縮圖只露頁緣感、不需 alt。
 */
const PageFlipFace = defineComponent({
  props: {
    world: { type: String as () => 'kai' | 'kage', required: true },
    side: { type: String, default: 'incoming' }
  },
  setup (p) {
    return () => {
      const isKai = p.world === 'kai'
      const leaves = isKai ? kaiLeaves.value : kageLeaves.value
      const kana = isKai ? '繪' : '影'
      const roman = isKai ? 'DRAFTING ROOM' : 'DARKROOM'
      const sub = isKai ? '製図室' : '暗室'
      const count = isKai ? kaiCount.value : kageCount.value
      const unit = isKai ? '葉' : '枚'
      return h('div', { class: ['pff', `pff--${p.world}`] }, [
        h('span', { class: 'pff__texture', 'aria-hidden': 'true' }),
        h('span', { class: ['pff__kana', 'font-jp'], 'aria-hidden': 'true' }, kana),
        h('div', { class: 'pff__copy' }, [
          h('span', { class: 'pff__eyebrow' }, roman),
          h('span', { class: ['pff__title', 'font-jp'] }, sub),
          h('span', { class: 'pff__count' }, `${count} ${unit}`)
        ]),
        h('div', { class: 'pff__leaves', 'aria-hidden': 'true' },
          leaves.map((item, i) =>
            h('span', { key: item.filename, class: 'pff__leaf', style: { '--i': i } }, [
              h('img', {
                src: getThumbPath(item.filename, 400),
                alt: '',
                class: 'pff__leaf-img',
                loading: 'lazy',
                decoding: 'async',
                draggable: 'false'
              })
            ])
          )
        )
      ])
    }
  }
})

const prefersReducedMotion = () =>
  typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let holdTimer: number | null = null

function play (category: FilterState['selectedCategory']) {
  targetCategory.value = category
  reduced.value = prefersReducedMotion()
  active.value = true
  turning.value = false
  if (holdTimer !== null) window.clearTimeout(holdTimer)

  if (reduced.value) {
    // 退化：短交叉淡出，不轉 3D
    turning.value = true
    holdTimer = window.setTimeout(() => { active.value = false; holdTimer = null }, 220)
    return
  }

  // 下一幀掛上 turning → 觸發 CSS rotateY 翻頁；翻完短暫停留後整層淡出。
  requestAnimationFrame(() => requestAnimationFrame(() => { turning.value = true }))
  holdTimer = window.setTimeout(() => { active.value = false; holdTimer = null }, 1100)
}

function onAfterLeave () { turning.value = false }

watch(trackTransitionTick, (tick, prev) => {
  if (typeof window === 'undefined') return
  if (!tick || tick === prev) return
  play(trackTransitionTo.value)
})

defineExpose({ play })
</script>

<style scoped>
/* ===== 翻面 overlay 舞台 ===== */
.pf {
  position: fixed;
  inset: 0;
  z-index: 1120;
  pointer-events: none;
  display: flex;
  align-items: stretch;
  justify-content: center;
  /* 極淡米/墨幕：讓翻動的書頁成為焦點，暗示「同一本書在翻面」 */
  /* 效能：移除 backdrop-filter blur —— 過場時這是滿屏 3D 幕，每幀重新光柵化整頁背景，
     是 pagereveal/tap 卡頓主因之一。改用近不透明純色幕。 */
  background: rgb(248 246 242 / 0.95);
}
:global(.dark) .pf { background: rgb(20 18 17 / 0.95); }

/* 對開本：以中央書脊為 3D 透視原點 */
.pf__book {
  position: relative;
  width: 100%;
  height: 100%;
  perspective: 2200px;
  perspective-origin: 50% 50%;
  overflow: hidden;
}

/* 共同：滿屏一頁 */
.pf__page,
.pf__leaf-face {
  position: absolute;
  inset: 0;
  overflow: hidden;
  backface-visibility: hidden;
}

/* 進場世界底頁（被翻起的離場頁逐步揭開） */
.pf__page--under { z-index: 1; }

/* 翻動書頁：占滿屏，繞中央書脊（左/右緣）旋轉 */
.pf__leaf {
  position: absolute;
  inset: 0;
  z-index: 3;
  transform-style: preserve-3d;
  will-change: transform;
  transition: transform 0.92s cubic-bezier(0.55, 0.06, 0.3, 1);
}
/* 切到繪：影頁（正面）以右側書脊為軸向右摺起 → 背面繪頁展開 */
.pf--to-kai .pf__leaf { transform-origin: right center; transform: rotateY(0deg); }
.pf--to-kai.pf--turning .pf__leaf { transform: rotateY(-178deg); }
/* 切到影：繪頁（正面）以左側書脊為軸向左摺起 → 背面影頁展開 */
.pf--to-kage .pf__leaf { transform-origin: left center; transform: rotateY(0deg); }
.pf--to-kage.pf--turning .pf__leaf { transform: rotateY(178deg); }

.pf__leaf-back { transform: rotateY(180deg); }

/* 翻頁陰影：翻動時頁面從亮到暗再亮，給「立體頁」的彎折光 */
.pf__leaf-face::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.22) 100%);
  opacity: 0;
  transition: opacity 0.92s ease;
}
.pf--to-kage.pf--turning .pf__leaf-front::after { opacity: 1; }
.pf--to-kai.pf--turning .pf__leaf-front::after {
  background: linear-gradient(270deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.22) 100%);
  opacity: 1;
}

/* ===== 中央書脊（gutter）：stone 骨幹 + accent 細光 ===== */
.pf__spine {
  position: absolute;
  top: 0; bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.pf__spine-line {
  position: absolute;
  top: 0; bottom: 0; left: 50%;
  width: 1px;
  transform: translateX(-50%);
  background: linear-gradient(
    to bottom,
    transparent 0,
    rgb(120 113 108 / 0.5) 12%,
    color-mix(in srgb, var(--accent) 50%, rgb(120 113 108)) 50%,
    rgb(120 113 108 / 0.5) 88%,
    transparent 100%
  );
}
/* 書脊封口印：進場世界印（accent 印台，僅 seal 用色） */
.pf__spine-seal {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.9rem;
  height: 1.9rem;
  font-size: 1rem;
  font-weight: 300;
  color: #f7f5f1;
  background: color-mix(in srgb, var(--accent) 86%, rgb(28 25 23));
  transform: rotate(-3deg);
  box-shadow: 0 2px 10px rgba(28, 25, 23, 0.3);
  opacity: 0;
  transition: opacity 0.5s ease 0.5s, transform 0.5s ease 0.5s;
}
.pf--turning .pf__spine-seal { opacity: 1; transform: rotate(-3deg) scale(1.04); }

/* ===== 單面內容 ===== */
.pff {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
}
.pff--kai { background: linear-gradient(150deg, #f3ede2 0%, #e8dfd0 100%); }
.pff--kage { background: linear-gradient(150deg, #20262c 0%, #14181c 100%); }

.pff__texture { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
.pff--kai .pff__texture {
  background-image:
    linear-gradient(to right, rgba(120,113,108,0.13) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(120,113,108,0.13) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.7;
}
.pff--kage .pff__texture {
  background-image:
    radial-gradient(120% 80% at 80% 16%, rgba(196,96,35,0.16) 0%, transparent 46%),
    radial-gradient(circle at center, rgba(226,232,238,0.5) 0 1.6px, transparent 1.9px);
  background-size: 100% 100%, 11px 19px;
  background-repeat: no-repeat, repeat-y;
  background-position: center, right 8px top;
  opacity: 0.5;
}

/* 巨幅縱書世界字 */
.pff__kana {
  position: absolute;
  top: 44%;
  left: 6%;
  transform: translateY(-50%);
  writing-mode: vertical-rl;
  font-family: var(--world-display, 'Noto Serif JP', serif);
  font-weight: 200;
  line-height: 0.9;
  font-size: clamp(7rem, 22vh, 18rem);
  pointer-events: none;
  z-index: 1;
}
.pff--kai .pff__kana { color: rgba(196,96,35,0.2); }
.pff--kage .pff__kana { color: rgba(226,232,238,0.14); right: 6%; left: auto; }

/* 世界銘 copy */
.pff__copy {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: clamp(1.5rem, 5vw, 4rem);
}
.pff--kage .pff__copy { align-items: flex-end; text-align: right; }
.pff__eyebrow {
  font-size: 0.6rem;
  letter-spacing: 0.36em;
  text-transform: uppercase;
}
.pff--kai .pff__eyebrow { color: var(--accent-700, #a3491f); font-family: var(--world-mono, ui-monospace, monospace); }
.pff--kage .pff__eyebrow { color: rgba(231,184,125,0.95); font-family: 'Noto Serif JP', serif; letter-spacing: 0.42em; }
.pff__title {
  font-family: var(--world-display, 'Noto Serif JP', serif);
  font-size: clamp(2.4rem, 6vw, 4rem);
  font-weight: 200;
  line-height: 1.05;
  letter-spacing: 0.1em;
}
.pff--kai .pff__title { color: rgb(41 37 36); }
.pff--kage .pff__title { color: #f3f0eb; }
.pff__count {
  font-family: var(--world-mono, ui-monospace, monospace);
  font-size: 0.7rem;
  letter-spacing: 0.2em;
}
.pff--kai .pff__count { color: rgb(120 113 108); }
.pff--kage .pff__count { color: rgba(206,214,224,0.85); }

/* 頁緣縮圖排（書側露出的頁口感） */
.pff__leaves {
  position: relative;
  z-index: 2;
  display: flex;
  gap: 2px;
  padding: 0 clamp(1.5rem, 5vw, 4rem) clamp(1.2rem, 4vw, 3rem);
}
.pff__leaf {
  flex: 0 0 auto;
  width: clamp(64px, 12vw, 132px);
  aspect-ratio: 4 / 5;
  overflow: hidden;
}
.pff--kai .pff__leaf { border: 1px solid rgba(120,113,108,0.3); }
.pff--kage .pff__leaf { border: 1px solid rgba(154,173,197,0.22); }
.pff__leaf-img { width: 100%; height: 100%; object-fit: cover; }
.pff--kai .pff__leaf-img { filter: saturate(0.92) contrast(1.02); }
.pff--kage .pff__leaf-img { filter: saturate(0.85) contrast(1.04) brightness(0.92); }

/* ===== overlay 整層淡入淡出 ===== */
.pf-fade-enter-active { transition: opacity 0.28s ease; }
.pf-fade-leave-active { transition: opacity 0.45s ease; }
.pf-fade-enter-from,
.pf-fade-leave-to { opacity: 0; }

/* ===== 手機：書頁略縮、字級降，沿用同一翻面（取代 j1 頁尾弱帶） ===== */
@media (max-width: 640px) {
  .pf__book { perspective: 1400px; }
  .pff__kana { font-size: clamp(5rem, 30vw, 9rem); }
  .pff__leaf { width: clamp(56px, 22vw, 90px); }
}

/* ===== reduced-motion：退化為極短交叉淡出，不轉 3D ===== */
@media (prefers-reduced-motion: reduce) {
  .pf__leaf { transition: opacity 0.18s linear !important; }
  .pf--to-kai .pf__leaf,
  .pf--to-kage .pf__leaf { transform: none !important; }
  .pf--reduced.pf--turning .pf__leaf { opacity: 0; }
  .pf__leaf-face::after,
  .pf__spine-seal { transition: none !important; }
}
.pf--reduced .pf__leaf { transition: opacity 0.18s linear; backface-visibility: visible; }
.pf--reduced.pf--turning .pf__leaf { opacity: 0; }
.pf--reduced .pf__leaf-back { display: none; }
</style>
