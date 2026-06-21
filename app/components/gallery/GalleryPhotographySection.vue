<template>
  <!-- Desktop: width must be measured on the timeline *content* strip, not the outer max-w-7xl -->
  <div class="hidden md:block">
    <!-- g1：全章預設摺合 → 章距由 space-y-32(展開時的大氣口) 收為 space-y-6，
         消除「11 條摺合章 × 8rem 巨幅死白」。展開章靠內部 padding 自帶氣口。 -->
    <div class="space-y-6 max-w-7xl mx-auto">
      <div
        v-for="(item, index) in items"
        :key="item.key"
        :ref="el => props.registerEventRef(item.eventName || 'no-event', el)"
        :class="[
          // g1/g2：所有章節預設摺合（綜覽→深入策展模型）。上方接觸印樣綜覽已給全局視覺目次，
          // timeline 在其下作「全量章索引」，每章一條極簡現像條；展開才現像接觸印樣格。
          // g2：摺合態改單行現像條後 intrinsic 估高由 150px → 64px，避免摺合章預留過量空間＝下半死白。
          '[content-visibility:auto] [contain-intrinsic-size:auto_64px]',
          'scroll-mt-24',
          'transition-colors duration-500',
          focusedEventName === item.eventName
            ? 'bg-stone-100/60 dark:bg-stone-800/30 -mx-4 px-4 py-2 border-l border-accent-400/40 dark:border-accent-500/40'
            : ''
        ]"
      >
        <GalleryTimelineItem
          :index="index"
          :time-label="item.timeRange || ''"
          :event-info="item.eventInfo"
          :event-key="item.eventName || 'no-event'"
          :show-event-control="!!item.eventName"
          :show-event-info="!!item.eventName"
          :default-collapsed="!isDefaultExpanded(item)"
          wide
        >
          <div
            class="mb-12 w-full min-w-0 overflow-x-hidden"
          >
            <div class="mb-6">
              <h3 class="text-lg font-jp font-extralight text-stone-700 dark:text-stone-200 tracking-wider">
                {{ item.eventName || '其他作品' }}
              </h3>
              <p class="text-[0.65rem] text-stone-400 dark:text-stone-500 mt-1.5 font-light tracking-[0.3em] jp-kansuji">
                {{ item.images?.length || 0 }} <span class="text-stone-400 dark:text-stone-600">·</span> 作品
              </p>
            </div>

            <!--
              g1（圖片庫策展 UX 大改）：影世界展開後改「接觸印樣格」(GalleryContactSheet)。
              取代 baseline 的單欄全幅膠卷流（每格 1 大圖 + EXIF 側欄 ≈ 1 屏/格 → 30.5 屏病灶）。
              保留暗室 identity（齒孔/序號/冷調負片/明體），但多欄密鋪砍屏數；
              完整 EXIF/手記移到 lightbox（點任一格開）。版型仍與繪 GridWall 分歧
              （暗調負片印樣 vs 暖白製圖牆），不退回成同一格牆。
            -->
            <GalleryContactSheet
              :items="item.images || []"
              @image-click="(img) => openImageViewer(img, item.images || [])"
            />
          </div>

          <!--
            g2（消雙目次冗餘 / 砍重複長柱）：摺合章不再重貼大縮圖章封。
            理由：上方「接觸印樣綜覽」已是全 12 巻的視覺目次（含縮圖），下方 Timeline 若每章
            再放一張 180px 大章封＝第二份視覺目次＝critic 指出的下半冷調死白與重複來源。
            改為極簡「現像條」(develop strip)：序號 + 章名 + 章首詩 + 枚數刻度 + 展開，單行高度，
            把 11 章摺合態從 ~2.7 屏壓到 <1 屏。縮圖留在上方綜覽；此處只當深入展開的錨點/開關。
          -->
          <template #cover>
            <button
              type="button"
              class="chapter-strip group w-full text-left"
              :aria-label="`展開 ${item.eventName || ''} 章節作品（${item.images?.length || 0} 枚）`"
              @click="item.eventName && toggleExpand(item.eventName)"
            >
              <span class="chapter-strip__index">其の {{ formatKansuji(index + 1) }}</span>
              <span class="chapter-strip__body">
                <span class="chapter-strip__head">
                  <span class="chapter-strip__title font-jp">{{ item.eventName || '其他作品' }}</span>
                  <span class="chapter-strip__count jp-kansuji">{{ item.images?.length || 0 }} 枚</span>
                </span>
                <span v-if="getEventCaption(item)" class="chapter-strip__caption">「{{ getEventCaption(item) }}」</span>
              </span>
              <span class="chapter-strip__cta" aria-hidden="true">
                <span class="chapter-strip__cta-text">展開</span>
                <span class="chapter-strip__cta-arrow">→</span>
              </span>
            </button>
          </template>
        </GalleryTimelineItem>
      </div>
    </div>
  </div>

  <!-- Mobile（R34：接 fold 機制；前 2 個展開、其餘預設摺合） -->
  <div class="md:hidden block">
    <div class="space-y-10">
      <div
        v-for="(item, mIdx) in items"
        :key="item.key"
        :ref="el => props.registerEventRef(item.eventName || 'no-event', el)"
        :class="[
          // R9：同 desktop — content-visibility:auto 只給預設摺合章（mIdx>=2），
          // 避免前 2 個展開章的高膠卷流在 fullPage 截圖被裁成空白佔位。
          '[content-visibility:auto] [contain-intrinsic-size:auto_150px]',
          'scroll-mt-24'
        ]"
      >
        <!--
          R2（galleryWorlds mobile 分家）：影世界手機章首改「暗房光桌橫條」(light-table bar)。
          回應 Round 1 critic jump-out:「mobile 兩世界塌回幾乎同一條 stacked list」。
          黑底反白 + 左緣齒孔 + frame-no + 冷銀刻度尺，把桌機暗房光桌橫條精神帶到手機，
          與繪手機的製圖白底標牌正反相。展開/摺合 affordance 改為負片格上的 ＋/－。
        -->
        <button
          v-if="item.eventName"
          type="button"
          class="lighttable-bar w-full text-left"
          :aria-label="`${isMobileExpanded(item, mIdx) ? '摺合' : '展開'} ${item.eventName} 章節`"
          :aria-expanded="isMobileExpanded(item, mIdx)"
          @click="item.eventName && toggleExpand(item.eventName)"
        >
          <span class="lighttable-bar__sprockets" aria-hidden="true"/>
          <span class="lighttable-bar__frameno" aria-hidden="true">{{ formatKansuji(mIdx + 1) }} / KAGE</span>
          <div class="lighttable-bar__row">
            <h3 class="lighttable-bar__title">{{ item.eventName }}</h3>
            <span class="lighttable-bar__toggle" aria-hidden="true">{{ isMobileExpanded(item, mIdx) ? '−' : '+' }}</span>
          </div>
          <p class="lighttable-bar__meta jp-kansuji">
            {{ item.images?.length || 0 }} <span aria-hidden="true">·</span> 枚
          </p>
          <p v-if="!isMobileExpanded(item, mIdx) && getEventCaption(item)" class="lighttable-bar__caption">
            {{ getEventCaption(item) }}
          </p>
          <span class="lighttable-bar__ticks" aria-hidden="true"/>
        </button>
        <div
          v-if="isMobileExpanded(item, mIdx)"
          class="w-full min-w-0 overflow-x-hidden mt-4"
        >
          <!-- g1：手機亦走接觸印樣格（與桌機同版型語言；2 欄密鋪砍屏數） -->
          <GalleryContactSheet
            :items="item.images || []"
            @image-click="(img) => openImageViewer(img, item.images || [])"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import type { GalleryItem, MixedPhotoItem, SeriesNarrative } from '~~/shared/types/gallery'
import GalleryTimelineItem from '~/components/GalleryTimelineItem.vue'
import GalleryContactSheet from '~/components/gallery/GalleryContactSheet.vue'
import { useImageViewerStore } from '~/stores/imageViewer'
import { useGalleryStore } from '~/stores/gallery'

const galleryStore = useGalleryStore()

/** 目前選中的事件（route 驅動）；用於「進入該事件預設展開」。 */
const selectedEvent = computed(() => galleryStore.filterState.selectedEvent)

/**
 * 進入單一事件時，該事件章節預設展開（使用者：「事件點進去應該要預設展開」）。
 * 以 route 的 selectedEvent 判定 → server / client 首繪一致，無 hydration mismatch；
 * 使用者一旦手動 toggle，expandedGroups 的明確 state 接管（見 GalleryTimelineItem / 下方）。
 */
function isDefaultExpanded (item: MixedPhotoItem): boolean {
  return !!item.eventName && item.eventName === selectedEvent.value
}

/** 給章封展開按鈕用 — 同 GalleryTimelineItem 的 toggleGroupExpansion */
function toggleExpand (eventName: string) {
  galleryStore.toggleGroupExpansion(eventName)
}

/**
 * Mobile timeline 預設摺合邏輯 — 與 desktop 對齊（前 2 個展開、其餘摺合）
 * 沒有 eventName 的散圖一律展開
 */
function isMobileExpanded (item: MixedPhotoItem, _idx: number): boolean {
  if (!item.eventName) return true
  const state = galleryStore.expandedGroups[item.eventName]
  // 未手動 toggle 時：進入該事件（selectedEvent）預設展開，其餘摺合。
  if (state === undefined) return isDefaultExpanded(item)
  return state
}

/** 1~12 → 一/二/三/四/.../十二 漢數字 */
const KANSUJI = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五']
function formatKansuji (n: number): string {
  return KANSUJI[n] || String(n)
}

/**
 * 章封 caption 來源（R35 優先序）：
 *   1. strongest_line（章首詩，≤24 字，editorial 精煉）
 *   2. annotation（fallback，截 36 字）
 *   3. prologue / narrative（更次 fallback）
 */
function getEventCaption (item: MixedPhotoItem): string | null {
  const sn = (item.images?.[0] as { seriesNarrative?: SeriesNarrative } | undefined)?.seriesNarrative
  if (sn?.strongest_line && sn.strongest_line.trim()) return sn.strongest_line
  const text = sn?.annotation || sn?.prologue || sn?.narrative
  if (!text) return null
  if (text.length > 36) return text.slice(0, 36) + '…'
  return text
}

const props = defineProps<{
  items: MixedPhotoItem[]
  focusedEventName: string | null
  /** Parent keeps event DOM refs for map → scroll focus */
  registerEventRef: (name: string | null, el: Element | ComponentPublicInstance | null) => void
}>()

const imageViewerStore = useImageViewerStore()

const openImageViewer = (clickedImage: GalleryItem, images: GalleryItem[]) => {
  imageViewerStore.openImageViewer(clickedImage, images)
}

/**
 * g1：綜覽印樣點某巻 → 強制展開該 event（不 toggle，確保展開）。
 * 父層接著 scroll 到該章（透過既有 registerEventRef 蒐集的 DOM ref）。
 */
function expandEvent (eventName: string) {
  galleryStore.setGroupExpansion(eventName, true)
}

defineExpose({ expandEvent })
</script>

<style scoped>
/* ===== g2：摺合章「現像條」(chapter-strip) — 單行極簡，縮圖留在上方綜覽 ===== */
.chapter-strip {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 1.4rem;
  width: 100%;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-top: 1px solid rgb(168 162 158 / 0.18);
  padding: 0.85rem 0.4rem 0.85rem 0;
  transition: background-color 0.3s ease, padding-left 0.3s ease;
}
.chapter-strip:hover {
  background: rgb(168 162 158 / 0.06);
  padding-left: 0.5rem;
}
:global(.dark) .chapter-strip:hover { background: rgb(120 113 108 / 0.1); }
.chapter-strip:focus-visible {
  outline: 1px solid rgb(217 123 46 / 0.5);
  outline-offset: 3px;
}
.chapter-strip__index {
  flex: 0 0 auto;
  font-family: 'Noto Serif JP', serif;
  font-size: 0.62rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgb(217 123 46 / 0.8);
  white-space: nowrap;
  padding-top: 0.15rem;
}
.chapter-strip__body {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.chapter-strip__head {
  display: flex;
  align-items: baseline;
  gap: 0.9rem;
  flex-wrap: wrap;
}
.chapter-strip__title {
  font-family: var(--world-display, 'Noto Serif JP', 'Source Han Serif TC', serif);
  font-size: 1.32rem;
  font-weight: var(--world-display-weight, 400);
  letter-spacing: 0.16em;
  line-height: 1.3;
  color: rgb(68 64 60);
  transition: color 0.25s ease;
}
:global(.dark) .chapter-strip__title { color: rgb(231 229 228); }
.chapter-strip:hover .chapter-strip__title {
  color: color-mix(in srgb, var(--accent) 75%, rgb(68 64 60));
}
.chapter-strip__count {
  flex: 0 0 auto;
  font-family: 'Noto Serif JP', serif;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  color: rgb(168 162 158);
}
.chapter-strip__caption {
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 0.86rem;
  letter-spacing: 0.05em;
  line-height: 1.6;
  color: rgb(120 113 108);
  font-weight: 300;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 40rem;
}
:global(.dark) .chapter-strip__caption { color: rgb(168 162 158); }
.chapter-strip__cta {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Noto Serif JP', serif;
  font-size: 0.66rem;
  letter-spacing: 0.3em;
  color: rgb(217 123 46);
  white-space: nowrap;
  padding-top: 0.1rem;
}
.chapter-strip__cta-arrow {
  display: inline-block;
  transition: transform 0.3s ease;
}
.chapter-strip:hover .chapter-strip__cta-arrow { transform: translateX(4px); }

@media (max-width: 1023px) {
  .chapter-strip { gap: 1rem; }
  .chapter-strip__title { font-size: 1.15rem; }
  .chapter-strip__caption { max-width: 22rem; }
  .chapter-strip__cta-text { display: none; }
}

/* ===== R2：影世界手機「暗房光桌橫條」(light-table bar) =====
   黑底反白負片格條，與繪手機白底製圖標牌正反相。
   把桌機 GalleryDarkroomBar 的暗房光桌精神帶到手機，避免兩世界塌回同一 stacked list。 */
.lighttable-bar {
  position: relative;
  display: block;
  width: 100%;
  cursor: pointer;
  border: 0;
  padding: 0.95rem 1.1rem 0.85rem 1.6rem;
  /* 光卓 light：冷銀亮燈箱底（取代原 near-black #20262c→#14181c 負片底） */
  background: linear-gradient(168deg, #eef2f5 0%, #e1e8ed 100%);
  border-radius: 2px;
  box-shadow: inset 0 0 0 1px rgba(82, 100, 122, 0.18);
  overflow: hidden;
}
:global(.dark) .lighttable-bar {
  background: linear-gradient(165deg, #1a1f24 0%, #0e1114 100%);
  box-shadow: inset 0 0 0 1px rgba(154, 173, 197, 0.14);
}
.lighttable-bar:focus-visible {
  outline: 1px solid rgba(82, 100, 122, 0.6);
  outline-offset: 3px;
}
:global(.dark) .lighttable-bar:focus-visible {
  outline-color: rgba(154, 173, 197, 0.7);
}
/* 左緣齒孔軌 */
.lighttable-bar__sprockets {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 5px;
  width: 8px;
  pointer-events: none;
  /* 光卓 light：冷 slate 穿孔點（取代原反白亮孔 rgba(238,241,243,..)） */
  background-image: radial-gradient(circle at center, rgba(82, 100, 122, 0.42) 0 1.5px, transparent 1.8px);
  background-size: 8px 14px;
  background-repeat: repeat-y;
  opacity: 0.6;
}
:global(.dark) .lighttable-bar__sprockets {
  background-image: radial-gradient(circle at center, rgba(238, 241, 243, 0.8) 0 1.5px, transparent 1.8px);
  opacity: 0.45;
}
.lighttable-bar__frameno {
  display: block;
  font-family: 'Noto Serif JP', serif;
  font-size: 0.54rem;
  letter-spacing: 0.28em;
  /* 光卓 light：eyebrow 冷 slate 小標 */
  color: #5b6b7e;
  margin-bottom: 0.35rem;
}
:global(.dark) .lighttable-bar__frameno {
  color: rgba(154, 173, 197, 0.85);
}
.lighttable-bar__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.6rem;
}
.lighttable-bar__title {
  margin: 0;
  /* R2：影手機章名也用世界字族（Shippori），與繪手機製圖標牌字族分家 */
  font-family: var(--world-display, 'Noto Serif JP', serif);
  font-weight: var(--world-display-weight, 500);
  font-size: 1.18rem;
  letter-spacing: 0.16em;
  line-height: 1.4;
  /* 光卓 light：標題深 slate（取代原反白 #eef1f3） */
  color: #2b3640;
}
:global(.dark) .lighttable-bar__title {
  color: #eef1f3;
}
.lighttable-bar__toggle {
  flex-shrink: 0;
  font-family: 'Noto Serif JP', serif;
  font-size: 1.05rem;
  /* 光卓 light：冷 slate 序號/符號 */
  color: #3f4f63;
}
:global(.dark) .lighttable-bar__toggle {
  color: rgba(154, 173, 197, 0.9);
}
.lighttable-bar__meta {
  margin: 0.3rem 0 0;
  font-family: 'Noto Serif JP', serif;
  font-size: 0.66rem;
  letter-spacing: 0.2em;
  /* 光卓 light：副標冷 slate */
  color: #56697e;
}
:global(.dark) .lighttable-bar__meta {
  color: rgba(190, 200, 212, 0.72);
}
.lighttable-bar__caption {
  margin: 0.55rem 0 0;
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 0.82rem;
  line-height: 1.85;
  letter-spacing: 0.04em;
  /* 光卓 light：說明冷 slate */
  color: #56697e;
}
:global(.dark) .lighttable-bar__caption {
  color: rgba(206, 214, 224, 0.8);
}
/* 底緣冷銀刻度尺（光桌標尺） */
.lighttable-bar__ticks {
  position: absolute;
  left: 1.6rem;
  right: 1.1rem;
  bottom: 0.4rem;
  height: 5px;
  pointer-events: none;
  /* 光卓 light：冷 slate 刻度（亮底加深以維持可見度） */
  background-image: repeating-linear-gradient(
    to right,
    rgba(82, 100, 122, 0.3) 0,
    rgba(82, 100, 122, 0.3) 1px,
    transparent 1px,
    transparent 18px
  );
  background-position: bottom;
  opacity: 0.7;
}
:global(.dark) .lighttable-bar__ticks {
  background-image: repeating-linear-gradient(
    to right,
    rgba(154, 173, 197, 0.32) 0,
    rgba(154, 173, 197, 0.32) 1px,
    transparent 1px,
    transparent 18px
  );
  opacity: 0.6;
}
</style>
