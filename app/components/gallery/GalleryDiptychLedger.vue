<template>
  <section
    v-if="spreads.length"
    class="dl"
    aria-labelledby="dl-heading"
  >
    <!--
      j4（act-critic / 一組對位敘事 — 對開帳）：
      回應 Round j3 critic 的 BOLD NEXT STEP：「跳到資料層，把雙主線從『兩個入口、各自最新 N 張』
      進化為『一組對位敘事』——繪某事↔影某事的同題對頁配對，讓對開本左右葉渲染成真正成對的
      跨世界 spread，而非各自最新 N 張」。

      這是 overview 主欄的新雙世界本體（取代『門→各自最新 N 張橫條』的雙入口拓樸）：
      一冊【對開帳 Diptych Ledger】，每一摺＝一個共同命題（題），左葉繫繪某 event、右葉繫影某 event，
      中央題脊立著該命題漢字 + 釘綴印 + 一句對位敘事說明這兩件為何同題對望。
      資料來自頂層 crossWorldSpreads（兩檔一致），selector 接回 live works —— 對頁是「編出來的對位」，
      不是「各自最新」。每摺左右葉地層相反（繪 cream 製圖 / 影 dark 負片），整冊讀作一連串繪⇄影對望。

      唯一互動：點任一葉封面 → 開該世界 lightbox 串流（user-initiated，無 timer/autoplay）。
      不塞控制項（無 tab／grip／hint 五件套，回應 j3 critic『介面不煩瑣』破口）：
      題脊與封面本身即觸發點，hover 才浮出該葉章首詩。
      裝飾漢字 aria-hidden + pointer-events-none；accent 僅落在題脊釘綴印與 hairline；
      SSR 安全（純 CSS，無 client-only lazy mount，不破 prerender）；
      prefers-reduced-motion 下移除 transform / 3D，退化為 opacity 變化（見 @media）。
    -->
    <header class="dl__intro">
      <p class="dl__eyebrow">對位 · FACING PAGES</p>
      <h2 id="dl-heading" class="dl__title font-jp">
        繪<span class="dl__title-x" aria-hidden="true">⇄</span>影
      </h2>
      <p class="dl__lede">
        一冊對開帳。左葉是繪、右葉是影，同題對望——這些不是各自的最新，是編出來的一組對位。
      </p>
      <span class="dl__intro-rule" aria-hidden="true"/>
    </header>

    <ol class="dl__roll">
      <li
        v-for="(s, i) in spreads"
        :key="s.id"
        class="dl__spread"
        :class="`dl__spread--enter dl__spread--d${(i % 4) + 1}`"
      >
        <!-- 左葉：繪 -->
        <button
          type="button"
          class="dl__leaf dl__leaf--kai"
          :aria-label="`繪・${s.kai.eventName}（${s.kai.count} 葉）を製図室で観る`"
          @click="$emit('open-kai', s.kai.cover)"
        >
          <span class="dl__leaf-bg" aria-hidden="true">
            <span class="dl__paper"/>
            <span class="dl__grid"/>
          </span>
          <img
            :src="getThumbPath(s.kai.cover.filename, 800)"
            :alt="''"
            class="dl__img dl__img--kai"
            :loading="i < 2 ? 'eager' : 'lazy'"
            decoding="async"
            draggable="false"
          >
          <span class="dl__leaf-tag dl__leaf-tag--kai" aria-hidden="true">繪 · DIGITAL</span>
          <span class="dl__leaf-foot dl__leaf-foot--kai">
            <span class="dl__leaf-event font-jp">{{ s.kai.eventName }}</span>
            <span class="dl__leaf-count jp-kansuji">{{ s.kai.count }} 葉</span>
          </span>
          <span v-if="s.kai.strongestLine" class="dl__leaf-line dl__leaf-line--kai font-jp">{{ s.kai.strongestLine }}</span>
        </button>

        <!-- 中央題脊：共同命題 + 釘綴印 + 對位敘事 -->
        <div class="dl__theme" :data-side="i % 2 === 0 ? 'l' : 'r'">
          <span class="dl__theme-rule dl__theme-rule--t" aria-hidden="true"/>
          <span class="dl__theme-no" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="dl__theme-kanji font-jp">{{ s.theme }}</span>
          <span class="dl__theme-seal jp-seal font-jp" aria-hidden="true">題</span>
          <span class="dl__theme-roman" aria-hidden="true">{{ s.themeRoman }}</span>
          <p class="dl__theme-connector font-jp">{{ s.connector }}</p>
          <span class="dl__theme-rule dl__theme-rule--b" aria-hidden="true"/>
        </div>

        <!-- 右葉：影 -->
        <button
          type="button"
          class="dl__leaf dl__leaf--kage"
          :aria-label="`影・${s.kage.eventName}（${s.kage.count} 枚）を暗室で観る`"
          @click="$emit('open-kage', s.kage.cover)"
        >
          <span class="dl__leaf-bg" aria-hidden="true">
            <span class="dl__safelight"/>
            <span class="dl__sprockets"/>
          </span>
          <img
            :src="getThumbPath(s.kage.cover.filename, 800)"
            :alt="''"
            class="dl__img dl__img--kage"
            :loading="i < 2 ? 'eager' : 'lazy'"
            decoding="async"
            draggable="false"
          >
          <span class="dl__leaf-tag dl__leaf-tag--kage" aria-hidden="true">影 · PHOTOGRAPHY</span>
          <span class="dl__leaf-foot dl__leaf-foot--kage">
            <span class="dl__leaf-event font-jp">{{ s.kage.eventName }}</span>
            <span class="dl__leaf-count jp-kansuji">{{ s.kage.count }} 枚</span>
          </span>
          <span v-if="s.kage.strongestLine" class="dl__leaf-line dl__leaf-line--kage font-jp">{{ s.kage.strongestLine }}</span>
        </button>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import type { GalleryItem } from '~~/shared/types/gallery'
import type { ResolvedCrossWorldSpread } from '~/stores/gallerySelectors'
import { useImagePath } from '~/composables/useImagePath'

defineProps<{
  spreads: ResolvedCrossWorldSpread[]
}>()

defineEmits<{
  (e: 'open-kai' | 'open-kage', img: GalleryItem): void
}>()

const { getThumbPath } = useImagePath()
</script>

<style scoped>
.dl {
  max-width: 80rem;
  margin: 0 auto;
  /* j5：對開帳升為 overview 雙世界首屏 hero，不再 defer 繪製（避免首屏未繪/捲動閃爍）。
     仍以 contain 隔離排版範圍，避免內部變動外溢成整頁重排。 */
  contain: layout paint;
}

/* ===== 卷頭（對位宣言） ===== */
.dl__intro {
  position: relative;
  text-align: center;
  padding: clamp(1rem, 3vh, 2.5rem) 1rem clamp(1.5rem, 4vh, 3rem);
}
.dl__eyebrow {
  margin: 0 0 0.75rem;
  font-size: 0.6rem;
  letter-spacing: 0.42em;
  text-transform: uppercase;
  color: var(--accent);
  font-family: var(--world-mono, ui-monospace, monospace);
}
.dl__title {
  margin: 0;
  font-weight: 200;
  font-size: clamp(2.2rem, 6vw, 3.6rem);
  letter-spacing: 0.1em;
  line-height: 1;
  color: rgb(41 37 36);
}
:global(.dark) .dl__title { color: rgb(245 245 244); }
.dl__title-x {
  margin: 0 0.35em;
  font-size: 0.6em;
  color: color-mix(in srgb, var(--accent) 80%, rgb(120 113 108));
  vertical-align: middle;
}
.dl__lede {
  max-width: 34rem;
  margin: 1rem auto 0;
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 0.86rem;
  font-weight: 300;
  line-height: 2;
  letter-spacing: 0.06em;
  color: rgb(120 113 108);
}
:global(.dark) .dl__lede { color: rgb(168 162 158); }
.dl__intro-rule {
  display: block;
  width: clamp(48px, 8vw, 96px);
  height: 1px;
  margin: clamp(1rem, 2.5vh, 1.75rem) auto 0;
  background: linear-gradient(to right, transparent, color-mix(in srgb, var(--accent) 55%, transparent), transparent);
}

/* ===== 對開帳：縱列摺頁，但每摺＝橫向繪×影對望（破部落格卡列） ===== */
.dl__roll {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: clamp(1.5rem, 4vh, 3.25rem);
}

.dl__spread {
  position: relative;
  display: grid;
  grid-template-columns: 1fr minmax(108px, 0.42fr) 1fr;
  align-items: stretch;
  min-height: clamp(240px, 38vh, 360px);
}

/* ===== 葉（封面）：左繪 / 右影，地層相反 ===== */
.dl__leaf {
  position: relative;
  display: block;
  margin: 0;
  padding: 0;
  border: 0;
  overflow: hidden;
  cursor: pointer;
  background: none;
  isolation: isolate;
}
.dl__leaf--kai { background: #efe8dc; }
.dl__leaf--kage { background: #14181c; }

.dl__leaf-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.dl__paper { position: absolute; inset: 0; background: linear-gradient(165deg, #f3ede2 0%, #e8dfd0 100%); }
.dl__grid {
  position: absolute; inset: 0; opacity: 0.5;
  background-image:
    linear-gradient(to right, rgba(120,113,108,0.16) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(120,113,108,0.16) 1px, transparent 1px);
  background-size: 34px 34px;
}
.dl__safelight {
  position: absolute; inset: 0;
  background:
    radial-gradient(120% 80% at 85% 14%, rgba(196,96,35,0.14) 0%, transparent 46%),
    linear-gradient(165deg, #20262c 0%, #14181c 100%);
}
.dl__sprockets {
  position: absolute; top: 0; bottom: 0; right: 6px; width: 9px;
  background-image: radial-gradient(circle at center, rgba(226,232,238,0.55) 0 1.8px, transparent 2.1px);
  background-size: 9px 17px;
  background-repeat: repeat-y;
  opacity: 0.35;
}

.dl__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
  transition: transform 0.7s cubic-bezier(0.22, 0.61, 0.36, 1), filter 0.6s ease, clip-path 0.7s cubic-bezier(0.22,0.61,0.36,1);
}
.dl__img--kai {
  filter: saturate(0.94) contrast(1.02);
  /* 內緣切角，露出底下的製圖紙——封面像貼在製圖桌上的相紙 */
  clip-path: polygon(0 0, 100% 0, 100% 100%, 6% 100%);
}
.dl__img--kage {
  filter: saturate(0.9) contrast(1.05) brightness(0.92);
  clip-path: polygon(0 0, 94% 0, 100% 100%, 0 100%);
}
.dl__leaf--kai:hover .dl__img,
.dl__leaf--kai:focus-visible .dl__img { transform: scale(1.035); }
.dl__leaf--kage:hover .dl__img,
.dl__leaf--kage:focus-visible .dl__img { transform: scale(1.035); filter: saturate(1.02) contrast(1.06) brightness(1.0); }

/* 葉角世界標籤 */
.dl__leaf-tag {
  position: absolute;
  top: 0.7rem;
  z-index: 3;
  font-size: 0.52rem;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  padding: 0.16rem 0.5rem;
}
.dl__leaf-tag--kai {
  left: 0.7rem;
  color: var(--accent-700, rgb(180 90 40));
  font-family: var(--world-mono, ui-monospace, monospace);
  background: rgba(251,248,241,0.74);
}
.dl__leaf-tag--kage {
  right: 0.7rem;
  color: rgba(231,184,125,0.95);
  font-family: 'Noto Serif JP', serif;
  background: rgba(11,14,17,0.5);
}

/* 葉腳：event 名 + 件數 */
.dl__leaf-foot {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  z-index: 3;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 1.4rem 0.95rem 0.7rem;
}
.dl__leaf-foot--kai {
  background: linear-gradient(to top, rgba(251,248,241,0.95) 0%, rgba(251,248,241,0.15) 75%, transparent 100%);
}
.dl__leaf-foot--kage {
  background: linear-gradient(to top, rgba(11,14,17,0.92) 0%, rgba(11,14,17,0.15) 75%, transparent 100%);
}
.dl__leaf-event {
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 0.84rem;
  font-weight: 400;
  letter-spacing: 0.04em;
  line-height: 1.3;
}
.dl__leaf-foot--kai .dl__leaf-event { color: rgb(41 37 36); }
.dl__leaf-foot--kage .dl__leaf-event { color: #eef1f3; }
.dl__leaf-count {
  flex: 0 0 auto;
  font-size: 0.62rem;
  letter-spacing: 0.16em;
}
.dl__leaf-foot--kai .dl__leaf-count { color: rgb(120 113 108); }
.dl__leaf-foot--kage .dl__leaf-count { color: rgba(190,200,212,0.85); }

/* hover 浮出該葉章首詩（單句） */
.dl__leaf-line {
  position: absolute;
  left: 0; right: 0;
  z-index: 3;
  padding: 0.6rem 0.95rem;
  font-family: 'Noto Serif JP', serif;
  font-size: 0.72rem;
  font-weight: 300;
  letter-spacing: 0.08em;
  line-height: 1.6;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.4s ease, transform 0.4s ease;
  pointer-events: none;
}
.dl__leaf-line--kai {
  top: 2rem;
  color: rgb(68 64 60);
  text-shadow: 0 1px 6px rgba(251,248,241,0.9);
}
.dl__leaf-line--kage {
  top: 2rem;
  text-align: right;
  color: #e7ebef;
  text-shadow: 0 1px 8px rgba(0,0,0,0.7);
}
.dl__leaf:hover .dl__leaf-line,
.dl__leaf:focus-visible .dl__leaf-line { opacity: 1; transform: translateY(0); }

.dl__leaf:focus-visible { outline: 2px solid var(--accent); outline-offset: -3px; z-index: 4; }

/* ===== 中央題脊：共同命題 ===== */
.dl__theme {
  position: relative;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 1.5rem 0.7rem;
  text-align: center;
  background:
    linear-gradient(to right, rgba(0,0,0,0.16) 0%, transparent 12%, transparent 88%, rgba(0,0,0,0.3) 100%),
    linear-gradient(180deg, var(--surface, #f5f3ef) 0%, var(--bg, #faf8f4) 100%);
}
:global(.dark) .dl__theme {
  background:
    linear-gradient(to right, rgba(0,0,0,0.4) 0%, transparent 12%, transparent 88%, rgba(0,0,0,0.5) 100%),
    linear-gradient(180deg, #1c1c1a 0%, #141413 100%);
}
.dl__theme-rule {
  width: 1px;
  flex: 1 1 auto;
  min-height: 0.8rem;
  background: var(--hairline, linear-gradient(transparent, rgba(120,113,108,0.4), transparent));
}
.dl__theme-no {
  font-family: var(--world-mono, ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
  font-size: 0.56rem;
  letter-spacing: 0.2em;
  color: rgb(168 162 158);
}
.dl__theme-kanji {
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  writing-mode: vertical-rl;
  font-size: clamp(1.6rem, 3.4vw, 2.5rem);
  font-weight: 300;
  letter-spacing: 0.1em;
  line-height: 1.05;
  color: rgb(41 37 36);
}
:global(.dark) .dl__theme-kanji { color: rgb(238 236 233); }
.dl__theme-seal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  font-size: 0.72rem;
  font-weight: 300;
  color: #f5f0e8;
  background: color-mix(in srgb, var(--accent) 86%, #1a1512);
  transform: rotate(-3deg);
  box-shadow: 0 1px 6px rgba(0,0,0,0.35);
}
.dl__theme-roman {
  font-size: 0.5rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgb(140 133 128);
  max-width: 9ch;
  line-height: 1.4;
}
.dl__theme-connector {
  margin: 0.25rem 0 0;
  max-width: 13ch;
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 0.62rem;
  font-weight: 300;
  letter-spacing: 0.04em;
  line-height: 1.85;
  color: rgb(120 113 108);
}
:global(.dark) .dl__theme-connector { color: rgb(168 162 158); }

/* ===== 進場（一次性，user-scroll 觸發感由錯位 delay 製造，無 timer） ===== */
.dl__spread--enter {
  animation: dl-rise 0.7s cubic-bezier(0.22, 0.61, 0.36, 1) both;
}
.dl__spread--d1 { animation-delay: 0.02s; }
.dl__spread--d2 { animation-delay: 0.08s; }
.dl__spread--d3 { animation-delay: 0.14s; }
.dl__spread--d4 { animation-delay: 0.2s; }
@keyframes dl-rise {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ===== mobile/tablet：對開摺成上下兩葉，題脊轉橫躺中縫 ===== */
@media (max-width: 767px) {
  .dl__spread {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    min-height: 0;
  }
  .dl__leaf { min-height: clamp(190px, 42vw, 260px); }
  .dl__img--kai { clip-path: polygon(0 0, 100% 0, 100% 94%, 0 100%); }
  .dl__img--kage { clip-path: polygon(0 6%, 100% 0, 100% 100%, 0 100%); }
  .dl__theme {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.6rem 0.85rem;
    padding: 1rem 1.2rem;
    text-align: left;
    background:
      linear-gradient(180deg, rgba(0,0,0,0.16) 0%, transparent 14%, transparent 86%, rgba(0,0,0,0.24) 100%),
      linear-gradient(90deg, var(--surface, #f5f3ef) 0%, var(--bg, #faf8f4) 100%);
  }
  :global(.dark) .dl__theme {
    background:
      linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 14%, transparent 86%, rgba(0,0,0,0.5) 100%),
      linear-gradient(90deg, #1c1c1a 0%, #141413 100%);
  }
  .dl__theme-rule { display: none; }
  .dl__theme-kanji { writing-mode: horizontal-tb; }
  .dl__theme-roman { max-width: none; }
  .dl__theme-connector { max-width: none; flex: 1 1 100%; font-size: 0.7rem; }
  .dl__leaf-line { display: none; }
}

/* ===== reduced-motion：移除進場位移與封面縮放（守鐵律） ===== */
@media (prefers-reduced-motion: reduce) {
  .dl__spread--enter { animation: dl-fade 0.3s linear both; animation-delay: 0 !important; }
  @keyframes dl-fade { from { opacity: 0; } to { opacity: 1; } }
  .dl__img,
  .dl__leaf-line { transition: opacity 0.2s linear; }
  .dl__leaf--kai:hover .dl__img,
  .dl__leaf--kage:hover .dl__img,
  .dl__leaf:focus-visible .dl__img { transform: none; }
}
</style>
