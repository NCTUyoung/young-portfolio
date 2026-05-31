<template>
  <component
    :is="NuxtLink"
    :to="to"
    class="fyrt group"
    :class="`fyrt--${align}`"
    :style="{ '--ink': ink }"
    :aria-label="`${kana}（${roman}）のギャラリーへ：${startYear} 年から ${nodes.length} 件の精選`"
  >
    <!-- 軌頭：軌名 + 起算年（這條線的原點數字） -->
    <span class="fyrt__head">
      <span class="fyrt__kana font-jp">{{ kana }}</span>
      <span class="fyrt__roman">{{ roman }}</span>
      <span class="fyrt__rule" aria-hidden="true"/>
      <span class="fyrt__start jp-kansuji">{{ startYear }} —</span>
    </span>

    <!-- 節點軌：desktop 依 rulerPos 絕對定位；mobile 退為等距 flow -->
    <span class="fyrt__lane">
      <span
        v-for="(n, idx) in nodes"
        :key="n.work.id || n.work.filename"
        class="fyrt__node"
        :style="{ left: n.rulerPos * 100 + '%', '--p': n.rulerPos, zIndex: nodes.length - idx }"
      >
        <span class="fyrt__plate">
          <picture class="contents">
            <source :srcset="getGridAvifSrcset(n.work.filename)" type="image/avif">
            <source :srcset="getGridImageSrcset(n.work.filename)" type="image/webp">
            <img
              :src="getThumbPath(n.work.filename, 400)"
              :alt="alt(n.work)"
              class="fyrt__img"
              loading="lazy"
              decoding="async"
              draggable="false"
            >
          </picture>
          <!-- 年差角標：第 N 年（distance from start）— 敘事活在內容本身 -->
          <span class="fyrt__badge">
            <span class="fyrt__badge-n jp-kansuji">{{ n.yearIndex === 0 ? '起' : n.yearIndex }}</span>
            <span v-if="n.yearIndex !== 0" class="fyrt__badge-unit">年目</span>
          </span>
        </span>
        <span class="fyrt__caption font-jp">{{ caption(n.work) }}</span>
      </span>
    </span>
  </component>
</template>

<script setup lang="ts">
import { resolveComponent } from 'vue'
import type { GalleryItem } from '~~/shared/types/gallery'
import { useImagePath } from '~/composables/useImagePath'

interface RulerNode {
  work: GalleryItem
  year: number
  yearIndex: number
  rulerPos: number
}
interface Props {
  kana: string
  roman: string
  align: 'top' | 'bottom'
  startYear: number
  nodes: RulerNode[]
  ink: string
  to: string
}
defineProps<Props>()

const NuxtLink = resolveComponent('NuxtLink')
const { getThumbPath, getGridImageSrcset, getGridAvifSrcset } = useImagePath()

function caption (w: GalleryItem) {
  return w.event?.name || w.title || '—'
}
function alt (w: GalleryItem) {
  return w.event?.name || w.title || 'Featured work'
}
</script>

<style scoped>
.fyrt {
  position: relative;
  display: block;
  text-decoration: none;
  color: inherit;
  outline: none;
}
.fyrt:focus-visible { outline: 2px solid var(--ink); outline-offset: 6px; }

/* 軌頭 */
.fyrt__head {
  display: flex;
  align-items: baseline;
  gap: 0.85rem;
  margin-bottom: 0.85rem;
}
.fyrt--bottom .fyrt__head { margin-top: 0.85rem; margin-bottom: 0; }
.fyrt__kana {
  font-size: 1.25rem;
  font-weight: 200;
  letter-spacing: 0.35em;
  color: var(--fg-2);
  line-height: 1;
}
.fyrt__roman {
  font-size: 0.58rem;
  letter-spacing: 0.42em;
  text-transform: uppercase;
  color: var(--fg-muted);
  white-space: nowrap;
}
.fyrt__rule { flex: 1; height: 1px; background: color-mix(in srgb, var(--ink) 40%, transparent); }
.fyrt__start {
  font-size: 0.62rem;
  letter-spacing: 0.16em;
  color: var(--ink);
  font-weight: 500;
  white-space: nowrap;
}

/* 節點軌（desktop = 絕對定位的時間尺） */
.fyrt__lane {
  position: relative;
  display: block;
  height: 7.5rem;
}
.fyrt__node {
  position: absolute;
  top: 0;
  width: clamp(4.5rem, 7vw, 6rem);
  /* 錨點隨 rulerPos 內縮：pos=0 → 左緣對齊原點，pos=1 → 右緣對齊尺末，
     中間線性內插，確保兩端節點不溢出尺外（--p 由 inline style 帶入 0..1）。 */
  transform: translateX(calc(var(--p, 0) * -100%));
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
/* bottom 軌的 caption 在 plate 上方（往年軸靠攏），視覺上兩軌對峙年軸 */
.fyrt--bottom .fyrt__node { flex-direction: column-reverse; }

.fyrt__plate {
  position: relative;
  display: block;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  background: var(--surface);
  box-shadow: 0 1px 0 0 var(--border);
}
.fyrt__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.86);
  transition: transform 0.7s ease, filter 0.5s ease;
}
.fyrt:hover .fyrt__img,
.fyrt:focus-visible .fyrt__img { filter: saturate(1); transform: scale(1.04); }

/* 年差角標：左上小印，用軌墨色描邊不填色（守 stone 主軸） */
.fyrt__badge {
  position: absolute;
  top: 0;
  left: 0;
  display: inline-flex;
  align-items: baseline;
  gap: 0.08em;
  padding: 0.2rem 0.4rem;
  background: var(--bg);
  border-bottom: 1px solid color-mix(in srgb, var(--ink) 55%, transparent);
  border-right: 1px solid color-mix(in srgb, var(--ink) 55%, transparent);
  line-height: 1;
}
.fyrt__badge-n {
  font-size: 0.85rem;
  font-weight: 400;
  color: var(--ink);
  letter-spacing: 0;
}
.fyrt__badge-unit {
  font-size: 0.5rem;
  letter-spacing: 0.1em;
  color: var(--fg-muted);
}

.fyrt__caption {
  font-size: 0.58rem;
  letter-spacing: 0.1em;
  line-height: 1.5;
  color: var(--fg-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.4s ease;
}
.fyrt:hover .fyrt__caption,
.fyrt:focus-visible .fyrt__caption { color: var(--fg-2); }

/* ── 手機：尺崩成等距橫排（節點不再絕對定位，避免重疊／溢出） ── */
@media (max-width: 767px) {
  .fyrt__lane {
    height: auto;
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 38vw;
    gap: 0.7rem;
    overflow-x: auto;
    padding-bottom: 0.4rem;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
  }
  .fyrt__node {
    position: static;
    width: auto;
    transform: none;
    scroll-snap-align: start;
  }
  .fyrt__caption { font-size: 0.55rem; }
}

@media (prefers-reduced-motion: reduce) {
  .fyrt__img, .fyrt__caption { transition: none; }
}
</style>
