<template>
  <!--
    Gallery 左 rail（lg+ 專用）— 把原本頁眉的 chrome 整層搬到左側 sticky 欄，
    讓主內容（EventCover / Map / Strip / Timeline）從 viewport 頂端開始。
    對齊 sites/rinko-kawauchi.md（左側極窄 fixed nav）+ sites/ryan-mcginley.md（左側固定寬 nav）。

    Path B（2026-05-15）：把 rail 從「設定面板」改為「目錄頁／書脊」。

    R6（act-critic galleryWorlds 大改）：回應 critic「兩首屏共用同一頂欄/左軌，
    首訪 3 秒仍像同一個 image browser」。把 rail masthead 本身依世界換骨——
    不再是固定的「Gallery / Works / {label}」三行，而是兩套截然不同的標牌語言：
      繪(kai)：等寬 mono「製図室 / DRAFTING ROOM」+ 直角方括號標記 + tabular 葉數，
               讀作工程製圖室的索引牌。
      影(kage)：serif「暗室 / DARKROOM」+ 一行常駐手記 note（非 hover 才現）+ 細體張數，
               讀作暗房手記的扉頁。
    note 為「常駐」（不藏 hover）→ 首訪 3 秒就分得出在哪個世界（回應 jump-out）。
    進場由 .world-enter（kai=grid-snap / kage=develop-in）驅動，首屏即有呼吸；
    prefers-reduced-motion fallback 由 main.css .world-enter 規則統一兜底。
  -->
  <aside
    class="gallery-rail relative w-60 shrink-0 self-start sticky top-[calc(env(safe-area-inset-top,0px)+4rem)] max-h-[calc(100vh-4rem)] overflow-y-auto hide-scrollbar py-8 pr-6 pl-6"
    :data-world="worldId"
    aria-label="Gallery filters"
  >
    <!--
      縦書き書脊：以單字 kanji 替代 hairline 切段，rail 從「設定面板」變「目錄頁」。
      aria-hidden + pointer-events-none：純裝飾、不干擾 a11y tree 與點擊。
    -->
    <span
      v-if="spineKanji"
      class="writing-vertical pointer-events-none select-none absolute -left-0.5 top-9 font-jp text-2xl tracking-[0.5em] text-stone-400/70 dark:text-stone-500/50"
      aria-hidden="true"
    >{{ spineKanji }}</span>

    <!-- =========================================================
         世界標牌：依 worldId 換整套 masthead 語言（繪=製図室 / 影=暗室）
         ========================================================= -->
    <!-- 繪 (kai)：等寬 mono 製圖室索引牌 -->
    <div v-if="worldId === 'kai'" :key="`kai-${worldId}`" class="rail-masthead rail-masthead--kai world-enter world-enter-d1">
      <p class="rail-masthead__eyebrow rail-masthead__eyebrow--mono">
        <span aria-hidden="true">[</span>繪 / DIGITAL<span aria-hidden="true">]</span>
      </p>
      <h1 class="rail-masthead__title rail-masthead__title--mono">製図室</h1>
      <p class="rail-masthead__sub rail-masthead__sub--mono">DRAFTING ROOM</p>
      <p class="rail-masthead__count rail-masthead__count--mono">
        <span class="rail-masthead__count-num">{{ String(categoryCount).padStart(3, '0') }}</span>
        <span class="rail-masthead__count-unit">葉 · sheets</span>
      </p>
    </div>

    <!--
      影 (kage)：暗室負片膠捲面板（R8 act-critic galleryWorlds）
      回應 Round 7 next-step「影世界首屏頂部換暗房負片底色+齒孔語彙，繪維持製圖白底，
      讓前 3 秒就分世界」。把 kage masthead 整塊包進一片近黑的負片膠捲：
        · 暗底（負片基片）+ 兩側齒孔（sprocket holes）跑滿縱向 → 一眼是「一截底片」
        · 標題以反白負片色呈現，與繪的製圖白底正好相反相
      這讓兩世界首屏頂部不再「完全相同」（critic 主訴），而是亮白製圖室 vs 暗黑暗房。
      齒孔層 aria-hidden + pointer-events-none，純裝飾。
    -->
    <div v-else :key="`kage-${worldId}`" class="rail-filmpanel world-enter world-enter-d1">
      <span class="rail-filmpanel__sprockets rail-filmpanel__sprockets--l" aria-hidden="true"/>
      <span class="rail-filmpanel__sprockets rail-filmpanel__sprockets--r" aria-hidden="true"/>
      <div class="rail-masthead rail-masthead--kage">
        <p class="rail-masthead__eyebrow rail-masthead__eyebrow--serif">影 — Photography</p>
        <h1 class="rail-masthead__title rail-masthead__title--serif">暗室</h1>
        <p class="rail-masthead__sub rail-masthead__sub--serif">Darkroom · 手記</p>
        <!-- 常駐手記 note（非 hover；首訪即見，定義「我在影的世界」） -->
        <p class="rail-masthead__note world-enter world-enter-d2">
          光と影を、現像する。
        </p>
        <p class="rail-masthead__count rail-masthead__count--serif">
          <span class="rail-masthead__count-num">{{ categoryCount }}</span>
          <span class="rail-masthead__count-unit">枚 · frames</span>
        </p>
      </div>
    </div>

    <!--
      two-rooms-r2（act-critic / 廢統一篩選鷹架 → 繪房做成製図台抽屜）：
      回應 critic「TabBar 兩房同款」。繪世界的 EVENTS/YEAR/search 不再是中性 rail 列，
      而是製図台的三格抽屜：每格冠製圖抽屜標籤（抽屜把手 + mono 編號 + 漢字面板名），
      抽屜面為極淺凹陷格（藍圖紙觸感）。與影房負片齒孔刻度形成兩種房間語彙。
      控制元件本身（store 綁定）不動，僅外層包抽屜骨架。
    -->
    <div class="rail-drawers mt-7">
      <!-- 抽屜一：燈位切換（繪/影 track） -->
      <section class="rail-drawer world-enter world-enter-d2">
        <p class="rail-drawer__pull">
          <span class="rail-drawer__pull-no" aria-hidden="true">DR·01</span>
          <span class="rail-drawer__pull-name font-jp">図室</span>
        </p>
        <div class="rail-drawer__face">
          <GalleryTabBar variant="rail" />
        </div>
      </section>

      <!-- 抽屜二：事件索引（製図綴じの見出し） -->
      <section class="rail-drawer world-enter world-enter-d3">
        <p class="rail-drawer__pull">
          <span class="rail-drawer__pull-no" aria-hidden="true">DR·02</span>
          <span class="rail-drawer__pull-name font-jp">綴じ</span>
        </p>
        <div class="rail-drawer__face">
          <EventFilter variant="rail" />
        </div>
      </section>

      <!-- 抽屜三：検索／年次（製図台の検索引き出し） -->
      <section class="rail-drawer world-enter world-enter-d3">
        <p class="rail-drawer__pull">
          <span class="rail-drawer__pull-no" aria-hidden="true">DR·03</span>
          <span class="rail-drawer__pull-name font-jp">検索</span>
        </p>
        <div class="rail-drawer__face">
          <GalleryFilterToolbar variant="rail" />
        </div>
      </section>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '~/stores/gallery'
import GalleryTabBar from '~/components/GalleryTabBar.vue'
import EventFilter from '~/components/EventFilter.vue'
import GalleryFilterToolbar from '~/components/GalleryFilterToolbar.vue'

defineProps<{
  categoryLabel: string
  categoryCount: number
}>()

const { filterState } = storeToRefs(useGalleryStore())

// 對齊 pages/.../[[event]].vue 章節 / footer 之比喻：digital=繪、photography=影
const spineKanji = computed(() => {
  const c = filterState.value.selectedCategory
  if (c === 'digital') return '繪'
  if (c === 'photography') return '影'
  return ''
})

// 世界身分 — 與頁面 data-world 同步：繪=kai / 影=kage
const worldId = computed(() => (filterState.value.selectedCategory === 'digital' ? 'kai' : 'kage'))
</script>

<style scoped>
/* =========================================================
   two-rooms-r2：rail 必須浮在製図台 full-bleed（100vw 負margin）之上。
   AtelierTimeline 在 DOM 後於 rail 且 full-bleed 拉到視窗左緣，會蓋住 rail；
   給 rail 不透明 cream 底 + z-index（低於書口 1040 / miniBar 1090），
   讓製図台抽屜在桌機 digital overview 真正可見、可讀。
   ========================================================= */
.gallery-rail {
  z-index: 30;
  background: var(--bg);
}

/* =========================================================
   R6：rail masthead 兩套世界語言（繪=mono製図 / 影=serif暗室）
   ========================================================= */
.rail-masthead {
  margin-bottom: 0.25rem;
}
.rail-masthead__eyebrow {
  margin: 0 0 0.55rem;
  font-size: 0.58rem;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: var(--accent);
}
/* 繪：等寬 mono eyebrow，直角方括號像製圖索引號 */
.rail-masthead__eyebrow--mono {
  font-family: var(--world-mono, ui-monospace, monospace);
  letter-spacing: 0.2em;
}
.rail-masthead__eyebrow--mono span { opacity: 0.6; }
/* 影：serif eyebrow，氣口較鬆 */
.rail-masthead__eyebrow--serif {
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  letter-spacing: 0.42em;
  text-transform: none;
  font-size: 0.6rem;
}

.rail-masthead__title {
  margin: 0;
  font-weight: 200;
  color: rgb(41 37 36);
  line-height: 1.1;
}
:global(.dark) .rail-masthead__title { color: rgb(245 245 244); }
/* 繪：mono 大字，緊字距、方正 */
.rail-masthead__title--mono {
  font-family: var(--world-mono, ui-monospace, monospace);
  font-size: 1.55rem;
  letter-spacing: 0.1em;
}
/* 影：serif 大字，寬字距、抒情 */
.rail-masthead__title--serif {
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 1.85rem;
  letter-spacing: 0.22em;
  font-weight: 300;
}

.rail-masthead__sub {
  margin: 0.3rem 0 0;
  font-size: 0.56rem;
  color: rgb(120 113 108);
}
:global(.dark) .rail-masthead__sub { color: rgb(168 162 158); }
.rail-masthead__sub--mono {
  font-family: var(--world-mono, ui-monospace, monospace);
  letter-spacing: 0.3em;
  text-transform: uppercase;
}
.rail-masthead__sub--serif {
  font-family: 'Noto Serif JP', serif;
  letter-spacing: 0.2em;
}

/* 影世界專屬：常駐暗室手記 note（細體、非 hover；首訪即見） */
.rail-masthead__note {
  margin: 0.9rem 0 0;
  padding-left: 0.7rem;
  border-left: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 0.74rem;
  font-weight: 300;
  letter-spacing: 0.14em;
  line-height: 1.9;
  color: rgb(87 83 78);
}
:global(.dark) .rail-masthead__note { color: rgb(190 184 178); }

.rail-masthead__count {
  margin: 0.95rem 0 0;
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  color: rgb(120 113 108);
}
:global(.dark) .rail-masthead__count { color: rgb(168 162 158); }
.rail-masthead__count--mono {
  font-family: var(--world-mono, ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
  font-size: 0.62rem;
  letter-spacing: 0.16em;
}
.rail-masthead__count--serif {
  font-family: 'Noto Serif JP', serif;
  font-size: 0.66rem;
  letter-spacing: 0.18em;
}
.rail-masthead__count-num {
  color: var(--accent);
  font-size: 1rem;
}
.rail-masthead__count--mono .rail-masthead__count-num { font-size: 0.92rem; }
.rail-masthead__count-unit { opacity: 0.85; }

/* =========================================================
   R8：影世界暗室負片膠捲面板（齒孔 + 反白）
   把 kage masthead 整塊包進一截近黑底片，與繪的製圖白底正好相反相。
   光/暗模式皆走暗底（負片本來就暗），靠反白文字維持可讀。
   ========================================================= */
.rail-filmpanel {
  position: relative;
  margin: -0.25rem -0.4rem 0.25rem;
  padding: 1.15rem 1.35rem 1.25rem;
  background:
    linear-gradient(170deg, #20262c 0%, #14181c 100%);
  border-radius: 2px;
  box-shadow: inset 0 0 0 1px rgba(154, 173, 197, 0.12);
}
.dark .rail-filmpanel {
  background: linear-gradient(170deg, #1a1f24 0%, #0e1114 100%);
}
/* 兩側齒孔：用 repeating radial 鑽出底片孔；近黑膠捲邊上的亮孔 */
.rail-filmpanel__sprockets {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 7px;
  pointer-events: none;
  background-image: radial-gradient(
    circle at center,
    rgba(238, 241, 243, 0.9) 0 1.4px,
    transparent 1.7px
  );
  background-size: 7px 13px;
  background-repeat: repeat-y;
  opacity: 0.55;
}
.rail-filmpanel__sprockets--l { left: 3px; }
.rail-filmpanel__sprockets--r { right: 3px; }

/* 面板內反白：覆寫 masthead 顏色為負片亮色 */
.rail-filmpanel .rail-masthead__title { color: #eef1f3 !important; }
.rail-filmpanel .rail-masthead__sub,
.rail-filmpanel .rail-masthead__count { color: rgba(190, 200, 212, 0.78) !important; }
.rail-filmpanel .rail-masthead__note {
  color: rgba(206, 214, 224, 0.82) !important;
  border-left-color: rgba(154, 173, 197, 0.55) !important;
}
.rail-filmpanel .rail-masthead__eyebrow--serif { color: #9aadc5 !important; }
.rail-filmpanel .rail-masthead__count-num { color: #c3d2e2 !important; }

@media (prefers-reduced-motion: reduce) {
  .rail-filmpanel { transition: none; }
}

/* =========================================================
   two-rooms-r2：繪房製図台抽屜（廢統一篩選鷹架 → 房間語彙）
   每格篩選 = 一格製図抽屜：抽屜把手標籤 + 極淺凹陷面板。
   藍圖紙觸感、mono 編號、直角骨架，與影房負片齒孔刻度分家。
   ========================================================= */
.rail-drawers {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
.rail-drawer {
  position: relative;
}
/* 抽屜把手標籤：左側短橫把手 + mono 編號 + 漢字面板名 */
.rail-drawer__pull {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.5rem;
  padding-left: 0.85rem;
}
.rail-drawer__pull::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.32rem;
  width: 0.5rem;
  height: 2px;
  background: color-mix(in srgb, var(--accent) 70%, transparent);
}
.rail-drawer__pull-no {
  font-family: var(--world-mono, ui-monospace, monospace);
  font-size: 0.52rem;
  letter-spacing: 0.24em;
  font-variant-numeric: tabular-nums;
  color: var(--accent);
  opacity: 0.85;
}
.rail-drawer__pull-name {
  font-size: 0.78rem;
  font-weight: 400;
  letter-spacing: 0.28em;
  color: rgb(120 113 108);
}
:global(.dark) .rail-drawer__pull-name { color: rgb(168 162 158); }
/* 抽屜面：極淺凹陷格（藍圖紙），直角、薄 inset，不用粗框 */
.rail-drawer__face {
  position: relative;
  padding: 0.7rem 0.75rem 0.55rem;
  background:
    linear-gradient(to right, color-mix(in srgb, var(--accent) 4%, transparent) 1px, transparent 1px) 0 0 / 14px 100%,
    color-mix(in srgb, var(--accent) 3%, var(--surface));
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--accent) 10%, transparent),
    inset 0 -1px 0 rgb(0 0 0 / 0.04);
  border-radius: 1px;
}
:global(.dark) .rail-drawer__face {
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--accent) 14%, transparent),
    inset 0 -1px 0 rgb(0 0 0 / 0.25);
}
/* 抽屜面內的篩選列去掉自身 margin-bottom，交由抽屜 gap 統一節奏 */
.rail-drawer__face > * { margin-bottom: 0 !important; }
</style>
