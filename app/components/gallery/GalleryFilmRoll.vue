<template>
  <!--
    R7→R9（act-critic galleryWorlds loop）：影世界專屬「暗房膠卷接觸印樣」(film contact-roll)。

    與繪 GalleryDigitalGridWall 的「多欄方格矩陣」刻意對立 —— 版面拓樸層的分歧：
      繪 = 多欄等比方格製圖牆（橫向密鋪、直角溝縫、製圖標牌）
      影 = 單欄「近全寬」膠卷流；每格 = 大圖 + 並排 EXIF 故事側欄
           （光圈／快門／ISO／焦段／地點／一句手記），左緣齒孔 sprocket 軌、frame number。

    R9 重做（回應 Round 8 critic「主內容兩世界幾乎同構 + 整頁巨幅死白」）：
      - 膠卷流由 720px 窄欄置中 → max-width 1100px 近全寬，吃滿主欄寬度（消死白第一手段）。
      - 每格從「大圖 + 圖下小字 EXIF」→「大圖 ‖ 右側 EXIF 故事側欄」的雙欄帶狀版型。
        side-column 把 photographyList.json 既有的 note/exif/location 升級成常駐顯影手記，
        讓「橫向帶狀單欄縱捲」的版面骨架本身成為一眼辨識影世界的第一信號。
      - 桌機：影像佔左約 62%、EXIF 故事欄佔右約 38%（交替左右像膠卷正反面）。
        手機：側欄落到圖下（單欄自然滿幅）。

    每格 develop-in 逐格進場（顯影盤液體緩顯），守 prefers-reduced-motion（見下方 @media）。
  -->
  <div ref="rootEl" class="film-roll">
    <!--
      R6（act-critic galleryWorlds 跳層）：影世界改「真 scroll-driven 過片」閱讀機制。
      回應 Round 5 critic next-step：影做 scroll-driven 膠卷（IntersectionObserver 逐格
      develop-in + 進度齒孔軌），讓「怎麼讀」而非只「長什麼樣」與繪分家。

      與舊版差異（這是本輪結構性大改）：
        舊：單一 IO 命中 root 一次 → 全卷同時 develop（其實是 entrance，不是 scroll-driven）
        新：每格各自一個 IO，捲到才逐格顯影（develop-in-place），像底片一格一格過顯影盤；
            左緣常駐「過片進度齒孔軌」(winding rail) 隨捲動填滿，顯示讀到整卷第幾格。
      繪世界 GridWall 對立保留 grid-snap entrance + 新增方向鍵導航（兩世界閱讀互動分家）。
    -->
    <!--
      過片進度齒孔軌（winding progress rail）：sticky 在膠卷左緣，
      隨捲動進度填滿暖色，像膠卷一格格被捲過顯影。純裝飾、aria-hidden、
      prefers-reduced-motion 下進度條改瞬移不平滑（仍可用，僅去過渡）。
    -->
    <div class="film-roll__rail" aria-hidden="true">
      <span class="film-roll__rail-track"/>
      <span class="film-roll__rail-fill" :style="{ '--wind': windProgress }"/>
      <span class="film-roll__rail-label">{{ windFrameLabel }}</span>
    </div>

    <!-- 卷頭片導（leader）：膠卷起始的曝光標頭，含卷別與張數 -->
    <div class="film-roll__leader" aria-hidden="true">
      <span class="film-roll__leader-code">KAGE · 400</span>
      <span class="film-roll__leader-ticks"/>
      <span class="film-roll__leader-frames">{{ String(items.length).padStart(2, '0') }} FRAMES</span>
    </div>

    <ol class="film-roll__list">
      <li
        v-for="(image, i) in items"
        :key="image.filename"
        :ref="el => setFrameRef(i, el)"
        class="film-roll__frame"
        :class="{ 'film-roll__frame--flip': i % 2 === 1, 'film-roll__frame--developed': developed[i] }"
      >
        <!-- 左緣齒孔軌（sprocket holes）：純裝飾，定義「這是一卷負片」 -->
        <span class="film-roll__sprockets" aria-hidden="true"/>

        <!-- frame number（負片邊緣序號，影世界用 serif 對比繪 mono） -->
        <span class="film-roll__no" aria-hidden="true">{{ frameNo(i) }}</span>

        <button
          type="button"
          class="film-roll__cell group"
          :aria-label="image.title || '攝影作品'"
          @click="$emit('imageClick', image)"
        >
          <picture class="contents">
            <source :srcset="getGridAvifSrcset(image.filename)" :sizes="cellSizes" type="image/avif">
            <source :srcset="getGridImageSrcset(image.filename)" :sizes="cellSizes" type="image/webp">
            <img
              :src="getThumbPath(image.filename, 800)"
              :srcset="getGridImageSrcset(image.filename)"
              :sizes="cellSizes"
              :alt="image.title"
              class="film-roll__img"
              :loading="i < 3 ? 'eager' : 'lazy'"
              decoding="async"
            >
          </picture>
        </button>

        <!--
          EXIF 故事側欄（常駐，非 hover）：把暗房手記 + 拍攝參數搬到圖旁，
          讓「大圖 ‖ 顯影手記」的橫向帶狀成為影世界的版面骨架。
        -->
        <aside class="film-roll__story">
          <p class="film-roll__story-frame" aria-hidden="true">FRAME {{ frameNo(i) }}</p>
          <h4 class="film-roll__story-title font-jp">{{ image.title || '未命名' }}</h4>

          <p v-if="image.note" class="film-roll__story-note font-jp">{{ image.note }}</p>

          <dl v-if="hasExif(image)" class="film-roll__exif">
            <div v-if="image.aperture" class="film-roll__exif-row">
              <dt>絞り</dt><dd>f/{{ image.aperture }}</dd>
            </div>
            <div v-if="image.shutterSpeed" class="film-roll__exif-row">
              <dt>速度</dt><dd>{{ formatShutterSpeed(image.shutterSpeed) }}</dd>
            </div>
            <div v-if="image.iso" class="film-roll__exif-row">
              <dt>感度</dt><dd>ISO {{ image.iso }}</dd>
            </div>
            <div v-if="image.focalLength" class="film-roll__exif-row">
              <dt>焦点</dt><dd>{{ image.focalLength }}mm</dd>
            </div>
          </dl>

          <p v-if="locationOf(image)" class="film-roll__story-loc">
            <span class="film-roll__story-loc-mark" aria-hidden="true">／</span>{{ locationOf(image) }}
          </p>
        </aside>
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useImagePath } from '~/composables/useImagePath'
import { formatShutterSpeed } from '~/utils/formatters'
import type { GalleryItem } from '~~/shared/types/gallery'

const props = defineProps<{ items: GalleryItem[] }>()
defineEmits<{ imageClick: [item: GalleryItem] }>()

const { getThumbPath, getGridImageSrcset, getGridAvifSrcset } = useImagePath()

// 大圖近全寬：桌機約半幅大圖、手機滿幅
const cellSizes = '(max-width: 767px) 92vw, 680px'

function hasExif (img: GalleryItem): boolean {
  return Boolean(img.aperture || img.shutterSpeed || img.iso || img.focalLength)
}

function locationOf (img: GalleryItem): string | null {
  return img.event?.location || null
}

/**
 * frame number：自檔名抽出近似負片序號（DSC_7030 → 7030），
 * 抽不到就退回索引補零。負片邊緣序號是「這是一卷膠卷」的關鍵信號。
 */
function frameNo (i: number): string {
  const m = props.items[i]?.filename?.match(/(\d{2,5})(?:[-_.]|\.\w+$)/)
  const n = m?.[1]
  return n ? `${n}A` : String(i + 1).padStart(2, '0') + 'A'
}

const rootEl = ref<HTMLElement | null>(null)

/**
 * R6：每格獨立 develop 狀態。捲到該格才顯影（develop-in-place），
 * 而非整卷一次曝光 → 真 scroll-driven 過片閱讀。
 */
const developed = reactive<Record<number, boolean>>({})
const frameEls: (HTMLElement | null)[] = []
function setFrameRef (i: number, el: Element | { $el: Element } | null) {
  if (!el) { frameEls[i] = null; return }
  frameEls[i] = ('$el' in el ? el.$el : el) as HTMLElement
}

let frameIo: IntersectionObserver | null = null
const idxByEl = new WeakMap<Element, number>()

/** 過片進度（0→1）：已顯影格數 / 總格數，驅動左緣 winding rail 填滿 */
const developedCount = ref(0)
const windProgress = computed(() => {
  const n = props.items.length || 1
  return Math.min(1, developedCount.value / n)
})
const windFrameLabel = computed(() => {
  const total = String(props.items.length).padStart(2, '0')
  const cur = String(Math.min(developedCount.value, props.items.length)).padStart(2, '0')
  return `${cur}/${total}`
})

function developAll () {
  props.items.forEach((_, i) => { developed[i] = true })
  developedCount.value = props.items.length
}

onMounted(() => {
  if (typeof window === 'undefined') return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce || typeof IntersectionObserver === 'undefined') {
    developAll()
    return
  }
  frameIo = new IntersectionObserver((entries) => {
    let changed = false
    for (const e of entries) {
      if (!e.isIntersecting) continue
      const i = idxByEl.get(e.target)
      if (i === undefined || developed[i]) continue
      developed[i] = true
      changed = true
      frameIo?.unobserve(e.target)
    }
    if (changed) {
      // 過片進度＝目前已顯影的最高連續格（用已顯影總數近似，單調遞增）
      developedCount.value = Object.values(developed).filter(Boolean).length
    }
  }, { rootMargin: '0px 0px -4% 0px', threshold: 0 })

  // 等一幀讓 :ref 都掛上
  requestAnimationFrame(() => {
    frameEls.forEach((el, i) => {
      if (!el) return
      idxByEl.set(el, i)
      frameIo?.observe(el)
    })
  })
})

onBeforeUnmount(() => frameIo?.disconnect())
</script>

<style scoped>
/* =========================================================
   R9：影世界「暗房膠卷」單欄近全寬橫帶流
   每格 = 大圖 ‖ EXIF 故事側欄，與繪 GridWall 多欄方格矩陣對立
   ========================================================= */
.film-roll {
  position: relative;
  /* R11：移除 1100px 上限 → 吃滿父層 max-w-7xl 全寬，徹底消除右側死白帶
     （回應 Round 10 critic：film-roll 撐滿 max-w-7xl 去掉 1100px 右緣死白）。 */
  width: 100%;
  margin-inline: auto;
  padding: 0;
}

/* =========================================================
   R6：過片進度齒孔軌（winding progress rail）
   sticky 在膠卷左緣，隨捲動逐格顯影而填滿，像底片被捲過顯影盤。
   --wind: 0→1 由 scroll-driven 的已顯影格比例驅動。
   ========================================================= */
.film-roll__rail {
  position: sticky;
  top: 5.5rem;
  float: left;
  margin-left: -0.4rem;
  width: 0.9rem;
  height: 0;       /* float 不佔流式高度，僅作 sticky 軌定位 */
  z-index: 5;
  pointer-events: none;
}
.film-roll__rail-track,
.film-roll__rail-fill {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  border-radius: 1px;
}
.film-roll__rail-track {
  top: 0;
  height: 46vh;
  background: color-mix(in srgb, var(--accent) 14%, transparent);
}
.film-roll__rail-fill {
  top: 0;
  height: calc(46vh * var(--wind, 0));
  background: linear-gradient(to bottom,
    color-mix(in srgb, var(--accent) 78%, transparent),
    color-mix(in srgb, var(--accent) 40%, transparent));
  box-shadow: 0 0 6px color-mix(in srgb, var(--accent) 40%, transparent);
  transition: height 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
/* 進度齒孔點：沿軌等距分佈的小圓孔，像膠卷邊孔 */
.film-roll__rail-track::after {
  content: '';
  position: absolute;
  inset: 0;
  left: -1.5px;
  width: 5px;
  background-image: radial-gradient(circle at center,
    color-mix(in srgb, var(--accent) 30%, transparent) 0 1px, transparent 1.4px);
  background-size: 5px 14px;
  background-repeat: repeat-y;
}
.film-roll__rail-label {
  position: absolute;
  top: calc(46vh + 0.5rem);
  left: 50%;
  transform: translateX(-50%) rotate(90deg);
  transform-origin: center;
  white-space: nowrap;
  font-family: var(--world-mono, ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
  font-size: 0.5rem;
  letter-spacing: 0.18em;
  color: color-mix(in srgb, var(--accent) 70%, var(--fg-muted));
  opacity: 0.7;
}
/* 窄欄/手機：軌道收掉（避免與單欄圖打架），改靠 frame sprockets 表達膠卷感 */
@media (max-width: 1023px) {
  .film-roll__rail { display: none; }
}

/* 卷頭片導 leader */
.film-roll__leader {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0 1rem;
  font-family: var(--world-mono, ui-monospace, monospace);
  font-size: 0.56rem;
  letter-spacing: 0.28em;
  color: color-mix(in srgb, var(--accent) 70%, var(--fg-muted));
  text-transform: uppercase;
}
.film-roll__leader-ticks {
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
.film-roll__leader-code,
.film-roll__leader-frames { white-space: nowrap; opacity: 0.9; }

.film-roll__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  /* 兩格負片之間的 frame gap */
  gap: 2.4rem;
}

/* 一格負片 = sprocket軌 + [大圖 ‖ EXIF 故事側欄] */
.film-roll__frame {
  position: relative;
  padding-left: 1.85rem;   /* 留給左緣齒孔軌 */
  /* R9：橫向帶狀雙欄 — 大圖 62% ‖ 故事欄 38% */
  display: grid;
  grid-template-columns: minmax(0, 62fr) minmax(0, 38fr);
  align-items: stretch;
  gap: 0;
}
/* 偶數格左右翻面，像膠卷正反交替（圖在右、故事在左） */
.film-roll__frame--flip {
  grid-template-columns: minmax(0, 38fr) minmax(0, 62fr);
}
.film-roll__frame--flip .film-roll__cell { order: 2; }
.film-roll__frame--flip .film-roll__story { order: 1; border-left: 0; border-right: 1px solid color-mix(in srgb, var(--accent) 18%, transparent); text-align: right; }
.film-roll__frame--flip .film-roll__story-note { padding-left: 0; padding-right: 0.7rem; border-left: 0; border-right: 1px solid color-mix(in srgb, var(--accent) 50%, transparent); }
.film-roll__frame--flip .film-roll__exif-row { justify-content: flex-end; }

/*
   R6：每格 scroll-driven develop-in-place。
   未顯影＝降透明 + 模糊 + 去飽和（停在顯影盤裡的未顯影底片）；
   捲到 → .film-roll__frame--developed 過渡到清晰（像液體顯影漸顯）。
   非 entrance keyframe，而是「捲到才一格一格顯影」的逐格反應。
*/
/*
   R9（兩世界進場節奏分家）：影 = 過片橫向滑入（film-wind lateral slide-in）。
   進場主軸由「向上浮起」改為「橫向過片」——未顯影格自齒孔軌側（左）橫推進來，
   翻面格（圖在右）則自右側推入，像膠卷一格格被捲過光桌。
   保留顯影模糊/去飽和疊在橫向位移上（顯影盤觸感不丟）。
   與繪 GridWall「對角棋盤波（垂直 snap）」的進場軸刻意正交 → 進場節奏成第五分家維度
   （回應 Round 8 critic：影用 film-strip 橫掃進場）。
*/
.film-roll__frame {
  /* 未顯影＝半透＋淺模糊去飽和（停在顯影盤裡），但不至於消失成死白；
     R6 修：原 0.18/blur7 過淡，快速捲動截圖時半顯影格讀成死白。改 0.5/blur4。 */
  opacity: 0.5;
  filter: blur(4px) saturate(0.6) brightness(0.96);
  /* R9：橫向過片位移（自左齒孔側推入）；翻面格覆寫為自右推入 */
  transform: translateX(-3.2rem);
  transition:
    opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1),
    filter 0.85s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity, filter;
}
/* 翻面格（圖在右、故事在左）改自右側過片進來，呼應膠卷正反交替 */
.film-roll__frame--flip {
  transform: translateX(3.2rem);
}
.film-roll__frame--developed,
.film-roll__frame--flip.film-roll__frame--developed {
  opacity: 1;
  filter: blur(0) saturate(1) brightness(1);
  transform: translateX(0);
}

/* 左緣齒孔軌：膠卷 sprocket holes（等距小圓角方孔） */
.film-roll__sprockets {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 1.05rem;
  pointer-events: none;
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent 7px,
    color-mix(in srgb, var(--accent) 26%, transparent) 7px,
    color-mix(in srgb, var(--accent) 26%, transparent) 16px,
    transparent 16px,
    transparent 23px
  );
  border-left: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
  border-right: 1px solid color-mix(in srgb, var(--accent) 14%, transparent);
}

/* frame number：負片邊緣序號（serif，與繪 mono 標牌對立） */
.film-roll__no {
  position: absolute;
  left: 2.1rem;
  top: -1.35rem;
  z-index: 3;
  font-family: 'Noto Serif JP', serif;
  font-size: 0.62rem;
  letter-spacing: 0.18em;
  color: color-mix(in srgb, var(--accent) 78%, var(--fg-muted));
  opacity: 0.7;
}

.film-roll__cell {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  margin: 0;
  border: 0;
  cursor: pointer;
  overflow: hidden;
  /* 負片框：細暗邊，像被夾在負片袋裡 */
  outline: 1px solid color-mix(in srgb, var(--accent) 18%, transparent);
  outline-offset: 0;
  background: rgba(20, 24, 27, 0.06);
}
.film-roll__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* 略偏冷、低飽和，像未調色的負片掃描 */
  filter: saturate(0.92) contrast(1.02);
  transition: transform 0.7s cubic-bezier(0.22, 0.61, 0.36, 1), filter 0.6s ease;
}
.film-roll__cell:hover .film-roll__img,
.film-roll__cell:focus-visible .film-roll__img {
  transform: scale(1.02);
  filter: saturate(1.04) contrast(1.04);
}
.film-roll__cell:focus-visible { outline: 2px solid var(--accent); }

/* ===== EXIF 故事側欄（常駐顯影手記） ===== */
.film-roll__story {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.7rem;
  padding: 1.4rem 1.6rem;
  /* 暗房負片袋觸感：極淡冷銀底 + 與圖之間的接縫 */
  background:
    linear-gradient(to bottom, rgba(20, 24, 27, 0.035), rgba(20, 24, 27, 0.015));
  border-left: 1px solid color-mix(in srgb, var(--accent) 18%, transparent);
}
:global(.dark) .film-roll__story {
  background: linear-gradient(to bottom, rgba(154, 173, 197, 0.06), rgba(154, 173, 197, 0.02));
}

.film-roll__story-frame {
  margin: 0;
  font-family: var(--world-mono, ui-monospace, monospace);
  font-size: 0.52rem;
  letter-spacing: 0.26em;
  color: color-mix(in srgb, var(--accent) 70%, var(--fg-muted));
  opacity: 0.8;
}
.film-roll__story-title {
  margin: 0;
  /* R2：影膠卷故事標題用世界字族（Shippori Mincho 文人明體） */
  font-family: var(--world-display, 'Noto Serif JP', 'Source Han Serif TC', serif);
  font-size: 1.05rem;
  font-weight: var(--world-display-weight, 500);
  letter-spacing: 0.1em;
  line-height: 1.5;
  color: rgb(68 64 60);
}
:global(.dark) .film-roll__story-title { color: rgb(231 229 228); }

/* 顯影手記：image.note 常駐（mincho，左緣朱線） */
.film-roll__story-note {
  margin: 0;
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 0.84rem;
  font-weight: 300;
  line-height: 2;
  letter-spacing: 0.04em;
  color: rgb(87 83 78);
  padding-left: 0.7rem;
  border-left: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
}
:global(.dark) .film-roll__story-note { color: rgb(190 184 178); }

/* EXIF 表：絞り／速度／感度／焦点（serif 細體 + tabular nums） */
.film-roll__exif {
  margin: 0.2rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
}
.film-roll__exif-row {
  display: flex;
  align-items: baseline;
  gap: 0.7rem;
  font-family: 'Noto Serif JP', serif;
  font-variant-numeric: tabular-nums;
}
.film-roll__exif-row dt {
  font-size: 0.6rem;
  letter-spacing: 0.22em;
  color: color-mix(in srgb, var(--accent) 60%, var(--fg-muted));
  min-width: 2.6em;
}
.film-roll__exif-row dd {
  margin: 0;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  color: rgb(87 83 78);
}
:global(.dark) .film-roll__exif-row dd { color: rgb(190 184 178); }

.film-roll__story-loc {
  margin: 0.3rem 0 0;
  font-family: 'Noto Serif JP', serif;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  color: rgb(120 113 108);
}
:global(.dark) .film-roll__story-loc { color: rgb(168 162 158); }
.film-roll__story-loc-mark { color: color-mix(in srgb, var(--accent) 70%, transparent); }

/* 手機：齒孔軌收窄、雙欄塌成單欄（圖上故事下，自然滿幅） */
@media (max-width: 767px) {
  .film-roll__frame,
  .film-roll__frame--flip {
    grid-template-columns: 1fr;
    padding-left: 1.25rem;
  }
  .film-roll__frame--flip .film-roll__cell { order: 0; }
  .film-roll__frame--flip .film-roll__story {
    order: 0;
    border-right: 0;
    border-left: 0;
    text-align: left;
  }
  .film-roll__frame--flip .film-roll__story-note {
    padding-right: 0;
    border-right: 0;
    padding-left: 0.7rem;
    border-left: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
  }
  .film-roll__frame--flip .film-roll__exif-row { justify-content: flex-start; }
  .film-roll__sprockets { width: 0.8rem; }
  .film-roll__no { left: 1.45rem; }
  .film-roll__list { gap: 1.6rem; }
  .film-roll__story {
    border-left: 0;
    border-top: 1px solid color-mix(in srgb, var(--accent) 18%, transparent);
    padding: 1rem 0.4rem 0.4rem;
  }
  .film-roll__img { height: auto; }
}

@media (prefers-reduced-motion: reduce) {
  /* reduced-motion：不做逐格顯影，所有格直接清晰（JS 已 developAll）；
     winding rail 仍顯示但去除平滑過渡（瞬移）。 */
  .film-roll__frame,
  .film-roll__frame--developed {
    opacity: 1 !important;
    transform: none !important;
    filter: none !important;
    transition: none !important;
  }
  .film-roll__rail-fill { transition: none !important; }
  .film-roll__img { transition: none; }
}
</style>
