<template>
  <section
    class="atl"
    aria-labelledby="atl-heading"
  >
    <!--
      museum-r1（act-critic / 製図室を陳列室へ）：
      回應使用者「製図室 分太多 col、圖很小、顯得凌亂；我想要博物館 放畫框的排版感」。
      KILL 了舊【横向可拖動製図台】（年份各為一窄欄、2-col 小方格 + 逐格青焼き下書き疊層）。
      那個版型把每張畫塞進 ~22vw 窄欄裡的小方格，又在每格上覆一張同圖的 invert+mix-blend 線稿層
      （每格雙圖、每格獨立合成層）——既「圖很小、凌亂」，也是 trace 7.3s Layout / 46k UpdateLayer
      的主要效能元兇。
      取代為【美術館掛牆 wall-hang】：縱向捲動，每「年」是一間展間（room placard 章牌），
      其下把作品當「裱框畫」掛在留白牆上——少而大、各帶 mat 襯紙 + hairline 細框 + 落影，
      尺寸依離線預算比例自然錯落（CSS columns masonry，零 CLS、零 JS、無 ResizeObserver）。
      每張畫下一行極簡館藏牌（標題）。無 timer/autoplay；hover 才微浮起＋現館藏資訊。
      wiki: concepts/gallery-wall-salon-hang.md（掛牆沙龍式陳列；本站不旋轉 → 改正掛大留白）。
    -->
    <header class="atl__placard world-enter world-enter-d1">
      <span class="atl__placard-label" aria-hidden="true">
        <span class="atl__placard-kanji font-jp">製図室</span>
        <span class="atl__placard-roman">DRAFTING ROOM</span>
      </span>
      <span class="atl__placard-thread" aria-hidden="true"/>
      <span class="atl__placard-count">
        <span class="jp-kansuji">{{ groups.length }}</span> 章<span class="atl__placard-dot" aria-hidden="true">·</span><span class="jp-kansuji">{{ totalCount }}</span> 点
      </span>
    </header>

    <h2 id="atl-heading" class="sr-only">製図室 — 電繪作品年表陳列</h2>

    <!-- 展間：每「年」一間，縱向排列（KILL 橫向軌道） -->
    <div class="atl__rooms">
      <article
        v-for="(g, gi) in groups"
        :key="g.eventName"
        class="atl__room world-enter world-enter-d2"
      >
        <!-- 展間章牌：其の N + 年 + 点数 + 章首句（取代橫向年脊） -->
        <header class="atl__room-head">
          <span class="atl__room-index">其の {{ kansuji(gi + 1) }}</span>
          <span class="atl__room-year font-jp">{{ g.year }}</span>
          <span class="atl__room-cnt jp-kansuji">{{ g.images.length }} 点</span>
          <span class="atl__room-rule" aria-hidden="true"/>
          <p v-if="g.strongestLine" class="atl__room-line font-jp">「{{ g.strongestLine }}」</p>
        </header>

        <!-- 掛牆：裱框畫 CSS columns masonry（尺寸依比例錯落、留白牆距） -->
        <div class="atl__wall">
          <figure
            v-for="(item, ii) in g.images"
            :key="item.filename"
            class="atl__frame"
          >
            <button
              type="button"
              class="atl__frame-btn group"
              :aria-label="item.title || '作品'"
              @click="$emit('imageClick', item)"
            >
              <span class="atl__frame-mat">
                <picture class="contents">
                  <source :srcset="getGridAvifSrcset(item.filename)" :sizes="frameSizes" type="image/avif">
                  <source :srcset="getGridImageSrcset(item.filename)" :sizes="frameSizes" type="image/webp">
                  <img
                    :src="getThumbPath(item.filename, 800)"
                    :srcset="getGridImageSrcset(item.filename)"
                    :sizes="frameSizes"
                    :alt="item.title"
                    class="atl__img"
                    :style="{ aspectRatio: aspectOf(item) }"
                    :loading="gi === 0 && ii < 2 ? 'eager' : 'lazy'"
                    decoding="async"
                  >
                </picture>
              </span>
            </button>
            <!-- 館藏牌：框下極簡標籤（標題），讀作「牆上的作品說明牌」。
                 figcaption 須為 figure 直屬子，不可包在 button 內（HTML 規範 + 避免 hydration 警告）。 -->
            <figcaption class="atl__plate">
              <span class="atl__plate-no" aria-hidden="true">{{ frameNo(gi, ii) }}</span>
              <span class="atl__plate-title font-jp">{{ item.title || '無題' }}</span>
            </figcaption>
          </figure>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useImagePath } from '~/composables/useImagePath'
import { DEFAULT_ASPECT_RATIO } from '~/utils/justifiedGalleryLayout'
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

// 掛牆：mobile 單欄滿寬、md+ 雙欄（每張畫 ~44vw＝大；KILL「分太多 col、圖很小」）
const frameSizes = '(max-width: 767px) 88vw, 44vw'

const totalCount = computed(() => props.groups.reduce((s, g) => s + g.images.length, 0))

const KANSUJI = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']
function kansuji (n: number): string { return KANSUJI[n] || String(n) }

/** 比例：優先離線預算 aspectRatio（零 CLS、SSR 可重現），缺值退預設避免破版。 */
function aspectOf (img: GalleryItem): string {
  const r = img.aspectRatio && img.aspectRatio > 0 ? img.aspectRatio : DEFAULT_ASPECT_RATIO
  return String(r)
}

/** 館藏牌編號：年序 + 框序（其の二 → 02-03），純展示用，aria-hidden。 */
function frameNo (gi: number, ii: number): string {
  return `${String(gi + 1).padStart(2, '0')}–${String(ii + 1).padStart(2, '0')}`
}
</script>

<style scoped>
.atl {
  position: relative;
  margin-bottom: 1rem;
  /* 效能：首屏之下的展間未捲到前不排版/繪製，縮小整頁 Layout（取代舊 19000px 橫軌的巨幅 relayout）。 */
  content-visibility: auto;
  contain-intrinsic-size: auto 1200px;
}

/* ===== 製図室總章牌（取代舊 seam-rail + 年尺；單一安靜標牌） ===== */
.atl__placard {
  display: flex;
  align-items: baseline;
  gap: clamp(1rem, 3vw, 2.4rem);
  padding: 0.2rem 0 1rem;
  border-bottom: 1px solid color-mix(in srgb, var(--accent) 18%, transparent);
}
.atl__placard-label {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: baseline;
  gap: 0.75rem;
}
.atl__placard-kanji {
  font-family: var(--world-display, 'Zen Kaku Gothic New', sans-serif);
  font-size: clamp(1.1rem, 1.4vw, 1.35rem);
  font-weight: var(--world-display-weight, 400);
  letter-spacing: 0.24em;
  color: rgb(41 37 36);
}
:global(.dark) .atl__placard-kanji { color: rgb(231 229 228); }
.atl__placard-roman {
  font-family: var(--world-mono, ui-monospace, monospace);
  font-size: 0.56rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--accent);
  align-self: center;
}
.atl__placard-thread {
  flex: 1 1 auto;
  height: 1px;
  align-self: center;
  background: linear-gradient(to right, color-mix(in srgb, var(--accent) 28%, transparent), transparent 92%);
}
.atl__placard-count {
  flex: 0 0 auto;
  font-family: var(--world-mono, ui-monospace, monospace);
  font-size: 0.62rem;
  letter-spacing: 0.2em;
  color: rgb(120 113 108);
}
:global(.dark) .atl__placard-count { color: rgb(168 162 158); }
.atl__placard-count .jp-kansuji { color: var(--accent); font-size: 0.92rem; margin: 0 0.1rem; }
.atl__placard-dot { margin: 0 0.5rem; opacity: 0.5; }

/* ===== 展間（每年一間，縱向） ===== */
.atl__rooms {
  display: flex;
  flex-direction: column;
  gap: clamp(3.5rem, 7vw, 6rem);
  padding-top: clamp(2rem, 4vw, 3rem);
}
.atl__room {
  position: relative;
  /* 每間獨立 layout 邊界：字體/圖片 settle 時只重排該間，不牽動整頁。 */
  contain: layout style;
}

.atl__room-head {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.5rem 1.1rem;
  margin-bottom: clamp(1.6rem, 3vw, 2.6rem);
}
.atl__room-index {
  font-family: var(--world-mono, ui-monospace, monospace);
  font-size: 0.58rem;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--accent) 85%, var(--fg-muted));
}
.atl__room-year {
  font-family: var(--world-display, 'Zen Kaku Gothic New', sans-serif);
  font-size: clamp(2rem, 3.4vw, 2.9rem);
  font-weight: var(--world-display-weight, 400);
  letter-spacing: 0.04em;
  line-height: 1;
  color: rgb(41 37 36);
}
:global(.dark) .atl__room-year { color: rgb(231 229 228); }
.atl__room-cnt {
  font-size: 0.62rem;
  letter-spacing: 0.2em;
  color: var(--accent);
  align-self: flex-end;
  padding-bottom: 0.3rem;
}
.atl__room-rule {
  flex: 1 1 4rem;
  min-width: 2rem;
  height: 1px;
  align-self: center;
  background: linear-gradient(to right, color-mix(in srgb, var(--accent) 22%, transparent), transparent);
}
.atl__room-line {
  flex: 0 0 100%;
  margin: 0.3rem 0 0;
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 0.86rem;
  font-weight: 300;
  letter-spacing: 0.06em;
  line-height: 1.7;
  color: rgb(120 113 108);
}
:global(.dark) .atl__room-line { color: rgb(168 162 158); }

/* ===== 掛牆：裱框畫 CSS columns masonry（純 CSS、零 CLS、無 JS/RO） ===== */
.atl__wall {
  column-count: 1;
  column-gap: clamp(2rem, 4.5vw, 4.5rem);
}
@media (min-width: 768px) {
  .atl__wall { column-count: 2; }
}
.atl__frame {
  break-inside: avoid;
  margin: 0 0 clamp(2.4rem, 5vw, 4rem);
}
.atl__frame:last-child { margin-bottom: 0; }

.atl__frame-btn {
  display: block;
  width: 100%;
  padding: 0;
  margin: 0;
  border: 0;
  background: none;
  cursor: pointer;
  text-align: left;
}
.atl__frame-btn:focus-visible { outline: none; }
.atl__frame-btn:focus-visible .atl__frame-mat {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

/* 裱框：mat 襯紙（內距）+ hairline 細框 + 牆上落影 */
.atl__frame-mat {
  position: relative;
  display: block;
  /* mat 襯紙：暖白紙色內距，讓畫「裱在框裡」而非貼滿；高度由內部 img 的 aspect-ratio 撐起（零 CLS） */
  padding: clamp(0.5rem, 1.2vw, 1rem);
  background: var(--surface, #faf8f4);
  border: 1px solid color-mix(in srgb, var(--accent) 16%, var(--border, rgba(168, 162, 158, 0.4)));
  box-shadow:
    0 1px 2px rgba(28, 25, 23, 0.05),
    0 12px 30px -16px rgba(28, 25, 23, 0.28);
  transition: box-shadow 0.5s cubic-bezier(0.22, 0.61, 0.36, 1), transform 0.5s cubic-bezier(0.22, 0.61, 0.36, 1);
}
:global(.dark) .atl__frame-mat {
  background: rgba(28, 25, 23, 0.55);
  border-color: color-mix(in srgb, var(--accent) 22%, rgba(120, 113, 108, 0.4));
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.3),
    0 14px 34px -16px rgba(0, 0, 0, 0.6);
}
.atl__frame-btn:hover .atl__frame-mat,
.atl__frame-btn:focus-visible .atl__frame-mat {
  transform: translateY(-3px);
  box-shadow:
    0 2px 4px rgba(28, 25, 23, 0.08),
    0 22px 48px -18px rgba(28, 25, 23, 0.4);
}
:global(.dark) .atl__frame-btn:hover .atl__frame-mat,
:global(.dark) .atl__frame-btn:focus-visible .atl__frame-mat {
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.4),
    0 24px 52px -18px rgba(0, 0, 0, 0.72);
}

.atl__img {
  display: block;
  width: 100%;
  height: auto;
  /* aspect-ratio 由 inline style 依離線預算逐圖設定 → 載入前即保留高度（零 CLS） */
  object-fit: cover;
  filter: saturate(0.96);
  transition: filter 0.5s ease;
}
.atl__frame-btn:hover .atl__img,
.atl__frame-btn:focus-visible .atl__img { filter: saturate(1.04); }

/* 館藏牌：框下一行極簡說明牌（編號 + 標題） */
.atl__plate {
  display: flex;
  align-items: baseline;
  gap: 0.7rem;
  padding: 0.7rem 0.15rem 0;
}
.atl__plate-no {
  flex: 0 0 auto;
  font-family: var(--world-mono, ui-monospace, monospace);
  font-size: 0.56rem;
  letter-spacing: 0.18em;
  color: var(--accent);
  opacity: 0.75;
  padding-top: 0.1rem;
}
.atl__plate-title {
  flex: 1 1 auto;
  min-width: 0;
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 0.82rem;
  font-weight: 300;
  letter-spacing: 0.05em;
  line-height: 1.45;
  color: rgb(87 83 78);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.4s ease;
}
:global(.dark) .atl__plate-title { color: rgb(180 175 170); }
.atl__frame-btn:hover ~ .atl__plate .atl__plate-title,
.atl__frame-btn:focus-visible ~ .atl__plate .atl__plate-title {
  color: rgb(41 37 36);
}
:global(.dark) .atl__frame-btn:hover ~ .atl__plate .atl__plate-title,
:global(.dark) .atl__frame-btn:focus-visible ~ .atl__plate .atl__plate-title {
  color: rgb(231 229 228);
}

@media (prefers-reduced-motion: reduce) {
  .atl__frame-mat, .atl__img, .atl__plate-title { transition: none; }
  .atl__frame-btn:hover .atl__frame-mat,
  .atl__frame-btn:focus-visible .atl__frame-mat { transform: none; }
}
</style>
