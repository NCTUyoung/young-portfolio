<template>
  <!--
    R1（強硬大膽 galleryWorlds）：影世界專屬「暗房光桌橫條」(darkroom light-table bar)。

    ── 為什麼存在 ──
    critic 主訴：繪/影 共用同一條左 rail + 主內容骨架相近 → 仍像 image browser 換皮。
    本輪破「兩世界共用版面拓樸」：
      繪 (kai)  = 製図室：左側 spec 索引 rail 常駐（工作室側欄），右側嚴格格牆。
      影 (kage) = 暗室：取消左 rail，改頂部一條近黑的「光桌橫條」(light table strip)，
                  底下膠卷流 full-bleed 縱捲 → 沉浸暗房，無側欄吃寬。
    這讓 lg+ 兩世界的「頁面外框」本身分歧：一個側railed、一個頂bar + 全幅。
    一眼分得出在哪本書，而非靠字體色溫。

    此 bar = 暗房裡橫躺的觀片燈箱：左 masthead（暗室）、中 tab（繪/影 燈位切換）、
    右 EXIF 式統計（枚數 / 現選 event）。整條近黑底 + 齒孔上下緣，像一截橫置膠卷。
    控制項全部沿用既有 store（GalleryTabBar / EventFilter / Toolbar 的 inline 版），
    a11y / route 同步不變。進場 develop-in，守 prefers-reduced-motion。
  -->
  <div class="darkroom-bar world-enter world-enter-d1" data-world="kage">
    <span class="darkroom-bar__sprockets darkroom-bar__sprockets--t" aria-hidden="true"/>
    <span class="darkroom-bar__sprockets darkroom-bar__sprockets--b" aria-hidden="true"/>

    <div class="darkroom-bar__inner">
      <!-- 左：暗室 masthead -->
      <div class="darkroom-bar__masthead">
        <p class="darkroom-bar__eyebrow">影 — Photography</p>
        <h1 class="darkroom-bar__title font-jp">暗室</h1>
        <p class="darkroom-bar__sub">Darkroom · 光と影を、現像する。</p>
      </div>

      <!--
        g2（act-critic loop / 消雙目次冗餘）：darkroom bar 不再承載「event 文字清單」。
        回應 Round g1 critic：首屏被 EventFilter 文字列表主導、視覺目次在 strip 後才出現、
        且 bar 的文字 EventFilter 與下方 GalleryDarkroomIndex 接觸印樣雙重存在＝導航冗餘。
        改法：bar 只留「燈位切換(繪/影 tab) + 搜尋/年份輔助 + 統計」當輕量工具列；
        唯一的 event 導航交給緊接其下的「接觸印樣綜覽目次」(視覺優先、一眼命中)。
      -->
      <!--
        two-rooms-r2（act-critic / 廢統一篩選鷹架 → 影房做成負片邊框齒孔刻度）：
        回應 critic「TabBar 兩房同款」。影世界的 track 切換／搜尋年份不再是中性 rail 列，
        而是負片邊框上的「齒孔刻度尺 perforation scale」：控制列鑲在一條上下齒孔軌之間，
        像底片邊緣的曝光刻度。與繪房製図台抽屜形成兩種房間語彙。
        控制元件本身（store 綁定）不動，僅外層包齒孔刻度骨架。
      -->
      <div class="darkroom-bar__controls">
        <div class="darkroom-bar__perf-scale">
          <span class="darkroom-bar__perf-edge darkroom-bar__perf-edge--t" aria-hidden="true"/>
          <div class="darkroom-bar__perf-track">
            <GalleryTabBar variant="rail" />
            <div class="darkroom-bar__tools-inline">
              <GalleryFilterToolbar variant="rail" />
            </div>
          </div>
          <span class="darkroom-bar__perf-edge darkroom-bar__perf-edge--b" aria-hidden="true"/>
        </div>
      </div>

      <!-- 右：膠卷統計（枚數，等寬序號感） -->
      <div class="darkroom-bar__stat">
        <span class="darkroom-bar__stat-num">{{ String(categoryCount).padStart(3, '0') }}</span>
        <span class="darkroom-bar__stat-unit">枚 · frames</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GalleryTabBar from '~/components/GalleryTabBar.vue'
import GalleryFilterToolbar from '~/components/GalleryFilterToolbar.vue'

defineProps<{
  categoryCount: number
}>()
</script>

<style scoped>
/* =========================================================
   R1：影世界暗房光桌橫條（取代左 rail，破共用拓樸）
   近黑膠卷底 + 上下齒孔；全寬橫躺；反白文字。
   光/暗模式皆暗底（暗房本來就暗），靠反白維持可讀。
   ========================================================= */
.darkroom-bar {
  position: relative;
  margin-bottom: 1.1rem;
  padding: 1.1rem 1.75rem 1rem;
  background: linear-gradient(168deg, #20262c 0%, #14181c 100%);
  border-radius: 2px;
  box-shadow: inset 0 0 0 1px rgba(154, 173, 197, 0.12);
  overflow: hidden;
}
:global(.dark) .darkroom-bar {
  background: linear-gradient(168deg, #1a1f24 0%, #0e1114 100%);
}

/* 上下緣橫向齒孔（橫躺膠卷邊） */
.darkroom-bar__sprockets {
  position: absolute;
  left: 0;
  right: 0;
  height: 7px;
  pointer-events: none;
  background-image: radial-gradient(
    circle at center,
    rgba(238, 241, 243, 0.55) 0 1.4px,
    transparent 1.7px
  );
  background-size: 14px 7px;
  background-repeat: repeat-x;
  opacity: 0.45;
}
.darkroom-bar__sprockets--t { top: 4px; }
.darkroom-bar__sprockets--b { bottom: 4px; }

.darkroom-bar__inner {
  display: flex;
  align-items: flex-start;
  gap: 2.5rem;
  flex-wrap: wrap;
}

/* 左 masthead */
.darkroom-bar__masthead { flex: 0 0 auto; padding-top: 0.15rem; }
.darkroom-bar__eyebrow {
  margin: 0 0 0.4rem;
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 0.6rem;
  letter-spacing: 0.42em;
  color: #9aadc5;
}
.darkroom-bar__title {
  margin: 0;
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 2.1rem;
  font-weight: 300;
  letter-spacing: 0.22em;
  line-height: 1;
  color: #eef1f3;
}
.darkroom-bar__sub {
  margin: 0.45rem 0 0;
  font-family: 'Noto Serif JP', serif;
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  font-weight: 300;
  color: rgba(190, 200, 212, 0.78);
}

/* 中 controls：tab + event filter；--accent 在此暗條內轉冷亮（rail variant 沿用 token） */
.darkroom-bar__controls {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  /* 暗條內把 accent re-map 成冷亮銀，讓 tab 指示條/active 文字在暗底可讀 */
  --accent: #9aadc5;
  --accent-ink: #b6c6da;
  --accent-soft: #52647a;
}
/* tab/filter 文字在暗底改亮 stone（覆寫元件內 stone-800 等深色） */
.darkroom-bar__controls :deep(.text-stone-800),
.darkroom-bar__controls :deep(.text-stone-700),
.darkroom-bar__controls :deep(.text-stone-600) { color: #e7ecf1 !important; }
.darkroom-bar__controls :deep(.text-stone-400),
.darkroom-bar__controls :deep(.text-stone-500) { color: #8a98a8 !important; }
.darkroom-bar__controls :deep(.bg-stone-200\/70) { background: rgba(154, 173, 197, 0.25) !important; }

/* =========================================================
   two-rooms-r2：負片邊框齒孔刻度尺（控制列鑲在上下齒孔軌之間）
   像底片邊緣的曝光刻度——track 切換／搜尋年份夾在兩條齒孔軌中間。
   與繪房製図台抽屜分家。
   ========================================================= */
.darkroom-bar__perf-scale {
  position: relative;
  padding: 0.65rem 0;
}
.darkroom-bar__perf-edge {
  position: absolute;
  left: 0;
  right: 0;
  height: 6px;
  pointer-events: none;
  /* 縱向小齒孔（負片穿孔），亮孔跑滿整條控制列寬 */
  background-image: radial-gradient(
    circle at center,
    rgba(195, 210, 226, 0.6) 0 1.3px,
    transparent 1.6px
  );
  background-size: 11px 6px;
  background-repeat: repeat-x;
  opacity: 0.5;
}
.darkroom-bar__perf-edge--t { top: -1px; }
.darkroom-bar__perf-edge--b { bottom: -1px; }
.darkroom-bar__perf-track {
  position: relative;
  padding: 0.15rem 0.2rem;
}

/* g2：搜尋/年份輔助工具列移入第一列右側（暗底反白 input/select） */
.darkroom-bar__tools-inline {
  margin-top: 0.5rem;
}
.darkroom-bar__tools-inline :deep(input),
.darkroom-bar__tools-inline :deep(select) {
  background: rgba(10, 13, 16, 0.5) !important;
  color: #e7ecf1 !important;
  border-color: rgba(154, 173, 197, 0.28) !important;
}
.darkroom-bar__tools-inline :deep(input::placeholder) { color: rgba(154, 173, 197, 0.5) !important; }

/* 右 stat */
.darkroom-bar__stat {
  flex: 0 0 auto;
  display: flex;
  align-items: baseline;
  gap: 0.45rem;
  font-family: 'Noto Serif JP', serif;
  color: rgba(190, 200, 212, 0.85);
}
.darkroom-bar__stat-num {
  font-family: var(--world-mono, ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
  font-size: 1.3rem;
  letter-spacing: 0.06em;
  color: #c3d2e2;
}
.darkroom-bar__stat-unit { font-size: 0.66rem; letter-spacing: 0.2em; }

@media (max-width: 1023px) {
  /* lg 以下不用此 bar（沿用既有 mobile top-stack）；保險隱藏 */
  .darkroom-bar { display: none; }
}
</style>
